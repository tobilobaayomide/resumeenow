import React from 'react';

const SettingsHeader: React.FC = () => (
  <header className="h-24 px-8 md:px-12 flex items-center justify-between sticky top-0 z-40 bg-[#F9FAFB]/90 backdrop-blur-md border-b border-gray-100/70">
    <div>
      <h1 className="text-xl font-medium tracking-tight text-black">Settings</h1>
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
        Preferences & Account
      </p>
    </div>
  </header>
);

export default SettingsHeader;
