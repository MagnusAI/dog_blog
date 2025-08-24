# Enhanced Dog Scraper with Database Sync

This Edge Function scrapes dog data from hundeweb.dk and optionally syncs it to your Supabase database.

## Features

### 🔄 **Data Synchronization**
- **Breeds**: Automatically creates/updates breed records with FCI numbers
- **Dogs**: Creates/updates dog records with full information mapping
- **Titles**: Parses concatenated title strings into individual title records
- **Pedigree**: Creates parent-child relationships (sire/dam)
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

### **Response Format**

#### **Scrape Only Response**
```json
{
  "success": true,
  "dogsCount": 18,
  "dogs": [/* scraped dog data */],
  "syncStats": null
}
```

#### **Sync Response**
```json
{
  "success": true,
  "dogsCount": 18,
  "dogs": [/* scraped dog data */],
  "syncStats": {
    "breedsProcessed": 3,
    "breedsCreated": 1,
    "breedsUpdated": 2,
    "dogsProcessed": 18,
    "dogsCreated": 5,
    "dogsUpdated": 13,
    "titlesProcessed": 42,
    "titlesCreated": 42,
    "pedigreeProcessed": 36,
    "pedigreeCreated": 36,
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
- **Pedigree**: Replaces generation 1 relationships (delete + insert)

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
