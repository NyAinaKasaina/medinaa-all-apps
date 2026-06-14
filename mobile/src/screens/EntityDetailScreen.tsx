import React from 'react'
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import theme from '@/theme/theme'
import { api } from '@/lib/api'
import TypeBadge from '@/components/entity/TypeBadge'
import MiniMap from '@/components/entity/MiniMap'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'EntityDetail'>

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value?: string | null
}) {
  if (!value) return null
  return (
    <View style={iStyles.row}>
      <Ionicons
        name={icon}
        size={16}
        color={theme.colors.primary}
        style={iStyles.icon}
      />
      <View style={iStyles.col}>
        <Text style={iStyles.label}>{label}</Text>
        <Text style={iStyles.value}>{value}</Text>
      </View>
    </View>
  )
}

const iStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  icon: { marginRight: theme.spacing.sm, marginTop: 2 },
  col: { flex: 1 },
  label: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
  },
})

export default function EntityDetailScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { id } = route.params

  const { data: entity, isLoading } = useQuery({
    queryKey: ['entity', id],
    queryFn: () => api.places.get(id),
  })

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              height={20}
              style={{ marginBottom: theme.spacing.md }}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (!entity) return null

  const displayName = entity.name ?? '(Sans nom)'
  const hasCoords = entity.lat != null && entity.lng != null

  const callPhone = () => {
    if (entity.phone) {
      Linking.openURL(`tel:${entity.phone}`).catch(() => {})
    }
  }

  const openDirections = () => {
    if (!hasCoords) return
    const url = `geo:${entity.lat},${entity.lng}?q=${entity.lat},${entity.lng}(${encodeURIComponent(displayName)})`
    Linking.openURL(url).catch(() => {})
  }

  const openOsm = () => {
    if (entity.osmUrl) {
      Linking.openURL(entity.osmUrl).catch(() => {})
    }
  }

  const address = [
    entity.addrHousenumber,
    entity.addrStreet,
    entity.addrCity,
    entity.addrDistrict,
    entity.addrProvince,
  ]
    .filter(Boolean)
    .join(', ') || null

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.name}>{displayName}</Text>
        <View style={styles.headerRow}>
          <TypeBadge entity={entity} />
          {entity.ownerId && (
            <View style={styles.verifiedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={theme.colors.success}
              />
              <Text style={styles.verifiedText}>{t('common.verified')}</Text>
            </View>
          )}
        </View>

        {entity.emergency && (
          <View style={styles.emergencyBanner}>
            <Ionicons name="flash" size={14} color={theme.colors.error} />
            <Text style={styles.emergencyText}>{t('detail.emergency')}</Text>
          </View>
        )}

        {/* Info rows */}
        <View style={styles.card}>
          <InfoRow
            icon="call-outline"
            label={t('detail.phone')}
            value={entity.phone}
          />
          <InfoRow
            icon="time-outline"
            label={t('detail.hours')}
            value={entity.openingHours}
          />
          <InfoRow
            icon="location-outline"
            label={t('detail.address')}
            value={address}
          />
          <InfoRow
            icon="bed-outline"
            label={t('detail.beds')}
            value={entity.beds ? String(entity.beds) : null}
          />
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {entity.phone && (
            <Pressable onPress={callPhone} style={styles.actionBtn}>
              <Ionicons name="call" size={18} color={theme.colors.primary} />
              <Text style={styles.actionLabel}>{t('detail.phone')}</Text>
            </Pressable>
          )}
          {hasCoords && (
            <Pressable onPress={openDirections} style={styles.actionBtn}>
              <Ionicons
                name="navigate"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.actionLabel}>
                {t('detail.directions')}
              </Text>
            </Pressable>
          )}
          {entity.osmUrl && (
            <Pressable onPress={openOsm} style={styles.actionBtn}>
              <Ionicons
                name="open-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.actionLabel}>OSM</Text>
            </Pressable>
          )}
        </View>

        {/* Claim or verified */}
        {!entity.ownerId && (
          <Button
            label={t('detail.claim')}
            variant="outline"
            fullWidth
            onPress={() =>
              navigation.navigate('Claim', { entityId: entity.id })
            }
            style={{ marginTop: theme.spacing.base }}
          />
        )}

        {/* MiniMap */}
        {hasCoords ? (
          <MiniMap lat={entity.lat!} lng={entity.lng!} name={displayName} />
        ) : (
          <Text style={styles.noCoords}>{t('detail.noCoords')}</Text>
        )}

        <View style={{ height: theme.spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.base },
  name: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.base,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.base,
  },
  emergencyText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.base,
    ...theme.shadow.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.base,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
  },
  actionLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primaryDark,
    fontWeight: theme.typography.fontWeight.medium,
  },
  noCoords: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.base,
  },
})
