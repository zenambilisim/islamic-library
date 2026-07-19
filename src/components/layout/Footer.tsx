'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import SiteLogo from '@/components/layout/SiteLogo';

const Footer = () => {
  const { t } = useTranslation();

  const quickLinks = [
    { key: 'home', label: t('navigation.home'), href: '/' },
    { key: 'categories', label: t('navigation.categories'), href: '/categories' },
    { key: 'authors', label: t('navigation.authors'), href: '/authors' },
    { key: 'about', label: t('navigation.about'), href: '/about' },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-ink text-cream">
      <div className="mx-auto max-w-site px-4 py-12 md:px-6 md:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[11px] border border-white/15 bg-white/10 p-1">
                <SiteLogo size={36} className="h-full w-full" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold tracking-tight">Islamic Library</h3>
                <p className="text-sm text-white/60">{t('footer.description')}</p>
              </div>
            </div>
            <p className="max-w-lg text-sm leading-relaxed text-white/70">
              {t('footer.detailedDescription')}
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/75 transition-colors hover:text-accent-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              {t('footer.contact')}
            </h4>
            <div className="flex items-center gap-2 text-sm text-white/75">
              <Mail size={16} className="shrink-0 text-accent-300" />
              <span>islamic.library@yahoo.com</span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-center text-sm text-white/50 md:text-left">
            © {currentYear} Islamic Library. {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
