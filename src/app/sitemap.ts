import type { MetadataRoute } from 'next';
import { getSiteBaseUrl } from '@/lib/site-url';
import { supabase } from '@/lib/supabase-server';
import {
  DEFAULT_LANG,
  SUPPORTED_LANGS,
  isSupportedLanguage,
  localizedPath,
} from '@/lib/locale';

const STATIC_PATHS = [
  '/',
  '/about',
  '/contact',
  '/authors',
  '/categories',
  '/useful-info',
] as const;

const PAGE_SIZE = 1000;

async function fetchAllBookEntries(
  base: string
): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from('books')
      .select('slug, language_code, updated_at, created_at')
      .not('slug', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('sitemap: books fetch failed', error.message);
      break;
    }

    const rows = data ?? [];
    for (const row of rows) {
      const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
      if (!slug) continue;
      const rawLang =
        typeof row.language_code === 'string' && row.language_code.trim()
          ? row.language_code.trim().toLowerCase()
          : DEFAULT_LANG;
      const lang = isSupportedLanguage(rawLang) ? rawLang : DEFAULT_LANG;
      const lastMod = row.updated_at || row.created_at;
      entries.push({
        url: `${base}${localizedPath(lang, `/books/${encodeURIComponent(slug)}`)}`,
        lastModified: lastMod ? new Date(lastMod) : undefined,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return entries;
}

async function fetchCategoryEntries(
  base: string
): Promise<MetadataRoute.Sitemap> {
  const { data, error } = await supabase
    .from('categories')
    .select('slug, created_at')
    .not('slug', 'is', null);

  if (error) {
    console.error('sitemap: categories fetch failed', error.message);
    return [];
  }

  const entries: MetadataRoute.Sitemap = [];
  for (const row of data ?? []) {
    const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
    if (!slug) continue;
    for (const lang of SUPPORTED_LANGS) {
      entries.push({
        url: `${base}${localizedPath(lang, `/categories/${encodeURIComponent(slug)}`)}`,
        lastModified: row.created_at ? new Date(row.created_at) : undefined,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteBaseUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((path) =>
    SUPPORTED_LANGS.map((lang) => ({
      url: `${base}${localizedPath(lang, path)}`,
      lastModified: now,
      changeFrequency: path === '/' ? 'daily' : 'monthly',
      priority: path === '/' ? 1 : 0.7,
    }))
  ) as MetadataRoute.Sitemap;

  const [books, categories] = await Promise.all([
    fetchAllBookEntries(base),
    fetchCategoryEntries(base),
  ]);

  return [...staticEntries, ...categories, ...books];
}
