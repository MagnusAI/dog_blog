import { useState } from 'react';
import { dogService } from '../services/supabaseService';
import type { DogImage } from '../services/supabaseService';
import { 
  CloudinaryUploadService, 
  createCloudinaryUploadService,
  type CloudinaryUploadResult,
  type CloudinaryUploadOptions 
} from '../services/cloudinaryUploadService';
import { useAuth } from '../contexts/AuthContext';

export interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export interface UploadOptions {
  imageType: 'profile' | 'gallery' | 'medical' | 'pedigree';
  altText?: string;
  displayOrder?: number;
  setAsProfile?: boolean; // For non-profile types, option to set as profile after upload
}

export interface UploadResult {
  dogImage: DogImage;
  cloudinaryResult: CloudinaryUploadResult;
}

export function useImageUpload() {
  const { user } = useAuth();
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    success: false
  });

  const resetState = () => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      success: false
    });
  };

  const uploadImage = async (
    dogId: string,
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> => {
    // Check authentication
    if (!user) {
      throw new Error('You must be logged in to upload images');
    }

    // Validate file
    const validation = CloudinaryUploadService.validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file');
    }

    resetState();
    setState(prev => ({ ...prev, uploading: true, progress: 10 }));

    try {
      // Initialize Cloudinary service
      const uploadService = createCloudinaryUploadService();
      
      // Prepare Cloudinary upload options
      const cloudinaryOptions: CloudinaryUploadOptions = {
        ...CloudinaryUploadService.getDogImageUploadOptions(dogId, options.imageType)
      };

      setState(prev => ({ ...prev, progress: 30 }));

      // Upload to Cloudinary
      const cloudinaryResult = await uploadService.uploadFile(file, cloudinaryOptions);
      
      setState(prev => ({ ...prev, progress: 70 }));

      // Prepare database record
      const dogImageData: Omit<DogImage, 'id' | 'created_at' | 'updated_at'> = {
        dog_id: dogId,
        image_url: cloudinaryResult.secure_url,
        image_public_id: cloudinaryResult.public_id,
        is_profile: options.imageType === 'profile' || options.setAsProfile === true,
        image_type: options.imageType,
        alt_text: options.altText || generateDefaultAltText(dogId, options.imageType),
        display_order: options.displayOrder || 0
      };

      // Save to database
      const dogImage = await dogService.addDogImage(dogImageData);

      setState(prev => ({ ...prev, progress: 100, success: true, uploading: false }));

      return {
        dogImage,
        cloudinaryResult
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        error: errorMessage,
        progress: 0 
      }));
      throw error;
    }
  };

  const uploadMultipleImages = async (
    dogId: string,
    files: File[],
    options: Omit<UploadOptions, 'setAsProfile'> & { 
      setFirstAsProfile?: boolean;
      startDisplayOrder?: number;
    }
  ): Promise<UploadResult[]> => {
    if (!user) {
      throw new Error('You must be logged in to upload images');
    }

    if (files.length === 0) {
      throw new Error('No files provided for upload');
    }

    // Validate all files first
    for (const file of files) {
      const validation = CloudinaryUploadService.validateImageFile(file);
      if (!validation.valid) {
        throw new Error(`${file.name}: ${validation.error}`);
      }
    }

    resetState();
    setState(prev => ({ ...prev, uploading: true }));

    const results: UploadResult[] = [];
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isFirst = i === 0;
        const progress = Math.round(((i + 1) / totalFiles) * 100);

        setState(prev => ({ ...prev, progress }));

        const uploadOptions: UploadOptions = {
          ...options,
          setAsProfile: isFirst && options.setFirstAsProfile,
          displayOrder: (options.startDisplayOrder || 0) + i
        };

        const result = await uploadImage(dogId, file, uploadOptions);
        results.push(result);
      }

      setState(prev => ({ ...prev, success: true, uploading: false }));
      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch upload failed';
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        error: errorMessage,
        progress: 0 
      }));
      throw error;
    }
  };

  const replaceImage = async (
    _imageId: number,
    _file: File,
    _options: Partial<UploadOptions> = {}
  ): Promise<UploadResult> => {
    if (!user) {
      throw new Error('You must be logged in to replace images');
    }

    // Note: This doesn't delete the old Cloudinary image
    // That should be handled by a backend cleanup job
    
    resetState();
    setState(prev => ({ ...prev, uploading: true, progress: 10 }));

    try {
      // For now, we'll require additional implementation
      throw new Error('Image replacement requires additional implementation - use uploadImage instead');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Replace failed';
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        error: errorMessage,
        progress: 0 
      }));
      throw error;
    }
  };

  return {
    state,
    uploadImage,
    uploadMultipleImages,
    replaceImage,
    resetState
  };
}

// Note: Image transformations are now handled by the Cloudinary upload preset
// to ensure compatibility with unsigned uploads

// Helper function to generate default alt text
function generateDefaultAltText(dogId: string, imageType: string): string {
  const dogName = dogId.split('/')[0] || dogId; // Extract name from ID if possible
  
  switch (imageType) {
    case 'profile':
      return `Profile photo of ${dogName}`;
    case 'gallery':
      return `Gallery photo of ${dogName}`;
    case 'medical':
      return `Medical photo of ${dogName}`;
    case 'pedigree':
      return `Pedigree documentation for ${dogName}`;
    default:
      return `Photo of ${dogName}`;
  }
}
