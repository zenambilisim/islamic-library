'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';

const UserCategoriesPage = () => {
  const { categories, loading, error } = useSupabaseCategories();

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kategoriler</h1>
        <Link
          href="/user/categories/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
        >
          Yeni Kategori Ekle
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">Kategoriler yükleniyor...</div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-gray-500">Henüz kategori yok.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-14">
                    İkon
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ad
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                    Kitap
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                    Düzenle
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-xl text-gray-700">{c.icon || '—'}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-md truncate">{c.description || '—'}</td>
                    <td className="py-3 px-4 text-right text-gray-600 tabular-nums">{c.bookCount ?? 0}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/user/categories/${encodeURIComponent(c.id)}/edit`}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-primary-600 hover:bg-primary-50"
                        title="Düzenle"
                      >
                        <Pencil size={18} aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCategoriesPage;
