// resources/js/Pages/Overtime/OvertimeDetailModal.jsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import OvertimeStatusBadge from './OvertimeStatusBadge';

const OvertimeDetailModal = ({ overtime, onClose, onStatusUpdate, userRoles = {} }) => {
    const [remarks, setRemarks] = useState('');
    const [processing, setProcessing] = useState(false);
    
    const handleStatusChange = (status) => {
        if (processing) return;
        
        if (status === 'rejected' && !remarks.trim()) {
            alert('Please provide remarks for rejection');
            return;
        }
        
        setProcessing(true);
        
        // Create data object with status and remarks
        const data = {
            status: status,
            remarks: remarks
        };
        
        console.log('Submitting status update:', { 
            overtimeId: overtime.id, 
            status, 
            remarks,
            currentStatus: overtime.status
        });
        
        // Call the onStatusUpdate with id and data
        if (typeof onStatusUpdate === 'function') {
            onStatusUpdate(overtime.id, data);
        } else {
            console.error('onStatusUpdate is not a function');
            alert('Error: Unable to update status. Please try again later.');
            setProcessing(false);
        }
    };
    
    // Format date safely
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'yyyy-MM-dd');
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };
    
    // Format time safely
    const formatTime = (timeString) => {
        try {
            return format(new Date(timeString), 'h:mm a');
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'Invalid time';
        }
    };
    
    // Format datetime safely
    const formatDateTime = (dateTimeString) => {
        try {
            return format(new Date(dateTimeString), 'yyyy-MM-dd h:mm a');
        } catch (error) {
            console.error('Error formatting datetime:', error);
            return 'Invalid datetime';
        }
    };
    
    // For debugging - log roles and permissions
    console.log('User roles in modal:', userRoles);
    console.log('Overtime status:', overtime.status);
    console.log('Department match:', userRoles.managedDepartments, overtime.employee?.Department);
    
    // Determine if user can approve at department level
    const canApproveDept = (
        userRoles.isSuperAdmin || 
        (userRoles.isDepartmentManager && 
         overtime.status === 'pending' &&
         (overtime.dept_manager_id === userRoles.userId || 
          (userRoles.managedDepartments && 
           overtime.employee && 
           userRoles.managedDepartments.includes(overtime.employee.Department))
         )
        )
    );
    
    // Determine if user can approve at HRD level
    const canApproveHrd = 
        userRoles.isSuperAdmin || 
        (userRoles.isHrdManager && 
         overtime.status === 'manager_approved');

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Overtime Details #{overtime.id}
                                </h3>
                                
                                <div className="mt-4 bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6 rounded-md">
                                    <div className="text-sm font-medium text-gray-500">Employee ID</div>
                                    <div className="mt-1 text-sm text-gray-900 sm:mt-0">
                                        {overtime.employee?.idno || 'N/A'}
                                    </div>
                                    
                                    <div className="text-sm font-medium text-gray-500">Employee Name</div>
                                    <div className="mt-1 text-sm text-gray-900 sm:mt-0">
                                        {overtime.employee ? 
                                            `${overtime.employee.Lname}, ${overtime.employee.Fname} ${overtime.employee.MName || ''}` 
                                            : 'N/A'}
                                    </div>
                                    
                                    <div className="text-sm font-medium text-gray-500">Department</div>
                                    <div className="mt-1 text-sm text-gray-900 sm:mt-0">
                                        {overtime.employee?.Department || 'N/A'}
                                    </div>
                                    
                                    <div className="text-sm font-medium text-gray-500">Job Title</div>
                                    <div className="mt-1 text-sm text-gray-900 sm:mt-0">
                                        {overtime.employee?.Jobtitle || 'N/A'}
                                    </div>
                                </div>
                                
                                <div className="mt-4 bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6 rounded-md">
                                    <div className="text-sm font-medium text-gray-500">Date</div>
                                    <div className="mt-1 text-sm text-gray-900 sm:mt-0">
                                        {overtime.date ? formatDate(overtime.date) : 'N/A'}
                                    </div>
                                    
                                    <div className="text-sm font-medium text-gray-500">Time</div>
                                    <div className="mt-1 text-sm text-gray-900 sm:mt-0">
                                        {overtime.start_time && overtime.end_time ? 
                                            `${formatTime(overtime.start_time)} - ${formatTime(overtime.end_time)}` 
                                            : 'N/A'}
                                    </div>
                                    
                                    <div className="text-sm font-medium text-gray-500">Total Hours</div>
                                    <div className="mt-1 text-sm text-gray-900 sm:mt-0">
                                        {overtime.total_hours !== undefined ? 
                                            parseFloat(overtime.total_hours).toFixed(2) 
                                            : 'N/A'}
                                    </div>
                                    
                                    <div className="text-sm font-medium text-gray-500">Rate Multiplier</div>
                                    <div className="mt-1 text-sm text-gray-900 sm:mt-0">
                                        {overtime.rate_multiplier ? `${overtime.rate_multiplier}x` : 'N/A'}
                                    </div>
                                    
                                    <div className="text-sm font-medium text-gray-500">Status</div>
                                    <div className="mt-1 text-sm text-gray-900 sm:mt-0">
                                        <OvertimeStatusBadge status={overtime.status} />
                                    </div>
                                    
                                    <div className="text-sm font-medium text-gray-500">Filed Date</div>
                                    <div className="mt-1 text-sm text-gray-900 sm:mt-0">
                                        {overtime.created_at ? 
                                            formatDateTime(overtime.created_at) 
                                            : 'N/A'}
                                    </div>
                                    
                                    <div className="text-sm font-medium text-gray-500">Filed By</div>
                                    <div className="mt-1 text-sm text-gray-900 sm:mt-0">
                                        {overtime.creator ? overtime.creator.name : 'N/A'}
                                    </div>
                                </div>
                                
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason:</label>
                                    <div className="border rounded-md p-3 bg-gray-50 text-sm text-gray-900">
                                        {overtime.reason || 'No reason provided'}
                                    </div>
                                </div>
                                
                                {/* Approval Status Section */}
                                <div className="mt-4 border-t border-gray-200 pt-4">
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Approval Status</h4>
                                    
                                    <div className="bg-gray-50 rounded-md p-4 space-y-3">
                                        {/* Department Manager Approval */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-gray-700">Department Manager Approval</div>
                                                {overtime.departmentManager && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Assigned: {overtime.departmentManager.name}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                {overtime.dept_approved_at ? (
                                                    <>
                                                        <div className="text-sm font-medium">
                                                            {overtime.status === 'rejected' && overtime.dept_approved_by ? 
                                                                <span className="text-red-600">Rejected</span> : 
                                                                <span className="text-green-600">Approved</span>
                                                            }
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {formatDateTime(overtime.dept_approved_at)}
                                                            {overtime.departmentApprover && (
                                                                <span> by {overtime.departmentApprover.name}</span>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-yellow-600">Pending</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Department Remarks */}
                                        {overtime.dept_remarks && (
                                            <div className="border border-gray-200 rounded p-2 text-sm text-gray-700 bg-white">
                                                <span className="font-medium">Remarks:</span> {overtime.dept_remarks}
                                            </div>
                                        )}
                                        
                                        {/* HRD Final Approval */}
                                        <div className="flex items-start justify-between mt-4 pt-3 border-t border-gray-200">
                                            <div>
                                                <div className="text-sm font-medium text-gray-700">HRD Final Approval</div>
                                            </div>
                                            <div className="text-right">
                                                {overtime.status === 'manager_approved' ? (
                                                    <span className="text-sm text-yellow-600">Pending</span>
                                                ) : overtime.hrd_approved_at ? (
                                                    <>
                                                        <div className="text-sm font-medium">
                                                            {overtime.status === 'rejected' && overtime.hrd_approved_by ? 
                                                                <span className="text-red-600">Rejected</span> : 
                                                                <span className="text-green-600">Approved</span>
                                                            }
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {formatDateTime(overtime.hrd_approved_at)}
                                                            {overtime.hrdApprover && (
                                                                <span> by {overtime.hrdApprover.name}</span>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-gray-400">Awaiting Dept. Approval</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* HRD Remarks */}
                                        {overtime.hrd_remarks && (
                                            <div className="border border-gray-200 rounded p-2 text-sm text-gray-700 bg-white">
                                                <span className="font-medium">Remarks:</span> {overtime.hrd_remarks}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Department Manager Approval Form */}
                                {canApproveDept && (
                                    <div className="mt-6 border-t border-gray-200 pt-4">
                                        <h4 className="text-md font-medium text-gray-900 mb-3">Department Manager Decision</h4>
                                        
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Remarks (required for rejection)
                                            </label>
                                            <textarea
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                rows={3}
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder="Enter any comments or reasons for approval/rejection"
                                            ></textarea>
                                        </div>
                                        
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                onClick={() => handleStatusChange('manager_approved')}
                                                disabled={processing}
                                            >
                                                {processing ? 'Processing...' : 'Approve (Dept. Level)'}
                                            </button>
                                            <button
                                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                onClick={() => handleStatusChange('rejected')}
                                                disabled={processing}
                                            >
                                                {processing ? 'Processing...' : 'Reject'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {/* HRD Manager Approval Form */}
                                {canApproveHrd && (
                                    <div className="mt-6 border-t border-gray-200 pt-4">
                                        <h4 className="text-md font-medium text-gray-900 mb-3">HRD Manager Final Decision</h4>
                                        
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Remarks (required for rejection)
                                            </label>
                                            <textarea
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                rows={3}
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder="Enter any comments or reasons for approval/rejection"
                                            ></textarea>
                                        </div>
                                        
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                onClick={() => handleStatusChange('approved')}
                                                disabled={processing}
                                            >
                                                {processing ? 'Processing...' : 'Final Approve'}
                                            </button>
                                            <button
                                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                onClick={() => handleStatusChange('rejected')}
                                                disabled={processing}
                                            >
                                                {processing ? 'Processing...' : 'Reject'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button 
                            type="button" 
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OvertimeDetailModal;