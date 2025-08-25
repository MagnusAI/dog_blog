import { useState, useRef } from 'react';
import { useImageUpload, type UploadOptions } from '../hooks/useImageUpload';
import Button from './ui/Button';
import Typography from './ui/Typography';

interface ImageUploadComponentProps {
  dogId: string;
  dogName?: string; // Made optional since it's no longer displayed
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
  allowMultiple?: boolean;
  defaultImageType?: 'profile' | 'gallery' | 'medical' | 'pedigree';
}

function ImageUploadComponent({
  dogId,
  onUploadSuccess,
  onUploadError,
  allowMultiple = false,
  defaultImageType = 'profile'
}: ImageUploadComponentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadOptions, setUploadOptions] = useState<UploadOptions>({
    imageType: defaultImageType,
    altText: '',
    displayOrder: 0
  });

  const { state, uploadImage, uploadMultipleImages, resetState } = useImageUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    resetState();
  };

  const handleSingleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      await uploadImage(dogId, selectedFiles[0], uploadOptions);
      onUploadSuccess?.();
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
    }
  };

  const handleMultipleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      await uploadMultipleImages(dogId, selectedFiles, {
        imageType: uploadOptions.imageType,
        setFirstAsProfile: uploadOptions.imageType === 'profile',
        startDisplayOrder: uploadOptions.displayOrder || 0
      });
      onUploadSuccess?.();
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
    }
  };

  const handleUpload = () => {
    if (allowMultiple && selectedFiles.length > 1) {
      handleMultipleUpload();
    } else {
      handleSingleUpload();
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alt Text
          </label>
          <input
            type="text"
            value={uploadOptions.altText || ''}
            onChange={(e) => setUploadOptions(prev => ({ 
              ...prev, 
              altText: e.target.value 
            }))}
            placeholder="Describe the image..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={state.uploading}
          />
        </div>


      {/* File Input */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={allowMultiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={state.uploading}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={state.uploading}
          className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors h-32 flex flex-col items-center justify-center rounded-lg bg-white"
        >
          <div className="text-4xl mb-2">📸</div>
          <Typography variant="body" className="text-gray-600 font-medium mb-1">
            Click to select {allowMultiple ? 'images' : 'image'}
          </Typography>
          <Typography variant="caption" color="muted" className="text-center">
            JPEG, PNG, WebP, GIF • Max 10MB
          </Typography>
        </button>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div>
          <Typography variant="h6" className="mb-3">
            Selected Files ({selectedFiles.length})
          </Typography>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Typography variant="caption">IMG</Typography>
                  </div>
                  <div>
                    <Typography variant="caption" weight="semibold">
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="muted" className="block">
                      {formatFileSize(file.size)} • {file.type}
                    </Typography>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={state.uploading}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {state.uploading && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Typography variant="caption">Uploading...</Typography>
            <Typography variant="caption">{state.progress}%</Typography>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {state.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <Typography variant="caption" color="danger">
            {state.error}
          </Typography>
        </div>
      )}

      {/* Success Display */}
      {state.success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Typography variant="caption" className="text-green-800">
            ✅ Upload successful!
          </Typography>
        </div>
      )}

    
        <Button
          className='w-full'
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || state.uploading}
          size="sm"
        >
          {state.uploading 
            ? 'Uploading...' 
            : `Upload ${selectedFiles.length > 1 ? `${selectedFiles.length} Images` : 'Image'}`
          }
        </Button>
    </div>
  );
}

export default ImageUploadComponent;
