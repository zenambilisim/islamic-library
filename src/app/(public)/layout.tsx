import { cookies } from 'next/headers';
import PublicClientShell from './PublicClientShell';
import { getRequestLanguage } from '@/lib/locale';

/**
 * (public) route grubu – Header, Footer ve provider'lar burada.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLang = getRequestLanguage(cookieStore);

  return <PublicClientShell initialLang={initialLang}>{children}</PublicClientShell>;
}
