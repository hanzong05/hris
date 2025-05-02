import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Sidebar from '@/Components/Sidebar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Search, 
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    Building,
    Layers
} from 'lucide-react';
import { debounce } from 'lodash';
import axios from 'axios';
import ConfirmModal from '@/Components/ConfirmModal';

const LineAndSection = () => {
    // Make sure we safely access auth and user
    const { auth } = usePage().props || {};
    const user = auth?.user || {};
    
    const [activeTab, setActiveTab] = useState('lines');
    const [lines, setLines] = useState([]);
    const [sections, setSections] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [alertMessage, setAlertMessage] = useState(null);
    const [alertType, setAlertType] = useState('default'); // 'default', 'success', 'error'
    
    // Line state
    const [editingLine, setEditingLine] = useState(null);
    const [newLine, setNewLine] = useState({ name: '', code: '', department_id: '' });
    const [isCreatingLine, setIsCreatingLine] = useState(false);
    
    // Section state
    const [editingSection, setEditingSection] = useState(null);
    const [newSection, setNewSection] = useState({ name: '', code: '', line_id: '' });
    const [isCreatingSection, setIsCreatingSection] = useState(false);
    
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
            // This is just a placeholder - you'll need to implement the API endpoints
            const [linesResponse, sectionsResponse, departmentsResponse] = await Promise.all([
                axios.get(`/api/lines?search=${searchTerm}`),
                axios.get(`/api/sections?search=${searchTerm}`),
                axios.get('/api/departments')
            ]);
            
            setLines(linesResponse.data.data || []);
            setSections(sectionsResponse.data.data || []);
            setDepartments(departmentsResponse.data.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
            showAlert('Error loading data', 'error');
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    // Load data on component mount
    useEffect(() => {
        loadData();
    }, [loadData]);

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

    // ===== LINE HANDLERS =====
    
    // Handle creating new line
    const handleCreateLineSubmit = async (e) => {
        e.preventDefault();
        
        // Validate
        if (!newLine.name || !newLine.code || !newLine.department_id) {
            showAlert('Line name, code and department are required', 'error');
            return;
        }
        
        try {
            // This is just a placeholder - you'll need to implement the API endpoint
            const response = await axios.post('/api/lines', newLine);
            
            // Update lines list
            setLines([...lines, response.data]);
            
            // Reset form
            setNewLine({ name: '', code: '', department_id: '' });
            setIsCreatingLine(false);
            
            showAlert('Line created successfully', 'success');
        } catch (error) {
            console.error('Error creating line:', error);
            showAlert(error.response?.data?.message || 'Error creating line', 'error');
        }
    };

    // Handle updating line
    const handleUpdateLineSubmit = async (e) => {
        e.preventDefault();
        
        // Validate
        if (!editingLine.name || !editingLine.code || !editingLine.department_id) {
            showAlert('Line name, code and department are required', 'error');
            return;
        }
        
        try {
            // This is just a placeholder - you'll need to implement the API endpoint
            const response = await axios.put(`/api/lines/${editingLine.id}`, editingLine);
            
            // Update lines list
            setLines(lines.map(line => 
                line.id === editingLine.id ? response.data : line
            ));
            
            // Reset editing state
            setEditingLine(null);
            
            showAlert('Line updated successfully', 'success');
        } catch (error) {
            console.error('Error updating line:', error);
            showAlert(error.response?.data?.message || 'Error updating line', 'error');
        }
    };

    // Handle deleting line
    const handleDeleteLine = (line) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Line',
            message: `Are you sure you want to delete the line "${line.name}"? This will also delete all sections associated with this line. This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'destructive',
            onConfirm: async () => {
                try {
                    // This is just a placeholder - you'll need to implement the API endpoint
                    await axios.delete(`/api/lines/${line.id}`);
                    
                    // Update lines list
                    setLines(lines.filter(l => l.id !== line.id));
                    
                    // Also remove any sections associated with this line
                    setSections(sections.filter(section => section.line_id !== line.id));
                    
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showAlert('Line deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting line:', error);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showAlert(error.response?.data?.message || 'Error deleting line', 'error');
                }
            }
        });
    };

    // ===== SECTION HANDLERS =====
    
    // Handle creating new section
    const handleCreateSectionSubmit = async (e) => {
        e.preventDefault();
        
        // Validate
        if (!newSection.name || !newSection.code || !newSection.line_id) {
            showAlert('Section name, code and line are required', 'error');
            return;
        }
        
        try {
            // This is just a placeholder - you'll need to implement the API endpoint
            const response = await axios.post('/api/sections', newSection);
            
            // Update sections list
            setSections([...sections, response.data]);
            
            // Reset form
            setNewSection({ name: '', code: '', line_id: '' });
            setIsCreatingSection(false);
            
            showAlert('Section created successfully', 'success');
        } catch (error) {
            console.error('Error creating section:', error);
            showAlert(error.response?.data?.message || 'Error creating section', 'error');
        }
    };

    // Handle updating section
    const handleUpdateSectionSubmit = async (e) => {
        e.preventDefault();
        
        // Validate
        if (!editingSection.name || !editingSection.code || !editingSection.line_id) {
            showAlert('Section name, code and line are required', 'error');
            return;
        }
        
        try {
            // This is just a placeholder - you'll need to implement the API endpoint
            const response = await axios.put(`/api/sections/${editingSection.id}`, editingSection);
            
            // Update sections list
            setSections(sections.map(section => 
                section.id === editingSection.id ? response.data : section
            ));
            
            // Reset editing state
            setEditingSection(null);
            
            showAlert('Section updated successfully', 'success');
        } catch (error) {
            console.error('Error updating section:', error);
            showAlert(error.response?.data?.message || 'Error updating section', 'error');
        }
    };

    // Handle deleting section
    const handleDeleteSection = (section) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Section',
            message: `Are you sure you want to delete the section "${section.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'destructive',
            onConfirm: async () => {
                try {
                    // This is just a placeholder - you'll need to implement the API endpoint
                    await axios.delete(`/api/sections/${section.id}`);
                    
                    // Update sections list
                    setSections(sections.filter(s => s.id !== section.id));
                    
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showAlert('Section deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting section:', error);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showAlert(error.response?.data?.message || 'Error deleting section', 'error');
                }
            }
        });
    };

    // Find department name by ID
    const getDepartmentName = (departmentId) => {
        const department = departments.find(dept => dept.id === departmentId);
        return department ? department.name : 'Unknown Department';
    };

    // Find line name by ID
    const getLineName = (lineId) => {
        const line = lines.find(line => line.id === lineId);
        return line ? line.name : 'Unknown Line';
    };

    return (
        <AuthenticatedLayout user={user}>
            <Head title="Manage Lines and Sections" />
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
                                    Manage Lines and Sections
                                </h1>
                                <p className="text-gray-600">
                                    Create, edit, and organize company lines and sections.
                                </p>
                            </div>
                        </div>

                        {/* Tabs and Search */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                                <TabsList>
                                    <TabsTrigger value="lines" className="flex items-center">
                                        <Building className="w-4 h-4 mr-2" />
                                        Lines
                                    </TabsTrigger>
                                    <TabsTrigger value="sections" className="flex items-center">
                                        <Layers className="w-4 h-4 mr-2" />
                                        Sections
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder={`Search ${activeTab === 'lines' ? 'lines' : 'sections'}...`}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onChange={handleSearch}
                                    />
                                </div>
                                
                                <Button
                                    onClick={() => activeTab === 'lines' ? setIsCreatingLine(true) : setIsCreatingSection(true)}
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center whitespace-nowrap"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add {activeTab === 'lines' ? 'Line' : 'Section'}
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="lines" className="mt-0">
                            {/* Create/Edit Line Form */}
                            {isCreatingLine && (
                                <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold">Add New Line</h2>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => setIsCreatingLine(false)}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <form onSubmit={handleCreateLineSubmit}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Line Code</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={newLine.code}
                                                    onChange={(e) => setNewLine({...newLine, code: e.target.value})}
                                                    placeholder="e.g. LINE1, L001"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Line Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={newLine.name}
                                                    onChange={(e) => setNewLine({...newLine, name: e.target.value})}
                                                    placeholder="e.g. Production Line 1"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                                <select
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={newLine.department_id}
                                                    onChange={(e) => setNewLine({...newLine, department_id: e.target.value})}
                                                    required
                                                >
                                                    <option value="">Select Department</option>
                                                    {departments.map(department => (
                                                        <option key={department.id} value={department.id}>
                                                            {department.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsCreatingLine(false)}
                                                className="mr-2"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="bg-blue-600 text-white hover:bg-blue-700"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Line
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {editingLine && (
                                <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold">Edit Line</h2>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => setEditingLine(null)}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <form onSubmit={handleUpdateLineSubmit}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Line Code</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={editingLine.code}
                                                    onChange={(e) => setEditingLine({...editingLine, code: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Line Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={editingLine.name}
                                                    onChange={(e) => setEditingLine({...editingLine, name: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                                <select
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={editingLine.department_id}
                                                    onChange={(e) => setEditingLine({...editingLine, department_id: e.target.value})}
                                                    required
                                                >
                                                    <option value="">Select Department</option>
                                                    {departments.map(department => (
                                                        <option key={department.id} value={department.id}>
                                                            {department.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setEditingLine(null)}
                                                className="mr-2"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="bg-blue-600 text-white hover:bg-blue-700"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                Update Line
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Lines Table */}
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Code
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Line Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Department
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
                                                    Loading lines...
                                                </td>
                                            </tr>
                                        ) : lines.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                                    No lines found. Add a new line to get started.
                                                </td>
                                            </tr>
                                        ) : (
                                            lines.map((line) => (
                                                <tr key={line.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {line.code}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {line.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {getDepartmentName(line.department_id)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                className="px-3 py-1 flex items-center"
                                                                onClick={() => setEditingLine(line)}
                                                            >
                                                                <Edit className="h-4 w-4 mr-1" />
                                                                Edit
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                className="px-3 py-1 flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                onClick={() => handleDeleteLine(line)}
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
                        </TabsContent>

                        <TabsContent value="sections" className="mt-0">
                            {/* Create/Edit Section Form */}
                            {isCreatingSection && (
                                <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold">Add New Section</h2>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => setIsCreatingSection(false)}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <form onSubmit={handleCreateSectionSubmit}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Section Code</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={newSection.code}
                                                    onChange={(e) => setNewSection({...newSection, code: e.target.value})}
                                                    placeholder="e.g. SEC1, S001"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={newSection.name}
                                                    onChange={(e) => setNewSection({...newSection, name: e.target.value})}
                                                    placeholder="e.g. Assembly Section"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Line</label>
                                                <select
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={newSection.line_id}
                                                    onChange={(e) => setNewSection({...newSection, line_id: e.target.value})}
                                                    required
                                                >
                                                    <option value="">Select Line</option>
                                                    {lines.map(line => (
                                                        <option key={line.id} value={line.id}>
                                                            {line.name} ({getDepartmentName(line.department_id)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsCreatingSection(false)}
                                                className="mr-2"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="bg-blue-600 text-white hover:bg-blue-700"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Section
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {editingSection && (
                                <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold">Edit Section</h2>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => setEditingSection(null)}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <form onSubmit={handleUpdateSectionSubmit}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Section Code</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={editingSection.code}
                                                    onChange={(e) => setEditingSection({...editingSection, code: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={editingSection.name}
                                                    onChange={(e) => setEditingSection({...editingSection, name: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Line</label>
                                                <select
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={editingSection.line_id}
                                                    onChange={(e) => setEditingSection({...editingSection, line_id: e.target.value})}
                                                    required
                                                >
                                                    <option value="">Select Line</option>
                                                    {lines.map(line => (
                                                        <option key={line.id} value={line.id}>
                                                            {line.name} ({getDepartmentName(line.department_id)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setEditingSection(null)}
                                                className="mr-2"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="bg-blue-600 text-white hover:bg-blue-700"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                Update Section
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Sections Table */}
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Code
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Section Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Line
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Department
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                    Loading sections...
                                                </td>
                                            </tr>
                                        ) : sections.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                    No sections found. Add a new section to get started.
                                                </td>
                                            </tr>
                                        ) : (
                                            sections.map((section) => {
                                                const line = lines.find(l => l.id === section.line_id) || {};
                                                return (
                                                    <tr key={section.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {section.code}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {section.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {getLineName(section.line_id)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {getDepartmentName(line.department_id)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex justify-end space-x-2">
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    className="px-3 py-1 flex items-center"
                                                                    onClick={() => setEditingSection(section)}
                                                                >
                                                                    <Edit className="h-4 w-4 mr-1" />
                                                                    Edit
                                                                </Button>
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    className="px-3 py-1 flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                    onClick={() => handleDeleteSection(section)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
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

export default LineAndSection;