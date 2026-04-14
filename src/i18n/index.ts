import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Dil dosyalarını import et
import tr from './locales/tr.json';
import en from './locales/en.json';
import ru from './locales/ru.json';
import az from './locales/az.json';

const supportedLanguages = ['tr', 'en', 'ru', 'az'] as const;
type SupportedLanguage = typeof supportedLanguages[number];

const isSupportedLanguage = (value: string): value is SupportedLanguage =>
  supportedLanguages.includes(value as SupportedLanguage);

const detectInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') {
    return 'tr';
  }

  const storedLanguage = window.localStorage.getItem('language');
  if (storedLanguage && isSupportedLanguage(storedLanguage)) {
    return storedLanguage;
  }

  const browserLanguages = window.navigator.languages?.length
    ? window.navigator.languages
    : [window.navigator.language];

  for (const lang of browserLanguages) {
    const normalizedLang = lang.toLowerCase();

    if (isSupportedLanguage(normalizedLang)) {
      return normalizedLang;
    }

    const baseLang = normalizedLang.split('-')[0];
    if (isSupportedLanguage(baseLang)) {
      return baseLang;
    }
  }

  return 'tr';
};

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  ru: { translation: ru },
  az: { translation: az },
};

i18n
  .use(initReactI18next) // React-i18next plugin'ini kullan
  .init({
    resources,
    lng: detectInitialLanguage(), // Varsayılan dil: kayıtlı tercih veya tarayıcı dili
    fallbackLng: 'en', // Yedek dil İngilizce

    interpolation: {
      escapeValue: false, // React zaten XSS'e karşı korumalı
    },

    // Debug modunu development'ta aç
    debug: typeof window !== 'undefined' && process.env.NODE_ENV === 'development',
  });

i18n.on('languageChanged', (lang) => {
  if (typeof window !== 'undefined' && isSupportedLanguage(lang)) {
    window.localStorage.setItem('language', lang);
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
});

export default i18n;
