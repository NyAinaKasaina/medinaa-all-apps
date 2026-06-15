import { useRef, useEffect, useState, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import { useQuery } from '@tanstack/react-query'
import { Crosshair, Navigation, MapPin, X } from 'lucide-react'
import { api, type PlaceFeature } from '@/lib/api'
import { useTaxonomy } from '@/lib/taxonomy'
import { haversineKm } from '@/lib/geo'
import { isOpenNow, openingStatus } from '@/lib/openingHours'
import { cn } from '@/lib/utils'
import { EntityModal } from '@/components/map/EntityModal'

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
  // On ne pré-juge plus WebGL : on tente toujours l'init et on capture la VRAIE erreur
  // (contexte WebGL, tuiles, style…) au lieu de l'avaler derrière un message générique.
  const [mapError, setMapError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0) // incrémenté par « Réessayer » -> nouvelle tentative d'init

  const [category, setCategory] = useState('produits_sante')
  const [radiusKm, setRadiusKm] = useState(5)
  const [openOnly, setOpenOnly] = useState(false)
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null) // origine [lng, lat]
  const [originSource, setOriginSource] = useState<'geo' | 'custom' | null>(null)
  const [pickingOrigin, setPickingOrigin] = useState(false) // mode « cliquer la carte pour poser le départ »
  const [geoError, setGeoError] = useState<string | null>(null)
  const [selected, setSelected] = useState<PlaceFeature | null>(null) // entité active (détail + itinéraire)
  const [detailOpen, setDetailOpen] = useState(false) // visibilité de la modale de détail
  const [route, setRoute] = useState<{ km: number; min: number } | null>(null)
  const [roadDist, setRoadDist] = useState<Map<string, { km: number; min: number }>>(new Map())

  const originMarkerRef = useRef<maplibregl.Marker | null>(null)
  const originAddedRef = useRef(false) // le Marker est-il attaché à la carte ?
  const pickingRef = useRef(false) // miroir de pickingOrigin, lisible dans les handlers natifs figés

  const { data: taxonomy } = useTaxonomy()
  const { data: geo } = useQuery({
    queryKey: ['geojson', category],
    queryFn: () => api.places.geojson(category || undefined),
    staleTime: 60_000,
  })

  useEffect(() => { pickingRef.current = pickingOrigin }, [pickingOrigin])

  // ---- init carte ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({ container: containerRef.current, style: STYLE, center: CENTER, zoom: 11 })
    } catch (e: any) {
      console.error('[Carte] Échec de création de MapLibre :', e)
      setMapError(e?.message ? String(e.message) : 'Échec de création de la carte (WebGL indisponible ?)')
      return
    }
    mapRef.current = map
    // Les erreurs MapLibre (création du contexte WebGL, tuiles, style) remontent en ASYNCHRONE ici.
    // On les loggue toutes ; une erreur fatale de contexte WebGL bascule sur le repli fonctionnel.
    map.on('error', (ev: any) => {
      // Instance déjà retirée (double-montage StrictMode, HMR, « Réessayer ») : une erreur
      // asynchrone tardive (perte de contexte WebGL au remove()) ne doit PAS toucher l'état
      // ni mapRef, sinon elle annule la carte vivante et affiche le repli à tort.
      if (mapRef.current !== map) return
      const msg = String(ev?.error?.message ?? ev?.error ?? ev?.message ?? 'Erreur MapLibre inconnue')
      console.error('[Carte] Erreur MapLibre :', msg, ev)
      if (/webgl|context lost|failed to initialize/i.test(msg)) {
        setMapError(msg)
        setReady(false)
        try { map.remove() } catch { /* déjà retiré */ }
        mapRef.current = null
      }
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    // Le conteneur peut ne pas avoir sa taille finale au montage (lazy-load, layout) -> resize.
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)
    map.on('load', () => {
      map.addSource('places', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, cluster: true, clusterRadius: 50, clusterMaxZoom: 13 })
      map.addLayer({ id: 'clusters', type: 'circle', source: 'places', filter: ['has', 'point_count'], paint: { 'circle-color': '#059669', 'circle-opacity': 0.85, 'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 50, 24] } })
      map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'places', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 }, paint: { 'text-color': '#fff' } })
      map.addLayer({ id: 'pts', type: 'circle', source: 'places', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': COLOR_EXPR, 'circle-radius': 6, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } })
      // Source 'me' : seulement le cercle de rayon (polygone). L'origine est un Marker déplaçable.
      map.addSource('me', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'me-radius', type: 'fill', source: 'me', filter: ['==', '$type', 'Polygon'], paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.08 } })
      map.addLayer({ id: 'me-radius-line', type: 'line', source: 'me', filter: ['==', '$type', 'Polygon'], paint: { 'line-color': '#2563eb', 'line-opacity': 0.4, 'line-width': 1.5 } })
      map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.85 } }, 'clusters')
      // Sélection d'entité -> ouvre la modale de détail. Ignoré en mode « choisir un départ ».
      map.on('click', 'pts', (e) => {
        if (pickingRef.current) return
        const f = e.features?.[0]
        if (f) { setSelected(f as unknown as PlaceFeature); setDetailOpen(true) }
      })
      map.on('click', 'clusters', (e) => {
        if (pickingRef.current) return
        const f = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0]
        const src = map.getSource('places') as maplibregl.GeoJSONSource
        src.getClusterExpansionZoom((f.properties as any).cluster_id).then((z) => map.easeTo({ center: (f.geometry as any).coordinates, zoom: z }))
      })
      // Mode « choisir un départ » : un clic sur le FOND (pas sur un point/cluster) pose l'origine.
      map.on('click', (e) => {
        if (!pickingRef.current) return
        if (map.queryRenderedFeatures(e.point, { layers: ['pts', 'clusters'] }).length > 0) return
        setUserLoc([e.lngLat.lng, e.lngLat.lat])
        setOriginSource('custom')
        setPickingOrigin(false)
      })
      map.on('mouseenter', 'pts', () => { if (!pickingRef.current) map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'pts', () => { map.getCanvas().style.cursor = pickingRef.current ? 'crosshair' : '' })
      map.resize()
      setReady(true)
    })
    return () => { ro.disconnect(); try { map.remove() } catch { /* déjà retiré */ }; mapRef.current = null }
  }, [attempt])

  // ---- données points ----
  useEffect(() => {
    if (!ready || !geo) return
    // getSource peut être absent juste après un remount (carte recréée, sources pas encore
    // chargées) : on évite un throw qui ferait tomber l'error boundary et masquerait la carte.
    const src = mapRef.current?.getSource('places') as maplibregl.GeoJSONSource | undefined
    src?.setData(geo as any)
  }, [ready, geo])

  // ---- cercle de rayon autour de l'origine ----
  useEffect(() => {
    if (!ready) return
    const src = mapRef.current?.getSource('me') as maplibregl.GeoJSONSource | undefined
    if (!src) return
    if (!userLoc) { src.setData({ type: 'FeatureCollection', features: [] }); return }
    src.setData({ type: 'FeatureCollection', features: [circle(userLoc[0], userLoc[1], radiusKm)] } as any)
  }, [ready, userLoc, radiusKm])

  // ---- curseur crosshair en mode « choisir un départ » ----
  useEffect(() => {
    if (!ready) return
    const cv = mapRef.current?.getCanvas()
    if (cv) cv.style.cursor = pickingOrigin ? 'crosshair' : ''
  }, [ready, pickingOrigin])

  // ---- marqueur d'origine : créé une seule fois, draggable ----
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const m = new maplibregl.Marker({ color: '#2563eb', draggable: true })
    m.on('dragend', () => {
      const { lng, lat } = m.getLngLat()
      setUserLoc([lng, lat])
      setOriginSource('custom')
    })
    originMarkerRef.current = m
    return () => { m.remove(); originMarkerRef.current = null; originAddedRef.current = false }
  }, [ready])

  // ---- position du marqueur d'origine (sync sans le recréer) ----
  useEffect(() => {
    const marker = originMarkerRef.current
    if (!ready || !marker || !mapRef.current) return
    if (userLoc) {
      marker.setLngLat(userLoc)
      if (!originAddedRef.current) { marker.addTo(mapRef.current); originAddedRef.current = true }
    } else if (originAddedRef.current) {
      marker.remove(); originAddedRef.current = false
    }
  }, [ready, userLoc])

  // ---- Échap pour quitter le mode « choisir un départ » ----
  useEffect(() => {
    if (!pickingOrigin) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPickingOrigin(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [pickingOrigin])

  function locate() {
    if (!navigator.geolocation) { setGeoError('Géolocalisation non supportée par ce navigateur'); return }
    setGeoError('Localisation en cours…')
    navigator.geolocation.getCurrentPosition(
      (p) => { const ll: [number, number] = [p.coords.longitude, p.coords.latitude]; setGeoError(null); setUserLoc(ll); setOriginSource('geo'); mapRef.current?.flyTo({ center: ll, zoom: 13 }) },
      (err) => {
        const msg = err.code === err.PERMISSION_DENIED
          ? "Localisation bloquée. Clique l'icône à gauche de l'URL, puis autorise « Localisation » (fonctionne sur localhost, pas sur une IP réseau)."
          : err.code === err.POSITION_UNAVAILABLE
            ? 'Position indisponible. Vérifie que la localisation est activée dans ton système.'
            : 'Délai de localisation dépassé. Réessaie.'
        setGeoError(msg)
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 60_000 },
    )
  }

  function resetOrigin() {
    setUserLoc(null); setOriginSource(null); setPickingOrigin(false)
    setSelected(null); setDetailOpen(false); setRoute(null)
    ;(mapRef.current?.getSource('route') as maplibregl.GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: [] } as any)
  }

  function clearRoute() {
    setSelected(null); setDetailOpen(false); setRoute(null)
    ;(mapRef.current?.getSource('route') as maplibregl.GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: [] } as any)
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

  // Trace l'itinéraire origine -> entité (SANS recadrer la vue : utilisé aussi au re-calcul).
  async function traceRoute(f: PlaceFeature): Promise<[number, number] | null> {
    if (!userLoc) return null
    const [dlng, dlat] = f.geometry.coordinates
    try {
      const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLoc[0]},${userLoc[1]};${dlng},${dlat}?overview=full&geometries=geojson`)
      const j = await r.json()
      const rt = j.routes?.[0]
      if (rt) {
        ;(mapRef.current?.getSource('route') as maplibregl.GeoJSONSource | undefined)?.setData({ type: 'Feature', geometry: rt.geometry, properties: {} } as any)
        setRoute({ km: rt.distance / 1000, min: rt.duration / 60 })
        return [dlng, dlat]
      }
    } catch { setRoute(null) }
    return null
  }

  // Trace + recadre sur l'itinéraire (action explicite « Itinéraire »).
  async function goTo(f: PlaceFeature) {
    setSelected(f)
    const dest = await traceRoute(f)
    if (dest && userLoc && mapRef.current) {
      const b = new maplibregl.LngLatBounds(userLoc, userLoc).extend(dest)
      mapRef.current.fitBounds(b, { padding: 80, maxZoom: 15 })
    }
  }

  // ---- re-trace l'itinéraire de la sélection quand l'origine change (déplacement / nouvelle origine) ----
  useEffect(() => {
    if (!ready || !selected || !userLoc) return
    traceRoute(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoc])

  const gmaps = (f: PlaceFeature) => `https://www.google.com/maps/dir/?api=1&destination=${f.geometry.coordinates[1]},${f.geometry.coordinates[0]}&travelmode=driving`
  const typeLabel = (slug?: string | null) => taxonomy?.flatMap((c) => c.types).find((t) => t.slug === slug)?.labelFr ?? slug ?? ''

  function openDetail(f: PlaceFeature) { setSelected(f); setDetailOpen(true) }

  const selectedStatus = selected ? openingStatus(selected.properties.openingHours) : null

  // ---- Repli si la carte visuelle échoue : "plus proche + itinéraire" reste fonctionnel ----
  const looksWebgl = mapError ? /webgl|context|initialize/i.test(mapError) : false
  if (mapError) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carte</h1>
          <p className="text-slate-500 text-sm mt-1">Trouver l'établissement le plus proche et s'y rendre</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 space-y-2">
          <p>
            {looksWebgl ? (
              <>La carte interactive nécessite <strong>WebGL</strong>, qui n'a pas pu s'initialiser dans ce navigateur. Active l'accélération matérielle (aide en bas).</>
            ) : (
              <>La carte interactive n'a pas pu s'afficher.</>
            )}{' '}En attendant, la recherche du plus proche reste pleinement utilisable ci-dessous.
          </p>
          <p className="font-mono text-[11px] text-amber-700 break-all">Détail : {mapError}</p>
          <button onClick={() => { setMapError(null); setReady(false); setAttempt((a) => a + 1) }} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-amber-700">
            Réessayer d'afficher la carte
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm min-w-[180px]" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Toutes catégories</option>
            {(taxonomy ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.labelFr}</option>)}
          </select>
          <button onClick={locate} className="h-10 rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 flex items-center gap-2 hover:bg-emerald-700">
            <Crosshair className="w-4 h-4" /> Ma position
          </button>
          {userLoc && (
            <label className="flex items-center gap-2 text-sm text-slate-600">Rayon
              <input type="range" min={1} max={20} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="accent-emerald-600" />
              <span className="font-semibold text-slate-700 w-12">{radiusKm} km</span>
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="accent-emerald-600" /> Ouvert maintenant
          </label>
        </div>
        {geoError && <p className="text-xs text-red-600">{geoError}</p>}
        {!userLoc ? (
          <p className="text-sm text-slate-400">Clique « Ma position » pour classer les établissements du plus proche au plus loin (par la route).</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {ranked.slice(0, 30).map((r, i) => (
              <div key={r.f.properties.id} className={cn('rounded-xl border p-3', i === 0 ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-900 truncate">{r.f.properties.name ?? '(Sans nom)'}</span>
                  <span className="text-xs text-emerald-700 font-semibold whitespace-nowrap">{r.road ? `${r.road.km.toFixed(1)} km` : `~${r.dist!.toFixed(1)} km`}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                  {i === 0 && <span className="font-bold text-emerald-700">LE PLUS PROCHE{r.road ? ' (route)' : ''}</span>}
                  {r.road && <span className="text-slate-400">{Math.round(r.road.min)} min</span>}
                  {r.open === true && <span className="text-emerald-600">Ouvert</span>}
                  {r.open === false && <span className="text-red-500">Fermé</span>}
                  <span className="text-slate-400 truncate">{typeLabel(r.f.properties.typeSlug)}</span>
                </div>
                <a href={gmaps(r.f)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline">
                  <Navigation className="w-3.5 h-3.5" /> Itinéraire (Google Maps)
                </a>
              </div>
            ))}
          </div>
        )}
        {looksWebgl && <details className="text-xs text-slate-500 mt-2">
          <summary className="cursor-pointer font-medium">Comment réactiver WebGL ?</summary>
          <div className="mt-2 space-y-1.5">
            <p><strong>Chrome / Edge</strong> : Paramètres → Système → « Utiliser l'accélération graphique si disponible » → activer, puis redémarrer. Vérifie sur <code>chrome://gpu</code> (WebGL doit être « Hardware accelerated »). Si bloqué : <code>chrome://flags/#ignore-gpu-blocklist</code> → Enabled → relancer.</p>
            <p><strong>Firefox</strong> : <code>about:config</code> → <code>webgl.disabled</code> = false (et <code>webgl.force-enabled</code> = true si besoin).</p>
          </div>
        </details>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Carte</h1>
        <p className="text-slate-500 text-sm mt-1">Trouver l'établissement le plus proche et s'y rendre</p>
      </div>

      <div className="relative w-full h-[calc(100dvh-12rem)] min-h-[460px] rounded-2xl overflow-hidden border border-slate-200">
        {/* Hauteur EXPLICITE (h-full) et non `absolute inset-0` : la feuille MapLibre
            impose `.maplibregl-map { position: relative }` (importée après Tailwind, elle
            écrase `.absolute`), ce qui annulait `inset-0` et effondrait le conteneur à 0px. */}
        <div ref={containerRef} className="h-full w-full" />

        {/* Panneau filtres */}
        <div className="absolute top-3 left-3 z-10 w-64 max-w-[calc(100%-1.5rem)] bg-white rounded-xl shadow-lg border border-slate-200 p-3 space-y-2.5">
          <select className="w-full h-9 rounded-lg border border-slate-200 px-2 text-sm" value={category} onChange={(e) => { setCategory(e.target.value); clearRoute() }}>
            <option value="">Toutes catégories</option>
            {(taxonomy ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.labelFr}</option>)}
          </select>

          <div className="flex gap-2">
            <button onClick={locate} className="flex-1 h-9 rounded-lg bg-emerald-600 text-white text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-700">
              <Crosshair className="w-4 h-4" /> Ma position
            </button>
            <button
              onClick={() => setPickingOrigin((v) => !v)}
              title="Choisir un point de départ sur la carte"
              className={cn('h-9 px-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5', pickingOrigin ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-200 text-slate-700 hover:bg-slate-50')}
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>
          {geoError && <p className="text-xs text-red-600">{geoError}</p>}

          {userLoc && (
            <>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-500">Départ : <span className="font-semibold text-slate-700">{originSource === 'geo' ? 'ma position' : 'point choisi'}</span></span>
                <button onClick={resetOrigin} className="text-slate-400 hover:text-red-600 underline">Réinitialiser</button>
              </div>
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

        {/* Bandeau mode « choisir un départ » */}
        {pickingOrigin && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 rounded-full bg-blue-600 text-white text-xs font-medium px-4 py-2 shadow-lg flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> Clique sur la carte pour poser le départ
            <button onClick={() => setPickingOrigin(false)} aria-label="Annuler" className="ml-1 text-white/80 hover:text-white"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Liste résultats (triée par distance) */}
        {userLoc && ranked.length > 0 && (
          <div className="absolute top-3 right-3 z-10 w-72 max-w-[calc(100%-1.5rem)] max-h-[calc(100%-1.5rem)] overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-200 divide-y divide-slate-100">
            {ranked.slice(0, 30).map((r, i) => (
              <button key={r.f.properties.id} onClick={() => openDetail(r.f)} className={cn('w-full text-left p-3 hover:bg-slate-50', i === 0 && 'bg-emerald-50/60')}>
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

        {/* Badge itinéraire (modale fermée) : rappel distance/temps, rouvrir le détail, effacer */}
        {route && selected && !detailOpen && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white rounded-full shadow-xl border border-slate-200 pl-4 pr-1.5 py-1.5 max-w-[calc(100%-1.5rem)]">
            <button onClick={() => setDetailOpen(true)} className="flex items-center gap-2 min-w-0">
              <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-sm font-medium text-slate-900 truncate">{selected.properties.name ?? '(Sans nom)'}</span>
              <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">{route.km.toFixed(1)} km · {Math.round(route.min)} min</span>
            </button>
            <button onClick={clearRoute} aria-label="Effacer l'itinéraire" className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Modale détail de l'entité */}
        {selected && detailOpen && (
          <EntityModal
            feature={selected}
            typeLabel={typeLabel(selected.properties.typeSlug)}
            statusLabel={selectedStatus?.label ?? null}
            statusOpen={selectedStatus?.open ?? null}
            route={route}
            hasOrigin={!!userLoc}
            onClose={() => setDetailOpen(false)}
            onItinerary={() => { if (selected) goTo(selected); setDetailOpen(false) }}
            onUseMyLocation={locate}
            onPickOnMap={() => { setDetailOpen(false); setPickingOrigin(true) }}
          />
        )}
      </div>
    </div>
  )
}
