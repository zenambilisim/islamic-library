import type { Metadata } from 'next';
import PublicClientShell from './(public)/PublicClientShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Islamic Library - İslami Dijital Kütüphane',
  description: 'İslami dijital kütüphane',
  icons: {
    icon: '/images/logo/ISLAMIC.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <PublicClientShell>{children}</PublicClientShell>
      </body>
    </html>
  );
}
