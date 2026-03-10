'use client';

import '@/i18n';
import UserNavbar from '@/components/layout/UserNavbar';

/**
 * User sayfaları için layout – kendi navbar'ı, ana site Header/Footer yok.
 */
export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />
      <main>{children}</main>
    </div>
  );
}
