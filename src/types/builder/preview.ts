import type { ResumeData, TemplateId } from '../resume';

export interface LivePreviewProps {
  data: ResumeData;
  zoom?: number;
  templateId?: TemplateId;
}
