/**
 * Klasör adı → kategori slug (upload-books.js ile aynı mapping).
 */
export const CATEGORY_FOLDER_TO_SLUG: Record<string, string> = {
  'Beliefs and Theology': 'beliefs',
  'Biography': 'biography',
  "Children's Books": 'childrens-books',
  'Ethics': 'ethics',
  'Family and Social Relations': 'family',
  'Fiction': 'fiction',
  'Hadith': 'hadith',
  'History': 'history',
  'Imam Mahdi (a)': 'imam-mahdi',
  'Jurisprudence and Law': 'jurisprudence',
  'Mysticism and Irfan': 'mysticism',
  'Philosophy, Sociology, and Politics': 'philosophy',
  'Poetry, Ghazals and Elegies': 'poetry',
  'Quran and Exegesis': 'quran',
  'Self-Improvement': 'self-improvement',
  'Supplications and Ziyarahs': 'supplications',
  'Takfirism': 'takfirism',
  'The Infallibles (a)': 'infallibles',
};

export type BookBulkLanguage = 'tr' | 'en' | 'ru' | 'az';

const VALID_LANG = new Set<string>(['tr', 'en', 'ru', 'az']);

/** Kök klasör adından kitap dili (ör. en, tr). Tanınmazsa null → eski yapı veya yedek. */
export function folderNameToLanguage(name: string): BookBulkLanguage | null {
  const k = name.trim().toLowerCase();
  if (VALID_LANG.has(k)) return k as BookBulkLanguage;
  const aliases: Record<string, BookBulkLanguage> = {
    english: 'en',
    turkish: 'tr',
    türkçe: 'tr',
    russian: 'ru',
    azerbaijani: 'az',
    azərbaycan: 'az',
  };
  return aliases[k] ?? null;
}

export interface BookEntry {
  language: BookBulkLanguage;
  categoryFolder: string;
  categorySlug: string;
  bookFolder: string;
  title: string;
  author: string;
  files: {
    cover: File | null;
    pdf: File | null;
    epub: File | null;
    docx: File | null;
    rtf: File | null;
    /** Açıklama vb. (author.txt hariç) */
    txt: File | null;
    /** Yazar satırı: klasör adını & ile geçersiz kılar; içerikte & = çoklu yazar */
    authorTxt: File | null;
  };
}

/**
 * Seçilen klasör altındaki kitap klasörlerini (kitap/dosya) parse eder.
 * Dil ve kategori kullanıcı seçimiyle gelir; dosya yolundan okunmaz.
 */
export function parseFolderFilesWithSelection(
  fileList: File[],
  selection: { language: BookBulkLanguage; categoryName: string; categoryIdOrSlug: string }
): BookEntry[] {
  const map = new Map<string, BookFileBucket>();

  for (const file of fileList) {
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const parts = path.split('/').filter(Boolean);
    if (parts.length < 2) continue;

    const fileName = (parts[parts.length - 1] || '').toLowerCase();
    const bookFolderPath = parts.slice(0, -1).join('/');
    if (!bookFolderPath) continue;

    if (!map.has(bookFolderPath)) {
      map.set(bookFolderPath, {
        languageFolder: '',
        cover: null,
        pdf: null,
        epub: null,
        docx: null,
        rtf: null,
        txt: null,
        authorTxt: null,
      });
    }
    const entry = map.get(bookFolderPath)!;

    if (fileName.endsWith('.pdf')) entry.pdf = file;
    else if (fileName.endsWith('.epub')) entry.epub = file;
    else if (fileName.endsWith('.docx')) entry.docx = file;
    else if (fileName.endsWith('.doc') && !entry.docx) entry.docx = file;
    else if (fileName.endsWith('.rtf')) entry.rtf = file;
    else if (fileName === 'author.txt') entry.authorTxt = file;
    else if (fileName.endsWith('.txt')) entry.txt = file;
    else if (fileName.endsWith('.png')) entry.cover = file;
  }

  const result: BookEntry[] = [];
  for (const [bookFolderPath, files] of map) {
    if (!files.pdf || !files.cover) continue;
    const folderName = bookFolderPath.split('/').filter(Boolean).pop() || bookFolderPath;
    const { title, author } = parseBookFolderName(folderName);
    result.push({
      language: selection.language,
      categoryFolder: selection.categoryName,
      categorySlug: selection.categoryIdOrSlug,
      bookFolder: bookFolderPath,
      title,
      author,
      files: {
        cover: files.cover,
        pdf: files.pdf,
        epub: files.epub,
        docx: files.docx,
        rtf: files.rtf,
        txt: files.txt,
        authorTxt: files.authorTxt,
      },
    });
  }
  return result;
}

/**
 * Toplu yüklemede çoklu yazar: yalnızca & ile ayrılır (boşluk isteğe bağlı).
 * Örnek: "Ali Veli & Hasan" veya "Ali&Hasan"
 */
export function splitBulkAuthorNames(s: string): string[] {
  const t = (s || '').trim();
  if (!t) return [];
  return t
    .split(/\s*&\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** `author.txt` varsa UTF-8 metin `entry.author` üzerine yazar (klasör adındaki yazar yerine). */
export async function applyAuthorTxtOverrides(entries: BookEntry[]): Promise<void> {
  await Promise.all(
    entries.map(async (e) => {
      const f = e.files.authorTxt;
      if (!f) return;
      try {
        const t = (await f.text()).trim().replace(/\s+/g, ' ');
        if (t) e.author = t;
      } catch {
        /* yok say */
      }
    })
  );
}

/**
 * "Kitap Adı - Yazar Adı" formatındaki klasör adından başlık ve yazar çıkarır.
 * Yazar kısmında & varsa metin olduğu gibi kalır; API’ye göndermeden önce {@link splitBulkAuthorNames} ile ayrılır.
 */
export function parseBookFolderName(folderName: string): { title: string; author: string } {
  const lastDash = folderName.lastIndexOf(' - ');
  if (lastDash === -1) {
    return { title: folderName.trim(), author: 'Unknown Author' };
  }
  return {
    title: folderName.substring(0, lastDash).trim(),
    author: folderName.substring(lastDash + 3).trim(),
  };
}

/**
 * Dil/kategori/kitap yolu segmentlerini çıkarır.
 * Yeni: dil/kategori/kitap-klasörü/dosya (dil = en|tr|ru|az veya eşanlamlı).
 * Eski: kök/kategori/kitap-klasörü/dosya (dil yoksa language=en, languageFolder="").
 */
function pathSegmentsToBookLocation(
  parts: string[],
  fallbackLanguage: BookBulkLanguage
): {
  language: BookBulkLanguage;
  languageFolder: string;
  categoryFolder: string;
  bookFolder: string;
} | null {
  if (parts.length < 3) return null;
  const dirParts = parts.slice(0, -1);
  if (parts.length >= 4) {
    const fromLang = folderNameToLanguage(parts[0]);
    if (fromLang) {
      if (dirParts.length < 3) return null;
      return {
        language: fromLang,
        languageFolder: parts[0],
        categoryFolder: dirParts[1],
        bookFolder: dirParts.slice(2).join('/'),
      };
    }
    if (dirParts.length < 3) return null;
    return {
      language: fallbackLanguage,
      languageFolder: '',
      categoryFolder: dirParts[1],
      bookFolder: dirParts.slice(2).join('/'),
    };
  }
  // Tarayıcıda yalnızca dil klasörü seçildiğinde: Kategori/Kitap/dosya (3 segment)
  if (dirParts.length < 2) return null;
  return {
    language: fallbackLanguage,
    languageFolder: '',
    categoryFolder: dirParts[0],
    bookFolder: dirParts[1],
  };
}

type BookFileBucket = {
  languageFolder: string;
  cover: File | null;
  pdf: File | null;
  epub: File | null;
  docx: File | null;
  rtf: File | null;
  txt: File | null;
  authorTxt: File | null;
};

/**
 * Klasör seçildiğinde dönen File[] listesini kitap gruplarına ayırır.
 * Beklenen yapı: [dil]/KategoriKlasörü/KitapAdı - Yazar/dosyalar.
 * Eski: kök/Kategori/Kitap/dosyalar — dil `defaultLanguage` ile (varsayılan en).
 * Yalnızca dil klasörünü seçtiğinizde yol Kategori/Kitap/dosya olur; dil için `defaultLanguage` kullanılır.
 */
export function parseFolderFiles(
  fileList: File[],
  options?: { defaultLanguage?: BookBulkLanguage }
): BookEntry[] {
  const fallbackLanguage = options?.defaultLanguage ?? 'en';
  const map = new Map<
    BookBulkLanguage,
    Map<string, Map<string, BookFileBucket>>
  >();

  for (const file of fileList) {
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const parts = path.split('/').filter(Boolean);
    const loc = pathSegmentsToBookLocation(parts, fallbackLanguage);
    if (!loc) continue;

    const { language, languageFolder, categoryFolder, bookFolder } = loc;
    const name = (parts[parts.length - 1] || '').toLowerCase();

    if (!map.has(language)) {
      map.set(language, new Map());
    }
    const byLang = map.get(language)!;
    if (!byLang.has(categoryFolder)) {
      byLang.set(categoryFolder, new Map());
    }
    const books = byLang.get(categoryFolder)!;
    if (!books.has(bookFolder)) {
      books.set(bookFolder, {
        languageFolder,
        cover: null,
        pdf: null,
        epub: null,
        docx: null,
        rtf: null,
        txt: null,
        authorTxt: null,
      });
    }
    const entry = books.get(bookFolder)!;

    if (name.endsWith('.pdf')) entry.pdf = file;
    else if (name.endsWith('.epub')) entry.epub = file;
    else if (name.endsWith('.docx')) entry.docx = file;
    else if (name.endsWith('.doc') && !entry.docx) entry.docx = file;
    else if (name.endsWith('.rtf')) entry.rtf = file;
    else if (name === 'author.txt') entry.authorTxt = file;
    else if (name.endsWith('.txt')) entry.txt = file;
    else if (name.endsWith('.png')) entry.cover = file;
  }

  const result: BookEntry[] = [];
  for (const [language, byLang] of map) {
    for (const [categoryFolder, books] of byLang) {
      const categorySlug =
        CATEGORY_FOLDER_TO_SLUG[categoryFolder] ?? categoryFolder.toLowerCase().replace(/\s+/g, '-');
      for (const [bookFolder, bucket] of books) {
        if (!bucket.pdf || !bucket.cover) continue;
        const { title, author } = parseBookFolderName(bookFolder);
        result.push({
          language,
          categoryFolder,
          categorySlug,
          bookFolder,
          title,
          author,
          files: {
            cover: bucket.cover,
            pdf: bucket.pdf,
            epub: bucket.epub,
            docx: bucket.docx,
            rtf: bucket.rtf,
            txt: bucket.txt,
            authorTxt: bucket.authorTxt,
          },
        });
      }
    }
  }
  return result;
}
