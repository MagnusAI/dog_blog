// Cloudinary upload service for handling file uploads from browser
// Uses Cloudinary's unsigned upload preset for client-side uploads

export interface CloudinaryUploadOptions {
  folder?: string;
  tags?: string[];
  publicId?: string;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  version: number;
  version_id: string;
  signature: string;
  tags: string[];
  folder?: string;
  access_mode: string;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CloudinaryError {
  message: string;
  name: string;
  http_code: number;
}

export class CloudinaryUploadService {
  private uploadPreset: string;
  private baseUrl: string;

  constructor(cloudName: string, uploadPreset: string) {
    this.uploadPreset = uploadPreset;
    this.baseUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  }

  async uploadFile(
    file: File,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      
      // Required fields
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);

      // Optional parameters
      if (options.folder) {
        formData.append('folder', options.folder);
      }

      if (options.tags && options.tags.length > 0) {
        formData.append('tags', options.tags.join(','));
      }

      if (options.publicId) {
        formData.append('public_id', options.publicId);
      }

      fetch(this.baseUrl, {
        method: 'POST',
        body: formData,
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(error => {
              throw new Error(error.error?.message || `Upload failed with status ${response.status}`);
            });
          }
          return response.json();
        })
        .then((result: CloudinaryUploadResult) => {
          resolve(result);
        })
        .catch((error: Error) => {
          reject(error);
        });
    });
  }

  async uploadMultipleFiles(
    files: File[],
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult[]> {
    const uploadPromises = files.map((file, index) => {
      const fileOptions = { 
        ...options,
        // Add index to public_id if specified
        publicId: options.publicId ? `${options.publicId}_${index}` : undefined
      };
      return this.uploadFile(file, fileOptions);
    });

    return Promise.all(uploadPromises);
  }

  async deleteImage(_publicId: string): Promise<void> {
    // Note: This requires a backend endpoint since deletion requires API secret
    // For now, this is a placeholder - implement with your backend
    console.warn('Image deletion requires backend implementation for security');
    throw new Error('Image deletion must be implemented on the backend for security reasons');
  }

  // Utility method to generate upload options for dog images
  static getDogImageUploadOptions(
    dogId: string, 
    imageType: 'profile' | 'gallery' | 'medical' | 'pedigree'
  ): CloudinaryUploadOptions {
    const timestamp = Date.now();
    
    return {
      folder: 'dog_images',
      tags: ['dog_kennel', imageType, dogId],
      publicId: `${dogId.replace(/[^a-zA-Z0-9]/g, '_')}_${imageType}_${timestamp}`
    };
  }

  // Utility method to validate image file
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return { valid: false, error: 'Image must be smaller than 10MB' };
    }

    // Check for supported formats
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!supportedFormats.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Supported formats: JPEG, PNG, WebP, GIF' 
      };
    }

    return { valid: true };
  }
}

// Environment configuration helper
export function createCloudinaryUploadService(): CloudinaryUploadService {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Missing Cloudinary configuration. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET environment variables.'
    );
  }

  return new CloudinaryUploadService(cloudName, uploadPreset);
}
