import { useRef, useEffect, useState, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useQuery } from '@tanstack/react-query'
import { Crosshair, Navigation, ExternalLink, Clock, Phone, X } from 'lucide-react'
import { api, type PlaceFeature } from '@/lib/api'
import { useTaxonomy } from '@/lib/taxonomy'
import { haversineKm } from '@/lib/geo'
import { isOpenNow } from '@/lib/openingHours'
import { cn } from '@/lib/utils'

const STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const CENTER: [number, number] = [47.52, -18.91] // Antananarivo
const CAT_COLOR: Record<string, string> = {
  urgences_secours: '#dc2626', soins_proximite: '#059669', soins_specialises: '#7c3aed',
  maternite_enfance: '#db2777', produits_sante: '#2563eb', diagnostic_analyse: '#d97706',
}
const COLOR_EXPR: any = ['match', ['get', 'categorySlug'],
  ...Object.entries(CAT_COLOR).flat(), '#64748b']

function circle(lng: number, lat: number, km: number, n = 64) {
  const coords: number[][] = []
  const r = km / 111.32
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI
    coords.push([lng + (r * Math.cos(a)) / Math.cos((lat * Math.PI) / 180), lat + r * Math.sin(a)])
  }
  return { type: 'Feature' as const, geometry: { type: 'Polygon' as const, coordinates: [coords] }, properties: {} }
}

export function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [ready, setReady] = useState(false)

  const [category, setCategory] = useState('produits_sante')
  const [radiusKm, setRadiusKm] = useState(5)
  const [openOnly, setOpenOnly] = useState(false)
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null) // [lng, lat]
  const [geoError, setGeoError] = useState<string | null>(null)
  const [selected, setSelected] = useState<PlaceFeature | null>(null)
  const [route, setRoute] = useState<{ km: number; min: number } | null>(null)
  const [roadDist, setRoadDist] = useState<Map<string, { km: number; min: number }>>(new Map())

  const { data: taxonomy } = useTaxonomy()
  const { data: geo } = useQuery({
    queryKey: ['geojson', category],
    queryFn: () => api.places.geojson(category || undefined),
    staleTime: 60_000,
  })

  // ---- init carte ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({ container: containerRef.current, style: STYLE, center: CENTER, zoom: 11 })
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = map
    // Le conteneur peut ne pas avoir sa taille finale au montage (lazy-load, layout) -> resize.
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)
    map.on('load', () => {
      map.addSource('places', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, cluster: true, clusterRadius: 50, clusterMaxZoom: 13 })
      map.addLayer({ id: 'clusters', type: 'circle', source: 'places', filter: ['has', 'point_count'], paint: { 'circle-color': '#059669', 'circle-opacity': 0.85, 'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 50, 24] } })
      map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'places', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 }, paint: { 'text-color': '#fff' } })
      map.addLayer({ id: 'pts', type: 'circle', source: 'places', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': COLOR_EXPR, 'circle-radius': 6, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } })
      map.addSource('me', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'me-radius', type: 'fill', source: 'me', filter: ['==', '$type', 'Polygon'], paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.08 } })
      map.addLayer({ id: 'me-radius-line', type: 'line', source: 'me', filter: ['==', '$type', 'Polygon'], paint: { 'line-color': '#2563eb', 'line-opacity': 0.4, 'line-width': 1.5 } })
      map.addLayer({ id: 'me-pt', type: 'circle', source: 'me', filter: ['==', '$type', 'Point'], paint: { 'circle-color': '#2563eb', 'circle-radius': 7, 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } })
      map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.85 } }, 'clusters')
      map.on('click', 'pts', (e) => { const f = e.features?.[0]; if (f) setSelected(f as unknown as PlaceFeature) })
      map.on('click', 'clusters', (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0]
        const src = map.getSource('places') as maplibregl.GeoJSONSource
        src.getClusterExpansionZoom((f.properties as any).cluster_id).then((z) => map.easeTo({ center: (f.geometry as any).coordinates, zoom: z }))
      })
      map.on('mouseenter', 'pts', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'pts', () => { map.getCanvas().style.cursor = '' })
      map.resize()
      setReady(true)
    })
    return () => { ro.disconnect(); map.remove(); mapRef.current = null }
  }, [])

  // ---- données points ----
  useEffect(() => {
    if (!ready || !geo) return
    ;(mapRef.current!.getSource('places') as maplibregl.GeoJSONSource).setData(geo as any)
  }, [ready, geo])

  // ---- position utilisateur + cercle de rayon ----
  useEffect(() => {
    if (!ready) return
    const src = mapRef.current!.getSource('me') as maplibregl.GeoJSONSource
    if (!userLoc) { src.setData({ type: 'FeatureCollection', features: [] }); return }
    src.setData({
      type: 'FeatureCollection',
      features: [
        circle(userLoc[0], userLoc[1], radiusKm),
        { type: 'Feature', geometry: { type: 'Point', coordinates: userLoc }, properties: {} },
      ],
    } as any)
  }, [ready, userLoc, radiusKm])

  function locate() {
    if (!navigator.geolocation) { setGeoError('Géolocalisation non supportée'); return }
    navigator.geolocation.getCurrentPosition(
      (p) => { const ll: [number, number] = [p.coords.longitude, p.coords.latitude]; setGeoError(null); setUserLoc(ll); mapRef.current?.flyTo({ center: ll, zoom: 13 }) },
      () => setGeoError('Géolocalisation refusée — autorise-la dans le navigateur'),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  // ---- pré-filtre (vol d'oiseau, gratuit) : rayon + ouvert ----
  const results = useMemo(() => {
    if (!geo) return []
    return geo.features
      .map((f) => {
        const [lng, lat] = f.geometry.coordinates
        const dist = userLoc ? haversineKm(userLoc[1], userLoc[0], lat, lng) : null
        return { f, dist, open: isOpenNow(f.properties.openingHours) }
      })
      .filter((r) => (userLoc ? (r.dist as number) <= radiusKm : true))
      .filter((r) => (openOnly ? r.open === true : true))
      .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0))
  }, [geo, userLoc, radiusKm, openOnly])

  // ---- distance ROUTIÈRE (OSRM Table) sur les meilleurs candidats -> vrai "plus proche par la route" ----
  useEffect(() => {
    if (!userLoc || results.length === 0) { setRoadDist(new Map()); return }
    let cancelled = false
    const cands = results.slice(0, 20)
    const coords = [userLoc, ...cands.map((c) => c.f.geometry.coordinates)].map((c) => `${c[0]},${c[1]}`).join(';')
    fetch(`https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=distance,duration`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || j.code !== 'Ok') return
        const dist: (number | null)[] = j.distances?.[0] ?? []
        const dur: (number | null)[] = j.durations?.[0] ?? []
        const m = new Map<string, { km: number; min: number }>()
        cands.forEach((c, i) => { const d = dist[i + 1]; if (d != null) m.set(c.f.properties.id, { km: d / 1000, min: (dur[i + 1] ?? 0) / 60 }) })
        setRoadDist(m)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [userLoc, results])

  // ---- classement par distance routière (repli vol d'oiseau pour les candidats hors top-20) ----
  const ranked = useMemo(() => {
    return results
      .map((r) => ({ ...r, road: roadDist.get(r.f.properties.id) ?? null }))
      .sort((a, b) => {
        const da = a.road ? a.road.km : (a.dist ?? 0) + 100000
        const db = b.road ? b.road.km : (b.dist ?? 0) + 100000
        return da - db
      })
  }, [results, roadDist])

  async function goTo(f: PlaceFeature) {
    setSelected(f)
    if (!userLoc) return
    const [dlng, dlat] = f.geometry.coordinates
    try {
      const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLoc[0]},${userLoc[1]};${dlng},${dlat}?overview=full&geometries=geojson`)
      const j = await r.json()
      const rt = j.routes?.[0]
      if (rt) {
        ;(mapRef.current!.getSource('route') as maplibregl.GeoJSONSource).setData({ type: 'Feature', geometry: rt.geometry, properties: {} } as any)
        setRoute({ km: rt.distance / 1000, min: rt.duration / 60 })
        const b = new maplibregl.LngLatBounds(userLoc, userLoc).extend([dlng, dlat])
        mapRef.current!.fitBounds(b, { padding: 80, maxZoom: 15 })
      }
    } catch { setRoute(null) }
  }

  const gmaps = (f: PlaceFeature) => `https://www.google.com/maps/dir/?api=1&destination=${f.geometry.coordinates[1]},${f.geometry.coordinates[0]}&travelmode=driving`
  const typeLabel = (slug?: string | null) => taxonomy?.flatMap((c) => c.types).find((t) => t.slug === slug)?.labelFr ?? slug ?? ''

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Carte</h1>
        <p className="text-slate-500 text-sm mt-1">Trouver l'établissement le plus proche et s'y rendre</p>
      </div>

      <div className="relative w-full h-[calc(100dvh-12rem)] min-h-[460px] rounded-2xl overflow-hidden border border-slate-200">
        <div ref={containerRef} className="absolute inset-0" />

        {/* Panneau filtres */}
        <div className="absolute top-3 left-3 z-10 w-64 max-w-[calc(100%-1.5rem)] bg-white rounded-xl shadow-lg border border-slate-200 p-3 space-y-2.5">
          <select className="w-full h-9 rounded-lg border border-slate-200 px-2 text-sm" value={category} onChange={(e) => { setCategory(e.target.value); setRoute(null); setSelected(null) }}>
            <option value="">Toutes catégories</option>
            {(taxonomy ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.labelFr}</option>)}
          </select>

          <button onClick={locate} className="w-full h-9 rounded-lg bg-emerald-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-700">
            <Crosshair className="w-4 h-4" /> Ma position
          </button>
          {geoError && <p className="text-xs text-red-600">{geoError}</p>}

          {userLoc && (
            <>
              <label className="block text-xs text-slate-500">Rayon : <span className="font-semibold text-slate-700">{radiusKm} km</span></label>
              <input type="range" min={1} max={20} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="w-full accent-emerald-600" />
            </>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="accent-emerald-600" />
            Ouvert maintenant
          </label>
          <p className="text-[11px] text-slate-400">{userLoc ? `${results.length} dans ${radiusKm} km` : `${results.length} établissements`}</p>
        </div>

        {/* Liste résultats (triée par distance) */}
        {userLoc && ranked.length > 0 && (
          <div className="absolute top-3 right-3 z-10 w-72 max-w-[calc(100%-1.5rem)] max-h-[calc(100%-1.5rem)] overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-200 divide-y divide-slate-100">
            {ranked.slice(0, 30).map((r, i) => (
              <button key={r.f.properties.id} onClick={() => goTo(r.f)} className={cn('w-full text-left p-3 hover:bg-slate-50', i === 0 && 'bg-emerald-50/60')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-900 truncate">{r.f.properties.name ?? '(Sans nom)'}</span>
                  <span className="text-xs text-emerald-700 font-semibold whitespace-nowrap">
                    {r.road ? `${r.road.km.toFixed(1)} km` : `~${r.dist!.toFixed(1)} km`}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {i === 0 && <span className="text-[10px] font-bold text-emerald-700">LE PLUS PROCHE{r.road ? ' (route)' : ''}</span>}
                  {r.road && <span className="text-[10px] text-slate-400">{Math.round(r.road.min)} min</span>}
                  {r.open === true && <span className="text-[10px] font-medium text-emerald-600">Ouvert</span>}
                  {r.open === false && <span className="text-[10px] font-medium text-red-500">Fermé</span>}
                  <span className="text-[11px] text-slate-400 truncate">{typeLabel(r.f.properties.typeSlug)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Carte détail / itinéraire de la sélection */}
        {selected && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[22rem] max-w-[calc(100%-1.5rem)] bg-white rounded-xl shadow-xl border border-slate-200 p-3">
            <button onClick={() => { setSelected(null); setRoute(null); (mapRef.current?.getSource('route') as maplibregl.GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: [] } as any) }} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            <p className="font-semibold text-slate-900 text-sm pr-5">{selected.properties.name ?? '(Sans nom)'}</p>
            <p className="text-xs text-slate-500">{typeLabel(selected.properties.typeSlug)}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-600">
              {selected.properties.phone && <a href={`tel:${selected.properties.phone}`} className="flex items-center gap-1 text-emerald-700"><Phone className="w-3 h-3" />{selected.properties.phone}</a>}
              {isOpenNow(selected.properties.openingHours) === true && <span className="flex items-center gap-1 text-emerald-600"><Clock className="w-3 h-3" />Ouvert</span>}
              {isOpenNow(selected.properties.openingHours) === false && <span className="flex items-center gap-1 text-red-500"><Clock className="w-3 h-3" />Fermé</span>}
              {route && <span className="text-blue-600 font-medium">{route.km.toFixed(1)} km · {Math.round(route.min)} min</span>}
            </div>
            <div className="flex gap-2 mt-2.5">
              <button onClick={() => goTo(selected)} disabled={!userLoc} className="flex-1 h-9 rounded-lg bg-blue-600 text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 hover:bg-blue-700">
                <Navigation className="w-4 h-4" /> Itinéraire
              </button>
              <a href={gmaps(selected)} target="_blank" rel="noreferrer" className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium flex items-center justify-center gap-1.5 text-slate-700 hover:bg-slate-50">
                <ExternalLink className="w-4 h-4" /> Google Maps
              </a>
            </div>
            {!userLoc && <p className="text-[11px] text-slate-400 mt-1.5">Active « Ma position » pour l'itinéraire dans l'app.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
