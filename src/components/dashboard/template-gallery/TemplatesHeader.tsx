import React from 'react';
import { FiSearch } from 'react-icons/fi';
import type { TemplatesHeaderProps } from '../../../types/dashboard';

const TemplatesHeader: React.FC<TemplatesHeaderProps> = ({
  searchQuery,
  onSearchQueryChange,
}) => (
  <header className="h-24 px-4 md:px-8 lg:px-12 flex items-center justify-between sticky top-0 z-40 bg-[#FDFDFD]/80 backdrop-blur-md border-b border-gray-100/70">
    <div>
      <h1 className="text-lg md:text-xl font-medium tracking-tight text-black">
        Template Gallery
      </h1>
      <p className="text-[10px] md:text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-0.5 block">
        Curated Designs
      </p>
    </div>

    <div className="group flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-gray-50 border border-gray-100 rounded-lg w-32 sm:w-48 md:w-64 focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all">
      <FiSearch
        className="text-gray-400 group-focus-within:text-black shrink-0"
        size={14}
      />
      <input
        type="text"
        placeholder="Find a style..."
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        className="bg-transparent border-none outline-none text-xs md:text-sm w-full text-black placeholder:text-gray-400"
      />
    </div>
  </header>
);

export default TemplatesHeader;
