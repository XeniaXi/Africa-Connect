import {
  Controller, Get, Query, Req, ForbiddenException, Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { prisma } from '@connectafrica/database';
import { JwtPayload } from '../common/auth/jwt.strategy';

function requireAdmin(user: JwtPayload) {
  if (user.actorType !== 'ADMIN' && !user.scopes?.includes('admin')) {
    throw new ForbiddenException('ADMIN scope required');
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {

  // ── Claims ─────────────────────────────────────────────────────────────────

  @Get('claims')
  @ApiOperation({ summary: 'List claims (admin only)' })
  async listClaims(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: { user: JwtPayload },
  ): Promise<unknown> {
    requireAdmin(req!.user);
    return prisma.businessClaim.findMany({
      where: status ? { claimStatus: status as any } : undefined,
      include: {
        business: { select: { id: true, displayName: true, slug: true } },
        claimant: { select: { id: true, email: true, phone: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : 50,
      skip: offset ? parseInt(offset) : 0,
    });
  }

  @Get('claims/stats')
  @ApiOperation({ summary: 'Claim counts by status (admin only)' })
  async claimStats(@Req() req: { user: JwtPayload }): Promise<unknown> {
    requireAdmin(req.user);
    const [pending, approved, rejected, disputed] = await Promise.all([
      prisma.businessClaim.count({ where: { claimStatus: 'PENDING' } }),
      prisma.businessClaim.count({ where: { claimStatus: 'APPROVED' } }),
      prisma.businessClaim.count({ where: { claimStatus: 'REJECTED' } }),
      prisma.businessClaim.count({ where: { claimStatus: 'DISPUTED' } }),
    ]);
    return { pending, approved, rejected, disputed, total: pending + approved + rejected + disputed };
  }

  // ── Businesses ─────────────────────────────────────────────────────────────

  @Get('businesses')
  @ApiOperation({ summary: 'List all businesses with full details (admin only)' })
  async listBusinesses(
    @Query('status') status?: string,
    @Query('sourceSlug') sourceSlug?: string,
    @Query('minTrust') minTrust?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: { user: JwtPayload },
  ): Promise<unknown> {
    requireAdmin(req!.user);
    return prisma.business.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(minTrust ? { trustScore: { gte: parseInt(minTrust) } } : {}),
        ...(sourceSlug ? { source: { slug: sourceSlug } } : {}),
      },
      include: {
        category: true,
        source: { select: { name: true, slug: true } },
        locations: { where: { isPrimary: true }, take: 1 },
        _count: { select: { reviews: true, claims: true, leads: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : 50,
      skip: offset ? parseInt(offset) : 0,
    });
  }

  @Get('businesses/stats')
  @ApiOperation({ summary: 'Business counts by status + source (admin only)' })
  async businessStats(@Req() req: { user: JwtPayload }): Promise<unknown> {
    requireAdmin(req.user);
    const [total, active, bySource, byVerification] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { status: 'ACTIVE' } }),
      prisma.partnerSource.findMany({
        select: { name: true, slug: true, _count: { select: { businesses: true } } },
        orderBy: { businesses: { _count: 'desc' } },
      }),
      prisma.business.groupBy({
        by: ['verificationLevel'],
        _count: { id: true },
        orderBy: { verificationLevel: 'asc' },
      }),
    ]);
    return { total, active, bySource, byVerification };
  }

  // ── Partners ───────────────────────────────────────────────────────────────

  @Get('partners')
  @ApiOperation({ summary: 'List all partner sources (admin only)' })
  async listPartners(@Req() req: { user: JwtPayload }): Promise<unknown> {
    requireAdmin(req.user);
    return prisma.partnerSource.findMany({
      include: {
        _count: { select: { businesses: true, syncLogs: true } },
        syncLogs: { orderBy: { startedAt: 'desc' }, take: 3 },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Get('partners/:slug')
  @ApiOperation({ summary: 'Get partner detail + sync history (admin only)' })
  async getPartner(
    @Param('slug') slug: string,
    @Req() req: { user: JwtPayload },
  ): Promise<unknown> {
    requireAdmin(req.user);
    return prisma.partnerSource.findUnique({
      where: { slug },
      include: {
        syncLogs: { orderBy: { startedAt: 'desc' }, take: 20 },
        _count: { select: { businesses: true } },
      },
    });
  }

  // ── Dashboard stats ────────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Top-level dashboard metrics (admin only)' })
  async dashboard(@Req() req: { user: JwtPayload }): Promise<unknown> {
    requireAdmin(req.user);
    const [
      totalBusinesses, activeBusinesses, pendingClaims,
      totalLeads, totalAuditEvents, partnerSources,
      recentSearches,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { status: 'ACTIVE' } }),
      prisma.businessClaim.count({ where: { claimStatus: 'PENDING' } }),
      prisma.lead.count(),
      prisma.auditLog.count(),
      prisma.partnerSource.count({ where: { status: 'active' } }),
      prisma.searchEvent.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);
    return {
      totalBusinesses, activeBusinesses, pendingClaims,
      totalLeads, totalAuditEvents, partnerSources, recentSearches,
    };
  }

  // ── Audit log ──────────────────────────────────────────────────────────────

  @Get('audit')
  @ApiOperation({ summary: 'Query audit log (admin only)' })
  async auditLog(
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: { user: JwtPayload },
  ): Promise<unknown> {
    requireAdmin(req!.user);
    return prisma.auditLog.findMany({
      where: {
        ...(actorId ? { actorId } : {}),
        ...(action ? { action: { contains: action } } : {}),
        ...(resource ? { resource } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : 50,
      skip: offset ? parseInt(offset) : 0,
    });
  }
}
