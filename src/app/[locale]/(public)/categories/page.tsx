import type { Metadata } from 'next';
import CategoriesPage from '@/views/CategoriesPage';
import { getBooks, getCategories } from '@/lib/books';
import { convertSupabaseCategoryToCategory } from '@/lib/converters-server';
import { normalizeLanguage } from '@/lib/locale';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: 'Kategoriler',
    description:
      'Kuran, hadis, tefsir, fıkıh, tasavvuf ve diğer İslami ilimleri kategorilere göre keşfedin.',
    path: '/categories',
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

  const [categoriesResult, totalResult] = await Promise.all([
    getCategories(lang),
    getBooks(0, 1, lang, { includeTotal: true }),
  ]);

  const initialCategories = (categoriesResult.categories || []).map((c) =>
    convertSupabaseCategoryToCategory(c),
  );
  const initialTotalBooks =
    typeof totalResult.total === 'number' ? totalResult.total : 0;

  return (
    <CategoriesPage
      key={lang}
      initialCategories={initialCategories}
      initialTotalBooks={initialTotalBooks}
    />
  );
}
