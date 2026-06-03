export const SCRAPER_CONFIG = {
  BOUNDS: {
    minLat: -25.6,
    maxLat: -11.9,
    minLon: 43.2,
    maxLon: 50.5,
  },

  GRID_STEP_LAT: 0.36,
  GRID_STEP_LON: 0.38,

  RADIUS_M: 45000,

  PLACE_TYPES: ['hospital', 'pharmacy', 'doctor', 'dentist', 'health'] as const,

  KEYWORDS: ['clinique', 'dispensaire', 'centre de santé', 'CSB', 'cabinet médical'],

  REQUEST_DELAY_MS: 300,
  NEXT_PAGE_DELAY_MS: 2500,
  RETRY_DELAYS_MS: [3000, 7000, 15000] as const,

  DETAILS_FIELDS: [
    'place_id',
    'name',
    'formatted_address',
    'formatted_phone_number',
    'international_phone_number',
    'website',
    'rating',
    'user_ratings_total',
    'types',
    'geometry',
    'vicinity',
    'url',
    'business_status',
    'opening_hours',
  ].join(','),
} as const;

export type PlaceType = (typeof SCRAPER_CONFIG.PLACE_TYPES)[number];
