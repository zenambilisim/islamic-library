import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import CategoryBySlugPage from '@/views/CategoryBySlugPage';
import { getBooksByCategory, getCategoryBySlug } from '@/lib/books';
import {
  convertSupabaseBookToBook,
  convertSupabaseCategoryToCategory,
} from '@/lib/converters-server';
import { getRequestLanguage } from '@/lib/locale';
import { serializeBook } from '@/lib/serialize-book';
import type { SupabaseBook } from '@/lib/supabase';

const CATEGORY_PAGE_SIZE = 12;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const lang = getRequestLanguage(cookieStore);

  const { category: rawCategory, error } = await getCategoryBySlug(slug, lang);
  if (error || !rawCategory) {
    notFound();
  }

  const category = convertSupabaseCategoryToCategory(rawCategory);
  const booksResult = await getBooksByCategory(slug, lang, 0, CATEGORY_PAGE_SIZE);
  const initialBooks = (booksResult.books as SupabaseBook[]).map((b) =>
    serializeBook(convertSupabaseBookToBook(b)),
  );

  return (
    <CategoryBySlugPage
      key={`${lang}-${slug}`}
      category={category}
      initialBooks={initialBooks}
      initialHasMore={Boolean(booksResult.hasMore)}
    />
  );
}
