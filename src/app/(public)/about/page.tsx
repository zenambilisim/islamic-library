import type { Metadata } from 'next';
import AboutPage from '@/views/AboutPage';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Hakkımızda',
  description:
    'Islamic Library, dini kitapları dijital ortamda erişilebilir kılmak amacıyla oluşturulmuş ücretsiz bir elektronik kütüphane platformudur.',
  path: '/about',
});

export default function Page() {
  return <AboutPage />;
}
