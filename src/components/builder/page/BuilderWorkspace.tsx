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
  const isMobileEditor = mobileView === 'editor';
  const isMobilePreview = mobileView === 'preview';

  return (
  <div
    className={`
      relative isolate flex flex-1
      ${isMobilePreview ? 'min-h-0 overflow-hidden' : 'overflow-visible'}
      md:min-h-0 md:overflow-hidden
      print:block print:h-auto print:overflow-visible
    `}
  >
    <div
      className={`
        min-h-0 w-full ${isMobileEditor ? 'flex-1' : ''}
        lg:w-auto lg:flex-none
        ${mobileView === 'editor' ? 'flex' : 'hidden'}
        ${isEditorCollapsed ? 'lg:hidden' : 'lg:flex'}
      `}
    >
      <EditorPanel
      />
    </div>

    <div
      className={`
        relative min-w-0 flex-col
        bg-[#525659]
        ${mobileView === 'preview' ? 'flex min-h-0 flex-1 overflow-hidden' : 'hidden'}
        lg:flex lg:h-full lg:flex-1
        print:opacity-100 print:z-50 print:visible print:static print:block print:h-auto print:w-full print:m-0 print:bg-white print:overflow-visible
      `}
    >
      <div className="flex min-h-0 flex-1 w-full items-start justify-start overflow-auto px-2 pt-3 pb-24 touch-auto overscroll-contain sm:px-4 sm:pt-4 lg:justify-center lg:p-8 print:block print:h-auto print:overflow-visible print:p-0">
        <LivePreview
          data={resumeData}
          templateId={templateId}
          zoom={zoom}
          allowPan
        />
      </div>

      <div className="fixed right-4 bottom-4 z-50 md:absolute md:right-8 md:bottom-8 print:hidden">
        <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-xl border border-gray-200 p-1.5 flex gap-1">
          <button
            onClick={onZoomOut}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 active:scale-95 transition-transform"
          >
            -
          </button>
          <span className="w-12 flex items-center justify-center text-xs font-bold text-gray-500 tabular-nums">
            {`${Math.round(zoom * 100)}%`}
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
  </div>
  );
};

export default BuilderWorkspace;
