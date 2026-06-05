import { IngestCity } from './types';

export const COVERAGE_CITIES: IngestCity[] = [
  // Nigeria
  { name: 'Lagos', country: 'NG', countryName: 'Nigeria', lat: 6.5244, lng: 3.3792, radiusKm: 25, state: 'Lagos' },
  { name: 'Abuja', country: 'NG', countryName: 'Nigeria', lat: 9.0579, lng: 7.4951, radiusKm: 20, state: 'FCT' },
  { name: 'Port Harcourt', country: 'NG', countryName: 'Nigeria', lat: 4.8156, lng: 7.0498, radiusKm: 15, state: 'Rivers' },
  { name: 'Kano', country: 'NG', countryName: 'Nigeria', lat: 12.0022, lng: 8.5920, radiusKm: 15, state: 'Kano' },
  { name: 'Ibadan', country: 'NG', countryName: 'Nigeria', lat: 7.3775, lng: 3.9470, radiusKm: 15, state: 'Oyo' },
  // Ghana
  { name: 'Accra', country: 'GH', countryName: 'Ghana', lat: 5.6037, lng: -0.1870, radiusKm: 20, state: 'Greater Accra' },
  { name: 'Kumasi', country: 'GH', countryName: 'Ghana', lat: 6.6885, lng: -1.6244, radiusKm: 15, state: 'Ashanti' },
  // Kenya
  { name: 'Nairobi', country: 'KE', countryName: 'Kenya', lat: -1.2921, lng: 36.8219, radiusKm: 25, state: 'Nairobi' },
  { name: 'Mombasa', country: 'KE', countryName: 'Kenya', lat: -4.0435, lng: 39.6682, radiusKm: 15, state: 'Mombasa' },
  // South Africa
  { name: 'Johannesburg', country: 'ZA', countryName: 'South Africa', lat: -26.2041, lng: 28.0473, radiusKm: 30, state: 'Gauteng' },
  { name: 'Cape Town', country: 'ZA', countryName: 'South Africa', lat: -33.9249, lng: 18.4241, radiusKm: 25, state: 'Western Cape' },
  { name: 'Durban', country: 'ZA', countryName: 'South Africa', lat: -29.8587, lng: 31.0218, radiusKm: 20, state: 'KwaZulu-Natal' },
  // Egypt
  { name: 'Cairo', country: 'EG', countryName: 'Egypt', lat: 30.0444, lng: 31.2357, radiusKm: 30, state: 'Cairo' },
  { name: 'Alexandria', country: 'EG', countryName: 'Egypt', lat: 31.2001, lng: 29.9187, radiusKm: 20, state: 'Alexandria' },
  // Ethiopia
  { name: 'Addis Ababa', country: 'ET', countryName: 'Ethiopia', lat: 9.0320, lng: 38.7469, radiusKm: 25, state: 'Addis Ababa' },
  // Tanzania
  { name: 'Dar es Salaam', country: 'TZ', countryName: 'Tanzania', lat: -6.7924, lng: 39.2083, radiusKm: 20, state: 'Dar es Salaam' },
];

export const INGEST_CATEGORIES: string[] = [
  'healthcare',
  'artisan',
  'education',
  'logistics',
  'food',
  'retail',
  'professional',
  'finance',
  'estate',
];
