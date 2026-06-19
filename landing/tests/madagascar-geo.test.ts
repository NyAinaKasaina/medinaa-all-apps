import { describe, it, expect } from 'vitest';
import { REGIONS, LOCATION_SUGGESTIONS } from '@/lib/madagascar-geo';

describe('madagascar-geo data', () => {
  it('contient 24 régions', () => {
    expect(REGIONS).toHaveLength(24);
  });

  it('contient 114 districts au total', () => {
    const total = REGIONS.reduce((acc, r) => acc + r.districts.length, 0);
    expect(total).toBe(114);
  });

  it('place chaque centroïde dans le viewBox 0..1024', () => {
    for (const r of REGIONS) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x).toBeLessThanOrEqual(1024);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeLessThanOrEqual(1024);
    }
  });

  it('liste les 24 régions puis les 114 districts dans les suggestions', () => {
    expect(LOCATION_SUGGESTIONS).toHaveLength(24 + 114);
    expect(LOCATION_SUGGESTIONS.slice(0, 24).every((s) => s.kind === 'region')).toBe(true);
    expect(LOCATION_SUGGESTIONS.filter((s) => s.kind === 'district')).toHaveLength(114);
  });
});
