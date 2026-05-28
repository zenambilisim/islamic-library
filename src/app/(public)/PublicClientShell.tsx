'use client';

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
import '@/i18n';

function ShellInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <div className="site-chat-layout flex-1">
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
export default function PublicClientShell({ children }: { children: React.ReactNode }) {
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
