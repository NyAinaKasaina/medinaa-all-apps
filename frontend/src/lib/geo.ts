import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from './api'

// Distance à vol d'oiseau en km.
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371, r = Math.PI / 180
  const dLat = (bLat - aLat) * r, dLng = (bLng - aLng) * r
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// Présentation des noms officiels (MAJUSCULES, underscores) en libellé lisible.
export function prettyGeo(nom?: string | null): string {
  if (!nom) return ''
  return nom
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|[\s'-])([a-zà-ÿ])/g, (_, sep, c) => sep + c.toUpperCase())
}

export function useFaritra() {
  return useQuery({ queryKey: ['faritra'], queryFn: api.geo.faritra, staleTime: Infinity })
}

// Map code_faritra -> nom, pour afficher la région sans requête par carte.
export function useFaritraLabel(): Map<string, string> {
  const { data } = useFaritra()
  return useMemo(() => {
    const map = new Map<string, string>()
    for (const f of data ?? []) map.set(f.code, f.nom)
    return map
  }, [data])
}
