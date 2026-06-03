const BASE = '/api'

export interface MedicalEntity {
  id: string
  placeId: string
  name: string
  formattedAddress?: string
  phoneNumber?: string
  internationalPhoneNumber?: string
  website?: string
  rating?: number
  userRatingsTotal?: number
  types?: string[]
  lat?: number
  lng?: number
  vicinity?: string
  googleMapsUrl?: string
  businessStatus?: string
  openingHours?: { open_now?: boolean; weekday_text?: string[] }
  scrapedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PlacesResponse {
  items: MedicalEntity[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface PlacesStats {
  total: number
  withPhone: number
  withWebsite: number
  withHours: number
  byType: Record<string, number>
}

export interface ScrapeError {
  id: string
  queryKey: string
  error: string
  occurredAt: string
}

export interface ScrapeJob {
  id: string
  status: 'pending' | 'running' | 'paused' | 'done' | 'failed'
  phase: number
  totalQueries: number
  processedQueriesCount: number
  collectedPlaceIdsCount: number
  enrichedPlaceIdsCount: number
  startedAt?: string
  lastUpdatedAt?: string
  createdAt: string
  errors?: ScrapeError[]
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}${body ? ': ' + body : ''}`)
  }
  const text = await res.text()
  if (!text) return null as T
  return JSON.parse(text) as T
}

export const api = {
  places: {
    list: (params: { q?: string; type?: string; status?: string; page?: number; limit?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.q) q.set('q', params.q)
      if (params.type) q.set('type', params.type)
      if (params.status) q.set('status', params.status)
      if (params.page) q.set('page', String(params.page))
      if (params.limit) q.set('limit', String(params.limit))
      return request<PlacesResponse>(`${BASE}/places?${q}`)
    },
    stats: () => request<PlacesStats>(`${BASE}/places/stats`),
    get: (id: string) => request<MedicalEntity>(`${BASE}/places/${id}`),
  },
  scraper: {
    status: () => request<{ job: ScrapeJob | null }>(`${BASE}/scraper/status`).then(r => r.job),
    jobs: () => request<ScrapeJob[]>(`${BASE}/scraper/jobs`),
    start: () => request<{ job: ScrapeJob; message: string }>(`${BASE}/scraper/start`, { method: 'POST' }),
    pause: () => request<{ message: string }>(`${BASE}/scraper/pause`, { method: 'POST' }),
  },
  export: {
    jsonUrl: `${BASE}/export/json`,
    csvUrl: `${BASE}/export/csv`,
  },
}
