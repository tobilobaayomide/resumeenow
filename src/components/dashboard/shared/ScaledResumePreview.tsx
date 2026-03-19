import React from "react";
import { isRenderableTemplate } from "../../../domain/templates";
import type { ResumeData } from "../../../types/resume";
import type { TemplateId } from "../../../domain/templates";
import { HtmlTemplateDocument } from "../../builder/preview/HtmlTemplateDocument";

interface ScaledResumePreviewProps {
  templateId: string;
  data: ResumeData;
  fallback: React.ReactNode;
  containerClassName?: string;
  scaleWrapperClassName: string;
  paperClassName: string;
  pageLimit?: number;
  previewZoom?: number;
}

const HtmlPreview: React.FC<{
  templateId: TemplateId;
  data: ResumeData;
  containerClassName: string;
  scaleWrapperClassName: string;
  paperClassName: string;
  pageLimit?: number;
  previewZoom?: number;
}> = ({
  templateId,
  data,
  containerClassName,
  scaleWrapperClassName,
  paperClassName,
  pageLimit = 1,
  previewZoom = 1,
}) => {
  return (
    <div className={containerClassName}>
      <div className={scaleWrapperClassName}>
        <HtmlTemplateDocument
          data={data}
          templateId={templateId}
          zoom={previewZoom}
          pageGap={0}
          withShadow={false}
          pageClassName={paperClassName}
          pageLimit={pageLimit}
        />
      </div>
    </div>
  );
};

const ScaledResumePreview: React.FC<ScaledResumePreviewProps> = ({
  templateId,
  data,
  fallback,
  containerClassName = "absolute inset-0 overflow-hidden bg-linear-to-b from-white to-gray-50",
  scaleWrapperClassName,
  paperClassName,
  pageLimit = 1,
  previewZoom = 1,
}) => {
  const normalizedId = templateId.trim().toLowerCase();

  if (!isRenderableTemplate(normalizedId)) {
    return <>{fallback}</>;
  }

  return (
    <HtmlPreview
      templateId={normalizedId as TemplateId}
      data={data}
      containerClassName={containerClassName}
      scaleWrapperClassName={scaleWrapperClassName}
      paperClassName={paperClassName}
      pageLimit={pageLimit}
      previewZoom={previewZoom}
    />
  );
};

export default ScaledResumePreview;
