import PublicClientShell from './PublicClientShell';
import { normalizeLanguage } from '@/lib/locale';

/**
 * (public) route grubu – Header, Footer ve provider'lar burada.
 * Dil kaynağı: URL [locale] segmenti.
 */
export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const initialLang = normalizeLanguage(locale);

  return <PublicClientShell initialLang={initialLang}>{children}</PublicClientShell>;
}
