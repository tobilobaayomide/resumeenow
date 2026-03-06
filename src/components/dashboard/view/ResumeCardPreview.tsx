import React from 'react';
import type { ResumeCardPreviewProps } from '../../../types/dashboard';
import ScaledResumePreview from '../shared/ScaledResumePreview';

const ResumeCardPreview: React.FC<ResumeCardPreviewProps> = ({ resume }) => {
  const templateId = resume.template_id || 'executive';

  return (
    <ScaledResumePreview
      templateId={templateId}
      data={resume.content}
      fallback={
        <div className="absolute inset-0 bg-white p-2">
          <div className="w-full h-full border border-gray-200 rounded-md bg-gray-50" />
        </div>
      }
      scaleWrapperClassName="absolute left-1/2 top-1 -translate-x-1/2 origin-top scale-[0.47] md:scale-[0.28] pointer-events-none"
      paperClassName="w-198.5 h-280.75 bg-white border border-gray-200 shadow-sm p-9 overflow-hidden"
    />
  );
};

export default ResumeCardPreview;
