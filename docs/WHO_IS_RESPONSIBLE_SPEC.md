# "Who's Responsible?" Feature - Technical Specification

**Feature:** Road Authority Identification & Photo Evidence Sharing  
**Date:** October 2, 2026  
**Status:** IN DEVELOPMENT

---

## Requirements Summary

### Core Functionality
1. **Button**: "Who's Responsible?" on JourneyDashboard (prominent, always visible, no auth required)
2. **Location Lookup**: Get current GPS → Determine responsible authority (on-demand only, not background)
3. **Photo Capture**: Take photo with device camera → Compress if needed → Add watermark with location
4. **Share**: Pre-filled templates for X/Twitter, Instagram Story/Post, WhatsApp with authority handles tagged

### Technical Requirements
- ✅ Offline: Disable feature when offline
- ✅ Camera: Use device camera with compression
- ✅ Location Stamp: Show area + state on photo as watermark
- ✅ Storage: Store photos locally
- ✅ Templates: Different pre-filled text per platform with clickable/tagged handles

---

## Data Format Specifications

### Authority Data Structure (To be populated later)

```typescript
interface RoadAuthority {
  id: string;
  name: string;                    // "BBMP", "PWD Karnataka", "NHAI"
  type: 'MUNICIPAL' | 'STATE_PWD' | 'NATIONAL' | 'RURAL' | 'OTHER';
  jurisdiction: {
    state: string;                 // "Karnataka", "Maharashtra"
    city?: string;                 // "Bengaluru", "Mumbai"
    areas?: string[];              // ["Indiranagar", "Koramangala"]
    coordinates?: {                // GeoJSON polygon for precise boundaries
      type: 'Polygon';
      coordinates: number[][][];
    };
  };
  contact: {
    name?: string;                 // "Chief Engineer, BBMP"
    phone?: string;
    email?: string;
    website?: string;
  };
  socialMedia: {
    twitter?: string;              // "@BBMPCOMM" or full URL
    instagram?: string;            // "@bbmp.official"
    facebook?: string;
    whatsapp?: string;             // For WhatsApp groups/channels
  };
  responsibleFor: string[];        // ["Roads", "Potholes", "Streetlights"]
}
```

### Data Import Formats Supported

**1. JSON (Preferred)**
```json
{
  "authorities": [
    {
      "id": "bbmp-bengaluru",
      "name": "BBMP",
      "type": "MUNICIPAL",
      "jurisdiction": {
        "state": "Karnataka",
        "city": "Bengaluru",
        "areas": ["Indiranagar", "Koramangala", "Whitefield"]
      },
      "contact": {
        "name": "BBMP Commissioner",
        "phone": "+91-80-22660000"
      },
      "socialMedia": {
        "twitter": "@BBMPCOMM",
        "instagram": "@bbmp.official"
      }
    }
  ]
}
```

**2. CSV (For bulk import)**
```csv
id,name,type,state,city,areas,twitter_handle,instagram_handle,whatsapp,contact_name,contact_phone
bbmp-bengaluru,BBMP,MUNICIPAL,Karnataka,Bengaluru,"Indiranagar;Koramangala",@BBMPCOMM,@bbmp.official,,BBMP Commissioner,+91-80-22660000
pwd-karnataka,PWD Karnataka,STATE_PWD,Karnataka,,,@PWD_Karnataka,@pwd_karnataka_official,,,+91-80-12345678
```

**3. GeoJSON (For precise jurisdiction mapping)**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "authorityId": "bbmp-bengaluru",
        "name": "BBMP",
        "type": "MUNICIPAL",
        "state": "Karnataka",
        "city": "Bengaluru"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.5, 12.9], [77.7, 12.9], [77.7, 13.1], [77.5, 13.1], [77.5, 12.9]]]
      }
    }
  ]
}
```

**4. Google Sheets / Excel (Via CSV export)**
- Same structure as CSV format above
- Easy for non-technical team to maintain

---

## Scraping Possibilities

### Data Sources We Can Scrape:

**1. Government Websites**
- Ministry of Road Transport websites
- State PWD websites
- Municipal corporation contact pages
- Format: HTML tables, contact pages

**2. Social Media (For handles)**
- Twitter/X official accounts
- Instagram verified government accounts
- Format: Profile scraping, API (if available)

**3. Open Data Portals**
- data.gov.in
- State government open data
- Format: JSON, CSV, API

**4. OpenStreetMap**
- Road network data with jurisdiction tags
- Format: OSM XML, Overpass API JSON

**5. Google Maps / Reverse Geocoding**
- Get city/locality from coordinates
- Match with our authority database
- Format: JSON API response

---

## Lookup Logic (To be implemented)

```typescript
// Priority-based lookup:
1. Check if coordinates fall within precise GeoJSON boundaries
2. If no match, reverse geocode to get city/locality
3. Match city/locality against authority database
4. If multiple matches, show all (e.g., "BBMP or BMRDA")
5. If no match, show generic "State PWD" based on state
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (NOW)
- ✅ Backend API endpoint: `/api/public/authority-lookup`
- ✅ Database schema for authorities
- ✅ Mobile UI: Button + Authority info modal
- ✅ Camera integration with compression
- ✅ Photo watermarking with location

### Phase 2: Sharing (NOW)
- ✅ Share templates for each platform
- ✅ Platform-specific formatting (tags, mentions)
- ✅ Native share sheet integration

### Phase 3: Data Population (LATER)
- ⏳ Scrape/compile authority data for major cities
- ⏳ Import into database
- ⏳ Test accuracy of lookups

### Phase 4: Enhancements (FUTURE)
- Offline caching of last lookup
- Photo gallery/history
- Report submission tracking
- Analytics on authority response rates

---

## Tech Stack

**Mobile:**
- `expo-camera` - Camera access
- `expo-image-manipulator` - Compression + watermark
- `expo-sharing` - Native share sheet
- `expo-location` - GPS coordinates
- `react-native-svg` - Watermark rendering

**Backend:**
- New table: `road_authorities`
- Endpoint: `/api/public/authority-lookup?lat=12.9716&lon=77.5946`
- GeoJSON support for precise matching

**Storage:**
- Photos: Local device storage (expo-file-system)
- Authority data: PostgreSQL with PostGIS for geo queries

---

## Example User Flow

```
1. User on JourneyDashboard
2. Taps "Who's Responsible?" button
3. App gets current GPS location
4. Shows loading: "Finding responsible authority..."
5. API returns: "BBMP (Bruhat Bengaluru Mahanagara Palike)"
6. Modal shows:
   - Authority name
   - Type (Municipal Corporation)
   - Contact info
   - Social handles
   - "Take Photo" button
7. User taps "Take Photo"
8. Camera opens
9. User captures bad road
10. Photo processed: compressed, watermarked with "Indiranagar, Karnataka"
11. Share sheet opens with options:
    - X (Twitter): Pre-filled "@BBMPCOMM Bad road at Indiranagar, Karnataka. Please fix!"
    - Instagram Story: Image with handles overlaid
    - Instagram Post: Image + caption with handles
    - WhatsApp: Image + message with contact info
12. User shares to platform of choice
```

---

## Files to Create/Modify

### Backend
- `backend/src/routes/authorityLookup.ts` (NEW)
- `backend/src/lib/authorityLookup.ts` (NEW)
- `backend/src/db/schema.ts` (ADD authorities table)
- `backend/migrations/XXXX_create_authorities_table.sql` (NEW)

### Mobile
- `mobile/app/src/components/WhoIsResponsibleButton.tsx` (NEW)
- `mobile/app/src/components/AuthorityInfoModal.tsx` (NEW)
- `mobile/app/src/components/PhotoCaptureScreen.tsx` (NEW)
- `mobile/app/src/lib/photoWatermark.ts` (NEW)
- `mobile/app/src/lib/shareTemplates.ts` (NEW)
- `mobile/app/src/components/JourneyDashboard.tsx` (MODIFY - add button)

---

**Starting implementation NOW!** 🚀
