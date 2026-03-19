import React, { useEffect, useState } from 'react';
import { PREVIEW_RESUME_DATA } from '../../../domain/resume';
import type { TemplateModalPreviewProps } from '../../../types/dashboard';
import ScaledResumePreview from '../shared/ScaledResumePreview';
import { PAGE_WIDTH_PX } from '../../builder/preview/HtmlTemplateDocument';

const DESKTOP_PREVIEW_ZOOM = 0.68;
const MOBILE_SIDE_GUTTER_PX = 40;
const MIN_MOBILE_PREVIEW_ZOOM = 0.34;
const CARD_PREVIEW_ZOOM = 0.36;

const TemplateModalPreview: React.FC<TemplateModalPreviewProps> = ({
  templateId,
  mode = 'modal',
}) => {
  const [previewZoom, setPreviewZoom] = useState(
    mode === 'card' ? CARD_PREVIEW_ZOOM : DESKTOP_PREVIEW_ZOOM,
  );

  useEffect(() => {
    if (mode === 'card') {
      setPreviewZoom(CARD_PREVIEW_ZOOM);
      return;
    }

    const updatePreviewZoom = () => {
      const availableWidth = Math.max(
        0,
        window.innerWidth - MOBILE_SIDE_GUTTER_PX,
      );
      const widthBoundZoom = availableWidth / PAGE_WIDTH_PX;

      setPreviewZoom(
        Math.min(
          DESKTOP_PREVIEW_ZOOM,
          Math.max(MIN_MOBILE_PREVIEW_ZOOM, widthBoundZoom),
        ),
      );
    };

    updatePreviewZoom();
    window.addEventListener('resize', updatePreviewZoom);
    return () => window.removeEventListener('resize', updatePreviewZoom);
  }, [mode]);

  const containerClassName =
    mode === 'card'
      ? 'relative flex h-full w-full items-start justify-center overflow-hidden bg-white'
      : 'relative flex min-h-[70vh] w-full items-start justify-center overflow-auto bg-linear-to-b from-white to-gray-50 md:min-h-0 md:overflow-visible';

  const scaleWrapperClassName =
    mode === 'card'
      ? 'origin-top pt-5 md:pt-8 pointer-events-none'
      : 'origin-top pt-2 pointer-events-none animate-in fade-in duration-700 ease-out';

  return (
    <ScaledResumePreview
      templateId={templateId}
      data={PREVIEW_RESUME_DATA}
      containerClassName={containerClassName}
      fallback={
        /* ── Premium Skeleton Loading State ── */
        <div className="absolute inset-x-8 top-8 bottom-8 flex justify-center">
          <div className="w-full max-w-sm rounded-xl border border-gray-100 bg-white shadow-sm p-8 animate-pulse flex flex-col">
            
            {/* Header Skeleton */}
            <div className="flex flex-col items-center gap-3 mb-10 pb-8 border-b border-gray-50 shrink-0">
              <div className="h-5 bg-gray-200 rounded-md w-1/2" />
              <div className="h-2.5 bg-gray-100 rounded-md w-1/3" />
            </div>
            
            {/* Body Skeleton */}
            <div className="space-y-8 flex-1">
              {[1, 2, 3].map((section) => (
                <div key={section} className="space-y-4">
                  <div className="h-3.5 bg-gray-200 rounded-sm w-1/4" />
                  <div className="space-y-2.5">
                    <div className="h-2 bg-gray-100 rounded-sm w-full" />
                    <div className="h-2 bg-gray-100 rounded-sm w-[90%]" />
                    <div className="h-2 bg-gray-100 rounded-sm w-[80%]" />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      }
      scaleWrapperClassName={scaleWrapperClassName}
      paperClassName="bg-white ring-1 ring-gray-900/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-300"
      pageLimit={1}
      previewZoom={previewZoom}
    />
  );
};

export default TemplateModalPreview;
