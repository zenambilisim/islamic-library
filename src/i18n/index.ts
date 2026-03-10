import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Dil dosyalarını import et
import tr from './locales/tr.json';
import en from './locales/en.json';
import ru from './locales/ru.json';
import az from './locales/az.json';

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
    lng: 'tr', // Varsayılan dil Türkçe
    fallbackLng: 'en', // Yedek dil İngilizce

    interpolation: {
      escapeValue: false, // React zaten XSS'e karşı korumalı
    },

    // Debug modunu development'ta aç
    debug: typeof window !== 'undefined' && process.env.NODE_ENV === 'development',
  });

export default i18n;
