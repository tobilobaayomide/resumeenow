import React from 'react';
import { DASHBOARD_SETTINGS_TABS } from '../../../data/dashboard';
import type { SettingsTabNavigationProps } from '../../../types/dashboard';

const SettingsTabNavigation: React.FC<SettingsTabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => (
  <nav className="w-full lg:w-64 shrink-0 space-y-1">
    <div className="flex lg:hidden overflow-x-auto pb-4 gap-2 no-scrollbar -mx-4 px-4 sticky top-0 bg-[#F9FAFB]/95 backdrop-blur z-20 pt-2">
      {DASHBOARD_SETTINGS_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
            activeTab === tab.id
              ? 'bg-black text-white border-black shadow-md'
              : 'bg-white text-gray-600 border-gray-200 shadow-sm'
          }`}
        >
          <tab.icon size={14} />
          {tab.label}
        </button>
      ))}
    </div>

    <div className="hidden lg:block sticky top-8">
      <div className="relative">
        {DASHBOARD_SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full group flex items-start gap-4 px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${
              activeTab === tab.id ? 'bg-white shadow-sm ring-1 ring-gray-200' : 'hover:bg-gray-100/50'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 transition-colors ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-500 group-hover:text-black'
              }`}
            >
              <tab.icon size={18} />
            </div>
            <div className="text-left">
              <span
                className={`block text-sm font-bold ${
                  activeTab === tab.id ? 'text-black' : 'text-gray-600 group-hover:text-black'
                }`}
              >
                {tab.label}
              </span>
              <span className="block text-xs text-gray-400 mt-0.5">{tab.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  </nav>
);

export default SettingsTabNavigation;
