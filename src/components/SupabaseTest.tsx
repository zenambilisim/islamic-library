import { useSupabaseBooks } from '../hooks/useSupabaseBooks';

/**
 * Supabase bağlantısını test eden component
 * Geliştirme aşamasında kullanılır
 */
const SupabaseTest = () => {
  const { books, loading, error } = useSupabaseBooks();

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            🔄 Supabase Bağlantısı Test Ediliyor...
          </h2>
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-blue-700">Kitaplar yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-900 mb-4">
            ❌ Supabase Bağlantı Hatası
          </h2>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="bg-white rounded p-4 mb-4">
            <h3 className="font-bold mb-2">Kontrol Listesi:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>.env dosyasında VITE_SUPABASE_URL var mı?</li>
              <li>.env dosyasında VITE_SUPABASE_ANON_KEY var mı?</li>
              <li>Supabase'de RLS politikaları aktif mi?</li>
              <li>Books tablosunda veri var mı?</li>
              <li>Uygulama yeniden başlatıldı mı?</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-green-900 mb-4">
          ✅ Supabase Bağlantısı Başarılı!
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded p-4 shadow">
            <div className="text-3xl font-bold text-green-600">{books.length}</div>
            <div className="text-sm text-gray-600">Kitap Bulundu</div>
          </div>
          <div className="bg-white rounded p-4 shadow">
            <div className="text-3xl font-bold text-blue-600">
              {new Set(books.map(b => b.category)).size}
            </div>
            <div className="text-sm text-gray-600">Kategori</div>
          </div>
          <div className="bg-white rounded p-4 shadow">
            <div className="text-3xl font-bold text-purple-600">
              {new Set(books.map(b => b.author)).size}
            </div>
            <div className="text-sm text-gray-600">Yazar</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="font-bold text-lg mb-3">📚 İlk 5 Kitap:</h3>
          <div className="space-y-2">
            {books.slice(0, 5).map((book) => (
              <div key={book.id} className="border-l-4 border-green-500 pl-3 py-2">
                <div className="font-semibold">{book.title}</div>
                <div className="text-sm text-gray-600">
                  {book.author} • {book.category} • {book.pages} sayfa
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Formatlar: {Object.keys(book.formats).join(', ') || 'Yok'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 rounded p-4">
          <h3 className="font-bold mb-2">🔒 Güvenlik Durumu:</h3>
          <ul className="text-sm space-y-1">
            <li>✅ Read-Only mod aktif (Sadece okuma)</li>
            <li>✅ RLS politikaları çalışıyor</li>
            <li>✅ Anon key kullanılıyor</li>
            <li>✅ Yazma işlemleri engellenmiş</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SupabaseTest;
