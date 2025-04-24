<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\BiometricDevice;
use App\Services\ZKTecoService;
use Exception;

class BiometricDeviceController extends Controller
{
    /**
     * Display a listing of the biometric devices.
     */
    public function index()
    {
        $devices = BiometricDevice::all();
        
        return inertia('Timesheet/BiometricManagement', [
            'devices' => $devices
        ]);
    }

    /**
     * Store a newly created biometric device.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ip_address' => 'required|string|max:45',
            'port' => 'required|integer',
            'location' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        try {
            $device = BiometricDevice::create($validated);
            
            return redirect()->route('biometric-devices.index')
                ->with('success', 'Device added successfully');
        } catch (Exception $e) {
            Log::error('Failed to create biometric device: ' . $e->getMessage());
            
            return back()->withErrors([
                'error' => 'Failed to add device. Please try again.'
            ])->withInput();
        }
    }

    /**
     * Update the specified biometric device.
     */
    public function update(Request $request, BiometricDevice $biometricDevice)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ip_address' => 'required|string|max:45',
            'port' => 'required|integer',
            'location' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        try {
            $biometricDevice->update($validated);
            
            return redirect()->route('biometric-devices.index')
                ->with('success', 'Device updated successfully');
        } catch (Exception $e) {
            Log::error('Failed to update biometric device: ' . $e->getMessage());
            
            return back()->withErrors([
                'error' => 'Failed to update device. Please try again.'
            ])->withInput();
        }
    }

    /**
     * Remove the specified biometric device.
     */
    public function destroy(BiometricDevice $biometricDevice)
    {
        try {
            $biometricDevice->delete();
            
            return redirect()->route('biometric-devices.index')
                ->with('success', 'Device deleted successfully');
        } catch (Exception $e) {
            Log::error('Failed to delete biometric device: ' . $e->getMessage());
            
            return back()->withErrors([
                'error' => 'Failed to delete device. Please try again.'
            ]);
        }
    }
    
    /**
     * Test the connection to a biometric device.
     */
    public function testConnection(Request $request)
    {
        $request->validate([
            'ip_address' => 'required|string',
            'port' => 'required|integer',
        ]);

        try {
            // Use provided credentials or defaults
            $deviceCode = $request->input('code', 137353);
            $serialNumber = $request->input('serial_number', 'CQUJ232260385');
            
            // Initialize service with parameters
            $zkService = new ZKTecoService(
                $request->ip_address,
                $request->port,
                5, // Timeout
                $deviceCode,
                $serialNumber
            );
            
            // Test connection
            $result = $zkService->testConnection();
            
            return response()->json($result);
        } catch (Exception $e) {
            Log::error('Error testing biometric device: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Run diagnostic on a biometric device.
     */
    public function diagnostic(Request $request)
    {
        $request->validate([
            'ip_address' => 'required|string',
            'port' => 'required|integer',
        ]);

        try {
            // Use provided credentials or defaults
            $deviceCode = $request->input('code', 137353);
            $serialNumber = $request->input('serial_number', 'CQUJ232260385');
            
            // Initialize service with parameters
            $zkService = new ZKTecoService(
                $request->ip_address,
                $request->port,
                5, // Timeout
                $deviceCode,
                $serialNumber
            );
            
            // Run diagnostic
            $result = $zkService->diagnostic();
            
            return response()->json($result);
        } catch (Exception $e) {
            Log::error('Error running diagnostic: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
                'results' => [
                    'connection' => [
                        'success' => false,
                        'details' => 'Connection failed: ' . $e->getMessage()
                    ]
                ],
                'recommendations' => ['Check network connectivity', 'Verify the device is powered on']
            ], 500);
        }
    }
    
    /**
     * Fetch logs from a biometric device.
     */
    public function fetchLogs(Request $request)
    {
        $request->validate([
            'device_id' => 'required|exists:biometric_devices,id',
        ]);

        try {
            // Get device details
            $device = BiometricDevice::findOrFail($request->device_id);
            
            // Initialize service with device parameters
            $zkService = new ZKTecoService(
                $device->ip_address,
                $device->port,
                10, // Longer timeout for log fetching
                $device->code ?? 137353,
                $device->serial_number ?? 'CQUJ232260385'
            );
            
            // Fetch logs
            $result = $zkService->fetchLogs($device->id);
            
            // Update last sync timestamp if successful
            if ($result['success']) {
                $device->last_sync = now();
                $device->save();
            }
            
            return response()->json($result);
        } catch (Exception $e) {
            Log::error('Error fetching logs: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
                'saved_count' => 0,
                'errors' => [$e->getMessage()]
            ], 500);
        }
    }
}