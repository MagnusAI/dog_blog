# Sync My Dogs Edge Function

A Supabase Edge Function that syncs dog data from your local `my_dogs` table with the DKK (Danish Kennel Club) hundeweb.dk database.

## Overview

This function fetches dog IDs from your Supabase `my_dogs` table and synchronizes their detailed information from the DKK database, including basic information, titles, pedigree relationships, and extended pedigree trees. It's designed to keep your local dog database up-to-date with the latest information from the official DKK registry.

## Features

- **Local Database Integration**: Reads dog IDs directly from your `my_dogs` table
- **Comprehensive Data Sync**: Fetches and syncs:
  - Basic dog information (name, gender, breed, birth/death dates, color, etc.)
  - Dog titles and championships
  - Pedigree relationships (parents)
  - Extended pedigree trees (up to 4 generations)
  - Breed information
- **Error Handling**: Gracefully handles dogs that don't exist or are inaccessible in the DKK database
- **Placeholder Creation**: Optionally creates placeholder records for missing parent dogs
- **Detailed Statistics**: Provides comprehensive sync statistics and error reporting
- **Rate Limiting**: Includes respectful delays to avoid overwhelming the DKK servers

## Prerequisites

### Environment Variables

The following environment variables must be set in your Supabase project:

```
HUNDEWEB_USERNAME=your_dkk_username
HUNDEWEB_PASSWORD=your_dkk_password
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Schema

Your Supabase database should have the following tables:

- `my_dogs` - Contains the dog IDs you want to sync
- `dogs` - Main dog information table
- `breeds` - Dog breed information
- `titles` - Dog titles and championships
- `pedigree_relationships` - Parent-child relationships between dogs

## Usage

### Basic Usage

```bash
# Sync all dogs in my_dogs table
GET https://your-project.supabase.co/functions/v1/sync-my-dogs

# Using curl
curl -X GET "https://your-project.supabase.co/functions/v1/sync-my-dogs"
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | none | Maximum number of dogs to process (processes most recent first) |
| `placeholders` | boolean | `true` | Whether to create placeholder records for missing parent dogs |

### Examples

```bash
# Process only the 10 most recent dogs
GET https://your-project.supabase.co/functions/v1/sync-my-dogs?limit=10

# Sync without creating placeholder parent dogs
GET https://your-project.supabase.co/functions/v1/sync-my-dogs?placeholders=false

# Combine parameters
GET https://your-project.supabase.co/functions/v1/sync-my-dogs?limit=5&placeholders=false
```

## Response Format

### Success Response

```json
{
  "success": true,
  "processedDogsCount": 15,
  "skippedDogIds": ["DK12345", "DK67890"],
  "syncStats": {
    "breedsProcessed": 3,
    "breedsCreated": 1,
    "breedsUpdated": 2,
    "dogsProcessed": 15,
    "dogsCreated": 5,
    "dogsUpdated": 10,
    "placeholderDogsCreated": 8,
    "titlesProcessed": 45,
    "titlesCreated": 45,
    "pedigreeProcessed": 30,
    "pedigreeCreated": 28,
    "pedigreeSkipped": 2,
    "pedigreeTreesProcessed": 12,
    "pedigreeAncestorsCreated": 156,
    "errors": [],
    "dogNotFoundCount": 2,
    "dogAccessDeniedCount": 0
  }
}
```

### Error Response

```json
{
  "success": false,
  "processedDogsCount": 0,
  "skippedDogIds": [],
  "error": "Failed to login to hundeweb.dk",
  "syncStats": null
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation completed successfully |
| `processedDogsCount` | number | Number of dogs successfully processed |
| `skippedDogIds` | array | Dog IDs that were skipped (not found or access denied) |
| `syncStats` | object | Detailed synchronization statistics |
| `error` | string | Error message if operation failed |

### Sync Statistics Fields

| Field | Description |
|-------|-------------|
| `breedsProcessed/Created/Updated` | Breed synchronization counts |
| `dogsProcessed/Created/Updated` | Dog record synchronization counts |
| `placeholderDogsCreated` | Number of placeholder parent dogs created |
| `titlesProcessed/Created` | Dog title synchronization counts |
| `pedigreeProcessed/Created/Skipped` | Pedigree relationship counts |
| `pedigreeTreesProcessed` | Number of extended pedigree trees processed |
| `pedigreeAncestorsCreated` | Ancestor dogs created from pedigree trees |
| `dogNotFoundCount` | Dogs not found in DKK database |
| `dogAccessDeniedCount` | Dogs with access restrictions |
| `errors` | Array of error messages encountered during sync |

## Deployment

1. Save the function code as `sync-my-dogs.ts` in your `supabase/functions/sync-my-dogs/` directory
2. Deploy using the Supabase CLI:

```bash
supabase functions deploy sync-my-dogs
```

3. Set the required environment variables in your Supabase dashboard or using the CLI:

```bash
supabase secrets set HUNDEWEB_USERNAME=your_username
supabase secrets set HUNDEWEB_PASSWORD=your_password
```

## Error Handling

The function handles various error scenarios:

- **Login Failures**: Returns error if DKK authentication fails
- **Missing Dogs**: Dogs not found in DKK are added to `skippedDogIds`
- **Access Denied**: Restricted dogs are logged and skipped
- **Network Issues**: Temporary failures are logged but don't stop processing
- **Database Errors**: Sync errors are captured in the `errors` array

## Rate Limiting

The function includes built-in delays to be respectful to the DKK servers:
- 500ms delay between regular dog detail requests
- 300ms additional delay after pedigree tree requests
- Processes dogs sequentially to avoid overwhelming the API

## Limitations

- Requires valid DKK credentials with access to the requested dogs
- Some dogs may be restricted or private in the DKK database
- Pedigree trees are limited to 4 generations
- Processing large numbers of dogs may take considerable time due to rate limiting

## Monitoring

Monitor the function execution through:
- Supabase Dashboard logs
- Response statistics and error arrays
- Database record counts before/after sync

## Related Functions

This function is designed to complement the main dog scraping function but focuses specifically on dogs you've manually added to your `my_dogs` table, rather than fetching your complete DKK dog list.