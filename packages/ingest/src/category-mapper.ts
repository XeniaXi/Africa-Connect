/**
 * Maps external source type tags to ConnectAfrica category slugs.
 */

const GOOGLE_TYPE_MAP: Record<string, string> = {
  hospital: 'healthcare.hospital',
  doctor: 'healthcare.clinic',
  medical_clinic: 'healthcare.clinic',
  pharmacy: 'healthcare.pharmacy',
  drugstore: 'healthcare.pharmacy',
  dentist: 'healthcare.dentist',
  veterinary_care: 'healthcare.vet',
  electrician: 'artisan.electrician',
  plumber: 'artisan.plumber',
  roofing_contractor: 'artisan.contractor',
  general_contractor: 'artisan.contractor',
  painter: 'artisan.painter',
  car_repair: 'artisan.auto',
  car_wash: 'artisan.auto',
  school: 'education.school',
  primary_school: 'education.school',
  secondary_school: 'education.school',
  university: 'education.university',
  tutoring: 'education.tutoring',
  moving_company: 'logistics.moving',
  storage: 'logistics.moving',
  courier_service: 'logistics.courier',
  taxi_service: 'logistics.transport',
  restaurant: 'food.restaurant',
  food: 'food.restaurant',
  meal_delivery: 'food.restaurant',
  bakery: 'food.bakery',
  cafe: 'food.cafe',
  supermarket: 'retail.grocery',
  grocery_store: 'retail.grocery',
  clothing_store: 'retail.clothing',
  electronics_store: 'retail.electronics',
  bank: 'finance.bank',
  atm: 'finance.atm',
  insurance_agency: 'finance.insurance',
  real_estate_agency: 'estate.property',
  lawyer: 'professional.legal',
  legal: 'professional.legal',
  accounting: 'professional.accounting',
  beauty_salon: 'beauty.salon',
  hair_care: 'beauty.salon',
  gym: 'fitness.gym',
  fitness_center: 'fitness.gym',
};

/**
 * Maps a Google Places `types` array to a ConnectAfrica category slug.
 * Returns the first match found; falls back to 'general'.
 */
export function mapGoogleTypes(types: string[]): string {
  for (const type of types) {
    const mapped = GOOGLE_TYPE_MAP[type];
    if (mapped) return mapped;
  }
  return 'general';
}

/**
 * Maps OSM node tags to a ConnectAfrica category slug.
 */
export function mapOsmTags(tags: Record<string, string>): string {
  const amenity = tags['amenity'];
  const shop = tags['shop'];
  const office = tags['office'];

  if (amenity) {
    switch (amenity) {
      case 'hospital':
        return 'healthcare.hospital';
      case 'clinic':
      case 'doctors':
        return 'healthcare.clinic';
      case 'pharmacy':
        return 'healthcare.pharmacy';
      case 'dentist':
        return 'healthcare.dentist';
      case 'school':
        return 'education.school';
      case 'university':
        return 'education.university';
      case 'bank':
        return 'finance.bank';
      case 'restaurant':
        return 'food.restaurant';
      case 'cafe':
        return 'food.cafe';
      case 'supermarket':
        return 'retail.grocery';
      case 'fuel':
        return 'logistics.fuel';
    }
  }

  if (shop) {
    switch (shop) {
      case 'supermarket':
        return 'retail.grocery';
      case 'clothes':
        return 'retail.clothing';
      case 'electronics':
        return 'retail.electronics';
    }
  }

  if (office) {
    switch (office) {
      case 'lawyer':
        return 'professional.legal';
      case 'accountant':
        return 'professional.accounting';
    }
  }

  return 'general';
}
