import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getRequestLanguage, localizedPath } from '@/lib/locale';

/** Eski profil rotası → kütüphane */
export default async function Page() {
  const cookieStore = await cookies();
  const lang = getRequestLanguage(cookieStore);
  redirect(localizedPath(lang, '/library'));
}
