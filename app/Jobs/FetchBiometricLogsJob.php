<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Rats\Zkteco\Lib\ZKTeco;
use App\Models\BiometricDevice;
use App\Http\Controllers\BiometricController;
use Exception;

class FetchBiometricLogsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The biometric device instance.
     *
     * @var BiometricDevice
     */
    protected $device;

    /**
     * Maximum job execution time in seconds.
     *
     * @var int
     */
    public $timeout = 3600; // 1 hour max execution time

    /**
     * Number of times to attempt the job.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Create a new job instance.
     *
     * @param BiometricDevice $device
     * @return void
     */
    public function __construct(BiometricDevice $device)
    {
        $this->device = $device;
    }

    /**
     * Execute the job.
     *
     * @return void
     * @throws Exception
     */
    public function handle()
    {
        // Increase memory limit and execution time for this job
        ini_set('memory_limit', '1024M');
        set_time_limit(0);

        try {
            // Create ZKTeco instance
            $zk = new ZKTeco($this->device->ip_address, $this->device->port);
            
            // Try to connect 
            if (!$zk->connect()) {
                Log::error('Failed to connect to the device', [
                    'device_name' => $this->device->name,
                    'ip' => $this->device->ip_address,
                    'port' => $this->device->port
                ]);
                
                throw new Exception('Failed to connect to the device');
            }
            
            Log::info('Successfully connected to device, retrieving attendance data');
            
            // Get attendance logs
            $logs = $zk->getAttendance();
            
            // Disconnect from device
            $zk->disconnect();
            
            // Process logs in smaller chunks to prevent memory issues
            $chunks = array_chunk($logs, 500); // Process 500 logs at a time
            
            foreach ($chunks as $chunk) {
                // Save logs in chunks
                $this->saveBiometricLogsChunk($chunk, $this->device->id);
            }
            
            // Save logs to JSON file
            $this->saveLogsToJsonFile($logs, $this->device);
            
            // Log successful processing
            Log::info('Biometric logs processed successfully', [
                'device_id' => $this->device->id,
                'total_logs' => count($logs)
            ]);
        } catch (Exception $e) {
            // Log detailed error
            Log::error('Comprehensive error fetching device logs', [
                'error_message' => $e->getMessage(),
                'error_trace' => $e->getTraceAsString(),
                'device_id' => $this->device->id
            ]);
            
            // Throw exception to trigger job failure
            throw $e;
        }
    }

    /**
     * Process logs in smaller chunks to prevent memory issues
     *
     * @param array $logs
     * @param int $deviceId
     * @return void
     */
    private function saveBiometricLogsChunk($logs, $deviceId)
    {
        // Use a separate method to process logs in chunks
        // This prevents memory overflow and allows for more granular processing
        $saveResult = app(BiometricController::class)->saveBiometricLogs($logs, $deviceId);
        
        // Log chunk processing results
        Log::info('Processed log chunk', [
            'processed_count' => $saveResult['processed_count'],
            'skipped_count' => $saveResult['skipped_count']
        ]);
    }

    /**
     * Save logs to JSON file
     *
     * @param array $logs
     * @param BiometricDevice $device
     * @return void
     */
    private function saveLogsToJsonFile($logs, $device)
    {
        return app(BiometricController::class)->saveLogsToJsonFile($logs, $device);
    }

    /**
     * Handle a job failure.
     *
     * @param Exception $exception
     * @return void
     */
    public function failed(Exception $exception)
    {
        Log::error('Biometric log fetch job failed', [
            'error_message' => $exception->getMessage(),
            'device_id' => $this->device->id
        ]);
    }
}