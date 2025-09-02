import React, { useState, useEffect } from 'react';
import { dogService } from '../services/supabaseService';
import type { Dog, Breed } from '../services/supabaseService';
import { createCloudinaryUploadService, CloudinaryUploadService } from '../services/cloudinaryUploadService';
import Button from './ui/Button';
import Typography from './ui/Typography';
import { BreedSelector } from './BreedSelector';
import ClickableCloudinaryImage from './ClickableCloudinaryImage';

export interface PedigreeFormProps {
  /** The current dog whose pedigree is being edited */
  currentDog: Dog;
  /** Which line to edit - father's or mother's */
  pedigreeType: 'father' | 'mother';
  /** Callback when form is saved */
  onSave?: (updatedDog: Dog) => void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
}

interface PedigreeFormData {
  // Generation 1 (parent)
  parent?: {
    id: string;
    name: string;
    breed_id: number | null;
    birth_date: string;
    gender: 'M' | 'F';
    color: string;
    image?: File;
    imageUrl?: string;
    imagePublicId?: string;
  };
  // Generation 2 (grandparents)
  grandparent1?: {
    id: string;
    name: string;
    breed_id: number | null;
    birth_date: string;
    gender: 'M' | 'F';
    color: string;
    image?: File;
    imageUrl?: string;
    imagePublicId?: string;
  };
  grandparent2?: {
    id: string;
    name: string;
    breed_id: number | null;
    birth_date: string;
    gender: 'M' | 'F';
    color: string;
    image?: File;
    imageUrl?: string;
    imagePublicId?: string;
  };
  // Generation 3 (great-grandparents)
  greatGrandparent1?: {
    id: string;
    name: string;
    breed_id: number | null;
    birth_date: string;
    gender: 'M' | 'F';
    color: string;
    image?: File;
    imageUrl?: string;
    imagePublicId?: string;
  };
  greatGrandparent2?: {
    id: string;
    name: string;
    breed_id: number | null;
    birth_date: string;
    gender: 'M' | 'F';
    color: string;
    image?: File;
    imageUrl?: string;
    imagePublicId?: string;
  };
}

type DogFormEntry = NonNullable<PedigreeFormData[keyof PedigreeFormData]>;

const createEmptyDogEntry = (): DogFormEntry => ({
  id: '',
  name: '',
  breed_id: null,
  birth_date: '',
  gender: 'M',
  color: '',
  imageUrl: '',
  imagePublicId: ''
});

export const PedigreeForm: React.FC<PedigreeFormProps> = ({
  currentDog,
  pedigreeType,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<PedigreeFormData>({});
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditingFatherLine = pedigreeType === 'father';
  const lineTitle = isEditingFatherLine ? "Father's Line" : "Mother's Line";

  useEffect(() => {
    loadInitialData();
  }, [currentDog, pedigreeType]);

  const loadInitialData = async () => {
    try {
      // Load breeds
      const breedsData = await dogService.getBreeds();
      setBreeds(breedsData);

      // Load current pedigree data
      if (currentDog.all_ancestors) {
        const relationshipType = isEditingFatherLine ? 'SIRE' : 'DAM';
        
        // Find parent (generation 1)
        const parent = currentDog.all_ancestors.find(
          a => a.generation === 1 && a.relationship_type === relationshipType
        );

        // Find grandparents (generation 2) - we'll take up to 2
        const grandparents = currentDog.all_ancestors
          .filter(a => a.generation === 2 && a.relationship_type === relationshipType)
          .slice(0, 2);

        // Find great-grandparents (generation 3) - we'll take up to 2
        const greatGrandparents = currentDog.all_ancestors
          .filter(a => a.generation === 3 && a.relationship_type === relationshipType)
          .slice(0, 2);

        const newFormData: PedigreeFormData = {};

        if (parent) {
          // Get profile image if available
          let profileImage;
          if (Array.isArray(parent.parent.profile_image)) {
            profileImage = parent.parent.profile_image.find(img => img.is_profile) || parent.parent.profile_image[0];
          }
          
          newFormData.parent = {
            id: parent.parent.id,
            name: parent.parent.name,
            breed_id: parent.parent.breed_id,
            birth_date: parent.parent.birth_date || '',
            gender: parent.parent.gender,
            color: parent.parent.color || '',
            imageUrl: profileImage?.image_url,
            imagePublicId: profileImage?.image_public_id
          };
        }

        if (grandparents[0]) {
          // Get profile image if available
          let profileImage;
          if (Array.isArray(grandparents[0].parent.profile_image)) {
            profileImage = grandparents[0].parent.profile_image.find(img => img.is_profile) || grandparents[0].parent.profile_image[0];
          }
          
          newFormData.grandparent1 = {
            id: grandparents[0].parent.id,
            name: grandparents[0].parent.name,
            breed_id: grandparents[0].parent.breed_id,
            birth_date: grandparents[0].parent.birth_date || '',
            gender: grandparents[0].parent.gender,
            color: grandparents[0].parent.color || '',
            imageUrl: profileImage?.image_url,
            imagePublicId: profileImage?.image_public_id
          };
        }

        if (grandparents[1]) {
          // Get profile image if available
          let profileImage;
          if (Array.isArray(grandparents[1].parent.profile_image)) {
            profileImage = grandparents[1].parent.profile_image.find(img => img.is_profile) || grandparents[1].parent.profile_image[0];
          }
          
          newFormData.grandparent2 = {
            id: grandparents[1].parent.id,
            name: grandparents[1].parent.name,
            breed_id: grandparents[1].parent.breed_id,
            birth_date: grandparents[1].parent.birth_date || '',
            gender: grandparents[1].parent.gender,
            color: grandparents[1].parent.color || '',
            imageUrl: profileImage?.image_url,
            imagePublicId: profileImage?.image_public_id
          };
        }

        if (greatGrandparents[0]) {
          // Get profile image if available
          let profileImage;
          if (Array.isArray(greatGrandparents[0].parent.profile_image)) {
            profileImage = greatGrandparents[0].parent.profile_image.find(img => img.is_profile) || greatGrandparents[0].parent.profile_image[0];
          }
          
          newFormData.greatGrandparent1 = {
            id: greatGrandparents[0].parent.id,
            name: greatGrandparents[0].parent.name,
            breed_id: greatGrandparents[0].parent.breed_id,
            birth_date: greatGrandparents[0].parent.birth_date || '',
            gender: greatGrandparents[0].parent.gender,
            color: greatGrandparents[0].parent.color || '',
            imageUrl: profileImage?.image_url,
            imagePublicId: profileImage?.image_public_id
          };
        }

        if (greatGrandparents[1]) {
          // Get profile image if available
          let profileImage;
          if (Array.isArray(greatGrandparents[1].parent.profile_image)) {
            profileImage = greatGrandparents[1].parent.profile_image.find(img => img.is_profile) || greatGrandparents[1].parent.profile_image[0];
          }
          
          newFormData.greatGrandparent2 = {
            id: greatGrandparents[1].parent.id,
            name: greatGrandparents[1].parent.name,
            breed_id: greatGrandparents[1].parent.breed_id,
            birth_date: greatGrandparents[1].parent.birth_date || '',
            gender: greatGrandparents[1].parent.gender,
            color: greatGrandparents[1].parent.color || '',
            imageUrl: profileImage?.image_url,
            imagePublicId: profileImage?.image_public_id
          };
        }

        setFormData(newFormData);
      }
    } catch (error) {
      console.error('Error loading pedigree data:', error);
      setErrors({ general: 'Failed to load pedigree data' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    dogKey: keyof PedigreeFormData,
    field: keyof DogFormEntry,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [dogKey]: {
        ...(prev[dogKey] || createEmptyDogEntry()),
        [field]: value
      }
    }));

    // Clear error for this field
    const errorKey = `${dogKey}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleImageUpload = (dogKey: keyof PedigreeFormData, file: File) => {
    handleInputChange(dogKey, 'image', file);
  };

  const handleImageRemove = (dogKey: keyof PedigreeFormData) => {
    setFormData(prev => ({
      ...prev,
      [dogKey]: prev[dogKey] ? {
        ...prev[dogKey],
        image: undefined,
        imageUrl: '',
        imagePublicId: ''
      } : undefined
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate each dog entry that has data
    Object.entries(formData).forEach(([dogKey, dogData]) => {
      if (dogData) {
        if (!dogData.name.trim()) {
          newErrors[`${dogKey}.name`] = 'Name is required';
        }
        if (!dogData.id.trim()) {
          newErrors[`${dogKey}.id`] = 'ID is required';
        }
        if (!dogData.breed_id) {
          newErrors[`${dogKey}.breed_id`] = 'Breed is required';
        }
      }
    });

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
      // Process each dog entry with an image
      const uploadService = createCloudinaryUploadService();
      
      for (const [, dogData] of Object.entries(formData)) {
        if (dogData && dogData.image) {
          try {
            // Upload image to Cloudinary
            const uploadOptions = CloudinaryUploadService.getDogImageUploadOptions(
              dogData.id, 
              'pedigree'
            );
            
            const uploadResult = await uploadService.uploadFile(dogData.image, uploadOptions);
            
            // Create or update the dog record first (if it doesn't exist)
            let existingDog;
            try {
              existingDog = await dogService.getDog(dogData.id);
            } catch (error) {
              // Dog doesn't exist, create it
              const newDog = {
                id: dogData.id,
                name: dogData.name,
                breed_id: dogData.breed_id!,
                gender: dogData.gender,
                birth_date: dogData.birth_date || undefined,
                color: dogData.color || undefined,
                is_deceased: false
              };
              existingDog = await dogService.createDog(newDog);
            }
            
            if (existingDog) {
              // Add the image to the dog
              const imageData = {
                dog_id: dogData.id,
                image_url: uploadResult.secure_url,
                image_public_id: uploadResult.public_id,
                is_profile: true, // Set as profile image for pedigree dogs
                image_type: 'profile' as const,
                alt_text: `${dogData.name} profile photo`,
                display_order: 1
              };
              
              await dogService.addDogImage(imageData);
              console.log(`Successfully uploaded image for ${dogData.name}`);
            }
          } catch (uploadError) {
            console.error(`Failed to upload image for ${dogData.name}:`, uploadError);
            // Continue with other dogs even if one fails
          }
        }
      }
      
      // Refresh the current dog's data to show updated pedigree
      const updatedDog = await dogService.getDogById(currentDog.id);
      onSave?.(updatedDog || currentDog);
    } catch (error) {
      console.error('Error saving pedigree:', error);
      setErrors({ general: 'Failed to save pedigree data' });
    } finally {
      setSaving(false);
    }
  };

  const renderDogSection = (
    dogKey: keyof PedigreeFormData,
    title: string,
    dog?: DogFormEntry
  ) => {
    const dogData = dog || createEmptyDogEntry();
    
    return (
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <Typography variant="h5" weight="semibold" className="text-gray-800">
          {title}
        </Typography>
        
        {/* Image Upload Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-shrink-0">
            <Typography variant="body" weight="medium" className="mb-2">
              Dog Photo
            </Typography>
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
              {dogData.image ? (
                <div className="relative w-full h-full">
                  <img
                    src={URL.createObjectURL(dogData.image)}
                    alt={`${dogData.name || 'Dog'} preview`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(dogKey)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : dogData.imagePublicId ? (
                <div className="relative w-full h-full">
                  <ClickableCloudinaryImage
                    publicId={dogData.imagePublicId}
                    width={96}
                    height={96}
                    alt={`${dogData.name || 'Dog'} photo`}
                    gravity="face"
                    crop="fill"
                    className="rounded-lg"
                    disableEnlarge={true}
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(dogKey)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : dogData.imageUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={dogData.imageUrl}
                    alt={`${dogData.name || 'Dog'} photo`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(dogKey)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <Typography variant="caption" color="muted" className="text-xs">
                    Add Photo
                  </Typography>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(dogKey, file);
              }}
              className="mt-2 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block mb-2">
                  <Typography variant="body" weight="medium">Name *</Typography>
                </label>
                <input
                  type="text"
                  value={dogData.name}
                  onChange={(e) => handleInputChange(dogKey, 'name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[`${dogKey}.name`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter dog name"
                />
                {errors[`${dogKey}.name`] && (
                  <Typography variant="caption" color="danger" className="mt-1">
                    {errors[`${dogKey}.name`]}
                  </Typography>
                )}
              </div>

              {/* ID */}
              <div>
                <label className="block mb-2">
                  <Typography variant="body" weight="medium">Registration ID *</Typography>
                </label>
                <input
                  type="text"
                  value={dogData.id}
                  onChange={(e) => handleInputChange(dogKey, 'id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[`${dogKey}.id`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter registration ID"
                />
                {errors[`${dogKey}.id`] && (
                  <Typography variant="caption" color="danger" className="mt-1">
                    {errors[`${dogKey}.id`]}
                  </Typography>
                )}
              </div>

              {/* Breed */}
              <div>
                <label className="block mb-2">
                  <Typography variant="body" weight="medium">Breed *</Typography>
                </label>
                <BreedSelector
                  breeds={breeds}
                  selectedBreedId={dogData.breed_id}
                  onSelect={(breedId: any) => handleInputChange(dogKey, 'breed_id', breedId)}
                  className={errors[`${dogKey}.breed_id`] ? 'border-red-500' : ''}
                />
                {errors[`${dogKey}.breed_id`] && (
                  <Typography variant="caption" color="danger" className="mt-1">
                    {errors[`${dogKey}.breed_id`]}
                  </Typography>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block mb-2">
                  <Typography variant="body" weight="medium">Gender</Typography>
                </label>
                <select
                  value={dogData.gender}
                  onChange={(e) => handleInputChange(dogKey, 'gender', e.target.value as 'M' | 'F')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>

              {/* Birth Date */}
              <div>
                <label className="block mb-2">
                  <Typography variant="body" weight="medium">Birth Date</Typography>
                </label>
                <input
                  type="date"
                  value={dogData.birth_date}
                  onChange={(e) => handleInputChange(dogKey, 'birth_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block mb-2">
                  <Typography variant="body" weight="medium">Color</Typography>
                </label>
                <input
                  type="text"
                  value={dogData.color}
                  onChange={(e) => handleInputChange(dogKey, 'color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter color description"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Typography variant="body" color="secondary">
          Loading pedigree data...
        </Typography>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Typography variant="h3" weight="semibold" className="mb-2">
          Edit {lineTitle} for {currentDog.name}
        </Typography>
        <Typography variant="body" color="secondary">
          Update the information for dogs in the {lineTitle.toLowerCase()}. All fields marked with * are required.
        </Typography>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Parent (Generation 1) */}
        {renderDogSection(
          'parent',
          isEditingFatherLine ? '👨 Father (Generation 1)' : '👩 Mother (Generation 1)',
          formData.parent
        )}

        {/* Grandparents (Generation 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {renderDogSection(
            'grandparent1',
            isEditingFatherLine ? '👴 Paternal Grandfather' : '👵 Maternal Grandmother',
            formData.grandparent1
          )}
          {renderDogSection(
            'grandparent2',
            isEditingFatherLine ? '👵 Paternal Grandmother' : '👴 Maternal Grandfather',
            formData.grandparent2
          )}
        </div>

        {/* Great-Grandparents (Generation 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {renderDogSection(
            'greatGrandparent1',
            'Great-Grandparent 1 (Generation 3)',
            formData.greatGrandparent1
          )}
          {renderDogSection(
            'greatGrandparent2',
            'Great-Grandparent 2 (Generation 3)',
            formData.greatGrandparent2
          )}
        </div>

        {/* Error Display */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <Typography variant="body" color="danger">
              {errors.general}
            </Typography>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Pedigree'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PedigreeForm;
