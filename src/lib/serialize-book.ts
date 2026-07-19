import type { Book } from '@/types';

/** RSC → client props: Date alanlarını ISO string'e çevir */
export type SerializedBook = Omit<Book, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export function serializeBook(book: Book): SerializedBook {
  return {
    ...book,
    createdAt:
      book.createdAt instanceof Date
        ? book.createdAt.toISOString()
        : String(book.createdAt),
    updatedAt:
      book.updatedAt instanceof Date
        ? book.updatedAt.toISOString()
        : String(book.updatedAt),
  };
}

/** Client tarafında string tarihleri Date'e çevir (gerekirse) */
export function deserializeBook(book: SerializedBook | Book): Book {
  return {
    ...book,
    createdAt:
      book.createdAt instanceof Date ? book.createdAt : new Date(book.createdAt),
    updatedAt:
      book.updatedAt instanceof Date ? book.updatedAt : new Date(book.updatedAt),
  };
}
