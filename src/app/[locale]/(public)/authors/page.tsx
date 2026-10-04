import type { Metadata } from 'next';
import AuthorsPage from '@/views/AuthorsPage';
import { getAuthors } from '@/lib/authors';
import { normalizeLanguage } from '@/lib/locale';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: 'Yazarlar',
    description: 'İslami eserlerin yazarlarını keşfedin. Biyografiler ve yazarlara göre kitap listeleri.',
    path: '/authors',
    locale,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = normalizeLanguage(locale);

  const { authors } = await getAuthors(lang);

  return <AuthorsPage key={lang} initialAuthors={authors} />;
}
