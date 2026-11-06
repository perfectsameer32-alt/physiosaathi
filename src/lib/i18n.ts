import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { SupportedLanguage } from '../types';

import en from '../locales/en/translation.json';
import hi from '../locales/hi/translation.json';
import kn from '../locales/kn/translation.json';
import te from '../locales/te/translation.json';
import bn from '../locales/bn/translation.json';

export const LANGUAGE_STORAGE_KEY = 'pysiosaathi_language';

export const SUPPORTED_LANGUAGES: {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  voiceCode: string;
}[] = [
  { code: 'en', name: 'English', nativeName: 'English', voiceCode: 'en-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', voiceCode: 'hi-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', voiceCode: 'kn-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', voiceCode: 'te-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', voiceCode: 'bn-IN' },
];

export const getInitialLanguage = (): SupportedLanguage => {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && (['en', 'hi', 'kn', 'te', 'bn'] as const).includes(saved as SupportedLanguage)) {
      return saved as SupportedLanguage;
    }
  } catch {
    // localStorage might be restricted
  }
  return 'en';
};

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  kn: { translation: kn },
  te: { translation: te },
  bn: { translation: bn },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safeguards against XSS
    },
    react: {
      useSuspense: false,
    },
  });

export const setAppLanguage = (lang: SupportedLanguage) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
  i18n.changeLanguage(lang);
};

export default i18n;
