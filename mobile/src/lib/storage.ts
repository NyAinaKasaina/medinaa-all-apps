import AsyncStorage from '@react-native-async-storage/async-storage'

const KEYS = {
  ONBOARDING_DONE: 'onboardingDone',
  LANGUAGE: 'language',
  RECENTLY_VIEWED: 'recentlyViewed',
  AUTH_TOKEN: 'authToken',
} as const

export const storage = {
  getOnboardingDone: () => AsyncStorage.getItem(KEYS.ONBOARDING_DONE).then(v => v === 'true'),
  setOnboardingDone: () => AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true'),
  getLanguage: () => AsyncStorage.getItem(KEYS.LANGUAGE),
  setLanguage: (lang: string) => AsyncStorage.setItem(KEYS.LANGUAGE, lang),
  getRecentlyViewed: async (): Promise<string[]> => {
    const raw = await AsyncStorage.getItem(KEYS.RECENTLY_VIEWED)
    return raw ? JSON.parse(raw) : []
  },
  addRecentlyViewed: async (id: string): Promise<void> => {
    const list = await storage.getRecentlyViewed()
    const updated = [id, ...list.filter(i => i !== id)].slice(0, 10)
    await AsyncStorage.setItem(KEYS.RECENTLY_VIEWED, JSON.stringify(updated))
  },
  getToken: () => AsyncStorage.getItem(KEYS.AUTH_TOKEN),
  setToken: (token: string) => AsyncStorage.setItem(KEYS.AUTH_TOKEN, token),
  clearToken: () => AsyncStorage.removeItem(KEYS.AUTH_TOKEN),
}
