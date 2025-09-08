import React, { useState, useEffect } from 'react';
import { getUserData, saveUserData, defaultUserData } from '../utils/userStorage';

const UserDetailsModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(defaultUserData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load existing data when modal opens
      const userData = getUserData();
      setFormData(userData);
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.dateOfBirth?.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      // Validate date format and reasonable range
      const date = new Date(formData.dateOfBirth);
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 100, 0, 1);
      const maxDate = new Date();
      
      if (isNaN(date.getTime()) || date < minDate || date > maxDate) {
        newErrors.dateOfBirth = 'Please enter a valid date';
      }
    }

    if (!formData.placeOfBirth?.trim()) {
      newErrors.placeOfBirth = 'Place of birth is required';
    }

    if (!formData.timeOfBirth?.trim()) {
      newErrors.timeOfBirth = 'Time of birth is required';
    } else {
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.timeOfBirth)) {
        newErrors.timeOfBirth = 'Please enter time in HH:MM format (e.g., 14:30)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to localStorage
      const success = saveUserData(formData);
      
      if (success) {
        onSave(formData);
        onClose();
      } else {
        setErrors({ general: 'Failed to save user data. Please try again.' });
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-darker">
              Your Astrological Details
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <p className="text-sm text-gray-text mb-4">
            To provide accurate astrological readings, we need your birth details.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-darker ">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                  errors.firstName ? 'border-red-500' : 'border-border-gray'
                }`}
                placeholder="Enter your first name"
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-darker">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                  errors.lastName ? 'border-red-500' : 'border-border-gray'
                }`}
                placeholder="Enter your last name"
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-darker">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                  errors.dateOfBirth ? 'border-red-500' : 'border-border-gray'
                }`}
                disabled={isSubmitting}
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Place of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-darker">
                Place of Birth
              </label>
              <input
                type="text"
                value={formData.placeOfBirth}
                onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                  errors.placeOfBirth ? 'border-red-500' : 'border-border-gray'
                }`}
                placeholder="e.g., Mumbai, India"
                disabled={isSubmitting}
              />
              {errors.placeOfBirth && (
                <p className="text-red-500 text-xs mt-1">{errors.placeOfBirth}</p>
              )}
            </div>

            {/* Time of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-darker ">
                Time of Birth
              </label>
              <input
                type="time"
                value={formData.timeOfBirth}
                onChange={(e) => handleInputChange('timeOfBirth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                  errors.timeOfBirth ? 'border-red-500' : 'border-border-gray'
                }`}
                disabled={isSubmitting}
              />
              {errors.timeOfBirth && (
                <p className="text-red-500 text-xs mt-1">{errors.timeOfBirth}</p>
              )}
              <p className="text-xs text-gray-text mt-1">
                Use 24-hour format (e.g., 14:30 for 2:30 PM)
              </p>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-border-gray rounded-lg text-gray-darker hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
