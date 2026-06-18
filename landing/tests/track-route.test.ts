import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from '@/app/api/track/route';

afterEach(() => vi.restoreAllMocks());

function req(body: unknown) {
  return new Request('http://localhost/api/track', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/track', () => {
  it('forward vers le backend et renvoie 204', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('BACKEND_API_URL', 'http://backend');
    const res = await POST(req({ name: 'pageview', locale: 'fr', path: '/fr' }));
    expect(res.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://backend/api/analytics/events',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('renvoie 204 même sans backend configuré', async () => {
    vi.stubEnv('BACKEND_API_URL', '');
    const res = await POST(req({ name: 'pageview', locale: 'fr', path: '/fr' }));
    expect(res.status).toBe(204);
  });
});
