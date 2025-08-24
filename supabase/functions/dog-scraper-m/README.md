# Enhanced Dog Scraper with Database Sync

This Edge Function scrapes dog data from hundeweb.dk and optionally syncs it to your Supabase database.

## Features

### 🔄 **Data Synchronization**
- **Breeds**: Automatically creates/updates breed records with FCI numbers
- **Dogs**: Creates/updates dog records with full information mapping
- **Titles**: Parses concatenated title strings into individual title records
- **Pedigree**: Creates parent-child relationships (sire/dam) with placeholder parents
- **🆕 Pedigree Trees**: Fetches and syncs complete genealogy trees (up to 4 generations)
- **🆕 Ancestor Creation**: Automatically creates ancestor dog records from pedigree trees
- **My Dogs**: Automatically marks scraped dogs as "owned" in my_dogs table
- **Smart Sync**: Only updates changed data, avoids duplicates

### 📊 **Data Mapping**
- **Danish → English**: Converts Danish field names to English database schema
- **Gender Mapping**: H (Han/Male) → M, T (Tæve/Female) → F
- **Title Parsing**: "DKCH SECH DKJUCH" → Individual title records
- **Date Formatting**: Proper date format conversion
- **Breed Integration**: Links dogs to breed records via foreign keys

## Usage

### **Environment Variables Required**

Set these in your Supabase project secrets:

```bash
# Required for scraping
HUNDEWEB_USERNAME=your_username
HUNDEWEB_PASSWORD=your_password

# Required for database sync (optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **API Endpoints**

#### **Scrape Only (No Database Sync)**
```bash
GET/POST https://your-project.supabase.co/functions/v1/dog-scraper-m
```

Returns scraped data without saving to database.

#### **Scrape + Database Sync**
```bash
GET/POST https://your-project.supabase.co/functions/v1/dog-scraper-m?sync=true
```

Scrapes data AND saves to your Supabase database.

#### **Sync Options**
```bash
# Sync with placeholder parents (default)
GET/POST https://your-project.supabase.co/functions/v1/dog-scraper-m?sync=true

# Sync without placeholder parents (skip missing parents)
GET/POST https://your-project.supabase.co/functions/v1/dog-scraper-m?sync=true&placeholders=false
```

### **Response Format**

#### **Scrape Only Response**
```json
{
  "success": true,
  "dogsCount": 18,
  "dogs": [/* scraped dog data */],
  "myDogIds": ["DK12345/2024", "DK67890/2023"],
  "syncStats": null
}
```

#### **Sync Response**
```json
{
  "success": true,
  "dogsCount": 18,
  "dogs": [/* scraped dog data */],
  "myDogIds": ["DK12345/2024", "DK67890/2023"],
  "syncStats": {
    "breedsProcessed": 3,
    "breedsCreated": 1,
    "breedsUpdated": 2,
    "dogsProcessed": 18,
    "dogsCreated": 5,
    "dogsUpdated": 13,
    "placeholderDogsCreated": 24,
    "titlesProcessed": 42,
    "titlesCreated": 66,
    "pedigreeProcessed": 36,
    "pedigreeCreated": 36,
    "pedigreeSkipped": 0,
    "pedigreeTreesProcessed": 18,
    "pedigreeAncestorsCreated": 142,
    "myDogsProcessed": 18,
    "myDogsCreated": 18,
    "myDogsUpdated": 0,
    "errors": []
  }
}
```

## Database Schema Mapping

### **Scraped Data → Database Fields**

| Danish Field | English Field | Type | Notes |
|-------------|---------------|------|-------|
| `hundId` | `id` | VARCHAR(50) | Primary key |
| `navn` | `name` | VARCHAR(100) | Dog name |
| `kallenavn` | `nickname` | VARCHAR(100) | Call name |
| `kjoenn` | `gender` | CHAR(1) | H→M, T→F |
| `foedt` | `birth_date` | DATE | Birth date |
| `doed` | `is_deceased` | BOOLEAN | Deceased status |
| `doedDato` | `death_date` | DATE | Death date |
| `farge` | `color` | VARCHAR(100) | Color description |
| `personIdHovedeier` | `owner_person_id` | VARCHAR(50) | Owner ID |
| `opprinneligHundId` | `original_dog_id` | VARCHAR(50) | Original ID |

### **Title Parsing**

The function automatically parses title strings:

```
"DKCH SECH DKJUCH KLBJCH" → 
[
  { title_code: "DKCH", title_full_name: "Danish Champion", country_code: "DK" },
  { title_code: "SECH", title_full_name: "Swedish Champion", country_code: "SE" },
  { title_code: "DKJUCH", title_full_name: "Danish Junior Champion", country_code: "DK" },
  { title_code: "KLBJCH", title_full_name: "Club Junior Champion", country_code: "DK" }
]
```

### **Pedigree Relationships**

Creates parent-child relationships:

```json
{
  "dog_id": "DK12345/2024",
  "parent_id": "DK67890/2020", 
  "relationship_type": "SIRE",  // or "DAM"
  "generation": 1
}
```

#### **Placeholder Parents**
When parent dogs don't exist in the database, the function can automatically create placeholder records:
- **Smart Gender**: SIRE → Male, DAM → Female
- **Breed Inheritance**: Uses same breed as child
- **Title Parsing**: Includes parent titles if available
- **Option to Disable**: Use `?placeholders=false` to skip

### **🌳 Pedigree Tree Processing**

The function now fetches complete pedigree trees (genealogy) for each dog and creates multi-generation relationships:

#### **Tree Structure (sti field)**
```
"0"    → Direct father (SIRE, generation 1)
"1"    → Direct mother (DAM, generation 1)
"00"   → Father's father (SIRE, generation 2)
"01"   → Father's mother (DAM, generation 2)
"10"   → Mother's father (SIRE, generation 2)
"11"   → Mother's mother (DAM, generation 2)
"000"  → Father's father's father (SIRE, generation 3)
...and so on up to 4 generations
```

#### **Automatic Ancestor Creation**
- Creates dog records for all ancestors in the pedigree tree
- Preserves genealogy structure up to 4 generations
- Includes ancestor titles and colors when available
- Links all relationships properly in the database

#### **Enhanced Genealogy Data**
```json
{
  "pedigreeTreesProcessed": 18,
  "pedigreeAncestorsCreated": 142
}
```

This means the function now builds complete family trees, not just direct parent relationships!

### **My Dogs Integration**

Since the `mineHunder` endpoint provides your owned dogs, the function automatically:

```json
{
  "dog_id": "DK12345/2024",
  "acquisition_date": null,
  "notes": "Synced from hundeweb.dk"
}
```

- **Auto-Detection**: All scraped dogs are marked as "my dogs"
- **Upsert Behavior**: Creates new records or updates existing ones
- **Metadata**: Adds sync timestamp and source notes

## Deployment

### **1. Set Environment Variables**

In your Supabase dashboard:
1. Go to **Settings → Edge Functions**
2. Add the required environment variables
3. Deploy the function

### **2. Deploy Function**

```bash
npx supabase functions deploy dog-scraper-m
```

### **3. Set Secrets**

```bash
npx supabase secrets set HUNDEWEB_USERNAME=your_username
npx supabase secrets set HUNDEWEB_PASSWORD=your_password
npx supabase secrets set SUPABASE_URL=https://your-project.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing

### **Test Scraping Only**
```bash
curl https://your-project.supabase.co/functions/v1/dog-scraper-m
```

### **Test Scraping + Sync**
```bash
curl "https://your-project.supabase.co/functions/v1/dog-scraper-m?sync=true"
```

### **View Logs**
```bash
npx supabase functions logs dog-scraper-m
```

## Error Handling

The function includes comprehensive error handling:

- **Login Failures**: Returns error if authentication fails
- **Network Issues**: Continues with other dogs if individual requests fail
- **Database Errors**: Logs errors but continues sync process
- **Data Validation**: Skips invalid records with detailed error messages

## Sync Behavior

### **Upsert Logic**
- **Breeds**: Updates if name exists, creates if new
- **Dogs**: Updates if ID exists, creates if new
- **Titles**: Replaces all titles for each dog (delete + insert)
- **Pedigree**: Replaces generation 1 relationships (delete + insert), creates placeholder parents
- **My Dogs**: Creates if new, updates timestamp if exists

### **Data Integrity**
- Foreign key constraints maintained
- Duplicate prevention
- Transaction-safe operations
- Graceful error recovery

## Performance

- **Respectful Scraping**: 500ms delay between requests
- **Batch Processing**: Processes all dogs in sequence
- **Efficient Queries**: Uses upsert patterns to minimize database calls
- **Error Isolation**: Individual dog failures don't stop the entire process

## Monitoring

Monitor function performance:

```bash
# View recent logs
npx supabase functions logs dog-scraper-m

# View sync statistics in response
# Check syncStats object for detailed metrics
```

The function provides detailed statistics on what was processed, created, updated, and any errors encountered during the sync process.
