import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'

export const SUPPORTED_LOCALES = ['en', 'fr'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const STORAGE_KEY = 'recipes-m.locale'

function detectInitialLocale(): SupportedLocale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
    return stored as SupportedLocale
  }
  const browserLang = navigator.language.slice(0, 2)
  return (SUPPORTED_LOCALES as readonly string[]).includes(browserLang)
    ? (browserLang as SupportedLocale)
    : 'en'
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: detectInitialLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
})

export default i18n
