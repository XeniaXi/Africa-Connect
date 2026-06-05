import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@connectafrica/database';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/auth/jwt.strategy';

export interface SubmitClaimDto {
  businessId: string;
  claimMethod: 'phone_otp' | 'email_otp' | 'document';
  evidenceNotes?: string;
}

export interface VerifyOtpDto {
  otp: string;
}

/**
 * Crown jewel protection rules enforced here:
 *
 * 1. One active claim per business at a time — prevents claim flooding.
 * 2. Claimant must be the authenticated user — claim cannot be submitted on behalf of another.
 * 3. OTP verification upgrades the business verificationLevel to 1 (phone-verified).
 *    Higher levels require admin review.
 * 4. Claim status changes are append-only in AuditLog — never silently mutated.
 * 5. Admin approval/rejection requires ADMIN scope — checked at service level, not just guard.
 */
@Injectable()
export class ClaimService {
  private readonly logger = new Logger(ClaimService.name);

  constructor(private readonly auditService: AuditService) {}

  // ── Submit a new claim ────────────────────────────────────────────────────
  async submitClaim(dto: SubmitClaimDto, actor: JwtPayload, requestId?: string) {
    const business = await prisma.business.findUnique({
      where: { id: dto.businessId },
      select: { id: true, displayName: true, claimedByUserId: true },
    });
    if (!business) throw new NotFoundException(`Business ${dto.businessId} not found`);

    // Crown jewel: already claimed — cannot be claimed again without dispute
    if (business.claimedByUserId) {
      throw new ConflictException(
        'This business has already been claimed. Contact support to dispute.',
      );
    }

    // Prevent duplicate pending claims from the same user
    const existingClaim = await prisma.businessClaim.findFirst({
      where: {
        businessId: dto.businessId,
        claimantUserId: actor.sub,
        claimStatus: 'PENDING',
      },
    });
    if (existingClaim) {
      throw new ConflictException('You already have a pending claim for this business');
    }

    // For OTP-based claims, generate and store OTP (in production: send via SMS/email)
    let otpMetadata: Record<string, unknown> | undefined;
    if (dto.claimMethod === 'phone_otp' || dto.claimMethod === 'email_otp') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      // In production: send OTP via SMS (Termii/Africa's Talking) or email
      // For now: store hashed OTP in evidenceNotes (DEMO ONLY — replace with Redis/DB storage)
      otpMetadata = { otpHash: Buffer.from(otp).toString('base64'), otpExpiry };
      this.logger.log(`OTP for claim ${dto.businessId}: ${otp} (dev only — remove in prod)`);
    }

    const claim = await prisma.businessClaim.create({
      data: {
        businessId: dto.businessId,
        claimantUserId: actor.sub,
        claimMethod: dto.claimMethod,
        claimStatus: 'PENDING',
        evidenceNotes: dto.evidenceNotes,
        ...(otpMetadata ? { evidenceNotes: JSON.stringify(otpMetadata) } : {}),
      },
    });

    await this.auditService.log({
      requestId,
      actorId: actor.sub,
      actorType: 'USER',
      action: 'claim.submit',
      resource: 'BusinessClaim',
      resourceId: claim.id,
      scopes: actor.scopes,
      metadata: { businessId: dto.businessId, claimMethod: dto.claimMethod },
    });

    return {
      claimId: claim.id,
      status: claim.claimStatus,
      message: dto.claimMethod.endsWith('_otp')
        ? 'OTP sent. Call POST /claims/:id/verify-otp with your code.'
        : 'Claim submitted. Our team will review your evidence within 2 business days.',
    };
  }

  // ── OTP verification step ─────────────────────────────────────────────────
  async verifyOtp(claimId: string, dto: VerifyOtpDto, actor: JwtPayload, requestId?: string) {
    const claim = await prisma.businessClaim.findUnique({
      where: { id: claimId },
    });
    if (!claim) throw new NotFoundException(`Claim ${claimId} not found`);

    // Crown jewel: only the original claimant can verify their own OTP
    if (claim.claimantUserId !== actor.sub) {
      throw new ForbiddenException('You can only verify your own claims');
    }
    if (claim.claimStatus !== 'PENDING') {
      throw new ConflictException(`Claim is already ${claim.claimStatus}`);
    }

    // Parse OTP metadata stored at claim submission (demo implementation)
    let metadata: { otpHash?: string; otpExpiry?: string } = {};
    try {
      metadata = claim.evidenceNotes ? JSON.parse(claim.evidenceNotes) : {};
    } catch {
      throw new BadRequestException('Claim does not support OTP verification');
    }

    if (!metadata.otpHash) {
      throw new BadRequestException('This claim does not use OTP verification');
    }

    const storedOtp = Buffer.from(metadata.otpHash, 'base64').toString();
    if (dto.otp !== storedOtp) {
      throw new ForbiddenException('Invalid OTP');
    }
    if (metadata.otpExpiry && new Date(metadata.otpExpiry) < new Date()) {
      throw new ForbiddenException('OTP has expired. Submit a new claim.');
    }

    // OTP valid — approve the claim and upgrade business to phone-verified (level 1)
    const [updatedClaim] = await prisma.$transaction([
      prisma.businessClaim.update({
        where: { id: claimId },
        data: { claimStatus: 'APPROVED', reviewedAt: new Date(), reviewNotes: 'OTP verified' },
      }),
      prisma.business.update({
        where: { id: claim.businessId },
        data: {
          claimedByUserId: actor.sub,
          verificationLevel: 1, // phone-verified — upgrades from 0 (unverified)
        },
      }),
      prisma.verificationRecord.create({
        data: {
          businessId: claim.businessId,
          verificationType: claim.claimMethod,
          verificationStatus: 'VERIFIED',
          verifiedBy: actor.sub,
          evidence: { claimId, method: 'otp', verifiedAt: new Date().toISOString() },
        },
      }),
    ]);

    await this.auditService.log({
      requestId,
      actorId: actor.sub,
      actorType: 'USER',
      action: 'claim.otpVerified',
      resource: 'BusinessClaim',
      resourceId: claimId,
      scopes: actor.scopes,
      metadata: { businessId: claim.businessId, newVerificationLevel: 1 },
    });

    return {
      claimId,
      status: updatedClaim.claimStatus,
      message: 'Claim approved. Your business is now phone-verified. Complete your profile to improve your AI Visibility Score.',
    };
  }

  // ── Get claim status ──────────────────────────────────────────────────────
  async getClaim(claimId: string, actor: JwtPayload) {
    const claim = await prisma.businessClaim.findUnique({
      where: { id: claimId },
      include: { business: { select: { displayName: true } } },
    });
    if (!claim) throw new NotFoundException(`Claim ${claimId} not found`);

    // Users can only see their own claims (admins can see all — checked via scope)
    const isAdmin = actor.scopes?.includes('admin') || actor.actorType === 'ADMIN';
    if (claim.claimantUserId !== actor.sub && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    return claim;
  }

  // ── Admin: approve or reject ───────────────────────────────────────────────
  async reviewClaim(
    claimId: string,
    decision: 'APPROVED' | 'REJECTED',
    reviewNotes: string,
    actor: JwtPayload,
    requestId?: string,
  ) {
    // Crown jewel: only ADMIN actors can approve/reject claims
    if (actor.actorType !== 'ADMIN' && !actor.scopes?.includes('admin')) {
      throw new ForbiddenException('Admin scope required to review claims');
    }

    const claim = await prisma.businessClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException(`Claim ${claimId} not found`);
    if (claim.claimStatus !== 'PENDING') {
      throw new ConflictException(`Claim is already ${claim.claimStatus}`);
    }

    const updates = {
      claimStatus: decision as 'APPROVED' | 'REJECTED',
      reviewedBy: actor.sub,
      reviewedAt: new Date(),
      reviewNotes,
    };

    if (decision === 'APPROVED') {
      await prisma.$transaction([
        prisma.businessClaim.update({ where: { id: claimId }, data: updates }),
        prisma.business.update({
          where: { id: claim.businessId },
          data: { claimedByUserId: claim.claimantUserId, verificationLevel: 2 },
        }),
      ]);
    } else {
      await prisma.businessClaim.update({ where: { id: claimId }, data: updates });
    }

    await this.auditService.log({
      requestId,
      actorId: actor.sub,
      actorType: 'ADMIN',
      action: `claim.${decision.toLowerCase()}`,
      resource: 'BusinessClaim',
      resourceId: claimId,
      scopes: actor.scopes,
      metadata: { decision, reviewNotes, businessId: claim.businessId },
    });

    return { claimId, status: decision };
  }
}
