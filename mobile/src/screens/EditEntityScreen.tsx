import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import theme from '@/theme/theme'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'EditEntity'>

export default function EditEntityScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { token } = useAuth()
  const { entityId } = route.params
  const qc = useQueryClient()

  const { data: entity } = useQuery({
    queryKey: ['entity', entityId],
    queryFn: () => api.places.get(entityId),
  })

  const [phone, setPhone] = useState('')
  const [hours, setHours] = useState('')
  const [website, setWebsite] = useState('')
  const hydrated = useRef(false)

  useEffect(() => {
    if (entity && !hydrated.current) {
      hydrated.current = true
      setPhone(entity.phone ?? '')
      setHours(entity.openingHours ?? '')
      setWebsite(entity.website ?? '')
    }
  }, [entity])

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => api.places.update(entityId, { phone, openingHours: hours, website }, token!),
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
  name: { fontSize: theme.typography.fontSize.md, color: theme.colors.textSecondary, marginBottom: theme.spacing.xl },
})
