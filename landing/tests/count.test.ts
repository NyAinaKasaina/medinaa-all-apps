import { describe, it, expect } from 'vitest';
import { clamp, easeOutCubic } from '@/lib/count';

describe('count helpers', () => {
  it('clamp borne la valeur', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(42, 0, 100)).toBe(42);
  });
  it('easeOutCubic démarre à 0 et finit à 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});
