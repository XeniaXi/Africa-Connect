import { Injectable } from '@nestjs/common';
import { prisma } from '@connectafrica/database';
import { FindBusinessInput, BusinessSearchResult } from '@connectafrica/types';
import { TRUST_THRESHOLDS } from '@connectafrica/trust';

@Injectable()
export class SearchService {
  async search(input: FindBusinessInput, actorType = 'AGENT'): Promise<BusinessSearchResult[]> {
    const { category, city, state, verifiedOnly, limit = 10 } = input;

    const businesses = await prisma.business.findMany({
      where: {
        status: 'ACTIVE',
        trustScore: { gte: TRUST_THRESHOLDS.MIN_FOR_AI_DISPLAY },
        ...(verifiedOnly ? { verificationLevel: { gte: 1 } } : {}),
        ...(category ? { category: { slug: { contains: category, mode: 'insensitive' } } } : {}),
        ...(city || state
          ? {
              locations: {
                some: {
                  ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
                  ...(state ? { state: { contains: state, mode: 'insensitive' } } : {}),
                },
              },
            }
          : {}),
      },
      include: {
        locations: { where: { isPrimary: true }, take: 1 },
        category: true,
        reviews: { select: { rating: true }, take: 100 },
      },
      orderBy: { trustScore: 'desc' },
      take: limit,
    });

    // Log search event
    await prisma.searchEvent.create({
      data: {
        query: input.intent ?? [category, city, state].filter(Boolean).join(' '),
        category,
        city,
        state,
        resultCount: businesses.length,
        topBusinessId: businesses[0]?.id ?? null,
        actorType: actorType as any,
      },
    });

    return businesses.map((b) => {
      const loc = b.locations[0];
      const avgRating =
        b.reviews.length > 0
          ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length
          : null;

      return {
        businessId: b.id,
        displayName: b.displayName,
        category: b.category.name,
        locationSummary: loc ? `${loc.city}, ${loc.state}` : 'Location unknown',
        verificationLevel: b.verificationLevel,
        trustScore: b.trustScore,
        rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        availabilityStatus: b.availabilityStatus,
        rankingReason: this.getRankingReason(b.trustScore, b.verificationLevel),
      };
    });
  }

  private getRankingReason(trustScore: number, verificationLevel: number): string {
    if (trustScore >= TRUST_THRESHOLDS.MIN_FOR_TRUSTED_RECOMMENDATION)
      return 'trusted-verified-business';
    if (verificationLevel >= 3) return 'document-verified';
    if (verificationLevel >= 1) return 'phone-verified';
    return 'basic-listing';
  }
}
