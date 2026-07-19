import type { Metadata } from 'next';
import { SITE_LOGO_PATH } from '@/lib/site-branding';
import { getSiteBaseUrl } from '@/lib/site-url';

export const SITE_NAME = 'Islamic Library';
export const SITE_TAGLINE = 'İslami Dijital Kütüphane';

export const DEFAULT_DESCRIPTION =
  'Kuran, hadis, tefsir, fıkıh ve tasavvuf eserlerini ücretsiz okuyun ve indirin. Islamic Library — açık erişimli İslami dijital kütüphane.';

const OG_LOCALE = 'tr_TR';

/** Absolute URL for a site path (leading slash optional). */
export function absoluteUrl(path = '/'): string {
  const base = getSiteBaseUrl();
  if (!path || path === '/') return base;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function absoluteAssetUrl(pathOrUrl: string): string | undefined {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  return absoluteUrl(pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`);
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  /** When false, title is used as-is (no template). Default true. */
  useTemplate?: boolean;
  image?: string;
  noIndex?: boolean;
};

/** Shared metadata builder for public pages. */
export function buildPageMetadata({
  title,
  description,
  path,
  useTemplate = true,
  image,
  noIndex = false,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = absoluteAssetUrl(image || SITE_LOGO_PATH);
  const fullTitle = useTemplate ? undefined : title;

  return {
    title: useTemplate ? title : fullTitle,
    description,
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'website',
      locale: OG_LOCALE,
      siteName: SITE_NAME,
      title: useTemplate ? `${title} | ${SITE_NAME}` : title,
      description,
      url,
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                alt: SITE_NAME,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: useTemplate ? `${title} | ${SITE_NAME}` : title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export function rootMetadata(): Metadata {
  const base = getSiteBaseUrl();
  const ogImage = absoluteAssetUrl(SITE_LOGO_PATH);

  return {
    metadataBase: new URL(base),
    title: {
      default: `${SITE_NAME} - ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    icons: {
      icon: SITE_LOGO_PATH,
      apple: SITE_LOGO_PATH,
    },
    openGraph: {
      type: 'website',
      locale: OG_LOCALE,
      siteName: SITE_NAME,
      title: `${SITE_NAME} - ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
      url: base,
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                alt: SITE_NAME,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} - ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

type BookJsonLdInput = {
  title: string;
  description?: string;
  authors?: string[];
  author?: string;
  image?: string;
  url: string;
  language?: string;
  pages?: number;
  dateModified?: string;
  datePublished?: string;
};

export function buildBookJsonLd(book: BookJsonLdInput): Record<string, unknown> {
  const authorNames =
    book.authors?.filter(Boolean) ??
    (book.author ? book.author.split(',').map((s) => s.trim()).filter(Boolean) : []);

  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    ...(book.description ? { description: book.description } : {}),
    ...(book.image ? { image: book.image } : {}),
    url: book.url,
    ...(book.language ? { inLanguage: book.language } : {}),
    ...(book.pages && book.pages > 0 ? { numberOfPages: book.pages } : {}),
    ...(book.datePublished ? { datePublished: book.datePublished } : {}),
    ...(book.dateModified ? { dateModified: book.dateModified } : {}),
    ...(authorNames.length
      ? {
          author: authorNames.map((name) => ({
            '@type': 'Person',
            name,
          })),
        }
      : {}),
  };
}

export function buildWebsiteJsonLd(): Record<string, unknown> {
  const base = getSiteBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: base,
    inLanguage: ['tr', 'en', 'az', 'ru'],
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: base,
      logo: absoluteAssetUrl(SITE_LOGO_PATH),
    },
  };
}
