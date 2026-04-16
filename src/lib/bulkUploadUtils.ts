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
  /** Yeni yapıda webkitRelativePath’in dil segmenti; eski yapıda boş (dil alanına bakın). */
  languageFolder: string;
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
    txt: File | null;
  };
}

/**
 * "Kitap Adı - Yazar Adı" formatındaki klasör adından başlık ve yazar çıkarır.
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
      });
    }
    const entry = books.get(bookFolder)!;

    if (name.endsWith('.pdf')) entry.pdf = file;
    else if (name.endsWith('.epub')) entry.epub = file;
    else if (name.endsWith('.docx')) entry.docx = file;
    else if (name.endsWith('.doc') && !entry.docx) entry.docx = file;
    else if (name.endsWith('.rtf')) entry.rtf = file;
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
        const { languageFolder, ...files } = bucket;
        result.push({
          languageFolder,
          language,
          categoryFolder,
          categorySlug,
          bookFolder,
          title,
          author,
          files,
        });
      }
    }
  }
  return result;
}
