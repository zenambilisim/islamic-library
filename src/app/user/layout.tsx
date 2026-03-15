'use client';

import '@/i18n';
import UserNavbar from '@/components/layout/UserNavbar';
import { BookModalProvider } from '@/contexts/BookModalContext';
import BookDetailModal from '@/components/books/BookDetailModal';

/**
 * User sayfaları için layout – kendi navbar'ı, ana site Header/Footer yok.
 */
export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BookModalProvider>
      <div className="min-h-screen bg-gray-50">
        <UserNavbar />
        <main>{children}</main>
        <BookDetailModal />
      </div>
    </BookModalProvider>
  );
}
