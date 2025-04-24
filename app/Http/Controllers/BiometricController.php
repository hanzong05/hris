<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB;  // Add this line
use App\Models\Employee;
use App\Models\AttendanceLog;
use App\Models\ProcessedAttendance;
use App\Models\BiometricDevice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use App\Services\ZKTecoService;
use App\Libraries\ZKTeco\ZKLib;
use Rats\Zkteco\Lib\ZKTeco; 
class BiometricController extends Controller
{
    /**
     * Display the biometric management page.
     */
    public function index()
    {
        $devices = BiometricDevice::all();
        
        return Inertia::render('Timesheet/BiometricManagement', [
            'devices' => $devices,
            'auth' => [
                'user' => auth()->user(),
            ],
        ]);
    }
    
    /**
     * Display the timesheet import page.
     */
    public function importForm()
    {
        $devices = BiometricDevice::all();
        
        return Inertia::render('Timesheet/ImportAttendance', [
            'devices' => $devices,
            'auth' => [
                'user' => auth()->user(),
            ],
        ]);
    }
    
    /**
     * Store a new biometric device.
     */
    public function storeDevice(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'ip_address' => 'required|ip',
            'port' => 'required|integer|min:1|max:65535',
            'location' => 'required|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $device = BiometricDevice::create([
                'name' => $request->name,
                'ip_address' => $request->ip_address,
                'port' => $request->port,
                'location' => $request->location,
                'model' => $request->model,
                'serial_number' => $request->serial_number,
                'last_sync' => null,
                'status' => 'active',
            ]);
            
            return redirect()->back()->with('success', 'Biometric device added successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to add biometric device: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to add device: ' . $e->getMessage());
        }
    }
    
    /**
     * Update a biometric device.
     */
    public function updateDevice(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'ip_address' => 'required|ip',
            'port' => 'required|integer|min:1|max:65535',
            'location' => 'required|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $device = BiometricDevice::findOrFail($id);
            
            $device->update([
                'name' => $request->name,
                'ip_address' => $request->ip_address,
                'port' => $request->port,
                'location' => $request->location,
                'model' => $request->model,
                'serial_number' => $request->serial_number,
                'status' => $request->status,
            ]);
            
            return redirect()->back()->with('success', 'Biometric device updated successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to update biometric device: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update device: ' . $e->getMessage());
        }
    }
    
    /**
     * Delete a biometric device.
     */
    public function deleteDevice($id)
    {
        try {
            $device = BiometricDevice::findOrFail($id);
            $device->delete();
            
            return redirect()->back()->with('success', 'Biometric device deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to delete biometric device: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete device: ' . $e->getMessage());
        }
    }
    
    /**
     * Test connection to a biometric device.
     */
   /**
 * Test connection to biometric device
 * 
 * @param \Illuminate\Http\Request $request
 * @return \Illuminate\Http\JsonResponse
 */
/**
 * Test connection to biometric device
 * 
 * @param \Illuminate\Http\Request $request
 * @return \Illuminate\Http\JsonResponse
 */
public function testConnection(Request $request)
{
    // Validate request
    $validated = $request->validate([
        'ip_address' => 'required|string',
        'port' => 'required|integer|min:1|max:65535',
    ]);

    $ip = $validated['ip_address'];
    $port = $validated['port'];
    $debugInfo = [];
    
    try {
        // Step 1: Basic network connectivity check (ping)
        $pingStart = microtime(true);
        $pingCommand = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN')
            ? "ping -n 1 -w 1000 $ip" // Windows
            : "ping -c 1 -W 1 $ip";   // Linux/MacOS

        exec($pingCommand, $pingOutput, $pingReturnCode);
        $pingEnd = microtime(true);
        $pingTime = round(($pingEnd - $pingStart) * 1000, 2);
        
        $pingResult = [
            'success' => ($pingReturnCode === 0),
            'time_ms' => $pingTime,
            'output' => implode("\n", $pingOutput)
        ];
        
        $debugInfo['ping_test'] = $pingResult;
        
        if ($pingReturnCode !== 0) {
            return response()->json([
                'success' => false,
                'message' => "Device is not reachable (ping failed)",
                'device_info' => null,
                'debug_info' => $debugInfo
            ]);
        }
        
        // Step 2: TCP port check
        $socketStart = microtime(true);
        $socket = @fsockopen($ip, $port, $errno, $errstr, 2);
        $socketEnd = microtime(true);
        $socketTime = round(($socketEnd - $socketStart) * 1000, 2);
        
        $socketResult = [
            'success' => ($socket !== false),
            'time_ms' => $socketTime,
            'error' => $socket === false ? "$errno: $errstr" : null
        ];
        
        $debugInfo['socket_test'] = $socketResult;
        
        if ($socket === false) {
            return response()->json([
                'success' => false,
                'message' => "Device is reachable but port $port is closed or filtered",
                'device_info' => null,
                'debug_info' => $debugInfo
            ]);
        }
        
        fclose($socket);
        
        // Step 3: ZKTeco protocol check - simplified
        try {
            $zkStart = microtime(true);
            $zk = new ZKTeco($ip, $port);
            $connected = $zk->connect();
            $zkEnd = microtime(true);
            $zkTime = round(($zkEnd - $zkStart) * 1000, 2);
            
            $zkResult = [
                'success' => $connected,
                'time_ms' => $zkTime
            ];
            
            $debugInfo['zk_protocol_test'] = $zkResult;
            
            if (!$connected) {
                return response()->json([
                    'success' => false,
                    'message' => "Network connection successful, but device did not respond to ZKTeco protocol",
                    'device_info' => null,
                    'debug_info' => $debugInfo
                ]);
            }
            
            // Just return success without trying to get device info
            // We can add that back once we know what methods are available
            
            // Disconnect from device
            $zk->disconnect();
            
            // Return success response
            return response()->json([
                'success' => true,
                'message' => "Successfully connected to device",
                'device_info' => null,
                'debug_info' => $debugInfo
            ]);
            
        } catch (\Exception $e) {
            $debugInfo['zk_protocol_error'] = $e->getMessage();
            
            return response()->json([
                'success' => false,
                'message' => "Network connection successful, but ZKTeco protocol error: " . $e->getMessage(),
                'device_info' => null,
                'debug_info' => $debugInfo
            ]);
        }
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => "Connection test error: " . $e->getMessage(),
            'device_info' => null,
            'debug_info' => ['exception' => $e->getMessage()]
        ]);
    }
}
    /**
     * Fetch attendance logs from a biometric device.
     */
    public function fetchLogs(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'device_id' => 'required|exists:biometric_devices,id',
        ]);
        
        try {
            // Get the device
            $device = BiometricDevice::findOrFail($validated['device_id']);
            
            Log::info('Attempting to connect to ZKTeco device', [
                'device_name' => $device->name,
                'ip' => $device->ip_address,
                'port' => $device->port
            ]);
            
            // Create ZKTeco instance
            $zk = new ZKTeco($device->ip_address, $device->port);
            
            // Try to connect 
            if (!$zk->connect()) {
                Log::error('Failed to connect to the device', [
                    'device_name' => $device->name,
                    'ip' => $device->ip_address,
                    'port' => $device->port
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to connect to the device'
                ], 400);
            }
            
            Log::info('Successfully connected to device, retrieving attendance data');
            
            // Get attendance logs
            $logs = $zk->getAttendance();
            
            // Disconnect from device
            $zk->disconnect();
            
            // Validate and save logs
            $saveResult = $this->saveBiometricLogs($logs, $device->id);
            
            return response()->json([
                'success' => true,
                'message' => 'Successfully fetched and saved logs',
                'log_summary' => $saveResult
            ]);
        } catch (\Exception $e) {
            Log::error('Comprehensive error fetching device logs', [
                'error_message' => $e->getMessage(),
                'error_trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    private function saveBiometricLogs($logs, $deviceId)
    {
        $savedLogs = [];
        $processedLogs = 0;
        $skippedLogs = 0;
        $skippedEmployees = [];
        $detailedSkippedLogs = [];
    
        if (!is_array($logs)) {
            Log::warning('Logs is not an array', ['logs' => $logs]);
            return [
                'saved_logs' => [],
                'processed_count' => 0,
                'skipped_count' => 1
            ];
        }
    
        $deviceIp = BiometricDevice::findOrFail($deviceId)->ip_address;
    
        Log::info('Total Logs to Process', [
            'log_count' => count($logs)
        ]);
    
        $groupedLogs = [];
        foreach ($logs as $log) {
            try {
                $extractedLog = $this->extractLogDetails($log);
    
                if (!$this->isValidLog($extractedLog)) {
                    Log::warning('Invalid log skipped', ['log' => $log]);
                    $skippedLogs++;
                    continue;
                }
    
                $biometricId = $extractedLog['user_id'];
                $employee = Employee::where('idno', $biometricId)->first();
    
                if (!$employee) {
                    if (!in_array($biometricId, $skippedEmployees)) {
                        $skippedEmployees[] = $biometricId;
                        $detailedSkippedLogs[] = [
                            'biometric_id' => $biometricId,
                            'timestamp' => $extractedLog['timestamp'],
                            'full_log' => $log
                        ];
                        Log::warning('Employee not found with given ID number', [
                            'idno' => $biometricId,
                            'timestamp' => $extractedLog['timestamp']
                        ]);
                    }
                    $skippedLogs++;
                    continue;
                }
    
                $timestamp = Carbon::parse($extractedLog['timestamp']);
                $date = $timestamp->format('Y-m-d');
    
                if (!isset($groupedLogs[$employee->id][$date])) {
                    $groupedLogs[$employee->id][$date] = [
                        'timestamps' => [],
                        'states' => []
                    ];
                }
    
                $groupedLogs[$employee->id][$date]['timestamps'][] = $timestamp;
                $groupedLogs[$employee->id][$date]['states'][] = $extractedLog['state'] ?? null;
            } catch (\Exception $e) {
                Log::error('Error processing individual log', [
                    'log' => $log,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $skippedLogs++;
            }
        }
    
        foreach ($groupedLogs as $employeeId => $dates) {
            foreach ($dates as $date => $logData) {
                try {
                    $timestamps = $logData['timestamps'];
                    $states = $logData['states'];
    
                    array_multisort($timestamps, SORT_ASC, $states);
    
                    $totalWorkedMinutes = 0;
                    $punchIn = null;
    
                    for ($i = 0; $i < count($timestamps); $i++) {
                        $currentTime = $timestamps[$i];
                        $currentState = $states[$i];
    
                        if ($currentState == 0) { // IN
                            $punchIn = $currentTime;
                        } elseif ($currentState == 1 && $punchIn !== null) { // OUT
                            $workedMinutes = $punchIn->diffInMinutes($currentTime);
                            $totalWorkedMinutes += $workedMinutes;
    
                            Log::info("Counted work session for employee $employeeId", [
                                'from' => $punchIn->toDateTimeString(),
                                'to' => $currentTime->toDateTimeString(),
                                'minutes' => $workedMinutes,
                            ]);
    
                            $punchIn = null;
                        }
                    }
    
                    $timeIn = $timestamps[0];
                    $timeOut = end($timestamps);
                    $hoursWorked = round($totalWorkedMinutes / 60, 2);
                    $isNightShift = $timeIn->format('Y-m-d') !== $timeOut->format('Y-m-d');
    
                    $logEntry = [
                        'employee_id' => $employeeId,
                        'attendance_date' => $date,
                        'time_in' => $timeIn,
                        'time_out' => $timeOut,
                        'hours_worked' => $hoursWorked,
                        'is_nightshift' => $isNightShift,
                        'source' => 'biometric',
                        'notes' => 'Processed with dynamic breaks',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
    
                    $existingRecord = DB::table('processed_attendances')
                        ->where('employee_id', $employeeId)
                        ->where('attendance_date', $date)
                        ->first();
    
                    if ($existingRecord) {
                        DB::table('processed_attendances')
                            ->where('id', $existingRecord->id)
                            ->update($logEntry);
                    } else {
                        DB::table('processed_attendances')->insert($logEntry);
                    }
    
                    $processedLogs++;
                    $savedLogs[] = $logEntry;
                } catch (\Exception $e) {
                    Log::error('Error processing grouped logs for employee', [
                        'employee_id' => $employeeId,
                        'date' => $date,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    $skippedLogs++;
                }
            }
        }
    
        Log::info('Biometric Logs Processing Summary', [
            'total_logs' => count($logs),
            'processed_logs' => $processedLogs,
            'skipped_logs' => $skippedLogs,
            'skipped_employees' => $skippedEmployees,
            'detailed_skipped_logs' => $detailedSkippedLogs
        ]);
    
        return [
            'saved_logs' => $savedLogs,
            'processed_count' => $processedLogs,
            'skipped_count' => $skippedLogs,
            'skipped_employees' => $skippedEmployees,
            'detailed_skipped_logs' => $detailedSkippedLogs
        ];
    }
    
    private function extractLogDetails($log)
    {
        if (is_array($log)) {
            $userId = $log['id'] ?? $log['uid'] ?? $log['user_id'] ?? null;
            $timestamp = $log['timestamp'] ?? $log['time'] ?? null;
            $state = $log['state'] ?? $log['status'] ?? null;
    
            return [
                'state' => $state,
                'user_id' => $userId,
                'timestamp' => $timestamp,
            ];
        }
    
        Log::warning('Unexpected log format', ['log' => $log]);
        return [
            'state' => null,
            'user_id' => null,
            'timestamp' => null,
        ];
    }
    
    private function isValidLog($log)
    {
        return !is_null($log['user_id']) && !is_null($log['timestamp']);
    }
    
    /**
     * Import logs from a CSV file
     */
    public function importLogsFromCSV(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt|max:10240',
            'device_id' => 'required|exists:biometric_devices,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false, 
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $file = $request->file('file');
            $deviceId = $request->input('device_id');
            
            // Read CSV file
            $csvData = array_map('str_getcsv', file($file->getRealPath()));
            
            // Remove header if exists
            $headers = array_shift($csvData);
            
            // Prepare logs for saving
            $logs = [];
            foreach ($csvData as $row) {
                $logs[] = [
                    'uid' => $row[0] ?? null,
                    'user_id' => $row[1] ?? null,
                    'timestamp' => $row[2] ?? null,
                    'state' => $row[3] ?? null,
                ];
            }
            
            // Save logs
            $saveResult = $this->saveBiometricLogs($logs, $deviceId);
            
            return response()->json([
                'success' => true,
                'message' => 'Logs imported successfully',
                'result' => $saveResult
            ]);
        } catch (\Exception $e) {
            Log::error('CSV Import Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error importing logs: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Process raw attendance logs into processed attendances.
     */
    private function processAttendanceLogs($startDate = null, $endDate = null)
    {
        try {
            // Set default date range if not provided
            if (!$startDate) {
                $startDate = Carbon::now()->subDays(7)->startOfDay();
            } else {
                $startDate = Carbon::parse($startDate)->startOfDay();
            }
            
            if (!$endDate) {
                $endDate = Carbon::now()->endOfDay();
            } else {
                $endDate = Carbon::parse($endDate)->endOfDay();
            }
            
            // Get all attendance logs within the date range
            $logs = AttendanceLog::whereBetween('timestamp', [$startDate, $endDate])
                ->orderBy('employee_id')
                ->orderBy('timestamp')
                ->get();
            
            // Group logs by employee and date
            $groupedLogs = [];
            
            foreach ($logs as $log) {
                $employeeId = $log->employee_id;
                $date = $log->timestamp->format('Y-m-d');
                
                if (!isset($groupedLogs[$employeeId])) {
                    $groupedLogs[$employeeId] = [];
                }
                
                if (!isset($groupedLogs[$employeeId][$date])) {
                    $groupedLogs[$employeeId][$date] = [];
                }
                
                $groupedLogs[$employeeId][$date][] = $log;
            }
            
            // Process each employee's logs
            foreach ($groupedLogs as $employeeId => $dates) {
                foreach ($dates as $date => $dayLogs) {
                    // Sort logs by timestamp
                    usort($dayLogs, function($a, $b) {
                        return $a->timestamp <=> $b->timestamp;
                    });
                    
                    // Get first log as time in and last log as time out
                    $timeIn = $dayLogs[0]->timestamp;
                    $timeOut = end($dayLogs)->timestamp;
                    
                    // Calculate hours worked
                    $hoursWorked = $timeIn->diffInHours($timeOut);
                    
                    // Create or update processed attendance record
                    ProcessedAttendance::updateOrCreate(
                        [
                            'employee_id' => $employeeId,
                            'attendance_date' => $date,
                        ],
                        [
                            'time_in' => $timeIn,
                            'time_out' => $timeOut,
                            'hours_worked' => $hoursWorked,
                            'status' => 'present',
                            'source' => 'biometric',
                            'remarks' => null,
                        ]
                    );
                }
            }
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to process attendance logs: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Import attendance data from CSV file.
     */
    public function importAttendance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $file = $request->file('file');
            $filePath = $file->getRealPath();
            
            // Parse CSV file
            $fileHandle = fopen($filePath, 'r');
            // Skip the header row
            $header = fgetcsv($fileHandle);
            
            $savedCount = 0;
            $errors = [];
            $line = 2; // Start from line 2 (after header)
            
            // Process each row
            while (($row = fgetcsv($fileHandle)) !== false) {
                try {
                    // Skip empty rows
                    if (count($row) < 3 || empty($row[0])) {
                        continue;
                    }
                    
                    // Expected format: [BiometricID, Name, DateTime, Status, ...]
                    $biometricId = trim($row[0]);
                    $timestamp = null;
                    
                    // Try different date formats
                    $dateTimeFormats = [
                        'Y-m-d H:i:s',
                        'm/d/Y H:i:s',
                        'd/m/Y H:i:s',
                        'Y/m/d H:i:s',
                        'd-m-Y H:i:s',
                    ];
                    
                    foreach ($dateTimeFormats as $format) {
                        try {
                            $timestamp = Carbon::createFromFormat($format, trim($row[2]));
                            break;
                        } catch (\Exception $e) {
                            continue;
                        }
                    }
                    
                    if (!$timestamp) {
                        $errors[] = "Line $line: Unable to parse date/time format: {$row[2]}";
                        $line++;
                        continue;
                    }
                    
                    // Find the employee by biometric ID
                    $employee = Employee::where('biometric_id', $biometricId)->first();
                    
                    // Skip if employee not found, but log it
                    if (!$employee) {
                        $errors[] = "Line $line: Employee with biometric ID $biometricId not found.";
                        $line++;
                        continue;
                    }
                    
                    // Check if this log already exists
                    $existingLog = AttendanceLog::where('employee_id', $employee->id)
                        ->where('timestamp', $timestamp)
                        ->where('biometric_id', $biometricId)
                        ->first();
                    
                    if (!$existingLog) {
                        // Create new attendance log
                        AttendanceLog::create([
                            'employee_id' => $employee->id,
                            'biometric_id' => $biometricId,
                            'timestamp' => $timestamp,
                            'device_id' => null, // No device ID for CSV imports
                            'status' => isset($row[3]) ? intval($row[3]) : 0,
                            'type' => isset($row[4]) ? intval($row[4]) : 0,
                        ]);
                        
                        $savedCount++;
                    }
                } catch (\Exception $e) {
                    $errors[] = "Line $line: " . $e->getMessage();
                    Log::error('Error processing CSV line: ' . $e->getMessage(), [
                        'line' => $line,
                        'row' => $row ?? 'empty',
                        'trace' => $e->getTraceAsString()
                    ]);
                }
                
                $line++;
            }
            
            fclose($fileHandle);
            
            // Process the logs into processed_attendances
            if ($savedCount > 0) {
                $this->processAttendanceLogs();
            }
            
            return redirect()->back()->with([
                'success' => "Successfully imported attendance logs. Saved $savedCount new records.",
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to import attendance file: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }
    
    /**
     * Download CSV template for attendance import.
     */
    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="attendance_import_template.csv"',
        ];
        
        $content = "BiometricID,Name,DateTime,Status,Type\n";
        $content .= "101,John Doe,2023-05-01 08:30:00,0,0\n";
        $content .= "101,John Doe,2023-05-01 17:30:00,1,0\n";
        $content .= "102,Jane Smith,2023-05-01 08:45:00,0,0\n";
        $content .= "102,Jane Smith,2023-05-01 17:15:00,1,0\n";
        
        return response($content, 200, $headers);
    }
    
    /**
     * Get attendance report data.
     */
    public function getAttendanceReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'department' => 'nullable|string',
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        try {
            $startDate = Carbon::parse($request->start_date)->startOfDay();
            $endDate = Carbon::parse($request->end_date)->endOfDay();
            
            // Build query for processed attendance
            $query = ProcessedAttendance::with('employee')
                ->whereBetween('attendance_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);
            
            // Filter by department if specified
            if ($request->has('department') && $request->department) {
                $query->whereHas('employee', function($q) use($request) {
                    $q->where('Department', $request->department);
                });
            }
            
            // Filter by employee if specified
            if ($request->has('employee_id') && $request->employee_id) {
                $query->where('employee_id', $request->employee_id);
            }
            
            // Search by employee name or ID
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->whereHas('employee', function($q) use($search) {
                    $q->where('Fname', 'like', "%{$search}%")
                      ->orWhere('Lname', 'like', "%{$search}%")
                      ->orWhere('idno', 'like', "%{$search}%");
                });
            }
            
            // Get the records and format for the response
            $records = $query->orderBy('attendance_date', 'desc')->get();
            
            $formattedRecords = $records->map(function($record) {
                return [
                    'id' => $record->id,
                    'employee_id' => $record->employee_id,
                    'employee_name' => $record->employee ? $record->employee->Fname . ' ' . $record->employee->Lname : 'Unknown',
                    'employee_idno' => $record->employee ? $record->employee->idno : 'N/A',
                    'department' => $record->employee ? $record->employee->Department : 'N/A',
                    'attendance_date' => $record->attendance_date->format('Y-m-d'),
                    'time_in' => $record->time_in ? $record->time_in->format('H:i:s') : null,
                    'time_out' => $record->time_out ? $record->time_out->format('H:i:s') : null,
                    'hours_worked' => $record->hours_worked,
                    'status' => $record->status,
                    'source' => $record->source,
                    'remarks' => $record->remarks,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $formattedRecords,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get attendance report: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Export attendance report to CSV.
     */
    public function exportAttendanceReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'department' => 'nullable|string',
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        try {
            $startDate = Carbon::parse($request->start_date)->startOfDay();
            $endDate = Carbon::parse($request->end_date)->endOfDay();
            
            // Build query for processed attendance
            $query = ProcessedAttendance::with('employee')
                ->whereBetween('attendance_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);
            
            // Filter by department if specified
            if ($request->has('department') && $request->department) {
                $query->whereHas('employee', function($q) use($request) {
                    $q->where('Department', $request->department);
                });
            }
            
            // Filter by employee if specified
            if ($request->has('employee_id') && $request->employee_id) {
                $query->where('employee_id', $request->employee_id);
            }
            
            // Search by employee name or ID
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->whereHas('employee', function($q) use($search) {
                    $q->where('Fname', 'like', "%{$search}%")
                      ->orWhere('Lname', 'like', "%{$search}%")
                      ->orWhere('idno', 'like', "%{$search}%");
                });
            }
            
            // Get the records
            $records = $query->orderBy('attendance_date', 'desc')->get();
            
            // Create CSV file
            $filename = 'attendance_report_' . $startDate->format('Y-m-d') . '_to_' . $endDate->format('Y-m-d') . '.csv';
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];
            
            $callback = function() use($records) {
                $file = fopen('php://output', 'w');
                
                // Add CSV header
                fputcsv($file, [
                    'Date', 'Employee ID', 'Employee Name', 'Department', 
                    'Time In', 'Time Out', 'Hours Worked', 'Status', 'Source', 'Remarks'
                ]);
                
                // Add data rows
                foreach ($records as $record) {
                    fputcsv($file, [
                        $record->attendance_date->format('Y-m-d'),
                        $record->employee ? $record->employee->idno : 'N/A',
                        $record->employee ? $record->employee->Fname . ' ' . $record->employee->Lname : 'Unknown',
                        $record->employee ? $record->employee->Department : 'N/A',
                        $record->time_in ? $record->time_in->format('H:i:s') : 'N/A',
                        $record->time_out ? $record->time_out->format('H:i:s') : 'N/A',
                        $record->hours_worked ?? 'N/A',
                        $record->status,
                        $record->source,
                        $record->remarks ?? '',
                    ]);
                }
                
                fclose($file);
            };
            
            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            Log::error('Failed to export attendance report: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }
    
    /**
     * Show form for manual attendance entry.
     */
    public function manualEntryForm()
    {
        $employees = Employee::select('id', 'Fname', 'Lname', 'idno', 'Department')->orderBy('Fname')->get();
        
        return Inertia::render('Timesheet/ManualAttendance', [
            'employees' => $employees,
            'auth' => [
                'user' => auth()->user(),
            ],
        ]);
    }
    
    /**
     * Store manual attendance entry.
     */
    public function storeManualEntry(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'attendance_date' => 'required|date|before_or_equal:today',
            'time_in' => 'required|date_format:H:i',
            'time_out' => 'required|date_format:H:i|after:time_in',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $date = Carbon::parse($request->attendance_date)->format('Y-m-d');
            $timeIn = Carbon::parse($date . ' ' . $request->time_in);
            $timeOut = Carbon::parse($date . ' ' . $request->time_out);
            // Calculate hours worked
            $hoursWorked = $timeIn->floatDiffInHours($timeOut);
            
            // Create or update processed attendance record
            $attendance = ProcessedAttendance::updateOrCreate(
                [
                    'employee_id' => $request->employee_id,
                    'attendance_date' => $date,
                ],
                [
                    'time_in' => $timeIn,
                    'time_out' => $timeOut,
                    'hours_worked' => $hoursWorked,
                    'status' => 'present',
                    'source' => 'manual',
                    'remarks' => $request->remarks,
                ]
            );
            
            return redirect()->back()->with('success', 'Manual attendance entry saved successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to save manual attendance entry: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }
    
    /**
     * Edit an attendance record.
     */
    public function editAttendance($id)
    {
        try {
            $attendance = ProcessedAttendance::with('employee')->findOrFail($id);
            $employees = Employee::select('id', 'Fname', 'Lname', 'idno', 'Department')->orderBy('Fname')->get();
            
            return Inertia::render('Timesheet/EditAttendance', [
                'attendance' => [
                    'id' => $attendance->id,
                    'employee_id' => $attendance->employee_id,
                    'employee_name' => $attendance->employee ? $attendance->employee->Fname . ' ' . $attendance->employee->Lname : 'Unknown',
                    'attendance_date' => $attendance->attendance_date->format('Y-m-d'),
                    'time_in' => $attendance->time_in ? $attendance->time_in->format('H:i') : null,
                    'time_out' => $attendance->time_out ? $attendance->time_out->format('H:i') : null,
                    'status' => $attendance->status,
                    'remarks' => $attendance->remarks,
                ],
                'employees' => $employees,
                'auth' => [
                    'user' => auth()->user(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to edit attendance record: ' . $e->getMessage());
            return redirect()->route('attendance.report')->with('error', 'Error: ' . $e->getMessage());
        }
    }
    
    /**
     * Update an attendance record.
     */
    public function updateAttendance(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'attendance_date' => 'required|date',
            'time_in' => 'nullable|date_format:H:i',
            'time_out' => 'nullable|date_format:H:i',
            'status' => 'required|in:present,absent,late,half_day,leave',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        try {
            $attendance = ProcessedAttendance::findOrFail($id);
            
            $date = Carbon::parse($request->attendance_date)->format('Y-m-d');
            $timeIn = $request->time_in ? Carbon::parse($date . ' ' . $request->time_in) : null;
            $timeOut = $request->time_out ? Carbon::parse($date . ' ' . $request->time_out) : null;
            
            // Calculate hours worked if both time_in and time_out are provided
            $hoursWorked = null;
            if ($timeIn && $timeOut) {
                $hoursWorked = $timeIn->floatDiffInHours($timeOut);
            }
            
            // Update attendance record
            $attendance->update([
                'employee_id' => $request->employee_id,
                'attendance_date' => $date,
                'time_in' => $timeIn,
                'time_out' => $timeOut,
                'hours_worked' => $hoursWorked,
                'status' => $request->status,
                'remarks' => $request->remarks,
            ]);
            
            return response()->json(['success' => true, 'message' => 'Attendance record updated successfully.']);
        } catch (\Exception $e) {
            Log::error('Failed to update attendance record: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Delete an attendance record.
     */
    public function deleteAttendance($id)
    {
        try {
            $attendance = ProcessedAttendance::findOrFail($id);
            $attendance->delete();
            
            return response()->json(['success' => true, 'message' => 'Attendance record deleted successfully.']);
        } catch (\Exception $e) {
            Log::error('Failed to delete attendance record: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Run diagnostic tests on a biometric device.
     */
    public function diagnosticTest(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ip_address' => 'required|ip',
            'port' => 'required|integer|min:1|max:65535',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        try {
            $results = [];
            
            // Step 1: Basic network test
            $pingResult = -1;
            if (PHP_OS === 'WINNT') {
                // Windows
                exec("ping -n 1 -w 1000 " . escapeshellarg($request->ip_address), $pingOutput, $pingResult);
            } else {
                // Linux/Unix/Mac
                exec("ping -c 1 -W 1 " . escapeshellarg($request->ip_address), $pingOutput, $pingResult);
            }
            
            $results['ping_test'] = [
                'success' => ($pingResult === 0),
                'details' => ($pingResult === 0) ? 'Device is reachable' : 'Device cannot be pinged'
            ];
            
            // Step 2: Socket test
            $socket = @fsockopen($request->ip_address, $request->port, $errno, $errstr, 5);
            $results['socket_test'] = [
                'success' => ($socket !== false),
                'details' => ($socket !== false) ? 'Port is open' : "Port connection failed: $errstr ($errno)"
            ];
            
            if ($socket !== false) {
                fclose($socket);
            }
            
            // Step 3: ZKLib test
            if ($results['socket_test']['success']) {
                try {
                    $service = new ZKTecoService($request->ip_address, $request->port);
                    $connected = $service->connect();
                    
                    $results['zklib_test'] = [
                        'success' => $connected,
                        'details' => $connected ? 'ZKLib successfully connected' : 'ZKLib connect() returned false'
                    ];
                    
                    if ($connected) {
                        // Try to get device info
                        try {
                            $deviceInfo = $service->getDeviceInfo();
                            $results['device_info'] = [
                                'success' => true,
                                'details' => $deviceInfo
                            ];
                        } catch (\Exception $e) {
                            $results['device_info'] = [
                                'success' => false,
                                'details' => 'Failed to get device info: ' . $e->getMessage()
                            ];
                        }
                        
                        // Try to get attendance logs count
                        try {
                            $logs = $service->getAttendance();
                            $results['attendance_logs'] = [
                                'success' => is_array($logs),
                                'details' => is_array($logs) ? 'Found ' . count($logs) . ' logs' : 'Failed to retrieve logs'
                            ];
                        } catch (\Exception $e) {
                            $results['attendance_logs'] = [
                                'success' => false,
                                'details' => 'Error retrieving logs: ' . $e->getMessage()
                            ];
                        }
                        
                        $service->disconnect();
                    }
                } catch (\Exception $e) {
                    $results['zklib_test'] = [
                        'success' => false,
                        'details' => 'ZKLib error: ' . $e->getMessage()
                    ];
                }
            }
            
            // Overall status
            $success = $results['ping_test']['success'] && $results['socket_test']['success'];
            if (isset($results['zklib_test'])) {
                $success = $success && $results['zklib_test']['success'];
            }
            
            return response()->json([
                'success' => $success,
                'message' => $success ? 'All tests passed' : 'Some tests failed',
                'results' => $results,
                'recommendations' => $this->getDiagnosticRecommendations($results)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Diagnostic error: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Generate recommendations based on diagnostic results.
     */
    private function getDiagnosticRecommendations($results)
    {
        $recommendations = [];
        
        if (!$results['ping_test']['success']) {
            $recommendations[] = 'Device is not reachable on the network. Check if the device is powered on, connected to the network, and has the correct IP address.';
            $recommendations[] = 'Verify network settings and check if there are any firewalls blocking ICMP (ping) packets.';
        }
        
        if ($results['ping_test']['success'] && !$results['socket_test']['success']) {
            $recommendations[] = 'Device is reachable but port is closed. Check if the device is configured to listen on the specified port.';
            $recommendations[] = 'Check if there are any firewalls blocking access to this port.';
        }
        
        if (isset($results['zklib_test']) && !$results['zklib_test']['success']) {
            $recommendations[] = 'ZKLib cannot connect to the device. This could be due to:';
            $recommendations[] = '- Incompatible device model or firmware';
            $recommendations[] = '- Device is in a locked or error state';
            $recommendations[] = '- Device requires authentication';
            $recommendations[] = 'Try power cycling the device and updating to the latest firmware.';
        }
        
        if (empty($recommendations)) {
            $recommendations[] = 'All tests passed. If you are still experiencing issues, try:';
            $recommendations[] = '- Restarting the device';
            $recommendations[] = '- Checking for firmware updates';
            $recommendations[] = '- Verifying that your ZKLib version is compatible with this device model';
        }
        
        return $recommendations;
    }
}