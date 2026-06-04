import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@connectafrica/database';
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Guards partner-facing endpoints with an API key.
 *
 * Partners send:  X-API-Key: <raw key>
 * We store:       PartnerSource.apiKeyHash = SHA-256(rawKey)
 *
 * Uses timingSafeEqual to prevent timing attacks.
 * Attaches the resolved PartnerSource to request.partner for downstream use.
 */
@Injectable()
export class PartnerApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(PartnerApiKeyGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawKey = request.headers['x-api-key'] as string | undefined;

    if (!rawKey) {
      throw new UnauthorizedException('X-API-Key header is required for partner endpoints');
    }

    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    // Fetch all active partners with an API key — we compare using timingSafeEqual
    // to avoid leaking key existence via response timing.
    const partners = await prisma.partnerSource.findMany({
      where: { apiKeyHash: { not: null }, status: 'active' },
      select: { id: true, slug: true, name: true, trustWeight: true, apiKeyHash: true, status: true },
    });

    const matched = partners.find((p) => {
      if (!p.apiKeyHash) return false;
      try {
        return timingSafeEqual(
          Buffer.from(keyHash,       'hex'),
          Buffer.from(p.apiKeyHash!, 'hex'),
        );
      } catch {
        return false; // buffer length mismatch — never match
      }
    });

    if (!matched) {
      this.logger.warn(`Partner auth failed — invalid API key [ip: ${request.ip}]`);
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    if (matched.status === 'suspended') {
      throw new ForbiddenException(`Partner account "${matched.name}" is suspended`);
    }

    // Attach partner context — controllers and services read from here
    request.partner = {
      id:          matched.id,
      slug:        matched.slug,
      name:        matched.name,
      trustWeight: Number(matched.trustWeight),
    };

    return true;
  }
}
