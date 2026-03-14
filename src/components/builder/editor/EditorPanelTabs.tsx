import React from "react";
import { BUILDER_EDITOR_SECTION_TABS } from "../../../data/builder";
import { getActiveSkillItems } from "../../../types/resume";
import type { EditorPanelState } from "./useEditorPanelState";
import type { ResumeData } from "../../../types/resume";
import { handleHorizontalWheelScroll } from "./utils";

interface EditorPanelTabsProps {
  data: ResumeData;
  openSection: EditorPanelState["openSection"];
  toggle: EditorPanelState["toggle"];
}

const EditorPanelTabs: React.FC<EditorPanelTabsProps> = ({
  data,
  openSection,
  toggle,
}) => (
  <div
    className="shrink-0 border-b border-gray-100 bg-white overflow-x-auto overflow-y-hidden touch-pan-x"
    onWheel={handleHorizontalWheelScroll}
    style={{ scrollbarWidth: "none" }}
  >
    <div className="relative">
      <div className="pointer-events-none absolute -left-2 top-0 bottom-0 w-4 bg-white z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bgwhite z-10" />

      <div className="flex items-center gap-1 min-w-max px-3 py-2.5">
        {BUILDER_EDITOR_SECTION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = openSection === tab.id;

          const itemCount = tab.countField
            ? tab.countField === "skills"
              ? getActiveSkillItems(data.skills).length
              : data[tab.countField as keyof ResumeData] instanceof Array
                ? (data[tab.countField as keyof ResumeData] as unknown[]).length
                : undefined
            : undefined;

          return (
            <button
              key={tab.id}
              onClick={() => toggle(tab.id)}
              className={`
                relative inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full
                text-[11px] font-semibold transition-all duration-150 shrink-0
                ${
                  isActive
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }
              `}
            >
              <Icon size={11} />
              <span>{tab.label}</span>

              {typeof itemCount === "number" && itemCount > 0 && (
                <span
                  className={`
                    inline-flex items-center justify-center min-w-4 h-4 px-1
                    rounded-full text-[9px] font-bold leading-none
                    ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-500"
                    }
                  `}
                >
                  {itemCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

export default EditorPanelTabs;
