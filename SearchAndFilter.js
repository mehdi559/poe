import React, { memo } from 'react';
import Input from './Input';

// Search and Filter Component
const SearchAndFilter = memo(({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  dateFilter,
  onDateFilterChange,
  categories,
  t
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label={t('search')}
          type="text"
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Rechercher dans les dépenses..."
          aria-label="Rechercher dans les dépenses"
        />
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('category')}
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            aria-label="Filtrer par catégorie"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Période
          </label>
          <select
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            aria-label="Filtrer par période"
          >
            <option value="all">Toutes les périodes</option>
            <option value="today">{t('today')}</option>
            <option value="week">{t('week')}</option>
            <option value="month">{t('month')}</option>
          </select>
        </div>
      </div>
    </div>
  );
});

export default SearchAndFilter; 