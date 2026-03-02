import React from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import type { MyResumesHeaderProps } from '../../../types/dashboard';

const MyResumesHeader: React.FC<MyResumesHeaderProps> = ({
  resumeCount,
  searchQuery,
  onSearchChange,
  onCreateResume,
}) => (
  <header className="h-24 px-4 md:px-8 lg:px-12 flex items-center justify-between sticky top-0 z-40 bg-[#FDFDFD]/80 backdrop-blur-md border-b border-gray-100/70">
    <div>
      <h1 className="text-lg md:text-xl font-medium tracking-tight text-black">My Resumes</h1>
      <p className="text-[10px] md:text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-0.5 block">
        Library • {resumeCount} Items
      </p>
    </div>

    <div className="flex items-center gap-2 md:gap-4">
      <div className="group flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-gray-50 border border-gray-100 rounded-lg w-32 sm:w-48 md:w-64 focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all">
        <FiSearch className="text-gray-400 group-focus-within:text-black shrink-0" size={14} />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent border-none outline-none text-xs md:text-sm w-full text-black placeholder:text-gray-400"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <button
        onClick={onCreateResume}
        className="bg-black text-white px-3 py-2 md:p-2.5 rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 shrink-0 text-xs font-semibold inline-flex items-center gap-1.5"
      >
        <FiPlus size={16} className="md:w-5 md:h-5" />
        <span className="md:hidden">Create</span>
      </button>
    </div>
  </header>
);

export default MyResumesHeader;
