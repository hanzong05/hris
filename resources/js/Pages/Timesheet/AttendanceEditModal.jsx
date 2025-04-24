import React, { useState, useEffect } from 'react';
import { X, Save, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AttendanceEditModal = ({ isOpen, attendance, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    time_in: '',
    time_out: '',
    break_in: '',
    break_out: '',
    next_day_timeout: '',
    is_nightshift: false
  });
  
  const [error, setError] = useState('');

  // Initialize form data when attendance changes
  useEffect(() => {
    if (attendance) {
      setFormData({
        id: attendance.id,
        time_in: formatTimeForInput(attendance.time_in),
        time_out: formatTimeForInput(attendance.time_out),
        break_in: formatTimeForInput(attendance.break_in),
        break_out: formatTimeForInput(attendance.break_out),
        next_day_timeout: formatTimeForInput(attendance.next_day_timeout),
        is_nightshift: attendance.is_nightshift || false
      });
    }
  }, [attendance]);

  // Format time value similar to ProcessedAttendanceList
  const formatTimeForInput = (timeString) => {
    if (!timeString) return '';
    
    try {
      let timeOnly;
      // Handle ISO 8601 format
      if (timeString.includes('T')) {
        const [, time] = timeString.split('T');
        timeOnly = time.slice(0, 5); // Extract HH:MM
      } else {
        // If the time includes a date (like "2024-04-10 14:30:00"), split and take the time part
        const timeParts = timeString.split(' ');
        timeOnly = timeParts[timeParts.length - 1].slice(0, 5);
      }
      
      // Parse hours and minutes
      const [hours, minutes] = timeOnly.split(':');
      const hourNum = parseInt(hours, 10);
      
      // Convert to 12-hour format
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const formattedHours = hourNum % 12 || 12; // handle midnight and noon
      
      return `${formattedHours}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Time formatting error:', error);
      return '';
    }
  };

  // Convert 12-hour AM/PM time back to 24-hour format for submission
  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return '';
    
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    
    let convertedHours = parseInt(hours, 10);
    
    if (period === 'PM' && convertedHours !== 12) {
      convertedHours += 12;
    } else if (period === 'AM' && convertedHours === 12) {
      convertedHours = 0;
    }
    
    return `${convertedHours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Combine date with time input
  const combineDateTime = (originalDateTimeStr, timeStr) => {
    if (!originalDateTimeStr || !timeStr) return '';
    
    const originalDate = new Date(originalDateTimeStr);
    const [hours, minutes] = convertTo24Hour(timeStr).split(':');
    
    originalDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    return originalDate.toISOString();
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Prepare data with original dates
    const submissionData = {
      ...formData,
      time_in: combineDateTime(attendance.time_in, formData.time_in),
      time_out: combineDateTime(attendance.time_out, formData.time_out),
      break_in: combineDateTime(attendance.break_in, formData.break_in),
      break_out: combineDateTime(attendance.break_out, formData.break_out),
      next_day_timeout: formData.is_nightshift 
        ? combineDateTime(attendance.next_day_timeout, formData.next_day_timeout) 
        : null
    };
    
    // Validate form data
    const timeIn = new Date(submissionData.time_in);
    const timeOut = new Date(submissionData.time_out);
    
    // If not nightshift, time_out should be after time_in
    if (!formData.is_nightshift && timeOut <= timeIn) {
      setError('Time Out must be after Time In for regular shifts');
      return;
    }
    
    // If break_in and break_out are provided, validate them
    if (submissionData.break_in && submissionData.break_out) {
      const breakIn = new Date(submissionData.break_in);
      const breakOut = new Date(submissionData.break_out);
      
      if (breakOut <= breakIn) {
        setError('Break Out must be after Break In');
        return;
      }
    }
    
    // All validations passed, call onSave with the updated data
    onSave(submissionData);
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-lg max-w-xl w-full mx-4 md:mx-0">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Edit Attendance Times</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1 mb-4">
            <div className="font-medium text-gray-700 mb-2">
              {attendance.employee_name} (ID: {attendance.idno})
            </div>
            <div className="text-sm text-gray-500">
              Department: {attendance.department || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">
              Date: {new Date(attendance.attendance_date).toLocaleDateString()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="time_in" className="block text-sm font-medium text-gray-700 mb-1">
                Time In
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="time_in"
                  name="time_in"
                  placeholder="9:30 AM"
                  pattern="^(1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$"
                  className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.time_in}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="time_out" className="block text-sm font-medium text-gray-700 mb-1">
                Time Out
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="time_out"
                  name="time_out"
                  placeholder="5:30 PM"
                  pattern="^(1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$"
                  className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.time_out}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="break_in" className="block text-sm font-medium text-gray-700 mb-1">
                Break In
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="break_in"
                  name="break_in"
                  placeholder="12:00 PM"
                  pattern="^(1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$"
                  className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.break_in}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="break_out" className="block text-sm font-medium text-gray-700 mb-1">
                Break Out
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="break_out"
                  name="break_out"
                  placeholder="1:00 PM"
                  pattern="^(1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$"
                  className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.break_out}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="is_nightshift"
                name="is_nightshift"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.is_nightshift}
                onChange={handleChange}
              />
              <label htmlFor="is_nightshift" className="ml-2 block text-sm text-gray-900">
                Night Shift
              </label>
            </div>

            {formData.is_nightshift && (
              <div>
                <label htmlFor="next_day_timeout" className="block text-sm font-medium text-gray-700 mb-1">
                  Next Day Timeout
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    id="next_day_timeout"
                    name="next_day_timeout"
                    placeholder="2:00 AM"
                    pattern="^(1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$"
                    className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.next_day_timeout}
                    onChange={handleChange}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  For night shifts, specify when the employee clocked out on the following day.
                </p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 -mx-6 -mb-6 mt-6 flex justify-end space-x-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceEditModal;