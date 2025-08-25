import { useState, useEffect } from 'react';
import { dogService } from '../services/supabaseService';
import type { DogImage } from '../services/supabaseService';
import Button from './ui/Button';
import Typography from './ui/Typography';
import Badge from './ui/Badge';

interface DogImageManagerProps {
  dogId: string;
  dogName: string;
}

function DogImageManager({ dogId, dogName }: DogImageManagerProps) {
  const [images, setImages] = useState<DogImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, [dogId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const imageData = await dogService.getDogImages(dogId);
      setImages(imageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleSetProfileImage = async (imageId: number) => {
    try {
      await dogService.setProfileImage(dogId, imageId);
      await loadImages(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set profile image');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await dogService.deleteDogImage(imageId);
      await loadImages(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  const getImageTypeColor = (type: string): "primary" | "secondary" | "success" | "warning" | "danger" | "info" => {
    switch (type) {
      case 'profile': return 'primary';
      case 'gallery': return 'secondary';
      case 'medical': return 'danger';
      case 'pedigree': return 'info';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <Typography variant="body">Loading images...</Typography>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <Typography variant="h4" className="mb-4">
        Images for {dogName}
      </Typography>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <Typography variant="caption" color="danger">
            {error}
          </Typography>
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center py-8">
          <Typography variant="body" color="muted">
            No images uploaded yet
          </Typography>
          <Typography variant="caption" color="muted" className="block mt-2">
            Upload images through your image management system
          </Typography>
        </div>
      ) : (
        <div className="space-y-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="border rounded-lg p-4 flex items-start space-x-4"
            >
              {/* Image thumbnail */}
              <div className="flex-shrink-0">
                <img
                  src={image.image_url}
                  alt={image.alt_text || `${dogName} image`}
                  className="w-20 h-20 object-cover rounded-lg border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMkw0MCA0OEw1NiAzMlY1NkgyNFYzMloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                  }}
                />
              </div>

              {/* Image info */}
              <div className="flex-grow">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant={getImageTypeColor(image.image_type)}>
                    {image.image_type}
                  </Badge>
                  {image.is_profile && (
                    <Badge variant="primary">Profile</Badge>
                  )}
                </div>
                
                {image.alt_text && (
                  <Typography variant="caption" className="block mb-1">
                    {image.alt_text}
                  </Typography>
                )}
                
                <Typography variant="caption" color="muted" className="block">
                  Order: {image.display_order} • ID: {image.image_public_id}
                </Typography>
                
                <Typography variant="caption" color="muted" className="block">
                  Added: {new Date(image.created_at).toLocaleDateString()}
                </Typography>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 space-x-2">
                {!image.is_profile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetProfileImage(image.id)}
                  >
                    Set as Profile
                  </Button>
                )}
                
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteImage(image.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <Typography variant="h6" className="mb-2">
          📝 Image Management Notes
        </Typography>
        <Typography variant="caption" color="muted" className="block mb-1">
          • Upload images through your Cloudinary dashboard or image upload component
        </Typography>
        <Typography variant="caption" color="muted" className="block mb-1">
          • Only one profile image is allowed per dog (automatically enforced)
        </Typography>
        <Typography variant="caption" color="muted" className="block mb-1">
          • Image types: Profile, Gallery, Medical, Pedigree
        </Typography>
        <Typography variant="caption" color="muted" className="block">
          • Use display_order to control gallery image sequence
        </Typography>
      </div>
    </div>
  );
}

export default DogImageManager;
