import type { Metadata } from 'next';
import UsefulInfoPage from '@/views/UsefulInfoPage';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Faydalı Bilgiler',
  description:
    'Islamic Library platformunu daha verimli kullanmanız için rehberler, ipuçları ve sık sorulan soruların cevapları.',
  path: '/useful-info',
});

export default function Page() {
  return <UsefulInfoPage />;
}
