-- Create road authorities table
CREATE TABLE IF NOT EXISTS road_authorities (
  id SERIAL PRIMARY KEY,
  authority_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('MUNICIPAL', 'STATE_PWD', 'NATIONAL', 'RURAL', 'OTHER')),

  -- Jurisdiction
  state TEXT NOT NULL,
  city TEXT,
  areas TEXT[], -- Array of area names
  jurisdiction_geojson JSONB, -- GeoJSON polygon for precise boundaries

  -- Contact information
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_website TEXT,

  -- Social media handles
  twitter_handle TEXT,
  instagram_handle TEXT,
  facebook_handle TEXT,
  whatsapp_number TEXT,

  -- Metadata
  responsible_for TEXT[], -- ["Roads", "Potholes", "Streetlights"]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on state and city for fast lookups
CREATE INDEX IF NOT EXISTS idx_road_authorities_state ON road_authorities(state);
CREATE INDEX IF NOT EXISTS idx_road_authorities_city ON road_authorities(city);
CREATE INDEX IF NOT EXISTS idx_road_authorities_state_city ON road_authorities(state, city);

-- Create GIN index for area array searches
CREATE INDEX IF NOT EXISTS idx_road_authorities_areas ON road_authorities USING GIN(areas);

-- Create GIN index for GeoJSON searches (if using PostGIS in future)
CREATE INDEX IF NOT EXISTS idx_road_authorities_geojson ON road_authorities USING GIN(jurisdiction_geojson);

-- Insert sample data for testing (can be removed after real data is imported)
INSERT INTO road_authorities (authority_id, name, type, state, city, areas, twitter_handle, instagram_handle, contact_name, contact_phone) VALUES
  ('bbmp-bengaluru', 'BBMP (Bruhat Bengaluru Mahanagara Palike)', 'MUNICIPAL', 'Karnataka', 'Bengaluru', ARRAY['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout', 'Marathahalli'], '@BBMPCOMM', '@bbmp.official', 'BBMP Commissioner', '+91-80-22660000'),
  ('pwd-karnataka', 'PWD Karnataka', 'STATE_PWD', 'Karnataka', NULL, NULL, '@PWD_Karnataka', NULL, 'Chief Engineer, PWD Karnataka', '+91-80-12345678'),
  ('mcgm-mumbai', 'MCGM (Municipal Corporation of Greater Mumbai)', 'MUNICIPAL', 'Maharashtra', 'Mumbai', ARRAY['Andheri', 'Bandra', 'Dadar', 'Powai'], '@mybmc', '@officialmcgm', 'MCGM Commissioner', '+91-22-22694727'),
  ('pwd-maharashtra', 'PWD Maharashtra', 'STATE_PWD', 'Maharashtra', NULL, NULL, '@MahaPWD', NULL, 'Chief Engineer, PWD Maharashtra', '+91-22-12345678'),
  ('nhai-india', 'NHAI (National Highways Authority of India)', 'NATIONAL', 'All India', NULL, NULL, '@NHAI_Official', '@nhai_official', 'Chairman, NHAI', '1800-267-7246'),
  ('ghmc-hyderabad', 'GHMC (Greater Hyderabad Municipal Corporation)', 'MUNICIPAL', 'Telangana', 'Hyderabad', ARRAY['Gachibowli', 'Madhapur', 'Jubilee Hills', 'Banjara Hills'], '@GCHMHYD', '@ghmc_official', 'GHMC Commissioner', '+91-40-21111111'),
  ('pwd-delhi', 'PWD Delhi', 'STATE_PWD', 'Delhi', 'New Delhi', NULL, '@PwdDelhi', NULL, 'Chief Engineer, PWD Delhi', '+91-11-23392457')
ON CONFLICT (authority_id) DO NOTHING;
