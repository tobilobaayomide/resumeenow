import type { ReactNode, RefObject } from 'react';
import type { ResumeData, ResumeExperienceItem, TemplateId } from '../resume';

export interface BuilderTemplateComponentProps {
  data: ResumeData;
  contentRef?: RefObject<HTMLDivElement>;
}

export interface TemplateRendererProps extends BuilderTemplateComponentProps {
  templateId: TemplateId;
}

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  category: string;
  description: string;
  color: string;
  popular?: boolean;
}

export interface TemplateSectionTitleProps {
  children: ReactNode;
}

export interface AtsDateRangeProps {
  startDate: string;
  endDate: string;
}

export interface AtsExperienceBlockProps {
  item: ResumeExperienceItem;
}
