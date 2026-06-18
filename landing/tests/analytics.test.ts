import { describe, it, expect, vi } from 'vitest';
import { buildEvent, track } from '@/lib/analytics';

describe('buildEvent', () => {
  it('construit un event normalisé', () => {
    const e = buildEvent({ name: 'cta_click', locale: 'fr', path: '/fr', meta: { target: 'web_app' } });
    expect(e).toMatchObject({ name: 'cta_click', locale: 'fr', path: '/fr' });
    expect(e.meta).toEqual({ target: 'web_app' });
  });
});

describe('track', () => {
  it('utilise sendBeacon vers /api/track', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { sendBeacon });
    track({ name: 'pageview', locale: 'fr', path: '/fr' });
    expect(sendBeacon).toHaveBeenCalledWith('/api/track', expect.anything());
  });
});
