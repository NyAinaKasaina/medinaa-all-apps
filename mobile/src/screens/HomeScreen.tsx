import React, { useCallback } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { CompositeNavigationProp } from '@react-navigation/native'
import theme from '@/theme/theme'
import { api } from '@/lib/api'
import { useCoords } from '@/context/LocationContext'
import EntityCard from '@/components/entity/EntityCard'
import Skeleton from '@/components/ui/Skeleton'
import type { RootStackParamList } from '@/navigation/RootNavigator'
import type { MainTabParamList } from '@/navigation/MainTabNavigator'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>

const CATEGORIES = [
  { key: 'hospital', icon: 'medkit' as const },
  { key: 'pharmacy', icon: 'medical' as const },
  { key: 'doctor', icon: 'person' as const },
  { key: 'clinic', icon: 'business' as const },
  { key: 'csb', icon: 'home' as const },
  { key: 'dentist', icon: 'happy' as const },
  { key: 'laboratory', icon: 'flask' as const },
  { key: 'emergency', icon: 'flash' as const },
  { key: 'all', icon: 'grid' as const },
]

const OSM_TYPE_MAP: Record<string, string> = {
  hospital: 'hospital',
  pharmacy: 'pharmacy',
  doctor: 'doctors',
  clinic: 'clinic',
  csb: 'health_post',
  dentist: 'dentist',
  laboratory: 'laboratory',
  emergency: 'hospital',
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function HomeScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const userCoords = useCoords()

  const { data, isLoading } = useQuery({
    queryKey: ['places', 'nearby'],
    queryFn: () => api.places.list({ limit: 20 }),
  })

  const nearbyEntities = data?.items
    .filter(e => e.lat != null && e.lng != null)
    .sort((a, b) =>
      calcDistance(userCoords.latitude, userCoords.longitude, a.lat!, a.lng!) -
      calcDistance(userCoords.latitude, userCoords.longitude, b.lat!, b.lng!)
    ).slice(0, 10) ?? []

  const handleCategoryPress = useCallback((key: string) => {
    const type = key === 'all' ? undefined : OSM_TYPE_MAP[key]
    navigation.navigate('Search', { type })
  }, [navigation])

  const goToDetail = useCallback((id: string) => navigation.navigate('EntityDetail', { id }), [navigation])

  const goToMap = useCallback(() => navigation.navigate('Map'), [navigation])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Medinaa</Text>
        </View>

        {/* Search bar (tappable, goes to SearchScreen) */}
        <Pressable onPress={() => navigation.navigate('Search')} style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>{t('home.searchPlaceholder')}</Text>
        </Pressable>

        {/* Categories */}
        <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {CATEGORIES.map(cat => (
            <Pressable key={cat.key} onPress={() => handleCategoryPress(cat.key)} style={styles.catBtn}>
              <View style={styles.catIcon}>
                <Ionicons name={cat.icon} size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.catLabel} numberOfLines={2}>{t(`categories.${cat.key}`)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Nearby */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('home.nearYou')}</Text>
          <Pressable onPress={() => navigation.navigate('Search')}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>

        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={80} style={styles.skeletonCard} />)
          : <View style={styles.nearbyList}>
              {nearbyEntities.map(e => (
                <EntityCard key={e.id} entity={e} onPress={() => goToDetail(e.id)} />
              ))}
            </View>
        }
        <View style={{ height: theme.spacing['3xl'] }} />
      </ScrollView>

      {/* FAB — view on map */}
      <Pressable style={styles.fab} onPress={goToMap}>
        <Ionicons name="map" size={20} color={theme.colors.textOnPrimary} />
        <Text style={styles.fabLabel}>{t('home.viewOnMap')}</Text>
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.base, paddingTop: theme.spacing.base, paddingBottom: theme.spacing.sm },
  headerTitle: { fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.base, paddingVertical: theme.spacing.md, marginHorizontal: theme.spacing.base, marginBottom: theme.spacing.lg, ...theme.shadow.sm },
  searchPlaceholder: { fontSize: theme.typography.fontSize.base, color: theme.colors.textSecondary },
  sectionTitle: { fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, paddingHorizontal: theme.spacing.base, marginBottom: theme.spacing.sm },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: theme.spacing.base, paddingLeft: theme.spacing.base },
  seeAll: { fontSize: theme.typography.fontSize.sm, color: theme.colors.primary, fontWeight: theme.typography.fontWeight.medium },
  categories: { paddingHorizontal: theme.spacing.base, gap: theme.spacing.sm, paddingBottom: theme.spacing.base },
  catBtn: { alignItems: 'center', width: 72 },
  catIcon: { width: 56, height: 56, borderRadius: theme.radius.lg, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xs },
  catLabel: { fontSize: theme.typography.fontSize.xs, color: theme.colors.text, textAlign: 'center' },
  skeletonCard: { marginHorizontal: theme.spacing.base, marginBottom: theme.spacing.sm, borderRadius: theme.radius.lg },
  nearbyList: { paddingHorizontal: theme.spacing.base },
  fab: { position: 'absolute', bottom: theme.spacing.xl, right: theme.spacing.base, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderRadius: theme.radius.full, ...theme.shadow.lg },
  fabLabel: { color: theme.colors.textOnPrimary, fontWeight: theme.typography.fontWeight.semibold, fontSize: theme.typography.fontSize.sm },
})
