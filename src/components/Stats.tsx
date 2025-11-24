import { useTranslation } from 'react-i18next';
import { BookOpen, Users, Download, Star, TrendingUp, Calendar } from 'lucide-react';
import type { Book } from '../types';

interface StatsProps {
  books: Book[];
}

const Stats = ({ books }: StatsProps) => {
  const { t } = useTranslation();

  // Calculate statistics
  const totalBooks = books.length;
  const totalDownloads = books.reduce((sum, book) => sum + book.downloadCount, 0);
  const averageRating = books.reduce((sum, book) => sum + book.rating, 0) / books.length;
  const uniqueAuthors = new Set(books.map(book => book.author)).size;
  const latestBooks = books.filter(book => new Date(book.createdAt).getFullYear() >= 2023).length;

  const stats = [
    {
      icon: BookOpen,
      label: t('common.allBooks'),
      value: totalBooks.toLocaleString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+2 bu ay'
    },
    {
      icon: Download,
      label: t('book.downloads'),
      value: totalDownloads.toLocaleString(),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+1.2k bu hafta'
    },
    {
      icon: Star,
      label: 'Ortalama Puan',
      value: averageRating.toFixed(1),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      trend: '⭐ Excellent'
    },
    {
      icon: Users,
      label: t('common.authors'),
      value: uniqueAuthors.toString(),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'Çeşitli yazarlar'
    },
    {
      icon: Calendar,
      label: 'Yeni Kitaplar',
      value: latestBooks.toString(),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: '2023 ve sonrası'
    },
    {
      icon: TrendingUp,
      label: 'Aktif Kullanıcılar',
      value: '2.4k',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: '+15% bu ay'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">📊 Kütüphane İstatistikleri</h2>
        <div className="text-sm text-gray-500">
          Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="relative overflow-hidden rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
                </div>
                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                  <IconComponent size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Popular Categories */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">📚 Popüler Kategoriler</h3>
        <div className="flex flex-wrap gap-2">
          <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
            📖 Tefsir (47 kitap)
          </span>
          <span className="bg-secondary-100 text-secondary-700 px-3 py-1 rounded-full text-sm font-medium">
            📚 Hadis (41 kitap)
          </span>
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
            🌙 Tasavvuf (32 kitap)
          </span>
        </div>
      </div>
    </div>
  );
};

export default Stats;
