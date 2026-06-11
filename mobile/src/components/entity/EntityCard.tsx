import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import theme from '@/theme/theme'
import Card from '@/components/ui/Card'
import TypeBadge from './TypeBadge'
import { MedicalEntity } from '@/lib/api'
import { useCoords } from '@/context/LocationContext'

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface EntityCardProps { entity: MedicalEntity; onPress: () => void; compact?: boolean }

export default function EntityCard({ entity, onPress, compact = false }: EntityCardProps) {
  const { t } = useTranslation()
  const userCoords = useCoords()
  const type = entity.amenity ?? entity.healthcare
  const displayName = entity.name ?? '(Sans nom)'
  const dist = entity.lat != null && entity.lng != null
    ? calcDistance(userCoords.latitude, userCoords.longitude, entity.lat, entity.lng)
    : null

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
      <Card style={[styles.card, compact && styles.compact]}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
            <TypeBadge type={type} style={{ marginVertical: theme.spacing.xs }} />
            {entity.addrCity && <Text style={styles.sub} numberOfLines={1}>{entity.addrCity}</Text>}
          </View>
          <View style={styles.right}>
            {dist !== null && (
              <Text style={styles.dist}>{dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} ${t('common.km')}`}</Text>
            )}
            {entity.emergency && <Ionicons name="flash" size={14} color={theme.colors.error} />}
            {entity.ownerId && <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />}
          </View>
        </View>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: theme.spacing.sm },
  compact: { padding: theme.spacing.sm, marginBottom: theme.spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  info: { flex: 1, marginRight: theme.spacing.sm },
  name: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text },
  sub: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  right: { alignItems: 'flex-end', gap: theme.spacing.xs },
  dist: { fontSize: theme.typography.fontSize.sm, color: theme.colors.primary, fontWeight: theme.typography.fontWeight.medium },
})
