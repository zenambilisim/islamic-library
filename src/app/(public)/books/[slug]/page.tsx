import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getBookForPublicPage } from '@/lib/books';
import { convertSupabaseBookToBook } from '@/lib/converters-server';
import PublicBookDetailPage from '@/views/PublicBookDetailPage';

async function loadBook(segment: string, langQuery: string | undefined) {
  const { book: rawBook, error } = await getBookForPublicPage(segment, langQuery);
  if (error || !rawBook) return null;
  return convertSupabaseBookToBook(rawBook);
}

async function resolveSiteBase(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host');
    const proto = h.get('x-forwarded-proto') || 'https';
    if (host) return `${proto.split(',')[0].trim()}://${host.split(',')[0].trim()}`;
  } catch {
    /* headers() unavailable outside request */
  }
  return '';
}

function absoluteUrl(pathOrUrl: string, siteBase: string): string | undefined {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  if (!siteBase) return undefined;
  const base = siteBase.replace(/\/$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

function isUsableCover(url: string | undefined): url is string {
  if (!url) return false;
  return !url.includes('placeholder-book');
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
    return { title: '404' };
  }

  const siteBase = await resolveSiteBase();
  const desc = (model.description || '').slice(0, 160).trim();
  const coverAbs = isUsableCover(model.coverImage)
    ? absoluteUrl(model.coverImage, siteBase) ??
      (model.coverImage.startsWith('http') ? model.coverImage : undefined)
    : undefined;

  const pathSeg = encodeURIComponent(slug);
  const langQs = lang ? `?lang=${encodeURIComponent(lang)}` : '';
  const pagePath = `/books/${pathSeg}${langQs}`;
  const pageUrl = siteBase ? `${siteBase}${pagePath}` : undefined;

  return {
    ...(siteBase ? { metadataBase: new URL(siteBase) } : {}),
    title: model.title,
    description: desc || undefined,
    openGraph: {
      title: model.title,
      description: desc || undefined,
      type: 'book',
      url: pageUrl,
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
      description: desc || undefined,
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

  const book = {
    ...model,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };

  return <PublicBookDetailPage book={book} />;
}
