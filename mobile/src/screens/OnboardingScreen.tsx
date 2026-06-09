import React, { useState } from 'react'
import { StyleSheet, Text, View, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import * as Location from 'expo-location'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import i18n, { SUPPORTED_LANGUAGES } from '@/i18n/index'
import { storage } from '@/lib/storage'
import Button from '@/components/ui/Button'
import theme from '@/theme/theme'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Step = 'language' | 'location'
type Nav = NativeStackNavigationProp<RootStackParamList>

export default function OnboardingScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const [step, setStep] = useState<Step>('language')
  const [selectedLang, setSelectedLang] = useState('fr')

  const handleLanguageSelect = async (code: string) => {
    setSelectedLang(code)
    await i18n.changeLanguage(code)
    await storage.setLanguage(code)
    setStep('location')
  }

  const handleLocationAllow = async () => {
    await Location.requestForegroundPermissionsAsync()
    await finish()
  }

  const finish = async () => {
    await storage.setOnboardingDone()
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })
  }

  if (step === 'language') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>{t('onboarding.title')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
          <Text style={styles.section}>{t('onboarding.chooseLanguage')}</Text>
          <View style={styles.langList}>
            {SUPPORTED_LANGUAGES.map(lang => (
              <Pressable key={lang.code} onPress={() => handleLanguageSelect(lang.code)}
                style={[styles.langBtn, selectedLang === lang.code && styles.langBtnActive]}>
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langLabel, selectedLang === lang.code && styles.langLabelActive]}>{lang.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.locIcon}>📍</Text>
        <Text style={styles.title}>{t('onboarding.locationTitle')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.locationReason')}</Text>
        <Button label={t('onboarding.allow')} onPress={handleLocationAllow} fullWidth style={{ marginTop: theme.spacing.xl }} />
        <Button label={t('onboarding.skip')} onPress={finish} variant="ghost" fullWidth style={{ marginTop: theme.spacing.sm }} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, padding: theme.spacing['2xl'], justifyContent: 'center' },
  title: { fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.sm },
  subtitle: { fontSize: theme.typography.fontSize.base, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing['2xl'] },
  section: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text, marginBottom: theme.spacing.base },
  langList: { gap: theme.spacing.sm, width: '100%' },
  langBtn: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.base, borderRadius: theme.radius.md, borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: theme.spacing.md },
  langBtnActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  langFlag: { fontSize: 24 },
  langLabel: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.text },
  langLabelActive: { color: theme.colors.primaryDark },
  locIcon: { fontSize: 64, textAlign: 'center', marginBottom: theme.spacing.base },
})
