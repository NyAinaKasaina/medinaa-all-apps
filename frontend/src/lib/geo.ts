import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from './api'

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
