import type { Book, Category, Author } from '../types';

export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'Kuran-ı Kerim Meali',
    titleTranslations: {
      tr: 'Kuran-ı Kerim Meali',
      en: 'The Holy Quran Translation',
      ru: 'Священный Коран Перевод',
      az: 'Müqəddəs Quran Tərcüməsi'
    },
    author: 'Ali Bulaç',
    authorTranslations: {
      tr: 'Ali Bulaç',
      en: 'Ali Bulaç',
      ru: 'Али Булач',
      az: 'Əli Bulaç'
    },
    description: 'Kuran-ı Kerim\'in güncel Türkçe meali ve açıklamalı yorumu.',
    descriptionTranslations: {
      tr: 'Kuran-ı Kerim\'in güncel Türkçe meali ve açıklamalı yorumu.',
      en: 'Modern Turkish translation and commentary of the Holy Quran.',
      ru: 'Современный турецкий перевод и комментарий к Священному Корану.',
      az: 'Müqəddəs Quranın müasir türk tərcüməsi və şərhi.'
    },
    coverImage: '/images/books/deneme-kitap.png',
    category: 'tefsir',
    categoryTranslations: {
      tr: 'Tefsir',
      en: 'Exegesis',
      ru: 'Толкование',
      az: 'Təfsir'
    },
    formats: {
      epub: '/downloads/quran-meal.epub',
      pdf: '/downloads/quran-meal.pdf',
      doc: '/downloads/quran-meal.doc'
    },
    pages: 1024,
    fileSize: '15.2 MB',
    downloadCount: 25430,
    tags: ['Kuran', 'Meal', 'Tefsir', 'İslam'],
    language: 'tr',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-06-20')
  },
  {
    id: '2',
    title: 'Sahih-i Buhari',
    titleTranslations: {
      tr: 'Sahih-i Buhari',
      en: 'Sahih al-Bukhari',
      ru: 'Сахих аль-Бухари',
      az: 'Səhih əl-Buxari'
    },
    author: 'İmam Buhari',
    authorTranslations: {
      tr: 'İmam Buhari',
      en: 'Imam Bukhari',
      ru: 'Имам аль-Бухари',
      az: 'İmam Buxari'
    },
    description: 'İslam\'ın en sahih hadis kitaplarından biri olan Sahih-i Buhari\'nin Türkçe tercümesi.',
    descriptionTranslations: {
      tr: 'İslam\'ın en sahih hadis kitaplarından biri olan Sahih-i Buhari\'nin Türkçe tercümesi.',
      en: 'Turkish translation of Sahih al-Bukhari, one of the most authentic hadith collections in Islam.',
      ru: 'Турецкий перевод Сахих аль-Бухари, одной из самых достоверных коллекций хадисов в исламе.',
      az: 'İslamda ən səhih həzis kitablarından biri olan Səhih əl-Buxarinin türk tərcüməsi.'
    },
    coverImage: '/images/books/deneme-kitap.png',
    category: 'hadis',
    categoryTranslations: {
      tr: 'Hadis',
      en: 'Hadith',
      ru: 'Хадис',
      az: 'Həzis'
    },
    formats: {
      epub: '/downloads/sahih-buhari.epub',
      pdf: '/downloads/sahih-buhari.pdf'
    },
    pages: 2048,
    fileSize: '28.5 MB',
    downloadCount: 18720,
    tags: ['Hadis', 'Buhari', 'Sünnet', 'İslam'],
    language: 'tr',
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date('2023-07-15')
  },
  {
    id: '3',
    title: 'İhyau Ulumi\'d-Din',
    titleTranslations: {
      tr: 'İhyau Ulumi\'d-Din',
      en: 'Revival of the Religious Sciences',
      ru: 'Возрождение религиозных наук',
      az: 'Din Elmlərinin İhyası'
    },
    author: 'İmam Gazali',
    authorTranslations: {
      tr: 'İmam Gazali',
      en: 'Imam Al-Ghazali',
      ru: 'Имам аль-Газали',
      az: 'İmam Qəzali'
    },
    description: 'İslam tasavvuf ve ahlakının temel eserlerinden biri.',
    descriptionTranslations: {
      tr: 'İslam tasavvuf ve ahlakının temel eserlerinden biri.',
      en: 'One of the fundamental works of Islamic mysticism and ethics.',
      ru: 'Одно из основополагающих произведений исламского мистицизма и этики.',
      az: 'İslam təsəvvüf və əxlaqının əsas əsərlərindən biri.'
    },
    coverImage: '/images/books/deneme-kitap.png',
    category: 'tasavvuf',
    categoryTranslations: {
      tr: 'Tasavvuf',
      en: 'Sufism',
      ru: 'Суфизм',
      az: 'Təsəvvüf'
    },
    formats: {
      epub: '/downloads/ihya.epub',
      pdf: '/downloads/ihya.pdf',
      doc: '/downloads/ihya.doc'
    },
    pages: 1536,
    fileSize: '22.1 MB',
    downloadCount: 12850,
    tags: ['Tasavvuf', 'Gazali', 'Ahlak', 'Manevi'],
    language: 'tr',
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2023-08-10')
  },
  {
    id: '4',
    title: 'Riyazus Salihin',
    titleTranslations: {
      tr: 'Riyazus Salihin',
      en: 'Gardens of the Righteous',
      ru: 'Сады праведных',
      az: 'Əməlisalehlər bağları'
    },
    author: 'İmam Nevevi',
    authorTranslations: {
      tr: 'İmam Nevevi',
      en: 'Imam An-Nawawi',
      ru: 'Имам ан-Навави',
      az: 'İmam Nəvəvi'
    },
    description: 'Hadislerle süslenmiş ahlak ve adab kitabı.',
    descriptionTranslations: {
      tr: 'Hadislerle süslenmiş ahlak ve adab kitabı.',
      en: 'A book of ethics and etiquette adorned with hadiths.',
      ru: 'Книга этики и этикета, украшенная хадисами.',
      az: 'Həzislərlə bəzədilmiş əxlaq və ədəb kitabı.'
    },
    coverImage: '/images/books/deneme-kitap.png',
    category: 'hadis',
    categoryTranslations: {
      tr: 'Hadis',
      en: 'Hadith',
      ru: 'Хадис',
      az: 'Həzis'
    },
    formats: {
      epub: '/downloads/riyazus-salihin.epub',
      pdf: '/downloads/riyazus-salihin.pdf'
    },
    pages: 896,
    fileSize: '18.7 MB',
    downloadCount: 15240,
    tags: ['Hadis', 'Ahlak', 'Nevevi', 'Adab'],
    language: 'tr',
    createdAt: new Date('2023-04-12'),
    updatedAt: new Date('2023-09-05')
  },
  {
    id: '5',
    title: 'Tefsir-i Kebir',
    titleTranslations: {
      tr: 'Tefsir-i Kebir',
      en: 'The Great Commentary',
      ru: 'Великий комментарий',
      az: 'Böyük təfsir'
    },
    author: 'Fahreddin er-Razi',
    authorTranslations: {
      tr: 'Fahreddin er-Razi',
      en: 'Fakhr al-Din al-Razi',
      ru: 'Фахр ад-Дин ар-Рази',
      az: 'Fəxrəddin ər-Razi'
    },
    description: 'Kuran ayetlerinin en kapsamlı tefsirlerinden biri.',
    descriptionTranslations: {
      tr: 'Kuran ayetlerinin en kapsamlı tefsirlerinden biri.',
      en: 'One of the most comprehensive commentaries on Quranic verses.',
      ru: 'Один из самых всеобъемлющих комментариев к стихам Корана.',
      az: 'Quran ayələrinin ən geniş təfsirlərindən biri.'
    },
    coverImage: '/images/books/deneme-kitap.png',
    category: 'tefsir',
    categoryTranslations: {
      tr: 'Tefsir',
      en: 'Exegesis',
      ru: 'Толкование',
      az: 'Təfsir'
    },
    formats: {
      epub: '/downloads/tefsir-kebir.epub',
      pdf: '/downloads/tefsir-kebir.pdf',
      doc: '/downloads/tefsir-kebir.doc'
    },
    pages: 3200,
    fileSize: '45.8 MB',
    downloadCount: 8950,
    tags: ['Tefsir', 'Razi', 'Kuran', 'İlmi'],
    language: 'tr',
    createdAt: new Date('2023-01-20'),
    updatedAt: new Date('2023-07-30')
  },
  {
    id: '6',
    title: 'Fusus el-Hikem',
    titleTranslations: {
      tr: 'Fusus el-Hikem',
      en: 'The Bezels of Wisdom',
      ru: 'Геммы мудрости',
      az: 'Hikmət daşları'
    },
    author: 'İbn Arabi',
    authorTranslations: {
      tr: 'İbn Arabi',
      en: 'Ibn Arabi',
      ru: 'Ибн Араби',
      az: 'İbn Ərəbi'
    },
    description: 'Tasavvuf felsefesinin en derin eserlerinden.',
    descriptionTranslations: {
      tr: 'Tasavvuf felsefesinin en derin eserlerinden.',
      en: 'One of the deepest works of Sufi philosophy.',
      ru: 'Одно из самых глубоких произведений суфийской философии.',
      az: 'Təsəvvüf fəlsəfəsinin ən dərin əsərlərindən.'
    },
    coverImage: '/images/books/deneme-kitap.png',
    category: 'tasavvuf',
    categoryTranslations: {
      tr: 'Tasavvuf',
      en: 'Sufism',
      ru: 'Суфизм',
      az: 'Təsəvvüf'
    },
    formats: {
      epub: '/downloads/fusus-hikem.epub',
      pdf: '/downloads/fusus-hikem.pdf'
    },
    pages: 672,
    fileSize: '12.3 MB',
    downloadCount: 6780,
    tags: ['Tasavvuf', 'İbn Arabi', 'Felsefe', 'Hikmet'],
    language: 'tr',
    createdAt: new Date('2023-05-08'),
    updatedAt: new Date('2023-10-15')
  }
];

export const mockCategories: Category[] = [
  {
    id: 'tefsir',
    name: 'Tefsir',
    nameTranslations: {
      tr: 'Tefsir',
      en: 'Exegesis',
      ru: 'Толкование',
      az: 'Təfsir'
    },
    description: 'Kuran-ı Kerim ayetlerinin açıklaması ve yorumları',
    descriptionTranslations: {
      tr: 'Kuran-ı Kerim ayetlerinin açıklaması ve yorumları',
      en: 'Explanations and interpretations of Quranic verses',
      ru: 'Объяснения и толкования стихов Корана',
      az: 'Quran ayələrinin izahı və şərhi'
    },
    bookCount: 47,
    icon: '📖'
  },
  {
    id: 'hadis',
    name: 'Hadis',
    nameTranslations: {
      tr: 'Hadis',
      en: 'Hadith',
      ru: 'Хадис',
      az: 'Həzis'
    },
    description: 'Hz. Peygamber\'in sözleri, fiilleri ve takrirleri',
    descriptionTranslations: {
      tr: 'Hz. Peygamber\'in sözleri, fiilleri ve takrirleri',
      en: 'Sayings, actions and approvals of Prophet Muhammad',
      ru: 'Изречения, действия и одобрения Пророка Мухаммеда',
      az: 'Hz. Peyğəmbərin sözləri, əməlləri və təsdiqi'
    },
    bookCount: 41,
    icon: '📚'
  },
  {
    id: 'tasavvuf',
    name: 'Tasavvuf',
    nameTranslations: {
      tr: 'Tasavvuf',
      en: 'Sufism',
      ru: 'Суфизm',
      az: 'Təsəvvüf'
    },
    description: 'İslam\'ın manevi boyutu ve iç yolculuk',
    descriptionTranslations: {
      tr: 'İslam\'ın manevi boyutu ve iç yolculuk',
      en: 'The spiritual dimension of Islam and inner journey',
      ru: 'Духовное измерение ислама и внутреннее путешествие',
      az: 'İslamın mənəvi tərəfi və daxili səyahət'
    },
    bookCount: 32,
    icon: '🌙'
  }
];

export const mockAuthors: Author[] = [
  {
    id: '1',
    name: 'Ali Bulaç',
    nameTranslations: {
      tr: 'Ali Bulaç',
      en: 'Ali Bulaç',
      ru: 'Али Булач',
      az: 'Əli Bulaç'
    },
    biography: 'Çağdaş İslam düşünürü, yazar ve çevirmen.',
    biographyTranslations: {
      tr: 'Çağdaş İslam düşünürü, yazar ve çevirmen.',
      en: 'Contemporary Islamic thinker, writer and translator.',
      ru: 'Современный исламский мыслитель, писатель и переводчик.',
      az: 'Müasir İslam mütəfəkkiri, yazıçı və tərcüməçi.'
    },
    bookCount: 12,
    birthYear: 1951
  },
  {
    id: '2', 
    name: 'İmam Buhari',
    nameTranslations: {
      tr: 'İmam Buhari',
      en: 'Imam Bukhari',
      ru: 'Имам аль-Бухари',
      az: 'İmam Buxari'
    },
    biography: 'Büyük hadis alimi ve Sahih-i Buhari\'nin müellifi.',
    biographyTranslations: {
      tr: 'Büyük hadis alimi ve Sahih-i Buhari\'nin müellifi.',
      en: 'Great hadith scholar and author of Sahih al-Bukhari.',
      ru: 'Великий ученый-хадисовед и автор Сахих аль-Бухари.',
      az: 'Böyük həzis alimi və Səhih əl-Buxarinin müəllifi.'
    },
    bookCount: 8,
    birthYear: 810,
    deathYear: 870
  },
  {
    id: '3',
    name: 'İmam Gazali', 
    nameTranslations: {
      tr: 'İmam Gazali',
      en: 'Imam Al-Ghazali',
      ru: 'Имам аль-Газали',
      az: 'İmam Qəzali'
    },
    biography: 'İslam felsefesi ve tasavvufunun büyük ustası.',
    biographyTranslations: {
      tr: 'İslam felsefesi ve tasavvufunun büyük ustası.',
      en: 'Great master of Islamic philosophy and mysticism.',
      ru: 'Великий мастер исламской философии и мистицизма.',
      az: 'İslam fəlsəfəsi və təsəvvüfünün böyük ustası.'
    },
    bookCount: 15,
    birthYear: 1058,
    deathYear: 1111
  }
];
