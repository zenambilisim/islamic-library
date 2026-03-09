'use client';

import '@/i18n';

/**
 * User sayfaları için layout – Header/Footer yok, sadece içerik.
 */
export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>{children}</main>
    </div>
  );
}
