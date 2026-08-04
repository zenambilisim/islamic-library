'use client';

import { usePathname } from 'next/navigation';
import '@/i18n';
import AdminNavbar from '@/components/layout/AdminNavbar';
import { BookModalProvider } from '@/contexts/BookModalContext';
import BookDetailModal from '@/components/books/BookDetailModal';

/**
 * Admin sayfaları için client shell – kendi navbar'ı, ana site Header/Footer yok.
 * /admin/login navbar olmadan, public site ile uyumlu krem arka plan.
 */
export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <div className="relative z-[1] min-h-screen bg-cream">{children}</div>;
  }

  return (
    <BookModalProvider>
      <div className="relative z-[1] min-h-screen bg-cream">
        <AdminNavbar />
        <main className="admin-content">{children}</main>
        <BookDetailModal />
      </div>
    </BookModalProvider>
  );
}
