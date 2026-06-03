export const MADAGASCAR_BBOX = {
  south: -25.6,
  west: 43.2,
  north: -11.9,
  east: 50.5,
} as const;

export const OVERPASS_QUERY = `
[out:json][timeout:180];
(
  node["amenity"~"^(hospital|clinic|pharmacy|doctors|dentist|health_post|health_facility|dispensary|nursing_home|laboratory|blood_bank)$"](${-25.6},${43.2},${-11.9},${50.5});
  way["amenity"~"^(hospital|clinic|pharmacy|doctors|dentist|health_post|health_facility|dispensary|nursing_home|laboratory|blood_bank)$"](${-25.6},${43.2},${-11.9},${50.5});
  relation["amenity"~"^(hospital|clinic|pharmacy|doctors|dentist|health_post|health_facility|dispensary|nursing_home|laboratory|blood_bank)$"](${-25.6},${43.2},${-11.9},${50.5});
  node["healthcare"](${-25.6},${43.2},${-11.9},${50.5});
  way["healthcare"](${-25.6},${43.2},${-11.9},${50.5});
  relation["healthcare"](${-25.6},${43.2},${-11.9},${50.5});
);
out center tags;
`.trim();

export const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
export const BATCH_SIZE = 100;
