import React from 'react';
import { DASHBOARD_SETTINGS_TABS } from '../../../data/dashboard';
import type { SettingsTabId } from '../../../types/dashboard';

interface SettingsComingSoonProps {
  activeTab: Extract<SettingsTabId, 'billing' | 'notifications'>;
}

const SettingsComingSoon: React.FC<SettingsComingSoonProps> = ({ activeTab }) => {
  const Icon = DASHBOARD_SETTINGS_TABS.find((tab) => tab.id === activeTab)?.icon;

  return (
    <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center h-80 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-400 rotate-3">
        {Icon ? <Icon size={28} /> : null}
      </div>
      <h3 className="font-bold text-lg text-gray-900 mb-2">Coming Soon</h3>
      <p className="text-sm text-gray-500 max-w-xs mx-auto">
        This section is currently under active development. Check back later!
      </p>
    </div>
  );
};

export default SettingsComingSoon;
