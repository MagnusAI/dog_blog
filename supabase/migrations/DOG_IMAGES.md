# Dog Images System

This document describes the dog images management system with Cloudinary integration.

## Overview

The dog images system allows storing multiple images per dog with different types and automatic profile image management. It's designed to work seamlessly with Cloudinary for image hosting and transformations.

## Database Schema

### Table: `dog_images`

```sql
CREATE TABLE dog_images (
    id SERIAL PRIMARY KEY,
    dog_id VARCHAR(50) NOT NULL,                    -- References dogs.id
    image_url VARCHAR(500) NOT NULL,                -- Full Cloudinary secure_url
    image_public_id VARCHAR(255) NOT NULL,          -- Cloudinary public_id for transformations
    is_profile BOOLEAN DEFAULT FALSE,               -- Only one profile image per dog
    image_type VARCHAR(20) DEFAULT 'profile',       -- 'profile', 'gallery', 'medical', 'pedigree'
    alt_text VARCHAR(255),                          -- Accessibility text
    display_order INTEGER DEFAULT 0,                -- Order for galleries
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Features

1. **Multiple Image Types**: Profile, gallery, medical, pedigree photos
2. **Single Profile Constraint**: Only one profile image per dog (enforced by triggers)
3. **Cloudinary Integration**: Stores both full URL and public_id
4. **Accessibility**: Alt text for screen readers
5. **Ordering**: Display order for galleries
6. **Performance**: Proper indexes for fast queries

## Automatic Profile Image Management

### Database Triggers

The system uses PostgreSQL triggers to automatically ensure only one profile image per dog:

```sql
-- Function ensures single profile image
CREATE OR REPLACE FUNCTION ensure_single_profile_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_profile = TRUE THEN
        -- Set all other images for this dog to not be profile
        UPDATE dog_images 
        SET is_profile = FALSE, updated_at = NOW()
        WHERE dog_id = NEW.dog_id 
        AND is_profile = TRUE 
        AND (TG_OP = 'INSERT' OR id != NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### How It Works

1. When setting `is_profile = TRUE` for any image
2. All other images for that dog automatically become `is_profile = FALSE`
3. This happens at the database level, preventing race conditions

## Service API

### Interface

```typescript
export interface DogImage {
  id: number;
  dog_id: string;
  image_url: string;
  image_public_id: string;
  is_profile: boolean;
  image_type: 'profile' | 'gallery' | 'medical' | 'pedigree';
  alt_text?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}
```

### Available Functions

```typescript
// Get all images for a dog (profile first, then by display order)
dogService.getDogImages(dogId: string): Promise<DogImage[]>

// Get only the profile image for a dog
dogService.getDogProfileImage(dogId: string): Promise<DogImage | null>

// Add a new image
dogService.addDogImage(image: Omit<DogImage, 'id' | 'created_at' | 'updated_at'>): Promise<DogImage>

// Update an existing image
dogService.updateDogImage(id: number, updates: Partial<DogImage>): Promise<DogImage>

// Delete an image
dogService.deleteDogImage(id: number): Promise<void>

// Set an image as the profile image (trigger handles the rest)
dogService.setProfileImage(dogId: string, imageId: number): Promise<void>

// Reorder multiple images
dogService.reorderDogImages(imageUpdates: { id: number; display_order: number }[]): Promise<void>
```

## Usage Examples

### Adding a Profile Image

```typescript
const newImage = await dogService.addDogImage({
  dog_id: 'DK10420/2025',
  image_url: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/dog_images/batman_profile.jpg',
  image_public_id: 'dog_images/batman_profile',
  is_profile: true,
  image_type: 'profile',
  alt_text: 'Batman the Norfolk Terrier portrait',
  display_order: 0
});
```

### Adding Gallery Images

```typescript
const galleryImages = [
  {
    dog_id: 'DK10420/2025',
    image_url: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/dog_images/batman_playing.jpg',
    image_public_id: 'dog_images/batman_playing',
    is_profile: false,
    image_type: 'gallery' as const,
    alt_text: 'Batman playing in the garden',
    display_order: 1
  },
  {
    dog_id: 'DK10420/2025',
    image_url: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/dog_images/batman_show.jpg',
    image_public_id: 'dog_images/batman_show',
    is_profile: false,
    image_type: 'gallery' as const,
    alt_text: 'Batman at a dog show',
    display_order: 2
  }
];

for (const image of galleryImages) {
  await dogService.addDogImage(image);
}
```

### Getting Dog Images

```typescript
// Get all images for a dog
const allImages = await dogService.getDogImages('DK10420/2025');

// Get just the profile image
const profileImage = await dogService.getDogProfileImage('DK10420/2025');

// Display images in UI
allImages.forEach(image => {
  console.log(`${image.image_type}: ${image.image_url}`);
  if (image.is_profile) {
    console.log('^ This is the profile image');
  }
});
```

### Setting a New Profile Image

```typescript
// This will automatically unset the current profile image
await dogService.setProfileImage('DK10420/2025', newImageId);
```

## Cloudinary Integration

### Image URL Structure

- **image_url**: Full Cloudinary secure_url (used for display)
- **image_public_id**: Cloudinary public_id (used for transformations and deletions)

### Example Transformations

```typescript
// Generate different sizes using public_id
const thumbnailUrl = `https://res.cloudinary.com/your-cloud/image/upload/c_fill,w_150,h_150/${image.image_public_id}`;
const mediumUrl = `https://res.cloudinary.com/your-cloud/image/upload/c_fill,w_400,h_400/${image.image_public_id}`;
const largeUrl = `https://res.cloudinary.com/your-cloud/image/upload/c_fill,w_800,h_600/${image.image_public_id}`;
```

### Deletion

```typescript
// Delete from Cloudinary using public_id
await cloudinary.uploader.destroy(image.image_public_id);

// Then delete from database
await dogService.deleteDogImage(image.id);
```

## UI Component

The `DogImageManager` component provides a complete interface for:

- Viewing all images for a dog
- Setting profile images
- Deleting images
- Displaying image metadata
- Error handling

### Usage

```tsx
<DogImageManager dogId="DK10420/2025" dogName="Batman" />
```

## Row Level Security

The table inherits the same RLS policies as other tables:

- **Anonymous users**: Can read all images
- **Authenticated users**: Can create, update, and delete images

## Performance Considerations

### Indexes

```sql
CREATE INDEX idx_dog_images_dog_id ON dog_images(dog_id);
CREATE INDEX idx_dog_images_dog_profile ON dog_images(dog_id, is_profile);
CREATE INDEX idx_dog_images_type ON dog_images(image_type);
CREATE INDEX idx_dog_images_display_order ON dog_images(dog_id, display_order);
```

### Efficient Queries

```sql
-- Get profile image (uses idx_dog_images_dog_profile)
SELECT * FROM dog_images WHERE dog_id = ? AND is_profile = TRUE;

-- Get all images ordered (uses idx_dog_images_dog_id)
SELECT * FROM dog_images 
WHERE dog_id = ? 
ORDER BY is_profile DESC, display_order ASC, created_at ASC;
```

## Migration

Run the migration to create the table:

```bash
# Apply the migration (when connected to Supabase)
npx supabase db push
```

The migration file: `supabase/migrations/20241220000002_add_dog_images_table.sql`

## Future Enhancements

Potential improvements:

1. **Image upload component** with drag-and-drop
2. **Batch operations** (upload multiple images)
3. **Image compression** settings
4. **Watermarking** for pedigree images
5. **Face detection** for automatic cropping
6. **Image tagging** system
7. **Backup to multiple clouds**
