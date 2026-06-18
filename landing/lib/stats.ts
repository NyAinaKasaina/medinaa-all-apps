export interface MedinaaStats {
  total: number;
  byType: Record<string, number>;
  withPhone: number;
  withHours: number;
  cities: number;
}

export const FALLBACK_STATS: MedinaaStats = {
  total: 2173,
  byType: {
    hospital: 320,
    pharmacy: 540,
    doctors: 410,
    clinic: 180,
    dentist: 90,
    health_post: 260,
    dispensary: 173,
  },
  withPhone: 610,
  withHours: 430,
  cities: 220,
};

export async function getStats(
  backendUrl: string = process.env.BACKEND_API_URL ?? '',
): Promise<MedinaaStats> {
  if (!backendUrl) return FALLBACK_STATS;
  try {
    const res = await fetch(`${backendUrl}/api/places/stats`, {
      next: { revalidate: 86400 },
    } as RequestInit);
    if (!res.ok) return FALLBACK_STATS;
    const data = await res.json();
    return { ...FALLBACK_STATS, ...data };
  } catch {
    return FALLBACK_STATS;
  }
}
