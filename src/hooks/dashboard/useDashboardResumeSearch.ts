import { useMemo, useState } from 'react';
import type { ResumeRecord } from '../../types/resume';
import type { UseDashboardResumeSearchResult } from '../../types/dashboard';

export const useDashboardResumeSearch = (
  resumes: ResumeRecord[],
): UseDashboardResumeSearchResult => {
  const [searchQuery, setSearchQueryState] = useState('');

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredResumes = useMemo(
    () =>
      resumes.filter((resume) => {
        if (!normalizedSearch) return true;
        const title = (resume.title || '').toLowerCase();
        const template = (resume.template_id || '').toLowerCase();
        return title.includes(normalizedSearch) || template.includes(normalizedSearch);
      }),
    [resumes, normalizedSearch],
  );

  const latestResume = useMemo(() => {
    if (resumes.length === 0) return null;
    return [...resumes].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )[0];
  }, [resumes]);

  return {
    searchQuery,
    setSearchQuery: setSearchQueryState,
    filteredResumes,
    latestResume,
  };
};
