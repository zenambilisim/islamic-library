# Islamic Library — Mobil API Dokümantasyonu

Okuyucu mobil uygulaması (iOS / Android / React Native / Flutter) için HTTP API rehberi.

**Base URL:** `https://<PRODUCTION_DOMAIN>`  
Örnek local: `http://localhost:3000`

Tüm yollar `/api/...` altındadır. Content-Type (JSON body’lerde): `application/json`.

---

## 1. Kimlik doğrulama (Bearer)

Web sitesi cookie kullanır; **mobil uygulama JWT kullanmalıdır**.

### Akış

1. `POST /api/user/auth/login` veya `signup` → yanıtta `session` gelir  
2. Sakla: `session.access_token`, `session.refresh_token` (secure storage)  
3. Korumalı isteklerde header:

```http
Authorization: Bearer <access_token>
```

4. Access token süresi dolunca → `POST /api/user/auth/refresh`  
5. Logout: istemcide token’ları sil; isteğe bağlı `POST /api/user/auth/logout` (web cookie temizler)

Cookie (`sb-user-token`) mobilde gerekli değildir; gönderilse de Bearer önceliklidir.

---

## 2. Ortak veri modelleri

### Book

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | string (UUID) | Kitap id |
| `slug` | string? | URL segmenti; web: `/books/{slug}?lang=` |
| `title` | string | Başlık |
| `author` | string | Yazarlar (virgülle birleşik) |
| `authors` | string[]? | Yazar adları |
| `authorIds` | string[]? | Yazar UUID’leri |
| `description` | string | Açıklama |
| `coverImage` | string | Kapak URL veya path |
| `category` | string | Kategori adı |
| `categoryId` | string? | Kategori UUID |
| `categorySlug` | string? | Kategori slug |
| `formats` | `{ pdf?, epub?, doc? }` | Dosya path/URL |
| `pages` | number | Sayfa |
| `fileSize` | string | Boyut metni |
| `downloadCount` | number | İndirme sayısı |
| `language` | `tr` \| `en` \| `ru` \| `az` | Dil |
| `createdAt` / `updatedAt` | string (ISO) | Tarihler |

### Category

`id`, `slug`, `name`, `language`, `description`, `bookCount`

### Author

`id`, `name`, `language`, `biography`, `photo?`, `bookCount`, `birthYear?`, `deathYear?`

### ReadingStatus

`want_to_read` | `reading` | `read`

---

## 3. Katalog (auth yok)

### Kitap listesi

```http
GET /api/books?page=0&limit=20&language=tr&sortBy=uploadDate&withTotal=1
```

| Query | Açıklama |
|-------|----------|
| `page` | Sayfa (0 tabanlı, varsayılan `0`) |
| `limit` | 1–50 (varsayılan `20`) |
| `language` | `tr` \| `en` \| `ru` \| `az` |
| `category` | Kategori **slug** |
| `search` | Başlıkta kısmi arama |
| `sortBy` | `uploadDate` \| `alphabetical` \| `mostDownloaded` |
| `withTotal` | `1` → `total` alanı dolar |
| `ids` | Virgüllü UUID listesi (max 50); diğer filtreler yerine |

**Yanıt:** `{ books, total, hasMore }` (`ids` ile sadece `{ books }`)

### Tek kitap

```http
GET /api/books/{id}
```

**Yanıt:** Book objesi (sarmalayıcı yok) | `404`

### Kategoriler

```http
GET /api/categories?language=tr&search=
GET /api/categories/{id}
```

### Yazarlar

```http
GET /api/authors?language=tr&search=
GET /api/authors/by-id/{id}
GET /api/authors/by-id/{id}/books
GET /api/authors/{name}/books?language=tr
```

`name` URL-encode edilmeli.

---

## 4. İndirme / okuma dosyası

1. Kitaptan `formats.pdf` / `epub` / `doc` path’ini al  
2. İmzalı / proxy URL al:

```http
POST /api/books/signed-url
Content-Type: application/json

{ "pathOrUrl": "<formats.pdf değeri>" }
```

**Yanıt:** `{ "url": "..." }`  
- Absolute `http(s)` veya `/api/storage/r2/...` olabilir  
- Relative path’leri base URL ile birleştir

3. Dosyayı `GET {url}` ile indir / aç  
4. Sayacı artır (önerilir):

```http
POST /api/download-log
{ "bookId": "<uuid>", "format": "pdf" }
```

`format`: `pdf` | `epub` | `doc` (veya sunucunun kabul ettiği değer)

Kapak görselleri için `coverImage` çoğu zaman doğrudan yüklenebilir; gerekirse aynı `signed-url` akışı kullanılır.

---

## 5. Kullanıcı auth

### Kayıt

```http
POST /api/user/auth/signup
{ "email": "...", "password": "...", "displayName": "..." }
```

- `password` ≥ 6 karakter  
- `displayName` zorunlu  
- **Yanıt:** `{ user, session }`

### Giriş

```http
POST /api/user/auth/login
{ "email": "...", "password": "..." }
```

**Yanıt:** `{ user, session }` — `session.access_token`, `session.refresh_token`, `session.expires_at`

### Token yenile

```http
POST /api/user/auth/refresh
{ "refresh_token": "..." }
```

(`refreshToken` alias da kabul edilir.)

**Yanıt:** yeni `{ user, session }`

### Oturum / profil

```http
GET /api/user/session
Authorization: Bearer <access_token>
```

**Yanıt:** `{ user: { id, email, displayName, avatarUrl, bio } }`  
Token yok/geçersiz → `{ user: null }` (HTTP 200)

### Çıkış

```http
POST /api/user/auth/logout
```

Sunucu cookie temizler; mobilde asıl iş token’ları silmektir.

---

## 6. Okuma listesi (Bearer zorunlu)

### Liste / durum

```http
GET /api/user/reading-list
GET /api/user/reading-list?status=reading
GET /api/user/reading-list?bookId=<uuid>
GET /api/user/reading-list?bookIds=id1,id2
```

| Mod | Yanıt |
|-----|--------|
| (boş / `status`) | `{ items: [{ status, updatedAt, book }] }` |
| `bookId` | `{ bookId, status }` |
| `bookIds` | `{ statuses: { [bookId]: status \| null } }` |

### Durum kaydet

```http
PUT /api/user/reading-list
Authorization: Bearer <access_token>

{ "bookId": "<uuid>", "status": "want_to_read" }
```

### Listeden çıkar

```http
DELETE /api/user/reading-list?bookId=<uuid>
Authorization: Bearer <access_token>
```

**401** → token yok veya süresi dolmuş; refresh veya yeniden login.

---

## 7. Diğer public uçlar

### Kitap sohbeti (RAG)

```http
POST /api/chat
{
  "message": "...",
  "language": "tr",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

`message` max 2000 karakter.

**Yanıt:** `{ success: true, blocks: [...] }`  
Block örnekleri: `{ type: "text", content }` | `{ type: "books", bookIds: string[] }`

### İletişim formu

```http
POST /api/contact
{ "name", "email", "subject", "message" }
```

---

## 8. Örnek mobil akışlar

### Katalog tarama

```
GET /api/categories?language=tr
GET /api/books?language=tr&category=<slug>&page=0&limit=20&withTotal=1
GET /api/books/{id}
```

### İndir

```
GET /api/books/{id}
POST /api/books/signed-url  { pathOrUrl: book.formats.pdf }
GET  <url>   → dosya
POST /api/download-log  { bookId, format: "pdf" }
```

### Kütüphanem

```
POST /api/user/auth/login
PUT  /api/user/reading-list  { bookId, status: "reading" }   + Bearer
GET  /api/user/reading-list?status=reading                   + Bearer
```

### Token süresi

```
401 on reading-list/session
→ POST /api/user/auth/refresh { refresh_token }
→ yeni access_token ile retry
→ refresh de 401 ise login ekranı
```

---

## 9. Hata formatı

Çoğu endpoint: `{ "error": "mesaj" }` veya `{ "success": false, "message": "..." }`

| Kod | Anlam |
|-----|--------|
| 400 | Geçersiz istek |
| 401 | Auth gerekli / token geçersiz |
| 404 | Kayıt yok |
| 503 | Servis yapılandırılmamış (auth, chat, mail) |

---

## 10. Mobil uygulama kapsamı dışı

Aşağıdakiler **admin panel** içindir; okuyucu uygulamasına eklemeyin:

- `POST/PATCH/DELETE /api/books`, cover/files upload, bulk-delete  
- `POST/PATCH/DELETE /api/categories`, `/api/authors`  
- `/api/auth/*` (admin login), `/api/admin/*`  
- `/api/rtf-to-text`

---

## 11. Postman

Koleksiyon: [`docs/postman/Islamic-Library-Mobile.postman_collection.json`](./postman/Islamic-Library-Mobile.postman_collection.json)  
Ortam: [`docs/postman/Islamic-Library-Mobile.postman_environment.json`](./postman/Islamic-Library-Mobile.postman_environment.json)

1. Postman → **Import** → bu iki dosya  
2. Environment seç → `baseUrl` production domain’in  
3. **Auth → Login** çalıştır → `access_token` / `refresh_token` otomatik yazılır  
4. Bearer isteyen istekler `{{access_token}}` kullanır

---

## 12. Güvenlik notları

- Token’ları Keychain / Keystore / `expo-secure-store` ile saklayın  
- Production’da yalnızca HTTPS  
- Admin yazma API’lerini uygulamaya gömmeyin  
- Rate limit şu an sunucu tarafında zorunlu değil; chat ve login için istemci tarafında makul throttle uygulayın
