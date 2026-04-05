'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, FolderTree } from 'lucide-react';

const DashboardPage = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          {t('user.dashboard.title')}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('user.dashboard.welcome')}. {t('user.dashboard.welcomeDesc')}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/user/books"
            className="group flex flex-col p-5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary-100 text-primary-600 group-hover:bg-primary-200">
                <BookOpen size={22} />
              </div>
              <h2 className="font-semibold text-gray-900">{t('user.dashboard.myBooksCard')}</h2>
            </div>
            <p className="text-sm text-gray-500">{t('user.dashboard.myBooksDesc')}</p>
            <span className="mt-3 text-sm font-medium text-primary-600 group-hover:underline">
              {t('user.dashboard.goToBooks')} →
            </span>
          </Link>

          <Link
            href="/user/authors"
            className="group flex flex-col p-5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary-100 text-primary-600 group-hover:bg-primary-200">
                <Users size={22} />
              </div>
              <h2 className="font-semibold text-gray-900">Yazarlar</h2>
            </div>
            <p className="text-sm text-gray-500">Yazar listesini yonetin ve yeni yazar ekleyin</p>
            <span className="mt-3 text-sm font-medium text-primary-600 group-hover:underline">
              Yazar sayfasina git →
            </span>
          </Link>

          <Link
            href="/user/categories"
            className="group flex flex-col p-5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary-100 text-primary-600 group-hover:bg-primary-200">
                <FolderTree size={22} />
              </div>
              <h2 className="font-semibold text-gray-900">Kategoriler</h2>
            </div>
            <p className="text-sm text-gray-500">Kategori listesi ve yeni kategori ekleme</p>
            <span className="mt-3 text-sm font-medium text-primary-600 group-hover:underline">
              Kategori sayfasina git →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
