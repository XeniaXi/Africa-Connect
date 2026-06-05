import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@connectafrica/database';
import { PartnerUpsertPayload } from '@connectafrica/types';
import { PartnerService, PartnerContext } from '../partner/partner.service';
import { AuditService } from '../audit/audit.service';
import {
  RawBusinessRecord,
  IngestResult,
  IngestCity,
  IngestSource,
  GooglePlacesProvider,
  OsmProvider,
  WhoHdxProvider,
  COVERAGE_CITIES,
  INGEST_CATEGORIES,
} from '@connectafrica/ingest';
import * as fs from 'fs';

// Source slug → trust weight mapping
const SOURCE_TRUST_WEIGHTS: Record<string, number> = {
  'google-places': 0.85,
  osm: 0.60,
  'who-hdx': 0.80,
  'cac-nigeria': 0.90,
  'cipc-southafrica': 0.90,
  opencorporates: 0.75,
};

// Source slug → IngestSource key mapping
const SLUG_TO_INGEST_SOURCE: Record<string, IngestSource> = {
  'google-places': 'google_places',
  osm: 'osm',
  'who-hdx': 'who_hdx',
  'cac-nigeria': 'cac_nigeria',
  'cipc-southafrica': 'cipc_southafrica',
  opencorporates: 'opencorporates',
};

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    private readonly partnerService: PartnerService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Gets or creates a PartnerSource record for the given ingest source slug.
   */
  async getOrCreatePartnerSource(
    slug: string,
    name: string,
    trustWeight: number,
  ): Promise<{ id: string; trustWeight: number }> {
    const existing = await prisma.partnerSource.findUnique({
      where: { slug },
    });

    if (existing) {
      return { id: existing.id, trustWeight: Number(existing.trustWeight) };
    }

    const created = await prisma.partnerSource.create({
      data: {
        slug,
        name,
        sourceType: 'api',
        trustWeight,
        status: 'active',
      },
    });

    return { id: created.id, trustWeight: Number(created.trustWeight) };
  }

  /**
   * Run Google Places ingest for a specific city and category.
   */
  async runGooglePlaces(
    city: IngestCity,
    category: string,
    apiKey: string,
  ): Promise<IngestResult> {
    const { id: sourceId, trustWeight } = await this.getOrCreatePartnerSource(
      'google-places',
      'Google Places',
      SOURCE_TRUST_WEIGHTS['google-places'],
    );

    const partnerCtx: PartnerContext = {
      id: sourceId,
      slug: 'google-places',
      name: 'Google Places',
      trustWeight,
    };

    const provider = new GooglePlacesProvider(apiKey);
    const result: IngestResult = {
      source: 'google_places',
      city: city.name,
      total: 0,
      upserted: 0,
      failed: 0,
      errors: [],
    };

    try {
      const records = await provider.searchNearby(category, city);
      result.total = records.length;

      for (const record of records) {
        try {
          await this.ingestRecord(record, partnerCtx);
          result.upserted++;
        } catch (err) {
          result.failed++;
          result.errors.push(`${record.externalId}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      result.errors.push(`Fetch error: ${(err as Error).message}`);
      result.failed++;
    }

    await this.recordSyncLog(sourceId, result);
    return result;
  }

  /**
   * Run OSM ingest for a specific city.
   */
  async runOsm(city: IngestCity): Promise<IngestResult> {
    const { id: sourceId, trustWeight } = await this.getOrCreatePartnerSource(
      'osm',
      'OpenStreetMap',
      SOURCE_TRUST_WEIGHTS['osm'],
    );

    const partnerCtx: PartnerContext = {
      id: sourceId,
      slug: 'osm',
      name: 'OpenStreetMap',
      trustWeight,
    };

    const provider = new OsmProvider();
    const result: IngestResult = {
      source: 'osm',
      city: city.name,
      total: 0,
      upserted: 0,
      failed: 0,
      errors: [],
    };

    try {
      const records = await provider.fetchBusinesses(city);
      result.total = records.length;

      for (const record of records) {
        try {
          await this.ingestRecord(record, partnerCtx);
          result.upserted++;
        } catch (err) {
          result.failed++;
          result.errors.push(`${record.externalId}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      result.errors.push(`Fetch error: ${(err as Error).message}`);
      result.failed++;
    }

    await this.recordSyncLog(sourceId, result);
    return result;
  }

  /**
   * Run WHO HDX bulk ingest from a CSV file path.
   */
  async runWhoHdx(csvPath: string): Promise<IngestResult> {
    const { id: sourceId, trustWeight } = await this.getOrCreatePartnerSource(
      'who-hdx',
      'WHO Health Facilities (HDX)',
      SOURCE_TRUST_WEIGHTS['who-hdx'],
    );

    const partnerCtx: PartnerContext = {
      id: sourceId,
      slug: 'who-hdx',
      name: 'WHO Health Facilities (HDX)',
      trustWeight,
    };

    const result: IngestResult = {
      source: 'who_hdx',
      city: 'bulk',
      total: 0,
      upserted: 0,
      failed: 0,
      errors: [],
    };

    try {
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const provider = new WhoHdxProvider();
      const records = provider.parseCSV(csvContent);
      result.total = records.length;

      for (const record of records) {
        try {
          await this.ingestRecord(record, partnerCtx);
          result.upserted++;
        } catch (err) {
          result.failed++;
          result.errors.push(`${record.externalId}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      result.errors.push(`CSV read/parse error: ${(err as Error).message}`);
      result.failed++;
    }

    await this.recordSyncLog(sourceId, result);
    return result;
  }

  /**
   * Trigger a full OSM coverage sweep across all cities.
   * Adds 1000ms delay between cities to respect Overpass rate limits.
   */
  async runFullOsmSweep(): Promise<IngestResult[]> {
    const results: IngestResult[] = [];
    const provider = new OsmProvider();

    const { id: sourceId, trustWeight } = await this.getOrCreatePartnerSource(
      'osm',
      'OpenStreetMap',
      SOURCE_TRUST_WEIGHTS['osm'],
    );

    const partnerCtx: PartnerContext = {
      id: sourceId,
      slug: 'osm',
      name: 'OpenStreetMap',
      trustWeight,
    };

    for (let i = 0; i < COVERAGE_CITIES.length; i++) {
      const city = COVERAGE_CITIES[i];

      if (i > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      }

      const result: IngestResult = {
        source: 'osm',
        city: city.name,
        total: 0,
        upserted: 0,
        failed: 0,
        errors: [],
      };

      try {
        const records = await provider.fetchBusinesses(city);
        result.total = records.length;

        for (const record of records) {
          try {
            await this.ingestRecord(record, partnerCtx);
            result.upserted++;
          } catch (err) {
            result.failed++;
            result.errors.push(
              `${record.externalId}: ${(err as Error).message}`,
            );
          }
        }
      } catch (err) {
        result.errors.push(`Fetch error for ${city.name}: ${(err as Error).message}`);
        result.failed++;
      }

      await this.recordSyncLog(sourceId, result);
      results.push(result);
      this.logger.log(
        `OSM sweep: ${city.name} — ${result.upserted}/${result.total} upserted`,
      );
    }

    return results;
  }

  /**
   * Run Google enrichment for a specific city across multiple categories.
   * Falls back gracefully if GOOGLE_PLACES_API_KEY is not set.
   */
  async runGoogleEnrichment(
    cityName: string,
    categories: string[],
    apiKey: string,
  ): Promise<IngestResult> {
    const city = COVERAGE_CITIES.find((c) => c.name === cityName);

    const result: IngestResult = {
      source: 'google_places',
      city: cityName,
      total: 0,
      upserted: 0,
      failed: 0,
      errors: [],
    };

    if (!city) {
      result.errors.push(`City "${cityName}" not found in coverage config`);
      return result;
    }

    const catList = categories.length > 0 ? categories : INGEST_CATEGORIES;

    for (const category of catList) {
      const catResult = await this.runGooglePlaces(city, category, apiKey);
      result.total += catResult.total;
      result.upserted += catResult.upserted;
      result.failed += catResult.failed;
      result.errors.push(...catResult.errors);
    }

    return result;
  }

  /**
   * Convert a RawBusinessRecord to a PartnerUpsertPayload and call upsertBusiness.
   */
  private async ingestRecord(
    record: RawBusinessRecord,
    partnerCtx: PartnerContext,
  ): Promise<void> {
    if (!record.externalId || !record.displayName) {
      throw new Error('Record missing required externalId or displayName');
    }

    const payload: PartnerUpsertPayload = {
      externalId: record.externalId,
      displayName: record.displayName,
      category: record.category,
      phone: record.phone,
      email: record.email,
      website: record.website,
      city: record.city,
      state: record.state,
      country: record.country,
      latitude: record.latitude,
      longitude: record.longitude,
      verification: {
        partnerVerified: record.partnerVerified,
        verificationNotes: `Ingested from ${record.source}`,
      },
    };

    await this.partnerService.upsertBusiness(payload, partnerCtx);
  }

  private async recordSyncLog(
    sourceId: string,
    result: IngestResult,
  ): Promise<void> {
    try {
      await prisma.syncLog.create({
        data: {
          sourceId,
          recordsTotal: result.total,
          recordsUpserted: result.upserted,
          recordsErrors: result.failed,
          errorDetails:
            result.errors.length > 0
              ? { errors: result.errors.slice(0, 10) }
              : undefined,
          completedAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to record sync log: ${(err as Error).message}`);
    }
  }
}
