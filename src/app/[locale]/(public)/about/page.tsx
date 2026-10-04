import type { Metadata } from 'next';
import AboutPage from '@/views/AboutPage';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: 'Hakkımızda',
    description:
      'Islamic Library, dini kitapları dijital ortamda erişilebilir kılmak amacıyla oluşturulmuş ücretsiz bir elektronik kütüphane platformudur.',
    path: '/about',
    locale,
  });
}

export default function Page() {
  return <AboutPage />;
}
