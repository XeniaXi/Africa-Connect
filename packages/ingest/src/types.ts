export type IngestSource =
  | 'google_places'
  | 'osm'
  | 'who_hdx'
  | 'cac_nigeria'
  | 'cipc_southafrica'
  | 'opencorporates';

export interface IngestCity {
  name: string;
  country: string; // ISO 3166-1 alpha-2: NG, GH, KE, ZA, EG, ET, TZ
  countryName: string;
  lat: number;
  lng: number;
  radiusKm: number;
  state?: string;
}

export interface RawBusinessRecord {
  externalId: string;
  source: IngestSource;
  displayName: string;
  category: string; // ConnectAfrica category slug
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  partnerVerified: boolean; // true if source has verified the business
  rawData?: Record<string, unknown>;
}

export interface IngestResult {
  source: IngestSource;
  city: string;
  total: number;
  upserted: number;
  failed: number;
  errors: string[];
}
