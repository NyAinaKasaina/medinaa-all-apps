const BASE = '/api'

export interface MedicalEntity {
  id: string
  osmId: string
  osmType: string
  name?: string
  nameMg?: string
  amenity?: string
  healthcare?: string
  healthFacilityType?: string
  lat?: number
  lng?: number
  phone?: string
  website?: string
  openingHours?: string
  addrStreet?: string
  addrHousenumber?: string
  addrCity?: string
  addrDistrict?: string
  addrProvince?: string
  operator?: string
  operatorType?: string
  beds?: number
  emergency?: boolean
  osmUrl?: string
  tags?: Record<string, string>
  // Taxonomie médicale (réorg 2026-06)
  typeSlug?: string | null
  categorySlug?: string | null
  classificationStatus?: 'osm_auto' | 'verified' | 'unverified'
  // Géographie — codes officiels INSTAT (faritra/distrika/kaominina/fokontany)
  codeFaritra?: string | null
  codeDistrika?: string | null
  codeKaominina?: string | null
  codeFokontany?: string | null
  // Résolu côté détail uniquement (noms administratifs)
  geo?: {
    faritra?: GeoUnit
    distrika?: GeoUnit
    kaominina?: GeoUnit
    fokontany?: GeoUnit
  } | null
  scrapedAt?: string
  createdAt: string
  updatedAt: string
}

export interface MedicalType {
  slug: string
  categorySlug: string
  labelFr: string
  labelMg?: string
  labelEn?: string
  description?: string
  sortOrder: number
}

export interface MedicalCategory {
  slug: string
  labelFr: string
  labelMg?: string
  labelEn?: string
  sortOrder: number
  color?: string
  icon?: string
  types: MedicalType[]
}

// Niveau administratif (faritra/distrika/kaominina) : code officiel + nom
export interface GeoUnit {
  code: string
  nom: string
}

export interface PlaceFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: {
    id: string
    name?: string | null
    categorySlug?: string | null
    typeSlug?: string | null
    phone?: string | null
    openingHours?: string | null
    classificationStatus?: string | null
  }
}
export interface PlacesGeoJSON {
  type: 'FeatureCollection'
  features: PlaceFeature[]
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
  withName: number
  unverified: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  byType: Record<string, number>
  byFaritra: { code: string; nom: string; count: number }[]
  geo: { faritra: number; distrika: number; kaominina: number; fokontany: number }
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
  totalNodes: number
  savedNodes: number
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
    list: (params: { q?: string; category?: string; type?: string; faritra?: string; distrika?: string; kaominina?: string; status?: string; geo?: string; city?: string; page?: number; limit?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.q)          q.set('q',          params.q)
      if (params.category)   q.set('category',   params.category)
      if (params.type)       q.set('type',       params.type)
      if (params.faritra)    q.set('faritra',    params.faritra)
      if (params.distrika)   q.set('distrika',   params.distrika)
      if (params.kaominina)  q.set('kaominina',  params.kaominina)
      if (params.status)     q.set('status',     params.status)
      if (params.geo)        q.set('geo',        params.geo)
      if (params.city)       q.set('city',       params.city)
      if (params.page)       q.set('page',       String(params.page))
      if (params.limit)      q.set('limit',      String(params.limit))
      return request<PlacesResponse>(`${BASE}/places?${q}`)
    },
    stats: () => request<PlacesStats>(`${BASE}/places/stats`),
    geojson: (category?: string) => request<PlacesGeoJSON>(`${BASE}/places/geojson${category ? `?category=${category}` : ''}`),
    get: (id: string) => request<MedicalEntity>(`${BASE}/places/${id}`),
  },
  taxonomy: {
    tree:  () => request<MedicalCategory[]>(`${BASE}/taxonomy`),
    types: () => request<MedicalType[]>(`${BASE}/taxonomy/types`),
  },
  geo: {
    faritra:   () => request<GeoUnit[]>(`${BASE}/geo/faritra`),
    distrika:  (faritra: string) => request<GeoUnit[]>(`${BASE}/geo/distrika?faritra=${faritra}`),
    kaominina: (distrika: string) => request<GeoUnit[]>(`${BASE}/geo/kaominina?distrika=${distrika}`),
  },
  scraper: {
    status: () => request<{ job: ScrapeJob | null }>(`${BASE}/scraper/status`).then(r => r.job),
    jobs:   () => request<ScrapeJob[]>(`${BASE}/scraper/jobs`),
    start:  () => request<{ job: ScrapeJob; message: string }>(`${BASE}/scraper/start`, { method: 'POST' }),
    pause:  () => request<{ message: string }>(`${BASE}/scraper/pause`, { method: 'POST' }),
  },
  export: {
    jsonUrl: `${BASE}/export/json`,
    csvUrl:  `${BASE}/export/csv`,
  },
}
