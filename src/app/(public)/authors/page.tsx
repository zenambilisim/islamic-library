import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import AuthorsPage from '@/views/AuthorsPage';
import { getAuthors } from '@/lib/authors';
import { getRequestLanguage } from '@/lib/locale';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Yazarlar',
  description: 'İslami eserlerin yazarlarını keşfedin. Biyografiler ve yazarlara göre kitap listeleri.',
  path: '/authors',
});

export default async function Page() {
  const cookieStore = await cookies();
  const lang = getRequestLanguage(cookieStore);

  const { authors } = await getAuthors(lang);

  return <AuthorsPage key={lang} initialAuthors={authors} />;
}
