'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Loader2, LogOut } from 'lucide-react';
import type { Book, ReadingStatus } from '@/types';
import { useUserAuth } from '@/contexts/UserAuthContext';
import BookCard from '@/components/books/BookCard';

const TABS: ReadingStatus[] = ['want_to_read', 'reading', 'read'];

const MyLibraryPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useUserAuth();
  const [activeTab, setActiveTab] = useState<ReadingStatus>('want_to_read');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadList = useCallback(async (status: ReadingStatus) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/user/reading-list?status=${encodeURIComponent(status)}`,
        { credentials: 'include' }
      );
      if (res.status === 401) {
        router.replace(`/user/login?from=${encodeURIComponent('/library')}`);
        return;
      }
      const data = await res.json();
      const items = (data.items ?? []) as { book: Book }[];
      setBooks(items.map((i) => ({ ...i.book, createdAt: new Date(i.book.createdAt), updatedAt: new Date(i.book.updatedAt) })));
    } catch {
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/user/login?from=${encodeURIComponent('/library')}`);
      return;
    }
    void loadList(activeTab);
  }, [authLoading, user, activeTab, loadList, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('readingList.myLibrary')}</h1>
          {user?.email && (
            <p className="text-gray-600 mt-1">{user.email}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <LogOut size={18} />
          {t('userAuth.logout')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t(`readingList.status.${tab}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary-600" size={36} />
        </div>
      ) : books.length === 0 ? (
        <p className="text-center text-gray-600 py-16">{t('readingList.emptyList')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLibraryPage;
