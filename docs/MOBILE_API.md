# Islamic Library — Mobil API Dokümantasyonu

Okuyucu mobil uygulaması (iOS / Android / React Native / Flutter) için HTTP API rehberi.

Hesap işlemleri (kayıt, profil, şifre, silme): [`MOBILE_API_ACCOUNT.md`](./MOBILE_API_ACCOUNT.md).

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
6. Şifre değiştirme: `POST /api/user/auth/change-password` (Bearer + mevcut/yeni şifre) → yanıtta yeni `session` gelir; token’ları güncelle  
7. Hesap silme: `POST /api/user/auth/delete` (Bearer + şifre) → ardından token’ları sil

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

### User (okuyucu profili)

`public.users` satırı. `GET /api/user/session` ve `PATCH /api/user/profile` bu şekli döner.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | string (UUID) | Auth kullanıcısı ile aynı id |
| `email` | string \| null | E-posta |
| `displayName` | string \| null | Kullanıcı adı (`display_name`) |
| `avatarUrl` | string \| null | Avatar URL (`avatar_url`) |
| `bio` | string \| null | Biyografi; kayıtta alınmaz, profil güncelleme ile yazılır (max 500) |

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

Alınan alanlar: **e-posta, şifre, kullanıcı adı.** `bio` kayıtta yoktur.

```http
POST /api/user/auth/signup
{ "email": "...", "password": "...", "displayName": "..." }
```

| Alan | Kurallar |
|------|----------|
| `email` | Zorunlu |
| `password` | Zorunlu, ≥ 6 karakter |
| `displayName` | Zorunlu; `public.users.display_name` olarak yazılır |

**Yanıt:** `{ user, session }` — `session.access_token`, `session.refresh_token`, `session.expires_at`  
Profil (`displayName`, `bio`, `avatarUrl`) için `GET /api/user/session` kullanın.

| Durum | Anlam |
|--------|--------|
| 200 | Hesap oluşturuldu, oturum açıldı |
| 400 | Alan eksik, şifre kısa veya e-posta zaten kayıtlı |
| 503 | Auth yapılandırılmamış |

### Giriş

Alınan alanlar: **e-posta ve şifre.**

```http
POST /api/user/auth/login
{ "email": "...", "password": "..." }
```

| Alan | Kurallar |
|------|----------|
| `email` | Zorunlu |
| `password` | Zorunlu |

**Yanıt:** `{ user, session }` — `session.access_token`, `session.refresh_token`, `session.expires_at`  
Profil için `GET /api/user/session`.

| Durum | Anlam |
|--------|--------|
| 200 | Oturum açıldı |
| 400 | E-posta veya şifre yok |
| 401 | E-posta veya şifre hatalı |
| 503 | Auth yapılandırılmamış |

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

**Yanıt:** `{ user }` — User modeli (`id`, `email`, `displayName`, `avatarUrl`, `bio`)  
Token yok/geçersiz → `{ user: null }` (HTTP 200)

### Profil güncelle (Bearer zorunlu)

```http
PATCH /api/user/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{ "displayName": "...", "bio": "..." }
```

| Alan | Kurallar |
|------|----------|
| `displayName` | Gönderilirse boş olamaz, max 80 karakter |
| `bio` | İsteğe bağlı; boş string gönderilirse silinir, max 500 karakter |

En az bir alan gönderilmeli.

**Yanıt:** `{ user }` — User modeli (`id`, `email`, `displayName`, `avatarUrl`, `bio`)

| Durum | Anlam |
|--------|--------|
| 200 | Güncellendi |
| 400 | Geçersiz / boş displayName veya body boş |
| 401 | Token yok veya geçersiz |
| 503 | Auth yapılandırılmamış |

### Çıkış

```http
POST /api/user/auth/logout
```

Sunucu cookie temizler; mobilde asıl iş token’ları silmektir.

### Şifre değiştir (Bearer zorunlu)

Mevcut şifre doğrulanır, yeni şifre yazılır. Yanıtta **yeni `session`** gelir; access/refresh token’ları bununla değiştirin.

```http
POST /api/user/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{ "currentPassword": "...", "newPassword": "..." }
```

| Alan | Kurallar |
|------|----------|
| `currentPassword` | Zorunlu; mevcut hesap şifresi |
| `newPassword` | Zorunlu, ≥ 6 karakter, mevcut şifreden farklı olmalı |

**Yanıt:** `{ ok: true, session }` — `session.access_token`, `session.refresh_token`, `session.expires_at`

| Durum | Anlam |
|--------|--------|
| 200 | Güncellendi; yeni token’ları saklayın |
| 400 | Şifre yok, kısa, aynı, veya hesap e-postası yok |
| 401 | Token yok/geçersiz veya mevcut şifre hatalı |
| 503 | Auth yapılandırılmamış |

### Hesap silme (Bearer zorunlu)

Kalıcıdır: okuma listesi, profil ve auth kaydı silinir; oturum kapatılır.

```http
POST /api/user/auth/delete
Authorization: Bearer <access_token>
Content-Type: application/json

{ "password": "..." }
```

| Durum | Yanıt |
|--------|--------|
| 200 | `{ "ok": true }` — token’ları istemciden silin |
| 400 | Şifre yok veya hesap e-postası yok — `{ "error": "..." }` |
| 401 | Token yok/geçersiz veya şifre hatalı |
| 503 | Auth yapılandırılmamış |

Başarılı yanıttan sonra `access_token` / `refresh_token` secure storage’dan silinmeli; kullanıcı login ekranına alınmalı.

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
PATCH /api/user/profile  { displayName, bio }                + Bearer
POST /api/user/auth/change-password  { currentPassword, newPassword }  + Bearer
→ session.access_token / refresh_token güncelle
```

### Hesap sil

```
POST /api/user/auth/delete  { password }   + Bearer
→ 200 { ok: true }
→ access_token / refresh_token sil
→ login ekranı
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
