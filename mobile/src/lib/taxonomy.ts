import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api, type MedicalType } from './api'

type IconName = keyof typeof Ionicons.glyphMap

// Style de badge/icône par catégorie (6, stable). Les libellés viennent de l'API.
export const CATEGORY_STYLE: Record<string, { color: string; bg: string; icon: IconName }> = {
  urgences_secours:   { color: '#dc2626', bg: '#fef2f2', icon: 'medkit' },
  soins_proximite:    { color: '#059669', bg: '#ecfdf5', icon: 'medical' },
  soins_specialises:  { color: '#7c3aed', bg: '#f5f3ff', icon: 'fitness' },
  maternite_enfance:  { color: '#db2777', bg: '#fdf2f8', icon: 'heart' },
  produits_sante:     { color: '#2563eb', bg: '#eff6ff', icon: 'bandage' },
  diagnostic_analyse: { color: '#d97706', bg: '#fffbeb', icon: 'flask' },
}

export function pickLabel(obj: { labelFr: string; labelMg?: string; labelEn?: string }, lang: string): string {
  if (lang.startsWith('mg') && obj.labelMg) return obj.labelMg
  if (lang.startsWith('en') && obj.labelEn) return obj.labelEn
  return obj.labelFr
}

export function useTaxonomy() {
  return useQuery({ queryKey: ['taxonomy'], queryFn: api.taxonomy.tree, staleTime: Infinity })
}

export interface TypeInfo extends MedicalType { categorySlug: string }

export function useTypeLookup(): Map<string, TypeInfo> {
  const { data } = useTaxonomy()
  return useMemo(() => {
    const map = new Map<string, TypeInfo>()
    for (const cat of data ?? []) {
      for (const t of cat.types) map.set(t.slug, { ...t, categorySlug: cat.slug })
    }
    return map
  }, [data])
}
