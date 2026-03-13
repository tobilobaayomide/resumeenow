import React from 'react';
import { PREVIEW_RESUME_DATA } from '../../../domain/resume';
import type { TemplateCardPreviewProps } from '../../../types/dashboard';
import ScaledResumePreview from '../shared/ScaledResumePreview';

const TemplateCardPreview: React.FC<TemplateCardPreviewProps> = ({ template }) => {
  return (
    <ScaledResumePreview
      templateId={template.id}
      data={PREVIEW_RESUME_DATA}
      fallback={
        <div className="absolute inset-0 p-4 md:p-5">
          <div className="w-full h-full bg-white border border-gray-200 rounded-sm overflow-hidden">
            {template.layout === 'Sidebar' ? (
              <div className="w-full h-full flex">
                <div className="w-1/3 h-full bg-gray-100 border-r border-gray-200" />
                <div className="flex-1 p-3 space-y-2">
                  <div className="w-2/3 h-2 bg-gray-200 rounded-sm" />
                  <div className="w-full h-1 bg-gray-100 rounded-sm" />
                  <div className="w-full h-1 bg-gray-100 rounded-sm" />
                </div>
              </div>
            ) : (
              <div className="w-full h-full p-3 space-y-2">
                <div className="w-2/3 h-2 bg-gray-200 rounded-sm" />
                <div className="w-full h-1 bg-gray-100 rounded-sm" />
                <div className="w-full h-1 bg-gray-100 rounded-sm" />
                <div className="w-full h-20 bg-gray-50 rounded-sm mt-2" />
              </div>
            )}
          </div>
        </div>
      }
      scaleWrapperClassName="absolute left-1/2 top-2 md:top-3 -translate-x-1/2 origin-top scale-[0.5] sm:scale-[0.43] pointer-events-none"
      paperClassName="w-198.5 h-280.75 bg-white border border-gray-200 shadow-sm p-14.25 overflow-hidden"
    />
  );
};

export default TemplateCardPreview;
