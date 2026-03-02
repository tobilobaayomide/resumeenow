import type { ResumeRecord } from '../resume';

export type MyResumesViewMode = 'grid' | 'list';
export type MyResumesSortBy = 'updated_desc' | 'name_asc';

export interface UseMyResumesViewResult {
  viewMode: MyResumesViewMode;
  setViewMode: (mode: MyResumesViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: MyResumesSortBy;
  setSortBy: (sortBy: MyResumesSortBy) => void;
  filteredResumes: ResumeRecord[];
}

export interface MyResumesHeaderProps {
  resumeCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateResume: () => void;
}

export interface MyResumesToolbarProps {
  viewMode: MyResumesViewMode;
  sortBy: MyResumesSortBy;
  onViewModeChange: (mode: MyResumesViewMode) => void;
  onSortByChange: (value: MyResumesSortBy) => void;
}

export interface MyResumesGridViewProps {
  resumes: ResumeRecord[];
  onOpenResume: (resume: ResumeRecord) => void;
  onDeleteResume: (id: string) => void;
  onOpenActionMenu: (resume: ResumeRecord) => void;
  onCreateResume: () => void;
}

export interface MyResumesListViewProps {
  resumes: ResumeRecord[];
  onOpenResume: (resume: ResumeRecord) => void;
  onDeleteResume: (id: string) => void;
  onOpenActionMenu: (resume: ResumeRecord) => void;
}

export interface ResumeActionSheetProps {
  resume: ResumeRecord | null;
  onClose: () => void;
  onOpenResume: (resume: ResumeRecord) => void;
  onDuplicateResume: (resume: ResumeRecord) => void;
  onDeleteResume: (id: string) => void;
}
