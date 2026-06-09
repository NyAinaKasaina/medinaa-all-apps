import React from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import theme from '@/theme/theme'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import TypeBadge from '@/components/entity/TypeBadge'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'Claim'>

export default function ClaimScreen() {
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

  const { mutate: claim, isPending } = useMutation({
    mutationFn: () => api.places.claim(entityId, token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity', entityId] })
      qc.invalidateQueries({ queryKey: ['myPlaces'] })
      navigation.navigate('EditEntity', { entityId })
    },
  })

  if (!entity) return null

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('claim.title')}</Text>
        <Text style={styles.desc}>{t('claim.description')}</Text>

        <Card style={styles.entityCard}>
          <Text style={styles.entityName}>{entity.name ?? '(Sans nom)'}</Text>
          <TypeBadge type={entity.amenity ?? entity.healthcare} style={{ marginTop: theme.spacing.xs }} />
          {entity.addrCity && <Text style={styles.entityCity}>{entity.addrCity}</Text>}
        </Card>

        {!token ? (
          <>
            <Button label={t('profile.login')} onPress={() => navigation.navigate('Login')} fullWidth />
            <Button
              label={t('profile.register')}
              onPress={() => navigation.navigate('Register', { entityId })}
              variant="outline"
              fullWidth
              style={{ marginTop: theme.spacing.sm }}
            />
          </>
        ) : (
          <Button label={t('claim.submit')} onPress={() => claim()} loading={isPending} fullWidth />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.base },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  desc: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  entityCard: { marginBottom: theme.spacing.xl },
  entityName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  entityCity: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
})
