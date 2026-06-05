import { IngestCity, RawBusinessRecord } from './types';
import { mapOsmTags } from './category-mapper';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const DEFAULT_AMENITY_TYPES = [
  'hospital',
  'clinic',
  'doctors',
  'pharmacy',
  'dentist',
  'school',
  'university',
  'bank',
  'restaurant',
  'cafe',
  'supermarket',
  'fuel',
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OsmProvider {
  async fetchBusinesses(
    city: IngestCity,
    amenityTypes: string[] = DEFAULT_AMENITY_TYPES,
  ): Promise<RawBusinessRecord[]> {
    const [south, west, north, east] = this.buildBbox(city);
    const amenityPattern = amenityTypes.join('|');

    const query = `
[out:json][timeout:120];
(
  node[amenity~"${amenityPattern}"](${south},${west},${north},${east});
  way[amenity~"${amenityPattern}"](${south},${west},${north},${east});
  node[shop~"supermarket|clothes|electronics"](${south},${west},${north},${east});
  way[shop~"supermarket|clothes|electronics"](${south},${west},${north},${east});
  node[office~"lawyer|accountant"](${south},${west},${north},${east});
  way[office~"lawyer|accountant"](${south},${west},${north},${east});
);
out center tags;
    `.trim();

    // Respect Overpass rate limits — caller should add delay between cities
    // Try each endpoint in order; move to next on 429/406/5xx
    let response: Response | null = null;
    let lastError = '';
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'ConnectAfrica/1.0 (https://connectafrica.ai; contact@connectafrica.ai)',
          },
          body: `data=${encodeURIComponent(query)}`,
        });
        if (response.ok) break;
        lastError = `${response.status} ${response.statusText}`;
        // Short back-off before trying next mirror
        await sleep(1500);
      } catch (err) {
        lastError = (err as Error).message;
        await sleep(1500);
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Overpass API failed: ${lastError}`);
    }

    const data = (await response.json()) as {
      elements?: unknown[];
    };
    const elements = data.elements ?? [];

    const records: RawBusinessRecord[] = [];
    for (const el of elements) {
      const mapped = this.mapOsmElement(el, city);
      if (mapped) records.push(mapped);
    }
    return records;
  }

  /** Rate-limited sweep: waits 1000ms between cities. */
  async fetchAllCities(
    cities: IngestCity[],
    amenityTypes?: string[],
  ): Promise<Map<string, RawBusinessRecord[]>> {
    const results = new Map<string, RawBusinessRecord[]>();
    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      if (i > 0) await sleep(1000);
      const records = await this.fetchBusinesses(city, amenityTypes);
      results.set(city.name, records);
    }
    return results;
  }

  private buildBbox(city: IngestCity): [number, number, number, number] {
    const latDelta = city.radiusKm / 111;
    const lngDelta =
      city.radiusKm / (111 * Math.cos((city.lat * Math.PI) / 180));
    return [
      city.lat - latDelta,
      city.lng - lngDelta,
      city.lat + latDelta,
      city.lng + lngDelta,
    ];
  }

  private mapOsmElement(el: unknown, city: IngestCity): RawBusinessRecord | null {
    const element = el as {
      type?: string;
      id?: number;
      lat?: number;
      lon?: number;
      center?: { lat?: number; lon?: number };
      tags?: Record<string, string>;
    };

    const tags = element.tags ?? {};
    const name = tags['name'] ?? tags['name:en'];
    if (!name) return null;

    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;

    const addrParts = [tags['addr:street'], tags['addr:housenumber']].filter(
      Boolean,
    );

    return {
      externalId: `osm-${element.type}-${element.id}`,
      source: 'osm',
      displayName: name,
      category: mapOsmTags(tags),
      phone: tags['phone'] ?? tags['contact:phone'],
      website: tags['website'] ?? tags['contact:website'],
      address: addrParts.join(' ') || undefined,
      city: city.name,
      state: city.state ?? city.name,
      country: city.countryName,
      latitude: lat,
      longitude: lng,
      partnerVerified: false,
      rawData: tags as Record<string, unknown>,
    };
  }
}
