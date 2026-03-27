import React from 'react';
import TemplateRenderer from '../builder/templates/TemplateRenderer';
import { PREVIEW_RESUME_DATA } from '../../domain/resume';
import {
  isRenderableTemplate,
  type TemplateId,
} from '../../domain/templates';

const LandingTemplatePreview: React.FC<{ templateId: TemplateId }> = ({ templateId }) => {
  if (!isRenderableTemplate(templateId)) {
    return (
      <div className="absolute inset-0 bg-white p-3">
        <div className="h-full w-full rounded-sm border border-gray-200 bg-gray-50" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-linear-to-b from-white to-gray-50">
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 origin-top scale-[0.36] md:scale-[0.37]">
        <div className="h-280.75 w-198.5 overflow-hidden border border-gray-200 bg-white p-6 shadow-sm">
          <TemplateRenderer templateId={templateId} data={PREVIEW_RESUME_DATA} />
        </div>
      </div>
    </div>
  );
};

export default LandingTemplatePreview;
