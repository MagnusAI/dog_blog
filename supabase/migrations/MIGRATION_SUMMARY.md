# Migration Summary

This document tracks all database migrations in the project.

## Migration Files

### 1. `20241220000000_initial_dog_kennel_schema.sql`
**Status**: ✅ Applied
**Description**: Creates the core tables for the dog kennel management system

**Tables Created**:
- `breeds` - Dog breed information
- `dogs` - Individual dog records
- `titles` - Dog titles and achievements
- `pedigree_relationships` - Parent-child relationships between dogs
- `my_dogs` - User's personal dog collection

**Features**:
- Row Level Security (RLS) policies
- Foreign key constraints
- Updated_at triggers
- Seed data for breeds

### 2. `20241220000001_readonly_anonymous_policies.sql`
**Status**: ✅ Applied
**Description**: Configures RLS policies for anonymous read access and authenticated write access

**Changes**:
- Anonymous users: Read-only access to all tables
- Authenticated users: Full CRUD operations
- Separate policies for INSERT, UPDATE, DELETE operations

### 3. `20241220000002_add_dog_images_table.sql`
**Status**: ⏳ Ready to Apply
**Description**: Creates dog_images table for Cloudinary integration

**Tables Created**:
- `dog_images` - Image storage with Cloudinary integration

**Features**:
- Multiple image types (profile, gallery, medical, pedigree)
- Automatic single profile image constraint (via triggers)
- Cloudinary URL and public_id storage
- Display ordering for galleries
- Full RLS policy set
- Performance indexes

**Key Constraints**:
- Only one profile image per dog (enforced by PostgreSQL trigger)
- Foreign key to dogs table with CASCADE delete
- Check constraint for image_type values

## To Apply New Migration

When you're ready to apply the dog images migration:

```bash
# Connect to your Supabase project (if using local development)
npx supabase db push

# Or apply manually in Supabase Dashboard SQL editor
# Copy and run the contents of 20241220000002_add_dog_images_table.sql
```

## Migration Dependencies

```
20241220000000_initial_dog_kennel_schema.sql
    ↓
20241220000001_readonly_anonymous_policies.sql  
    ↓
20241220000002_add_dog_images_table.sql ← Ready to apply
```

## Post-Migration Steps

After applying the dog images migration:

1. ✅ **Service Functions**: Already implemented in `supabaseService.ts`
2. ✅ **TypeScript Interfaces**: Already defined
3. ✅ **UI Component**: `DogImageManager` component created
4. ✅ **Documentation**: Complete in `DOG_IMAGES.md`

## Database Schema Overview

After all migrations:

```
breeds (10 records)
├── dogs (linked by breed_id)
│   ├── titles (linked by dog_id)
│   ├── pedigree_relationships (linked by dog_id/parent_id)
│   ├── my_dogs (linked by dog_id)
│   └── dog_images (linked by dog_id) ← NEW
```

## Migration Best Practices

1. **Always backup** before applying migrations
2. **Test migrations** on staging environment first
3. **Apply in order** (timestamps ensure correct sequence)
4. **Verify RLS policies** after applying
5. **Check indexes** for performance
