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
        <div className="absolute inset-0 p-3">
          <div className="w-full h-full rounded-sm border border-gray-200 bg-white" />
        </div>
      }
      scaleWrapperClassName="absolute left-1/2 top-0 -translate-x-1/2 origin-top scale-[0.40] sm:scale-[0.32] md:scale-[0.27] lg:scale-[0.235] pointer-events-none"
      paperClassName="w-198.5 h-280.75 bg-white border border-gray-200 shadow-sm p-5 overflow-hidden"
    />
  );
};

export default TemplateModalPreview;
