# Hikme Sohbet (RAG) Kurulum Rehberi

Bu rehber, kütüphanedeki kitaplara dayalı **Hikme AI sohbet** özelliğini çalıştırmak için yapmanız gereken tüm adımları anlatır.

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Ön Koşullar](#ön-koşullar)
- [Adım 1 — Supabase tabloları](#adım-1--supabase-tabloları)
- [Adım 2 — SQL kurulumu](#adım-2--sql-kurulumu)
- [Adım 3 — Ortam değişkenleri](#adım-3--ortam-değişkenleri)
- [Adım 4 — Kitapları indexleme](#adım-4--kitapları-indexleme)
- [Adım 5 — Sohbeti test etme](#adım-5--sohbeti-test-etme)
- [Adım 6 — Production](#adım-6--production)
- [Yeni kitap yüklendiğinde](#yeni-kitap-yüklendiğinde)
- [Sorun Giderme](#sorun-giderme)
- [Maliyet notları](#maliyet-notları)
- [Kontrol listesi](#kontrol-listesi)

---

## Genel Bakış

Hikme sohbeti şu akışla çalışır:

```mermaid
flowchart LR
  A[PDF dosyaları] --> B[index-books.mjs]
  B --> C[Metin parçaları + embedding]
  C --> D[(book_file_chunks)]
  E[Kullanıcı sorusu] --> F[/api/chat]
  F --> G[Soru embedding]
  G --> H[match_book_chunks]
  H --> I[İlgili parçalar]
  I --> J[ChatGPT cevap]
  J --> K[Hikme paneli]
```

| Bileşen | Dosya / Konum |
|---------|----------------|
| Indexleme script'i | `scripts/index-books.mjs` |
| SQL kurulumu | `docs/rag-setup.sql` |
| Chat API | `src/app/api/chat/route.ts` |
| RAG mantığı | `src/lib/chat-rag.ts` |
| Sohbet arayüzü | `src/components/chat/HikmeChatPanel.tsx` |

**Özet:** Önce kitapların PDF metinleri parçalanıp vektör olarak kaydedilir. Kullanıcı soru sorduğunda en benzer parçalar bulunur ve ChatGPT yalnızca bu kaynaklara dayanarak cevap verir.

---

## Ön Koşullar

- Proje kökünde `.env` dosyası
- Supabase projesi (kitaplar ve `book_files` tabloları dolu)
- Kitap dosyaları R2 veya Supabase Storage'da erişilebilir
- OpenAI hesabı ve API anahtarı
- **Node.js 20+** (PDF metin çıkarma için önerilir; 18'de `@napi-rs/canvas` gerekir)

Bağımlılıklar projede zaten tanımlı:

```bash
npm install
```

---

## Adım 1 — Supabase tabloları

Aşağıdaki yapıların Supabase'de mevcut olduğundan emin olun.

### `book_file_chunks` tablosu

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid | Birincil anahtar |
| `book_id` | uuid | `books.id` referansı |
| `book_file_id` | uuid | `book_files.id` referansı |
| `page_number` | int | PDF sayfa numarası |
| `chunk_index` | int | Sayfa içi parça sırası |
| `content` | text | Parça metni |
| `embedding` | vector(1536) | OpenAI embedding |
| `created_at` | timestamptz | Oluşturulma zamanı |

### `book_files` tablosuna eklenen sütunlar

| Sütun | Tip | Değerler |
|-------|-----|----------|
| `indexing_status` | text | `pending`, `processing`, `completed`, `failed` |
| `content_hash` | text | Dosya SHA-256 özeti (değişiklik takibi) |
| `indexed_at` | timestamptz | Son indexleme zamanı |

`embedding` sütunu **mutlaka** `vector(1536)` tipinde olmalıdır (`text-embedding-3-small` modeli).

---

## Adım 2 — SQL kurulumu

Kurulum **iki parça**: fonksiyon (hızlı) + vektör indeksi (yavaş).

### 2a — Fonksiyon (SQL Editor)

1. [Supabase Dashboard](https://supabase.com/dashboard) → projeniz → **SQL Editor**
2. `docs/rag-setup.sql` içeriğini çalıştırın (birkaç saniye sürer)

Bu script:

- `pgvector` eklentisini etkinleştirir
- `match_book_chunks` fonksiyonunu tanımlar

### 2b — Vektör indeksi (psql, zorunlu)

`book_file_chunks` tablosu büyükse indeks oluşturma **dakikalar** sürebilir. SQL Editor `upstream timeout` verir; **doğrudan veritabanı bağlantısı** kullanın:

1. Dashboard → **Project Settings** → **Database** → **Connection string**
2. **Session pooler**, port **5432** (URI'yi olduğu gibi kopyalayın)
3. **Direct connection kullanmayın** — `db.*.supabase.co` birçok projede yalnızca IPv6'dır; ev/ISP ağında `Network is unreachable` verir
4. Proje kökünde (Dashboard'dan kopyaladığınız URI ile):

```bash
psql "postgresql://postgres.[REF]:[ŞİFRE]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
  -f docs/rag-setup-index.sql
```

İndeks bitince `analyze` otomatik çalışır. Chunk sayısına göre 2–30+ dakika bekleyebilirsiniz.

### Doğrulama

SQL Editor'da:

```sql
-- pgvector aktif mi?
select * from pg_extension where extname = 'vector';

-- Fonksiyon var mı?
select proname from pg_proc where proname = 'match_book_chunks';

-- HNSW indeksi var mı?
select indexname, indexdef from pg_indexes where tablename = 'book_file_chunks';

-- Kaç chunk?
select count(*) from book_file_chunks;
```

`indexdef` içinde `USING hnsw (embedding vector_cosine_ops)` görünmeli.

---

## Adım 3 — Ortam değişkenleri

Proje kökündeki `.env` dosyasına ekleyin (örnek: `.env.example`):

```bash
# Zaten var — chat için de gerekli
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Chat + indexleme için zorunlu
OPENAI_API_KEY=sk-...

# PDF dosyaları R2'deyse (çoğu kurulumda gerekli)
R2_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
R2_BUCKET_NAME=islamic-library
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

| Değişken | Indexleme | Chat | Nereden alınır |
|----------|:---------:|:----:|----------------|
| `SUPABASE_URL` | ✅ | ✅ | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | Supabase → Settings → API → service_role |
| `OPENAI_API_KEY` | ✅ | ✅ | [platform.openai.com](https://platform.openai.com/api-keys) |
| `R2_*` | ✅ | — | Cloudflare R2 (dosyalar R2'deyse) |

> **Güvenlik:** `SUPABASE_SERVICE_ROLE_KEY` ve `OPENAI_API_KEY` yalnızca sunucu tarafında kullanılır. Asla `NEXT_PUBLIC_` önekiyle veya tarayıcıya göndermeyin.

Production ortamında (Vercel, VPS vb.) aynı değişkenleri deployment paneline de ekleyin.

---

## Adım 4 — Kitapları indexleme

Indexleme, PDF'lerden metin çıkarır, parçalara böler ve OpenAI ile embedding üretir.

### İlk test (önerilir)

```bash
# Kaç dosya bekliyor — DB'ye yazmaz
npm run index:books:dry-run

# İlk 3 PDF ile dene
node scripts/index-books.mjs --limit=3
```

### Tüm bekleyen kitaplar

```bash
npm run index:books
```

### Diğer komutlar

| Komut | Açıklama |
|-------|----------|
| `node scripts/index-books.mjs --book-id=<uuid>` | Tek kitabın PDF'ini indexle |
| `node scripts/index-books.mjs --retry-failed` | `failed` durumundakileri tekrar dene |
| `node scripts/index-books.mjs --force` | Hash aynı olsa bile yeniden indexle |
| `node scripts/index-books.mjs --dry-run` | Sadece simülasyon |

### Indexleme sırasında durumlar

| `indexing_status` | Anlam |
|-------------------|-------|
| `pending` | Henüz işlenmedi |
| `processing` | Şu an işleniyor |
| `completed` | Başarıyla indexlendi |
| `failed` | Hata oluştu (log: `scripts/logs/`) |

### Başarı kontrolü

```sql
-- Indexlenmiş parça sayısı
select count(*) from book_file_chunks;

-- Kitap başına parça sayısı
select book_id, count(*) as chunks
from book_file_chunks
group by book_id
order by chunks desc
limit 10;

-- Tamamlanan dosyalar
select count(*) from book_files where indexing_status = 'completed';
```

---

## Adım 5 — Sohbeti test etme

### Yerel geliştirme

```bash
npm run dev
```

Tarayıcıda siteyi açın → sağdaki **Hikme** paneli → bir soru yazın.

Örnek sorular:

- «Namaz hakkında ne okumalıyım?»
- «Yeni başlayan için hangi kitapları önerirsin?»
- «Fatiha suresinin ilk ayetini açıkla.»

Beklenen davranış:

- Cevap metin olarak gelir
- Altta ilgili kitap kartları görünür
- Kitap kartına tıklayınca detay modalı açılır

### API'yi doğrudan test

```bash
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Namaz hakkında ne okumalıyım?","language":"tr"}' | jq
```

Başarılı yanıt örneği:

```json
{
  "success": true,
  "blocks": [
    { "type": "text", "content": "..." },
    { "type": "books", "bookIds": ["uuid-1", "uuid-2"] }
  ]
}
```

### Henüz index yoksa

Chat çalışır ancak şu mesajı döner:

> «Bu soru için kütüphanede henüz indekslenmiş bir pasaj bulamadım…»

Bu durumda [Adım 4](#adım-4--kitapları-indexleme)'ü tamamlayın.

---

## Adım 6 — Production

1. `.env` değişkenlerini hosting paneline ekleyin (`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, vb.)
2. Uygulamayı deploy edin (`npm run build` → `npm start` veya mevcut deploy akışınız)
3. **Indexleme script'ini production sunucusunda veya yerel makinenizden çalıştırın** — deploy sonrası otomatik çalışmaz; kitap eklendikçe manuel veya cron ile tetiklemeniz gerekir

Örnek cron (her gece 03:00):

```cron
0 3 * * * cd /path/to/islamicLibrary && npm run index:books >> /var/log/index-books.log 2>&1
```

---

## Yeni kitap yüklendiğinde

Admin panelinden veya bulk upload ile yeni PDF eklendiğinde:

1. `book_files` kaydında `indexing_status = 'pending'` olmalı
2. Index script'ini çalıştırın:

```bash
npm run index:books
```

İsteğe bağlı — Supabase'de varsayılan değer:

```sql
alter table book_files alter column indexing_status set default 'pending';
```

---

## Sorun Giderme

### «Chat service is not configured» (503)

- `.env` içinde `OPENAI_API_KEY` ve `SUPABASE_SERVICE_ROLE_KEY` tanımlı mı?
- Sunucuyu yeniden başlatın (`npm run dev` veya production restart)

### «Şu anda cevap üretilemedi»

- Terminal / sunucu loglarında `[api/chat]` satırlarına bakın
- OpenAI API anahtarı geçerli mi, kota var mı?
- `match_book_chunks` fonksiyonu Supabase'de var mı?

### «İndekslenmiş pasaj bulunamadı»

- `book_file_chunks` tablosu boş olabilir → indexleme çalıştırın
- Soruyu farklı kelimelerle deneyin
- `indexing_status = 'completed'` olan PDF var mı kontrol edin

### Indexleme `failed` oluyor

- `scripts/logs/index-books-YYYY-MM-DD.log` dosyasına bakın
- R2 bilgileri doğru mu? PDF indirilebiliyor mu?
- `DOMMatrix is not defined` hatası → Node.js 20+ kullanın veya:

```bash
npm install @napi-rs/canvas
```

### `Vektör araması başarısız` / `statement timeout` / SQL Editor `upstream timeout`

- **SQL Editor timeout:** İndeks oluşturmayı Editor'da değil, `docs/rag-setup-index.sql` dosyasını **psql** ile çalıştırın (bkz. [Adım 2b](#2b--vektör-indeksi-psql-zorunlu)).
- `docs/rag-setup.sql` yalnızca fonksiyonu kurar; indeks olmadan arama yavaş kalır.
- İndeks, indexleme **bittikten sonra** oluşturulmalı (boş tabloda oluşan indeks işe yaramaz).

### Index çok yavaş / pahalı

- `--limit=10` ile küçük gruplar halinde çalıştırın
- OpenAI embedding maliyeti kitap sayısına bağlıdır (bkz. [Maliyet notları](#maliyet-notları))

---

## Maliyet notları

OpenAI kullanımı (yaklaşık):

| İşlem | Model | Ne zaman |
|-------|-------|----------|
| Indexleme | `text-embedding-3-small` | Her PDF parçası için (bir kez) |
| Sohbet | `gpt-4o-mini` | Her kullanıcı sorusu |
| Soru arama | `text-embedding-3-small` | Her kullanıcı sorusu |

Indexleme tek seferliktir; aynı PDF değişmedikçe tekrar ücretlendirilmez (`content_hash` kontrolü).

---

## Kontrol listesi

Kurulumu tamamladığınızda şunların hepsi ✅ olmalı:

- [ ] `book_file_chunks` tablosu ve `book_files` index sütunları Supabase'de mevcut
- [ ] `docs/rag-setup.sql` çalıştırıldı (`match_book_chunks` fonksiyonu var)
- [ ] `.env` içinde `OPENAI_API_KEY` ve `SUPABASE_SERVICE_ROLE_KEY` tanımlı
- [ ] R2 veya Supabase Storage erişimi çalışıyor
- [ ] `npm run index:books` en az bir kitap için `completed` üretti
- [ ] `select count(*) from book_file_chunks` > 0
- [ ] `npm run dev` ile Hikme panelinden soru sorulduğunda cevap geliyor
- [ ] Production ortamında aynı env değişkenleri tanımlı

---

## İlgili dosyalar

| Dosya | Açıklama |
|-------|----------|
| `docs/rag-setup.sql` | Supabase SQL kurulumu |
| `scripts/index-books.mjs` | PDF indexleme script'i |
| `src/app/api/chat/route.ts` | Chat API endpoint |
| `src/lib/chat-rag.ts` | Embedding + arama + GPT mantığı |
| `.env.example` | Gerekli ortam değişkenleri şablonu |

Sorularınız için proje içi diğer rehberlere de bakabilirsiniz: `docs/BULK-BOOK-UPLOAD-GUIDE.md`, `docs/DEPLOYMENT-GUIDE.md`.
