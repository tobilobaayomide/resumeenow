import { useMemo, useState } from 'react';
import type {
  MyResumesSortBy,
  MyResumesViewMode,
  UseMyResumesViewResult,
} from '../../types/dashboard';
import type { ResumeRecord } from '../../types/resume';

export const useMyResumesView = (resumes: ResumeRecord[]): UseMyResumesViewResult => {
  const [viewMode, setViewMode] = useState<MyResumesViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<MyResumesSortBy>('updated_desc');

  const filteredResumes = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const filtered = resumes.filter((resume) =>
      (resume.title || '').toLowerCase().includes(normalizedSearch),
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [resumes, searchQuery, sortBy]);

  return {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filteredResumes,
  };
};
