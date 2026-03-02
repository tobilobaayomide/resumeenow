import type { ResumeRecord, TemplateId } from '../resume';

export interface UseResumesResult {
  resumes: ResumeRecord[];
  loading: boolean;
  error: string | null;
  createResume: (title: string, templateId?: TemplateId) => Promise<ResumeRecord>;
  deleteResume: (id: string) => Promise<void>;
  refreshResumes: () => Promise<void>;
}
