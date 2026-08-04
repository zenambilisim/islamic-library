import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import tr from './locales/tr.json';
import en from './locales/en.json';
import ru from './locales/ru.json';
import az from './locales/az.json';
import {
  normalizeLanguage,
  resolveClientLanguage,
  setLanguageCookie,
  type SupportedLanguage,
} from '@/lib/locale';

const detectInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') {
    return 'tr';
  }
  return resolveClientLanguage('tr');
};

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  ru: { translation: ru },
  az: { translation: az },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: detectInitialLanguage(),
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false,
    },
    debug: typeof window !== 'undefined' && process.env.NODE_ENV === 'development',
  });
}

i18n.on('languageChanged', (lang) => {
  const code = normalizeLanguage(lang);
  if (typeof window !== 'undefined') {
    // Her dil değişiminde cookie + localStorage birlikte güncellenir
    setLanguageCookie(code);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = code;
  }
});

export default i18n;
