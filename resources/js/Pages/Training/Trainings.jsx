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
    Link as LinkIcon,
    Download,
    Eye
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

// Training Modal Component
const TrainingModal = ({ 
    isOpen, 
    onClose, 
    title, 
    training,
    trainingTypes,
    employees,
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
                
                {isViewMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Title</label>
                                    <p className="mt-1 text-sm text-gray-900">{training?.title}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <p className="mt-1 text-sm text-gray-900">{training?.type?.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Department</label>
                                    <p className="mt-1 text-sm text-gray-900">{training?.department || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        training?.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                        training?.status === 'Ongoing' ? 'bg-yellow-100 text-yellow-800' :
                                        training?.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {training?.status}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {moment(training?.start_date).format('MMM DD, YYYY h:mm A')}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {moment(training?.end_date).format('MMM DD, YYYY h:mm A')}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Location</label>
                                    <p className="mt-1 text-sm text-gray-900">{training?.location || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Trainer</label>
                                    <p className="mt-1 text-sm text-gray-900">{training?.trainer || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max Participants</label>
                                    <p className="mt-1 text-sm text-gray-900">{training?.max_participants || '∞'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Current Participants</label>
                                    <p className="mt-1 text-sm text-gray-900">{training?.participants_count || 0}</p>
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <p className="mt-1 text-sm text-gray-900">{training?.description || '-'}</p>
                            </div>
                            
                            {training?.materials_link && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700">Materials Link</label>
                                    <a href={training.materials_link} target="_blank" rel="noopener noreferrer" 
                                       className="mt-1 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                        <LinkIcon size={14} />
                                        {training.materials_link}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Participants List */}
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="text-md font-medium text-gray-900 mb-3">Participants</h4>
                            <div className="max-h-96 overflow-y-auto">
                                {training?.participants?.length > 0 ? (
                                    <div className="space-y-2">
                                        {training.participants.map((participant, index) => (
                                            <div key={participant.id} className="flex justify-between items-center p-2 bg-white rounded">
                                                <div>
                                                    <span className="font-medium">{index + 1}. </span>
                                                    {participant.employee?.Fname} {participant.employee?.Lname}
                                                </div>
                                                <span className={`px-2 py-1 text-xs rounded ${
                                                    participant.attendance_status === 'Attended' ? 'bg-green-100 text-green-800' :
                                                    participant.attendance_status === 'Absent' ? 'bg-red-100 text-red-800' :
                                                    participant.attendance_status === 'Cancelled' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {participant.attendance_status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No participants registered yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                    type="text"
                                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errorMessages.title ? 'border-red-500' : ''}`}
                                    value={training.title || ''}
                                    onChange={(e) => onChange({...training, title: e.target.value})}
                                    placeholder="e.g. Customer Service Training"
                                    required
                                    disabled={isViewMode}
                                />
                                {errorMessages.title && <p className="mt-1 text-sm text-red-600">{errorMessages.title}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Training Type *</label>
                                <select
                                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errorMessages.training_type_id ? 'border-red-500' : ''}`}
                                    value={training.training_type_id || ''}
                                    onChange={(e) => onChange({...training, training_type_id: e.target.value})}
                                    required
                                    disabled={isViewMode}
                                >
                                    <option value="">Select Training Type</option>
                                    {trainingTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                                {errorMessages.training_type_id && <p className="mt-1 text-sm text-red-600">{errorMessages.training_type_id}</p>}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <input
                                    type="text"
                                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.department ? 'border-red-500' : ''}`}
                                    value={training.department || ''}
                                    onChange={(e) => onChange({...training, department: e.target.value})}
                                    placeholder="e.g. Human Resources, Marketing"
                                    disabled={isViewMode}
                                />
                                {errorMessages.department && <p className="mt-1 text-sm text-red-600">{errorMessages.department}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                                <select
                                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.status ? 'border-red-500' : ''}`}
                                    value={training.status || 'Scheduled'}
                                    onChange={(e) => onChange({...training, status: e.target.value})}
                                    disabled={isViewMode}
                                >
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Ongoing">Ongoing</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                                {errorMessages.status && <p className="mt-1 text-sm text-red-600">{errorMessages.status}</p>}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                <input
                                    type="datetime-local"
                                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.start_date ? 'border-red-500' : ''}`}
                                    value={training.start_date || ''}
                                    onChange={(e) => onChange({...training, start_date: e.target.value})}
                                    required
                                    disabled={isViewMode}
                                />
                                {errorMessages.start_date && <p className="mt-1 text-sm text-red-600">{errorMessages.start_date}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                <input
                                    type="datetime-local"
                                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.end_date ? 'border-red-500' : ''}`}
                                    value={training.end_date || ''}
                                    onChange={(e) => onChange({...training, end_date: e.target.value})}
                                    required
                                    disabled={isViewMode}
                                />
                                {errorMessages.end_date && <p className="mt-1 text-sm text-red-600">{errorMessages.end_date}</p>}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.location ? 'border-red-500' : ''}`}
                                    value={training.location || ''}
                                    onChange={(e) => onChange({...training, location: e.target.value})}
                                    placeholder="e.g. Conference Room A, Virtual"
                                    disabled={isViewMode}
                                />
                                {errorMessages.location && <p className="mt-1 text-sm text-red-600">{errorMessages.location}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
                                <input
                                    type="text"
                                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.trainer ? 'border-red-500' : ''}`}
                                    value={training.trainer || ''}
                                    onChange={(e) => onChange({...training, trainer: e.target.value})}
                                    placeholder="e.g. John Smith, External Consultant"
                                    disabled={isViewMode}
                                />
                                {errorMessages.trainer && <p className="mt-1 text-sm text-red-600">{errorMessages.trainer}</p>}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                                <input
                                    type="number"
                                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.max_participants ? 'border-red-500' : ''}`}
                                    value={training.max_participants || ''}
                                    onChange={(e) => onChange({...training, max_participants: e.target.value})}
                                    placeholder="e.g. 20"
                                    min="1"
                                    disabled={isViewMode}
                                />
                                {errorMessages.max_participants && <p className="mt-1 text-sm text-red-600">{errorMessages.max_participants}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Materials Link</label>
                                <input
                                    type="url"
                                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.materials_link ? 'border-red-500' : ''}`}
                                    value={training.materials_link || ''}
                                    onChange={(e) => onChange({...training, materials_link: e.target.value})}
                                    placeholder="https://example.com/materials"
                                    disabled={isViewMode}
                                />
                                {errorMessages.materials_link && <p className="mt-1 text-sm text-red-600">{errorMessages.materials_link}</p>}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.description ? 'border-red-500' : ''}`}
                                value={training.description || ''}
                                onChange={(e) => onChange({...training, description: e.target.value})}
                                placeholder="Details about the training program"
                                rows="3"
                                disabled={isViewMode}
                            />
                            {errorMessages.description && <p className="mt-1 text-sm text-red-600">{errorMessages.description}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
                            <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                                {Array.isArray(employees) && employees.length > 0 ? (
                                    employees.map(employee => (
                                        <div key={employee.id} className="flex items-center mb-2">
                                            <input
                                                type="checkbox"
                                                id={`employee-${employee.id}`}
                                                checked={training.participants?.includes(employee.id)}
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
                                                className="mr-2"
                                                disabled={isViewMode}
                                            />
                                            <label htmlFor={`employee-${employee.id}`} className="text-sm">
                                                {employee.Fname} {employee.Lname} - {employee.Department || 'No Department'}
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No employees available</p>
                                )}
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
                                    {mode === 'create' ? 'Save Training' : 'Update Training'}
                                </Button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
};

// Main Training Component
const Training = ({ auth, trainings: initialTrainings, counts, trainingTypes, employees, currentStatus }) => {
    // Safely get user from page props
    const user = auth?.user || {};
    
    const [trainings, setTrainings] = useState(initialTrainings || []);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(currentStatus || 'all');
    
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

    // Load data
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/trainings/list', {
                params: { status: statusFilter }
            });
            setTrainings(response.data.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Error loading data: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    // Load data on component mount and when filters change
    useEffect(() => {
        loadData();
    }, [loadData]);

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

    // Handle editing training
    const handleEditClick = (training) => {
        setCurrentTraining({
            ...training,
            participants: training.participants?.map(p => p.employee_id) || []
        });
        setErrors({});
        setIsEditModalOpen(true);
    };

    // Handle viewing training
    const handleViewClick = (training) => {
        setCurrentTraining(training);
        setIsViewModalOpen(true);
    };

    // Handle creating new training
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        
        try {
            const response = await axios.post('/trainings', currentTraining);
            
            // Update trainings list
            await loadData();
            
            // Reset form and close modal
            setCurrentTraining(emptyTraining);
            setIsCreateModalOpen(false);
            
            showToast('Training created successfully');
        } catch (error) {
            console.error('Error creating training:', error);
            
            // Handle validation errors
            if (error.response?.status === 422 && error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                showToast(error.response?.data?.message || 'Error creating training', 'error');
            }
        }
    };

    // Handle updating training
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        
        try {
            const response = await axios.put(`/trainings/${currentTraining.id}`, currentTraining);
            
            // Update trainings list
            await loadData();
            
            // Reset form and close modal
            setCurrentTraining(emptyTraining);
            setIsEditModalOpen(false);
            
            showToast('Training updated successfully');
        } catch (error) {
            console.error('Error updating training:', error);
            
            // Handle validation errors
            if (error.response?.status === 422 && error.response?.data?.errors) {
                setErrors(error.response.data.errors);
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

    // Filter trainings by search term
    const filteredTrainings = trainings.filter(training => 
        training.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.trainer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.type?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get status color
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
                                
                                {(searchTerm || statusFilter !== 'all') && (
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
                                    {searchTerm || statusFilter !== 'all'
                                        ? 'No trainings found matching your filters.'
                                        : 'No trainings found. Create a new training to get started.'}
                                </div>
                            )}

                            {/* Trainings Grid */}
                            {!loading && filteredTrainings.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredTrainings.map(training => (
                                        <div 
                                            key={training.id}
                                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                                        >
                                            {/* Training Type Header */}
                                            <div className="h-16 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                                                <span className="text-lg font-semibold text-white">{training.type?.name || 'Training'}</span>
                                            </div>
                                            
                                            {/* Training Details */}
                                            <div className="p-5">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {training.title}
                                                </h3>
                                                
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(training.status)}`}>
                                                        {training.status}
                                                    </span>
                                                    
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">{training.participants_count || 0}</span>/{training.max_participants || '∞'} participants
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                                    <User className="h-4 w-4 mr-1" />
                                                    <span>{training.trainer || 'No trainer assigned'}</span>
                                                </div>
                                                
                                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                                    <MapPin className="h-4 w-4 mr-1" />
                                                    <span>{training.location || 'No location specified'}</span>
                                                </div>
                                                
                                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    <span>{moment(training.start_date).format('MMM DD, YYYY')}</span>
                                                </div>
                                                
                                                <div className="flex items-center text-sm text-gray-600 mb-4">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    <span>{moment(training.start_date).format('h:mm A')} - {moment(training.end_date).format('h:mm A')}</span>
                                                </div>
                                                
                                                {training.description && (
                                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                        {training.description}
                                                    </p>
                                                )}
                                                
                                                {/* Actions */}
                                                <div className="mt-4 flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleViewClick(training)}
                                                        className="p-1 text-gray-400 hover:text-gray-500"
                                                        title="View Details"
                                                        type="button"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleEditClick(training)}
                                                        className="p-1 text-gray-400 hover:text-gray-500"
                                                        title="Edit"
                                                        type="button"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleDeleteClick(training)}
                                                        className="p-1 text-gray-400 hover:text-red-500"
                                                        title="Delete"
                                                        type="button"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                    
                                                    <div className="relative">
                                                        <select
                                                            onChange={(e) => handleUpdateStatus(training, e.target.value)}
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
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Training Modals */}
            <TrainingModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Training"
                training={currentTraining}
                trainingTypes={trainingTypes}
                employees={employees}
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