import React from 'react';
import { PREVIEW_RESUME_DATA } from '../../../domain/resume';
import type { TemplateModalPreviewProps } from '../../../types/dashboard';
import ScaledResumePreview from '../shared/ScaledResumePreview';

const TemplateModalPreview: React.FC<TemplateModalPreviewProps> = ({ templateId }) => {
  return (
    <ScaledResumePreview
      templateId={templateId}
      data={PREVIEW_RESUME_DATA}
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
      // Added a slow fade-in so the template appears smoothly
      scaleWrapperClassName="absolute left-1/2 top-0 -translate-x-1/2 origin-top scale-[0.40] sm:scale-[0.32] md:scale-[0.27] lg:scale-[0.235] pointer-events-none animate-in fade-in duration-700 ease-out"
      // Replaced standard Tailwind dimensions with exact A4 pixels to ensure no config issues, and upgraded shadow
      paperClassName="w-[794px] h-[1123px] p-5 bg-white ring-1 ring-gray-900/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-300"
    />
  );
};

export default TemplateModalPreview;