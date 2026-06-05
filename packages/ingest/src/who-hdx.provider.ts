/**
 * WHO SARA / KWTRP Health Facilities for Sub-Saharan Africa
 * Source: https://data.humdata.org/dataset/health-facilities-in-sub-saharan-africa
 *
 * CSV columns (typical):
 *   facility_name, lat, long, facility_type, country, admin1, admin2
 *
 * partnerVerified = true (government-reported data)
 */

import { RawBusinessRecord } from './types';

// Countries in ConnectAfrica coverage
const COVERED_COUNTRIES = new Set(['NG', 'GH', 'KE', 'ZA', 'ET', 'TZ', 'EG']);

export class WhoHdxProvider {
  /**
   * Parse a WHO HDX CSV string and return RawBusinessRecord[].
   * Filters to covered countries only.
   */
  parseCSV(csvContent: string): RawBusinessRecord[] {
    const lines = csvContent.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const header = this.parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

    const colIndex = (names: string[]): number => {
      for (const name of names) {
        const idx = header.indexOf(name);
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const nameCol = colIndex(['facility_name', 'name', 'facility name']);
    const latCol = colIndex(['lat', 'latitude', 'y']);
    const lngCol = colIndex(['long', 'lon', 'longitude', 'x']);
    const typeCol = colIndex(['facility_type', 'type', 'facility type']);
    const countryCol = colIndex(['country', 'country_code', 'iso', 'iso2']);
    const admin1Col = colIndex(['admin1', 'state', 'province', 'region']);
    const admin2Col = colIndex(['admin2', 'district', 'city', 'lga']);

    const records: RawBusinessRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCSVLine(lines[i]);
      if (cols.length < 2) continue;

      const name = nameCol >= 0 ? cols[nameCol]?.trim() : undefined;
      if (!name) continue;

      const countryRaw = (countryCol >= 0 ? cols[countryCol]?.trim() : '') ?? '';
      const country = countryRaw.toUpperCase();
      if (!COVERED_COUNTRIES.has(country)) continue;

      const latStr = latCol >= 0 ? cols[latCol]?.trim() : undefined;
      const lngStr = lngCol >= 0 ? cols[lngCol]?.trim() : undefined;
      const lat = latStr ? parseFloat(latStr) : undefined;
      const lng = lngStr ? parseFloat(lngStr) : undefined;

      const facilityType = (typeCol >= 0 ? cols[typeCol]?.trim() : '') ?? '';
      const admin1 = (admin1Col >= 0 ? cols[admin1Col]?.trim() : '') ?? '';
      const admin2 = (admin2Col >= 0 ? cols[admin2Col]?.trim() : '') ?? '';

      records.push({
        externalId: `who-hdx-${i}`,
        source: 'who_hdx',
        displayName: name,
        category: this.mapFacilityType(facilityType),
        city: admin2 || admin1 || country,
        state: admin1 || country,
        country: this.countryCodeToName(country),
        latitude: lat !== undefined && !isNaN(lat) ? lat : undefined,
        longitude: lng !== undefined && !isNaN(lng) ? lng : undefined,
        partnerVerified: true,
        rawData: {
          facilityType,
          country,
          admin1,
          admin2,
        },
      });
    }

    return records;
  }

  mapFacilityType(facilityType: string): string {
    const t = facilityType.toLowerCase().trim();
    if (t.includes('hospital')) return 'healthcare.hospital';
    if (
      t.includes('clinic') ||
      t.includes('health centre') ||
      t.includes('health center') ||
      t.includes('health post')
    )
      return 'healthcare.clinic';
    if (t.includes('pharmacy') || t.includes('drug store'))
      return 'healthcare.pharmacy';
    return 'healthcare';
  }

  private countryCodeToName(code: string): string {
    const map: Record<string, string> = {
      NG: 'Nigeria',
      GH: 'Ghana',
      KE: 'Kenya',
      ZA: 'South Africa',
      ET: 'Ethiopia',
      TZ: 'Tanzania',
      EG: 'Egypt',
    };
    return map[code] ?? code;
  }

  /**
   * Minimal CSV line parser that handles quoted fields with commas.
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }
}
