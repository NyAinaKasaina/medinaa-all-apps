import { describe, it, expect, vi, afterEach } from 'vitest';
import { getStats, FALLBACK_STATS } from '@/lib/stats';

afterEach(() => vi.restoreAllMocks());

describe('getStats', () => {
  it('fusionne la réponse backend avec le fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ total: 2500, withPhone: 800 }),
      }),
    );
    const s = await getStats('http://backend');
    expect(s.total).toBe(2500);
    expect(s.withPhone).toBe(800);
    expect(s.byType).toEqual(FALLBACK_STATS.byType); // champ absent => fallback
  });

  it('renvoie le fallback si le backend répond en erreur HTTP', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );
    const s = await getStats('http://backend');
    expect(s).toEqual(FALLBACK_STATS);
  });

  it('renvoie le fallback si la requête échoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    const s = await getStats('http://backend');
    expect(s).toEqual(FALLBACK_STATS);
  });

  it("renvoie le fallback si pas d'URL", async () => {
    const s = await getStats('');
    expect(s).toEqual(FALLBACK_STATS);
  });
});
