import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Sidebar from '@/Components/Sidebar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Modal from '@/Components/Modal';
import ConfirmModal from '@/Components/ConfirmModal';

import { 
    Search, 
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    ToggleLeft,
    ToggleRight,
    CheckCircle,
    User,
    Upload,
    Briefcase,
    Mail,
    Phone,
    Globe,
    Linkedin,
    BookOpen,
    Award
} from 'lucide-react';
import { debounce } from 'lodash';
import axios from 'axios';

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
    const icon = type === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />;
    
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

// Enhanced TrainerModal Component with improved validation feedback
const TrainerModal = ({ 
    isOpen, 
    onClose, 
    title, 
    trainer,
    employees,
    onChange, 
    onSubmit,
    onFileChange,
    mode = 'create',
    errorMessages = {}
}) => {
    const isViewMode = mode === 'view';
    
    // State for file preview
    const [filePreview, setFilePreview] = useState(null);
    
    // Reset file preview when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            if (trainer.photo_path && !filePreview) {
                // Make sure to handle both relative and absolute paths
                const photoPath = trainer.photo_path.startsWith('http') 
                    ? trainer.photo_path 
                    : `/storage/${trainer.photo_path}`;
                setFilePreview(photoPath);
            }
        } else {
            setFilePreview(null);
        }
    }, [isOpen, trainer.photo_path, filePreview]);
    
    // Handle file input change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('File size should not exceed 2MB.');
                e.target.value = null;
                return;
            }
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                alert('Only JPG, PNG, and GIF files are allowed.');
                e.target.value = null;
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result);
            };
            reader.readAsDataURL(file);
            onFileChange(file);
        }
    };

    // Helper function to determine status badge color
    const getStatusColor = () => {
        if (trainer.is_active) {
            return 'bg-green-100 text-green-800 border-green-200';
        }
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Helper function to determine trainer type badge color
    const getTypeColor = () => {
        if (trainer.is_external) {
            return 'bg-purple-100 text-purple-800 border-purple-200';
        }
        return 'bg-blue-100 text-blue-800 border-blue-200';
    };

    // Helper to determine if a field is required
    const isFieldRequired = (fieldName) => {
        if (fieldName === 'name') return true;
        if (fieldName === 'employee_id' && !trainer.is_external) return true;
        return false;
    };
    
    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="4xl">
            <div className="p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">{title}</h2>
                        <button 
                            onClick={() => onClose(false)}
                            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors duration-200"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    
                    {/* Status Badges */}
                    <div className="flex gap-2 mt-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getTypeColor()}`}>
                            {trainer.is_external ? 'External' : 'Internal'}
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor()}`}>
                            {trainer.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
                
                <form onSubmit={onSubmit} className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name {isFieldRequired('name') && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''} ${errorMessages.name ? 'border-red-500' : 'border-gray-300'}`}
                                        value={trainer.name || ''}
                                        onChange={(e) => onChange({...trainer, name: e.target.value})}
                                        placeholder="e.g. John Smith"
                                        required={isFieldRequired('name')}
                                        disabled={isViewMode}
                                    />
                                    {errorMessages.name && <p className="mt-1 text-sm text-red-600">{errorMessages.name}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                                    <select
                                        className={`w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''} border-gray-300`}
                                        value={trainer.is_external ? "true" : "false"}
                                        onChange={(e) => onChange({...trainer, is_external: e.target.value === "true"})}
                                        disabled={isViewMode}
                                    >
                                        <option value="false">Internal</option>
                                        <option value="true">External</option>
                                    </select>
                                </div>
                            </div>

                            {/* Show employee selection for internal trainers */}
                            {trainer.is_external === false && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Employee {isFieldRequired('employee_id') && <span className="text-red-500">*</span>}
                                    </label>
                                    <select
                                        className={`w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''} ${errorMessages.employee_id ? 'border-red-500' : 'border-gray-300'}`}
                                        value={trainer.employee_id || ''}
                                        onChange={(e) => onChange({...trainer, employee_id: e.target.value})}
                                        required={isFieldRequired('employee_id')}
                                        disabled={isViewMode}
                                    >
                                        <option value="">Select Employee</option>
                                        {Array.isArray(employees) && employees.length > 0 ? (
                                            employees.map(employee => (
                                                <option key={employee.id} value={employee.id}>
                                                    {employee.Lname}, {employee.Fname} {employee.idno ? `(${employee.idno})` : ''}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled value="">No employees available</option>
                                        )}
                                    </select>
                                    {errorMessages.employee_id && <p className="mt-1 text-sm text-red-600">{errorMessages.employee_id}</p>}
                                </div>
                            )}
                            
                            {/* Other fields remain the same... */}
                            
                        </div>
                        
                        {/* Right Column - Photo & Status */}
                        <div>
                            {/* Photo Upload/Preview Card */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                                <h3 className="font-medium text-gray-900 mb-3">Profile Photo</h3>
                                
                                {/* Photo Preview */}
                                {filePreview ? (
                                    <div className="mb-4">
                                        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                                            <img
                                                src={filePreview}
                                                alt="Trainer Photo Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            {!isViewMode && (
                                                <button
                                                    type="button"
                                                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                                                    onClick={() => {
                                                        setFilePreview(null);
                                                        if (trainer.photo_path) {
                                                            onChange({...trainer, photo_path: null});
                                                        }
                                                    }}
                                                >
                                                    <X className="h-4 w-4 text-gray-500" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                    {!isViewMode && (
                                        <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-gray-300 border-dashed cursor-pointer hover:bg-gray-50">
                                            <div className="flex flex-col items-center justify-center">
                                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                <p className="mb-2 text-sm text-gray-500">
                                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                                            </div>
                                            <input 
                                                type="file" 
                                                className="hidden"
                                                onChange={handleFileChange}
                                                accept="image/jpeg,image/png,image/gif"
                                                disabled={isViewMode}
                                            />
                                        </label>
                                    )}
                                    </>
                                )}
                                {errorMessages.photo && <p className="mt-1 text-sm text-red-600">{errorMessages.photo}</p>}
                            </div>
                            
                            {/* Status Panel */}
                            {!isViewMode && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                    <h3 className="font-medium text-gray-900 mb-3">Status</h3>
                                    <select
                                        className="w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent border-gray-300"
                                        value={trainer.is_active ? "true" : "false"}
                                        onChange={(e) => onChange({...trainer, is_active: e.target.value === "true"})}
                                        disabled={isViewMode}
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Form Action Buttons */}
                    <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onClose(false)}
                            className="mr-3"
                        >
                            {isViewMode ? 'Close' : 'Cancel'}
                        </Button>
                        
                        {!isViewMode && (
                            <Button
                                type="submit"
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {mode === 'create' ? 'Create Trainer' : 'Update Trainer'}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </Modal>
    );
};
const Trainers = ({ auth, trainers: initialTrainers, counts, currentType }) => {
    // Safely get user from page props
    const user = auth?.user || {};
    
    const [trainers, setTrainers] = useState(initialTrainers || []);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState(currentType || 'all');
    
    // Toast state
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    
    // Show toast notification - Define this function BEFORE loadData
    const showToast = useCallback((message, type = 'success') => {
        setToast({ visible: true, message, type });
    }, []);
    
    // Close toast notification
    const closeToast = useCallback(() => {
        setToast(prevToast => ({ ...prevToast, visible: false }));
    }, []);
    
    // Modified loadData function to handle API errors more gracefully
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Try to load trainers first
            let trainersData = [];
            try {
                const trainersResponse = await axios.get('/trainers/list', {
                    params: { type: typeFilter }
                });
                trainersData = trainersResponse.data.data || [];
            } catch (error) {
                console.error('Error loading trainers:', error);
                // Continue execution to at least try loading employees
            }
            
            // Try to load employees
            let employeesData = [];
            try {
                const employeesResponse = await axios.get('/employees/list', { 
                    params: { active_only: true } 
                });
                employeesData = employeesResponse.data.data || [];
            } catch (error) {
                console.error('Error loading employees:', error);
            }
            
            // Update state with whatever data we were able to load
            setTrainers(trainersData);
            setEmployees(employeesData);
        } catch (error) {
            console.error('Error in loadData:', error);
            showToast('Error loading data. Please refresh the page.', 'error');
        } finally {
            setLoading(false);
        }
    }, [typeFilter, showToast]);
    
    // Trainer state
    const emptyTrainer = {
        name: '',
        email: '',
        phone: '',
        position: '',
        company: '',
        expertise_area: '',
        qualifications: '',
        certifications: '',
        bio: '',
        website: '',
        linkedin: '',
        is_external: false,
        is_active: true,
        employee_id: '',
        photo_path: ''
    };
    const [currentTrainer, setCurrentTrainer] = useState(emptyTrainer);
    const [trainerFile, setTrainerFile] = useState(null);
    
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

    // Load data on component mount and when filters change
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle search input change
    const handleSearchChange = (e) => {
        const value = e.target.value;
        debouncedSearch(value);
    };

    // Debounced search handler
    const debouncedSearch = debounce((value) => {
        setSearchTerm(value);
    }, 300);

    // Handle creating new trainer
    const handleCreateClick = () => {
        setCurrentTrainer(emptyTrainer);
        setTrainerFile(null);
        setErrors({});
        setIsCreateModalOpen(true);
    };

    // Handle editing trainer
    const handleEditClick = (trainer) => {
        setCurrentTrainer({...trainer});
        setTrainerFile(null);
        setErrors({});
        setIsEditModalOpen(true);
    };

    // Handle viewing trainer
    const handleViewClick = (trainer) => {
        setCurrentTrainer(trainer);
        setIsViewModalOpen(true);
    };

    // Handle file change
    const handleFileChange = (file) => {
        setTrainerFile(file);
    };

    // Helper function to validate email format
    const validateEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    // Handle creating new trainer
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        
        // Validate required fields client-side before submission
        const requiredFields = ['name'];
        if (!currentTrainer.is_external) {
            requiredFields.push('employee_id');
        }
        
        const validationErrors = {};
        requiredFields.forEach(field => {
            if (!currentTrainer[field]) {
                validationErrors[field] = `The ${field.replace('_', ' ')} field is required.`;
            }
        });
        
        // Check if email is valid
        if (currentTrainer.email && !validateEmail(currentTrainer.email)) {
            validationErrors.email = 'Please enter a valid email address.';
        }
        
        // If there are validation errors, show them and don't submit
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        const formData = new FormData();
        
        // Append trainer data to form data
        for (const key in currentTrainer) {
            if (currentTrainer[key] !== null && currentTrainer[key] !== undefined) {
                // Convert boolean values to strings to avoid issues
                if (typeof currentTrainer[key] === 'boolean') {
                    formData.append(key, currentTrainer[key] ? '1' : '0');
                } else {
                    formData.append(key, currentTrainer[key]);
                }
            }
        }
        
        // Append file if selected
        if (trainerFile) {
            formData.append('photo', trainerFile);
        }
        
        try {
            console.log('Submitting trainer data:', Object.fromEntries(formData));
            
            const response = await axios.post('/trainers', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            });
            
            // Update trainers list
            await loadData();
            
            // Reset form and close modal
            setCurrentTrainer(emptyTrainer);
            setTrainerFile(null);
            setIsCreateModalOpen(false);
            
            showToast('Trainer created successfully');
        } catch (error) {
            console.error('Error creating trainer:', error);
            
            // Handle validation errors
            if (error.response?.status === 422 && error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                showToast('Please fix the validation errors', 'error');
            } else {
                showToast(error.response?.data?.message || 'Error creating trainer', 'error');
            }
        }
    };

    // Handle updating trainer
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        
        // Validate required fields client-side
        const requiredFields = ['name'];
        if (!currentTrainer.is_external) {
            requiredFields.push('employee_id');
        }
        
        const validationErrors = {};
        requiredFields.forEach(field => {
            if (!currentTrainer[field]) {
                validationErrors[field] = `The ${field.replace('_', ' ')} field is required.`;
            }
        });
        
        // Check if email is valid
        if (currentTrainer.email && !validateEmail(currentTrainer.email)) {
            validationErrors.email = 'Please enter a valid email address.';
        }
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        const formData = new FormData();
        
        // Append trainer data to form data
        for (const key in currentTrainer) {
            if (currentTrainer[key] !== null && currentTrainer[key] !== undefined) {
                // Convert boolean values to strings
                if (typeof currentTrainer[key] === 'boolean') {
                    formData.append(key, currentTrainer[key] ? '1' : '0');
                } else {
                    formData.append(key, currentTrainer[key]);
                }
            }
        }
        
        // Append file if selected
        if (trainerFile) {
            formData.append('photo', trainerFile);
        }
        
        // Use PUT method with FormData
        formData.append('_method', 'PUT');
        
        try {
            console.log('Updating trainer data:', Object.fromEntries(formData));
            
            const response = await axios.post(`/trainers/${currentTrainer.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            });
            
            // Update trainers list
            await loadData();
            
            // Reset form and close modal
            setCurrentTrainer(emptyTrainer);
            setTrainerFile(null);
            setIsEditModalOpen(false);
            
            showToast('Trainer updated successfully');
        } catch (error) {
            console.error('Error updating trainer:', error);
            
            // Handle validation errors
            if (error.response?.status === 422 && error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                showToast('Please fix the validation errors', 'error');
            } else {
                showToast(error.response?.data?.message || 'Error updating trainer', 'error');
            }
        }
    };

    // Handle deleting trainer
    const handleDeleteClick = (trainer) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Trainer',
            message: `Are you sure you want to delete the trainer "${trainer.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'destructive',
            onConfirm: async () => {
                try {
                    await axios.delete(`/trainers/${trainer.id}`);
                    
                    // Update trainers list
                    await loadData();
                    
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showToast('Trainer deleted successfully');
                } catch (error) {
                    console.error('Error deleting trainer:', error);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showToast(error.response?.data?.message || 'Error deleting trainer', 'error');
                }
            }
        });
    };

    // Handle toggling trainer active status
    const handleToggleActive = async (trainer) => {
        try {
            await axios.patch(`/trainers/${trainer.id}/toggle-active`);
            
            // Update trainers list
            await loadData();
            
            showToast(`Trainer ${trainer.is_active ? 'deactivated' : 'activated'} successfully`);
        } catch (error) {
            console.error('Error toggling trainer status:', error);
            showToast('Error updating trainer status', 'error');
        }
    };

    // Handle reset filters
    const handleResetFilters = () => {
        setSearchTerm('');
        setTypeFilter('all');
        
        // Reset the search input field
        const searchInput = document.querySelector('input[placeholder="Search trainers..."]');
        if (searchInput) {
            searchInput.value = '';
        }
    };

    // Handle exporting trainers
    const exportTrainers = async () => {
        try {
            const response = await axios.get('/trainers/export', {
                params: { type: typeFilter },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `trainers_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            showToast('Trainers exported successfully');
        } catch (error) {
            console.error('Error exporting trainers:', error);
            showToast('Error exporting trainers', 'error');
        }
    };

    // Filter trainers by search term
    const filteredTrainers = trainers.filter(trainer => 
        trainer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.expertise_area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout>
            <Head title="Trainers" />
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
                                    Trainers
                                </h1>
                                <p className="text-gray-600">
                                    Manage internal and external training professionals.
                                </p>
                            </div>
                            <Button
                                onClick={handleCreateClick}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                New Trainer
                            </Button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="text-sm text-gray-600">Total Trainers</div>
                                <div className="text-2xl font-bold">{counts?.total || 0}</div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="text-sm text-gray-600">Internal</div>
                                <div className="text-2xl font-bold text-blue-600">{counts?.internal || 0}</div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="text-sm text-gray-600">External</div>
                                <div className="text-2xl font-bold text-purple-600">{counts?.external || 0}</div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="text-sm text-gray-600">Active</div>
                                <div className="text-2xl font-bold text-green-600">{counts?.active || 0}</div>
                            </div>
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
                                            placeholder="Search trainers..."
                                            onChange={handleSearchChange}
                                        />
                                    </div>
                                </div>
                                
                                {/* Type Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                    >
                                        <option value="all">All Trainers</option>
                                        <option value="internal">Internal</option>
                                        <option value="external">External</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="mt-4 flex justify-end">
                                <Button
                                    onClick={exportTrainers}
                                    variant="outline"
                                    className="mr-2 flex items-center"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export
                                </Button>
                                
                                {(searchTerm || typeFilter !== 'all') && (
                                    <Button
                                        onClick={handleResetFilters}
                                        variant="outline"
                                        className="text-sm"
                                    >
                                        Reset Filters
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Trainers Cards */}
                        <div className="mb-8">
                            {/* Loading State */}
                            {loading && (
                                <div className="py-16 text-center text-gray-500">
                                    Loading...
                                </div>
                            )}

                            {/* No Results */}
                            {!loading && filteredTrainers.length === 0 && (
                                <div className="py-16 text-center text-gray-500">
                                    {searchTerm || typeFilter !== 'all'
                                        ? 'No trainers found matching your filters.'
                                        : 'No trainers found. Create a new trainer to get started.'}
                                </div>
                            )}

                            {/* Trainers Grid */}
                            {!loading && filteredTrainers.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredTrainers.map(trainer => (
                                        <div 
                                            key={trainer.id}
                                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                                        >
                                            {/* Trainer Image */}
                                            <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                                                {trainer.photo_path ? (
                                                    <img 
                                                        src={`/storage/${trainer.photo_path}`}
                                                        alt={trainer.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="h-20 w-20 text-white opacity-75" />
                                                )}
                                            </div>
                                            
                                            {/* Trainer Details */}
                                            <div className="p-5">
                                                <div className="flex justify-between mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {trainer.name}
                                                    </h3>
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${trainer.is_external ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {trainer.is_external ? 'External' : 'Internal'}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                                    <Briefcase className="h-4 w-4 mr-1" />
                                                    <span>{trainer.position || 'No position'}{trainer.company ? ` at ${trainer.company}` : ''}</span>
                                                </div>
                                                
                                                {trainer.email && (
                                                    <div className="flex items-center text-sm text-gray-600 mb-2">
                                                        <Mail className="h-4 w-4 mr-1" />
                                                        <span>{trainer.email}</span>
                                                    </div>
                                                )}
                                                
                                                {trainer.phone && (
                                                    <div className="flex items-center text-sm text-gray-600 mb-2">
                                                        <Phone className="h-4 w-4 mr-1" />
                                                        <span>{trainer.phone}</span>
                                                    </div>
                                                )}
                                                
                                                {trainer.expertise_area && (
                                                    <div className="flex items-center text-sm text-gray-600 mb-4">
                                                        <BookOpen className="h-4 w-4 mr-1" />
                                                        <span>{trainer.expertise_area}</span>
                                                    </div>
                                                )}
                                                
                                                {/* Status Indicator */}
                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                                    <div className={`flex items-center text-sm ${trainer.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                                                        <div className={`w-2 h-2 rounded-full mr-2 ${trainer.is_active ? 'bg-green-600' : 'bg-gray-500'}`}></div>
                                                        {trainer.is_active ? 'Active' : 'Inactive'}
                                                    </div>
                                                    
                                                    {/* Actions */}
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleViewClick(trainer)}
                                                            className="p-1 text-gray-400 hover:text-gray-500"
                                                            title="View Details"
                                                            type="button"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        
                                                        <button
                                                            onClick={() => handleEditClick(trainer)}
                                                            className="p-1 text-gray-400 hover:text-gray-500"
                                                            title="Edit"
                                                            type="button"
                                                        >
                                                            <Edit className="h-5 w-5" />
                                                        </button>
                                                        
                                                        <button
                                                            onClick={() => handleDeleteClick(trainer)}
                                                            className="p-1 text-gray-400 hover:text-red-500"
                                                            title="Delete"
                                                            type="button"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                        
                                                        <button
                                                            onClick={() => handleToggleActive(trainer)}
                                                            className={`p-1 ${trainer.is_active ? 'text-green-400 hover:text-green-500' : 'text-gray-400 hover:text-gray-500'}`}
                                                            title={trainer.is_active ? 'Deactivate' : 'Activate'}
                                                            type="button"
                                                        >
                                                            {trainer.is_active ? 
                                                                <ToggleRight className="h-5 w-5" /> : 
                                                                <ToggleLeft className="h-5 w-5" />
                                                            }
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trainer Modals */}
            <TrainerModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Trainer"
                trainer={currentTrainer}
                employees={employees}
                onChange={setCurrentTrainer}
                onFileChange={handleFileChange}
                onSubmit={handleCreateSubmit}
                mode="create"
                errorMessages={errors}
            />

            <TrainerModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Trainer"
                trainer={currentTrainer}
                employees={employees}
                onChange={setCurrentTrainer}
                onFileChange={handleFileChange}
                onSubmit={handleUpdateSubmit}
                mode="edit"
                errorMessages={errors}
            />

            <TrainerModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="View Trainer Details"
                trainer={currentTrainer}
                employees={employees}
                onChange={setCurrentTrainer}
                onFileChange={() => {}}
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

export default Trainers;