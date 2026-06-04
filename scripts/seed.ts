/**
 * ConnectAfrica — Database Seed Script
 * Seeds 100 sample Nigerian businesses (artisans + hospitals) for development and demo.
 *
 * Usage:
 *   pnpm --filter @connectafrica/database run db:seed
 */

import { PrismaClient } from '@prisma/client';
import { computeTrustScore } from '../../packages/trust/src/index';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────────────────
// Reference data
// ──────────────────────────────────────────────────────────────────────────────

const categories = [
  { slug: 'artisan.electrician', name: 'Electrician', parentSlug: 'artisan' },
  { slug: 'artisan.plumber', name: 'Plumber', parentSlug: 'artisan' },
  { slug: 'artisan.ac-repair', name: 'AC Repair', parentSlug: 'artisan' },
  { slug: 'artisan.carpenter', name: 'Carpenter', parentSlug: 'artisan' },
  { slug: 'artisan.painter', name: 'Painter', parentSlug: 'artisan' },
  { slug: 'healthcare.hospital', name: 'Hospital', parentSlug: 'healthcare' },
  { slug: 'healthcare.clinic', name: 'Clinic', parentSlug: 'healthcare' },
  { slug: 'healthcare.pharmacy', name: 'Pharmacy', parentSlug: 'healthcare' },
];

const parentCategories = [
  { slug: 'artisan', name: 'Artisan & Trades' },
  { slug: 'healthcare', name: 'Healthcare' },
];

const lagosStates = ['Lagos', 'Abuja', 'Kano', 'Rivers', 'Oyo'];
const lagosAreas = ['Ikeja', 'Lekki', 'Victoria Island', 'Surulere', 'Yaba', 'Ajah', 'Ikorodu', 'Apapa'];
const abujaAreas = ['Wuse', 'Garki', 'Maitama', 'Kubwa', 'Gwarinpa'];
const kanoAreas  = ['Sabon Gari', 'Fagge', 'Nassarawa', 'Tarauni', 'Gwale'];

function randomArea(state: string): string {
  if (state === 'Lagos') return lagosAreas[Math.floor(Math.random() * lagosAreas.length)];
  if (state === 'Abuja') return abujaAreas[Math.floor(Math.random() * abujaAreas.length)];
  if (state === 'Kano')  return kanoAreas[Math.floor(Math.random() * kanoAreas.length)];
  return 'City Centre';
}

// ──────────────────────────────────────────────────────────────────────────────
// Seed helpers
// ──────────────────────────────────────────────────────────────────────────────

const artisanNames = [
  'Emeka Electrical Services', 'Chidi Power Solutions', 'Tunde Wiring Experts',
  'Bisi AC Cooling Services', 'Segun Refrigeration & AC', 'Kolade Cool Masters',
  'Femi Plumbing Works', 'Biodun Water Solutions', 'Kunle Pipe Masters',
  'Dapo Carpentry Hub', 'Rotimi Fine Woodworks', 'Sola Furniture Repairs',
  'Gbemi Painting Pros', 'Damilola Surface Finish', 'Adewale Brush Masters',
  'Victor Electrical Ltd', 'Prince AC Services', 'Michael Plumbers NG',
  'Emmanuel Artisan Hub', 'Grace Electrical Works', 'Faith Plumbing Services',
  'Hope AC Repairs Ltd', 'Unity Carpentry Works', 'Glory Painting Services',
  'Divine Electrical NG', 'Miracle Plumbing Hub', 'Blessed AC Center',
  'Power Electric Works', 'CoolMax AC Services', 'FlowPro Plumbing',
];

const hospitalNames = [
  'Lagos General Hospital', 'Abuja National Medical Centre', 'Kano Teaching Hospital',
  'St. Nicholas Hospital', 'Reddington Hospital', 'Lagoon Hospital',
  'EKO Hospital', 'Cedarcrest Hospitals', 'Doyen Medical Centre',
  'City Clinic Lagos', 'Prime Care Clinic', 'Excellence Medical Centre',
  'HealthPlus Pharmacy', 'Medplus Pharmacy', 'Alpha Pharmacy & Stores',
  'Nigerian Navy Reference Hospital', 'University of Lagos Teaching Hospital',
  'Rivers State University Teaching Hospital', 'Aminu Kano Teaching Hospital',
  'National Hospital Abuja', 'Wuse General Hospital', 'Garki Hospital',
  'Asokoro District Hospital', 'Kubwa General Hospital', 'Maitama Hospital',
  'Island General Hospital', 'Mainland Hospital', 'Gbagada General Hospital',
  'Ikeja General Hospital', 'Mushin General Hospital', 'Agege General Hospital',
  'Badagry General Hospital', 'Epe General Hospital', 'Ikorodu General Hospital',
  'Somolu General Hospital', 'Surulere General Hospital', 'Ajeromi General Hospital',
  'Alimosho General Hospital', 'Ifako-Ijaiye General Hospital', 'Kosofe General Hospital',
];

// ──────────────────────────────────────────────────────────────────────────────
// Main seed
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding ConnectAfrica database...');

  // 1. Upsert parent categories
  for (const cat of parentCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { slug: cat.slug, name: cat.name },
    });
  }

  // 2. Upsert leaf categories
  for (const cat of categories) {
    const parent = await prisma.category.findUnique({ where: { slug: cat.parentSlug } });
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { slug: cat.slug, name: cat.name, parentId: parent?.id },
    });
  }

  // 3. Create a seed partner source
  const seedSource = await prisma.partnerSource.upsert({
    where: { slug: 'seed-data' },
    update: {},
    create: {
      name: 'Seed Data',
      slug: 'seed-data',
      sourceType: 'manual',
      trustWeight: 1.0,
      status: 'active',
    },
  });

  // 4. Seed artisan businesses (60)
  const artisanCategorySlugs = ['artisan.electrician', 'artisan.plumber', 'artisan.ac-repair', 'artisan.carpenter', 'artisan.painter'];
  for (let i = 0; i < artisanNames.length; i++) {
    const catSlug = artisanCategorySlugs[i % artisanCategorySlugs.length];
    const category = await prisma.category.findUnique({ where: { slug: catSlug } });
    const state = lagosStates[i % lagosStates.length];
    const city = randomArea(state);
    const verificationLevel = Math.floor(Math.random() * 5);

    const trustInput = {
      verificationLevel,
      averageRating: 3.5 + Math.random() * 1.5,
      reviewCount: Math.floor(Math.random() * 30),
      verifiedReviewCount: Math.floor(Math.random() * 10),
      completedBookingsCount: Math.floor(Math.random() * 40),
      totalBookingsCount: Math.floor(Math.random() * 50),
      averageResponseTimeHours: Math.random() * 24,
      complaintCount: Math.floor(Math.random() * 3),
      resolvedComplaintCount: Math.floor(Math.random() * 3),
      lastActivityDaysAgo: Math.floor(Math.random() * 30),
      partnerTrustWeight: 1.0,
    };
    const trust = computeTrustScore(trustInput);

    await prisma.business.create({
      data: {
        externalId: `seed-artisan-${i + 1}`,
        sourceId: seedSource.id,
        canonicalName: artisanNames[i].toLowerCase().replace(/\s+/g, '-'),
        displayName: artisanNames[i],
        categoryId: category!.id,
        description: `Professional ${category!.name.toLowerCase()} services in ${city}, ${state}.`,
        phone: `+234${Math.floor(7000000000 + Math.random() * 2999999999)}`,
        status: 'ACTIVE',
        verificationLevel,
        trustScore: trust.total,
        availabilityStatus: ['available', 'busy', 'available', 'available'][i % 4],
        locations: {
          create: {
            city,
            state,
            country: 'Nigeria',
            address: `${Math.floor(1 + Math.random() * 100)} ${city} Street`,
            isPrimary: true,
          },
        },
        services: {
          create: [{
            name: `${category!.name} Services`,
            tags: [catSlug, state.toLowerCase(), city.toLowerCase()],
          }],
        },
      },
    });
  }

  // 5. Seed hospital/clinic businesses (40)
  const healthCategorySlugs = ['healthcare.hospital', 'healthcare.clinic', 'healthcare.pharmacy'];
  for (let i = 0; i < hospitalNames.length; i++) {
    const catSlug = healthCategorySlugs[i % healthCategorySlugs.length];
    const category = await prisma.category.findUnique({ where: { slug: catSlug } });
    const state = lagosStates[i % lagosStates.length];
    const city = randomArea(state);
    const verificationLevel = 2 + Math.floor(Math.random() * 4); // hospitals tend to be more verified

    const trustInput = {
      verificationLevel,
      averageRating: 3.8 + Math.random() * 1.2,
      reviewCount: Math.floor(20 + Math.random() * 100),
      verifiedReviewCount: Math.floor(Math.random() * 40),
      completedBookingsCount: Math.floor(50 + Math.random() * 200),
      totalBookingsCount: Math.floor(60 + Math.random() * 220),
      averageResponseTimeHours: Math.random() * 4,
      complaintCount: Math.floor(Math.random() * 5),
      resolvedComplaintCount: Math.floor(Math.random() * 5),
      lastActivityDaysAgo: Math.floor(Math.random() * 7),
      partnerTrustWeight: 1.0,
    };
    const trust = computeTrustScore(trustInput);

    await prisma.business.create({
      data: {
        externalId: `seed-health-${i + 1}`,
        sourceId: seedSource.id,
        canonicalName: hospitalNames[i].toLowerCase().replace(/\s+/g, '-'),
        displayName: hospitalNames[i],
        categoryId: category!.id,
        description: `${category!.name} providing quality healthcare services in ${city}, ${state}.`,
        phone: `+234${Math.floor(7000000000 + Math.random() * 2999999999)}`,
        status: 'ACTIVE',
        verificationLevel,
        trustScore: trust.total,
        availabilityStatus: 'available',
        locations: {
          create: {
            city,
            state,
            country: 'Nigeria',
            address: `${Math.floor(1 + Math.random() * 200)} ${city} Road`,
            isPrimary: true,
          },
        },
        services: {
          create: [{
            name: `${category!.name} Services`,
            tags: [catSlug, 'healthcare', state.toLowerCase(), city.toLowerCase()],
          }],
        },
      },
    });
  }

  const count = await prisma.business.count();
  console.log(`Seeding complete. Total businesses: ${count}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
