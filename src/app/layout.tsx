import type { Metadata } from 'next';
import ClientLayout from './ClientLayout';
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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
