# Islamic Library — Mobil hesap API

Okuyucu uygulaması için **kayıt, profil güncelleme, şifre değiştirme ve hesap silme**.

Katalog, indirme ve okuma listesi: [`MOBILE_API.md`](./MOBILE_API.md).

**Base URL:** `https://<PRODUCTION_DOMAIN>`  
Örnek local: `http://localhost:3000`

JSON body’lerde `Content-Type: application/json`.

---

## Auth (Bearer)

Kayıt dışındaki uçlar token ister.

```http
Authorization: Bearer <access_token>
```

`access_token` kayıt veya giriş yanıtındaki `session.access_token` değeridir. Secure storage’da tutun.

Cookie (`sb-user-token`) mobilde gerekli değildir.

---

## User modeli

`public.users` profili. `GET /api/user/session` ve `PATCH /api/user/profile` bu şekli döner.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | string (UUID) | Auth kullanıcısı ile aynı id |
| `email` | string \| null | E-posta |
| `displayName` | string \| null | Kullanıcı adı |
| `avatarUrl` | string \| null | Avatar URL |
| `bio` | string \| null | Biyografi (kayıtta yok; profil ile yazılır, max 500) |

---

## 1. Kayıt

Doğrulama e-postası gönderilmez; hesap hemen aktif olur ve oturum açılır.

```http
POST /api/user/auth/signup
Content-Type: application/json

{
  "email": "okuyucu@example.com",
  "password": "enaz6karakter",
  "displayName": "Okuyucu"
}
```

| Alan | Zorunlu | Kurallar |
|------|---------|----------|
| `email` | evet | Trim edilir |
| `password` | evet | En az 6 karakter |
| `displayName` | evet | Trim edilir; boş olamaz |
| `bio` | — | **Gönderilmez.** Sonradan profil güncelleme ile yazılır |

**200 yanıt:**

```json
{
  "user": { },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1730000000
  }
}
```

Kayıt yanıtındaki `user` Supabase Auth nesnesidir. Uygulama profili (`displayName`, `bio`) için hemen ardından `GET /api/user/session` çağırın.

Saklayın: `session.access_token`, `session.refresh_token`.

| Durum | Anlam |
|--------|--------|
| 200 | Hesap oluşturuldu, oturum açıldı |
| 400 | Alan eksik, şifre kısa veya e-posta zaten kayıtlı |
| 500 | Hesap oluştu ama oturum açılamadı — login deneyin |
| 503 | Auth yapılandırılmamış |

---

## 2. Profil oku

```http
GET /api/user/session
Authorization: Bearer <access_token>
```

**200:** `{ "user": { "id", "email", "displayName", "avatarUrl", "bio" } }`  
Token yok veya geçersiz: `{ "user": null }` (yine HTTP 200).

---

## 3. Profil güncelle

```http
PATCH /api/user/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "displayName": "Yeni ad",
  "bio": "Kısa bir not"
}
```

En az bir alan gönderilmeli. Gönderilmeyen alan değişmez.

| Alan | Kurallar |
|------|----------|
| `displayName` | Gönderilirse boş olamaz, max 80 karakter |
| `bio` | İsteğe bağlı; `""` gönderilirse silinir (`null`), max 500 karakter |

**Örnekler**

Sadece ad:

```json
{ "displayName": "Okuyucu" }
```

Sadece bio:

```json
{ "bio": "Hadis ve fıkıh okuyorum." }
```

Bio’yu sil:

```json
{ "bio": "" }
```

**200 yanıt:** `{ "user": { "id", "email", "displayName", "avatarUrl", "bio" } }`

| Durum | Anlam |
|--------|--------|
| 200 | Güncellendi |
| 400 | Body boş, `displayName` boş/geçersiz |
| 401 | Token yok veya süresi dolmuş |
| 503 | Auth yapılandırılmamış |

---

## 4. Şifre değiştir

Mevcut şifre doğrulanır. Yanıtta **yeni `session`** gelir; token’ları değiştirin.

```http
POST /api/user/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "eskiSifre",
  "newPassword": "yeniSifre6+"
}
```

| Alan | Kurallar |
|------|----------|
| `currentPassword` | Zorunlu |
| `newPassword` | Zorunlu, ≥ 6 karakter, mevcut şifreden farklı |

**200 yanıt:**

```json
{
  "ok": true,
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1730000000
  }
}
```

`session.access_token` ve `session.refresh_token` değerlerini secure storage’da eskisinin yerine yazın.

| Durum | Anlam |
|--------|--------|
| 200 | Güncellendi; yeni token’ları saklayın |
| 400 | Alan yok, yeni şifre kısa/aynı, veya hesap e-postası yok |
| 401 | Token yok/geçersiz veya mevcut şifre hatalı |
| 503 | Auth yapılandırılmamış |

---

## 5. Hesap sil

Kalıcıdır: okuma listesi, `public.users` profili ve auth kaydı silinir.

```http
POST /api/user/auth/delete
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "password": "mevcutSifre"
}
```

| Alan | Kurallar |
|------|----------|
| `password` | Zorunlu; mevcut hesap şifresi |

**200 yanıt:** `{ "ok": true }`

Ardından `access_token` / `refresh_token` silin, kullanıcıyı kayıt/giriş ekranına alın.

| Durum | Anlam |
|--------|--------|
| 200 | Silindi |
| 400 | Şifre yok veya hesap e-postası yok |
| 401 | Token yok/geçersiz veya şifre hatalı |
| 503 | Auth yapılandırılmamış |

---

## Hata formatı

```json
{ "error": "mesaj" }
```

Sık mesajlar:

| Mesaj | Ne zaman |
|--------|----------|
| `E-posta ve şifre gerekli.` | Kayıtta email/password yok |
| `Kullanıcı adı gerekli.` | Kayıt veya profilde boş `displayName` |
| `Şifre en az 6 karakter olmalı.` | Kayıt |
| `Bu e-posta adresi zaten kayıtlı.` | Kayıt |
| `displayName veya bio gerekli.` | Profil body boş |
| `Mevcut ve yeni şifre gerekli.` | Şifre değiştir |
| `Yeni şifre mevcut şifre ile aynı olamaz.` | Şifre değiştir |
| `Mevcut şifre hatalı.` | Şifre değiştir |
| `Şifre gerekli.` / `Şifre hatalı.` | Hesap sil |
| `Oturum açmanız gerekir.` | Bearer yok |
| `Oturum süresi dolmuş. Lütfen tekrar giriş yapın.` | Token geçersiz |

---

## Mobil akışlar

### Kayıt → profil

```
POST /api/user/auth/signup  { email, password, displayName }
→ access_token / refresh_token sakla
GET  /api/user/session                    + Bearer
PATCH /api/user/profile  { bio }          + Bearer
```

### Şifre değiştir

```
POST /api/user/auth/change-password  { currentPassword, newPassword }  + Bearer
→ session.access_token / refresh_token güncelle
```

### Hesap sil

```
POST /api/user/auth/delete  { password }  + Bearer
→ 200 { ok: true }
→ token’ları sil
→ kayıt / giriş ekranı
```

---

## Postman

Koleksiyon: [`docs/postman/Islamic-Library-Mobile.postman_collection.json`](./postman/Islamic-Library-Mobile.postman_collection.json)  
Ortam: [`docs/postman/Islamic-Library-Mobile.postman_environment.json`](./postman/Islamic-Library-Mobile.postman_environment.json)

Auth klasöründe: **Signup**, **Session (profile)**, **Update profile**, **Change password**, **Delete account**.
