import type { Metadata } from 'next';
import { rootMetadata } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = rootMetadata();

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
