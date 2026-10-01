import { API_URL } from '@/config';

export interface AuthorityLookupParams {
  lat?: number;
  lon?: number;
  city?: string;
  state?: string;
  area?: string;
}

export interface RoadAuthority {
  id: number;
  authorityId: string;
  name: string;
  type: 'MUNICIPAL' | 'STATE_PWD' | 'NATIONAL' | 'RURAL' | 'OTHER';
  state: string;
  city: string | null;
  areas: string[] | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWebsite: string | null;
  twitterHandle: string | null;
  instagramHandle: string | null;
  facebookHandle: string | null;
  whatsappNumber: string | null;
  responsibleFor: string[] | null;
}

export interface AuthorityLookupResponse {
  ok: boolean;
  authorities?: RoadAuthority[];
  matchType?: 'area' | 'city' | 'state' | 'national';
  note?: string;
  error?: string;
}

const AUTHORITY_LOOKUP_ENDPOINT = `${API_URL}/api/public/authority-lookup`;

export async function lookupAuthority(params: AuthorityLookupParams): Promise<AuthorityLookupResponse> {
  try {
    const queryParams = new URLSearchParams();

    if (params.lat !== undefined) queryParams.append('lat', params.lat.toString());
    if (params.lon !== undefined) queryParams.append('lon', params.lon.toString());
    if (params.city) queryParams.append('city', params.city);
    if (params.state) queryParams.append('state', params.state);
    if (params.area) queryParams.append('area', params.area);

    const response = await fetch(`${AUTHORITY_LOOKUP_ENDPOINT}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Authority lookup failed:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to lookup authority',
    };
  }
}

/**
 * Reverse geocode coordinates to get location details
 * Uses expo-location's reverseGeocodeAsync
 */
export interface ReverseGeocodeResult {
  city: string | null;
  state: string | null;
  area: string | null; // district or sublocality
  formattedAddress: string;
}

export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult | null> {
  try {
    const Location = await import('expo-location');
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });

    if (results.length === 0) return null;

    const location = results[0];

    return {
      city: location.city || location.district || null,
      state: location.region || null,
      area: location.subregion || location.district || location.street || null,
      formattedAddress: [
        location.name,
        location.street,
        location.city || location.district,
        location.region,
        location.postalCode,
      ].filter(Boolean).join(', '),
    };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}
