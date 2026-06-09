import React, { useState } from 'react'
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import theme from '@/theme/theme'
import { api } from '@/lib/api'
import EntityCard from '@/components/entity/EntityCard'
import Skeleton from '@/components/ui/Skeleton'
import type { RootStackParamList } from '@/navigation/RootNavigator'
import type { MainTabParamList } from '@/navigation/MainTabNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<MainTabParamList, 'Search'>

const TYPE_OPTIONS = ['hospital', 'pharmacy', 'clinic', 'doctors', 'dentist', 'health_post', 'laboratory']

export default function SearchScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const [query, setQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [selectedType, setSelectedType] = useState<string | undefined>(route.params?.type)
  const [emergencyOnly, setEmergencyOnly] = useState(false)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>()

  const handleQueryChange = (text: string) => {
    setQuery(text)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQ(text), 350)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQ, selectedType],
    queryFn: () => api.places.list({ q: debouncedQ || undefined, type: selectedType, limit: 50 }),
    enabled: true,
  })

  const items = emergencyOnly ? (data?.items ?? []).filter(e => e.emergency) : (data?.items ?? [])

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search input */}
      <View style={styles.searchRow}>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleQueryChange}
            placeholder={t('search.placeholder')}
            placeholderTextColor={theme.colors.textDisabled}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); setDebouncedQ('') }}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Type filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Pressable
          onPress={() => setSelectedType(undefined)}
          style={[styles.chip, !selectedType && styles.chipActive]}
        >
          <Text style={[styles.chipText, !selectedType && styles.chipTextActive]}>{t('categories.all')}</Text>
        </Pressable>
        {TYPE_OPTIONS.map(type => (
          <Pressable key={type} onPress={() => setSelectedType(type === selectedType ? undefined : type)}
            style={[styles.chip, selectedType === type && styles.chipActive]}>
            <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>{type}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setEmergencyOnly(v => !v)}
          style={[styles.chip, emergencyOnly && { ...styles.chipActive, backgroundColor: theme.colors.errorBg, borderColor: theme.colors.error }]}>
          <Ionicons name="flash" size={12} color={emergencyOnly ? theme.colors.error : theme.colors.textSecondary} />
          <Text style={[styles.chipText, emergencyOnly && { color: theme.colors.error }]}>{t('search.emergencyOnly')}</Text>
        </Pressable>
      </ScrollView>

      {/* Results count */}
      {data && (
        <Text style={styles.count}>{items.length} {t('search.results')}</Text>
      )}

      {/* Results list */}
      {isLoading
        ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={80} style={styles.skeleton} />)
        : (
          <FlatList
            data={items}
            keyExtractor={e => e.id}
            renderItem={({ item }) => (
              <EntityCard entity={item} onPress={() => navigation.navigate('EntityDetail', { id: item.id })} />
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>{t('common.noResults')}</Text>}
          />
        )
      }
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  searchRow: { padding: theme.spacing.base },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.base, height: 48, ...theme.shadow.sm },
  searchIcon: { marginRight: theme.spacing.sm },
  input: { flex: 1, fontSize: theme.typography.fontSize.md, color: theme.colors.text },
  chips: { paddingHorizontal: theme.spacing.base, gap: theme.spacing.xs, paddingBottom: theme.spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: theme.spacing.md, paddingVertical: 6, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  chipActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  chipText: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  chipTextActive: { color: theme.colors.primaryDark, fontWeight: theme.typography.fontWeight.semibold },
  count: { paddingHorizontal: theme.spacing.base, paddingBottom: theme.spacing.sm, fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  list: { paddingHorizontal: theme.spacing.base, paddingBottom: theme.spacing['3xl'] },
  skeleton: { marginHorizontal: theme.spacing.base, marginBottom: theme.spacing.sm, borderRadius: theme.radius.lg },
  empty: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: theme.spacing['3xl'] },
})
