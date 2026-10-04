import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { getRequestTheme, THEME_INIT_SCRIPT } from '@/lib/theme';
import { getRequestLanguage } from '@/lib/locale';
import { rootMetadata } from '@/lib/seo';
import YandexMetrika from '@/components/analytics/YandexMetrika';
import './globals.css';

export const metadata: Metadata = rootMetadata();

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialTheme = getRequestTheme(cookieStore);
  const initialLang = getRequestLanguage(cookieStore);

  return (
    <html
      lang={initialLang}
      className={initialTheme === 'dark' ? 'dark' : undefined}
      data-theme={initialTheme}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
        <YandexMetrika />
      </body>
    </html>
  );
}
