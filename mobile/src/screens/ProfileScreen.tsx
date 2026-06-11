import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import theme from '@/theme/theme'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import EntityCard from '@/components/entity/EntityCard'
import Card from '@/components/ui/Card'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function ProfileScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const { token, user, logout } = useAuth()

  const { data: myPlaces } = useQuery({
    queryKey: ['myPlaces'],
    queryFn: () => api.places.myPlaces(token!),
    enabled: !!token,
  })

  if (!token) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Ionicons name="business" size={64} color={theme.colors.primaryLight} />
            <Text style={styles.heroTitle}>{t('profile.claimProgram')}</Text>
            <Text style={styles.heroDesc}>{t('profile.claimDesc')}</Text>
          </View>
          <Button label={t('profile.login')} onPress={() => navigation.navigate('Login')} fullWidth />
          <Button
            label={t('profile.register')}
            onPress={() => navigation.navigate('Register', {})}
            variant="outline"
            fullWidth
            style={{ marginTop: theme.spacing.sm }}
          />
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.userCard}>
          <Ionicons name="person-circle" size={48} color={theme.colors.primary} />
          <Text style={styles.email}>{user?.email}</Text>
        </Card>

        <Text style={styles.section}>{t('profile.myFacilities')}</Text>
        {(myPlaces ?? []).map(entity => (
          <EntityCard
            key={entity.id}
            entity={entity}
            onPress={() => navigation.navigate('EditEntity', { entityId: entity.id })}
          />
        ))}
        {myPlaces?.length === 0 && <Text style={styles.noFacilities}>{t('profile.noFacilities')}</Text>}
        <Button
          label={t('profile.logout')}
          variant="ghost"
          onPress={logout}
          fullWidth
          style={{ marginTop: theme.spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.base },
  hero: { alignItems: 'center', paddingVertical: theme.spacing['2xl'], gap: theme.spacing.md },
  heroTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  heroDesc: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
  },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.base, marginBottom: theme.spacing.xl },
  email: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text },
  section: { fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  noFacilities: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: theme.spacing.xl },
})
