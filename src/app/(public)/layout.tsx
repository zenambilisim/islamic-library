import type { Metadata } from 'next';
import PublicClientShell from './PublicClientShell';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Islamic Library - İslami Dijital Kütüphane',
  description: 'İslami dijital kütüphane',
  icons: {
    icon: '/images/logo/ISLAMIC.png',
  },
};

/**
 * Server Component – ilk HTML sunucuda üretilir, SEO için tam içerik gider.
 * Sadece PublicClientShell client; children (sayfa) sunucuda render edilir.
 */
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
