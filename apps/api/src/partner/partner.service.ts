import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@connectafrica/database';
import { PartnerUpsertPayload } from '@connectafrica/types';
import { computeTrustScore } from '@connectafrica/trust';
import { AuditService } from '../audit/audit.service';

export interface PartnerContext {
  id: string;
  slug: string;
  name: string;
  trustWeight: number;
}

/**
 * Crown jewel protection rules enforced here:
 *
 * 1. Partners can ONLY write businesses belonging to their own sourceId (tenant isolation).
 * 2. Partners CANNOT set verificationLevel directly — it is computed from their
 *    trustWeight + partnerVerified flag. Max level a partner can grant is 2.
 *    Levels 3-6 require internal verification workflows.
 * 3. Every write produces an AuditLog record.
 * 4. Trust score is always recomputed server-side — never trusted from the payload.
 */
@Injectable()
export class PartnerService {
  private readonly logger = new Logger(PartnerService.name);

  constructor(private readonly auditService: AuditService) {}

  // ── Upsert a single business ───────────────────────────────────────────────
  async upsertBusiness(
    payload: PartnerUpsertPayload,
    partner: PartnerContext,
    requestId?: string,
  ): Promise<unknown> {
    const category = await prisma.category.findFirst({
      where: { slug: { contains: payload.category, mode: 'insensitive' } },
    });
    if (!category) {
      throw new BadRequestException(`Unknown category: "${payload.category}". Call GET /v1/categories for the full list.`);
    }

    // CROWN JEWEL: verification level is capped at 2 for partner-sourced data.
    // Higher levels (document, address, trusted partner, certified) require
    // internal verification workflows — partners cannot self-certify above basic.
    const maxPartnerLevel = 2;
    const partnerVerified = payload.verification?.partnerVerified ?? false;
    const verificationLevel = partnerVerified ? maxPartnerLevel : 1;

    // Trust score computed entirely server-side from partner's trustWeight.
    // Partners cannot influence their own scores by crafting payloads.
    const score = computeTrustScore({
      verificationLevel,
      averageRating: null,
      reviewCount: 0,
      verifiedReviewCount: 0,
      completedBookingsCount: 0,
      totalBookingsCount: 0,
      averageResponseTimeHours: null,
      complaintCount: 0,
      resolvedComplaintCount: 0,
      lastActivityDaysAgo: 0,
      partnerTrustWeight: partner.trustWeight,
    }).total;

    const slug = `${payload.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const business = await prisma.business.upsert({
      where: {
        sourceId_externalId: {
          sourceId: partner.id,
          externalId: payload.externalId,
        },
      },
      create: {
        canonicalName: payload.displayName,
        displayName: payload.displayName,
        slug,
        categoryId: category.id,
        sourceId: partner.id,
        externalId: payload.externalId,
        phone: payload.phone,
        email: payload.email,
        website: payload.website,
        verificationLevel,
        trustScore: score,
        status: 'ACTIVE',
        locations: payload.city ? {
          create: [{
            address: '',
            city: payload.city,
            state: payload.state,
            country: payload.country ?? 'Nigeria',
            ...(payload.latitude && payload.longitude
              ? { latitude: payload.latitude, longitude: payload.longitude }
              : {}),
            isPrimary: true,
          }],
        } : undefined,
      },
      update: {
        displayName: payload.displayName,
        phone: payload.phone,
        email: payload.email,
        website: payload.website,
        verificationLevel,
        trustScore: score,
        updatedAt: new Date(),
      },
      include: { locations: true, category: true },
    });

    await this.auditService.log({
      requestId,
      actorId: partner.id,
      actorType: 'PARTNER',
      action: 'partner.upsertBusiness',
      resource: 'Business',
      resourceId: business.id,
      metadata: { externalId: payload.externalId, partnerSlug: partner.slug, score },
    });

    this.logger.log(`Partner "${partner.slug}" upserted business ${business.id} (score: ${score})`);
    return business;
  }

  // ── Batch upsert ──────────────────────────────────────────────────────────
  async batchUpsert(
    payloads: PartnerUpsertPayload[],
    partner: PartnerContext,
    requestId?: string,
  ) {
    if (payloads.length === 0) {
      throw new BadRequestException('Batch must contain at least 1 record');
    }
    if (payloads.length > 500) {
      throw new BadRequestException('Batch cannot exceed 500 records per call');
    }

    const results = { created: 0, updated: 0, failed: 0, errors: [] as string[] };

    for (const payload of payloads) {
      try {
        await this.upsertBusiness(payload, partner, requestId);
        results.created++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${payload.externalId}: ${(err as Error).message}`);
      }
    }

    // Record SyncLog for this batch
    await prisma.syncLog.create({
      data: {
        sourceId:        partner.id,
        recordsTotal:    payloads.length,
        recordsUpserted: results.created,
        recordsErrors:   results.failed,
        errorDetails:    results.errors.length > 0
          ? { errors: results.errors.slice(0, 10) }
          : undefined,
        completedAt: new Date(),
      },
    });

    await this.auditService.log({
      requestId,
      actorId: partner.id,
      actorType: 'PARTNER',
      action: 'partner.batchUpsert',
      resource: 'Business',
      metadata: { ...results, partnerSlug: partner.slug, total: payloads.length },
    });

    return results;
  }

  // ── List partner's own businesses ─────────────────────────────────────────
  async listOwnBusinesses(partner: PartnerContext, limit = 50, offset = 0): Promise<unknown> {
    return prisma.business.findMany({
      where: { sourceId: partner.id },
      include: { locations: { where: { isPrimary: true }, take: 1 }, category: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  // ── List sync history ─────────────────────────────────────────────────────
  async listSyncLogs(partner: PartnerContext, limit = 20): Promise<unknown> {
    return prisma.syncLog.findMany({
      where: { sourceId: partner.id },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}
