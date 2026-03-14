import React from 'react';
import { FiFileText } from 'react-icons/fi';

interface EditorPanelHeaderProps {
  activeSectionLabel: string;
}

const EditorPanelHeader: React.FC<EditorPanelHeaderProps> = ({
  activeSectionLabel,
}) => (
  <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-3.5">
    <div className="flex items-center justify-between">

      {/* Left — label + active section */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Icon badge */}
        <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
          <FiFileText size={13} className="text-white" />
        </div>

        <div className="min-w-0">
          <h2 className="text-[13px] font-bold text-gray-900 tracking-tight leading-none">
            Resume Content
          </h2>
          <p className="text-[10.5px] text-gray-400 mt-0.5 leading-none truncate">
            Editing <span className="text-gray-600 font-medium">{activeSectionLabel}</span>
          </p>
        </div>
      </div>

      {/* Right — section pill indicator */}
      <div className="shrink-0 ml-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
          {activeSectionLabel}
        </span>
      </div>
    </div>
  </div>
);

export default EditorPanelHeader;