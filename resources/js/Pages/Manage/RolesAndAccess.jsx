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
    Users,
    UserCheck,
    Shield,
    Check,
    Lock
} from 'lucide-react';
import { debounce } from 'lodash';
import axios from 'axios';
import ConfirmModal from '@/Components/ConfirmModal';
import { Checkbox } from '@/components/ui/checkbox';

const RolesAndAccess = () => {
    // Make sure we safely access auth and user
    const { auth } = usePage().props || {};
    const user = auth?.user || {};
    
    const [activeTab, setActiveTab] = useState('roles');
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [alertMessage, setAlertMessage] = useState(null);
    const [alertType, setAlertType] = useState('default'); // 'default', 'success', 'error'
    
    // Role state
    const [editingRole, setEditingRole] = useState(null);
    const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] });
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    
    // User role assignment state
    const [editingUserRoles, setEditingUserRoles] = useState(null);
    const [isViewingPermissions, setIsViewingPermissions] = useState(false);
    const [viewingPermissionsForRole, setViewingPermissionsForRole] = useState(null);
    
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
            const [rolesResponse, usersResponse, permissionsResponse] = await Promise.all([
                axios.get(`/api/roles?search=${searchTerm}`),
                axios.get(`/api/users?search=${searchTerm}`),
                axios.get('/api/permissions')
            ]);
            
            setRoles(rolesResponse.data.data || []);
            setUsers(usersResponse.data.data || []);
            setPermissions(permissionsResponse.data.data || []);
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

    // ===== ROLE HANDLERS =====
    
    // Handle toggle permission selection
    const handlePermissionToggle = (permissionId) => {
        if (isCreatingRole) {
            setNewRole(prev => {
                const permissions = [...prev.permissions];
                if (permissions.includes(permissionId)) {
                    return { ...prev, permissions: permissions.filter(id => id !== permissionId) };
                } else {
                    return { ...prev, permissions: [...permissions, permissionId] };
                }
            });
        } else if (editingRole) {
            setEditingRole(prev => {
                const permissions = [...prev.permissions];
                if (permissions.includes(permissionId)) {
                    return { ...prev, permissions: permissions.filter(id => id !== permissionId) };
                } else {
                    return { ...prev, permissions: [...permissions, permissionId] };
                }
            });
        }
    };

    // Handle creating new role
    const handleCreateRoleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate
        if (!newRole.name) {
            showAlert('Role name is required', 'error');
            return;
        }
        
        try {
            // This is just a placeholder - you'll need to implement the API endpoint
            const response = await axios.post('/api/roles', newRole);
            
            // Update roles list
            setRoles([...roles, response.data]);
            
            // Reset form
            setNewRole({ name: '', description: '', permissions: [] });
            setIsCreatingRole(false);
            
            showAlert('Role created successfully', 'success');
        } catch (error) {
            console.error('Error creating role:', error);
            showAlert(error.response?.data?.message || 'Error creating role', 'error');
        }
    };

    // Handle updating role
    const handleUpdateRoleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate
        if (!editingRole.name) {
            showAlert('Role name is required', 'error');
            return;
        }
        
        try {
            // This is just a placeholder - you'll need to implement the API endpoint
            const response = await axios.put(`/api/roles/${editingRole.id}`, editingRole);
            
            // Update roles list
            setRoles(roles.map(role => 
                role.id === editingRole.id ? response.data : role
            ));
            
            // Reset editing state
            setEditingRole(null);
            
            showAlert('Role updated successfully', 'success');
        } catch (error) {
            console.error('Error updating role:', error);
            showAlert(error.response?.data?.message || 'Error updating role', 'error');
        }
    };

    // Handle deleting role
    const handleDeleteRole = (role) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Role',
            message: `Are you sure you want to delete the role "${role.name}"? This will remove this role from all users who have it. This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'destructive',
            onConfirm: async () => {
                try {
                    // This is just a placeholder - you'll need to implement the API endpoint
                    await axios.delete(`/api/roles/${role.id}`);
                    
                    // Update roles list
                    setRoles(roles.filter(r => r.id !== role.id));
                    
                    // Also update any users who had this role
                    setUsers(users.map(user => ({
                        ...user,
                        roles: user.roles.filter(r => r.id !== role.id)
                    })));
                    
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showAlert('Role deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting role:', error);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    showAlert(error.response?.data?.message || 'Error deleting role', 'error');
                }
            }
        });
    };

    // ===== USER ROLE ASSIGNMENT HANDLERS =====
    
    // Handle toggle role assignment
    const handleRoleAssignmentToggle = (roleId) => {
        setEditingUserRoles(prev => {
            const roles = [...prev.roles];
            if (roles.includes(roleId)) {
                return { ...prev, roles: roles.filter(id => id !== roleId) };
            } else {
                return { ...prev, roles: [...roles, roleId] };
            }
        });
    };

    // Handle updating user roles
    const handleUpdateUserRoles = async (e) => {
        e.preventDefault();
        
        try {
            // This is just a placeholder - you'll need to implement the API endpoint
            const response = await axios.put(`/api/users/${editingUserRoles.id}/roles`, {
                roles: editingUserRoles.roles
            });
            
            // Update users list
            setUsers(users.map(user => 
                user.id === editingUserRoles.id ? response.data : user
            ));
            
            // Reset editing state
            setEditingUserRoles(null);
            
            showAlert('User roles updated successfully', 'success');
        } catch (error) {
            console.error('Error updating user roles:', error);
            showAlert(error.response?.data?.message || 'Error updating user roles', 'error');
        }
    };

    // Group permissions by category
    const getPermissionsByCategory = () => {
        const categories = {};
        
        permissions.forEach(permission => {
            const category = permission.category || 'General';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(permission);
        });
        
        return categories;
    };

    // Get permission name by ID
    const getPermissionName = (permissionId) => {
        const permission = permissions.find(p => p.id === permissionId);
        return permission ? permission.name : 'Unknown Permission';
    };

    // Get role name by ID
    const getRoleName = (roleId) => {
        const role = roles.find(r => r.id === roleId);
        return role ? role.name : 'Unknown Role';
    };

    // Check if a permission is included in a role
    const isPermissionInRole = (permissionId, role) => {
        return role.permissions.includes(permissionId);
    };

    // Format user name
    const formatUserName = (user) => {
        return `${user.name} ${user.surname || ''}`.trim();
    };

    // View role permissions
    const handleViewPermissions = (role) => {
        setViewingPermissionsForRole(role);
        setIsViewingPermissions(true);
    };

    return (
        <AuthenticatedLayout user={user}>
            <Head title="Roles and Access Management" />
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
                                    Roles and Access Management
                                </h1>
                                <p className="text-gray-600">
                                    Manage user roles and permissions for system access.
                                </p>
                            </div>
                        </div>

                        {/* Tabs and Search */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                                <TabsList>
                                    <TabsTrigger value="roles" className="flex items-center">
                                        <Shield className="w-4 h-4 mr-2" />
                                        Roles
                                    </TabsTrigger>
                                    <TabsTrigger value="users" className="flex items-center">
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        User Assignments
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder={`Search ${activeTab === 'roles' ? 'roles' : 'users'}...`}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onChange={handleSearch}
                                    />
                                </div>
                                
                                {activeTab === 'roles' && (
                                    <Button
                                        onClick={() => setIsCreatingRole(true)}
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center whitespace-nowrap"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Add Role
                                    </Button>
                                )}
                            </div>
                        </div>

                        <TabsContent value="roles" className="mt-0">
                            {/* Create/Edit Role Form */}
                            {isCreatingRole && (
                                <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold">Add New Role</h2>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => setIsCreatingRole(false)}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <form onSubmit={handleCreateRoleSubmit}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={newRole.name}
                                                    onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                                                    placeholder="e.g. Administrator, Manager, Employee"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={newRole.description}
                                                    onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                                                    placeholder="Brief description of the role's purpose"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                                            <div className="bg-gray-50 p-4 rounded-md border max-h-72 overflow-y-auto">
                                                {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                                                    <div key={category} className="mb-4">
                                                        <h3 className="text-md font-medium text-gray-900 mb-2">{category}</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                            {categoryPermissions.map(permission => (
                                                                <div key={permission.id} className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`new-perm-${permission.id}`}
                                                                        checked={newRole.permissions.includes(permission.id)}
                                                                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                                                                    />
                                                                    <label
                                                                        htmlFor={`new-perm-${permission.id}`}
                                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                                    >
                                                                        {permission.name}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsCreatingRole(false)}
                                                className="mr-2"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="bg-blue-600 text-white hover:bg-blue-700"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Role
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {editingRole && (
                                <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold">Edit Role</h2>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => setEditingRole(null)}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <form onSubmit={handleUpdateRoleSubmit}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={editingRole.name}
                                                    onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={editingRole.description}
                                                    onChange={(e) => setEditingRole({...editingRole, description: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                                            <div className="bg-gray-50 p-4 rounded-md border max-h-72 overflow-y-auto">
                                                {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                                                    <div key={category} className="mb-4">
                                                        <h3 className="text-md font-medium text-gray-900 mb-2">{category}</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                            {categoryPermissions.map(permission => (
                                                                <div key={permission.id} className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`edit-perm-${permission.id}`}
                                                                        checked={isPermissionInRole(permission.id, editingRole)}
                                                                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                                                                    />
                                                                    <label
                                                                        htmlFor={`edit-perm-${permission.id}`}
                                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                                    >
                                                                        {permission.name}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setEditingRole(null)}
                                                className="mr-2"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="bg-blue-600 text-white hover:bg-blue-700"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                Update Role
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* View Role Permissions */}
                            {isViewingPermissions && viewingPermissionsForRole && (
                                <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold">Permissions for {viewingPermissionsForRole.name}</h2>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => {
                                                setIsViewingPermissions(false);
                                                setViewingPermissionsForRole(null);
                                            }}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-md border max-h-96 overflow-y-auto">
                                        {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => {
                                            const categoryHasPermissions = categoryPermissions.some(
                                                permission => viewingPermissionsForRole.permissions.includes(permission.id)
                                            );
                                            
                                            if (!categoryHasPermissions) return null;
                                            
                                            return (
                                                <div key={category} className="mb-4">
                                                    <h3 className="text-md font-medium text-gray-900 mb-2">{category}</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {categoryPermissions.map(permission => {
                                                            if (!viewingPermissionsForRole.permissions.includes(permission.id)) return null;
                                                            
                                                            return (
                                                                <div key={permission.id} className="flex items-center space-x-2 text-sm">
                                                                    <Check className="h-4 w-4 text-green-600" />
                                                                    <span>{permission.name}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="flex justify-end mt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIsViewingPermissions(false);
                                                setViewingPermissionsForRole(null);
                                            }}
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Roles Table */}
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Role Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Permissions
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
                                                    Loading users...
                                                </td>
                                            </tr>
                                        ) : users.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                                    No users found.
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {formatUserName(user)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {user.email}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.roles && user.roles.length > 0 ? (
                                                                user.roles.map(roleId => (
                                                                    <span key={roleId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                                        {getRoleName(roleId)}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">No roles assigned</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            className="px-3 py-1 flex items-center"
                                                            onClick={() => setEditingUserRoles({
                                                                ...user,
                                                                roles: user.roles || []
                                                            })}
                                                        >
                                                            <Lock className="h-4 w-4 mr-1" />
                                                            Manage Roles
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
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

export default RolesAndAccess;
                                       