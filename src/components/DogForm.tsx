import React, { useState, useEffect } from 'react';
import { dogService } from '../services/supabaseService';
import type { Dog, Breed, DogImage } from '../services/supabaseService';
import Button from './ui/Button';
import Typography from './ui/Typography';
import PersonSelector from './PersonSelector';
import PersonManager from './PersonManager';
import { BreedManager } from './BreedManager';
import { BreedSelector } from './BreedSelector';
import ImageUploadComponent from './ImageUploadComponent';

interface DogFormProps {
  dogId?: string; // If provided, we're editing; if not, we're creating
  onSave?: (dog: Dog) => void;
  onCancel?: () => void;
}

interface FormData {
  id: string;
  name: string;
  nickname: string;
  gender: 'M' | 'F';
  breed_id: number | null;
  birth_date: string;
  death_date: string;
  is_deceased: boolean;
  color: string;
  owner_person_id: string;
}

const initialFormData: FormData = {
  id: '',
  name: '',
  nickname: '',
  gender: 'M',
  breed_id: null,
  birth_date: '',
  death_date: '',
  is_deceased: false,
  color: '',
  owner_person_id: ''
};

export const DogForm: React.FC<DogFormProps> = ({ dogId, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [profileImage, setProfileImage] = useState<DogImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBreedManager, setShowBreedManager] = useState(false);
  const [showPersonManager, setShowPersonManager] = useState(false);
  const [personRefreshTrigger, setPersonRefreshTrigger] = useState(0);
  const [checkingExistingDog, setCheckingExistingDog] = useState(false);
  const [existingDogFound, setExistingDogFound] = useState<Dog | null>(null);
  const [dogIdTimeout, setDogIdTimeout] = useState<NodeJS.Timeout | null>(null);

  const isEditing = Boolean(dogId);

  useEffect(() => {
    loadInitialData();
  }, [dogId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dogIdTimeout) {
        clearTimeout(dogIdTimeout);
      }
    };
  }, [dogIdTimeout]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load breeds
      const breedsData = await dogService.getBreeds();
      setBreeds(breedsData);

      if (dogId) {
        // Load existing dog data
        console.log('Loading dog data for ID:', dogId);
        const dogData = await dogService.getDogById(dogId);
        console.log('Retrieved dog data:', dogData);
        
        if (dogData) {
          const newFormData = {
            id: dogData.id,
            name: dogData.name,
            nickname: dogData.nickname || '',
            gender: dogData.gender,
            breed_id: dogData.breed_id,
            birth_date: dogData.birth_date || '',
            death_date: dogData.death_date || '',
            is_deceased: dogData.is_deceased,
            color: dogData.color || '',
            owner_person_id: dogData.owner_person_id || ''
          };
          console.log('Setting form data:', newFormData);
          setFormData(newFormData);

          // Load profile image (handle gracefully if table doesn't exist)
          try {
            const profileImageData = await dogService.getDogProfileImage(dogId);
            setProfileImage(profileImageData);
          } catch (error) {
            console.info('Profile image not available - continuing without image');
            setProfileImage(null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setErrors({ general: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.id.trim() && !isEditing) {
      newErrors.id = 'ID is required for new dogs';
    }

    if (!formData.breed_id) {
      newErrors.breed_id = 'Breed is required';
    }

    if (formData.birth_date && formData.death_date) {
      const birthDate = new Date(formData.birth_date);
      const deathDate = new Date(formData.death_date);
      if (deathDate <= birthDate) {
        newErrors.death_date = 'Death date must be after birth date';
      }
    }

    if (formData.is_deceased && !formData.death_date) {
      newErrors.death_date = 'Death date is required when dog is marked as deceased';
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
      const dogData = {
        ...formData,
        breed_id: formData.breed_id!,
        birth_date: formData.birth_date || undefined,
        death_date: formData.death_date || undefined,
        nickname: formData.nickname || undefined,
        color: formData.color || undefined,
        owner_person_id: formData.owner_person_id || undefined
      };

      let savedDog: Dog;
      if (isEditing) {
        // We're editing an existing dog in our kennel
        const { id, ...updates } = dogData;
        savedDog = await dogService.updateDog(dogId!, updates);
      } else {
        // We're adding a new dog (might exist in database or not)
        const result = await dogService.upsertDogAndAddToMyDogs(dogData);
        savedDog = result.dog;
        console.log('Dog added to kennel:', result);
      }

      onSave?.(savedDog);
    } catch (error) {
      console.error('Error saving dog:', error);
      setErrors({ general: 'Failed to save dog' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Check for existing dog when ID is entered (with debounce)
    if (field === 'id' && !isEditing) {
      // Clear any previous timeout
      if (dogIdTimeout) {
        clearTimeout(dogIdTimeout);
      }
      
      // Clear existing dog found state immediately when typing
      setExistingDogFound(null);
      
      if (value && value.trim()) {
        // Set new timeout to check for existing dog
        const timeoutId = setTimeout(() => {
          checkExistingDog(value.trim());
        }, 500); // 500ms debounce
        
        setDogIdTimeout(timeoutId);
      }
    }
  };

  const handleBreedAdded = (newBreed: Breed) => {
    setBreeds(prev => [...prev, newBreed]);
    setFormData(prev => ({ ...prev, breed_id: newBreed.id }));
    setShowBreedManager(false);
  };

  const handleDeceasedChange = (isDeceased: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_deceased: isDeceased,
      death_date: isDeceased ? prev.death_date : ''
    }));
  };

  const refreshProfileImage = async () => {
    if (dogId) {
      try {
        const updatedProfileImage = await dogService.getDogProfileImage(dogId);
        setProfileImage(updatedProfileImage);
      } catch (error) {
        console.warn('Could not refresh profile image (this is expected if dog_images table is not yet migrated):', error);
        // Don't show this as an error to the user since it's expected behavior
        setProfileImage(null);
      }
    }
  };

  // Check if a dog with the entered ID already exists and prefill data
  const checkExistingDog = async (dogIdToCheck: string) => {
    if (!dogIdToCheck.trim() || isEditing) return;
    
    setCheckingExistingDog(true);
    setExistingDogFound(null);
    
    try {
      const existingDog = await dogService.checkDogExists(dogIdToCheck);
      
      if (existingDog) {
        setExistingDogFound(existingDog);
        
        // Prefill form with existing dog data
        setFormData(prev => ({
          ...prev,
          name: existingDog.name,
          nickname: existingDog.nickname || '',
          gender: existingDog.gender,
          breed_id: existingDog.breed_id,
          birth_date: existingDog.birth_date || '',
          death_date: existingDog.death_date || '',
          is_deceased: existingDog.is_deceased,
          color: existingDog.color || '',
          owner_person_id: existingDog.owner_person_id || ''
        }));
        
        console.log('Found existing dog:', existingDog);
      } else {
        // Clear any existing data when dog is not found
        setFormData(prev => ({
          ...prev,
          name: '',
          nickname: '',
          gender: 'M',
          breed_id: null,
          birth_date: '',
          death_date: '',
          is_deceased: false,
          color: '',
          owner_person_id: ''
        }));
      }
    } catch (error) {
      console.error('Error checking existing dog:', error);
      setExistingDogFound(null);
    } finally {
      setCheckingExistingDog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Typography variant="body">Loading...</Typography>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg text-gray-800">
      <Typography variant="h2" className="mb-6">
        {isEditing ? `Edit ${formData.name}` : 'Add New Dog'}
      </Typography>

      {errors.general && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <Typography variant="body" className="text-red-700">
            {errors.general}
          </Typography>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Image Section */}
        {isEditing && (
          <div className="bg-gray-50 p-6 rounded-lg border">
            <Typography variant="h4" className="mb-4 text-gray-800">Profile Image</Typography>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Profile Image */}
              <div>
                <Typography variant="h6" className="mb-3 text-gray-700">Current Image</Typography>
                <div className="aspect-square bg-gray-100 rounded-lg border overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage.image_url}
                      alt={profileImage.alt_text || `${formData.name} profile`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center">
                            <span class="text-4xl text-gray-400">${formData.name ? formData.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '??'}</span>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Typography variant="h1" color="muted" className="select-none">
                        {formData.name ? formData.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '??'}
                      </Typography>
                    </div>
                  )}
                </div>
                {profileImage && (
                  <Typography variant="caption" color="muted" className="block text-center mt-2">
                    Uploaded: {new Date(profileImage.created_at).toLocaleDateString()}
                  </Typography>
                )}
              </div>

              {/* Upload New Image */}
              <div className="space-y-4">
                <Typography variant="h6" className="mb-3 text-gray-700">Upload New Image</Typography>

                  <ImageUploadComponent
                    dogId={dogId!}
                    dogName={formData.name || 'Unnamed Dog'}
                    allowMultiple={false}
                    defaultImageType="profile"
                    onUploadSuccess={() => {
                      refreshProfileImage();
                      if (errors.images) {
                        setErrors(prev => ({ ...prev, images: '' }));
                      }
                    }}
                    onUploadError={(error) => {
                      setErrors(prev => ({ ...prev, images: error }));
                    }}
                  />
          
              </div>
            </div>

            {/* Error Display for Images */}
            {errors.images && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                <Typography variant="caption" color="danger">
                  {errors.images}
                </Typography>
              </div>
            )}
          </div>
        )}

        {/* Basic Information Section */}
        <div className="space-y-6">
          <Typography variant="h4" className="text-gray-800">Basic Information</Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dog ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dog ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => handleInputChange('id', e.target.value)}
                    disabled={isEditing}
                    className={`w-full p-3 border rounded-md ${
                      errors.id ? 'border-red-500' : 
                      existingDogFound ? 'border-green-500' : 'border-gray-300'
                    } ${isEditing ? 'bg-gray-100' : ''}`}
                    placeholder="e.g., DK12345/2024"
                  />
                  {checkingExistingDog && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                
                {errors.id && (
                  <Typography variant="caption" className="text-red-500 mt-1">
                    {errors.id}
                  </Typography>
                )}
                
                {existingDogFound && !errors.id && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <Typography variant="caption" className="text-green-700">
                      ✓ Found existing dog: <strong>{existingDogFound.name}</strong>
                      {existingDogFound.breed?.name && ` (${existingDogFound.breed.name})`}
                      <br />
                      <span className="text-green-600">Form has been pre-filled with existing data.</span>
                    </Typography>
                  </div>
                )}
                
                {!isEditing && formData.id && !existingDogFound && !checkingExistingDog && (
                  <Typography variant="caption" className="text-blue-600 mt-1">
                    This will create a new dog record.
                  </Typography>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full p-3 border rounded-md ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Full registered name"
                />
                {errors.name && (
                  <Typography variant="caption" className="text-red-500 mt-1">
                    {errors.name}
                  </Typography>
                )}
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nickname/Call Name
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="Common name used at home"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value as 'M' | 'F')}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>

              {/* Breed */}
              <div className="md:col-span-2">
                <BreedSelector
                  breeds={breeds}
                  selectedBreedId={formData.breed_id}
                  onSelect={(breedId: any) => handleInputChange('breed_id', breedId)}
                  onAddNewBreed={() => setShowBreedManager(true)}
                  error={errors.breed_id}
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Date
                </label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="e.g., Red, Black, Grizzle"
                />
              </div>

              {/* Deceased Status */}
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_deceased}
                    onChange={(e) => handleDeceasedChange(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Dog is deceased
                  </span>
                </label>
              </div>

              {/* Death Date */}
              {formData.is_deceased && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Death Date {formData.is_deceased ? '*' : ''}
                  </label>
                  <input
                    type="date"
                    value={formData.death_date}
                    onChange={(e) => handleInputChange('death_date', e.target.value)}
                    className={`w-full p-3 border rounded-md ${
                      errors.death_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.death_date && (
                    <Typography variant="caption" className="text-red-500 mt-1">
                      {errors.death_date}
                    </Typography>
                  )}
                </div>
              )}

              {/* Owner Person */}
              <div>
                <PersonSelector
                  label="Owner"
                  selectedPersonId={formData.owner_person_id || null}
                  onSelect={(personId) => handleInputChange('owner_person_id', personId)}
                  onAddNewPerson={() => setShowPersonManager(true)}
                  refreshTrigger={personRefreshTrigger}
                />
              </div>
            </div>
          </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={saving}
            className="min-w-24"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Dog' : 'Create Dog'}
          </Button>
        </div>
      </form>

      {/* Breed Manager Modal */}
      {showBreedManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <BreedManager
            isModal={true}
            onBreedAdded={handleBreedAdded}
            onClose={() => setShowBreedManager(false)}
          />
        </div>
      )}

      {/* Person Manager Modal */}
      {showPersonManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <PersonManager
            isModal={true}
            presetId={formData.owner_person_id || ''}
            onPersonAdded={(p) => {
              handleInputChange('owner_person_id', p.id);
              setPersonRefreshTrigger(prev => prev + 1); // Trigger refresh
              setShowPersonManager(false);
            }}
            onClose={() => setShowPersonManager(false)}
          />
        </div>
      )}
    </div>
  );
};
