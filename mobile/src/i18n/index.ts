import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'
import mg from './locales/mg.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'mg', label: 'Malagasy', flag: '🇲🇬' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
] as const

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code']

i18n
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr }, en: { translation: en }, mg: { translation: mg } },
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  })

export default i18n
