import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from './api'

// Couleurs de badge par catégorie (6, stables). Les libellés des types viennent de l'API.
export const CATEGORY_CLASSES: Record<string, string> = {
  urgences_secours:   'bg-red-100 text-red-700',
  soins_proximite:    'bg-emerald-100 text-emerald-700',
  soins_specialises:  'bg-violet-100 text-violet-700',
  maternite_enfance:  'bg-pink-100 text-pink-700',
  produits_sante:     'bg-blue-100 text-blue-700',
  diagnostic_analyse: 'bg-amber-100 text-amber-700',
}

export function useTaxonomy() {
  return useQuery({ queryKey: ['taxonomy'], queryFn: api.taxonomy.tree, staleTime: Infinity })
}

export interface TypeInfo { label: string; categorySlug: string }

export function useTypeLookup(): Map<string, TypeInfo> {
  const { data } = useTaxonomy()
  return useMemo(() => {
    const map = new Map<string, TypeInfo>()
    for (const cat of data ?? []) {
      for (const t of cat.types) map.set(t.slug, { label: t.labelFr, categorySlug: cat.slug })
    }
    return map
  }, [data])
}
