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
        BookOpen,
        Upload,
        Image as ImageIcon
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

    // Training Type Modal Component
    const TrainingTypeModal = ({ 
        isOpen, 
        onClose, 
        title, 
        trainingType,
        onChange, 
        onSubmit,
        mode = 'create',
        errorMessages = {}
    }) => {
        const isViewMode = mode === 'view';
        const [imagePreview, setImagePreview] = useState('');
        
        // Set image preview when training type changes
        useEffect(() => {
            if (trainingType.image) {
                setImagePreview(trainingType.image);
            } else if (trainingType.image_url) {
                setImagePreview(trainingType.image_url);
            } else {
                setImagePreview('');
            }
        }, [trainingType]);
        
        // Handle image file selection
        const handleImageChange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // Create preview
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                    onChange({...trainingType, image: reader.result, image_file: file});
                };
                reader.readAsDataURL(file);
            }
        };
        
        // Remove image
        const handleRemoveImage = () => {
            setImagePreview('');
            onChange({...trainingType, image: null, image_file: null, image_url: null});
        };
        
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                                type="text"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.name ? 'border-red-500' : ''}`}
                                value={trainingType.name || ''}
                                onChange={(e) => onChange({...trainingType, name: e.target.value})}
                                placeholder="e.g. Technical Training"
                                required
                                disabled={isViewMode}
                            />
                            {errorMessages.name && <p className="mt-1 text-sm text-red-600">{errorMessages.name}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''} ${errorMessages.description ? 'border-red-500' : ''}`}
                                value={trainingType.description || ''}
                                onChange={(e) => onChange({...trainingType, description: e.target.value})}
                                placeholder="Description of the training type"
                                rows="3"
                                disabled={isViewMode}
                            />
                            {errorMessages.description && <p className="mt-1 text-sm text-red-600">{errorMessages.description}</p>}
                        </div>
                        
                        {/* Image Upload Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                            <div className="space-y-3">
                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Training type preview"
                                            className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                        />
                                        {!isViewMode && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                                
                                {/* Upload Button */}
                                {!isViewMode && (
                                    <div>
                                        <label className="cursor-pointer">
                                            <div className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                                                <div className="text-center">
                                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Click to upload image
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        PNG, JPG up to 5MB
                                                    </p>
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    </div>
                                )}
                                {errorMessages.image && <p className="mt-1 text-sm text-red-600">{errorMessages.image}</p>}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <div className="flex items-center">
                                <select
                                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isViewMode ? 'bg-gray-100' : ''}`}
                                    value={trainingType.is_active ? "true" : "false"}
                                    onChange={(e) => onChange({...trainingType, is_active: e.target.value === "true"})}
                                    disabled={isViewMode}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
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
                                    {mode === 'create' ? 'Save Type' : 'Update Type'}
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            </Modal>
        );
    };

    // Main Training Types Component
    const TrainingTypes = ({ auth, trainingTypes: initialTrainingTypes }) => {
        // Safely get user from page props
        const user = auth?.user || {};
        
        const [trainingTypes, setTrainingTypes] = useState(initialTrainingTypes || []);
        const [loading, setLoading] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const [activeFilter, setActiveFilter] = useState('all');
        
        // Toast state
        const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
        
        // Training type state
        const emptyTrainingType = {
            name: '',
            description: '',
            is_active: true,
            image: null,
            image_file: null,
            image_url: null
        };
        const [currentTrainingType, setCurrentTrainingType] = useState(emptyTrainingType);
        
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
                const response = await axios.get('/training-types/list');
                setTrainingTypes(response.data.data || []);
            } catch (error) {
                console.error('Error loading data:', error);
                showToast('Error loading data: ' + (error.response?.data?.message || error.message), 'error');
            } finally {
                setLoading(false);
            }
        }, []);

        // Load data on component mount
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

        // Handle creating new training type
        const handleCreateClick = () => {
            setCurrentTrainingType(emptyTrainingType);
            setErrors({});
            setIsCreateModalOpen(true);
        };

        // Handle editing training type
        const handleEditClick = (trainingType) => {
            setCurrentTrainingType({...trainingType});
            setErrors({});
            setIsEditModalOpen(true);
        };

        // Handle viewing training type
        const handleViewClick = (trainingType) => {
            setCurrentTrainingType({...trainingType});
            setIsViewModalOpen(true);
        };

        // Handle creating new training type
        const handleCreateSubmit = async (e) => {
            e.preventDefault();
            setErrors({});
            
            try {
                // Create FormData for file upload
                const formData = new FormData();
                formData.append('name', currentTrainingType.name);
                formData.append('description', currentTrainingType.description || '');
                formData.append('is_active', currentTrainingType.is_active ? '1' : '0');
                
                // Add image if selected
                if (currentTrainingType.image_file) {
                    formData.append('image', currentTrainingType.image_file);
                }
                
                const response = await axios.post('/training-types', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });
                
                // Update training types list
                await loadData();
                
                // Reset form and close modal
                setCurrentTrainingType(emptyTrainingType);
                setIsCreateModalOpen(false);
                
                showToast('Training type created successfully');
            } catch (error) {
                console.error('Error creating training type:', error);
                
                // Handle validation errors
                if (error.response?.status === 422 && error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                } else {
                    showToast(error.response?.data?.message || 'Error creating training type', 'error');
                }
            }
        };

        // Handle updating training type
        // Handle updating training type
const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('name', currentTrainingType.name);
        formData.append('description', currentTrainingType.description || '');
        formData.append('is_active', currentTrainingType.is_active ? '1' : '0'); // Convert boolean to '1' or '0'
        formData.append('_method', 'PUT'); // For Laravel
        
        // Add image if selected
        if (currentTrainingType.image_file) {
            formData.append('image', currentTrainingType.image_file);
        }
        
        console.log('Updating training type with data:', {
            name: currentTrainingType.name,
            description: currentTrainingType.description,
            is_active: currentTrainingType.is_active ? '1' : '0',
            has_image: !!currentTrainingType.image_file
        });
        
        const response = await axios.post(`/training-types/${currentTrainingType.id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        
        // Update training types list
        await loadData();
        
        // Reset form and close modal
        setCurrentTrainingType(emptyTrainingType);
        setIsEditModalOpen(false);
        
        showToast('Training type updated successfully');
    } catch (error) {
        console.error('Error updating training type:', error);
        
        // Add detailed logging of validation errors
        if (error.response?.status === 422) {
            console.log('Validation errors:', error.response.data.errors);
            Object.entries(error.response.data.errors || {}).forEach(([field, messages]) => {
                console.log(`Field: ${field}, Error: ${messages.join(', ')}`);
            });
        }
        
        // Handle validation errors
        if (error.response?.status === 422 && error.response?.data?.errors) {
            setErrors(error.response.data.errors);
        } else {
            showToast(error.response?.data?.message || 'Error updating training type', 'error');
        }
    }
};

        // Handle toggling training type active status
        const handleToggleActive = async (trainingType) => {
            try {
                await axios.patch(`/training-types/${trainingType.id}/toggle-active`);
                
                // Update training types list
                await loadData();
                
                showToast(`Training type ${trainingType.is_active ? 'deactivated' : 'activated'} successfully`);
            } catch (error) {
                console.error('Error toggling training type status:', error);
                showToast('Error updating training type status', 'error');
            }
        };

        // Handle deleting training type
        const handleDeleteClick = (trainingType) => {
            setConfirmModal({
                isOpen: true,
                title: 'Delete Training Type',
                message: `Are you sure you want to delete the training type "${trainingType.name}"? This action cannot be undone.`,
                confirmText: 'Delete',
                confirmVariant: 'destructive',
                onConfirm: async () => {
                    try {
                        await axios.delete(`/training-types/${trainingType.id}`);
                        
                        // Update training types list
                        await loadData();
                        
                        setConfirmModal({ ...confirmModal, isOpen: false });
                        showToast('Training type deleted successfully');
                    } catch (error) {
                        console.error('Error deleting training type:', error);
                        setConfirmModal({ ...confirmModal, isOpen: false });
                        showToast(error.response?.data?.message || 'Error deleting training type', 'error');
                    }
                }
            });
        };

        // Handle reset filters
        const handleResetFilters = () => {
            setSearchTerm('');
            setActiveFilter('all');
            
            // Reset the search input field
            const searchInput = document.querySelector('input[placeholder="Search training types..."]');
            if (searchInput) {
                searchInput.value = '';
            }
        };

        // Filter training types by search term and active status
        const filteredTrainingTypes = trainingTypes.filter(type => {
            const matchesSearch = type.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                type.description?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = activeFilter === 'all' || 
                                (activeFilter === 'active' && type.is_active) || 
                                (activeFilter === 'inactive' && !type.is_active);
            
            return matchesSearch && matchesStatus;
        });

        // Count active and inactive training types
        const counts = {
            total: trainingTypes.length,
            active: trainingTypes.filter(type => type.is_active).length,
            inactive: trainingTypes.filter(type => !type.is_active).length
        };

        return (
            <AuthenticatedLayout>
                <Head title="Training Types" />
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
                                        Training Types
                                    </h1>
                                    <p className="text-gray-600">
                                        Manage categories of training programs offered to employees.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleCreateClick}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    New Training Type
                                </Button>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="text-sm text-gray-600">Total Types</div>
                                    <div className="text-2xl font-bold">{counts.total}</div>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="text-sm text-gray-600">Active</div>
                                    <div className="text-2xl font-bold text-green-600">{counts.active}</div>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="text-sm text-gray-600">Inactive</div>
                                    <div className="text-2xl font-bold text-gray-500">{counts.inactive}</div>
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
                                                placeholder="Search training types..."
                                                onChange={handleSearchChange}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Status Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={activeFilter}
                                            onChange={(e) => setActiveFilter(e.target.value)}
                                        >
                                            <option value="all">All</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {/* Reset Filters Button */}
                                {(searchTerm || activeFilter !== 'all') && (
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            onClick={handleResetFilters}
                                            variant="outline"
                                            className="text-sm"
                                        >
                                            Reset Filters
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Training Types List/Grid */}
                            <div className="mb-8">
                                {/* Loading State */}
                                {loading && (
                                    <div className="py-16 text-center text-gray-500">
                                        Loading...
                                    </div>
                                )}

                                {/* No Results */}
                                {!loading && filteredTrainingTypes.length === 0 && (
                                    <div className="py-16 text-center text-gray-500">
                                        {searchTerm || activeFilter !== 'all'
                                            ? 'No training types found matching your filters.'
                                            : 'No training types found. Create a new training type to get started.'}
                                    </div>
                                )}

                                {/* Training Types Grid */}
                                {/* Enhanced Training Types Grid */}
{!loading && filteredTrainingTypes.length > 0 && (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainingTypes.map(type => (
            <div 
                key={type.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1"
            >
                {/* Training Type Image or Header */}
                {type.image_url ? (
                    <div className="h-48 relative">
                        <img 
                            src={type.image_url} 
                            alt={type.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                            <span className="text-xl font-bold text-white flex items-center">
                                <BookOpen className="w-5 h-5 mr-2 text-blue-300" />
                                {type.name}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="h-20 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between p-4">
                        <span className="text-xl font-bold text-white flex items-center">
                            <BookOpen className="w-5 h-5 mr-2" />
                            {type.name}
                        </span>
                        <div className={`px-2 py-1 text-xs font-medium rounded-full ${type.is_active ? 'bg-green-400 text-green-900' : 'bg-gray-300 text-gray-800'}`}>
                            {type.is_active ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                )}
                
                {/* Training Type Details */}
                <div className="p-5">
                    {type.image_url && (
                        <div className="flex items-center mb-4">
                            <div className={`px-3 py-1 text-xs font-semibold rounded-full ${type.is_active ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                                {type.is_active ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                    )}
                    
                    {type.description && (
                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                            <p className="text-sm text-gray-700">
                                {type.description.length > 100 
                                    ? `${type.description.substring(0, 100)}...` 
                                    : type.description}
                            </p>
                        </div>
                    )}
                    
                    {/* Actions */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between">
                        <div className="flex space-x-1">
                            <button
                                onClick={() => handleViewClick(type)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                title="View Details"
                                type="button"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                            
                            <button
                                onClick={() => handleEditClick(type)}
                                className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                                title="Edit"
                                type="button"
                            >
                                <Edit className="h-5 w-5" />
                            </button>
                            
                            <button
                                onClick={() => handleDeleteClick(type)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Delete"
                                type="button"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <button
                            onClick={() => handleToggleActive(type)}
                            className={`p-2 rounded-full ${type.is_active 
                                ? 'text-green-600 hover:bg-green-50' 
                                : 'text-gray-500 hover:bg-gray-50'}`}
                            title={type.is_active ? 'Deactivate' : 'Activate'}
                            type="button"
                        >
                            {type.is_active ? 
                                <ToggleRight className="h-6 w-6" /> : 
                                <ToggleLeft className="h-6 w-6" />
                            }
                        </button>
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

                {/* Training Type Modals */}
                <TrainingTypeModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Create New Training Type"
                    trainingType={currentTrainingType}
                    onChange={setCurrentTrainingType}
                    onSubmit={handleCreateSubmit}
                    mode="create"
                    errorMessages={errors}
                />

                <TrainingTypeModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="Edit Training Type"
                    trainingType={currentTrainingType}
                    onChange={setCurrentTrainingType}
                    onSubmit={handleUpdateSubmit}
                    mode="edit"
                    errorMessages={errors}
                />

                <TrainingTypeModal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    title="View Training Type"
                    trainingType={currentTrainingType}
                    onChange={setCurrentTrainingType}
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

    export default TrainingTypes;