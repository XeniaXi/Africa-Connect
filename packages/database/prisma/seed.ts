/**
 * ConnectAfrica seed — 70 businesses for staging and demo.
 * Run: pnpm db:seed (from repo root)
 *
 * Breakdown:
 *   10 categories
 *   2 partner sources (SortAm, MediSeen)
 *   30 artisans (Lagos, Abuja, Port Harcourt)
 *   40 healthcare (hospitals, clinics, pharmacies — 5 states)
 */

import { PrismaClient } from '@prisma/client';
import {
  computeVerificationScore,
  computeReviewQualityScore,
  computeTransactionScore,
  computeResponseTimeScore,
  computeComplaintHistoryScore,
  computeFreshnessScore,
  computePartnerConfidenceScore,
} from '../../trust/src/index';

const prisma = new PrismaClient();

// ─── helpers ─────────────────────────────────────────────────────────────────
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function trustScore(opts: {
  verificationLevel: number;
  rating: number | null;
  reviews: number;
  verifiedReviews: number;
  completedBookings: number;
  totalBookings: number;
  responseHours: number | null;
  complaints: number;
  resolvedComplaints: number;
  daysAgo: number;
  partnerWeight: number;
}): number {
  const v  = computeVerificationScore(opts.verificationLevel);
  const rq = computeReviewQualityScore(opts.rating, opts.reviews, opts.verifiedReviews);
  const tx = computeTransactionScore(opts.completedBookings, opts.totalBookings);
  const rt = computeResponseTimeScore(opts.responseHours);
  const ch = computeComplaintHistoryScore(opts.complaints, opts.resolvedComplaints, opts.totalBookings);
  const fr = computeFreshnessScore(opts.daysAgo);
  const pc = computePartnerConfidenceScore(opts.partnerWeight);
  return Math.round(v*0.30 + rq*0.20 + tx*0.20 + rt*0.10 + ch*0.10 + fr*0.05 + pc*0.05);
}

// ─── categories ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Electrician',    slug: 'artisan.electrician',    description: 'Licensed electrical contractors' },
  { name: 'Plumber',        slug: 'artisan.plumber',        description: 'Plumbing and pipe installation' },
  { name: 'AC Technician',  slug: 'artisan.ac',             description: 'Air conditioning installation and repair' },
  { name: 'Carpenter',      slug: 'artisan.carpenter',      description: 'Furniture making and carpentry' },
  { name: 'Painter',        slug: 'artisan.painter',        description: 'Interior and exterior painting' },
  { name: 'Welder',         slug: 'artisan.welder',         description: 'Welding and metal fabrication' },
  { name: 'Tiler',          slug: 'artisan.tiler',          description: 'Floor and wall tiling' },
  { name: 'Hospital',       slug: 'healthcare.hospital',    description: 'Full-service hospitals' },
  { name: 'Clinic',         slug: 'healthcare.clinic',      description: 'Outpatient clinics' },
  { name: 'Pharmacy',       slug: 'healthcare.pharmacy',    description: 'Retail pharmacies' },
];

// ─── artisans ────────────────────────────────────────────────────────────────
const ARTISANS = [
  // Lagos — 15
  { name: 'Emeka Electrical Services', cat: 'artisan.electrician', city: 'Lagos', state: 'Lagos', phone: '+2348012345601', vlevel: 3 },
  { name: 'Tunde Plumbing Works',       cat: 'artisan.plumber',    city: 'Lagos', state: 'Lagos', phone: '+2348012345602', vlevel: 2 },
  { name: 'Cool Air Solutions',         cat: 'artisan.ac',         city: 'Lagos', state: 'Lagos', phone: '+2348012345603', vlevel: 4 },
  { name: 'Adeleke Carpentry',          cat: 'artisan.carpenter',  city: 'Lagos', state: 'Lagos', phone: '+2348012345604', vlevel: 2 },
  { name: 'Bright Coat Painters',       cat: 'artisan.painter',    city: 'Lagos', state: 'Lagos', phone: '+2348012345605', vlevel: 1 },
  { name: 'Lagos Welding Hub',          cat: 'artisan.welder',     city: 'Lagos', state: 'Lagos', phone: '+2348012345606', vlevel: 3 },
  { name: 'Tiles & More',               cat: 'artisan.tiler',      city: 'Lagos', state: 'Lagos', phone: '+2348012345607', vlevel: 2 },
  { name: 'Wiring Pro Nigeria',         cat: 'artisan.electrician', city: 'Ikeja', state: 'Lagos', phone: '+2348012345608', vlevel: 5 },
  { name: 'AquaFix Plumbing',          cat: 'artisan.plumber',    city: 'Ikeja', state: 'Lagos', phone: '+2348012345609', vlevel: 3 },
  { name: 'FrostMaster HVAC',           cat: 'artisan.ac',         city: 'Lekki', state: 'Lagos', phone: '+2348012345610', vlevel: 4 },
  { name: 'Creative Wood Designs',      cat: 'artisan.carpenter',  city: 'Lekki', state: 'Lagos', phone: '+2348012345611', vlevel: 2 },
  { name: 'Precision Painters',         cat: 'artisan.painter',    city: 'Lekki', state: 'Lagos', phone: '+2348012345612', vlevel: 3 },
  { name: 'MetalWork Masters',          cat: 'artisan.welder',     city: 'Surulere', state: 'Lagos', phone: '+2348012345613', vlevel: 2 },
  { name: 'FloorPro Tiling',            cat: 'artisan.tiler',      city: 'Victoria Island', state: 'Lagos', phone: '+2348012345614', vlevel: 4 },
  { name: 'PowerLink Electricals',      cat: 'artisan.electrician', city: 'Yaba', state: 'Lagos', phone: '+2348012345615', vlevel: 3 },
  // Abuja — 10
  { name: 'Capital Electricals',        cat: 'artisan.electrician', city: 'Abuja', state: 'FCT', phone: '+2348012345616', vlevel: 4 },
  { name: 'Abuja Plumbing Services',    cat: 'artisan.plumber',    city: 'Abuja', state: 'FCT', phone: '+2348012345617', vlevel: 3 },
  { name: 'CoolBreeze AC Abuja',        cat: 'artisan.ac',         city: 'Abuja', state: 'FCT', phone: '+2348012345618', vlevel: 3 },
  { name: 'FCT Woodcraft',              cat: 'artisan.carpenter',  city: 'Abuja', state: 'FCT', phone: '+2348012345619', vlevel: 2 },
  { name: 'Abuja Paint Masters',        cat: 'artisan.painter',    city: 'Abuja', state: 'FCT', phone: '+2348012345620', vlevel: 2 },
  { name: 'Wuse Welding Works',         cat: 'artisan.welder',     city: 'Wuse', state: 'FCT', phone: '+2348012345621', vlevel: 3 },
  { name: 'Garki Tiling Company',       cat: 'artisan.tiler',      city: 'Garki', state: 'FCT', phone: '+2348012345622', vlevel: 2 },
  { name: 'Maitama Electricians',       cat: 'artisan.electrician', city: 'Maitama', state: 'FCT', phone: '+2348012345623', vlevel: 4 },
  { name: 'Gwarinpa Plumbers',          cat: 'artisan.plumber',    city: 'Gwarinpa', state: 'FCT', phone: '+2348012345624', vlevel: 3 },
  { name: 'Asokoro AC Services',        cat: 'artisan.ac',         city: 'Asokoro', state: 'FCT', phone: '+2348012345625', vlevel: 3 },
  // Port Harcourt — 5
  { name: 'PH Electrical Contractors', cat: 'artisan.electrician', city: 'Port Harcourt', state: 'Rivers', phone: '+2348012345626', vlevel: 3 },
  { name: 'Rivers Plumbing Co',         cat: 'artisan.plumber',    city: 'Port Harcourt', state: 'Rivers', phone: '+2348012345627', vlevel: 2 },
  { name: 'Delta Cool Systems',         cat: 'artisan.ac',         city: 'Port Harcourt', state: 'Rivers', phone: '+2348012345628', vlevel: 3 },
  { name: 'PH Woodwork Studio',         cat: 'artisan.carpenter',  city: 'Port Harcourt', state: 'Rivers', phone: '+2348012345629', vlevel: 2 },
  { name: 'SouthSouth Painters',        cat: 'artisan.painter',    city: 'Port Harcourt', state: 'Rivers', phone: '+2348012345630', vlevel: 1 },
];

// ─── healthcare ──────────────────────────────────────────────────────────────
const HEALTHCARE = [
  // Lagos — 16
  { name: 'Lagos Island General Hospital',  cat: 'healthcare.hospital',  city: 'Lagos Island', state: 'Lagos', phone: '+2348012345701', vlevel: 5 },
  { name: 'Reddington Hospital',            cat: 'healthcare.hospital',  city: 'Victoria Island', state: 'Lagos', phone: '+2348012345702', vlevel: 6 },
  { name: 'Lagoon Hospital Apapa',          cat: 'healthcare.hospital',  city: 'Apapa', state: 'Lagos', phone: '+2348012345703', vlevel: 5 },
  { name: 'MedFirst Clinic Ikeja',          cat: 'healthcare.clinic',    city: 'Ikeja', state: 'Lagos', phone: '+2348012345704', vlevel: 3 },
  { name: 'Lekki Health Centre',            cat: 'healthcare.clinic',    city: 'Lekki', state: 'Lagos', phone: '+2348012345705', vlevel: 3 },
  { name: 'Surulere Family Clinic',         cat: 'healthcare.clinic',    city: 'Surulere', state: 'Lagos', phone: '+2348012345706', vlevel: 2 },
  { name: 'Victoria Pharmacy',             cat: 'healthcare.pharmacy',  city: 'Victoria Island', state: 'Lagos', phone: '+2348012345707', vlevel: 3 },
  { name: 'HealthPlus Lekki',              cat: 'healthcare.pharmacy',  city: 'Lekki', state: 'Lagos', phone: '+2348012345708', vlevel: 4 },
  { name: 'MedPharma Ikeja',               cat: 'healthcare.pharmacy',  city: 'Ikeja', state: 'Lagos', phone: '+2348012345709', vlevel: 3 },
  { name: 'St. Nicholas Hospital',         cat: 'healthcare.hospital',  city: 'Lagos Island', state: 'Lagos', phone: '+2348012345710', vlevel: 5 },
  { name: 'Marina Medical Centre',         cat: 'healthcare.clinic',    city: 'Lagos Island', state: 'Lagos', phone: '+2348012345711', vlevel: 4 },
  { name: 'Yaba Community Clinic',         cat: 'healthcare.clinic',    city: 'Yaba', state: 'Lagos', phone: '+2348012345712', vlevel: 2 },
  { name: 'PharmaCare Yaba',               cat: 'healthcare.pharmacy',  city: 'Yaba', state: 'Lagos', phone: '+2348012345713', vlevel: 3 },
  { name: 'Alimosho General Hospital',     cat: 'healthcare.hospital',  city: 'Alimosho', state: 'Lagos', phone: '+2348012345714', vlevel: 4 },
  { name: 'Ojo Clinic',                    cat: 'healthcare.clinic',    city: 'Ojo', state: 'Lagos', phone: '+2348012345715', vlevel: 2 },
  { name: 'Badagry Pharmacy',              cat: 'healthcare.pharmacy',  city: 'Badagry', state: 'Lagos', phone: '+2348012345716', vlevel: 2 },
  // Abuja — 8
  { name: 'National Hospital Abuja',       cat: 'healthcare.hospital',  city: 'Abuja', state: 'FCT', phone: '+2348012345717', vlevel: 6 },
  { name: 'Garki Hospital',                cat: 'healthcare.hospital',  city: 'Garki', state: 'FCT', phone: '+2348012345718', vlevel: 5 },
  { name: 'Maitama Hospital',              cat: 'healthcare.hospital',  city: 'Maitama', state: 'FCT', phone: '+2348012345719', vlevel: 5 },
  { name: 'Wuse Clinic',                   cat: 'healthcare.clinic',    city: 'Wuse', state: 'FCT', phone: '+2348012345720', vlevel: 3 },
  { name: 'Asokoro Clinic',               cat: 'healthcare.clinic',    city: 'Asokoro', state: 'FCT', phone: '+2348012345721', vlevel: 3 },
  { name: 'Gwarinpa Health Centre',        cat: 'healthcare.clinic',    city: 'Gwarinpa', state: 'FCT', phone: '+2348012345722', vlevel: 2 },
  { name: 'Capital Pharmacy Abuja',        cat: 'healthcare.pharmacy',  city: 'Abuja', state: 'FCT', phone: '+2348012345723', vlevel: 4 },
  { name: 'MedExpress Pharmacy',           cat: 'healthcare.pharmacy',  city: 'Wuse', state: 'FCT', phone: '+2348012345724', vlevel: 3 },
  // Rivers / Kano / Oyo — 16
  { name: 'University of Port Harcourt Teaching Hospital', cat: 'healthcare.hospital', city: 'Port Harcourt', state: 'Rivers', phone: '+2348012345725', vlevel: 6 },
  { name: 'Braithwaite Memorial Hospital', cat: 'healthcare.hospital',  city: 'Port Harcourt', state: 'Rivers', phone: '+2348012345726', vlevel: 5 },
  { name: 'PH Clinic',                     cat: 'healthcare.clinic',    city: 'Port Harcourt', state: 'Rivers', phone: '+2348012345727', vlevel: 3 },
  { name: 'Rivers Pharmacy',               cat: 'healthcare.pharmacy',  city: 'Port Harcourt', state: 'Rivers', phone: '+2348012345728', vlevel: 3 },
  { name: 'Aminu Kano Teaching Hospital',  cat: 'healthcare.hospital',  city: 'Kano', state: 'Kano', phone: '+2348012345729', vlevel: 6 },
  { name: 'Murtala Mohammed Specialist Hospital', cat: 'healthcare.hospital', city: 'Kano', state: 'Kano', phone: '+2348012345730', vlevel: 5 },
  { name: 'Kano Metro Clinic',             cat: 'healthcare.clinic',    city: 'Kano', state: 'Kano', phone: '+2348012345731', vlevel: 3 },
  { name: 'Kano Health Pharmacy',          cat: 'healthcare.pharmacy',  city: 'Kano', state: 'Kano', phone: '+2348012345732', vlevel: 2 },
  { name: 'University College Hospital Ibadan', cat: 'healthcare.hospital', city: 'Ibadan', state: 'Oyo', phone: '+2348012345733', vlevel: 6 },
  { name: 'Ring Road State Hospital',      cat: 'healthcare.hospital',  city: 'Ibadan', state: 'Oyo', phone: '+2348012345734', vlevel: 5 },
  { name: 'Bodija Clinic',                 cat: 'healthcare.clinic',    city: 'Ibadan', state: 'Oyo', phone: '+2348012345735', vlevel: 3 },
  { name: 'Dugbe Pharmacy',                cat: 'healthcare.pharmacy',  city: 'Ibadan', state: 'Oyo', phone: '+2348012345736', vlevel: 2 },
  { name: 'Ogbomoso General Hospital',     cat: 'healthcare.hospital',  city: 'Ogbomoso', state: 'Oyo', phone: '+2348012345737', vlevel: 4 },
  { name: 'Oyo State Specialists Hospital', cat: 'healthcare.hospital', city: 'Ibadan', state: 'Oyo', phone: '+2348012345738', vlevel: 5 },
  { name: 'Sango Ota Clinic',              cat: 'healthcare.clinic',    city: 'Sango Ota', state: 'Ogun', phone: '+2348012345739', vlevel: 2 },
  { name: 'Abeokuta Community Pharmacy',   cat: 'healthcare.pharmacy',  city: 'Abeokuta', state: 'Ogun', phone: '+2348012345740', vlevel: 2 },
];

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding ConnectAfrica...');

  // Categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: { description: cat.description },
    });
  }
  console.log(`  ✓ ${CATEGORIES.length} categories`);

  // Partner sources
  const sortam = await prisma.partnerSource.upsert({
    where: { slug: 'sortam' },
    create: { name: 'SortAm', slug: 'sortam', webhookUrl: null, trustWeight: 1.2, isActive: true },
    update: {},
  });
  const mediseen = await prisma.partnerSource.upsert({
    where: { slug: 'mediseen' },
    create: { name: 'MediSeen', slug: 'mediseen', webhookUrl: null, trustWeight: 1.5, isActive: true },
    update: {},
  });
  console.log('  ✓ 2 partner sources (SortAm, MediSeen)');

  // Artisans
  let artisanCount = 0;
  for (const a of ARTISANS) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: a.cat } });
    const rating     = +(3.2 + Math.random() * 1.7).toFixed(1);
    const reviews    = rand(0, 40);
    const bookings   = rand(5, 60);
    const completed  = rand(Math.floor(bookings * 0.7), bookings);
    const daysAgo    = rand(1, 90);
    const score = trustScore({
      verificationLevel: a.vlevel,
      rating: reviews > 0 ? rating : null,
      reviews,
      verifiedReviews: rand(0, Math.floor(reviews * 0.6)),
      completedBookings: completed,
      totalBookings: bookings,
      responseHours: pick([1, 2, 4, 8, 24, null]),
      complaints: rand(0, 2),
      resolvedComplaints: rand(0, 1),
      daysAgo,
      partnerWeight: sortam.trustWeight,
    });

    const slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await prisma.business.upsert({
      where: { sourceId_externalId: { sourceId: sortam.id, externalId: `sortam_${slug}` } },
      create: {
        canonicalName: a.name,
        displayName: a.name,
        slug: `${slug}-${rand(1000, 9999)}`,
        categoryId: category.id,
        sourceId: sortam.id,
        externalId: `sortam_${slug}`,
        phone: a.phone,
        verificationLevel: a.vlevel,
        trustScore: score,
        status: 'ACTIVE',
        locations: {
          create: [{
            address: `${rand(1, 200)} ${pick(['Broad St', 'Allen Ave', 'Adeola Odeku', 'Ahmadu Bello Way', 'Nnamdi Azikiwe St'])}`,
            city: a.city,
            state: a.state,
            country: 'Nigeria',
            isPrimary: true,
          }],
        },
        services: {
          create: [{ name: category.name, description: `Professional ${category.name.toLowerCase()} services`, priceMin: rand(5000, 15000), priceMax: rand(20000, 80000), currency: 'NGN' }],
        },
      },
      update: { trustScore: score, verificationLevel: a.vlevel },
    });
    artisanCount++;
  }
  console.log(`  ✓ ${artisanCount} artisans (SortAm source)`);

  // Healthcare
  let healthCount = 0;
  for (const h of HEALTHCARE) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: h.cat } });
    const rating     = +(3.5 + Math.random() * 1.4).toFixed(1);
    const reviews    = rand(5, 80);
    const bookings   = rand(20, 200);
    const completed  = rand(Math.floor(bookings * 0.85), bookings);
    const daysAgo    = rand(1, 30);
    const score = trustScore({
      verificationLevel: h.vlevel,
      rating,
      reviews,
      verifiedReviews: rand(Math.floor(reviews * 0.3), reviews),
      completedBookings: completed,
      totalBookings: bookings,
      responseHours: pick([1, 2, 4]),
      complaints: rand(0, 3),
      resolvedComplaints: rand(0, 2),
      daysAgo,
      partnerWeight: mediseen.trustWeight,
    });

    const slug = h.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await prisma.business.upsert({
      where: { sourceId_externalId: { sourceId: mediseen.id, externalId: `mediseen_${slug}` } },
      create: {
        canonicalName: h.name,
        displayName: h.name,
        slug: `${slug}-${rand(1000, 9999)}`,
        categoryId: category.id,
        sourceId: mediseen.id,
        externalId: `mediseen_${slug}`,
        phone: h.phone,
        verificationLevel: h.vlevel,
        trustScore: score,
        status: 'ACTIVE',
        locations: {
          create: [{
            address: `${rand(1, 500)} ${pick(['Hospital Road', 'Medical Avenue', 'Health Street', 'Clinic Close'])}`,
            city: h.city,
            state: h.state,
            country: 'Nigeria',
            isPrimary: true,
          }],
        },
        services: {
          create: [{ name: category.name, description: `${category.description}`, priceMin: null, priceMax: null, currency: 'NGN' }],
        },
      },
      update: { trustScore: score, verificationLevel: h.vlevel },
    });
    healthCount++;
  }
  console.log(`  ✓ ${healthCount} healthcare businesses (MediSeen source)`);
  console.log(`\n🎉 Seed complete: ${artisanCount + healthCount} businesses across ${CATEGORIES.length} categories`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
