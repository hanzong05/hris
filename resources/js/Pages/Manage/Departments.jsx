import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
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
    X
} from 'lucide-react';
import { debounce } from 'lodash';
import axios from 'axios';
import ConfirmModal from '@/Components/ConfirmModal';

const Departments = () => {
    // Make sure we safely access auth and user
    const { auth } = usePage().props || {};
    const user = auth?.user || {};
    
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [alertMessage, setAlertMessage] = useState(null);
    const [alertType, setAlertType] = useState('default'); // 'default', 'success', 'error'
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [newDepartment, setNewDepartment] = useState({ name: '', code: '', description: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        confirmVariant: 'destructive',
        onConfirm: () => {}
    });

    // Load departments
    const loadDepartments = useCallback(async () => {
        setLoading(true);
        try {
            // This is just a placeholder - you'll need to implement the API endpoint
            const response = await axios.get(`/departments?search=${searchTerm}`);
            setDepartments(response.data.data || []);
        } catch (error) {
            console.error('Error loading departments:', error);
            showAlert('Error loading departments', 'error');
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    // Load data on component mount
    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);

    // Show alert message
    const showAlert = (message, type = 'default') => {
        setAlertMessage(message);
        setAlertType(type);
        setTimeout(() => setAlertMessage(null), 3000);
    };

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((value) => {
            setSearchTerm(value);
        }, 300),
        []
    );

    const handleSearch = (e) => {
        debouncedSearch(e.target.value);
    };

    // Handle creating new department
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        
        // Validate
        if (!newDepartment.name || !newDepartment.code) {
            showAlert('Department name and code are required', 'error');
            return;
        }
        
        try {
            // This is just a placeholder - you'll need to implement the API endpoint
            const response = await axios.post('/api/departments', newDepartment);
            
            // Update departments list
            setDepartments([...departments, response.data]);
            
            // Reset form
            setNewDepartment({ name: '', code: '', description: '' });
            setIsCreating(false);
            
            showAlert('Department created successfully', 'success');
        } catch (error) {
            console.error('Error creating department:', error);
            showAlert(error.response?.data?.message || 'Error creating department', 'error');
        }
    };

    // Handle updating department
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        
        // Validate
        if (!editingDepartment.name || !editingDepartment.code) {
            showAlert('Department name and code are required', 'error');
            return;
        }
        
        try {
            // This is just a placeholder - you'll need to implement the API endpoint
            const response = await axios.put(`/api/departments/${editingDepartment.id}`, editingDepartment);
            
            // Update departments list
            setDepartments(departments.map(dept => 
                dept.id === editingDepartment.id ? response.data : dept
            ));
            
            // Reset editing state
            setEditingDepartment(null);
            
            showAlert('Department updated successfully', 'success');
        } catch (error) {
            console.error('Error updating department:', error);
            showAlert(error.response?.data?.message || 'Error updating department', 'error');
        }
    };

    // Handle deleting department
    const handleDelete = (department) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Department',
            message: `Are you sure you want to delete the department "${department.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'destructive',
            onConfirm: async () => {
                try {
                    // This is just a placeholder - you'll need to implement the API endpoint
                    await axios.delete(`/api/departments/${department.id}`);
                    
                    // Update departments list
                    setDepartments(departments.filter(dept => dept.id !== department.id));
                    
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showAlert('Department deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting department:', error);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showAlert(error.response?.data?.message || 'Error deleting department', 'error');
                }
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage Departments" />
            <div className="flex min-h-screen bg-gray-50/50">
                <Sidebar />
                <div className="flex-1 p-8">
                    <div className="max-w-6xl mx-auto">
                        {alertMessage && (
                            <Alert className={`mb-4 ${alertType === 'success' ? 'bg-green-50 border-green-200' : alertType === 'error' ? 'bg-red-50 border-red-200' : ''}`}>
                                <AlertDescription className={alertType === 'success' ? 'text-green-700' : alertType === 'error' ? 'text-red-700' : ''}>{alertMessage}</AlertDescription>
                            </Alert>
                        )}

                        {/* Header Section */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                    Manage Departments
                                </h1>
                                <p className="text-gray-600">
                                    Create, edit, and organize company departments.
                                </p>
                            </div>
                            <div>
                                <Button
                                    onClick={() => setIsCreating(true)}
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center"
                                    disabled={isCreating}
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add Department
                                </Button>
                            </div>
                        </div>

                        {/* Search Field */}
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Search departments..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onChange={handleSearch}
                                />
                            </div>
                        </div>

                        {/* Create/Edit Form */}
                        {isCreating && (
                            <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold">Add New Department</h2>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => setIsCreating(false)}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                                <form onSubmit={handleCreateSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={newDepartment.code}
                                                onChange={(e) => setNewDepartment({...newDepartment, code: e.target.value})}
                                                placeholder="e.g. HR, FIN, IT"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={newDepartment.name}
                                                onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                                                placeholder="e.g. Human Resources"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newDepartment.description}
                                            onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                                            placeholder="Brief description of the department's function"
                                            rows="2"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCreating(false)}
                                            className="mr-2"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Department
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {editingDepartment && (
                            <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold">Edit Department</h2>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => setEditingDepartment(null)}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                                <form onSubmit={handleUpdateSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={editingDepartment.code}
                                                onChange={(e) => setEditingDepartment({...editingDepartment, code: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={editingDepartment.name}
                                                onChange={(e) => setEditingDepartment({...editingDepartment, name: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editingDepartment.description}
                                            onChange={(e) => setEditingDepartment({...editingDepartment, description: e.target.value})}
                                            rows="2"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditingDepartment(null)}
                                            className="mr-2"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            Update Department
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Departments Table */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Code
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Department Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                                    Loading departments...
                                                </td>
                                            </tr>
                                        ) : departments.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                                    No departments found. Add a new department to get started.
                                                </td>
                                            </tr>
                                        ) : (
                                            departments.map((department) => (
                                                <tr key={department.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {department.code}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {department.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {department.description || 'No description provided'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                className="px-3 py-1 flex items-center"
                                                                onClick={() => setEditingDepartment(department)}
                                                            >
                                                                <Edit className="h-4 w-4 mr-1" />
                                                                Edit
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                className="px-3 py-1 flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                onClick={() => handleDelete(department)}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-1" />
                                                                Delete
                                                            </Button>
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
            </div>

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

export default Departments;