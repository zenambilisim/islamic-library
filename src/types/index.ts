export interface Book {
  id: string;
  title: string;
  titleTranslations: {
    tr: string;
    en: string;
    ru: string;
    az: string;
  };
  author: string;
  authorTranslations: {
    tr: string;
    en: string;
    ru: string;
    az: string;
  };
  description: string;
  descriptionTranslations: {
    tr: string;
    en: string;
    ru: string;
    az: string;
  };
  coverImage: string;
  category: string;
  categoryTranslations: {
    tr: string;
    en: string;
    ru: string;
    az: string;
  };
  formats: {
    epub?: string;
    pdf?: string;
    doc?: string;
  };
  publishYear: number;
  pages: number;
  fileSize: string;
  downloadCount: number;
  tags: string[];
  language: 'tr' | 'en' | 'ru' | 'az';
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  nameTranslations: {
    tr: string;
    en: string;
    ru: string;
    az: string;
  };
  description: string;
  descriptionTranslations: {
    tr: string;
    en: string;
    ru: string;
    az: string;
  };
  bookCount: number;
  icon?: string;
}

export interface Author {
  id: string;
  name: string;
  nameTranslations: {
    tr: string;
    en: string;
    ru: string;
    az: string;
  };
  biography: string;
  biographyTranslations: {
    tr: string;
    en: string;
    ru: string;
    az: string;
  };
  photo?: string;
  bookCount: number;
  birthYear?: number;
  deathYear?: number;
}

export type Language = 'tr' | 'en' | 'ru' | 'az';

export interface SearchFilters {
  category?: string;
  author?: string;
  language?: Language;
}
