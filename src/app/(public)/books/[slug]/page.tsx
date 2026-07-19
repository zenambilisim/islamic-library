import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBookForPublicPage } from '@/lib/books';
import { convertSupabaseBookToBook } from '@/lib/converters-server';
import {
  SITE_NAME,
  absoluteAssetUrl,
  absoluteUrl,
  buildBookJsonLd,
} from '@/lib/seo';
import PublicBookDetailPage from '@/views/PublicBookDetailPage';

async function loadBook(segment: string, langQuery: string | undefined) {
  const { book: rawBook, error } = await getBookForPublicPage(segment, langQuery);
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await searchParams;
  const model = await loadBook(slug, lang);
  if (!model) {
    return {
      title: 'Kitap bulunamadı',
      robots: { index: false, follow: false },
    };
  }

  const desc = bookDescription(model);
  const coverAbs = isUsableCover(model.coverImage)
    ? absoluteAssetUrl(model.coverImage)
    : undefined;

  const pathSeg = encodeURIComponent(slug);
  const langQs = lang ? `?lang=${encodeURIComponent(lang)}` : '';
  const pagePath = `/books/${pathSeg}${langQs}`;
  const pageUrl = absoluteUrl(pagePath);

  const authorList =
    model.authors?.filter(Boolean) ??
    (model.author
      ? model.author.split(',').map((s) => s.trim()).filter(Boolean)
      : []);

  return {
    title: model.title,
    description: desc,
    authors: authorList.map((name) => ({ name })),
    alternates: { canonical: pageUrl },
    openGraph: {
      title: model.title,
      description: desc,
      type: 'book',
      url: pageUrl,
      siteName: SITE_NAME,
      locale: 'tr_TR',
      ...(coverAbs
        ? {
            images: [
              {
                url: coverAbs,
                alt: model.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: coverAbs ? 'summary_large_image' : 'summary',
      title: model.title,
      description: desc,
      ...(coverAbs ? { images: [coverAbs] } : {}),
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const model = await loadBook(slug, lang);
  if (!model) notFound();

  const pathSeg = encodeURIComponent(slug);
  const langQs = lang ? `?lang=${encodeURIComponent(lang)}` : '';
  const pageUrl = absoluteUrl(`/books/${pathSeg}${langQs}`);
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
