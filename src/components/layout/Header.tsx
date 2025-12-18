import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Globe, Menu, X, BookOpen } from 'lucide-react';
import { useSearch } from '../../contexts/SearchContext';
import type { Language } from '../../types';

const Header = () => {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { searchTerm, setSearchTerm, placeholder } = useSearch();

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
  ];

  const location = useLocation();
  
  const navigationItems = [
    { key: 'home', label: t('navigation.home'), href: '/' },
    { key: 'categories', label: t('navigation.categories'), href: '/categories' },
    { key: 'authors', label: t('navigation.authors'), href: '/authors' },
    { key: 'usefulInfo', label: t('navigation.usefulInfo'), href: '/useful-info' },
    { key: 'about', label: t('navigation.about'), href: '/about' },
    { key: 'contact', label: t('navigation.contact'), href: '/contact' },
  ];

  const handleLanguageChange = (langCode: Language) => {
    i18n.changeLanguage(langCode);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-xl sticky top-0 z-50 border-b border-white/20">
      <div className="container mx-auto px-4">
        {/* Top bar with language selector - Desktop Only */}
        <div className="hidden md:flex justify-end py-2 border-b border-gradient-to-r from-primary-100 to-purple-100">
          <div className="relative group">
            <button className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:from-primary-50 hover:to-purple-50 transition-all duration-300 transform hover:scale-105 shadow-sm">
              <Globe size={16} className="text-primary-600" />
              <span className="text-sm font-medium text-gray-700">{t('common.language')}</span>
            </button>
            
            {/* Language dropdown */}
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 ${
                    i18n.language === lang.code ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="py-4 md:py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 hover:scale-105 transition-all duration-300">
              <div className="flex items-center">
                <img 
                  src="/images/logo/ISLAMIC.png" 
                  alt={t('common.logoAlt', 'Islamic Library')} 
                  width={140} 
                  height={140} 
                  className="object-contain filter drop-shadow-lg"
                  onError={(e) => {
                    // Fallback to BookOpen icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.fallback-icon');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-3 rounded-xl hidden fallback-icon shadow-lg">
                  <BookOpen className="text-white" size={32} />
                </div>
              </div>
            </Link>
            
            {/* Search bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-purple-100 rounded-2xl blur opacity-30"></div>
                <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-500" size={20} />
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-12 pr-4 py-4 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    location.pathname === item.href 
                      ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-purple-50 hover:text-primary-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile menu button & Language selector */}
            <div className="lg:hidden flex items-center space-x-2">
              {/* Language selector - Mobile */}
              <div className="relative group">
                <button className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 hover:from-primary-50 hover:to-purple-50 transition-all duration-300 shadow-sm">
                  <Globe size={18} className="text-primary-600" />
                  <span className="text-xs font-medium text-gray-700">{languages.find(l => l.code === i18n.language)?.flag}</span>
                </button>
                
                {/* Language dropdown - Mobile */}
                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center space-x-2 first:rounded-t-lg last:rounded-b-lg ${
                        i18n.language === lang.code ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="text-sm">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hamburger menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isMenuOpen ? <X size={24} className="text-gray-700" /> : <Menu size={24} className="text-gray-700" />}
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="md:hidden mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input pl-10"
              />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-gray-100">
            {navigationItems.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className={`block py-2 px-4 rounded-md transition-colors ${
                  location.pathname === item.href
                    ? 'text-primary-600 bg-primary-50 font-medium'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
