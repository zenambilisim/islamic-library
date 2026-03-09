'use client';

import dynamic from 'next/dynamic';
import { SearchProvider } from '@/contexts/SearchContext';
import { BookModalProvider, useBookModal } from '@/contexts/BookModalContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BookDetailModal from '@/components/books/BookDetailModal';
import '@/i18n';

const BookReaderModal = dynamic(
  () => import('@/components/books/BookReaderModal'),
  { ssr: false }
);

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
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

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <BookModalProvider>
        <ClientLayoutInner>{children}</ClientLayoutInner>
      </BookModalProvider>
    </SearchProvider>
  );
}
