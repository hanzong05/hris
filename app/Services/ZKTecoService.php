<?php

namespace App\Services;

use App\Libraries\ZKTeco\ZKLib;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;

class ZKTecoService
{
    private $ip;
    private $port;
    private $zk;
    private $connected = false;
    
    public function __construct($ip, $port = 4370)
    {
        // Create log directories first to prevent errors
        $this->createZKTecoLogDirectories();
        
        $this->ip = $ip;
        $this->port = $port;
        $this->zk = new ZKLib($ip, $port);
    }
    
    /**
     * Create necessary log directories for ZKTeco library
     */
    private function createZKTecoLogDirectories(): void
    {
        // Check and create Rats\ZKTeco logs directory if it's used
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
    
    public function getZk()
    {
        return $this->zk;
    }
    
    public function connect($serialNumber = null, $devicePin = null)
    {
        try {
            // Set a generous timeout for slower devices
            $this->zk->setTimeout(15, 1000000);
            
            Log::info("Attempting connection to ZKTeco device", [
                'ip' => $this->ip,
                'port' => $this->port,
                'serialNumber' => $serialNumber  // Log for debugging
            ]);
            
            // Create a new instance to ensure clean connection
            $this->zk = new ZKLib($this->ip, $this->port, 'UDP');
            
            try {
                $connected = $this->zk->connect();
                
                // Additional authentication steps
                if ($connected && $serialNumber) {
                    try {
                        // Set serial number and device PIN if provided
                        $this->zk->setDeviceSerialNumber($serialNumber);
                        
                        if ($devicePin) {
                            $this->zk->setDevicePin($devicePin);
                        }
                    } catch (\Exception $authError) {
                        Log::warning("Authentication setup failed", [
                            'error' => $authError->getMessage()
                        ]);
                    }
                }
                
                if ($connected) {
                    Log::info("Connection successful", [
                        'ip' => $this->ip,
                        'port' => $this->port
                    ]);
                    $this->connected = true;
                    
                    // Enable the device immediately after connecting
                    try {
                        $this->zk->enableDevice();
                    } catch (\Exception $e) {
                        Log::warning("EnableDevice command failed, but continuing", [
                            'error' => $e->getMessage()
                        ]);
                    }
                    
                    return true;
                }
            } catch (\Exception $e) {
                Log::warning("UDP connection attempt failed", [
                    'error' => $e->getMessage()
                ]);
            }
            
            // Fallback to TCP if UDP fails
            $this->zk = new ZKLib($this->ip, $this->port, 'TCP');
            
            try {
                $connected = $this->zk->connect();
                
                // Repeat authentication for TCP connection
                if ($connected && $serialNumber) {
                    try {
                        $this->zk->setDeviceSerialNumber($serialNumber);
                        
                        if ($devicePin) {
                            $this->zk->setDevicePin($devicePin);
                        }
                    } catch (\Exception $authError) {
                        Log::warning("TCP Authentication setup failed", [
                            'error' => $authError->getMessage()
                        ]);
                    }
                }
                
                if ($connected) {
                    $this->connected = true;
                    return true;
                }
            } catch (\Exception $e) {
                Log::error("Both UDP and TCP connection attempts failed", [
                    'error' => $e->getMessage()
                ]);
            }
            
            return false;
        } catch (\Exception $e) {
            Log::error("ZKTeco Connection Error", [
                'message' => $e->getMessage(),
                'ip' => $this->ip,
                'port' => $this->port
            ]);
            throw $e;
        }
    }
    
    public function reconnect()
    {
        $this->disconnect();
        // Re-create the ZKLib instance to ensure a clean connection
        $this->zk = new ZKLib($this->ip, $this->port);
        return $this->connect();
    }
    
    public function getAttendance()
    {
        try {
            if (!$this->connected && !$this->connect()) {
                throw new \Exception("Cannot connect to device");
            }
            
            // Fetch attendance logs
            Log::info("Fetching attendance logs", [
                'ip' => $this->ip
            ]);
            
            $attendance = $this->zk->getAttendance();
            
            if ($attendance === false) {
                // Try to recover and retry
                Log::warning("First attempt to get attendance failed, trying recovery", [
                    'ip' => $this->ip
                ]);
                
                $this->zk->disableDevice();
                sleep(2);
                $this->zk->enableDevice();
                $attendance = $this->zk->getAttendance();
                
                if ($attendance === false) {
                    throw new \Exception("Failed to get attendance data even after recovery");
                }
            }
            
            Log::info("Successfully fetched attendance data", [
                'count' => is_array($attendance) ? count($attendance) : 0
            ]);
            
            return $attendance;
        } catch (\Exception $e) {
            Log::error("Failed to get attendance", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        } finally {
            try {
                // Always try to properly cleanup, but don't disconnect yet
                if ($this->connected) {
                    $this->zk->disableDevice();
                }
            } catch (\Exception $e) {
                Log::warning("Error during device cleanup: " . $e->getMessage());
            }
        }
    }
    
    public function clearAttendance()
    {
        try {
            if (!$this->connected && !$this->connect()) {
                throw new \Exception("Cannot connect to device");
            }
            
            $this->zk->enableDevice();
            $result = $this->zk->clearAttendance();
            
            if ($result) {
                Log::info("Successfully cleared attendance logs", [
                    'ip' => $this->ip
                ]);
            } else {
                Log::warning("Failed to clear attendance logs", [
                    'ip' => $this->ip
                ]);
            }
            
            return $result;
        } catch (\Exception $e) {
            Log::error("Error clearing attendance logs", [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
    
    public function getDeviceInfo()
    {
        try {
            if (!$this->connected && !$this->connect()) {
                throw new \Exception("Cannot connect to device");
            }
            
            return [
                'device_name' => $this->zk->getDeviceName() ?: 'N/A',
                'serial_number' => $this->zk->getSerialNumber() ?: 'N/A',
                'platform' => $this->zk->getPlatform() ?: 'N/A',
                'firmware_version' => $this->zk->getFirmwareVersion() ?: 'N/A',
                'mac_address' => $this->zk->getMac() ?: 'N/A',
                'connection_status' => 'Connected',
                'device_model' => 'ZKTeco Device',
                'ip_address' => $this->ip,
                'port' => $this->port
            ];
        } catch (\Exception $e) {
            Log::error("Error getting device info", [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
    
    public function disconnect()
    {
        try {
            if ($this->connected) {
                $this->zk->disconnect();
                $this->connected = false;
                Log::info("Successfully disconnected from device", [
                    'ip' => $this->ip
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Error during disconnect", [
                'error' => $e->getMessage()
            ]);
        }
    }
    
    public function testSocket()
    {
        // Simple socket test without ZKLib
        $socket = @fsockopen($this->ip, $this->port, $errno, $errstr, 5);
        
        if (!$socket) {
            return [
                'success' => false,
                'message' => "Socket connection failed: $errstr ($errno)"
            ];
        }
        
        fclose($socket);
        return [
            'success' => true,
            'message' => "Basic socket connection successful"
        ];
    }
    
    public function __destruct()
    {
        $this->disconnect();
    }
}