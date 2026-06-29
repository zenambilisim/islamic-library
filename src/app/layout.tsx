import type { Metadata } from 'next';
import { SITE_LOGO_PATH } from '@/lib/site-branding';
import './globals.css';

export const metadata: Metadata = {
  title: 'Islamic Library - İslami Dijital Kütüphane',
  description: 'İslami dijital kütüphane',
  icons: {
    icon: SITE_LOGO_PATH,
    apple: SITE_LOGO_PATH,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
