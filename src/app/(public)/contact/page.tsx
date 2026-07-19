import type { Metadata } from 'next';
import ContactPage from '@/views/ContactPage';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'İletişim',
  description:
    'Sorularınız, önerileriniz veya katkılarınız için bizimle iletişime geçin. Islamic Library ekibi size yardımcı olmaktan memnuniyet duyar.',
  path: '/contact',
});

export default function Page() {
  return <ContactPage />;
}
