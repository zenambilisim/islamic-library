import { cookies } from 'next/headers';
import HomePage from '@/views/HomePage';
import { getBooks, getCategories } from '@/lib/books';
import { convertSupabaseBookToBook, convertSupabaseCategoryToCategory } from '@/lib/converters-server';
import { getRequestLanguage } from '@/lib/locale';
import { serializeBook } from '@/lib/serialize-book';
import type { SupabaseBook } from '@/lib/supabase';

const HOME_PAGE_SIZE = 10;

export default async function Page() {
  const cookieStore = await cookies();
  const lang = getRequestLanguage(cookieStore);

  const [booksResult, categoriesResult, totalResult] = await Promise.all([
    getBooks(0, HOME_PAGE_SIZE, lang),
    getCategories(lang),
    getBooks(0, 1, lang, { includeTotal: true }),
  ]);

  const initialBooks = (booksResult.books as SupabaseBook[]).map((b) =>
    serializeBook(convertSupabaseBookToBook(b)),
  );
  const initialCategories = (categoriesResult.categories || []).map((c) =>
    convertSupabaseCategoryToCategory(c),
  );
  const initialTotalBooks =
    typeof totalResult.total === 'number' ? totalResult.total : initialBooks.length;

  return (
    <HomePage
      key={lang}
      initialBooks={initialBooks}
      initialHasMore={Boolean(booksResult.hasMore)}
      initialCategories={initialCategories}
      initialTotalBooks={initialTotalBooks}
    />
  );
}
