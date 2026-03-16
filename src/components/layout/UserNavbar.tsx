'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, BookOpen, Home, LogOut, Menu, X } from 'lucide-react';

const UserNavbar = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    setIsMenuOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/');
      router.refresh();
    }
  };

  const navItems = [
    { key: 'dashboard', label: t('user.nav.dashboard'), href: '/user/dashboard', icon: LayoutDashboard },
    { key: 'myBooks', label: t('user.nav.myBooks'), href: '/user/books', icon: BookOpen },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo / Brand */}
          <Link
            href="/user/dashboard"
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
          >
            <span className="text-lg">Islamic Library</span>
            <span className="text-gray-400 text-sm font-normal hidden sm:inline">— {t('user.nav.userArea')}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ key, href, label, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <Home size={18} />
              {t('user.nav.backToSite')}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label={t('user.nav.logout')}
            >
              <LogOut size={18} />
              <span className="hidden lg:inline">{t('user.nav.logout')}</span>
            </button>
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/"
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label={t('user.nav.backToSite')}
            >
              <Home size={20} />
            </Link>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {isMenuOpen && (
          <nav className="md:hidden py-3 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              {navItems.map(({ key, href, label, icon: Icon }) => (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                    pathname === href ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
              <button
                type="button"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 text-left"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                {t('user.nav.logout')}
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default UserNavbar;
