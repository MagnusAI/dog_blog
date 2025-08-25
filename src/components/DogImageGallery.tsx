import { useState, useEffect } from 'react';
import { dogService } from '../services/supabaseService';
import type { DogImage } from '../services/supabaseService';
import DogImageManager from './DogImageManager';
import ImageUploadComponent from './ImageUploadComponent';
import Button from './ui/Button';
import Typography from './ui/Typography';

interface DogImageGalleryProps {
  dogId: string;
  dogName: string;
  showUpload?: boolean;
}

function DogImageGallery({ dogId, dogName, showUpload = true }: DogImageGalleryProps) {
  const [images, setImages] = useState<DogImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    loadImages();
  }, [dogId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const imageData = await dogService.getDogImages(dogId);
      setImages(imageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    loadImages(); // Refresh the images
    setShowUploadForm(false); // Close upload form
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Typography variant="body">Loading images...</Typography>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      {showUpload && (
        <div className="flex items-center justify-between">
          <Typography variant="h4">
            Images for {dogName}
          </Typography>
          <Button
            variant="primary"
            onClick={() => setShowUploadForm(!showUploadForm)}
          >
            {showUploadForm ? 'Cancel Upload' : '📸 Upload Images'}
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <Typography variant="caption" color="danger">
            {error}
          </Typography>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <ImageUploadComponent
          dogId={dogId}
          dogName={dogName}
          allowMultiple={true}
          defaultImageType="gallery"
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      )}

      {/* Image Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Gallery View */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Typography variant="h5" className="mb-4">
            Gallery View
          </Typography>
          
          {images.length === 0 ? (
            <div className="text-center py-8">
              <Typography variant="body" color="muted">
                No images uploaded yet
              </Typography>
              <Typography variant="caption" color="muted" className="block mt-2">
                Click "Upload Images" to get started
              </Typography>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {images.slice(0, 4).map((image) => (
                <div key={image.id} className="aspect-square overflow-hidden rounded-lg border">
                  <img
                    src={image.image_url}
                    alt={image.alt_text || `${dogName} image`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCA4MEwxMDAgMTIwTDE0MCA4MFYxNDBINjBWODBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPg==';
                    }}
                  />
                </div>
              ))}
              {images.length > 4 && (
                <div className="aspect-square bg-gray-100 rounded-lg border flex items-center justify-center">
                  <Typography variant="caption" color="muted" className="text-center">
                    +{images.length - 4}<br />more images
                  </Typography>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Image */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Typography variant="h5" className="mb-4">
            Profile Image
          </Typography>
          
          {(() => {
            const profileImage = images.find(img => img.is_profile);
            
            if (!profileImage) {
              return (
                <div className="aspect-square bg-gray-100 rounded-lg border flex items-center justify-center">
                  <div className="text-center">
                    <Typography variant="h2" color="muted" className="mb-2">
                      {dogName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </Typography>
                    <Typography variant="caption" color="muted">
                      No profile image
                    </Typography>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-lg border">
                  <img
                    src={profileImage.image_url}
                    alt={profileImage.alt_text || `${dogName} profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCA4MEwxMDAgMTIwTDE0MCA4MFYxNDBINjBWODBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPg==';
                    }}
                  />
                </div>
                {profileImage.alt_text && (
                  <Typography variant="caption" color="muted">
                    {profileImage.alt_text}
                  </Typography>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Detailed Image Manager */}
      <DogImageManager dogId={dogId} dogName={dogName} />
    </div>
  );
}

export default DogImageGallery;
