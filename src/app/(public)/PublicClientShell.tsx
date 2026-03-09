'use client';

import { SearchProvider } from '@/contexts/SearchContext';
import { BookModalProvider, useBookModal } from '@/contexts/BookModalContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BookDetailModal from '@/components/books/BookDetailModal';
import BookReaderModal from '@/components/books/BookReaderModal';
import '@/i18n';

function ShellInner({ children }: { children: React.ReactNode }) {
  const { readerRequested } = useBookModal();
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>{children}</main>
      <Footer />
      <BookDetailModal />
      {readerRequested && <BookReaderModal />}
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
