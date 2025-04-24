import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Sidebar from '@/Components/Sidebar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Search, 
    Save,
    Plus,
    Edit,
    CheckCircle,
    ArrowLeft,
    Star
} from 'lucide-react';
import { debounce } from 'lodash';
import axios from 'axios';

const EditableCell = ({ value, isEditing, onChange, onSave, field, onKeyDown }) => {
    const [localValue, setLocalValue] = useState(value.toString());
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    React.useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const handleChange = (e) => {
        setLocalValue(e.target.value);
        if (onChange) {
            onChange(e.target.value);
        }
    };

    const handleBlur = () => {
        if (onSave) {
            onSave(localValue);
        }
    };

    const handleKeyDown = (e) => {
        // Handle Enter key to save
        if (e.key === 'Enter') {
            if (onSave) {
                onSave(localValue);
            }
            e.preventDefault();
        }
        
        // Pass keyboard events up to parent for navigation
        if (onKeyDown) {
            onKeyDown(e, field);
        }
    };

    return isEditing ? (
        <input
            ref={inputRef}
            type="number"
            step="0.01"
            min="0"
            className="w-full p-1 border rounded text-right"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            data-field={field}
        />
    ) : (
        <div className="p-2 text-right text-gray-700 cursor-pointer hover:bg-gray-100">
            {parseFloat(value).toFixed(2)}
        </div>
    );
};

const EmployeeDefaultsPage = () => {
    // Make sure we safely access auth and user
    const { auth } = usePage().props || {};
    const user = auth?.user || {};
    
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [alertMessage, setAlertMessage] = useState(null);
    const [editingCell, setEditingCell] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Define benefit fields for keyboard navigation and editing
    const benefitFields = [
        'advances', 'charges', 'uniform', 'mf_shares', 'mf_loan',
        'sss_loan', 'hmdf_loan', 'hmdf_prem', 'sss_prem', 'philhealth'
    ];

    // Load employee defaults
    const loadEmployeeDefaults = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/employee-defaults?search=${searchTerm}&page=${currentPage}`);
            setEmployees(response.data.data);
            setCurrentPage(response.data.current_page);
            setLastPage(response.data.last_page);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Error loading employee defaults:', error);
            setAlertMessage('Error loading employee defaults');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, currentPage]);

    // Load data on component mount and when dependencies change
    useEffect(() => {
        loadEmployeeDefaults();
    }, [loadEmployeeDefaults]);

    // Debounced search to prevent too many requests
    const debouncedSearch = useCallback(
        debounce((value) => {
            setSearchTerm(value);
            setCurrentPage(1); // Reset to first page on new search
        }, 300),
        []
    );

    const handleSearch = (e) => {
        debouncedSearch(e.target.value);
    };

    const handleEditCell = (employeeId, benefitId, field) => {
        if (!benefitId) return; // No benefit to edit
        
        setEditingCell({
            employeeId,
            benefitId,
            field
        });
    };

    // Handle keyboard navigation
    const handleKeyNavigation = (e, currentField) => {
        if (!editingCell) return;
        
        const { employeeId, benefitId } = editingCell;
        const fieldIndex = benefitFields.indexOf(currentField);
        
        if (fieldIndex === -1) return;
        
        let newFieldIndex = fieldIndex;
        
        // Handle navigation
        switch (e.key) {
            case 'ArrowRight':
                newFieldIndex = Math.min(fieldIndex + 1, benefitFields.length - 1);
                e.preventDefault();
                break;
            case 'ArrowLeft':
                newFieldIndex = Math.max(0, fieldIndex - 1);
                e.preventDefault();
                break;
            case 'Tab':
                if (e.shiftKey) {
                    // Shift+Tab (move left)
                    newFieldIndex = Math.max(0, fieldIndex - 1);
                } else {
                    // Tab (move right)
                    newFieldIndex = Math.min(fieldIndex + 1, benefitFields.length - 1);
                }
                e.preventDefault();
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                // Find current employee index
                const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
                if (employeeIndex === -1) return;
                
                // Determine next employee index
                const nextEmployeeIndex = e.key === 'ArrowUp' 
                    ? Math.max(0, employeeIndex - 1) 
                    : Math.min(employees.length - 1, employeeIndex + 1);
                
                // Don't do anything if we're at the edge
                if (nextEmployeeIndex === employeeIndex) return;
                
                // Save current field before moving
                const inputElement = document.querySelector(`input[data-field="${currentField}"]`);
                if (inputElement && editingCell) {
                    handleCellSave(benefitId, currentField, inputElement.value);
                }
                
                // Get next employee and its benefit
                const nextEmployee = employees[nextEmployeeIndex];
                const nextBenefit = getEmployeeDefaultBenefit(nextEmployee);
                
                if (nextBenefit) {
                    // Move to same field in next employee
                    setEditingCell({
                        employeeId: nextEmployee.id,
                        benefitId: nextBenefit.id,
                        field: currentField
                    });
                }
                e.preventDefault();
                return;
            default:
                return; // Don't navigate for other keys
        }
        
        // Move to new field if changed
        if (newFieldIndex !== fieldIndex) {
            // Save current field first
            const inputElement = document.querySelector(`input[data-field="${currentField}"]`);
            if (inputElement) {
                handleCellSave(benefitId, currentField, inputElement.value);
            }
            
            // Set new editing field
            setEditingCell({
                employeeId,
                benefitId,
                field: benefitFields[newFieldIndex]
            });
        }
    };

    const handleCellSave = async (benefitId, field, value) => {
        try {
            const response = await axios.patch(`/benefits/${benefitId}/field`, { 
                field: field,
                value: value
            });
            
            // Update the employees state to reflect the change
            setEmployees(currentEmployees => 
                currentEmployees.map(employee => {
                    if (employee.benefits && employee.benefits.length > 0 && employee.benefits[0].id === benefitId) {
                        const updatedBenefits = [...employee.benefits];
                        updatedBenefits[0] = response.data;
                        return { ...employee, benefits: updatedBenefits };
                    }
                    return employee;
                })
            );
            
            setAlertMessage('Default benefit updated successfully');
            setTimeout(() => setAlertMessage(null), 3000);
        } catch (error) {
            console.error('Error updating benefit:', error);
            setAlertMessage(error.response?.data?.message || 'Error updating benefit');
        }
        
        setEditingCell(null);
    };

    // Create new default benefit for an employee
    const createDefaultBenefit = async (employeeId) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const response = await axios.post('/benefits', {
                employee_id: employeeId,
                cutoff: '1st', // Doesn't matter for defaults
                date: today,
                is_default: true
            });
            
            // Update the employees state to add the new benefit
            setEmployees(currentEmployees => 
                currentEmployees.map(employee => {
                    if (employee.id === employeeId) {
                        return { 
                            ...employee, 
                            benefits: [response.data, ...(employee.benefits || [])] 
                        };
                    }
                    return employee;
                })
            );
            
            setAlertMessage('New default benefit created');
            setTimeout(() => setAlertMessage(null), 3000);
        } catch (error) {
            console.error('Error creating default benefit:', error);
            setAlertMessage(error.response?.data?.message || 'Error creating default benefit');
        }
    };

    // Format employee name
    const formatEmployeeName = (employee) => {
        return `${employee.Lname}, ${employee.Fname} ${employee.MName || ''}`.trim();
    };

    // Get default benefit for an employee or null if none exists
    const getEmployeeDefaultBenefit = (employee) => {
        return employee.benefits && employee.benefits.length > 0 ? employee.benefits[0] : null;
    };

    // Handle pagination
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <AuthenticatedLayout user={user}>
            <Head title="Employee Default Benefits" />
            <div className="flex min-h-screen bg-gray-50/50">
                <Sidebar />
                <div className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        {alertMessage && (
                            <Alert className="mb-4">
                                <AlertDescription>{alertMessage}</AlertDescription>
                            </Alert>
                        )}

                        {/* Header Section */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                    Employee Default Benefits
                                </h1>
                                <p className="text-gray-600">
                                    Manage default benefit values that will be used for new benefit entries.
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Button
                                    onClick={() => router.visit('/benefits')}
                                    className="px-5 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors duration-200 flex items-center"
                                >
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                    Back to Benefits
                                </Button>
                            </div>
                        </div>

                        {/* Search Field */}
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onChange={handleSearch}
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Employee
                                            </th>
                                            {benefitFields.map((field) => (
                                                <th key={field} scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {field.replace('_', ' ')}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="12" className="px-4 py-4 text-center text-gray-500">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : employees.length === 0 ? (
                                            <tr>
                                                <td colSpan="12" className="px-4 py-4 text-center text-gray-500">
                                                    No employees found
                                                </td>
                                            </tr>
                                        ) : (
                                            employees.map((employee) => {
                                                const benefit = getEmployeeDefaultBenefit(employee);
                                                
                                                return (
                                                    <tr key={employee.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="flex space-x-2">
                                                                {benefit ? (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="p-2 bg-yellow-50"
                                                                        title="Default Values Set"
                                                                    >
                                                                        <Star className="h-4 w-4 text-yellow-500" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="p-2"
                                                                        onClick={() => createDefaultBenefit(employee.id)}
                                                                        title="Create Default Values"
                                                                    >
                                                                        <Plus className="h-4 w-4 text-blue-600" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                        
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {formatEmployeeName(employee)}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {employee.Department || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        
                                                        {/* Benefit cells */}
                                                        {benefitFields.map((field) => (
                                                            <td 
                                                                key={field} 
                                                                className="px-4 py-3 whitespace-nowrap relative"
                                                                onClick={() => benefit && handleEditCell(employee.id, benefit.id, field)}
                                                            >
                                                                {benefit ? (
                                                                    <EditableCell 
                                                                        value={benefit[field] || 0}
                                                                        isEditing={
                                                                            editingCell?.employeeId === employee.id && 
                                                                            editingCell?.benefitId === benefit.id && 
                                                                            editingCell?.field === field
                                                                        }
                                                                        onSave={(value) => handleCellSave(benefit.id, field, value)}
                                                                        onKeyDown={handleKeyNavigation}
                                                                        field={field}
                                                                    />
                                                                ) : (
                                                                    <div className="p-2 text-right text-gray-400">0.00</div>
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination */}
                            {total > 0 && (
                                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{(currentPage - 1) * 50 + 1}</span> to{' '}
                                                <span className="font-medium">
                                                    {Math.min(currentPage * 50, total)}
                                                </span>{' '}
                                                of <span className="font-medium">{total}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                {/* Previous Page Button */}
                                                <button
                                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                                    disabled={currentPage === 1}
                                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                                        currentPage === 1
                                                            ? 'text-gray-300 cursor-not-allowed'
                                                            : 'text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    Previous
                                                </button>
                                                
                                                {/* Page Numbers */}
                                                {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                                                    // Show pages around current page
                                                    const pageOffset = Math.max(0, currentPage - 3);
                                                    const pageNum = i + 1 + pageOffset;
                                                    if (pageNum > lastPage) return null;
                                                    
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => handlePageChange(pageNum)}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                currentPage === pageNum
                                                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                                
                                                {/* Next Page Button */}
                                                <button
                                                    onClick={() => handlePageChange(Math.min(lastPage, currentPage + 1))}
                                                    disabled={currentPage === lastPage}
                                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                                        currentPage === lastPage
                                                            ? 'text-gray-300 cursor-not-allowed'
                                                            : 'text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    Next
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default EmployeeDefaultsPage;