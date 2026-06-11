import React from 'react'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import theme from '@/theme/theme'
import { useTranslation } from 'react-i18next'

interface TypeConfig { labelKey: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }

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

interface TypeBadgeProps { type?: string; style?: ViewStyle }

export default function TypeBadge({ type, style }: TypeBadgeProps) {
  const { t } = useTranslation()
  const cfg = getTypeConfig(type)
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
