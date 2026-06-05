import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IngestService } from './ingest.service';
import { COVERAGE_CITIES, INGEST_CATEGORIES } from '@connectafrica/ingest';

@Injectable()
export class IngestScheduler {
  private readonly logger = new Logger(IngestScheduler.name);

  constructor(private readonly ingestService: IngestService) {}

  /**
   * Run every Sunday at 2am — full OSM sweep of all cities.
   */
  @Cron('0 2 * * 0', { name: 'osm-weekly-sweep' })
  async weeklyOsmSweep(): Promise<void> {
    this.logger.log('Starting weekly OSM sweep across all coverage cities...');
    try {
      const results = await this.ingestService.runFullOsmSweep();
      const totalUpserted = results.reduce((sum, r) => sum + r.upserted, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
      this.logger.log(
        `Weekly OSM sweep complete: ${totalUpserted} upserted, ${totalFailed} failed across ${results.length} cities`,
      );
    } catch (err) {
      this.logger.error(
        `Weekly OSM sweep failed: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  /**
   * Run every day at 3am — Google enrichment for Nigeria cities only.
   * Only runs if GOOGLE_PLACES_API_KEY env var is set.
   */
  @Cron('0 3 * * *', { name: 'google-daily-nigeria' })
  async dailyGoogleNigeria(): Promise<void> {
    const apiKey = process.env['GOOGLE_PLACES_API_KEY'];
    if (!apiKey) {
      this.logger.debug(
        'Skipping daily Google enrichment: GOOGLE_PLACES_API_KEY not set',
      );
      return;
    }

    const nigeriaCities = COVERAGE_CITIES.filter(
      (c) => c.country === 'NG',
    );

    this.logger.log(
      `Starting daily Google enrichment for ${nigeriaCities.length} Nigeria cities...`,
    );

    let totalUpserted = 0;
    let totalFailed = 0;

    for (const city of nigeriaCities) {
      try {
        const result = await this.ingestService.runGoogleEnrichment(
          city.name,
          INGEST_CATEGORIES,
          apiKey,
        );
        totalUpserted += result.upserted;
        totalFailed += result.failed;
        this.logger.log(
          `Google enrichment: ${city.name} — ${result.upserted}/${result.total} upserted`,
        );
      } catch (err) {
        this.logger.error(
          `Google enrichment failed for ${city.name}: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Daily Google Nigeria complete: ${totalUpserted} upserted, ${totalFailed} failed`,
    );
  }
}
