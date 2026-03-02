import React from 'react';
import {
  TEMPLATE_CATEGORY_FILTERS,
  type TemplateCategoryFilter,
} from '../../../domain/templates';
import type { TemplatesCategoryFiltersProps } from '../../../types/dashboard';

const TemplatesCategoryFilters: React.FC<TemplatesCategoryFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
}) => (
  <div className="flex items-center gap-2 mb-6 md:mb-10 overflow-x-auto pb-2 no-scrollbar">
    {TEMPLATE_CATEGORY_FILTERS.map((category) => (
      <button
        key={category}
        onClick={() => onSelectCategory(category as TemplateCategoryFilter)}
        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs font-medium transition-all duration-300 border whitespace-nowrap ${
          selectedCategory === category
            ? 'bg-black text-white border-black'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-black'
        }`}
      >
        {category}
      </button>
    ))}
  </div>
);

export default TemplatesCategoryFilters;
