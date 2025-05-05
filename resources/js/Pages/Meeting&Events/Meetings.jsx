// Fix the imports at the top of your file
import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Sidebar from '@/Components/Sidebar';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2,
    CalendarPlus,
    Eye,
    X,
    Shield,
    ShieldOff,
    Check,
    Calendar,
    Users,
    AlertCircle,
    Clock,
    MapPin,
    User,
    FileText,
    XCircle,
    CheckCircle,
    AlertTriangle,
    Video,
    Link
} from 'lucide-react';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
// Fix the tabs import with proper case
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import Modal from '@/Components/Modal';
import ConfirmModal from '@/Components/ConfirmModal';

// StatusCard Component
const StatusCard = ({ title, count, icon, bgColor = 'bg-white', textColor = 'text-gray-600' }) => {
  return (
    <div className={`${bgColor} shadow rounded-lg p-5 flex items-center justify-between`}>
      <div>
        <p className={`text-sm ${textColor} font-medium`}>{title}</p>
        <p className="text-3xl font-bold">{count}</p>
      </div>
      <div className="rounded-full p-3">
        {icon}
      </div>
    </div>
  );
};

// ViewMeetingModal Component
const ViewMeetingModal = ({ isOpen, onClose, meeting }) => {
    if (!isOpen || !meeting) return null;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title="Meeting Details"
        >
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div>
                    <h2 className="text-xl font-bold mb-2">{meeting.title}</h2>
                    <div className="flex items-center text-gray-600 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                            {formatDate(meeting.start_time)} - {formatDate(meeting.end_time)}
                        </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{meeting.location || 'No location specified'}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-2">
                        <User className="h-4 w-4 mr-2" />
                        <span>Organizer: {meeting.organizer}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-4">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Department: {meeting.department || 'All Departments'}</span>
                    </div>

                    <div className="mb-4">
                        {(() => {
                            switch(meeting.status) {
                                case 'Scheduled':
                                    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Scheduled
                                    </span>;
                                case 'Completed':
                                    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Completed
                                    </span>;
                                case 'Cancelled':
                                    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Cancelled
                                    </span>;
                                case 'Postponed':
                                    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Postponed
                                    </span>;
                                default:
                                    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {meeting.status}
                                    </span>;
                            }
                        })()}
                        
                        {meeting.is_recurring && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ml-2">
                                <Calendar className="w-3 h-3 mr-1" />
                                Recurring
                            </span>
                        )}
                    </div>

                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-1">Agenda</h3>
                        <p className="text-gray-700 whitespace-pre-line">{meeting.agenda || 'No agenda provided.'}</p>
                    </div>

                    {meeting.is_recurring && meeting.recurrence_pattern && (
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-1">Recurrence Pattern</h3>
                            <p className="text-gray-700">{meeting.recurrence_pattern}</p>
                        </div>
                    )}

                    {meeting.meeting_link && (
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-1">Meeting Link</h3>
                            <a 
                                href={meeting.meeting_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center"
                            >
                                <Video className="h-4 w-4 mr-1" />
                                Join Meeting
                            </a>
                        </div>
                    )}

                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Participants ({meeting.participants_count || 0})</h3>
                        {meeting.participants && meeting.participants.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {meeting.participants.map((participant) => (
                                            <tr key={participant.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {`${participant.Lname}, ${participant.Fname}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {participant.Department || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${participant.pivot.attendance_status === 'Attended' ? 'bg-green-100 text-green-800' : 
                                                        participant.pivot.attendance_status === 'Absent' ? 'bg-red-100 text-red-800' :
                                                        participant.pivot.attendance_status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                                        participant.pivot.attendance_status === 'Declined' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'}`}
                                                    >
                                                        {participant.pivot.attendance_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500">No participants added to this meeting.</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                <Button 
                    onClick={onClose}
                    className="w-full sm:w-auto"
                >
                    Close
                </Button>
            </div>
        </Modal>
    );
};

// Meeting Form Component
const MeetingForm = ({ isOpen, onClose, meeting = null, mode = 'create' }) => {
    const [formData, setFormData] = useState({
        title: '',
        agenda: '',
        start_time: '',
        end_time: '',
        location: '',
        organizer: '',
        department: '',
        status: 'Scheduled',
        is_recurring: false,
        recurrence_pattern: '',
        meeting_link: '',
        participants: []
    });
    const [errors, setErrors] = useState({});
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [availableEmployees, setAvailableEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Fetch available employees when modal opens
        if (isOpen) {
            fetch('/meetings/get-employees')
                .then(response => response.json())
                .then(data => {
                    setAvailableEmployees(data);
                })
                .catch(error => console.error('Error fetching employees:', error));
        }
    }, [isOpen]);

    useEffect(() => {
        if (meeting) {
            // Format dates for input fields
            const startTime = meeting.start_time ? new Date(meeting.start_time) : '';
            const endTime = meeting.end_time ? new Date(meeting.end_time) : '';
            
            setFormData({
                ...meeting,
                start_time: startTime ? startTime.toISOString().slice(0, 16) : '',
                end_time: endTime ? endTime.toISOString().slice(0, 16) : '',
                participants: meeting.participants ? meeting.participants.map(p => p.id) : []
            });
            
            if (meeting.participants) {
                setSelectedEmployees(meeting.participants);
            }
        } else {
            // Default for new meeting
            setFormData({
                title: '',
                agenda: '',
                start_time: '',
                end_time: '',
                location: '',
                organizer: '',
                department: '',
                status: 'Scheduled',
                is_recurring: false,
                recurrence_pattern: '',
                meeting_link: '',
                participants: []
            });
            setSelectedEmployees([]);
        }
    }, [meeting]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Clone formData to include participants
        const submitData = {
            ...formData,
            participants: selectedEmployees.map(emp => emp.id)
        };
        
        if (mode === 'create') {
            router.post('/meetings', submitData, {
                onError: (errors) => {
                    setErrors(errors);
                },
                onSuccess: () => {
                    onClose();
                },
            });
        } else {
            router.put(`/meetings/${meeting.id}`, submitData, {
                onError: (errors) => {
                    setErrors(errors);
                },
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleAddEmployee = (employee) => {
        if (!selectedEmployees.find(e => e.id === employee.id)) {
            setSelectedEmployees([...selectedEmployees, employee]);
            setFormData(prev => ({
                ...prev,
                participants: [...prev.participants, employee.id]
            }));
        }
        setSearchTerm('');
    };

    const handleRemoveEmployee = (employeeId) => {
        setSelectedEmployees(selectedEmployees.filter(e => e.id !== employeeId));
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.filter(id => id !== employeeId)
        }));
    };

    const filteredEmployees = availableEmployees.filter(employee => 
        !selectedEmployees.some(selected => selected.id === employee.id) &&
        (employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         employee.department?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title={mode === 'create' ? 'Schedule New Meeting' : 'Edit Meeting'}
        >
            <form onSubmit={handleSubmit} className="p-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                    {/* Basic Information */}
                    <div className="col-span-2">
                        <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                    </div>
                    
                    <div className="col-span-2">
                        <label htmlFor="title" className="block text-sm font-medium mb-1">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                            value={formData.title}
                            onChange={handleChange}
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div className="col-span-2">
                        <label htmlFor="agenda" className="block text-sm font-medium mb-1">
                            Agenda
                        </label>
                        <textarea
                            id="agenda"
                            name="agenda"
                            rows={3}
                            className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.agenda}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Scheduling Information */}
                    <div className="col-span-2">
                        <h3 className="text-lg font-semibold mb-3 mt-4">Scheduling</h3>
                    </div>
                    
                    <div>
                        <label htmlFor="start_time" className="block text-sm font-medium mb-1">
                            Start Date & Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="start_time"
                            name="start_time"
                            type="datetime-local"
                            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.start_time ? 'border-red-500' : 'border-gray-300'}`}
                            value={formData.start_time}
                            onChange={handleChange}
                        />
                        {errors.start_time && <p className="mt-1 text-sm text-red-500">{errors.start_time}</p>}
                    </div>

                    <div>
                        <label htmlFor="end_time" className="block text-sm font-medium mb-1">
                            End Date & Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="end_time"
                            name="end_time"
                            type="datetime-local"
                            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.end_time ? 'border-red-500' : 'border-gray-300'}`}
                            value={formData.end_time}
                            onChange={handleChange}
                        />
                        {errors.end_time && <p className="mt-1 text-sm text-red-500">{errors.end_time}</p>}
                    </div>

                    <div>
                        <label htmlFor="location" className="block text-sm font-medium mb-1">
                            Location
                        </label>
                        <input
                            id="location"
                            name="location"
                            type="text"
                            className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.location}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium mb-1">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Postponed">Postponed</option>
                        </select>
                    </div>

                    <div className="col-span-2">
                        <div className="flex items-center mb-2">
                            <input
                                id="is_recurring"
                                name="is_recurring"
                                type="checkbox"
                                checked={formData.is_recurring}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-900">
                                This is a recurring meeting
                            </label>
                        </div>
                        
                        {formData.is_recurring && (
                            <div>
                                <select
                                    id="recurrence_pattern"
                                    name="recurrence_pattern"
                                    className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.recurrence_pattern}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Recurrence Pattern</option>
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Bi-weekly">Bi-weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Custom">Custom</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="col-span-2">
                        <label htmlFor="meeting_link" className="block text-sm font-medium mb-1">
                            Meeting Link
                        </label>
                        <input
                            id="meeting_link"
                            name="meeting_link"
                            type="url"
                            className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.meeting_link}
                            onChange={handleChange}
                            placeholder="https://"
                        />
                    </div>

                    {/* Meeting Details */}
                    <div className="col-span-2">
                        <h3 className="text-lg font-semibold mb-3 mt-4">Meeting Details</h3>
                    </div>

                    <div>
                        <label htmlFor="organizer" className="block text-sm font-medium mb-1">
                            Organizer <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="organizer"
                            name="organizer"
                            type="text"
                            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.organizer ? 'border-red-500' : 'border-gray-300'}`}
                            value={formData.organizer}
                            onChange={handleChange}
                        />
                        {errors.organizer && <p className="mt-1 text-sm text-red-500">{errors.organizer}</p>}
                    </div>

                    <div>
                        <label htmlFor="department" className="block text-sm font-medium mb-1">
                            Department
                        </label>
                        <input
                            id="department"
                            name="department"
                            type="text"
                            className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.department}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Participants Section */}
                    <div className="col-span-2">
                        <h3 className="text-lg font-semibold mb-3 mt-4">Participants</h3>
                    </div>

                    <div className="col-span-2">
                        <div className="border rounded-lg p-4">
                            <div className="mb-4">
                                <label htmlFor="searchEmployees" className="block text-sm font-medium mb-1">
                                    Search Employees
                                </label>
                                <div className="relative">
                                    <input
                                        id="searchEmployees"
                                        type="text"
                                        className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Search by name or department..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && filteredEmployees.length > 0 && (
                                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
                                            {filteredEmployees.map(employee => (
                                                <div
                                                    key={employee.id}
                                                    className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                                    onClick={() => handleAddEmployee(employee)}
                                                >
                                                    <div>
                                                        <div className="font-medium">{employee.name}</div>
                                                        <div className="text-sm text-gray-500">{employee.department}</div>
                                                    </div>
                                                    <Button 
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-full"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-2">Selected Participants ({selectedEmployees.length})</h4>
                                {selectedEmployees.length > 0 ? (
                                    <div className="border rounded-md overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                                    <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {selectedEmployees.map(employee => (
                                                    <tr key={employee.id}>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{employee.department || '-'}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                                            <Button 
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-800"
                                                                onClick={() => handleRemoveEmployee(employee.id)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No participants selected.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                    <Button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        {mode === 'create' ? 'Schedule Meeting' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

// Meeting List Component
const MeetingList = ({ meetings, onEdit, onDelete, onView, onMarkCompleted, onMarkCancelled, onMarkScheduled }) => {
    if (!meetings?.length) {
        return <div className="p-4 text-center text-gray-500">No meetings found</div>;
    }
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const getStatusBadge = (status) => {
        switch(status) {
            case 'Scheduled':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Calendar className="w-3 h-3 mr-1" />
                    Scheduled
                </span>;
            case 'Completed':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                </span>;
            case 'Cancelled':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Cancelled
                </span>;
            case 'Postponed':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Postponed
                </span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {status}
                </span>;
        }
    };

    return (
        <div className="overflow-x-auto" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Organizer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Participants
                        </th>
                    </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                    {meetings.map((meeting) => (
                        <tr key={meeting.id} className={`hover:bg-gray-50 ${
                            meeting.status === 'Cancelled' ? 'bg-red-50' : 
                            meeting.status === 'Postponed' ? 'bg-yellow-50' : ''
                        }`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                    <Button 
                                        variant="outline"
                                        className="p-2"
                                        onClick={() => onView(meeting)}
                                        title="View Meeting"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>

                                    <Button 
                                        variant="secondary" 
                                        className="p-2"
                                        onClick={() => onEdit(meeting)}
                                        title="Edit Meeting"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    
                                    {meeting.status !== 'Completed' && (
                                        <Button 
                                            variant="default"
                                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white"
                                            onClick={() => onMarkCompleted(meeting.id)}
                                            title="Mark as Completed"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                    )}
                                    
                                    {meeting.status !== 'Cancelled' && (
                                        <Button 
                                            variant="destructive"
                                            className="p-2"
                                            onClick={() => onMarkCancelled(meeting.id)}
                                            title="Cancel Meeting"
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    )}
                                    
                                    {(meeting.status === 'Cancelled' || meeting.status === 'Postponed') && (
                                        <Button 
                                            variant="default"
                                            className="p-2 bg-green-500 hover:bg-green-600 text-white"
                                            onClick={() => onMarkScheduled(meeting.id)}
                                            title="Mark as Scheduled"
                                        >
                                            <Calendar className="h-4 w-4" />
                                        </Button>
                                    )}
                                    
                                    <Button 
                                        variant="destructive"
                                        className="p-2"
                                        onClick={() => onDelete(meeting.id)}
                                        title="Delete Meeting"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meeting.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(meeting.start_time)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(meeting.status)}
                                {meeting.is_recurring && 
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ml-1">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Recurring
                                    </span>
                                }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {meeting.location || (meeting.meeting_link ? 
                                    <span className="inline-flex items-center text-blue-600">
                                        <Video className="h-4 w-4 mr-1" />
                                        Virtual
                                    </span> : '-')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meeting.organizer}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meeting.participants_count || 0}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const MeetingPage = ({ meetings: initialMeetings, counts, currentStatus = 'all', flash }) => {
    const { auth } = usePage().props;
    const [filteredMeetings, setFilteredMeetings] = useState(initialMeetings || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [formMode, setFormMode] = useState('create');
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        confirmVariant: 'destructive',
        onConfirm: () => {}
    });
    
    const [activeTab, setActiveTab] = useState(currentStatus || 'all');

    useEffect(() => {
        let filtered = initialMeetings || [];
        
        // Filter by status tab
        if (activeTab !== 'all') {
            filtered = filtered.filter(meeting => meeting.status === activeTab);
        }
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(meeting => 
                meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                meeting.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                meeting.organizer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                meeting.department?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredMeetings(filtered);
    }, [searchTerm, initialMeetings, activeTab]);

    const handleView = (meeting) => {
        setSelectedMeeting(meeting);
        setViewModalOpen(true);
    };

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Meeting',
            message: 'Are you sure you want to delete this meeting? This action cannot be undone.',
            confirmText: 'Delete',
            confirmVariant: 'destructive',
            onConfirm: () => {
                router.delete(`/meetings/${id}`);
                setConfirmModal({...confirmModal, isOpen: false});
            }
        });
    };
    
    const handleMarkCompleted = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Mark Meeting as Completed',
            message: 'Are you sure you want to mark this meeting as completed?',
            confirmText: 'Mark Completed',
            confirmVariant: 'default',
            onConfirm: () => {
                router.post(`/meetings/${id}/mark-completed`, {}, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        setConfirmModal({...confirmModal, isOpen: false});
                    }
                });
            }
        });
    };

    const handleMarkCancelled = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Cancel Meeting',
            message: 'Are you sure you want to cancel this meeting?',
            confirmText: 'Cancel Meeting',
            confirmVariant: 'destructive',
            onConfirm: () => {
                router.post(`/meetings/${id}/mark-cancelled`, {}, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        setConfirmModal({...confirmModal, isOpen: false});
                    }
                });
            }
        });
    };

    const handleMarkScheduled = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Reschedule Meeting',
            message: 'Are you sure you want to mark this meeting as scheduled?',
            confirmText: 'Schedule',
            confirmVariant: 'default',
            onConfirm: () => {
                router.post(`/meetings/${id}/mark-scheduled`, {}, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        setConfirmModal({...confirmModal, isOpen: false});
                    }
                });
            }
        });
    };
    
    const handleTabChange = (value) => {
        setActiveTab(value);
        
        // Use Inertia's visit instead of router.get to prevent full page reload
        router.visit(`/meetings?status=${value}`, {
            preserveState: true,
            preserveScroll: true,
            only: ['meetings', 'currentStatus']
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Meeting Management" />
            <div className="flex min-h-screen bg-gray-50/50">
                <Sidebar />
                <div className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        {flash?.message && (
                            <Alert className="mb-4">
                                <AlertDescription>{flash.message}</AlertDescription>
                            </Alert>
                        )}

                        {/* Header Section */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                    Meeting Management
                                </h1>
                                <p className="text-gray-600">
                                    Schedule and manage company meetings.
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Button
                                    onClick={() => {
                                        setFormMode('create');
                                        setSelectedMeeting(null);
                                        setIsFormOpen(true);
                                    }}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors duration-200 flex items-center"
                                >
                                    <CalendarPlus className="w-5 h-5 mr-2" />
                                    Schedule Meeting
                                </Button>
                            </div>
                        </div>
                        
                        {/* Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <StatusCard 
                                title="Total Meetings" 
                                count={counts.total}
                                icon={<Calendar className="h-6 w-6 text-indigo-600" />}
                                bgColor="bg-white"
                                textColor="text-gray-600"
                            />
                            <StatusCard 
                                title="Scheduled" 
                                count={counts.scheduled}
                                icon={<Clock className="h-6 w-6 text-green-600" />}
                                bgColor="bg-white"
                                textColor="text-gray-600"
                            />
                            <StatusCard 
                                title="Completed" 
                                count={counts.completed}
                                icon={<CheckCircle className="h-6 w-6 text-blue-600" />}
                                bgColor="bg-white" 
                                textColor="text-gray-600"
                            />
                            <StatusCard 
                                title="Cancelled" 
                                count={counts.cancelled}
                                icon={<XCircle className="h-6 w-6 text-red-600" />}
                                bgColor="bg-white"
                                textColor="text-gray-600"
                            />
                        </div>

                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Search meetings..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        {/* Tabs for filtering by status */}
                        <Tabs defaultValue={activeTab} className="mb-6" onValueChange={handleTabChange}>
                            <TabsList className="grid grid-cols-5 w-full">
                                <TabsTrigger value="all">All Meetings</TabsTrigger>
                                <TabsTrigger value="Scheduled">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Scheduled
                                </TabsTrigger>
                                <TabsTrigger value="Completed">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Completed
                                </TabsTrigger>
                                <TabsTrigger value="Cancelled">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancelled
                                </TabsTrigger>
                                <TabsTrigger value="Postponed">
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Postponed
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="bg-white rounded-lg shadow">
                            <MeetingList
                                meetings={filteredMeetings}
                                onView={handleView}
                                onEdit={(meeting) => {
                                    setSelectedMeeting(meeting);
                                    setFormMode('edit');
                                    setIsFormOpen(true);
                                }}
                                onDelete={handleDelete}
                                onMarkCompleted={handleMarkCompleted}
                                onMarkCancelled={handleMarkCancelled}
                                onMarkScheduled={handleMarkScheduled}
                            />
                        </div>

                        <ViewMeetingModal
                            isOpen={viewModalOpen}
                            onClose={() => {
                                setViewModalOpen(false);
                                setSelectedMeeting(null);
                            }}
                            meeting={selectedMeeting}
                        />

                        <MeetingForm
                            isOpen={isFormOpen}
                            onClose={() => {
                                setIsFormOpen(false);
                                setSelectedMeeting(null);
                            }}
                            meeting={selectedMeeting}
                            mode={formMode}
                        />
                        
                        <ConfirmModal
                            isOpen={confirmModal.isOpen}
                            onClose={() => setConfirmModal({...confirmModal, isOpen: false})}
                            title={confirmModal.title}
                            message={confirmModal.message}
                            confirmText={confirmModal.confirmText}
                            confirmVariant={confirmModal.confirmVariant}
                            onConfirm={confirmModal.onConfirm}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default MeetingPage;