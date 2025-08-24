import React, { useState } from 'react';
import { dogService } from '../services/supabaseService';
import type { MyDog } from '../services/supabaseService';
import Button from './ui/Button';
import Typography from './ui/Typography';

interface MyDogToggleProps {
  dogId: string;
  myDogRecord: MyDog | null;
  onMyDogChange: (myDog: MyDog | null) => void;
}

interface MyDogFormData {
  acquisition_date: string;
  notes: string;
  is_active: boolean;
}

const initialFormData: MyDogFormData = {
  acquisition_date: '',
  notes: '',
  is_active: true
};

export const MyDogToggle: React.FC<MyDogToggleProps> = ({
  dogId,
  myDogRecord,
  onMyDogChange
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<MyDogFormData>(
    myDogRecord ? {
      acquisition_date: myDogRecord.acquisition_date || '',
      notes: myDogRecord.notes || '',
      is_active: myDogRecord.is_active
    } : initialFormData
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isMyDog = Boolean(myDogRecord);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.acquisition_date) {
      const acquisitionDate = new Date(formData.acquisition_date);
      const today = new Date();
      if (acquisitionDate > today) {
        newErrors.acquisition_date = 'Acquisition date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddToMyDogs = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const myDogData = {
        dog_id: dogId,
        acquisition_date: formData.acquisition_date || undefined,
        notes: formData.notes || undefined,
        is_active: formData.is_active
      };

      const newMyDog = await dogService.addToMyDogs(myDogData);
      onMyDogChange(newMyDog);
      setShowForm(false);
      setErrors({});
    } catch (error) {
      console.error('Error adding dog to my dogs:', error);
      setErrors({ general: 'Failed to add dog to your collection' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMyDog = async () => {
    if (!myDogRecord || !validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updates = {
        acquisition_date: formData.acquisition_date || undefined,
        notes: formData.notes || undefined,
        is_active: formData.is_active
      };

      const updatedMyDog = await dogService.updateMyDog(myDogRecord.id, updates);
      onMyDogChange(updatedMyDog);
      setShowForm(false);
      setErrors({});
    } catch (error) {
      console.error('Error updating my dog record:', error);
      setErrors({ general: 'Failed to update dog record' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromMyDogs = async () => {
    if (!confirm('Are you sure you want to remove this dog from your collection?')) {
      return;
    }

    setLoading(true);
    try {
      await dogService.removeFromMyDogs(dogId);
      onMyDogChange(null);
      setFormData(initialFormData);
      setShowForm(false);
      setErrors({});
    } catch (error) {
      console.error('Error removing dog from my dogs:', error);
      setErrors({ general: 'Failed to remove dog from your collection' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleForm = () => {
    if (!showForm && myDogRecord) {
      // Pre-fill form with existing data when editing
      setFormData({
        acquisition_date: myDogRecord.acquisition_date || '',
        notes: myDogRecord.notes || '',
        is_active: myDogRecord.is_active
      });
    }
    setShowForm(!showForm);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMyDog) {
      handleUpdateMyDog();
    } else {
      handleAddToMyDogs();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Typography variant="h3">Ownership Status</Typography>
        <div className="flex items-center space-x-3">
          {isMyDog && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✓ My Dog
            </span>
          )}
          <Button
            onClick={handleToggleForm}
            variant={isMyDog ? 'secondary' : 'primary'}
            disabled={loading}
          >
            {isMyDog ? 'Edit Details' : 'Add to My Dogs'}
          </Button>
        </div>
      </div>

      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <Typography variant="body" className="text-red-700">
            {errors.general}
          </Typography>
        </div>
      )}

      {/* Current Status Display */}
      {isMyDog && !showForm && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <Typography variant="h4" className="text-green-800 mb-4">
            This dog is in your collection
          </Typography>
          
          <div className="space-y-3">
            {myDogRecord?.acquisition_date && (
              <div>
                <Typography variant="body" className="font-medium text-gray-700">
                  Acquisition Date:
                </Typography>
                <Typography variant="body" className="text-gray-600">
                  {new Date(myDogRecord.acquisition_date).toLocaleDateString()}
                </Typography>
              </div>
            )}

            <div>
              <Typography variant="body" className="font-medium text-gray-700">
                Status:
              </Typography>
              <Typography variant="body" className="text-gray-600">
                {myDogRecord?.is_active ? 'Active' : 'Inactive'}
              </Typography>
            </div>

            {myDogRecord?.notes && (
              <div>
                <Typography variant="body" className="font-medium text-gray-700">
                  Notes:
                </Typography>
                <Typography variant="body" className="text-gray-600">
                  {myDogRecord.notes}
                </Typography>
              </div>
            )}

            <div className="pt-3 border-t border-green-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRemoveFromMyDogs}
                disabled={loading}
                className="text-red-600 hover:text-red-700"
              >
                Remove from My Dogs
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="p-6 bg-gray-50 rounded-lg border">
          <Typography variant="h4" className="mb-4">
            {isMyDog ? 'Edit My Dog Details' : 'Add to My Dogs'}
          </Typography>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Acquisition Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acquisition Date
              </label>
              <input
                type="date"
                value={formData.acquisition_date}
                onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                className={`w-full p-3 border rounded-md ${
                  errors.acquisition_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.acquisition_date && (
                <Typography variant="caption" className="text-red-500 mt-1">
                  {errors.acquisition_date}
                </Typography>
              )}
              <Typography variant="caption" className="text-gray-500 mt-1">
                When did you acquire this dog? (Optional)
              </Typography>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Add any notes about this dog (breeding plans, special traits, etc.)"
              />
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active in your breeding program
                </span>
              </label>
              <Typography variant="caption" className="text-gray-500 mt-1">
                Uncheck if this dog is no longer part of your active breeding program
              </Typography>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : isMyDog ? 'Update Details' : 'Add to My Dogs'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Not My Dog Display */}
      {!isMyDog && !showForm && (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <Typography variant="body" className="text-gray-600 mb-4">
            This dog is not in your collection yet.
          </Typography>
          <Typography variant="caption" className="text-gray-500">
            Click "Add to My Dogs" above to track this dog in your kennel records.
          </Typography>
        </div>
      )}
    </div>
  );
};
