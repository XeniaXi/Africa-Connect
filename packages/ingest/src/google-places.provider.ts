import { IngestCity, RawBusinessRecord } from './types';
import { mapGoogleTypes } from './category-mapper';

const BASE_URL = 'https://places.googleapis.com/v1';

// Maps ConnectAfrica category slugs to Google Places includedTypes values
const CATEGORY_TO_GOOGLE_TYPES: Record<string, string[]> = {
  healthcare: ['hospital', 'medical_clinic', 'pharmacy', 'dentist', 'doctor'],
  artisan: ['electrician', 'plumber', 'roofing_contractor', 'painter', 'car_repair'],
  education: ['school', 'university', 'primary_school', 'secondary_school'],
  logistics: ['moving_company', 'courier_service', 'taxi_service'],
  food: ['restaurant', 'bakery', 'cafe', 'meal_delivery'],
  retail: ['supermarket', 'grocery_store', 'clothing_store', 'electronics_store'],
  professional: ['lawyer', 'accounting'],
  finance: ['bank', 'atm', 'insurance_agency'],
  estate: ['real_estate_agency'],
};

export class GooglePlacesProvider {
  constructor(private readonly apiKey: string) {}

  async searchByText(
    query: string,
    city: IngestCity,
    pageToken?: string,
  ): Promise<{ records: RawBusinessRecord[]; nextPageToken?: string }> {
    const body: Record<string, unknown> = {
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: city.lat, longitude: city.lng },
          radius: city.radiusKm * 1000,
        },
      },
      maxResultCount: 20,
    };
    if (pageToken) {
      body['pageToken'] = pageToken;
    }

    const response = await fetch(`${BASE_URL}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,places.location,places.businessStatus,nextPageToken',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `Google Places searchText failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      places?: unknown[];
      nextPageToken?: string;
    };
    const places = data.places ?? [];
    const records = places.map((p) => this.mapPlace(p, city));

    return { records, nextPageToken: data.nextPageToken };
  }

  async searchNearby(
    category: string,
    city: IngestCity,
  ): Promise<RawBusinessRecord[]> {
    const googleTypes =
      CATEGORY_TO_GOOGLE_TYPES[category] ??
      CATEGORY_TO_GOOGLE_TYPES['healthcare'];

    const body = {
      includedTypes: googleTypes,
      locationRestriction: {
        circle: {
          center: { latitude: city.lat, longitude: city.lng },
          radius: city.radiusKm * 1000,
        },
      },
      maxResultCount: 20,
    };

    const response = await fetch(`${BASE_URL}/places:searchNearby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,places.location,places.businessStatus',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `Google Places searchNearby failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as { places?: unknown[] };
    const places = data.places ?? [];
    return places.map((p) => this.mapPlace(p, city));
  }

  private mapPlace(place: unknown, city: IngestCity): RawBusinessRecord {
    const p = place as {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      nationalPhoneNumber?: string;
      websiteUri?: string;
      rating?: number;
      userRatingCount?: number;
      types?: string[];
      location?: { latitude?: number; longitude?: number };
      businessStatus?: string;
    };

    return {
      externalId: p.id ?? '',
      source: 'google_places',
      displayName: p.displayName?.text ?? '',
      category: mapGoogleTypes(p.types ?? []),
      phone: p.nationalPhoneNumber,
      website: p.websiteUri,
      address: p.formattedAddress,
      city: city.name,
      state: city.state ?? city.name,
      country: city.countryName,
      latitude: p.location?.latitude,
      longitude: p.location?.longitude,
      partnerVerified: p.businessStatus === 'OPERATIONAL',
      rawData: {
        rating: p.rating,
        userRatingCount: p.userRatingCount,
        types: p.types,
      },
    };
  }
}
