'use client';

import { SearchProvider } from '@/contexts/SearchContext';
import { BookModalProvider } from '@/contexts/BookModalContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BookDetailModal from '@/components/books/BookDetailModal';
import '@/i18n';

function ShellInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>{children}</main>
      <Footer />
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
    <SearchProvider>
      <BookModalProvider>
        <ShellInner>{children}</ShellInner>
      </BookModalProvider>
    </SearchProvider>
  );
}
