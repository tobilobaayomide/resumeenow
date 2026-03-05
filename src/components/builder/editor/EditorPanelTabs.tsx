import React from 'react';
import { BUILDER_EDITOR_SECTION_TABS } from '../../../data/builder';
import { getActiveSkillItems } from '../../../types/resume';
import type { EditorPanelState } from './useEditorPanelState';
import type { ResumeData } from '../../../types/resume';
import { handleHorizontalWheelScroll } from './utils';

interface EditorPanelTabsProps {
  data: ResumeData;
  openSection: EditorPanelState['openSection'];
  toggle: EditorPanelState['toggle'];
}

const EditorPanelTabs: React.FC<EditorPanelTabsProps> = ({
  data,
  openSection,
  toggle,
}) => (
  <div
    className="shrink-0 border-b border-[#E1E6EE] bg-[#FAFBFC] overflow-x-auto overflow-y-hidden touch-pan-x px-3 py-2"
    onWheel={handleHorizontalWheelScroll}
  >
    <div className="flex items-center gap-1.5 min-w-max">
      {BUILDER_EDITOR_SECTION_TABS.map((tab) => {
        const Icon = tab.icon;
        const itemCount = tab.countField
          ? tab.countField === 'skills'
            ? getActiveSkillItems(data.skills).length
            : data[tab.countField].length
          : undefined;
        return (
          <button
            key={tab.id}
            onClick={() => toggle(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition-colors border h-8 px-2.5 text-[11px] ${
              openSection === tab.id
                ? 'bg-[#1F2937] text-white border-[#1F2937]'
                : 'bg-white text-gray-600 border-[#E2E7EF] hover:border-[#CCD4E1] hover:text-gray-800'
            }`}
          >
            <Icon size={11} />
            <span>{tab.label}</span>
            {typeof itemCount === 'number' && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  openSection === tab.id
                    ? 'bg-white/15 text-white'
                    : 'bg-[#F7F9FC] text-gray-500 border border-[#E2E7EF]'
                }`}
              >
                {itemCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export default EditorPanelTabs;
