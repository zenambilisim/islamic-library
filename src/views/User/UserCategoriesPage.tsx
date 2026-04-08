'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';

const UserCategoriesPage = () => {
  const { categories, loading, error, refetch } = useSupabaseCategories();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    const ok = window.confirm(`“${name}” kategorisi silinsin mi?`);
    if (!ok) return;
    setActionError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Kategori silinemedi.');
    } finally {
      setDeletingId(null);
    }
  };

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
      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          {actionError}
        </div>
      )}

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
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-2 px-4 text-xl text-gray-700">{c.icon || '—'}</td>
                    <td className="py-2 px-4 font-medium text-gray-900">{c.name}</td>
                    <td className="py-2 px-4 text-gray-600 max-w-md truncate">{c.description || '—'}</td>
                    <td className="py-2 px-4 text-right text-gray-600 tabular-nums">{c.bookCount ?? 0}</td>
                    <td className="py-2 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/user/categories/${encodeURIComponent(c.id)}/edit`}
                          className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 inline-flex"
                          title="Düzenle"
                        >
                          <Pencil size={18} aria-hidden />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.name)}
                          disabled={deletingId !== null}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Sil"
                        >
                          {deletingId === c.id ? <span className="text-xs">Siliniyor...</span> : <Trash2 size={18} aria-hidden />}
                        </button>
                      </div>
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
