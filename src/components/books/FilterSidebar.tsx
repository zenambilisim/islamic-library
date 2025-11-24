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
        bg-white shadow-xl md:shadow-sm
        w-80 md:w-72 p-6 md:p-4
        transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0
        transition-transform duration-300 ease-in-out
        z-50 md:z-10
        overflow-y-auto md:rounded-lg md:border md:border-gray-200
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('search.filters')}</h3>
          </div>
          
          <div className="flex space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('search.clearFilters')}
              </button>
            )}
            <button
              onClick={onToggle}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {t('search.filterByCategory')}
          </h4>
          <div className="space-y-2">
            {mockCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`w-full text-left p-2 rounded-lg transition-colors flex items-center space-x-3 ${
                  filters.category === category.id
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    {getLocalizedText(category.nameTranslations, category.name)}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({category.bookCount})
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

export default FilterSidebar;
