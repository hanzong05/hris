<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        
        // Create necessary log directories for ZKTeco libraries
        $this->createZKTecoLogDirectories();
    }
    
    /**
     * Create ZKTeco log directories to prevent errors
     */
    private function createZKTecoLogDirectories(): void
    {
        // Check and create Rats\ZKTeco logs directory
        $ratsZktecoLogsPath = base_path('vendor/rats/zkteco/src/Lib/logs');
        if (!File::exists($ratsZktecoLogsPath)) {
            try {
                File::makeDirectory($ratsZktecoLogsPath, 0755, true);
                Log::info('Created missing ZKTeco logs directory at: ' . $ratsZktecoLogsPath);
            } catch (\Exception $e) {
                Log::warning('Failed to create ZKTeco logs directory: ' . $e->getMessage());
            }
        }
        
        // Check and create App\Libraries\ZKTeco logs directory if needed
        $appZktecoLogsPath = base_path('app/Libraries/ZKTeco/logs');
        if (!File::exists($appZktecoLogsPath)) {
            try {
                File::makeDirectory($appZktecoLogsPath, 0755, true);
                Log::info('Created ZKLib logs directory at: ' . $appZktecoLogsPath);
            } catch (\Exception $e) {
                Log::warning('Failed to create ZKLib logs directory: ' . $e->getMessage());
            }
        }
    }
}