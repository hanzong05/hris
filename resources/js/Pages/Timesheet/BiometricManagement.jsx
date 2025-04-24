// resources/js/Pages/Timesheet/BiometricManagement.jsx
import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Sidebar from '@/Components/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PlusCircle, Edit, Trash2, ServerCrash, RefreshCw, HardDrive, BarChart2, CheckCircle, XCircle } from 'lucide-react';

const BiometricManagement = ({ auth, devices = [] }) => {
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDevice, setCurrentDevice] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
    const [diagnosticData, setDiagnosticData] = useState({
        ip_address: '',
        port: '4370'
    });
    const [diagnosticResults, setDiagnosticResults] = useState(null);
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    
    // Form data state
    const [formData, setFormData] = useState({
        name: '',
        ip_address: '',
        port: '4370',
        location: '',
        model: '',
        serial_number: '',
        status: 'active'
    });
    
    // Test connection form data
    const [testConnectionData, setTestConnectionData] = useState({
        ip_address: '',
        port: '4370'
    });
    
    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    
    // Handle diagnostic input changes
    const handleDiagnosticChange = (e) => {
        const { name, value } = e.target;
        setDiagnosticData({ ...diagnosticData, [name]: value });
    };
    
    // Handle test connection form input changes
    const handleTestConnectionChange = (e) => {
        const { name, value } = e.target;
        setTestConnectionData({ ...testConnectionData, [name]: value });
    };
    
    // Open modal for adding a new device
    const handleAddDevice = () => {
        setIsEditing(false);
        setCurrentDevice(null);
        setFormData({
            name: '',
            ip_address: '',
            port: '4370',
            location: '',
            model: '',
            serial_number: '',
            status: 'active'
        });
        setShowModal(true);
    };
    
    // Open modal for editing an existing device
    const handleEditDevice = (device) => {
        setIsEditing(true);
        setCurrentDevice(device);
        setFormData({
            name: device.name,
            ip_address: device.ip_address,
            port: device.port.toString(),
            location: device.location,
            model: device.model || '',
            serial_number: device.serial_number || '',
            status: device.status
        });
        setShowModal(true);
    };
    
    // Open confirmation modal for deleting a device
    const handleDeleteClick = (device) => {
        setDeviceToDelete(device);
        setShowDeleteConfirm(true);
    };
    
    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isEditing && currentDevice) {
            // Update existing device
            router.put(route('biometric-devices.update', currentDevice.id), formData, {
                onSuccess: () => {
                    setShowModal(false);
                    toast.success('Device updated successfully');
                },
                onError: (errors) => {
                    console.error(errors);
                    Object.keys(errors).forEach(key => {
                        toast.error(errors[key]);
                    });
                }
            });
        } else {
            // Create new device
            router.post(route('biometric-devices.store'), formData, {
                onSuccess: () => {
                    setShowModal(false);
                    toast.success('Device added successfully');
                },
                onError: (errors) => {
                    console.error(errors);
                    Object.keys(errors).forEach(key => {
                        toast.error(errors[key]);
                    });
                }
            });
        }
    };
    
    // Handle device deletion
    const confirmDelete = () => {
        if (deviceToDelete) {
            router.delete(route('biometric-devices.destroy', deviceToDelete.id), {
                onSuccess: () => {
                    setShowDeleteConfirm(false);
                    setDeviceToDelete(null);
                    toast.success('Device deleted successfully');
                },
                onError: (error) => {
                    console.error(error);
                    toast.error('Failed to delete device');
                }
            });
        }
    };
    
    // Open test connection modal
    const handleTestConnectionClick = (device = null) => {
        if (device) {
            setTestConnectionData({
                ip_address: device.ip_address,
                port: device.port.toString()
            });
        } else {
            setTestConnectionData({
                ip_address: '',
                port: '4370'
            });
        }
        setTestResult(null);
        setShowTestModal(true);
    };
    
    // Open diagnostic modal
    const handleDiagnosticClick = (device = null) => {
        if (device) {
            setDiagnosticData({
                ip_address: device.ip_address,
                port: device.port.toString()
            });
        } else {
            setDiagnosticData({
                ip_address: '',
                port: '4370'
            });
        }
        setDiagnosticResults(null);
        setShowDiagnosticModal(true);
    };
    
   // Test Connection Method
   const handleTestConnection = async (e) => {
    e.preventDefault();
    setIsTestingConnection(true);
    setTestResult(null);
    
    try {
        // Dynamically generate connection payload
        const connectionPayload = {
            ip_address: testConnectionData.ip_address,
            port: testConnectionData.port,
            serial_number: '', // Consider making this dynamic
            device_pin: '', // Consider making this dynamic
            verbose: true,
            connection_timeout: 10000, // 10-second timeout
            retry_attempts: 2 // Allow retry mechanism
        };

        // Perform fetch request to test connection
        const response = await fetch(route('biometric-devices.test-connection'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify(connectionPayload)
        });
        
        // Validate response content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Unexpected response type: ${contentType}`);
        }
        
        // Parse response data
        const data = await response.json();
        
        // Comprehensive logging
        console.group('Connection Test Details');
        console.log('Connection Payload:', connectionPayload);
        console.log('Server Response:', {
            success: data.success,
            message: data.message,
            deviceDetails: data.device_info
        });
        console.groupEnd();
        
        // Update test result state
        setTestResult(data);
        
        // Sophisticated success/failure handling
        if (data.success) {
            toast.success('Device Connection Verified', {
                description: 'Authentication and connectivity confirmed',
                duration: 4000
            });
        } else {
            toast.error('Connection Verification Failed', {
                description: data.message || 'Unable to establish device connection',
                duration: 4000
            });
        }
    } catch (error) {
        // Comprehensive error handling
        console.group('Connection Test Error');
        console.error('Connection Authentication Error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            connectionDetails: {
                ipAddress: testConnectionData.ip_address,
                port: testConnectionData.port
            }
        });
        console.groupEnd();
        
        // Update test result with detailed error
        setTestResult({
            success: false,
            message: `Connection Error: ${error.message}`,
            recommendations: [
                'Verify device IP and port',
                'Check network connectivity',
                'Confirm device is powered on',
                'Validate device authentication credentials'
            ],
            detailedError: {
                name: error.name,
                message: error.message,
                // Limit stack trace to first few lines
                stack: error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace available'
            }
        });
        
        // Enhanced error toast
        toast.error('Connection Test Failed', {
            description: `Detailed Error: ${error.message}\nCheck network, credentials, and device status`,
            duration: 5000
        });
    } finally {
        // Always reset testing state
        setIsTestingConnection(false);
    }
};
// Diagnostic Method
const handleRunDiagnostic = async (e) => {
    e.preventDefault();
    setIsDiagnosing(true);
    setDiagnosticResults(null);
    
    try {
        // Prepare diagnostic payload with more flexible parameters
        const diagnosticPayload = {
            ip_address: diagnosticData.ip_address,
            port: diagnosticData.port,
            verbose: true,
            diagnostic_level: 'comprehensive', // Different diagnostic levels
            timeout: 15000 // 15-second timeout for comprehensive diagnostics
        };

        // Perform diagnostic fetch request
        const response = await fetch(route('biometric-devices.diagnostic'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify(diagnosticPayload)
        });
        
        // Validate response content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Unexpected response type: ${contentType}`);
        }
        
        // Parse response data
        const data = await response.json();
        
        // Comprehensive logging
        console.group('Diagnostic Test Details');
        console.log('Diagnostic Payload:', diagnosticPayload);
        console.log('Diagnostic Response:', {
            success: data.success,
            message: data.message,
            results: data.results
        });
        console.groupEnd();
        
        // Update diagnostic results state
        setDiagnosticResults(data);
        
        // Sophisticated success/failure handling
        if (data.success) {
            toast.success('Device Diagnostic Completed', {
                description: 'Comprehensive diagnostic tests finished successfully',
                duration: 4000
            });
        } else {
            toast.error('Diagnostic Test Failed', {
                description: data.message || 'Unable to complete device diagnostic',
                duration: 4000
            });
        }
    } catch (error) {
        // Comprehensive error handling
        console.group('Diagnostic Test Error');
        console.error('Diagnostic Error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            diagnosticDetails: {
                ipAddress: diagnosticData.ip_address,
                port: diagnosticData.port
            }
        });
        console.groupEnd();
        
        // Update diagnostic results with detailed error
        setDiagnosticResults({
            success: false,
            message: `Diagnostic Error: ${error.message}`,
            recommendations: [
                'Verify device network configuration',
                'Check device power and connectivity',
                'Validate device authentication method',
                'Ensure compatible firmware version',
                'Consult device manufacturer support'
            ],
            detailedError: {
                name: error.name,
                message: error.message,
                stack: error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace available'
            }
        });
        
        // Enhanced error toast
        toast.error('Diagnostic Test Failed', {
            description: `Detailed Error: ${error.message}\nReview recommendations for troubleshooting`,
            duration: 5000
        });
    } finally {
        // Always reset diagnosing state
        setIsDiagnosing(false);
    }
};
const handleFetchLogs = (device) => {
    if (!confirm(`Are you sure you want to fetch logs from ${device.name}?`)) {
        return;
    }
    
    const toastId = toast.loading(`Connecting to ${device.name} (${device.ip_address})...`, {
        autoClose: false
    });
    
    fetch(route('biometric-devices.fetch-logs'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
            device_id: device.id
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }
        
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Extract the saved count from the log_summary
            const savedCount = data.log_summary && data.log_summary.processed_count 
                ? data.log_summary.processed_count 
                : 'No';
                
            toast.update(toastId, {
                render: `Successfully fetched logs: ${savedCount} new records saved`,
                type: 'success',
                isLoading: false,
                autoClose: 5000
            });
            
            // Log detailed summary for debugging
            console.info('Log fetch summary:', data.log_summary);
        } else {
            toast.update(toastId, {
                render: `Failed to fetch logs: ${data.message || 'Unknown error'}`,
                type: 'error',
                isLoading: false,
                autoClose: 5000
            });
        }
    })
    .catch(error => {
        console.error('Error in fetch logs process:', error);
        toast.update(toastId, {
            render: `Failed to fetch logs: ${error.message}`,
            type: 'error',
            isLoading: false,
            autoClose: 5000
        });
    });
};
    // Safely display diagnostic results - FIXED: Added null checks
    const renderDiagnosticResults = () => {
        if (!diagnosticResults || !diagnosticResults.results) {
            return null;
        }
        
        return (
            <div className="mt-4">
                <h4 className="font-medium text-gray-900">Diagnostic Results</h4>
                
                <div className="mt-2 space-y-3">
                    {Object.entries(diagnosticResults.results || {}).map(([test, result]) => (
                        <div key={test} className={`p-3 rounded-md ${
                            result.success ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                            <div className="flex items-center">
                                {result.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                                )}
                                <span className="font-medium capitalize">{test.replace('_', ' ')}</span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                                {typeof result.details === 'string' 
                                    ? result.details
                                    : test === 'device_info' && result.success && result.details
                                        ? Object.entries(result.details).map(([key, value]) => (
                                            <div key={key} className="flex justify-between mt-1">
                                                <span className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}:</span>
                                                <span className="text-xs font-medium">{value}</span>
                                            </div>
                                        ))
                                        : JSON.stringify(result.details || {})
                                }
                            </p>
                        </div>
                    ))}
                </div>
                
                {diagnosticResults.recommendations && diagnosticResults.recommendations.length > 0 && (
                    <div className="mt-4 bg-blue-50 p-3 rounded-md">
                        <h5 className="font-medium text-blue-700">Recommendations</h5>
                        <ul className="mt-2 list-disc list-inside text-sm text-blue-700 space-y-1">
                            {diagnosticResults.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };
    
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Biometric Device Management" />
            <div className="flex min-h-screen bg-gray-50/50">
                <Sidebar />
                <div className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-800">Biometric Device Management</h2>
                                    <div className="flex space-x-2">
                                        <button
                                            className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 active:bg-green-900 focus:outline-none focus:border-green-900 focus:shadow-outline-gray transition ease-in-out duration-150"
                                            onClick={() => handleTestConnectionClick()}
                                        >
                                            <ServerCrash className="w-4 h-4 mr-2" />
                                            Test Connection
                                        </button>
                                        <button
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:shadow-outline-gray transition ease-in-out duration-150"
                                            onClick={() => handleDiagnosticClick()}
                                        >
                                            <BarChart2 className="w-4 h-4 mr-2" />
                                            Run Diagnostic
                                        </button>
                                        <button
                                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:shadow-outline-gray transition ease-in-out duration-150"
                                            onClick={handleAddDevice}
                                        >
                                            <PlusCircle className="w-4 h-4 mr-2" />
                                            Add Device
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Devices Table */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Port</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sync</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {!devices || devices.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                                                        No devices found. Click "Add Device" to add a new biometric device.
                                                    </td>
                                                </tr>
                                            ) : (
                                                devices.map(device => (
                                                    <tr key={device.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {device.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {device.ip_address}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {device.port}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {device.location}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {device.last_sync ? new Date(device.last_sync).toLocaleString() : 'Never'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                device.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {device.status === 'active' ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex justify-end space-x-2">
                                                                <button
                                                                    onClick={() => handleTestConnectionClick(device)}
                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                    title="Test Connection"
                                                                >
                                                                    <ServerCrash className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDiagnosticClick(device)}
                                                                    className="text-blue-600 hover:text-blue-900"
                                                                    title="Run Diagnostic"
                                                                >
                                                                    <BarChart2 className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleFetchLogs(device)}
                                                                    className="text-green-600 hover:text-green-900"
                                                                    title="Fetch Logs"
                                                                >
                                                                    <RefreshCw className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditDevice(device)}
                                                                    className="text-blue-600 hover:text-blue-900"
                                                                    title="Edit"
                                                                >
                                                                    <Edit className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(device)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Add/Edit Device Modal */}
                    {showModal && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                                </div>
                                
                                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                                
                                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                    <form onSubmit={handleSubmit}>
                                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                            <div className="sm:flex sm:items-start">
                                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                                                    <HardDrive className="h-6 w-6 text-indigo-600" />
                                                </div>
                                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                        {isEditing ? 'Edit Device' : 'Add New Device'}
                                                    </h3>
                                                    <div className="mt-4 space-y-4">
                                                        <div>
                                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                                                Device Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="name"
                                                                id="name"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                                value={formData.name}
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </div>
                                                        
                                                        <div>
                                                            <label htmlFor="ip_address" className="block text-sm font-medium text-gray-700">
                                                                IP Address
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="ip_address"
                                                                id="ip_address"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                                value={formData.ip_address}
                                                                onChange={handleChange}
                                                                placeholder="192.168.1.100"
                                                                required
                                                            />
                                                        </div>
                                                        
                                                        <div>
                                                            <label htmlFor="port" className="block text-sm font-medium text-gray-700">
                                                                Port
                                                            </label>
                                                            <input
                                                                type="number"
                                                                name="port"
                                                                id="port"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                                value={formData.port}
                                                                onChange={handleChange}
                                                                min="1"
                                                                max="65535"
                                                                placeholder="4370"
                                                                required
                                                            />
                                                        </div>
                                                        
                                                        <div>
                                                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                                                                Location
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="location"
                                                                id="location"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                                value={formData.location}
                                                                onChange={handleChange}
                                                                placeholder="Main Office"
                                                            />
                                                        </div>
                                                        
                                                        <div>
                                                            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                                                                Model
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="model"
                                                                id="model"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                                value={formData.model}
                                                                onChange={handleChange}
                                                                placeholder="ZKTeco K40"
                                                            />
                                                        </div>
                                                        
                                                        <div>
                                                            <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700">
                                                                Serial Number
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="serial_number"
                                                                id="serial_number"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                                value={formData.serial_number}
                                                                onChange={handleChange}
                                                                placeholder="ZK12345678"
                                                            />
                                                        </div>
                                                        
                                                        <div>
                                                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                                                Status
                                                            </label>
                                                            <select
                                                                name="status"
                                                                id="status"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                                value={formData.status}
                                                                onChange={handleChange}
                                                            >
                                                                <option value="active">Active</option>
                                                                <option value="inactive">Inactive</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                            <button
                                                type="submit"
                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                            >
                                                {isEditing ? 'Update Device' : 'Add Device'}
                                            </button>
                                            <button
                                                type="button"
                                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                                onClick={() => setShowModal(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Test Connection Modal */}
                    {showTestModal && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                                </div>
                                
                                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                                
                                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                    <form onSubmit={handleTestConnection}>
                                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                            <div className="sm:flex sm:items-start">
                                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                                    <ServerCrash className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                        Test Biometric Device Connection
                                                    </h3>
                                                    <div className="mt-4 space-y-4">
                                                        <div>
                                                            <label htmlFor="test_ip_address" className="block text-sm font-medium text-gray-700">
                                                                IP Address
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="ip_address"
                                                                id="test_ip_address"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                                value={testConnectionData.ip_address}
                                                                onChange={handleTestConnectionChange}
                                                                placeholder="192.168.1.100"
                                                                required
                                                            />
                                                        </div>
                                                        
                                                        <div>
                                                            <label htmlFor="test_port" className="block text-sm font-medium text-gray-700">
                                                                Port
                                                            </label>
                                                            <input
                                                                type="number"
                                                                name="port"
                                                                id="test_port"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                                value={testConnectionData.port}
                                                                onChange={handleTestConnectionChange}
                                                                min="1"
                                                                max="65535"
                                                                placeholder="4370"
                                                                required
                                                            />
                                                        </div>
                                                        
                                                        {testResult && (
                                                            <div className={`mt-4 p-3 rounded-md ${
                                                                testResult.success ? 'bg-green-50' : 'bg-red-50'
                                                            }`}>
                                                                <div className="flex items-center">
                                                                    {testResult.success ? (
                                                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                                                    ) : (
                                                                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                                                                    )}
                                                                    <span className="font-medium">
                                                                        {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                                                                    </span>
                                                                </div>
                                                                {testResult.message && (
                                                                    <p className="mt-1 text-sm text-gray-600">
                                                                        {testResult.message}
                                                                    </p>
                                                                )}
                                                                {testResult.device_info && (
                                                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                                                        <h4 className="text-sm font-medium text-gray-700">Device Information</h4>
                                                                        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                                            {Object.entries(testResult.device_info).map(([key, value]) => (
                                                                                <div key={key}>
                                                                                    <dt className="text-gray-500 capitalize">{key.replace('_', ' ')}</dt>
                                                                                    <dd className="font-medium">{value}</dd>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                            <button
                                                type="submit"
                                                disabled={isTestingConnection}
                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                            >
                                                {isTestingConnection ? 'Testing...' : 'Test Connection'}
                                            </button>
                                            <button
                                                type="button"
                                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                                onClick={() => setShowTestModal(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Diagnostic Modal */}
                    {showDiagnosticModal && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                                </div>
                                
                                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                                
                                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                    <form onSubmit={handleRunDiagnostic}>
                                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                            <div className="sm:flex sm:items-start">
                                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                                    <BarChart2 className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                        ZKTeco Device Diagnostic
                                                    </h3>
                                                    <div className="mt-4 space-y-4">
                                                        <div>
                                                            <label htmlFor="diag_ip_address" className="block text-sm font-medium text-gray-700">
                                                                IP Address
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="ip_address"
                                                                id="diag_ip_address"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                                value={diagnosticData.ip_address}
                                                                onChange={handleDiagnosticChange}
                                                                placeholder="192.168.1.100"
                                                                required
                                                            />
                                                        </div>
                                                        
                                                        <div>
                                                            <label htmlFor="diag_port" className="block text-sm font-medium text-gray-700">
                                                                Port
                                                            </label>
                                                            <input
                                                                type="number"
                                                                name="port"
                                                                id="diag_port"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                                value={diagnosticData.port}
                                                                onChange={handleDiagnosticChange}
                                                                min="1"
                                                                max="65535"
                                                                placeholder="4370"
                                                                required
                                                            />
                                                        </div>
                                                        
                                                        {renderDiagnosticResults()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                            <button
                                                type="submit"
                                                disabled={isDiagnosing}
                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                            >
                                                {isDiagnosing ? 'Running Diagnostic...' : 'Run Diagnostic'}
                                            </button>
                                            <button
                                                type="button"
                                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                                onClick={() => setShowDiagnosticModal(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Delete Confirmation Modal */}
                    {showDeleteConfirm && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                                </div>
                                
                                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                                
                                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <div className="sm:flex sm:items-start">
                                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                                <Trash2 className="h-6 w-6 text-red-600" />
                                            </div>
                                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                    Delete Biometric Device
                                                </h3>
                                                <div className="mt-2">
                                                    <p className="text-sm text-gray-500">
                                                        Are you sure you want to delete the device "{deviceToDelete?.name}"? 
                                                        This action cannot be undone and will remove all associated data.
                                                    </p>
                                                    <div className="mt-3 bg-gray-50 p-3 rounded-md">
                                                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                            <div>
                                                                <dt className="text-gray-500">Name</dt>
                                                                <dd className="font-medium">{deviceToDelete?.name}</dd>
                                                            </div>
                                                            <div>
                                                                <dt className="text-gray-500">IP Address</dt>
                                                                <dd className="font-medium">{deviceToDelete?.ip_address}</dd>
                                                            </div>
                                                            <div>
                                                                <dt className="text-gray-500">Location</dt>
                                                                <dd className="font-medium">{deviceToDelete?.location}</dd>
                                                            </div>
                                                            <div>
                                                                <dt className="text-gray-500">Status</dt>
                                                                <dd className="font-medium">
                                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                        deviceToDelete?.status === 'active' 
                                                                            ? 'bg-green-100 text-green-800' 
                                                                            : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {deviceToDelete?.status}
                                                                    </span>
                                                                </dd>
                                                            </div>
                                                        </dl>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="button"
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                            onClick={confirmDelete}
                                        >
                                            Delete Device
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                            onClick={() => setShowDeleteConfirm(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <ToastContainer />
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default BiometricManagement;