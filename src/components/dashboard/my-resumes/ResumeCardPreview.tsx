import React from 'react';
import type { ResumeRecord } from '../../../types/resume';
import ScaledResumePreview from '../shared/ScaledResumePreview';

interface ResumeCardPreviewProps {
  resume: ResumeRecord;
  compact?: boolean;
}

const ResumeCardPreview: React.FC<ResumeCardPreviewProps> = ({ resume, compact = false }) => {
  const templateId = resume.template_id || 'executive';

  return (
    <ScaledResumePreview
      templateId={templateId}
      data={resume.content}
      fallback={
        <div className="absolute inset-0 bg-white p-1.5">
          <div className="w-full h-full rounded-sm border border-gray-200 bg-gray-50" />
        </div>
      }
      scaleWrapperClassName={`absolute left-1/2 -translate-x-1/2 origin-top pointer-events-none ${
        compact
          ? 'top-0 scale-[0.05]'
          : 'top-0.5 md:top-1 scale-[0.24] sm:scale-[0.24] lg:scale-[0.215] xl:scale-[0.315]'
      }`}
      paperClassName="bg-white border border-gray-200 shadow-sm overflow-hidden"
      pageLimit={1}
    />
  );
};

export default ResumeCardPreview;
