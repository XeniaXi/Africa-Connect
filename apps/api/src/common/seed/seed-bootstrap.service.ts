import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { prisma } from '@connectafrica/database';

/**
 * Runs once on every startup and idempotently upserts the minimum
 * lookup data required for ingestion to work:
 *   - All categories (parents + all subcategories the category mapper can produce)
 *   - All ingest PartnerSource records
 *
 * Uses upsert so it is safe to run on every boot with zero side-effects
 * if the data already exists.
 */
@Injectable()
export class SeedBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedBootstrapService.name);

  async onApplicationBootstrap(): Promise<void> {
    await this.seedCategories();
    await this.seedIngestSources();
  }

  // ── Categories ─────────────────────────────────────────────────────────────
  private async seedCategories(): Promise<void> {
    const categories = [
      // ── Top-level ──────────────────────────────────────────────────────────
      { slug: 'healthcare',   name: 'Healthcare',    description: 'Medical and health services' },
      { slug: 'artisan',      name: 'Artisan',       description: 'Skilled trade professionals' },
      { slug: 'education',    name: 'Education',     description: 'Schools and learning institutions' },
      { slug: 'logistics',    name: 'Logistics',     description: 'Transport and delivery services' },
      { slug: 'food',         name: 'Food',          description: 'Restaurants and food services' },
      { slug: 'retail',       name: 'Retail',        description: 'Shops and stores' },
      { slug: 'finance',      name: 'Finance',       description: 'Banking and financial services' },
      { slug: 'professional', name: 'Professional',  description: 'Professional services' },
      { slug: 'estate',       name: 'Estate',        description: 'Real estate and property' },
      { slug: 'beauty',       name: 'Beauty',        description: 'Beauty and personal care' },
      { slug: 'fitness',      name: 'Fitness',       description: 'Fitness and wellness' },
      { slug: 'general',      name: 'General',       description: 'General businesses' },

      // ── Healthcare ─────────────────────────────────────────────────────────
      { slug: 'healthcare.hospital', name: 'Hospital',  description: 'Full-service hospitals' },
      { slug: 'healthcare.clinic',   name: 'Clinic',    description: 'Outpatient clinics and doctors' },
      { slug: 'healthcare.pharmacy', name: 'Pharmacy',  description: 'Retail pharmacies' },
      { slug: 'healthcare.dentist',  name: 'Dentist',   description: 'Dental clinics' },
      { slug: 'healthcare.vet',      name: 'Veterinary',description: 'Veterinary clinics' },

      // ── Artisan ────────────────────────────────────────────────────────────
      { slug: 'artisan.electrician', name: 'Electrician',   description: 'Licensed electrical contractors' },
      { slug: 'artisan.plumber',     name: 'Plumber',       description: 'Plumbing services' },
      { slug: 'artisan.contractor',  name: 'Contractor',    description: 'General contractors' },
      { slug: 'artisan.painter',     name: 'Painter',       description: 'Painting services' },
      { slug: 'artisan.auto',        name: 'Auto Repair',   description: 'Car repair and wash' },
      { slug: 'artisan.ac',          name: 'AC Technician', description: 'Air conditioning services' },
      { slug: 'artisan.carpenter',   name: 'Carpenter',     description: 'Carpentry services' },
      { slug: 'artisan.welder',      name: 'Welder',        description: 'Welding services' },
      { slug: 'artisan.tiler',       name: 'Tiler',         description: 'Tiling services' },

      // ── Education ──────────────────────────────────────────────────────────
      { slug: 'education.school',    name: 'School',     description: 'Primary and secondary schools' },
      { slug: 'education.university',name: 'University', description: 'Universities and colleges' },
      { slug: 'education.tutoring',  name: 'Tutoring',   description: 'Tutoring services' },

      // ── Logistics ──────────────────────────────────────────────────────────
      { slug: 'logistics.moving',    name: 'Moving',     description: 'Moving and storage services' },
      { slug: 'logistics.courier',   name: 'Courier',    description: 'Courier and delivery services' },
      { slug: 'logistics.transport', name: 'Transport',  description: 'Taxi and transport services' },
      { slug: 'logistics.fuel',      name: 'Fuel',       description: 'Fuel stations' },

      // ── Food ───────────────────────────────────────────────────────────────
      { slug: 'food.restaurant', name: 'Restaurant', description: 'Restaurants and eateries' },
      { slug: 'food.bakery',     name: 'Bakery',     description: 'Bakeries' },
      { slug: 'food.cafe',       name: 'Cafe',       description: 'Cafes and coffee shops' },

      // ── Retail ─────────────────────────────────────────────────────────────
      { slug: 'retail.grocery',     name: 'Grocery',     description: 'Supermarkets and grocery stores' },
      { slug: 'retail.clothing',    name: 'Clothing',    description: 'Clothing stores' },
      { slug: 'retail.electronics', name: 'Electronics', description: 'Electronics stores' },

      // ── Finance ────────────────────────────────────────────────────────────
      { slug: 'finance.bank',      name: 'Bank',      description: 'Banks' },
      { slug: 'finance.atm',       name: 'ATM',       description: 'ATM locations' },
      { slug: 'finance.insurance', name: 'Insurance', description: 'Insurance agencies' },

      // ── Professional ───────────────────────────────────────────────────────
      { slug: 'professional.legal',       name: 'Legal',      description: 'Legal services' },
      { slug: 'professional.accounting',  name: 'Accounting', description: 'Accounting services' },

      // ── Estate ─────────────────────────────────────────────────────────────
      { slug: 'estate.property', name: 'Property', description: 'Real estate agencies' },

      // ── Beauty ─────────────────────────────────────────────────────────────
      { slug: 'beauty.salon', name: 'Salon', description: 'Hair salons and beauty services' },

      // ── Fitness ────────────────────────────────────────────────────────────
      { slug: 'fitness.gym', name: 'Gym', description: 'Gyms and fitness centers' },
    ];

    let created = 0;
    for (const cat of categories) {
      const result = await prisma.category.upsert({
        where: { slug: cat.slug },
        create: cat,
        update: { name: cat.name, description: cat.description },
      });
      if (result) created++;
    }

    this.logger.log(`Categories ready (${categories.length} slugs ensured)`);
  }

  // ── Ingest partner sources ─────────────────────────────────────────────────
  private async seedIngestSources(): Promise<void> {
    const sources = [
      { slug: 'osm',              name: 'OpenStreetMap',               sourceType: 'api',         trustWeight: 0.60 },
      { slug: 'google-places',    name: 'Google Places',               sourceType: 'api',         trustWeight: 0.85 },
      { slug: 'who-hdx',          name: 'WHO Health Facilities (HDX)', sourceType: 'bulk_import', trustWeight: 0.80 },
      { slug: 'cac-nigeria',      name: 'CAC Nigeria',                 sourceType: 'api',         trustWeight: 0.90 },
      { slug: 'cipc-southafrica', name: 'CIPC South Africa',          sourceType: 'api',         trustWeight: 0.90 },
      { slug: 'opencorporates',   name: 'OpenCorporates',             sourceType: 'api',         trustWeight: 0.75 },
    ];

    for (const s of sources) {
      await prisma.partnerSource.upsert({
        where: { slug: s.slug },
        create: { ...s, status: 'active' },
        update: {},
      });
    }

    this.logger.log(`Ingest sources ready (${sources.length} sources ensured)`);
  }
}
