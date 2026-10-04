import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBookForPublicPage } from '@/lib/books';
import { convertSupabaseBookToBook } from '@/lib/converters-server';
import {
  DEFAULT_LANG,
  SUPPORTED_LANGS,
  localizedPath,
  normalizeLanguage,
  toOgLocale,
} from '@/lib/locale';
import {
  SITE_NAME,
  absoluteAssetUrl,
  absoluteUrl,
  buildBookJsonLd,
} from '@/lib/seo';
import PublicBookDetailPage from '@/views/PublicBookDetailPage';

async function loadBook(segment: string, lang: string) {
  const { book: rawBook, error } = await getBookForPublicPage(segment, lang);
  if (error || !rawBook) return null;
  return convertSupabaseBookToBook(rawBook);
}

function isUsableCover(url: string | undefined): url is string {
  if (!url) return false;
  return !url.includes('placeholder-book');
}

function bookDescription(model: {
  description: string;
  author: string;
  category: string;
  title: string;
}): string {
  const fromBook = (model.description || '').trim().slice(0, 160);
  if (fromBook) return fromBook;

  const parts = [model.title];
  if (model.author) parts.push(model.author);
  if (model.category) parts.push(model.category);
  return `${parts.join(' — ')}. Islamic Library'de ücretsiz okuyun ve indirin.`.slice(0, 160);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = normalizeLanguage(locale);
  const model = await loadBook(slug, lang);
  if (!model) {
    return {
      title: 'Kitap bulunamadı',
      robots: { index: false, follow: false },
    };
  }

  const desc = bookDescription(model);
  const pathSeg = encodeURIComponent(slug);
  const pagePath = localizedPath(lang, `/books/${pathSeg}`);
  const pageUrl = absoluteUrl(pagePath);

  const authorList =
    model.authors?.filter(Boolean) ??
    (model.author
      ? model.author.split(',').map((s) => s.trim()).filter(Boolean)
      : []);

  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LANGS) {
    languages[l] = absoluteUrl(localizedPath(l, `/books/${pathSeg}`));
  }
  languages['x-default'] = absoluteUrl(
    localizedPath(DEFAULT_LANG, `/books/${pathSeg}`)
  );

  return {
    title: model.title,
    description: desc,
    authors: authorList.map((name) => ({ name })),
    alternates: {
      canonical: pageUrl,
      languages,
    },
    openGraph: {
      title: model.title,
      description: desc,
      type: 'book',
      url: pageUrl,
      siteName: SITE_NAME,
      locale: toOgLocale(lang),
    },
    twitter: {
      card: 'summary_large_image',
      title: model.title,
      description: desc,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const lang = normalizeLanguage(locale);
  const model = await loadBook(slug, lang);
  if (!model) notFound();

  const pathSeg = encodeURIComponent(slug);
  const pageUrl = absoluteUrl(localizedPath(lang, `/books/${pathSeg}`));
  const coverAbs = isUsableCover(model.coverImage)
    ? absoluteAssetUrl(model.coverImage)
    : undefined;

  const jsonLd = buildBookJsonLd({
    title: model.title,
    description: bookDescription(model),
    authors: model.authors,
    author: model.author,
    image: coverAbs,
    url: pageUrl,
    language: model.language,
    pages: model.pages,
    datePublished: model.createdAt?.toISOString?.() ?? undefined,
    dateModified: model.updatedAt?.toISOString?.() ?? undefined,
  });

  const book = {
    ...model,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicBookDetailPage book={book} />
    </>
  );
}
