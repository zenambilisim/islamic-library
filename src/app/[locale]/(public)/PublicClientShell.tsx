'use client';

import { useLayoutEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { SearchProvider } from '@/contexts/SearchContext';
import { BookModalProvider } from '@/contexts/BookModalContext';
import { UserAuthProvider } from '@/contexts/UserAuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BookDetailModal from '@/components/books/BookDetailModal';
import {
  GlobalHikmeChatMobile,
  GlobalHikmeChatSidebar,
  HikmeChatBooksProvider,
} from '@/components/chat/GlobalHikmeChat';
import { createI18nForLocale } from '@/i18n';
import {
  normalizeLanguage,
  setLanguageCookie,
  type SupportedLanguage,
} from '@/lib/locale';

function ShellInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-cream">
      <Header />
      <div className="site-chat-layout relative z-[1] flex-1">
        <GlobalHikmeChatSidebar />
        <main className="site-chat-main flex flex-1 flex-col">{children}</main>
      </div>
      <Footer />
      <GlobalHikmeChatMobile />
      <BookDetailModal />
    </div>
  );
}

/**
 * Sadece provider + Header/Footer ve modallar için client sınırı.
 * children (sayfa içeriği) sunucuda render edilir, SEO tam kalır.
 * Dil kaynağı: URL [locale] (initialLang).
 */
export default function PublicClientShell({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: SupportedLanguage;
}) {
  const lang = normalizeLanguage(initialLang);
  const [i18nInstance] = useState(() => createI18nForLocale(lang));

  useLayoutEffect(() => {
    setLanguageCookie(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <I18nextProvider i18n={i18nInstance}>
      <UserAuthProvider>
        <SearchProvider>
          <BookModalProvider>
            <HikmeChatBooksProvider>
              <ShellInner>{children}</ShellInner>
            </HikmeChatBooksProvider>
          </BookModalProvider>
        </SearchProvider>
      </UserAuthProvider>
    </I18nextProvider>
  );
}
