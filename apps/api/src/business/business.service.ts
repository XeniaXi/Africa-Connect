import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@connectafrica/database';

@Injectable()
export class BusinessService {
  async findById(id: string): Promise<unknown> {
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        locations: true,
        category: true,
        source: { select: { name: true, slug: true } },
        services: true,
      },
    });
    if (!business) throw new NotFoundException(`Business ${id} not found`);
    return business;
  }

  async findMany(filters: {
    categorySlug?: string;
    city?: string;
    state?: string;
    verifiedOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<unknown[]> {
    const { categorySlug, city, state, verifiedOnly, limit = 20, offset = 0 } = filters;
    return prisma.business.findMany({
      where: {
        status: 'ACTIVE',
        ...(verifiedOnly ? { verificationLevel: { gte: 1 } } : {}),
        ...(city || state
          ? { locations: { some: { ...(city ? { city } : {}), ...(state ? { state } : {}) } } }
          : {}),
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
      include: {
        locations: { where: { isPrimary: true }, take: 1 },
        category: true,
      },
      orderBy: { trustScore: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}
