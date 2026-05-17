import { redirect } from 'next/navigation';

/** Eski profil rotası → kütüphane */
export default function Page() {
  redirect('/library');
}
