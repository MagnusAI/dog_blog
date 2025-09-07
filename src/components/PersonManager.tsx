import React, { useEffect, useState } from 'react';
import Typography from './ui/Typography';
import Button from './ui/Button';
import { personService } from '../services/supabaseService';
import type { Person } from '../services/supabaseService';

interface PersonManagerProps {
  isModal?: boolean;
  presetId?: string;
  onPersonAdded?: (person: Person) => void;
  onClose?: () => void;
}

interface PersonFormData {
  id: string;
  name: string;
  type: string;
  notes: string;
  is_active: boolean;
}

const initialFormData: PersonFormData = {
  id: '',
  name: '',
  type: 'owner',
  notes: '',
  is_active: true
};

export const PersonManager: React.FC<PersonManagerProps> = ({
  isModal = false,
  presetId,
  onPersonAdded,
  onClose
}) => {
  const [formData, setFormData] = useState<PersonFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (presetId) {
      setFormData(prev => ({ ...prev, id: presetId }));
    }
  }, [presetId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.id.trim()) newErrors.id = 'ID is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const saved = await personService.upsertPerson({
        id: formData.id.trim(),
        name: formData.name.trim(),
        type: formData.type.trim() || 'unknown',
        notes: formData.notes.trim() || undefined,
        is_active: formData.is_active
      });
      onPersonAdded?.(saved);
      onClose?.();
    } catch (error) {
      console.error('Failed saving person', error);
      setErrors({ general: 'Failed to save person' });
    } finally {
      setSaving(false);
    }
  };

  const containerClass = isModal 
    ? "bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden"
    : "max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg";

  return (
    <div className={containerClass}>
      {isModal && (
        <div className="flex justify-between items-center p-6 border-b">
          <Typography variant="h2">Add New Person</Typography>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>
      )}

      <div className={isModal ? "p-6" : ""}>
        {!isModal && (
          <Typography variant="h2" className="mb-6">
            Add New Person
          </Typography>
        )}

        {errors.general && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <Typography variant="body" className="text-red-700">
              {errors.general}
            </Typography>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Person ID *</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className={`w-full p-3 border rounded-md ${errors.id ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="External person identifier"
                disabled={!!presetId}
              />
              {errors.id && (
                <Typography variant="caption" className="text-red-500 mt-1">
                  {errors.id}
                </Typography>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full p-3 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., John Smith"
              />
              {errors.name && (
                <Typography variant="caption" className="text-red-500 mt-1">
                  {errors.name}
                </Typography>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="owner">Owner</option>
                <option value="breeder">Breeder</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Active</label>
              <label className="inline-flex items-center space-x-2">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                <span>Is Active</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md min-h-[100px]"
              placeholder="Additional context about this person"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Person'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonManager;


