import React from 'react';

interface EditorPanelHeaderProps {
  activeSectionLabel: string;
}

const EditorPanelHeader: React.FC<EditorPanelHeaderProps> = ({
  activeSectionLabel,
}) => (
  <div className="border-b border-[#E1E6EE] shrink-0 bg-[#FAFBFC] px-3.5 pt-3.5 pb-3">
    <div>
      <h2 className="text-[14px] font-semibold text-gray-900 tracking-tight">
        Resume Content
      </h2>
      <p className="text-[11px] text-gray-500 mt-0.5">Editing {activeSectionLabel}</p>
    </div>
  </div>
);

export default EditorPanelHeader;
