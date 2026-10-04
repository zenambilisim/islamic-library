import type { Metadata } from 'next';
import HomePage from '@/views/HomePage';
import { getBooks, getCategories } from '@/lib/books';
import { convertSupabaseBookToBook, convertSupabaseCategoryToCategory } from '@/lib/converters-server';
import { localizedPath, normalizeLanguage } from '@/lib/locale';
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
  buildWebsiteJsonLd,
} from '@/lib/seo';
import { serializeBook } from '@/lib/serialize-book';
import type { SupabaseBook } from '@/lib/supabase';

const HOME_PAGE_SIZE = 10;
const FEATURED_BOOKS_COUNT = 5;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = normalizeLanguage(locale);
  const path = localizedPath(lang, '/');
  return {
    title: { absolute: `${SITE_NAME} - ${SITE_TAGLINE}` },
    description: DEFAULT_DESCRIPTION,
    alternates: {
      canonical: absoluteUrl(path),
      languages: {
        en: absoluteUrl(localizedPath('en', '/')),
        tr: absoluteUrl(localizedPath('tr', '/')),
        ru: absoluteUrl(localizedPath('ru', '/')),
        az: absoluteUrl(localizedPath('az', '/')),
        'x-default': absoluteUrl(localizedPath('en', '/')),
      },
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = normalizeLanguage(locale);

  const [booksResult, featuredResult, categoriesResult, totalResult] = await Promise.all([
    getBooks(0, HOME_PAGE_SIZE, lang),
    getBooks(0, FEATURED_BOOKS_COUNT, lang, { sortBy: 'mostDownloaded' }),
    getCategories(lang),
    // Hero'daki toplam kitap sayısı tüm dilleri kapsar
    getBooks(0, 1, undefined, { includeTotal: true }),
  ]);

  const initialBooks = (booksResult.books as SupabaseBook[]).map((b) =>
    serializeBook(convertSupabaseBookToBook(b)),
  );
  const initialFeaturedBooks = (featuredResult.books as SupabaseBook[]).map((b) =>
    serializeBook(convertSupabaseBookToBook(b)),
  );
  const initialCategories = (categoriesResult.categories || []).map((c) =>
    convertSupabaseCategoryToCategory(c),
  );
  const initialTotalBooks =
    typeof totalResult.total === 'number' ? totalResult.total : initialBooks.length;

  const websiteJsonLd = buildWebsiteJsonLd(lang);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <HomePage
        key={lang}
        initialBooks={initialBooks}
        initialFeaturedBooks={initialFeaturedBooks}
        initialHasMore={Boolean(booksResult.hasMore)}
        initialCategories={initialCategories}
        initialTotalBooks={initialTotalBooks}
      />
    </>
  );
}
