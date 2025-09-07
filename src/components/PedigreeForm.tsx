import React, { useState, useEffect } from 'react';
import { dogService } from '../services/supabaseService';
import type { Dog } from '../services/supabaseService';
import { createCloudinaryUploadService, CloudinaryUploadService } from '../services/cloudinaryUploadService';
import Button from './ui/Button';
import Typography from './ui/Typography';
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
    name?: string;
    image?: File;
    imageUrl?: string;
    imagePublicId?: string;
  };
  // Generation 2 (grandparents)
  grandparent1?: {
    id: string;
    name?: string;
    image?: File;
    imageUrl?: string;
    imagePublicId?: string;
  };
  grandparent2?: {
    id: string;
    name?: string;
    image?: File;
    imageUrl?: string;
    imagePublicId?: string;
  };
  // Generation 3 (great-grandparents)
  greatGrandparent1?: {
    id: string;
    name?: string;
    image?: File;
    imageUrl?: string;
    imagePublicId?: string;
  };
  greatGrandparent2?: {
    id: string;
    name?: string;
    image?: File;
    imageUrl?: string;
    imagePublicId?: string;
  };
  greatGrandparent3?: {
    id: string;
    name?: string;
    image?: File;
    imageUrl?: string;
    imagePublicId?: string;
  };
  greatGrandparent4?: {
    id: string;
    name?: string;
    image?: File;
    imageUrl?: string;
    imagePublicId?: string;
  };
}

type DogFormEntry = NonNullable<PedigreeFormData[keyof PedigreeFormData]>;

const createEmptyDogEntry = (): DogFormEntry => ({
  id: '',
  name: '',
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditingFatherLine = pedigreeType === 'father';
  const lineTitle = isEditingFatherLine ? "Father's Line" : "Mother's Line";

  // Helper function to get path from dog key
  const getPathFromDogKey = (dogKey: string): string => {
    const basePath = isEditingFatherLine ? '0' : '1';
    
    switch (dogKey) {
      case 'parent': return basePath;
      case 'grandparent1': return basePath + '0';
      case 'grandparent2': return basePath + '1';
      case 'greatGrandparent1': return basePath + '00';
      case 'greatGrandparent2': return basePath + '01';
      case 'greatGrandparent3': return basePath + '10';
      case 'greatGrandparent4': return basePath + '11';
      default: return '';
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [currentDog, pedigreeType]);

  const loadInitialData = async () => {
    try {
      // Load current pedigree data using path-based system
      if (currentDog.all_ancestors) {
        // Sort ancestors by generation and path for consistent ordering
        const sortedAncestors = [...currentDog.all_ancestors].sort((a, b) => {
          // First sort by generation
          if (a.generation !== b.generation) {
            return a.generation - b.generation;
          }
          // Then sort by path (lexicographically)
          return (a.path || '').localeCompare(b.path || '');
        });
        
        const basePath = isEditingFatherLine ? '0' : '1';
        
        // Debug logging
        console.log('PedigreeForm - All ancestors:', sortedAncestors);
        console.log('PedigreeForm - Base path:', basePath);
        console.log('PedigreeForm - Available paths:', sortedAncestors.map(a => a.path));
        
        // Find parent (generation 1)
        const parent = sortedAncestors.find(a => a.path === basePath);

        // Find grandparents (generation 2) - father and mother of the parent
        const grandparent1 = sortedAncestors.find(a => a.path === basePath + '0'); // Father's father or Mother's father
        const grandparent2 = sortedAncestors.find(a => a.path === basePath + '1'); // Father's mother or Mother's mother

        // Find great-grandparents (generation 3) - 4 great-grandparents
        const greatGrandparent1 = sortedAncestors.find(a => a.path === basePath + '00'); // Father's father's father or Mother's father's father
        const greatGrandparent2 = sortedAncestors.find(a => a.path === basePath + '01'); // Father's father's mother or Mother's father's mother
        const greatGrandparent3 = sortedAncestors.find(a => a.path === basePath + '10'); // Father's mother's father or Mother's mother's father
        const greatGrandparent4 = sortedAncestors.find(a => a.path === basePath + '11'); // Father's mother's mother or Mother's mother's mother

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
            imageUrl: profileImage?.image_url,
            imagePublicId: profileImage?.image_public_id
          };
        }

        if (grandparent1) {
          // Get profile image if available
          let profileImage;
          if (Array.isArray(grandparent1.parent.profile_image)) {
            profileImage = grandparent1.parent.profile_image.find(img => img.is_profile) || grandparent1.parent.profile_image[0];
          }
          
          newFormData.grandparent1 = {
            id: grandparent1.parent.id,
            name: grandparent1.parent.name,
            imageUrl: profileImage?.image_url,
            imagePublicId: profileImage?.image_public_id
          };
        }

        if (grandparent2) {
          // Get profile image if available
          let profileImage;
          if (Array.isArray(grandparent2.parent.profile_image)) {
            profileImage = grandparent2.parent.profile_image.find(img => img.is_profile) || grandparent2.parent.profile_image[0];
          }
          
          newFormData.grandparent2 = {
            id: grandparent2.parent.id,
            name: grandparent2.parent.name,
            imageUrl: profileImage?.image_url,
            imagePublicId: profileImage?.image_public_id
          };
        }

        if (greatGrandparent1) {
          // Get profile image if available
          let profileImage;
          if (Array.isArray(greatGrandparent1.parent.profile_image)) {
            profileImage = greatGrandparent1.parent.profile_image.find(img => img.is_profile) || greatGrandparent1.parent.profile_image[0];
          }
          
          newFormData.greatGrandparent1 = {
            id: greatGrandparent1.parent.id,
            name: greatGrandparent1.parent.name,
            imageUrl: profileImage?.image_url,
            imagePublicId: profileImage?.image_public_id
          };
        }

        if (greatGrandparent2) {
          // Get profile image if available
          let profileImage;
          if (Array.isArray(greatGrandparent2.parent.profile_image)) {
            profileImage = greatGrandparent2.parent.profile_image.find(img => img.is_profile) || greatGrandparent2.parent.profile_image[0];
          }
          
          newFormData.greatGrandparent2 = {
            id: greatGrandparent2.parent.id,
            name: greatGrandparent2.parent.name,
            imageUrl: profileImage?.image_url,
            imagePublicId: profileImage?.image_public_id
          };
        }

        if (greatGrandparent3) {
          // Get profile image if available
          let profileImage;
          if (Array.isArray(greatGrandparent3.parent.profile_image)) {
            profileImage = greatGrandparent3.parent.profile_image.find(img => img.is_profile) || greatGrandparent3.parent.profile_image[0];
          }
          
          newFormData.greatGrandparent3 = {
            id: greatGrandparent3.parent.id,
            name: greatGrandparent3.parent.name,
            imageUrl: profileImage?.image_url,
            imagePublicId: profileImage?.image_public_id
          };
        }

        if (greatGrandparent4) {
          // Get profile image if available
          let profileImage;
          if (Array.isArray(greatGrandparent4.parent.profile_image)) {
            profileImage = greatGrandparent4.parent.profile_image.find(img => img.is_profile) || greatGrandparent4.parent.profile_image[0];
          }
          
          newFormData.greatGrandparent4 = {
            id: greatGrandparent4.parent.id,
            name: greatGrandparent4.parent.name,
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

  const handleInputChange = async (
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

    // Auto-fill dog name and image when ID is entered
    if (field === 'id' && value && value.trim()) {
      try {
        const existingDog = await dogService.getDog(value.trim());
        if (existingDog) {
          // Get profile image if available
          let profileImage: any = null;
          if (Array.isArray(existingDog.profile_image)) {
            profileImage = existingDog.profile_image.find((img: any) => img.is_profile) || existingDog.profile_image[0];
          }
          
          setFormData(prev => ({
            ...prev,
            [dogKey]: {
              ...(prev[dogKey] || createEmptyDogEntry()),
              name: existingDog.name,
              imageUrl: profileImage?.image_url,
              imagePublicId: profileImage?.image_public_id
            }
          }));
        }
      } catch (error) {
        // Dog doesn't exist, that's fine - we'll create it later
        console.log(`Dog with ID ${value} doesn't exist yet, will be created on save`);
      }
    }

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate each dog entry that has data
    Object.entries(formData).forEach(([dogKey, dogData]) => {
      if (dogData && dogData.id.trim()) {
        if (!dogData.id.trim()) {
          newErrors[`${dogKey}.id`] = 'Parent ID is required';
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
      const uploadService = createCloudinaryUploadService();
      const relationshipType = isEditingFatherLine ? 'SIRE' : 'DAM';
      
      // First, clear existing pedigree relationships for this line
      await dogService.clearPedigreeRelationships(currentDog.id, relationshipType);
      
      // Process each dog entry
      for (const [dogKey, dogData] of Object.entries(formData)) {
        if (!dogData || !dogData.id.trim()) continue;
        
        try {
          // Check if dog exists, create if it doesn't
          let existingDog;
          try {
            existingDog = await dogService.getDog(dogData.id);
          } catch (error) {
            // Dog doesn't exist, create it with placeholder data
            const newDog = {
              id: dogData.id,
              name: dogData.name || `Unknown Dog (${dogData.id})`,
              breed_id: 1, // Default breed ID - you might want to make this configurable
              gender: 'M' as 'M' | 'F', // Default to Male
              is_deceased: false
            };
            existingDog = await dogService.createDog(newDog);
            console.log(`Created new dog: ${dogData.id}`);
          }
          
          // Upload image if provided
          if (dogData.image && existingDog) {
            try {
              const uploadOptions = CloudinaryUploadService.getDogImageUploadOptions(
                dogData.id, 
                'pedigree'
              );
              
              const uploadResult = await uploadService.uploadFile(dogData.image, uploadOptions);
              
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
            } catch (uploadError) {
              console.error(`Failed to upload image for ${dogData.name}:`, uploadError);
              // Continue even if image upload fails
            }
          }
          
          // Create pedigree relationship
          const path = getPathFromDogKey(dogKey);
          if (path) {
            const relationshipData = {
              dog_id: currentDog.id,
              parent_id: dogData.id,
              relationship_type: relationshipType as 'SIRE' | 'DAM',
              generation: path.length,
              path: path
            };
            
            await dogService.addPedigreeRelationship(relationshipData);
            console.log(`Created pedigree relationship: ${dogData.name} at path ${path} (generation ${path.length})`);
          }
          
        } catch (error) {
          console.error(`Error processing ${dogData.name}:`, error);
          // Continue with other dogs even if one fails
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
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <Typography variant="h5" weight="semibold" className="text-gray-800">
          {title}
        </Typography>
        
        <div className="flex gap-6">
          {/* Photo Section */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div 
                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 relative group cursor-pointer hover:border-gray-400 hover:bg-gray-100 transition-colors"
                onClick={() => document.getElementById(`photo-input-${dogKey}`)?.click()}
              >
                {dogData.image ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={URL.createObjectURL(dogData.image)}
                      alt={`${dogData.name || 'Dog'} preview`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Typography variant="body" className="text-white font-medium">
                        Upload
                      </Typography>
                    </div>
                  </div>
                ) : dogData.imagePublicId ? (
                  <div className="relative w-full h-full group">
                    <ClickableCloudinaryImage
                      publicId={dogData.imagePublicId}
                      width={128}
                      height={128}
                      alt={`${dogData.name || 'Dog'} photo`}
                      crop="fill"
                      className="rounded-lg"
                      disableEnlarge={true}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Typography variant="body" className="text-white font-medium">
                        Upload
                      </Typography>
                    </div>
                  </div>
                ) : dogData.imageUrl ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={dogData.imageUrl}
                      alt={`${dogData.name || 'Dog'} photo`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Typography variant="body" className="text-white font-medium">
                        Upload
                      </Typography>
                    </div>
                  </div>
                ) : (
                  <div className="text-center place-items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <Typography variant="caption" color="muted" className="text-xs">
                      Click to Add Photo
                    </Typography>
                  </div>
                )}
              </div>
              <input
                id={`photo-input-${dogKey}`}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(dogKey, file);
                }}
                className="hidden"
              />
            </div>
          </div>
          
          {/* Form Fields */}
          <div className="flex-1 space-y-4">
            {/* Parent ID */}
            <div>
              <label className="block mb-2">
                <Typography variant="body" weight="medium">Parent ID *</Typography>
              </label>
              <input
                type="text"
                value={dogData.id}
                onChange={(e) => handleInputChange(dogKey, 'id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[`${dogKey}.id`] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter parent dog ID"
              />
              {errors[`${dogKey}.id`] && (
                <Typography variant="caption" color="danger" className="mt-1">
                  {errors[`${dogKey}.id`]}
                </Typography>
              )}
            </div>

            {/* Dog Name (optional, for display) */}
            <div>
              <label className="block mb-2">
                <Typography variant="body" weight="medium">Dog Name (optional)</Typography>
              </label>
              <input
                type="text"
                value={dogData.name || ''}
                onChange={(e) => handleInputChange(dogKey, 'name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter dog name (will be auto-filled if dog exists)"
              />
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
            isEditingFatherLine ? '👴 Paternal Grandfather (Father\'s Father)' : '👴 Maternal Grandfather (Mother\'s Father)',
            formData.grandparent1
          )}
          {renderDogSection(
            'grandparent2',
            isEditingFatherLine ? '👵 Paternal Grandmother (Father\'s Mother)' : '👵 Maternal Grandmother (Mother\'s Mother)',
            formData.grandparent2
          )}
        </div>

        {/* Great-Grandparents (Generation 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {renderDogSection(
            'greatGrandparent1',
            isEditingFatherLine ? '👴 Great-Grandfather (Father\'s Father\'s Father)' : '👴 Great-Grandfather (Mother\'s Father\'s Father)',
            formData.greatGrandparent1
          )}
          {renderDogSection(
            'greatGrandparent2',
            isEditingFatherLine ? '👵 Great-Grandmother (Father\'s Father\'s Mother)' : '👵 Great-Grandmother (Mother\'s Father\'s Mother)',
            formData.greatGrandparent2
          )}
          {renderDogSection(
            'greatGrandparent3',
            isEditingFatherLine ? '👴 Great-Grandfather (Father\'s Mother\'s Father)' : '👴 Great-Grandfather (Mother\'s Mother\'s Father)',
            formData.greatGrandparent3
          )}
          {renderDogSection(
            'greatGrandparent4',
            isEditingFatherLine ? '👵 Great-Grandmother (Father\'s Mother\'s Mother)' : '👵 Great-Grandmother (Mother\'s Mother\'s Mother)',
            formData.greatGrandparent4
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
