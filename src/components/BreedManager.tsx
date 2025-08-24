import React, { useState, useEffect } from 'react';
import { dogService } from '../services/supabaseService';
import type { Breed } from '../services/supabaseService';
import Button from './ui/Button';
import Typography from './ui/Typography';

interface BreedManagerProps {
  onBreedAdded?: (breed: Breed) => void;
  onClose?: () => void;
  isModal?: boolean;
}

interface BreedFormData {
  name: string;
  fci_number: string;
  club_id: string;
  club_name: string;
}

const initialFormData: BreedFormData = {
  name: '',
  fci_number: '',
  club_id: '',
  club_name: ''
};

const commonClubs = [
  { id: 'FCI', name: 'Fédération Cynologique Internationale' },
  { id: 'AKC', name: 'American Kennel Club' },
  { id: 'KC', name: 'The Kennel Club (UK)' },
  { id: 'CKC', name: 'Canadian Kennel Club' },
  { id: 'ANKC', name: 'Australian National Kennel Council' },
  { id: 'DKK', name: 'Dansk Kennel Klub' },
  { id: 'SKK', name: 'Svenska Kennelklubben' },
  { id: 'NKK', name: 'Norsk Kennel Klub' },
  { id: 'SPK', name: 'Suomen Kennelliitto' }
];

export const BreedManager: React.FC<BreedManagerProps> = ({
  onBreedAdded,
  onClose,
  isModal = false
}) => {
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [formData, setFormData] = useState<BreedFormData>(initialFormData);
  const [editingBreed, setEditingBreed] = useState<Breed | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBreeds();
  }, []);

  const loadBreeds = async () => {
    setLoading(true);
    try {
      const breedsData = await dogService.getBreeds();
      setBreeds(breedsData);
    } catch (error) {
      console.error('Error loading breeds:', error);
      setErrors({ general: 'Failed to load breeds' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Breed name is required';
    }

    // Check for duplicate breed names (case-insensitive)
    const existingBreed = breeds.find(
      breed => breed.name.toLowerCase() === formData.name.trim().toLowerCase() &&
               (!editingBreed || breed.id !== editingBreed.id)
    );
    if (existingBreed) {
      newErrors.name = 'A breed with this name already exists';
    }

    // Validate FCI number format if provided
    if (formData.fci_number && !/^\d{1,4}$/.test(formData.fci_number)) {
      newErrors.fci_number = 'FCI number should be 1-4 digits';
    }

    // Check for duplicate FCI numbers if provided
    if (formData.fci_number) {
      const existingFCI = breeds.find(
        breed => breed.fci_number === formData.fci_number &&
                 (!editingBreed || breed.id !== editingBreed.id)
      );
      if (existingFCI) {
        newErrors.fci_number = 'This FCI number is already used';
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

    setSaving(true);
    try {
      const breedData = {
        name: formData.name.trim(),
        fci_number: formData.fci_number.trim() || undefined,
        club_id: formData.club_id.trim() || undefined,
        club_name: formData.club_name.trim() || undefined
      };

      let savedBreed: Breed;
      if (editingBreed) {
        // Update existing breed
        savedBreed = await dogService.updateBreed(editingBreed.id, breedData);
        setBreeds(breeds.map(b => b.id === editingBreed.id ? savedBreed : b));
      } else {
        // Create new breed
        savedBreed = await dogService.createBreed(breedData);
        setBreeds([...breeds, savedBreed]);
        onBreedAdded?.(savedBreed);
      }

      // Reset form
      setFormData(initialFormData);
      setEditingBreed(null);
      setShowForm(false);
      setErrors({});
    } catch (error) {
      console.error('Error saving breed:', error);
      setErrors({ general: 'Failed to save breed' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (breed: Breed) => {
    setFormData({
      name: breed.name,
      fci_number: breed.fci_number || '',
      club_id: breed.club_id || '',
      club_name: breed.club_name || ''
    });
    setEditingBreed(breed);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (breedId: number) => {
    if (!confirm('Are you sure you want to delete this breed? This action cannot be undone.')) {
      return;
    }

    try {
      await dogService.deleteBreed(breedId);
      setBreeds(breeds.filter(b => b.id !== breedId));
    } catch (error) {
      console.error('Error deleting breed:', error);
      setErrors({ general: 'Failed to delete breed. It may be in use by existing dogs.' });
    }
  };

  const handleClubSelect = (clubId: string, clubName: string) => {
    setFormData({
      ...formData,
      club_id: clubId,
      club_name: clubName
    });
  };

  const cancelEdit = () => {
    setFormData(initialFormData);
    setEditingBreed(null);
    setShowForm(false);
    setErrors({});
  };

  const filteredBreeds = breeds.filter(breed =>
    breed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (breed.fci_number && breed.fci_number.includes(searchTerm))
  );

  const containerClass = isModal 
    ? "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
    : "max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg";

  return (
    <div className={containerClass}>
      {isModal && (
        <div className="flex justify-between items-center p-6 border-b">
          <Typography variant="h2">Manage Breeds</Typography>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>
      )}

      <div className={isModal ? "p-6 overflow-y-auto" : ""}>
        {!isModal && (
          <Typography variant="h2" className="mb-6">
            Breed Management
          </Typography>
        )}

        {errors.general && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <Typography variant="body" className="text-red-700">
              {errors.general}
            </Typography>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border">
            <Typography variant="h3" className="mb-4">
              {editingBreed ? 'Edit Breed' : 'Add New Breed'}
            </Typography>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Breed Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Breed Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full p-3 border rounded-md ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Norfolk Terrier"
                  />
                  {errors.name && (
                    <Typography variant="caption" className="text-red-500 mt-1">
                      {errors.name}
                    </Typography>
                  )}
                </div>

                {/* FCI Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    FCI Number
                  </label>
                  <input
                    type="text"
                    value={formData.fci_number}
                    onChange={(e) => setFormData({ ...formData, fci_number: e.target.value })}
                    className={`w-full p-3 border rounded-md ${
                      errors.fci_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 272"
                    maxLength={4}
                  />
                  {errors.fci_number && (
                    <Typography variant="caption" className="text-red-500 mt-1">
                      {errors.fci_number}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Club Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kennel Club
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {commonClubs.map((club) => (
                    <button
                      key={club.id}
                      type="button"
                      onClick={() => handleClubSelect(club.id, club.name)}
                      className={`px-3 py-1 text-sm rounded ${
                        formData.club_id === club.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {club.id}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formData.club_id}
                    onChange={(e) => setFormData({ ...formData, club_id: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    placeholder="Club ID (e.g., FCI)"
                  />
                  <input
                    type="text"
                    value={formData.club_name}
                    onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    placeholder="Full club name"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingBreed ? 'Update Breed' : 'Add Breed'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowForm(true)}
              disabled={showForm}
            >
              Add New Breed
            </Button>
            <Typography variant="body" className="text-gray-600">
              {breeds.length} breed{breeds.length !== 1 ? 's' : ''} total
            </Typography>
          </div>
          
          {/* Search */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search breeds..."
              className="p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Breeds List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center p-8">
              <Typography variant="body" className="text-gray-500">
                Loading breeds...
              </Typography>
            </div>
          ) : filteredBreeds.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <Typography variant="body">
                {searchTerm ? `No breeds found matching "${searchTerm}"` : 'No breeds added yet.'}
              </Typography>
            </div>
          ) : (
            filteredBreeds.map((breed) => (
              <div
                key={breed.id}
                className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Typography variant="h4">
                      {breed.name}
                    </Typography>
                    {breed.fci_number && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        FCI #{breed.fci_number}
                      </span>
                    )}
                    {breed.club_id && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {breed.club_id}
                      </span>
                    )}
                  </div>
                  {breed.club_name && (
                    <Typography variant="caption" className="text-gray-600 mt-1">
                      {breed.club_name}
                    </Typography>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(breed)}
                    disabled={saving}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(breed.id)}
                    disabled={saving}
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
    </div>
  );
};
