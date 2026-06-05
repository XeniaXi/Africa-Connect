import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  ForbiddenException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { prisma } from '@connectafrica/database';
import { IngestService } from './ingest.service';
import { IngestResult } from '@connectafrica/ingest';
import { COVERAGE_CITIES } from '@connectafrica/ingest';

interface AuthenticatedRequest {
  user?: {
    actorType?: string;
  };
}

@ApiTags('admin/ingest')
@Controller('admin/ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  private assertAdmin(req: AuthenticatedRequest): void {
    if (req.user?.actorType !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  /**
   * POST /admin/ingest/osm
   * Body: { city?: string }
   * Run OSM sweep for a single city or all cities.
   */
  @Post('osm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run OSM ingest sweep (single city or all cities)' })
  async runOsm(
    @Req() req: AuthenticatedRequest,
    @Body() body: { city?: string },
  ): Promise<IngestResult | IngestResult[]> {
    this.assertAdmin(req);

    if (body.city) {
      const city = COVERAGE_CITIES.find(
        (c) => c.name.toLowerCase() === body.city!.toLowerCase(),
      );
      if (!city) {
        throw new BadRequestException(
          `City "${body.city}" not found. Valid cities: ${COVERAGE_CITIES.map((c) => c.name).join(', ')}`,
        );
      }
      return this.ingestService.runOsm(city);
    }

    return this.ingestService.runFullOsmSweep();
  }

  /**
   * POST /admin/ingest/google
   * Body: { city: string, category: string, apiKey: string }
   * Run Google Places enrichment for a city + category.
   */
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run Google Places enrichment for a city/category' })
  async runGoogle(
    @Req() req: AuthenticatedRequest,
    @Body() body: { city: string; category: string; apiKey?: string },
  ): Promise<IngestResult> {
    this.assertAdmin(req);

    const apiKey =
      body.apiKey ?? process.env['GOOGLE_PLACES_API_KEY'] ?? '';
    if (!apiKey) {
      throw new BadRequestException(
        'Google Places API key required: pass apiKey in body or set GOOGLE_PLACES_API_KEY env var',
      );
    }

    if (!body.city) {
      throw new BadRequestException('city is required');
    }

    const categories = body.category ? [body.category] : [];
    return this.ingestService.runGoogleEnrichment(body.city, categories, apiKey);
  }

  /**
   * POST /admin/ingest/who-hdx
   * Body: { csvPath: string }
   * Load WHO HDX health facilities from a CSV file.
   */
  @Post('who-hdx')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk ingest WHO HDX health facilities from CSV' })
  async runWhoHdx(
    @Req() req: AuthenticatedRequest,
    @Body() body: { csvPath: string },
  ): Promise<IngestResult> {
    this.assertAdmin(req);

    if (!body.csvPath) {
      throw new BadRequestException('csvPath is required');
    }

    return this.ingestService.runWhoHdx(body.csvPath);
  }

  /**
   * GET /admin/ingest/sources
   * List all PartnerSource records with last sync time.
   */
  @Get('sources')
  @ApiOperation({ summary: 'List all partner sources with last sync info' })
  async listSources(@Req() req: AuthenticatedRequest): Promise<unknown[]> {
    this.assertAdmin(req);

    const sources = await prisma.partnerSource.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        sourceType: true,
        trustWeight: true,
        status: true,
        lastSyncAt: true,
        createdAt: true,
        _count: { select: { businesses: true, syncLogs: true } },
      },
    });

    return sources;
  }
}
