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

// Enhanced TrainerModal Component with proper validation
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
    const [activeTab, setActiveTab] = useState('basic'); // For tab navigation
    const [validationErrors, setValidationErrors] = useState({});
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    
    // Use effect to handle incoming error messages
    useEffect(() => {
        if (Object.keys(errorMessages).length > 0) {
            setValidationErrors(errorMessages);
            setShowErrorPopup(true);
            
            // Auto-hide the popup after 5 seconds
            const timer = setTimeout(() => {
                setShowErrorPopup(false);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [errorMessages]);
    
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
            setActiveTab('basic');
            setValidationErrors({});
            setShowErrorPopup(false);
        }
    }, [isOpen, trainer.photo_path, filePreview]);
    
    // Handle file input change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (2MB)
            if (file.size > 2 * 1024 * 1024) {
                setValidationErrors({
                    ...validationErrors,
                    photo: 'File size should not exceed 2MB.'
                });
                setShowErrorPopup(true);
                e.target.value = null;
                return;
            }
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                setValidationErrors({
                    ...validationErrors,
                    photo: 'Only JPG, PNG, and GIF files are allowed.'
                });
                setShowErrorPopup(true);
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

    // Helper to determine if a field is required based on controller validation rules
    const isFieldRequired = (fieldName) => {
        switch (fieldName) {
            case 'name':
                return trainer.is_external; // Only required for external trainers
            case 'type': // is_external
                return true;
            case 'employee_id':
                return !trainer.is_external; // Required only for internal trainers
            default:
                return false;
        }
    };

    // Handle form submission with validation
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Clear previous errors
        const newErrors = {};
        
        // For external trainers, name is required
        if (trainer.is_external && (!trainer.name || trainer.name.trim() === '')) {
            newErrors.name = 'Name is required';
        }
        
        // For internal trainers, employee_id is required
        if (!trainer.is_external && (!trainer.employee_id || trainer.employee_id === '')) {
            newErrors.employee_id = 'Employee must be selected for internal trainers';
        }
        
        // Optional field validations (only if provided)
        if (trainer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trainer.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (trainer.website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(trainer.website)) {
            newErrors.website = 'Please enter a valid website URL';
        }
        
        if (trainer.phone && !/^[\d\s\+\-\(\)]{7,20}$/.test(trainer.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }
        
        // If we have errors, show them and don't submit
        if (Object.keys(newErrors).length > 0) {
            setValidationErrors(newErrors);
            setShowErrorPopup(true);
            
            // Switch to the tab with errors
            if (newErrors.name || newErrors.employee_id) {
                setActiveTab('basic');
            } else if (newErrors.email || newErrors.phone) {
                setActiveTab('contact');
            } else if (newErrors.website || newErrors.linkedin) {
                setActiveTab('online');
            } else if (newErrors.photo) {
                setActiveTab('photo');
            }
            
            return;
        }
        
        // If validation passes, submit the form
        onSubmit(e);
    };

    // Tabs for layout
    const tabs = [
        { id: 'basic', label: 'Basic Info' },
        { id: 'contact', label: 'Contact' },
        { id: 'professional', label: 'Professional' },
        { id: 'online', label: 'Online' },
        { id: 'photo', label: 'Photo' }
    ];
    
    // Error Popup Component
    const ErrorPopup = () => {
        if (!showErrorPopup) return null;
        
        return (
            <div className="fixed top-4 right-4 w-80 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg z-50 animate-fade-in-down">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                            Please fix the following errors:
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                            <ul className="list-disc pl-5 space-y-1">
                                {Object.entries(validationErrors).map(([field, error]) => (
                                    <li key={field}>
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="ml-auto pl-3">
                        <div className="-mx-1.5 -my-1.5">
                            <button
                                onClick={() => setShowErrorPopup(false)}
                                className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                type="button"
                            >
                                <span className="sr-only">Dismiss</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    // Create a CSS class for input fields with errors
    const getInputClass = (fieldName) => {
        const baseClass = "w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
        return validationErrors[fieldName]
            ? `${baseClass} border-red-500 bg-red-50`
            : `${baseClass} border-gray-300`;
    };
    
    // Add animation for popup
    const animationStyles = `
        @keyframes fadeInDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in-down {
            animation: fadeInDown 0.3s ease-out forwards;
        }
    `;
    
    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="lg">
            {/* CSS for animation */}
            <style>{animationStyles}</style>
            
            {/* Error Popup */}
            <ErrorPopup />
            
            <div className="p-0 overflow-hidden max-w-3xl mx-auto">
                {/* Header */}
                <div className="bg-indigo-600 p-4 text-white">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">{title}</h2>
                        <button 
                            onClick={() => onClose(false)}
                            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors duration-200"
                            aria-label="Close"
                            type="button"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    
                    {/* Status Badges */}
                    <div className="flex gap-2 mt-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${trainer.is_external ? 'bg-purple-500' : 'bg-blue-500'}`}>
                            {trainer.is_external ? 'External' : 'Internal'}
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${trainer.is_active ? 'bg-green-500' : 'bg-gray-500'}`}>
                            {trainer.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
                
                {/* Tab Navigation */}
                <div className="flex justify-center border-b border-gray-200">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                                activeTab === tab.id 
                                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-gray-50' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                            type="button"
                        >
                            {tab.label}
                            {/* Error indicator on tab */}
                            {Object.keys(validationErrors).some(field => {
                                if (tab.id === 'basic' && (field === 'name' || field === 'employee_id')) return true;
                                if (tab.id === 'contact' && (field === 'email' || field === 'phone')) return true;
                                if (tab.id === 'professional' && (field === 'position' || field === 'company' || field === 'expertise_area' || field === 'qualifications' || field === 'certifications')) return true;
                                if (tab.id === 'online' && (field === 'website' || field === 'linkedin' || field === 'bio')) return true;
                                if (tab.id === 'photo' && field === 'photo') return true;
                                return false;
                            }) && (
                                <span className="absolute top-2 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                            )}
                        </button>
                    ))}
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="max-w-lg mx-auto">
                        {/* Basic Information Tab */}
                        {activeTab === 'basic' && (
                            <div className="space-y-4">
                                {/* Type Selection (always shown) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type {isFieldRequired('type') && <span className="text-red-500">*</span>}
                                    </label>
                                    <select
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent border-gray-300"
                                        value={trainer.is_external ? "true" : "false"}
                                        onChange={(e) => {
                                            const isExternal = e.target.value === "true";
                                            onChange({
                                                ...trainer, 
                                                is_external: isExternal,
                                                // Clear employee_id when switching to external
                                                employee_id: isExternal ? '' : trainer.employee_id
                                            });
                                        }}
                                        disabled={isViewMode}
                                    >
                                        <option value="false">Internal</option>
                                        <option value="true">External</option>
                                    </select>
                                </div>

                                {/* Show name field only for external trainers */}
                                {trainer.is_external && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Name {isFieldRequired('name') && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            type="text"
                                            className={getInputClass('name')}
                                            value={trainer.name || ''}
                                            onChange={(e) => onChange({...trainer, name: e.target.value})}
                                            placeholder="e.g. John Smith"
                                            required={isFieldRequired('name')}
                                            disabled={isViewMode}
                                        />
                                        {validationErrors.name && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {validationErrors.name}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Show employee selection only for internal trainers */}
                                {!trainer.is_external && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Employee {isFieldRequired('employee_id') && <span className="text-red-500">*</span>}
                                        </label>
                                        <select
                                            className={getInputClass('employee_id')}
                                            value={trainer.employee_id || ''}
                                            onChange={(e) => {
                                                const employeeId = e.target.value;
                                                // Find the selected employee to auto-populate the name
                                                const selectedEmployee = employees.find(emp => emp.id.toString() === employeeId);
                                                let employeeName = '';
                                                
                                                if (selectedEmployee) {
                                                    // Format the name as needed
                                                    employeeName = `${selectedEmployee.Fname} ${selectedEmployee.Lname}`;
                                                }
                                                
                                                onChange({
                                                    ...trainer, 
                                                    employee_id: employeeId,
                                                    name: employeeName // Auto-populate name
                                                });
                                            }}
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
                                        {validationErrors.employee_id && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {validationErrors.employee_id}
                                            </p>
                                        )}
                                        
                                        {/* Display the auto-populated name for reference, but as read-only */}
                                        {trainer.name && (
                                            <div className="mt-2 text-sm text-gray-600">
                                                Selected: <span className="font-medium">{trainer.name}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Status Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <div className="relative">
                                        <select
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent border-gray-300"
                                            value={trainer.is_active ? "true" : "false"}
                                            onChange={(e) => onChange({...trainer, is_active: e.target.value === "true"})}
                                            disabled={isViewMode}
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                            {trainer.is_active ? 
                                                <div className="h-3 w-3 rounded-full bg-green-500"></div> : 
                                                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                                            }
                                        </div>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Active trainers can be assigned to training sessions.
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {/* Contact Information Tab */}
                        {activeTab === 'contact' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            className={`pl-10 ${getInputClass('email')}`}
                                            value={trainer.email || ''}
                                            onChange={(e) => onChange({...trainer, email: e.target.value})}
                                            placeholder="email@example.com"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    {validationErrors.email && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {validationErrors.email}
                                        </p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className={`pl-10 ${getInputClass('phone')}`}
                                            value={trainer.phone || ''}
                                            onChange={(e) => onChange({...trainer, phone: e.target.value})}
                                            placeholder="+63 XXX XXX XXXX"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    {validationErrors.phone && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {validationErrors.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Professional Information Tab */}
                        {activeTab === 'professional' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Position/Title</label>
                                    <input
                                        type="text"
                                        className={getInputClass('position')}
                                        value={trainer.position || ''}
                                        onChange={(e) => onChange({...trainer, position: e.target.value})}
                                        placeholder="e.g. Training Specialist"
                                        disabled={isViewMode}
                                    />
                                    {validationErrors.position && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {validationErrors.position}
                                        </p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company/Organization</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Briefcase className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className={`pl-10 ${getInputClass('company')}`}
                                            value={trainer.company || ''}
                                            onChange={(e) => onChange({...trainer, company: e.target.value})}
                                            placeholder="For external trainers"
                                            disabled={isViewMode || !trainer.is_external}
                                        />
                                    </div>
                                    {validationErrors.company && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {validationErrors.company}
                                        </p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Area of Expertise</label>
                                    <input
                                        type="text"
                                        className={getInputClass('expertise_area')}
                                        value={trainer.expertise_area || ''}
                                        onChange={(e) => onChange({...trainer, expertise_area: e.target.value})}
                                        placeholder="e.g. Leadership Development, Technical Skills"
                                        disabled={isViewMode}
                                    />
                                    {validationErrors.expertise_area && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {validationErrors.expertise_area}
                                        </p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                                    <textarea
                                        className={getInputClass('qualifications')}
                                        value={trainer.qualifications || ''}
                                        onChange={(e) => onChange({...trainer, qualifications: e.target.value})}
                                        placeholder="Educational background, professional qualifications"
                                        rows="3"
                                        disabled={isViewMode}
                                    ></textarea>
                                    {validationErrors.qualifications && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {validationErrors.qualifications}
                                        </p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                                    <textarea
                                        className={getInputClass('certifications')}
                                        value={trainer.certifications || ''}
                                        onChange={(e) => onChange({...trainer, certifications: e.target.value})}
                                        placeholder="List relevant certifications"
                                        rows="3"
                                        disabled={isViewMode}
                                    ></textarea>
                                    {validationErrors.certifications && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {validationErrors.certifications}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Online Presence Tab */}
                        {activeTab === 'online' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Globe className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="url"
                                            className={`pl-10 ${getInputClass('website')}`}
                                            value={trainer.website || ''}
                                            onChange={(e) => onChange({...trainer, website: e.target.value})}
                                            placeholder="https://example.com"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    {validationErrors.website && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {validationErrors.website}
                                        </p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Linkedin className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className={`pl-10 ${getInputClass('linkedin')}`}
                                            value={trainer.linkedin || ''}
                                            onChange={(e) => onChange({...trainer, linkedin: e.target.value})}
                                            placeholder="LinkedIn profile URL or username"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    {validationErrors.linkedin && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {validationErrors.linkedin}
                                        </p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio/Description</label>
                                    <textarea
                                        className={getInputClass('bio')}
                                        value={trainer.bio || ''}
                                        onChange={(e) => onChange({...trainer, bio: e.target.value})}
                                        placeholder="Professional summary and experience"
                                        rows="4"
                                        disabled={isViewMode}
                                    ></textarea>
                                    {validationErrors.bio && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {validationErrors.bio}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Photo Tab */}
                        {activeTab === 'photo' && (
                            <div className="space-y-4">
                                {filePreview ? (
                                    <div className="mb-4">
                                        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                            <img
                                                src={filePreview}
                                                alt="Trainer Photo Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            {!isViewMode && (
                                                <button
                                                    type="button"
                                                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                                                    onClick={() => {
                                                        setFilePreview(null);
                                                        onChange({...trainer, photo_path: null});
                                                        const fileInput = document.querySelector('input[type="file"]');
                                                        if (fileInput) fileInput.value = '';
                                                    }}
                                                    aria-label="Remove image"
                                                >
                                                    <X className="h-4 w-4 text-gray-500" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {!isViewMode ? (
                                            <label className="block w-full cursor-pointer">
                                                <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors">
                                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-50 mb-3">
                                                        <Upload className="h-6 w-6 text-indigo-500" />
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium text-indigo-600 hover:text-indigo-500">
                                                            Click to upload
                                                        </span> or drag and drop
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        PNG, JPG, GIF up to 2MB
                                                    </p>
                                                </div>
                                                <input 
                                                    type="file" 
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                    accept="image/jpeg,image/png,image/gif"
                                                    disabled={isViewMode}
                                                />
                                            </label>
                                        ) : (
                                            <div className="w-full px-4 py-8 bg-gray-50 rounded-lg border border-gray-200 text-center">
                                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-3">
                                                    <User className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <p className="text-sm text-gray-500">No photo available</p>
                                            </div>
                                        )}
                                    </>
                                )}
                                {validationErrors.photo && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {validationErrors.photo}
                                    </p>
                                )}
                                
                                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-blue-800 mb-2">Image Guidelines:</h4>
                                    <ul className="text-xs text-blue-700 space-y-1 pl-4 list-disc">
                                        <li>Professional headshot recommended</li>
                                        <li>Clear, well-lit, high-quality image</li>
                                        <li>Neutral background preferred</li>
                                        <li>Maximum file size: 2MB</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                        
                        {/* Form Action Buttons */}
                        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onClose(false)}
                                className="mr-3"
                            >
                                Cancel
                            </Button>
                            
                            {!isViewMode && (
                                <Button
                                    type="submit"
                                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                                >
                                    {mode === 'create' ? 'Create Trainer' : 'Update Trainer'}
                                </Button>
                            )}
                        </div>
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

                      {/* Replace the Trainers Cards section with this List View */}
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

    {/* Trainers List */}
    {!loading && filteredTrainers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expertise</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTrainers.map(trainer => (
                            <tr key={trainer.id} className="hover:bg-gray-50">
                                {/* Trainer Info */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            {trainer.photo_path ? (
                                                <img 
                                                    src={`/storage/${trainer.photo_path}`}
                                                    alt={trainer.name}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{trainer.name}</div>
                                            <div className="text-sm text-gray-500">{trainer.position || 'No position'}</div>
                                            {trainer.company && <div className="text-xs text-gray-500">{trainer.company}</div>}
                                        </div>
                                    </div>
                                </td>
                                
                                {/* Contact Info */}
                                <td className="px-6 py-4">
                                    {trainer.email && (
                                        <div className="flex items-center text-sm text-gray-600 mb-1">
                                            <Mail className="h-4 w-4 mr-1 flex-shrink-0" />
                                            <span className="truncate max-w-xs">{trainer.email}</span>
                                        </div>
                                    )}
                                    {trainer.phone && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Phone className="h-4 w-4 mr-1 flex-shrink-0" />
                                            <span>{trainer.phone}</span>
                                        </div>
                                    )}
                                </td>
                                
                                {/* Expertise */}
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">
                                        {trainer.expertise_area || 'Not specified'}
                                    </div>
                                    {trainer.qualifications && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            <Award className="h-3 w-3 inline mr-1" />
                                            {trainer.qualifications}
                                        </div>
                                    )}
                                </td>
                                
                                {/* Type */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${trainer.is_external ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {trainer.is_external ? 'External' : 'Internal'}
                                    </span>
                                </td>
                                
                                {/* Status */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className={`flex items-center text-sm ${trainer.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                                        <div className={`w-2 h-2 rounded-full mr-2 ${trainer.is_active ? 'bg-green-600' : 'bg-gray-500'}`}></div>
                                        {trainer.is_active ? 'Active' : 'Inactive'}
                                    </div>
                                </td>
                                
                                {/* Actions */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() => handleViewClick(trainer)}
                                            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
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
                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                            title="Edit"
                                            type="button"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </button>
                                        
                                        <button
                                            onClick={() => handleDeleteClick(trainer)}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete"
                                            type="button"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                        
                                        <button
                                            onClick={() => handleToggleActive(trainer)}
                                            className={`p-1 ${trainer.is_active ? 'text-green-400 hover:text-green-500' : 'text-gray-400 hover:text-gray-500'} transition-colors`}
                                            title={trainer.is_active ? 'Deactivate' : 'Activate'}
                                            type="button"
                                        >
                                            {trainer.is_active ? 
                                                <ToggleRight className="h-5 w-5" /> : 
                                                <ToggleLeft className="h-5 w-5" />
                                            }
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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