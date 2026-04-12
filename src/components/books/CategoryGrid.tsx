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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <Folder size={22} strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {category.name}
            </h3>
            <p className="text-sm text-gray-500">
              {category.bookCount} kitap
            </p>
          </div>
        </div>
        <ArrowRight
          size={20}
          className="text-gray-400 group-hover:text-primary-600 group-hover:transform group-hover:translate-x-1 transition-all duration-300"
        />
      </div>

      <p className="text-gray-600 text-sm leading-relaxed mb-4">
        {category.description}
      </p>

      <div className="flex items-center text-primary-600 font-medium">
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
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('common.categories')}</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
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
