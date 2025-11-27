import { useTranslation } from 'react-i18next';
import { Filter, X } from 'lucide-react';
import { mockCategories } from '../../data/mockData';
import type { SearchFilters, Language } from '../../types';

interface FilterSidebarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const FilterSidebar = ({ filters, onFiltersChange, isOpen, onToggle }: FilterSidebarProps) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as Language;

  const getLocalizedText = (translations: any, fallback: string) => {
    return translations[currentLang] || translations.tr || fallback;
  };

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({
      ...filters,
      category: filters.category === categoryId ? undefined : categoryId,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = filters.category;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Filter Toggle Button - Mobile */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed bottom-6 right-6 bg-primary-600 text-white p-3 rounded-full shadow-lg z-30"
      >
        <Filter size={24} />
      </button>

      {/* Sidebar */}
      <div className={`
        fixed md:sticky top-0 md:top-20 right-0 h-full md:h-fit md:max-h-[calc(100vh-6rem)]
        bg-white/90 backdrop-blur-lg shadow-2xl md:shadow-xl
        w-80 md:w-80 p-6 md:p-6
        transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0
        transition-all duration-500 ease-in-out
        z-50 md:z-10
        overflow-y-auto md:rounded-2xl md:border md:border-white/20
        bg-gradient-to-br from-white/95 to-blue-50/90
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-primary-500 to-purple-500 p-2 rounded-xl">
              <Filter size={20} className="text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">{t('search.filters')}</h3>
          </div>
          
          <div className="flex space-x-3">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 text-sm bg-red-100 text-red-600 hover:bg-red-200 font-medium rounded-lg transition-all duration-300"
              >
                {t('search.clearFilters')}
              </button>
            )}
            <button
              onClick={onToggle}
              className="lg:hidden p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="mb-8">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span>🏷️</span>
            <span>{t('search.filterByCategory')}</span>
          </h4>
          <div className="space-y-3">
            {mockCategories.map((category, index) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-center space-x-4 transform hover:scale-[1.02] ${
                  filters.category === category.id
                    ? 'bg-gradient-to-r from-primary-100 to-purple-100 text-primary-800 border-2 border-primary-300 shadow-lg'
                    : 'bg-white/70 hover:bg-white border-2 border-gray-100 hover:border-primary-200 hover:shadow-md'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="text-2xl">{category.icon}</div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">
                    {getLocalizedText(category.nameTranslations, category.name)}
                  </span>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-medium">
                      {category.bookCount} kitap
                    </span>
                  </div>
                </div>
                {filters.category === category.id && (
                  <div className="text-primary-600">✓</div>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

export default FilterSidebar;
