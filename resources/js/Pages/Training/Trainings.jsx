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
    Calendar,
    MapPin,
    User,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    Link,
    Download,
    Eye,
    Star,
    Dumbbell,
} from 'lucide-react';
import { debounce } from 'lodash';
import axios from 'axios';
import moment from 'moment';

// Toast Component (Same as in Award component)
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

// Training Tabs Component
const TrainingTabs = ({ trainingTypes, activeTab, onChange }) => {
    return (
        <div className="mb-6 border-b border-gray-200">
            <div className="flex overflow-x-auto scrollbar-hide pb-1">
                <button
                    onClick={() => onChange('all')}
                    className={`whitespace-nowrap px-4 py-2 font-medium text-sm rounded-t-lg ${
                        activeTab === 'all'
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                >
                    All Types
                </button>
                
                {trainingTypes.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => onChange(type.id)}
                        className={`whitespace-nowrap px-4 py-2 font-medium text-sm rounded-t-lg ${
                            activeTab === type.id.toString()
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                        {type.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

// Training Card Component
const TrainingCard = ({ training, onView, onEdit, onDelete, onUpdateStatus }) => {
    // Get status color for the badge
    const getStatusColor = (status) => {
        switch (status) {
            case 'Scheduled':
                return 'bg-blue-100 text-blue-800';
            case 'Ongoing':
                return 'bg-yellow-100 text-yellow-800';
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    
    // Calculate duration between start and end date in minutes
    const calculateDuration = () => {
        if (!training.start_date || !training.end_date) return '0 mins';
        const start = new Date(training.start_date);
        const end = new Date(training.end_date);
        const diff = Math.round((end - start) / (1000 * 60)); // in minutes
        return `${diff} mins`;
    };
    
    // Calculate a pseudo-rating based on training_type_id
    const calculateRating = () => {
        // Generate a pseudo-random but consistent rating between 4.0 and 5.0
        const seed = parseInt(training.id) || 1;
        const base = 4.0 + (seed % 11) / 10; // This gives values between 4.0 and 5.0
        return Number(base.toFixed(1));
    };

    // Get random gradient based on training_type_id
    const getGradient = () => {
        const gradients = [
            'from-orange-400 to-pink-500', // orange to pink
            'from-blue-500 to-indigo-600',  // blue to indigo
            'from-yellow-400 to-orange-500', // yellow to orange
            'from-pink-500 to-purple-500',  // pink to purple
            'from-green-400 to-teal-500',   // green to teal
            'from-indigo-500 to-purple-600' // indigo to purple
        ];
        
        const index = parseInt(training.training_type_id) % gradients.length;
        return gradients[index];
    };
    
    // Get a level based on training_type_id
    const getLevel = () => {
        const levels = ['Beginner', 'Intermediate', 'Advanced'];
        const index = parseInt(training.training_type_id) % levels.length;
        return levels[index];
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            {/* Training Type Image or Gradient Header */}
            <div className={`h-40 relative overflow-hidden`}>
                {training.type && training.type.image_url ? (
                    // Display training type image if available
                    <img 
                        src={training.type.image_url}
                        alt={training.type.name || 'Training type'}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    // Fallback to gradient if no image
                    <div className={`h-full w-full bg-gradient-to-r ${getGradient()}`}></div>
                )}
                
                {/* Overlay for better text visibility regardless of background */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                {/* Level Badge */}
                <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded-md px-2 py-1 text-xs font-medium">
                    {getLevel()}
                </div>
                
                {/* Training Type Name (only show if type exists) */}
                {training.type && (
                    <div className="absolute bottom-2 right-2 bg-white/80 rounded-md px-2 py-1 text-xs font-medium">
                        {training.type.name}
                    </div>
                )}
            </div>
            
            {/* Content - Keep the rest of the component unchanged */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold">{training.title}</h3>
                    <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="ml-1 text-sm font-medium">{calculateRating()}</span>
                    </div>
                </div>
                
                {/* Trainer & Duration */}
                <div className="flex items-center text-sm text-gray-600 mb-2">
                    <User className="h-4 w-4 mr-1" />
                    <span className="font-medium">{training.trainer || 'No trainer'}</span>
                    <span className="mx-1">•</span>
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{calculateDuration()}</span>
                </div>
                
                {/* Equipment or Status Badge */}
                <div className="flex flex-wrap gap-1 mt-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(training.status)}`}>
                        {training.status}
                    </span>
                    
                    {training.location && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {training.location}
                        </span>
                    )}
                    
                    {training.department && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {training.department}
                        </span>
                    )}
                </div>
                
                {/* Participants count */}
                <div className="mt-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 inline mr-1" />
                    <span>{training.participants_count || 0}/{training.max_participants || '∞'} participants</span>
                </div>
                
                {/* Actions */}
                <div className="mt-4 flex justify-end space-x-2">
                    <button
                        onClick={() => onView(training)}
                        className="p-1 text-gray-400 hover:text-gray-500"
                        title="View Details"
                        type="button"
                    >
                        <Eye className="h-5 w-5" />
                    </button>
                    
                    <button
                        onClick={() => onEdit(training)}
                        className="p-1 text-gray-400 hover:text-gray-500"
                        title="Edit"
                        type="button"
                    >
                        <Edit className="h-5 w-5" />
                    </button>
                    
                    <button
                        onClick={() => onDelete(training)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Delete"
                        type="button"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                    
                    <div className="relative">
                        <select
                            onChange={(e) => onUpdateStatus(training, e.target.value)}
                            value={training.status}
                            className="text-xs border rounded px-1 py-1"
                            title="Update Status"
                        >
                            <option value="Scheduled">Scheduled</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
// Updated Training Modal Component with Trainer Dropdown
const TrainingModal = ({ 
    isOpen, 
    onClose, 
    title, 
    training,
    trainingTypes,
    employees,
    departments,
    trainers, // Add this prop
    onChange, 
    onSubmit,
    mode = 'create',
    errorMessages = {}
}) => {
    const isViewMode = mode === 'view';
    
    // State for employee search
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    
    // Get filtered employees based on selected department and search term
    const getFilteredEmployees = useCallback(() => {
        if (!Array.isArray(employees)) {
            return [];
        }
        
        // Start with employees filtered by department if one is selected
        let filteredEmployees = employees;
        
        if (training.department) {
            filteredEmployees = employees.filter(emp => 
                emp.Department === training.department
            );
        }
        
        // Further filter by search term if provided
        if (employeeSearchTerm.trim()) {
            const searchTermLower = employeeSearchTerm.toLowerCase();
            
            filteredEmployees = filteredEmployees.filter(emp => {
                const firstName = (emp.Fname || '').toLowerCase();
                const lastName = (emp.Lname || '').toLowerCase();
                const idNo = (emp.idno || '').toLowerCase();
                const fullName = `${firstName} ${lastName}`.toLowerCase();
                const fullNameReversed = `${lastName} ${firstName}`.toLowerCase();
                const department = (emp.Department || '').toLowerCase();
                
                return firstName.includes(searchTermLower) || 
                       lastName.includes(searchTermLower) || 
                       idNo.includes(searchTermLower) ||
                       fullName.includes(searchTermLower) ||
                       fullNameReversed.includes(searchTermLower) ||
                       department.includes(searchTermLower);
            });
        }
        
        return filteredEmployees;
    }, [employees, training.department, employeeSearchTerm]);
    
    // Get filtered employees for selection
    const filteredEmployees = getFilteredEmployees();
    
    // Get all selected employees (even if they don't match current filters)
    const selectedEmployees = useCallback(() => {
        if (!Array.isArray(employees) || !training.participants?.length) {
            return [];
        }
        
        return employees.filter(emp => training.participants.includes(emp.id));
    }, [employees, training.participants]);
    
    // Combine selected employees (on top) with filtered unselected employees (below)
    const displayEmployees = useCallback(() => {
        const selected = selectedEmployees();
        const filteredUnselected = filteredEmployees.filter(emp => !training.participants?.includes(emp.id));
        
        // Show selected employees first, then filtered unselected employees
        return [...selected, ...filteredUnselected];
    }, [filteredEmployees, selectedEmployees, training.participants]);
    
    // Handle select all
    const handleSelectAll = () => {
        const allFilteredEmployeeIds = filteredEmployees.map(emp => emp.id);
        onChange({...training, participants: allFilteredEmployeeIds});
    };
    
    // Handle deselect all
    const handleDeselectAll = () => {
        onChange({...training, participants: []});
    };
    
    // Reset search term when modal opens
    useEffect(() => {
        if (isOpen) {
            setEmployeeSearchTerm('');
        }
    }, [isOpen]);
    
    // Helper function to extract participant name
    const getParticipantName = (participant) => {
        if (participant.employee) {
            return `${participant.employee.Fname || ''} ${participant.employee.Lname || ''}`.trim();
        }
        if (participant.Fname || participant.Lname) {
            return `${participant.Fname || ''} ${participant.Lname || ''}`.trim();
        }
        return 'Unknown Participant';
    };
    
    // Display count of employees from current department
    const departmentEmployeeCount = training.department 
        ? employees.filter(e => e.Department === training.department).length 
        : employees.length;
    
    // Check if we have selected participants
    const hasSelectedParticipants = (training.participants?.length || 0) > 0;
    
    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button 
                        onClick={() => onClose(false)}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                {isViewMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* View mode content */}
                        <div>
                            <h3 className="font-medium text-gray-900">Title</h3>
                            <p className="text-gray-600">{training.title}</p>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-900">Training Type</h3>
                            <p className="text-gray-600">{training.type?.name || 'N/A'}</p>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-900">Department</h3>
                            <p className="text-gray-600">{training.department || 'N/A'}</p>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-900">Status</h3>
                            <p className="text-gray-600">{training.status}</p>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-900">Start Date</h3>
                            <p className="text-gray-600">{training.start_date ? moment(training.start_date).format('MMMM D, YYYY h:mm A') : 'N/A'}</p>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-900">End Date</h3>
                            <p className="text-gray-600">{training.end_date ? moment(training.end_date).format('MMMM D, YYYY h:mm A') : 'N/A'}</p>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-900">Location</h3>
                            <p className="text-gray-600">{training.location || 'N/A'}</p>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-900">Trainer</h3>
                            <p className="text-gray-600">
                                {training.trainer?.name || 'No trainer assigned'}
                                {training.trainer?.is_external ? ' (External)' : ''}
                                {training.trainer?.company ? ` - ${training.trainer.company}` : ''}
                            </p>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-900">Max Participants</h3>
                            <p className="text-gray-600">{training.max_participants || 'Unlimited'}</p>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-900">Materials Link</h3>
                            <p className="text-gray-600">
                                {training.materials_link ? (
                                    <a href={training.materials_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        View Materials
                                    </a>
                                ) : 'N/A'}
                            </p>
                        </div>
                        
                        <div className="md:col-span-2">
                            <h3 className="font-medium text-gray-900">Description</h3>
                            <p className="text-gray-600">{training.description || 'No description provided'}</p>
                        </div>
                        
                        <div className="md:col-span-2">
                            <h3 className="font-medium text-gray-900 mb-2">
                                Participants ({training.participants?.length || 0})
                            </h3>
                            {training.participants && training.participants.length > 0 ? (
                                <ul className="space-y-1">
                                    {training.participants.map((participant, index) => (
                                        <li key={index} className="text-gray-600">
                                            • {getParticipantName(participant)}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-600">No participants registered</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="space-y-3">
                        {/* Two columns layout for form fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            {/* Left Column */}
                            <div>
                                {/* Title */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        className={`w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 ${errorMessages.title ? 'border-red-500' : 'border-gray-300'}`}
                                        value={training.title || ''}
                                        onChange={(e) => onChange({...training, title: e.target.value})}
                                        placeholder="e.g. Customer Service Training"
                                        required
                                    />
                                    {errorMessages.title && <p className="mt-1 text-xs text-red-600">{errorMessages.title}</p>}
                                </div>

                                {/* Department */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                                    <select
                                        className={`w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 ${errorMessages.department ? 'border-red-500' : 'border-gray-300'}`}
                                        value={training.department || ''}
                                        onChange={(e) => onChange({...training, department: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {Array.isArray(departments) && departments.map(dept => (
                                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                                        ))}
                                    </select>
                                    {errorMessages.department && <p className="mt-1 text-xs text-red-600">{errorMessages.department}</p>}
                                </div>

                                {/* Start Date */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                    <input
                                        type="datetime-local"
                                        className={`w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 ${errorMessages.start_date ? 'border-red-500' : 'border-gray-300'}`}
                                        value={training.start_date ? moment(training.start_date).format('YYYY-MM-DDTHH:mm') : ''}
                                        onChange={(e) => onChange({...training, start_date: e.target.value})}
                                        required
                                    />
                                    {errorMessages.start_date && <p className="mt-1 text-xs text-red-600">{errorMessages.start_date}</p>}
                                </div>

                                {/* Location */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        className={`w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 ${errorMessages.location ? 'border-red-500' : 'border-gray-300'}`}
                                        value={training.location || ''}
                                        onChange={(e) => onChange({...training, location: e.target.value})}
                                        placeholder="e.g. Conference Room A"
                                    />
                                    {errorMessages.location && <p className="mt-1 text-xs text-red-600">{errorMessages.location}</p>}
                                </div>

                                {/* Max Participants */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                                    <input
                                        type="number"
                                        className={`w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 ${errorMessages.max_participants ? 'border-red-500' : 'border-gray-300'}`}
                                        value={training.max_participants || ''}
                                        onChange={(e) => onChange({...training, max_participants: e.target.value})}
                                        placeholder="e.g. 20"
                                        min="1"
                                    />
                                    {errorMessages.max_participants && <p className="mt-1 text-xs text-red-600">{errorMessages.max_participants}</p>}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div>
                                {/* Training Type */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Training Type *</label>
                                    <select
                                        className={`w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 ${errorMessages.training_type_id ? 'border-red-500' : 'border-gray-300'}`}
                                        value={training.training_type_id || ''}
                                        onChange={(e) => onChange({...training, training_type_id: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Training Type</option>
                                        {trainingTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                    {errorMessages.training_type_id && <p className="mt-1 text-xs text-red-600">{errorMessages.training_type_id}</p>}
                                </div>

                                {/* Status */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                                    <select
                                        className={`w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 ${errorMessages.status ? 'border-red-500' : 'border-gray-300'}`}
                                        value={training.status || 'Scheduled'}
                                        onChange={(e) => onChange({...training, status: e.target.value})}
                                    >
                                        <option value="Scheduled">Scheduled</option>
                                        <option value="Ongoing">Ongoing</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                    {errorMessages.status && <p className="mt-1 text-xs text-red-600">{errorMessages.status}</p>}
                                </div>

                                {/* End Date */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                    <input
                                        type="datetime-local"
                                        className={`w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 ${errorMessages.end_date ? 'border-red-500' : 'border-gray-300'}`}
                                        value={training.end_date ? moment(training.end_date).format('YYYY-MM-DDTHH:mm') : ''}
                                        onChange={(e) => onChange({...training, end_date: e.target.value})}
                                        required
                                    />
                                    {errorMessages.end_date && <p className="mt-1 text-xs text-red-600">{errorMessages.end_date}</p>}
                                </div>

                                {/* Trainer Dropdown */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
                                    <select
                                        className={`w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 ${errorMessages.trainer_id ? 'border-red-500' : 'border-gray-300'}`}
                                        value={training.trainer_id || ''}
                                        onChange={(e) => onChange({...training, trainer_id: e.target.value})}
                                    >
                                        <option value="">Select Trainer</option>
                                        {trainers && trainers.map(trainer => (
                                            <option key={trainer.id} value={trainer.id}>
                                                {trainer.name}
                                                {trainer.is_external ? ' (External)' : ' (Internal)'}
                                                {trainer.company ? ` - ${trainer.company}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {errorMessages.trainer_id && <p className="mt-1 text-xs text-red-600">{errorMessages.trainer_id}</p>}
                                </div>

                                {/* Materials Link */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Materials Link</label>
                                    <input
                                        type="url"
                                        className={`w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 ${errorMessages.materials_link ? 'border-red-500' : 'border-gray-300'}`}
                                        value={training.materials_link || ''}
                                        onChange={(e) => onChange({...training, materials_link: e.target.value})}
                                        placeholder="https://example.com/materials"
                                    />
                                    {errorMessages.materials_link && <p className="mt-1 text-xs text-red-600">{errorMessages.materials_link}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Description - Full width */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                className={`w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 ${errorMessages.description ? 'border-red-500' : 'border-gray-300'}`}
                                value={training.description || ''}
                                onChange={(e) => onChange({...training, description: e.target.value})}
                                placeholder="Details about the training program"
                                rows="3"
                            />
                            {errorMessages.description && <p className="mt-1 text-xs text-red-600">{errorMessages.description}</p>}
                        </div>
                        
                        {/* Participants Section */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">Participants</label>
                                <div className="text-xs text-gray-500">
                                    {departmentEmployeeCount} employee{departmentEmployeeCount !== 1 ? 's' : ''} 
                                    {training.department ? ` from ${training.department}` : ''}
                                </div>
                            </div>
                            
                            {/* Search and Select/Deselect Controls */}
                            <div className="flex items-center mb-2 space-x-2">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                        placeholder="Search employees..."
                                        value={employeeSearchTerm}
                                        onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                                    />
                                </div>
                                
                                {filteredEmployees.length > 0 && 
                                 filteredEmployees.some(employee => !training.participants?.includes(employee.id)) && (
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="px-4 py-2 border rounded-md text-sm font-medium bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-all duration-200"
                                    >
                                        Select All
                                    </button>
                                )}
                                
                                {hasSelectedParticipants && (
                                    <button
                                        type="button"
                                        onClick={handleDeselectAll}
                                        className="px-4 py-2 border rounded-md text-sm font-medium bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-all duration-200"
                                    >
                                        Deselect All
                                    </button>
                                )}
                            </div>
                            
                            {/* Employee Selection List */}
                            <div className="max-h-48 overflow-y-auto border rounded-md">
                                {displayEmployees().length > 0 ? (
                                    <div>
                                        {displayEmployees()
                                            .map(employee => {
                                                const isSelected = training.participants?.includes(employee.id);
                                                const isFromCurrentDepartment = !training.department || employee.Department === training.department;
                                                const matchesSearch = !employeeSearchTerm || filteredEmployees.includes(employee);
                                                
                                                return (
                                                    <div 
                                                        key={`employee-${employee.id}`} 
                                                        className={`px-4 py-2 border-b last:border-b-0 ${
                                                            isSelected 
                                                                ? 'bg-indigo-50' 
                                                                : 'hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id={`employee-${employee.id}`}
                                                                checked={isSelected || false}
                                                                onChange={() => {
                                                                    const participants = [...(training.participants || [])];
                                                                    const index = participants.indexOf(employee.id);
                                                                    if (index > -1) {
                                                                        participants.splice(index, 1);
                                                                    } else {
                                                                        participants.push(employee.id);
                                                                    }
                                                                    onChange({...training, participants});
                                                                }}
                                                                className="mr-3 h-4 w-4"
                                                            />
                                                            <div className="flex-1">
                                                                <label htmlFor={`employee-${employee.id}`} className="block font-medium text-sm cursor-pointer">
                                                                    {employee.Lname}, {employee.Fname} {employee.idno && `(${employee.idno})`}
                                                                </label>
                                                                <p className="text-xs text-gray-500">
                                                                    {employee.Department || 'No Department'}
                                                                    {isSelected && (!isFromCurrentDepartment || !matchesSearch) && (
                                                                        <span className="ml-2 text-indigo-600">(Selected)</span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        {training.department && !employeeSearchTerm
                                            ? `No employees found in ${training.department}`
                                            : employeeSearchTerm
                                                ? "No employees match your search"
                                                : "No employees available"}
                                    </div>
                                )}
                            </div>
                            
                            {/* Selected Count */}
                            <div className="mt-1 text-xs text-right text-gray-500">
                                {(training.participants?.length || 0)} selected
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex justify-end mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onClose(false)}
                                className="mr-2"
                            >
                                Cancel
                            </Button>
                            
                            <Button
                                type="submit"
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Save Training
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
};
// Main Training Component with Department Dropdown
const Training = ({ auth, trainings: initialTrainings, counts, trainingTypes, employees, currentStatus }) => {
    // Safely get user from page props
    const user = auth?.user || {};
    
    const [trainings, setTrainings] = useState(initialTrainings || []);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(currentStatus || 'all');
    const [typeFilter, setTypeFilter] = useState('all');
    
    // Add departments state
    const [departments, setDepartments] = useState([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    
    // Toast state
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    
    // Training state
    const emptyTraining = {
        title: '',
        description: '',
        training_type_id: '',
        department: '',
        start_date: '',
        end_date: '',
        location: '',
        trainer: '',
        max_participants: '',
        materials_link: '',
        status: 'Scheduled',
        participants: []
    };
    const [currentTraining, setCurrentTraining] = useState(emptyTraining);
    
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

    // Load training data with better error handling
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/trainings/list', {
                params: { status: statusFilter }
            });
            
            // Debug: Check what data is coming from backend
            console.log('Training data received:', response.data.data);
            
            setTrainings(response.data.data || []);
        } catch (error) {
            console.error('Error loading training data:', error);
            showToast('Error loading training data: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    // Load departments data with better error handling
    const loadDepartments = useCallback(async () => {
        setLoadingDepartments(true);
        try {
            // Fetch departments using the DepartmentController endpoint
            const response = await axios.get('/departments');
            
            // Log for debugging
            console.log('Departments loaded:', response.data.data);
            
            // Filter only active departments if applicable
            const activeDepartments = response.data.data 
                ? response.data.data.filter(dept => dept.is_active === true)
                : [];
            
            // Set departments from the response
            setDepartments(activeDepartments);
        } catch (error) {
            console.error('Error loading departments:', error);
            showToast('Error loading departments: ' + (error.response?.data?.message || error.message), 'error');
            // Set empty array to prevent further errors
            setDepartments([]);
        } finally {
            setLoadingDepartments(false);
        }
    }, []);

    // Load data on component mount and when filters change
    useEffect(() => {
        loadData();
    }, [loadData]);
    
    // Load departments on component mount
    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    // Close toast notification
    const closeToast = () => {
        setToast({ ...toast, visible: false });
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        const value = e.target.value;
        debouncedSearch(value);
    };

    // Debounced search handler
    const debouncedSearch = debounce((value) => {
        setSearchTerm(value);
    }, 300);

    // Handle creating new training
    const handleCreateClick = () => {
        setCurrentTraining(emptyTraining);
        setErrors({});
        setIsCreateModalOpen(true);
    };

    // Handle editing training (WITH DEPARTMENT HANDLING)
    const handleEditClick = async (training) => {
        try {
            // Fetch full training details including participants
            const response = await axios.get(`/trainings/${training.id}`);
            const fullTraining = response.data;
            
            setCurrentTraining({
                ...fullTraining,
                participants: fullTraining.participants?.map(p => p.employee_id) || []
            });
            setErrors({});
            setIsEditModalOpen(true);
            
            // Make sure departments are loaded
            if (departments.length === 0 && !loadingDepartments) {
                loadDepartments();
            }
        } catch (error) {
            console.error('Error fetching training details:', error);
            // Fallback to original data
            setCurrentTraining({
                ...training,
                participants: training.participants?.map(p => p.employee_id) || []
            });
            setErrors({});
            setIsEditModalOpen(true);
        }
    };

    // Handle viewing training (WITH DEPARTMENT HANDLING)
    const handleViewClick = async (training) => {
        try {
            // Fetch full training details including participants with employee data
            const response = await axios.get(`/trainings/${training.id}`);
            console.log('Full training data:', response.data);
            setCurrentTraining(response.data);
            setIsViewModalOpen(true);
            
            // Make sure departments are loaded
            if (departments.length === 0 && !loadingDepartments) {
                loadDepartments();
            }
        } catch (error) {
            console.error('Error fetching training details:', error);
            // Fallback to existing data
            setCurrentTraining(training);
            setIsViewModalOpen(true);
        }
    };
    
    // Handle creating new training (WITH DEPARTMENT HANDLING)
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        
        try {
            // Prepare training data with careful handling of empty values
            const trainingData = {
                title: currentTraining.title || '',
                training_type_id: currentTraining.training_type_id ? parseInt(currentTraining.training_type_id) : null,
                department: currentTraining.department || '',  // Department from dropdown
                status: currentTraining.status || 'Scheduled',
                start_date: currentTraining.start_date ? moment(currentTraining.start_date).format('YYYY-MM-DD HH:mm:ss') : null,
                end_date: currentTraining.end_date ? moment(currentTraining.end_date).format('YYYY-MM-DD HH:mm:ss') : null,
            };
            
            // Only add optional fields if they have values
            if (currentTraining.description) {
                trainingData.description = currentTraining.description;
            }
            if (currentTraining.location) {
                trainingData.location = currentTraining.location;
            }
            if (currentTraining.trainer) {
                trainingData.trainer = currentTraining.trainer;
            }
            if (currentTraining.max_participants) {
                trainingData.max_participants = parseInt(currentTraining.max_participants);
            }
            if (currentTraining.materials_link) {
                trainingData.materials_link = currentTraining.materials_link;
            }
            
            // Handle participants separately
            if (currentTraining.participants && currentTraining.participants.length > 0) {
                trainingData.participants = currentTraining.participants;
            }
            
            console.log('Sending training data:', trainingData);
            
            // Try to create training
            const response = await axios.post('/trainings', trainingData);
            
            // Update trainings list
            await loadData();
            
            // Reset form and close modal
            setCurrentTraining(emptyTraining);
            setIsCreateModalOpen(false);
            
            showToast('Training created successfully');
        } catch (error) {
            console.error('Error creating training:', error);
            
            if (error.response?.status === 422 && error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
                showToast(`Validation error: ${errorMessages}`, 'error');
            } else {
                showToast(error.response?.data?.message || 'Error creating training', 'error');
            }
        }
    };

    // Handle updating training (WITH DEPARTMENT HANDLING)
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        
        try {
            // Prepare training data
            const trainingData = {
                title: currentTraining.title,
                description: currentTraining.description,
                training_type_id: parseInt(currentTraining.training_type_id) || null,
                department: currentTraining.department || '',  // Department from dropdown
                start_date: currentTraining.start_date ? moment(currentTraining.start_date).format('YYYY-MM-DD HH:mm:ss') : null,
                end_date: currentTraining.end_date ? moment(currentTraining.end_date).format('YYYY-MM-DD HH:mm:ss') : null,
                location: currentTraining.location,
                trainer: currentTraining.trainer,
                max_participants: currentTraining.max_participants ? parseInt(currentTraining.max_participants) : null,
                materials_link: currentTraining.materials_link,
                status: currentTraining.status || 'Scheduled',
                participants: currentTraining.participants || []
            };
            
            console.log('Updating training data:', trainingData);
            
            const response = await axios.put(`/trainings/${currentTraining.id}`, trainingData);
            
            // Update trainings list
            await loadData();
            
            // Reset form and close modal
            setCurrentTraining(emptyTraining);
            setIsEditModalOpen(false);
            
            showToast('Training updated successfully');
        } catch (error) {
            console.error('Error updating training:', error);
            
            if (error.response?.status === 422 && error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
                showToast(`Validation error: ${errorMessages}`, 'error');
            } else {
                showToast(error.response?.data?.message || 'Error updating training', 'error');
            }
        }
    };
    
    // Handle deleting training
    const handleDeleteClick = (training) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Training',
            message: `Are you sure you want to delete the training "${training.title}"? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'destructive',
            onConfirm: async () => {
                try {
                    await axios.delete(`/trainings/${training.id}`);
                    
                    // Update trainings list
                    await loadData();
                    
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showToast('Training deleted successfully');
                } catch (error) {
                    console.error('Error deleting training:', error);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showToast(error.response?.data?.message || 'Error deleting training', 'error');
                }
            }
        });
    };

    // Handle reset filters
    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setTypeFilter('all');
        
        // Reset the search input field
        const searchInput = document.querySelector('input[placeholder="Search trainings..."]');
        if (searchInput) {
            searchInput.value = '';
        }
    };

    // Handle exporting trainings
    const exportTrainings = async () => {
        try {
            const response = await axios.get('/trainings/export', {
                params: { status: statusFilter },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `trainings_${moment().format('YYYY-MM-DD')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            showToast('Trainings exported successfully');
        } catch (error) {
            console.error('Error exporting trainings:', error);
            showToast('Error exporting trainings', 'error');
        }
    };

    // Handle update status
    const handleUpdateStatus = async (training, newStatus) => {
        try {
            await axios.post(`/trainings/${training.id}/status`, { status: newStatus });
            
            // Update trainings list
            await loadData();
            
            showToast(`Training status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating training status:', error);
            showToast('Error updating training status', 'error');
        }
    };
    
    // Filter trainings by search term, status, and type
    const filteredTrainings = trainings.filter(training => {
        const matchesSearch = !searchTerm || 
            training.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            training.trainer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            training.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            training.type?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = typeFilter === 'all' || training.training_type_id?.toString() === typeFilter.toString();
        
        return matchesSearch && matchesType;
    });
    
    return (
        <AuthenticatedLayout>
            <Head title="Training Management" />
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
                                    Training Management
                                </h1>
                                <p className="text-gray-600">
                                    Organize, schedule, and track employee training programs.
                                </p>
                            </div>
                            <Button
                                onClick={handleCreateClick}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                New Training
                            </Button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="text-sm text-gray-600">Total Trainings</div>
                                <div className="text-2xl font-bold">{counts?.total || 0}</div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="text-sm text-gray-600">Scheduled</div>
                                <div className="text-2xl font-bold text-blue-600">{counts?.scheduled || 0}</div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="text-sm text-gray-600">Ongoing</div>
                                <div className="text-2xl font-bold text-yellow-600">{counts?.ongoing || 0}</div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="text-sm text-gray-600">Completed</div>
                                <div className="text-2xl font-bold text-green-600">{counts?.completed || 0}</div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="text-sm text-gray-600">Cancelled</div>
                                <div className="text-2xl font-bold text-red-600">{counts?.cancelled || 0}</div>
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
                                            placeholder="Search trainings..."
                                            onChange={handleSearchChange}
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
                                        <option value="Scheduled">Scheduled</option>
                                        <option value="Ongoing">Ongoing</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="mt-4 flex justify-end">
                                <Button
                                    onClick={exportTrainings}
                                    variant="outline"
                                    className="mr-2 flex items-center"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                                
                                {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
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
                        
                        {/* Training Type Tabs */}
                        <TrainingTabs 
                            trainingTypes={trainingTypes} 
                            activeTab={typeFilter} 
                            onChange={setTypeFilter}
                        />

                        {/* Training Cards */}
                        <div className="mb-8">
                            {/* Loading State */}
                            {loading && (
                                <div className="py-16 text-center text-gray-500">
                                    Loading...
                                </div>
                            )}

                            {/* No Results */}
                            {!loading && filteredTrainings.length === 0 && (
                                <div className="py-16 text-center text-gray-500">
                                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                                        ? 'No trainings found matching your filters.'
                                        : 'No trainings found. Create a new training to get started.'}
                                </div>
                            )}

                            {/* Trainings Grid */}
                            {!loading && filteredTrainings.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredTrainings.map(training => (
                                        <TrainingCard
                                            key={training.id}
                                            training={training}
                                            onView={handleViewClick}
                                            onEdit={handleEditClick}
                                            onDelete={handleDeleteClick}
                                            onUpdateStatus={handleUpdateStatus}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Training Modals - Pass departments to each modal */}
            <TrainingModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Training"
                training={currentTraining}
                trainingTypes={trainingTypes}
                employees={employees}
                departments={departments} // Pass departments here
                onChange={setCurrentTraining}
                onSubmit={handleCreateSubmit}
                mode="create"
                errorMessages={errors}
            />

            <TrainingModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Training"
                training={currentTraining}
                trainingTypes={trainingTypes}
                employees={employees}
                departments={departments} // Pass departments here
                onChange={setCurrentTraining}
                onSubmit={handleUpdateSubmit}
                mode="edit"
                errorMessages={errors}
            />

            <TrainingModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="View Training Details"
                training={currentTraining}
                trainingTypes={trainingTypes}
                employees={employees}
                departments={departments} // Pass departments here
                onChange={setCurrentTraining}
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

export default Training;