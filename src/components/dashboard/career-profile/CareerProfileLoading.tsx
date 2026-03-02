import React from 'react';

const CareerProfileLoading: React.FC = () => (
  <div className="flex-1 flex flex-col min-h-screen relative w-full overflow-hidden">
    <div className="h-48 md:h-64 bg-slate-50 border-b border-gray-200 animate-pulse">
      <div className="absolute bottom-0 left-0 w-full px-6 md:px-12 pb-4 md:pb-8 translate-y-1/2 flex items-end gap-4 md:gap-6">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-200 rounded-2xl border border-white" />
        <div className="mb-2 md:mb-4 space-y-2 md:space-y-3 w-2/3 md:w-1/3">
          <div className="h-6 md:h-8 bg-gray-200 rounded w-full" />
          <div className="h-3 md:h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>
    <div className="mt-16 md:mt-24 px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
      <div className="col-span-1 md:col-span-4 h-64 bg-gray-100 rounded-xl animate-pulse" />
      <div className="col-span-1 md:col-span-8 space-y-8">
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>
  </div>
);

export default CareerProfileLoading;
