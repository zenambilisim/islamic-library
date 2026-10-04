import { notFound } from 'next/navigation';
import { isSupportedLanguage } from '@/lib/locale';

export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'tr' },
    { locale: 'ru' },
    { locale: 'az' },
  ];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLanguage(locale)) {
    notFound();
  }

  return children;
}
