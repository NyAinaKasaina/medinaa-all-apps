import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import theme from '@/theme/theme'
import { api } from '@/lib/api'
import { useTaxonomy, pickLabel } from '@/lib/taxonomy'
import { useAuth } from '@/context/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'EditEntity'>

export default function EditEntityScreen() {
  const { t, i18n } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { token } = useAuth()
  const { entityId } = route.params
  const qc = useQueryClient()

  const { data: entity } = useQuery({
    queryKey: ['entity', entityId],
    queryFn: () => api.places.get(entityId),
  })
  const { data: taxonomy } = useTaxonomy()

  const [phone, setPhone] = useState('')
  const [hours, setHours] = useState('')
  const [website, setWebsite] = useState('')
  const [typeSlug, setTypeSlug] = useState<string | undefined>()
  const hydrated = useRef(false)

  useEffect(() => {
    if (entity && !hydrated.current) {
      hydrated.current = true
      setPhone(entity.phone ?? '')
      setHours(entity.openingHours ?? '')
      setWebsite(entity.website ?? '')
      setTypeSlug(entity.typeSlug ?? undefined)
    }
  }, [entity])

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => api.places.update(entityId, { phone, openingHours: hours, website, typeSlug }, token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity', entityId] })
      qc.invalidateQueries({ queryKey: ['myPlaces'] })
      Alert.alert(t('common.save'), t('edit.savedSuccessfully'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ])
    },
    onError: (e: unknown) => Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error')),
  })

  if (!entity) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('edit.title')}</Text>
        <Text style={styles.name}>{entity.name ?? '(Sans nom)'}</Text>

        <Text style={styles.fieldLabel}>{t('edit.type', { defaultValue: "Type d'établissement" })}</Text>
        {(taxonomy ?? []).map(cat => (
          <View key={cat.slug} style={styles.typeGroup}>
            <Text style={styles.typeCat}>{pickLabel(cat, i18n.language)}</Text>
            <View style={styles.typeChips}>
              {cat.types.map(tp => (
                <Pressable
                  key={tp.slug}
                  onPress={() => setTypeSlug(tp.slug)}
                  style={[styles.typeChip, typeSlug === tp.slug && styles.typeChipActive]}
                >
                  <Text style={[styles.typeChipText, typeSlug === tp.slug && styles.typeChipTextActive]}>
                    {pickLabel(tp, i18n.language)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Input label={t('edit.phone')} value={phone} onChangeText={setPhone}
          keyboardType="phone-pad" placeholder="+261 20 22 123 45" />
        <Input label={t('edit.hours')} value={hours} onChangeText={setHours}
          placeholder="Mo-Fr 08:00-17:00" autoCapitalize="none" />
        <Input label={t('edit.website')} value={website} onChangeText={setWebsite}
          keyboardType="url" autoCapitalize="none" placeholder="https://…" />

        <Button label={t('common.save')} onPress={() => save()} loading={isPending} fullWidth
          style={{ marginTop: theme.spacing.base }} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => navigation.goBack()}
          fullWidth style={{ marginTop: theme.spacing.sm }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.base },
  loader: { flex: 1 },
  title: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.xs },
  name: { fontSize: theme.typography.fontSize.md, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  fieldLabel: { fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.text, marginBottom: theme.spacing.sm },
  typeGroup: { marginBottom: theme.spacing.md },
  typeCat: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs },
  typeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  typeChip: { paddingHorizontal: theme.spacing.md, paddingVertical: 6, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  typeChipActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  typeChipText: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary },
  typeChipTextActive: { color: theme.colors.primaryDark, fontWeight: theme.typography.fontWeight.semibold },
})
