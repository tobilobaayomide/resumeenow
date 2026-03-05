import React from 'react';
import EditorPanel from '../editor/EditorPanel';
import LivePreview from '../preview/LivePreview';
import type { BuilderWorkspaceProps } from '../../../types/builder';
import { useBuilderStore } from '../../../store/builderStore';

const BuilderWorkspace: React.FC<BuilderWorkspaceProps> = ({
  mobileView,
  isEditorCollapsed,
  zoom,
  onZoomOut,
  onZoomIn,
}) => {
  const resumeData = useBuilderStore((store) => store.resumeData);
  const templateId = useBuilderStore((store) => store.templateId);

  return (
  <div className="flex flex-1 min-h-0 overflow-hidden relative isolate print:block print:h-auto print:overflow-visible">
    <div
      className={`
        w-full lg:w-auto
        ${mobileView === 'editor' ? 'flex' : 'hidden'}
        ${isEditorCollapsed ? 'lg:hidden' : 'lg:flex'}
      `}
    >
      <EditorPanel
      />
    </div>

    <div
      className={`
        flex-1 h-full relative bg-[#525659] flex-col min-w-0
        ${mobileView === 'preview' ? 'flex' : 'hidden'}
        lg:flex
        print:opacity-100 print:z-50 print:visible print:static print:block print:h-auto print:w-full print:m-0 print:bg-white print:overflow-visible
      `}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden lg:overflow-auto flex justify-center items-start pt-3 sm:pt-4 px-2 sm:px-4 lg:pt-8 lg:p-8 touch-pan-y w-full print:p-0 print:block print:h-auto print:overflow-visible">
        <LivePreview data={resumeData} templateId={templateId} zoom={zoom} />
      </div>

      <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 bg-white/90 backdrop-blur-sm rounded-full shadow-xl border border-gray-200 p-1.5 flex gap-1 z-50 print:hidden">
        <button
          onClick={onZoomOut}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 active:scale-95 transition-transform"
        >
          -
        </button>
        <span className="w-12 flex items-center justify-center text-xs font-bold text-gray-500 tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 active:scale-95 transition-transform"
        >
          +
        </button>
      </div>
    </div>
  </div>
  );
};

export default BuilderWorkspace;
