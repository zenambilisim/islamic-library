import type { Metadata } from 'next';
import ContactPage from '@/views/ContactPage';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: 'İletişim',
    description:
      'Sorularınız, önerileriniz veya katkılarınız için bizimle iletişime geçin. Islamic Library ekibi size yardımcı olmaktan memnuniyet duyar.',
    path: '/contact',
    locale,
  });
}

export default function Page() {
  return <ContactPage />;
}
