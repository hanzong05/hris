import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Sidebar from '@/Components/Sidebar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Search, 
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    CheckCircle,
    XCircle,
    Clock,
    Check,
    UserCheck,
    UserX,
    UserPlus,
    User
} from 'lucide-react';
import { debounce } from 'lodash';
import axios from 'axios';
import Modal from '@/Components/Modal';
import ConfirmModal from '@/Components/ConfirmModal';

// Toast Component
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        
        return () => clearTimeout(timer);
    }, [onClose]);
    
    const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
    const textColor = type === 'success' ? 'text-green-700' : 'text-red-700';
    const icon = type === 'success' ? <Check className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
    
    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 mb-4 rounded-lg shadow-md border ${bgColor}`} role="alert">
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
                {icon}
            </div>
            <div className={`ml-3 text-sm font-normal ${textColor}`}>{message}</div>
            <button 
                type="button" 
                className={`ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 ${textColor} hover:bg-gray-100`} 
                onClick={onClose}
                aria-label="Close"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
    if (status === 'Active') {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
            </span>
        );
    } else if (status === 'Inactive') {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <XCircle className="w-3 h-3 mr-1" />
                Inactive
            </span>
        );
    } else if (status === 'On Leave') {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Clock className="w-3 h-3 mr-1" />
                On Leave
            </span>
        );
    } else {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <XCircle className="w-3 h-3 mr-1" />
                {status || 'Unknown'}
            </span>
        );
    }
};

// Employee Modal Component
const EmployeeModal = ({ 
    isOpen, 
    onClose, 
    title, 
    employee, 
    onChange,
    onSubmit, 
    mode = 'create',
    errorMessages = {}
}) => {
    const isViewMode = mode === 'view';
    
    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button 
                        onClick={() => onClose(false)}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                            <input
                                type="text"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.idno ? 'border-red-500' : ''}`}
                                value={employee.idno || ''}
                                onChange={(e) => onChange({...employee, idno: e.target.value})}
                                disabled={isViewMode}
                            />
                            {errorMessages.idno && <p className="mt-1 text-sm text-red-600">{errorMessages.idno}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Biometric ID</label>
                            <input
                                type="text"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.bid ? 'border-red-500' : ''}`}
                                value={employee.bid || ''}
                                onChange={(e) => onChange({...employee, bid: e.target.value})}
                                disabled={isViewMode}
                            />
                            {errorMessages.bid && <p className="mt-1 text-sm text-red-600">{errorMessages.bid}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.JobStatus ? 'border-red-500' : ''}`}
                                value={employee.JobStatus || ''}
                                onChange={(e) => onChange({...employee, JobStatus: e.target.value})}
                                disabled={isViewMode}
                            >
                                <option value="">Select Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Blocked">Blocked</option>
                            </select>
                            {errorMessages.JobStatus && <p className="mt-1 text-sm text-red-600">{errorMessages.JobStatus}</p>}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                            <input
                                type="text"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.Lname ? 'border-red-500' : ''}`}
                                value={employee.Lname || ''}
                                onChange={(e) => onChange({...employee, Lname: e.target.value})}
                                required
                                disabled={isViewMode}
                            />
                            {errorMessages.Lname && <p className="mt-1 text-sm text-red-600">{errorMessages.Lname}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                            <input
                                type="text"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.Fname ? 'border-red-500' : ''}`}
                                value={employee.Fname || ''}
                                onChange={(e) => onChange({...employee, Fname: e.target.value})}
                                required
                                disabled={isViewMode}
                            />
                            {errorMessages.Fname && <p className="mt-1 text-sm text-red-600">{errorMessages.Fname}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                            <input
                                type="text"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.MName ? 'border-red-500' : ''}`}
                                value={employee.MName || ''}
                                onChange={(e) => onChange({...employee, MName: e.target.value})}
                                disabled={isViewMode}
                            />
                            {errorMessages.MName && <p className="mt-1 text-sm text-red-600">{errorMessages.MName}</p>}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department*</label>
                            <input
                                type="text"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.Department ? 'border-red-500' : ''}`}
                                value={employee.Department || ''}
                                onChange={(e) => onChange({...employee, Department: e.target.value})}
                                required
                                disabled={isViewMode}
                            />
                            {errorMessages.Department && <p className="mt-1 text-sm text-red-600">{errorMessages.Department}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Line</label>
                            <input
                                type="text"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.Line ? 'border-red-500' : ''}`}
                                value={employee.Line || ''}
                                onChange={(e) => onChange({...employee, Line: e.target.value})}
                                disabled={isViewMode}
                            />
                            {errorMessages.Line && <p className="mt-1 text-sm text-red-600">{errorMessages.Line}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title*</label>
                            <input
                                type="text"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.Jobtitle ? 'border-red-500' : ''}`}
                                value={employee.Jobtitle || ''}
                                onChange={(e) => onChange({...employee, Jobtitle: e.target.value})}
                                required
                                disabled={isViewMode}
                            />
                            {errorMessages.Jobtitle && <p className="mt-1 text-sm text-red-600">{errorMessages.Jobtitle}</p>}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                            <input
                                type="email"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.Email ? 'border-red-500' : ''}`}
                                value={employee.Email || ''}
                                onChange={(e) => onChange({...employee, Email: e.target.value})}
                                required
                                disabled={isViewMode}
                            />
                            {errorMessages.Email && <p className="mt-1 text-sm text-red-600">{errorMessages.Email}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                            <input
                                type="text"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.ContactNo ? 'border-red-500' : ''}`}
                                value={employee.ContactNo || ''}
                                onChange={(e) => onChange({...employee, ContactNo: e.target.value})}
                                disabled={isViewMode}
                            />
                            {errorMessages.ContactNo && <p className="mt-1 text-sm text-red-600">{errorMessages.ContactNo}</p>}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.Gender ? 'border-red-500' : ''}`}
                                value={employee.Gender || ''}
                                onChange={(e) => onChange({...employee, Gender: e.target.value})}
                                disabled={isViewMode}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                            {errorMessages.Gender && <p className="mt-1 text-sm text-red-600">{errorMessages.Gender}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                            <select
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.CivilStatus ? 'border-red-500' : ''}`}
                                value={employee.CivilStatus || ''}
                                onChange={(e) => onChange({...employee, CivilStatus: e.target.value})}
                                disabled={isViewMode}
                            >
                                <option value="">Select Civil Status</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                            </select>
                            {errorMessages.CivilStatus && <p className="mt-1 text-sm text-red-600">{errorMessages.CivilStatus}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                            <input
                                type="date"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.Birthdate ? 'border-red-500' : ''}`}
                                value={employee.Birthdate || ''}
                                onChange={(e) => onChange({...employee, Birthdate: e.target.value})}
                                disabled={isViewMode}
                            />
                            {errorMessages.Birthdate && <p className="mt-1 text-sm text-red-600">{errorMessages.Birthdate}</p>}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hired Date</label>
                            <input
                                type="date"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.HiredDate ? 'border-red-500' : ''}`}
                                value={employee.HiredDate || ''}
                                onChange={(e) => onChange({...employee, HiredDate: e.target.value})}
                                disabled={isViewMode}
                            />
                            {errorMessages.HiredDate && <p className="mt-1 text-sm text-red-600">{errorMessages.HiredDate}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End of Contract</label>
                            <input
                                type="date"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.EndOfContract ? 'border-red-500' : ''}`}
                                value={employee.EndOfContract || ''}
                                onChange={(e) => onChange({...employee, EndOfContract: e.target.value})}
                                disabled={isViewMode}
                            />
                            {errorMessages.EndOfContract && <p className="mt-1 text-sm text-red-600">{errorMessages.EndOfContract}</p>}
                        </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onClose(false)}
                            className="mr-2"
                        >
                            {isViewMode ? 'Close' : 'Cancel'}
                        </Button>
                        
                        {!isViewMode && (
                            <Button
                                type="submit"
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {mode === 'create' ? 'Save Employee' : 'Update Employee'}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </Modal>
    );
};

// Main Employees Component
const Employees = () => {
    // Safely get user from page props
    const { auth } = usePage().props;
    const user = auth?.user || {};
    
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Toast state
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    
    // Employee state
    const emptyEmployee = {
        idno: '',
        bid: '',
        Lname: '',
        Fname: '',
        MName: '',
        Suffix: '',
        Gender: '',
        EducationalAttainment: '',
        Degree: '',
        CivilStatus: '',
        Birthdate: '',
        ContactNo: '',
        Email: '',
        PresentAddress: '',
        PermanentAddress: '',
        EmerContactName: '',
        EmerContactNo: '',
        EmerRelationship: '',
        EmpStatus: '',
        JobStatus: 'Active',
        RankFile: '',
        Department: '',
        Line: '',
        Jobtitle: '',
        HiredDate: '',
        EndOfContract: ''
    };
    const [currentEmployee, setCurrentEmployee] = useState(emptyEmployee);
    
    // Error state
    const [errors, setErrors] = useState({});
    
    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    
    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        confirmVariant: 'destructive',
        onConfirm: () => {}
    });

    // Load data
    const loadData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/employees/list', {
                params: {
                    search: searchTerm,
                    status: statusFilter !== 'all' ? statusFilter : null
                }
            });
            
            setEmployees(response.data.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Error loading data: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount and when filters change
    useEffect(() => {
        loadData();
    }, [searchTerm, statusFilter]);

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    // Close toast notification
    const closeToast = () => {
        setToast({ ...toast, visible: false });
    };

    // Debounced search handler
    const debouncedSearch = debounce((value) => {
        setSearchTerm(value);
    }, 300);

    // Handle creating new employee
    const handleCreateClick = () => {
        setCurrentEmployee(emptyEmployee);
        setErrors({});
        setIsCreateModalOpen(true);
    };

    // Handle editing employee
    const handleEditClick = (employee) => {
        setCurrentEmployee({...employee});
        setErrors({});
        setIsEditModalOpen(true);
    };

    // Handle viewing employee
    const handleViewClick = (employee) => {
        setCurrentEmployee({...employee});
        setIsViewModalOpen(true);
    };

    // Handle creating new employee
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        
        try {
            const response = await axios.post('/employees', currentEmployee);
            
            // Update employees list
            await loadData();
            
            // Reset form and close modal
            setCurrentEmployee(emptyEmployee);
            setIsCreateModalOpen(false);
            
            showToast('Employee created successfully');
        } catch (error) {
            console.error('Error creating employee:', error);
            
            // Handle validation errors
            if (error.response?.status === 422 && error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                showToast(error.response?.data?.message || 'Error creating employee', 'error');
            }
        }
    };

    // Handle updating employee
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        
        try {
            const response = await axios.put(`/employees/${currentEmployee.id}`, currentEmployee);
            
            // Update employees list
            await loadData();
            
            // Reset form and close modal
            setCurrentEmployee(emptyEmployee);
            setIsEditModalOpen(false);
            
            showToast('Employee updated successfully');
        } catch (error) {
            console.error('Error updating employee:', error);
            
            // Handle validation errors
            if (error.response?.status === 422 && error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                showToast(error.response?.data?.message || 'Error updating employee', 'error');
            }
        }
    };

    // Handle changing employee status
    const handleStatusChange = async (employee, status) => {
        try {
            if (status === 'Active') {
                await axios.post(`/employees/${employee.id}/activate`);
            } else if (status === 'Inactive') {
                await axios.post(`/employees/${employee.id}/deactivate`);
            } else if (status === 'Blocked') {
                await axios.post(`/employees/${employee.id}/block`);
            }
            
            // Update employees list
            await loadData();
            
            showToast(`Employee status changed to ${status} successfully`);
        } catch (error) {
            console.error('Error changing employee status:', error);
            showToast(error.response?.data?.message || `Error changing employee status to ${status}`, 'error');
        }
    };

    // Handle deleting employee
    const handleDeleteClick = (employee) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Employee',
            message: `Are you sure you want to delete ${employee.Fname} ${employee.Lname}? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'destructive',
            onConfirm: async () => {
                try {
                    await axios.delete(`/employees/${employee.id}`);
                    
                    // Update employees list
                    await loadData();
                    
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showToast('Employee deleted successfully');
                } catch (error) {
                    console.error('Error deleting employee:', error);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showToast(error.response?.data?.message || 'Error deleting employee', 'error');
                }
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Employees" />
            <div className="flex min-h-screen bg-gray-50/50">
                <Sidebar />
                <div className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Toast Notification */}
                        {toast.visible && (
                            <Toast 
                                message={toast.message}
                                type={toast.type}
                                onClose={closeToast}
                            />
                        )}

                        {/* Header Section */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                    Employee Management
                                </h1>
                                <p className="text-gray-600">
                                    Manage your company's employee records.
                                </p>
                            </div>
                            <Button
                                onClick={handleCreateClick}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center"
                            >
                                <UserPlus className="w-5 h-5 mr-2" />
                                Add Employee
                            </Button>
                        </div>

                        {/* Filters Section */}
                        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Search */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="Search by name, ID, or department..."
                                            onChange={(e) => debouncedSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="On Leave">On Leave</option>
                                        <option value="Blocked">Blocked</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Employees Table */}
                        <div className="bg-white shadow-md rounded-lg overflow-hidden">
                            {/* Table header */}
                            <div className="grid grid-cols-7 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="px-6 py-3 col-span-1">Actions</div>
                                <div className="px-6 py-3 col-span-1">Status</div>
                                <div className="px-6 py-3 col-span-1">ID</div>
                                <div className="px-6 py-3 col-span-2">Employee</div>
                                <div className="px-6 py-3 col-span-1">Department</div>
                                <div className="px-6 py-3 col-span-1">Job Title</div>
                            </div>

                            {/* Table Body - Loading State */}
                            {loading && (
                                <div className="py-16 text-center text-gray-500">
                                    Loading...
                                </div>
                            )}

                            {/* Table Body - No Results */}
                            {!loading && employees.length === 0 && (
                                <div className="py-16 text-center text-gray-500">
                                    {searchTerm || statusFilter !== 'all'
                                        ? 'No employees found matching your filters.'
                                        : 'No employees found. Add a new employee to get started.'}
                                </div>
                            )}

                            {/* Table Body - Results */}
                            {!loading && employees.length > 0 && (
                                <div className="divide-y divide-gray-200">
                                    {employees.map((employee) => (
                                        <div 
                                            key={employee.id}
                                            className="grid grid-cols-7 items-center hover:bg-gray-50"
                                        >
                                            {/* Actions cell */}
                                            <div className="px-6 py-4 col-span-1 whitespace-nowrap">
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleViewClick(employee)}
                                                        className="text-gray-400 hover:text-gray-500"
                                                        title="View"
                                                        type="button"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleEditClick(employee)}
                                                        className="text-gray-400 hover:text-gray-500"
                                                        title="Edit"
                                                        type="button"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    
                                                    {employee.JobStatus !== 'Active' && (
                                                        <button
                                                            onClick={() => handleStatusChange(employee, 'Active')}
                                                            className="text-gray-400 hover:text-green-500"
                                                            title="Activate"
                                                            type="button"
                                                        >
                                                            <UserCheck className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    
                                                    {employee.JobStatus !== 'Inactive' && (
                                                        <button
                                                            onClick={() => handleStatusChange(employee, 'Inactive')}
                                                            className="text-gray-400 hover:text-yellow-500"
                                                            title="Deactivate"
                                                            type="button"
                                                        >
                                                            <UserX className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    
                                                    {employee.JobStatus !== 'Blocked' && (
                                                        <button
                                                            onClick={() => handleStatusChange(employee, 'Blocked')}
                                                            className="text-gray-400 hover:text-red-500"
                                                            title="Block"
                                                            type="button"
                                                        >
                                                            <XCircle className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    
                                                    <button
                                                        onClick={() => handleDeleteClick(employee)}
                                                        className="text-gray-400 hover:text-red-500"
                                                        title="Delete"
                                                        type="button"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Status cell */}
                                            <div className="px-6 py-4 col-span-1 whitespace-nowrap">
                                                <StatusBadge status={employee.JobStatus} />
                                            </div>
                                            
                                            {/* ID cell */}
                                            <div className="px-6 py-4 col-span-1 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {employee.idno || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {employee.bid ? `BID: ${employee.bid}` : ''}
                                                </div>
                                            </div>
                                            
                                            {/* Employee cell */}
                                            <div className="px-6 py-4 col-span-2 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {employee.Lname}, {employee.Fname} {employee.MName ? `${employee.MName.charAt(0)}.` : ''}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {employee.Email}
                                                </div>
                                            </div>
                                            
                                            {/* Department cell */}
                                            <div className="px-6 py-4 col-span-1 whitespace-nowrap text-sm text-gray-500">
                                                <div>{employee.Department || 'N/A'}</div>
                                                <div className="text-xs">{employee.Line || ''}</div>
                                            </div>
                                            
                                            {/* Job Title cell */}
                                            <div className="px-6 py-4 col-span-1 text-sm text-gray-500">
                                                {employee.Jobtitle || 'N/A'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Employee Modals */}
            <EmployeeModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Add New Employee"
                employee={currentEmployee}
                onChange={setCurrentEmployee}
                onSubmit={handleCreateSubmit}
                mode="create"
                errorMessages={errors}
            />

            <EmployeeModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Employee"
                employee={currentEmployee}
                onChange={setCurrentEmployee}
                onSubmit={handleUpdateSubmit}
                mode="edit"
                errorMessages={errors}
            />

            <EmployeeModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Employee Details"
                employee={currentEmployee}
                onChange={setCurrentEmployee}
                onSubmit={() => {}}
                mode="view"
                errorMessages={{}}
            />

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({...confirmModal, isOpen: false})}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                confirmVariant={confirmModal.confirmVariant}
                onConfirm={confirmModal.onConfirm}
            />
        </AuthenticatedLayout>
    );
};

export default Employees;