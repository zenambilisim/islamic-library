import type { Metadata } from 'next';
import UsefulInfoPage from '@/views/UsefulInfoPage';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: 'Faydalı Bilgiler',
    description:
      'Islamic Library platformunu daha verimli kullanmanız için rehberler, ipuçları ve sık sorulan soruların cevapları.',
    path: '/useful-info',
    locale,
  });
}

export default function Page() {
  return <UsefulInfoPage />;
}
