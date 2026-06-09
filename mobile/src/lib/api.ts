const getBaseUrl = () => process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export interface MedicalEntity {
  id: string; osmId: string; osmType: string; name?: string; nameMg?: string
  amenity?: string; healthcare?: string; healthFacilityType?: string
  lat?: number; lng?: number; phone?: string; website?: string
  openingHours?: string; addrStreet?: string; addrHousenumber?: string
  addrCity?: string; addrDistrict?: string; addrProvince?: string
  operator?: string; operatorType?: string; beds?: number
  emergency?: boolean; osmUrl?: string; tags?: Record<string, string>
  ownerId?: string | null; scrapedAt?: string; createdAt: string; updatedAt: string
}

export interface PlacesResponse { items: MedicalEntity[]; total: number; page: number; limit: number; pages: number }
export interface PlacesStats { total: number; withPhone: number; withWebsite: number; withHours: number; byType: Record<string, number> }
export interface AuthResponse { token: string; user: { id: string; email: string } }

async function request<T>(path: string, init?: RequestInit, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${getBaseUrl()}${path}`, { headers, ...init })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status}: ${body}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : (null as unknown as T)
}

export const api = {
  places: {
    list: (p: { q?: string; type?: string; city?: string; page?: number; limit?: number } = {}) => {
      const qs = new URLSearchParams()
      if (p.q) qs.set('q', p.q); if (p.type) qs.set('type', p.type)
      if (p.city) qs.set('city', p.city); if (p.page !== undefined) qs.set('page', String(p.page))
      if (p.limit !== undefined) qs.set('limit', String(p.limit))
      return request<PlacesResponse>(`/api/places?${qs}`)
    },
    stats: () => request<PlacesStats>('/api/places/stats'),
    get: (id: string) => request<MedicalEntity>(`/api/places/${id}`),
    update: (id: string, data: Partial<MedicalEntity>, token: string) =>
      request<MedicalEntity>(`/api/places/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
    claim: (id: string, token: string) =>
      request<MedicalEntity>(`/api/places/${id}/claim`, { method: 'POST' }, token),
    myPlaces: (token: string) => request<MedicalEntity[]>('/api/me/places', {}, token),
  },
  auth: {
    register: (email: string, password: string, entityId?: string) =>
      request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, entityId }) }),
    login: (email: string, password: string) =>
      request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  },
}
