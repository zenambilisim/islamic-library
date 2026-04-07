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

export interface BookEntry {
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

const COVER_EXT = ['.png', '.jpg', '.jpeg'];

/**
 * Klasör seçildiğinde dönen File[] listesini kitap gruplarına ayırır.
 * Beklenen yapı: KategoriKlasörü/KitapAdı - Yazar/dosyalar
 */
export function parseFolderFiles(fileList: File[]): BookEntry[] {
  const map = new Map<
    string,
    Map<
      string,
      {
        cover: File | null;
        pdf: File | null;
        epub: File | null;
        docx: File | null;
        rtf: File | null;
        txt: File | null;
      }
    >
  >();

  for (const file of fileList) {
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const parts = path.split('/');
    if (parts.length < 3) continue;
    const categoryFolder = parts[1];
    const bookFolder = parts[2];
    const name = (parts[parts.length - 1] || '').toLowerCase();

    if (!map.has(categoryFolder)) {
      map.set(categoryFolder, new Map());
    }
    const books = map.get(categoryFolder)!;
    if (!books.has(bookFolder)) {
      books.set(bookFolder, {
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
    else if (name.endsWith('.docx') || name.endsWith('.doc')) entry.docx = file;
    else if (name.endsWith('.rtf')) entry.rtf = file;
    else if (name.endsWith('.txt')) entry.txt = file;
    else if (COVER_EXT.some((ext) => name.endsWith(ext))) entry.cover = file;
  }

  const result: BookEntry[] = [];
  for (const [categoryFolder, books] of map) {
    const categorySlug = CATEGORY_FOLDER_TO_SLUG[categoryFolder] ?? categoryFolder.toLowerCase().replace(/\s+/g, '-');
    for (const [bookFolder, files] of books) {
      if (!files.pdf || !files.cover) continue;
      const { title, author } = parseBookFolderName(bookFolder);
      result.push({
        categoryFolder,
        categorySlug,
        bookFolder,
        title,
        author,
        files,
      });
    }
  }
  return result;
}
