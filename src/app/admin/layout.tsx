'use client';

import '@/i18n';
import AdminNavbar from '@/components/layout/AdminNavbar';
import { BookModalProvider } from '@/contexts/BookModalContext';
import BookDetailModal from '@/components/books/BookDetailModal';

/**
 * Admin sayfaları için layout – kendi navbar'ı, ana site Header/Footer yok.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BookModalProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <main>{children}</main>
        <BookDetailModal />
      </div>
    </BookModalProvider>
  );
}
