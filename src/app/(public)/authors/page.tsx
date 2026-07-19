import { cookies } from 'next/headers';
import AuthorsPage from '@/views/AuthorsPage';
import { getAuthors } from '@/lib/authors';
import { getRequestLanguage } from '@/lib/locale';

export default async function Page() {
  const cookieStore = await cookies();
  const lang = getRequestLanguage(cookieStore);

  const { authors } = await getAuthors(lang);

  return <AuthorsPage key={lang} initialAuthors={authors} />;
}
