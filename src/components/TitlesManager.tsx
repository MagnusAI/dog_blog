import React, { useState } from 'react';
import { dogService } from '../services/supabaseService';
import type { Title } from '../services/supabaseService';
import Button from './ui/Button';
import Typography from './ui/Typography';

interface TitlesManagerProps {
  dogId: string;
  titles: Title[];
  onTitlesChange: (titles: Title[]) => void;
}

interface TitleFormData {
  title_code: string;
  title_full_name: string;
  country_code: string;
  year_earned: string;
}

const initialTitleForm: TitleFormData = {
  title_code: '',
  title_full_name: '',
  country_code: '',
  year_earned: ''
};

const commonTitles = [
  { code: 'DKCH', fullName: 'Danish Champion', country: 'DK' },
  { code: 'SECH', fullName: 'Swedish Champion', country: 'SE' },
  { code: 'NOCH', fullName: 'Norwegian Champion', country: 'NO' },
  { code: 'FINCH', fullName: 'Finnish Champion', country: 'FI' },
  { code: 'INTCH', fullName: 'International Champion', country: 'INT' },
  { code: 'WW', fullName: 'World Winner', country: 'INT' },
  { code: 'EW', fullName: 'European Winner', country: 'EUR' },
  { code: 'NORDCH', fullName: 'Nordic Champion', country: 'NORD' },
  { code: 'AUCH', fullName: 'Australian Champion', country: 'AU' },
  { code: 'USCH', fullName: 'US Champion', country: 'US' },
  { code: 'DKJUCH', fullName: 'Danish Junior Champion', country: 'DK' },
  { code: 'KLBJCH', fullName: 'Club Junior Champion', country: 'DK' }
];

export const TitlesManager: React.FC<TitlesManagerProps> = ({
  dogId,
  titles,
  onTitlesChange
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<TitleFormData>(initialTitleForm);
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title_code.trim()) {
      newErrors.title_code = 'Title code is required';
    }

    if (formData.year_earned) {
      const year = parseInt(formData.year_earned);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        newErrors.year_earned = 'Enter a valid year between 1900 and ' + (currentYear + 1);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const titleData = {
        dog_id: dogId,
        title_code: formData.title_code.trim().toUpperCase(),
        title_full_name: formData.title_full_name.trim() || undefined,
        country_code: formData.country_code.trim().toUpperCase() || undefined,
        year_earned: formData.year_earned ? parseInt(formData.year_earned) : undefined
      };

      let updatedTitle: Title;
      if (editingTitle) {
        updatedTitle = await dogService.updateTitle(editingTitle.id, titleData);
        const updatedTitles = titles.map(t => 
          t.id === editingTitle.id ? updatedTitle : t
        );
        onTitlesChange(updatedTitles);
      } else {
        updatedTitle = await dogService.addTitle(titleData);
        onTitlesChange([...titles, updatedTitle]);
      }

      // Reset form
      setFormData(initialTitleForm);
      setShowAddForm(false);
      setEditingTitle(null);
      setErrors({});
    } catch (error) {
      console.error('Error saving title:', error);
      setErrors({ general: 'Failed to save title' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (title: Title) => {
    setFormData({
      title_code: title.title_code,
      title_full_name: title.title_full_name || '',
      country_code: title.country_code || '',
      year_earned: title.year_earned ? title.year_earned.toString() : ''
    });
    setEditingTitle(title);
    setShowAddForm(true);
    setErrors({});
  };

  const handleDelete = async (titleId: number) => {
    if (!confirm('Are you sure you want to delete this title?')) {
      return;
    }

    setLoading(true);
    try {
      await dogService.deleteTitle(titleId);
      onTitlesChange(titles.filter(t => t.id !== titleId));
    } catch (error) {
      console.error('Error deleting title:', error);
      setErrors({ general: 'Failed to delete title' });
    } finally {
      setLoading(false);
    }
  };

  const handleCommonTitleSelect = (commonTitle: typeof commonTitles[0]) => {
    setFormData({
      title_code: commonTitle.code,
      title_full_name: commonTitle.fullName,
      country_code: commonTitle.country,
      year_earned: formData.year_earned
    });
  };

  const cancelEdit = () => {
    setFormData(initialTitleForm);
    setShowAddForm(false);
    setEditingTitle(null);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Typography variant="h3">Titles & Championships</Typography>
        <Button
          onClick={() => setShowAddForm(true)}
          disabled={showAddForm}
        >
          Add Title
        </Button>
      </div>

      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <Typography variant="body" className="text-red-700">
            {errors.general}
          </Typography>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="p-6 bg-gray-50 rounded-lg border">
          <Typography variant="h4" className="mb-4">
            {editingTitle ? 'Edit Title' : 'Add New Title'}
          </Typography>

          {/* Common titles quick select */}
          <div className="mb-4">
            <Typography variant="body" className="mb-2 text-gray-700">
              Quick select common titles:
            </Typography>
            <div className="flex flex-wrap gap-2">
              {commonTitles.map((title) => (
                <button
                  key={title.code}
                  type="button"
                  onClick={() => handleCommonTitleSelect(title)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  {title.code}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title Code *
                </label>
                <input
                  type="text"
                  value={formData.title_code}
                  onChange={(e) => setFormData({ ...formData, title_code: e.target.value })}
                  className={`w-full p-3 border rounded-md ${
                    errors.title_code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., DKCH, SECH"
                />
                {errors.title_code && (
                  <Typography variant="caption" className="text-red-500 mt-1">
                    {errors.title_code}
                  </Typography>
                )}
              </div>

              {/* Year Earned */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year Earned
                </label>
                <input
                  type="number"
                  value={formData.year_earned}
                  onChange={(e) => setFormData({ ...formData, year_earned: e.target.value })}
                  className={`w-full p-3 border rounded-md ${
                    errors.year_earned ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 2024"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
                {errors.year_earned && (
                  <Typography variant="caption" className="text-red-500 mt-1">
                    {errors.year_earned}
                  </Typography>
                )}
              </div>

              {/* Title Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Title Name
                </label>
                <input
                  type="text"
                  value={formData.title_full_name}
                  onChange={(e) => setFormData({ ...formData, title_full_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="e.g., Danish Champion"
                />
              </div>

              {/* Country Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country Code
                </label>
                <input
                  type="text"
                  value={formData.country_code}
                  onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="e.g., DK, SE, NO"
                  maxLength={5}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={cancelEdit}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : editingTitle ? 'Update Title' : 'Add Title'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Titles List */}
      <div className="space-y-3">
        {titles.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <Typography variant="body">
              No titles recorded yet. Add the first title above.
            </Typography>
          </div>
        ) : (
          titles
            .sort((a, b) => (b.year_earned || 0) - (a.year_earned || 0))
            .map((title) => (
              <div
                key={title.id}
                className="flex items-center justify-between p-4 bg-white border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Typography variant="h4" className="text-blue-700">
                      {title.title_code}
                    </Typography>
                    {title.year_earned && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {title.year_earned}
                      </span>
                    )}
                    {title.country_code && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {title.country_code}
                      </span>
                    )}
                  </div>
                  {title.title_full_name && (
                    <Typography variant="body" className="text-gray-600 mt-1">
                      {title.title_full_name}
                    </Typography>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(title)}
                    disabled={loading}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(title.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};
