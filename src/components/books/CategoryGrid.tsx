import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen, Folder } from 'lucide-react';
import type { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
  onClick: (categoryId: string) => void;
}

const CategoryCard = ({ category, onClick }: CategoryCardProps) => {
  return (
    <div
      className="card hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={() => onClick(category.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Folder size={22} strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-ink transition-colors group-hover:text-accent">
              {category.name}
            </h3>
            <p className="text-sm text-ink-faint">
              {category.bookCount} kitap
            </p>
          </div>
        </div>
        <ArrowRight
          size={20}
          className="text-ink-faint transition-all duration-300 group-hover:translate-x-1 group-hover:transform group-hover:text-accent"
        />
      </div>

      <p className="mb-4 text-sm leading-relaxed text-ink-muted">
        {category.description}
      </p>

      <div className="flex items-center font-medium text-accent">
        <BookOpen size={16} className="mr-2" />
        <span>Kitapları Görüntüle</span>
      </div>
    </div>
  );
};

interface CategoryGridProps {
  categories: Category[];
  onCategorySelect: (categoryId: string) => void;
}

const CategoryGrid = ({ categories, onCategorySelect }: CategoryGridProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-4 font-display text-3xl font-semibold text-ink">{t('common.categories')}</h2>
        <p className="mx-auto max-w-2xl text-ink-muted">
          İslami kitapları kategorilere göre keşfedin. Her kategori farklı konularda derin bilgiler içerir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onClick={onCategorySelect}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;
