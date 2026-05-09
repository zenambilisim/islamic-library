import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBookForPublicPage } from '@/lib/books';
import { convertSupabaseBookToBook } from '@/lib/converters-server';
import PublicBookDetailPage from '@/views/PublicBookDetailPage';

async function loadBook(segment: string, langQuery: string | undefined) {
  const { book: rawBook, error } = await getBookForPublicPage(segment, langQuery);
  if (error || !rawBook) return null;
  return convertSupabaseBookToBook(rawBook);
}

function absoluteUrl(pathOrUrl: string, siteBase: string): string | undefined {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  const base = siteBase.replace(/\/$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
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
  const siteBase =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    '';

  const desc = (model.description || '').slice(0, 160).trim();
  const ogImage = siteBase ? absoluteUrl(model.coverImage, siteBase) : model.coverImage;

  return {
    title: model.title,
    description: desc || undefined,
    openGraph: {
      title: model.title,
      description: desc || undefined,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: model.title,
      description: desc || undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
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
