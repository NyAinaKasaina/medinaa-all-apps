import { SCRAPER_CONFIG } from '../../../common/config/scraper.config';

export interface GridPoint {
  lat: number;
  lon: number;
}

export function generateGrid(): GridPoint[] {
  const { minLat, maxLat, minLon, maxLon } = SCRAPER_CONFIG.BOUNDS;
  const points: GridPoint[] = [];

  for (let lat = minLat; lat <= maxLat + 0.001; lat += SCRAPER_CONFIG.GRID_STEP_LAT) {
    for (let lon = minLon; lon <= maxLon + 0.001; lon += SCRAPER_CONFIG.GRID_STEP_LON) {
      points.push({
        lat: parseFloat(lat.toFixed(4)),
        lon: parseFloat(lon.toFixed(4)),
      });
    }
  }

  return points;
}
