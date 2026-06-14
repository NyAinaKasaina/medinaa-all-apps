import React from 'react'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import theme from '@/theme/theme'
import { useTranslation } from 'react-i18next'
import { CATEGORY_STYLE, pickLabel, useTypeLookup } from '@/lib/taxonomy'

interface TypeConfig { labelKey: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }

// Repli pour les entités encore non classifiées (tags OSM bruts).
const TYPE_CONFIG: Record<string, TypeConfig> = {
  hospital:     { labelKey: 'categories.hospital',  color: '#dc2626', bg: '#fef2f2', icon: 'medkit' },
  pharmacy:     { labelKey: 'categories.pharmacy',  color: '#059669', bg: '#ecfdf5', icon: 'medical' },
  clinic:       { labelKey: 'categories.clinic',    color: '#2563eb', bg: '#eff6ff', icon: 'business' },
  doctors:      { labelKey: 'categories.doctor',    color: '#7c3aed', bg: '#f5f3ff', icon: 'person' },
  doctor:       { labelKey: 'categories.doctor',    color: '#7c3aed', bg: '#f5f3ff', icon: 'person' },
  dentist:      { labelKey: 'categories.dentist',   color: '#0891b2', bg: '#ecfeff', icon: 'happy' },
  laboratory:   { labelKey: 'categories.laboratory',color: '#b45309', bg: '#fffbeb', icon: 'flask' },
  health_post:  { labelKey: 'categories.csb',       color: '#047857', bg: '#ecfdf5', icon: 'home' },
  dispensary:   { labelKey: 'categories.csb',       color: '#047857', bg: '#ecfdf5', icon: 'home' },
  nurse:        { labelKey: 'categories.doctor',    color: '#7c3aed', bg: '#f5f3ff', icon: 'person' },
  physiotherapist: { labelKey: 'categories.doctor', color: '#7c3aed', bg: '#f5f3ff', icon: 'person' },
  midwife:      { labelKey: 'categories.doctor',    color: '#db2777', bg: '#fdf2f8', icon: 'person' },
}

const FALLBACK: TypeConfig = { labelKey: 'categories.all', color: theme.colors.textSecondary, bg: theme.colors.surfaceAlt, icon: 'add-circle-outline' }

export function getTypeConfig(type?: string): TypeConfig {
  return (type && TYPE_CONFIG[type]) ? TYPE_CONFIG[type] : FALLBACK
}

type BadgeEntity = { typeSlug?: string | null; categorySlug?: string | null; amenity?: string; healthcare?: string }
interface TypeBadgeProps { entity?: BadgeEntity; style?: ViewStyle }

export default function TypeBadge({ entity, style }: TypeBadgeProps) {
  const { t, i18n } = useTranslation()
  const lookup = useTypeLookup()

  if (entity?.typeSlug) {
    const info = lookup.get(entity.typeSlug)
    const cat = entity.categorySlug ?? info?.categorySlug ?? ''
    const s = CATEGORY_STYLE[cat]
    const color = s?.color ?? FALLBACK.color
    const bg = s?.bg ?? FALLBACK.bg
    const label = info ? pickLabel(info, i18n.language) : entity.typeSlug
    return (
      <View style={[styles.badge, { backgroundColor: bg }, style]}>
        <Ionicons name={s?.icon ?? FALLBACK.icon} size={11} color={color} />
        <Text style={[styles.text, { color }]}>{label}</Text>
      </View>
    )
  }

  const cfg = getTypeConfig(entity?.amenity ?? entity?.healthcare)
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, style]}>
      <Ionicons name={cfg.icon} size={11} color={cfg.color} />
      <Text style={[styles.text, { color: cfg.color }]}>{t(cfg.labelKey)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: theme.spacing.sm, paddingVertical: 3, borderRadius: theme.radius.full, alignSelf: 'flex-start' },
  text: { fontSize: theme.typography.fontSize.xs, fontWeight: theme.typography.fontWeight.semibold },
})
