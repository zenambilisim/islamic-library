'use client';

import { useLayoutEffect } from 'react';
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
import i18n from '@/i18n';
import {
  normalizeLanguage,
  readLanguageCookieFromDocument,
  resolveClientLanguage,
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
 */
export default function PublicClientShell({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: SupportedLanguage;
}) {
  useLayoutEffect(() => {
    const cookieLang = readLanguageCookieFromDocument();

    // Kullanıcı dil seçti, router.refresh henüz yeni cookie’yi SSR’a taşımadı:
    // stale initialLang ile geri zorlama.
    if (cookieLang && cookieLang !== initialLang) {
      document.documentElement.lang = cookieLang;
      if (normalizeLanguage(i18n.resolvedLanguage || i18n.language) !== cookieLang) {
        void i18n.changeLanguage(cookieLang);
      }
      return;
    }

    const target = resolveClientLanguage(initialLang);
    if (!cookieLang) {
      setLanguageCookie(target);
    }

    document.documentElement.lang = target;
    if (normalizeLanguage(i18n.resolvedLanguage || i18n.language) !== target) {
      void i18n.changeLanguage(target);
    }
  }, [initialLang]);

  return (
    <UserAuthProvider>
      <SearchProvider>
        <BookModalProvider>
          <HikmeChatBooksProvider>
            <ShellInner>{children}</ShellInner>
          </HikmeChatBooksProvider>
        </BookModalProvider>
      </SearchProvider>
    </UserAuthProvider>
  );
}
