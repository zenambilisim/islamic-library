import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import CategoriesPage from '@/views/CategoriesPage';
import { getBooks, getCategories } from '@/lib/books';
import { convertSupabaseCategoryToCategory } from '@/lib/converters-server';
import { getRequestLanguage } from '@/lib/locale';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Kategoriler',
  description:
    'Kuran, hadis, tefsir, fıkıh, tasavvuf ve diğer İslami ilimleri kategorilere göre keşfedin.',
  path: '/categories',
});

export default async function Page() {
  const cookieStore = await cookies();
  const lang = getRequestLanguage(cookieStore);

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
