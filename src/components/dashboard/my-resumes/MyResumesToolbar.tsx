import React from 'react';
import { FiGrid, FiList } from 'react-icons/fi';
import type { MyResumesSortBy, MyResumesToolbarProps } from '../../../types/dashboard';

const MyResumesToolbar: React.FC<MyResumesToolbarProps> = ({
  viewMode,
  sortBy,
  onViewModeChange,
  onSortByChange,
}) => (
  <div className="flex items-center justify-between mb-6 md:mb-8">
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onViewModeChange('grid')}
        className={`p-1.5 md:p-2 rounded-md transition-all ${
          viewMode === 'grid'
            ? 'bg-white shadow-sm text-black'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <FiGrid size={16} />
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`p-1.5 md:p-2 rounded-md transition-all ${
          viewMode === 'list'
            ? 'bg-white shadow-sm text-black'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <FiList size={16} />
      </button>
    </div>

    <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500">
      <span className="hidden sm:inline">Sort by:</span>
      <select
        value={sortBy}
        onChange={(event) => onSortByChange(event.target.value as MyResumesSortBy)}
        className="bg-transparent border-none outline-none text-black font-bold cursor-pointer"
      >
        <option value="updated_desc">Date Modified</option>
        <option value="name_asc">Name (A-Z)</option>
      </select>
    </div>
  </div>
);

export default MyResumesToolbar;
