import type { Metadata } from 'next';
import MyLibraryPage from '@/views/MyLibraryPage';

export const metadata: Metadata = {
  title: 'Kütüphanem',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MyLibraryPage />;
}
