import React, { useEffect, useMemo } from "react";
import { usePDF } from "@react-pdf/renderer";
import { isRenderableTemplate } from "../../../domain/templates";
import type { ResumeData } from "../../../types/resume";
import type { TemplateId } from "../../../domain/templates";
import { PDFDocument } from "../../builder/pdf/PDFDocument";

interface ScaledResumePreviewProps {
  templateId: string;
  data: ResumeData;
  fallback: React.ReactNode;
  containerClassName?: string;
  scaleWrapperClassName: string;
  paperClassName: string;
}

const Skeleton: React.FC<{ paperClassName: string }> = ({ paperClassName }) => (
  <div className={`${paperClassName} bg-white animate-pulse overflow-hidden`} style={{ padding: 0 }}>
    <div className="h-24 bg-gray-200 mb-6" />
    <div className="px-8 space-y-3">
      <div className="h-3 w-24 bg-gray-200 rounded" />
      <div className="h-2 w-full bg-gray-100 rounded" />
      <div className="h-2 w-5/6 bg-gray-100 rounded" />
      <div className="h-2 w-4/6 bg-gray-100 rounded" />
      <div className="h-3 w-28 bg-gray-200 rounded mt-4" />
      <div className="h-2 w-full bg-gray-100 rounded" />
      <div className="h-2 w-5/6 bg-gray-100 rounded" />
      <div className="h-2 w-3/6 bg-gray-100 rounded" />
      <div className="h-3 w-20 bg-gray-200 rounded mt-4" />
      <div className="h-2 w-full bg-gray-100 rounded" />
      <div className="h-2 w-4/6 bg-gray-100 rounded" />
    </div>
  </div>
);

// Inner component — usePDF only runs when template is renderable
const PDFPreview: React.FC<{
  templateId: TemplateId;
  data: ResumeData;
  containerClassName: string;
  scaleWrapperClassName: string;
  paperClassName: string;
}> = ({ templateId, data, containerClassName, scaleWrapperClassName, paperClassName }) => {
  const doc = useMemo(
    () => <PDFDocument data={data} templateId={templateId} />,
    [data, templateId],
  );

  const [instance, update] = usePDF({ document: doc });

  useEffect(() => {
    update(doc);
  }, [doc]);

  return (
    <div className={containerClassName}>
      <div className={scaleWrapperClassName}>
        {instance.loading || !instance.url ? (
          <Skeleton paperClassName={paperClassName} />
        ) : (
          <iframe
            key={instance.url}
            src={`${instance.url}#toolbar=0&navpanes=0&scrollbar=0`}
            className={paperClassName}
            style={{ border: "none", display: "block", padding: 0 }}
          />
        )}
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
}) => {
  const normalizedId = templateId.trim().toLowerCase();

  if (!isRenderableTemplate(normalizedId)) {
    return <>{fallback}</>;
  }

  return (
    <PDFPreview
      templateId={normalizedId as TemplateId}
      data={data}
      containerClassName={containerClassName}
      scaleWrapperClassName={scaleWrapperClassName}
      paperClassName={paperClassName}
    />
  );
};

export default ScaledResumePreview;