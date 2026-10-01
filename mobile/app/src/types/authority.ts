export interface RoadAuthority {
  id: number;
  authorityId: string;
  name: string;
  type: 'MUNICIPAL' | 'STATE_PWD' | 'NATIONAL' | 'RURAL' | 'OTHER';

  // Jurisdiction
  state: string;
  city: string | null;
  areas: string[] | null;
  jurisdictionGeojson: any | null;

  // Contact
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWebsite: string | null;

  // Social media
  twitterHandle: string | null;
  instagramHandle: string | null;
  facebookHandle: string | null;
  whatsappNumber: string | null;

  // Metadata
  responsibleFor: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorityLookupResponse {
  ok: boolean;
  authorities?: RoadAuthority[];
  matchType?: 'area' | 'city' | 'state' | 'national';
  note?: string;
  error?: string;
}
