import React from 'react';
import { isRenderableTemplate } from '../../../domain/templates';
import type { ResumeData } from '../../../types/resume';
import TemplateRenderer from '../../builder/templates/TemplateRenderer';

interface ScaledResumePreviewProps {
  templateId: string;
  data: ResumeData;
  fallback: React.ReactNode;
  containerClassName?: string;
  scaleWrapperClassName: string;
  paperClassName: string;
}

const ScaledResumePreview: React.FC<ScaledResumePreviewProps> = ({
  templateId,
  data,
  fallback,
  containerClassName = 'absolute inset-0 overflow-hidden bg-linear-to-b from-white to-gray-50',
  scaleWrapperClassName,
  paperClassName,
}) => {
  if (!isRenderableTemplate(templateId)) {
    return <>{fallback}</>;
  }

  return (
    <div className={containerClassName}>
      <div className={scaleWrapperClassName}>
        <div className={paperClassName}>
          <TemplateRenderer templateId={templateId} data={data} />
        </div>
      </div>
    </div>
  );
};

export default ScaledResumePreview;
