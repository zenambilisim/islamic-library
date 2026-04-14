'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { BookOpen, Mail } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const quickLinks = [
    { key: 'home', label: t('navigation.home'), href: '/' },
    { key: 'categories', label: t('navigation.categories'), href: '/categories' },
    { key: 'authors', label: t('navigation.authors'), href: '/authors' },
    { key: 'about', label: t('navigation.about'), href: '/about' },
  ];

  if (!isMounted) {
    return (
      <footer className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-purple-600/10 to-blue-600/10" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="h-40 w-full max-w-3xl animate-pulse rounded-2xl bg-white/5" />
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-purple-600/10 to-blue-600/10"></div>
      
      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-4 rounded-2xl shadow-lg">
                <BookOpen className="text-white" size={40} />
              </div>
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Islamic Library</h3>
                <p className="text-blue-200 text-sm font-medium">{t('footer.description')}</p>
              </div>
            </div>
            <p className="text-gray-300 mb-8 max-w-lg text-lg leading-relaxed">
              {t('footer.detailedDescription')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.contact')}</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-300">
                <Mail size={16} />
                <span>shiaislamicapps@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Islamic Library. {t('footer.copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
