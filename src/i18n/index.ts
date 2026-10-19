import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import tr from './locales/tr.json';
import en from './locales/en.json';
import ru from './locales/ru.json';
import az from './locales/az.json';
import {
  DEFAULT_LANG,
  getLocaleFromPathname,
  normalizeLanguage,
  resolveClientLanguage,
  setLanguageCookie,
  type SupportedLanguage,
} from '@/lib/locale';

const detectInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANG;
  }
  return getLocaleFromPathname(window.location.pathname) ?? resolveClientLanguage(DEFAULT_LANG);
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
    fallbackLng: DEFAULT_LANG,
    interpolation: {
      escapeValue: false,
    },
    // Kaynaklar bundle'da; async init ilk karede EN flaşı yaratır
    initAsync: false,
    react: {
      useSuspense: false,
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

/** URL locale ile senkron, istek başına i18n (SSR'de EN varsayılanını ezmek için). */
export function createI18nForLocale(lng: SupportedLanguage) {
  const lang = normalizeLanguage(lng);
  const instance = i18n.cloneInstance({
    lng: lang,
    fallbackLng: DEFAULT_LANG,
    initAsync: false,
    react: {
      useSuspense: false,
    },
  });
  if (normalizeLanguage(instance.resolvedLanguage || instance.language) !== lang) {
    void instance.changeLanguage(lang);
  }
  return instance;
}

export default i18n;
