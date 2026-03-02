import React from 'react';

const SettingsLoading: React.FC = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="h-10 w-10 bg-gray-200 rounded-full" />
      <div className="h-2 w-24 bg-gray-200 rounded-full" />
    </div>
  </div>
);

export default SettingsLoading;
