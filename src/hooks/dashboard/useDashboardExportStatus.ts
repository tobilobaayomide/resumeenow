import { useEffect, useState } from 'react';
import type { UseDashboardExportStatusResult } from '../../types/dashboard';

export const useDashboardExportStatus = (): UseDashboardExportStatusResult => {
  const [hasExportedPdf, setHasExportedPdf] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem('resumeenow:lastPdfExportAt'));
  });
  const [lastExportResumeId, setLastExportResumeId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('resumeenow:lastPdfExportResumeId');
  });

  useEffect(() => {
    const refreshExportStatus = () => {
      try {
        setHasExportedPdf(Boolean(localStorage.getItem('resumeenow:lastPdfExportAt')));
        setLastExportResumeId(localStorage.getItem('resumeenow:lastPdfExportResumeId'));
      } catch {
        setHasExportedPdf(false);
        setLastExportResumeId(null);
      }
    };

    refreshExportStatus();
    window.addEventListener('focus', refreshExportStatus);
    window.addEventListener('storage', refreshExportStatus);

    return () => {
      window.removeEventListener('focus', refreshExportStatus);
      window.removeEventListener('storage', refreshExportStatus);
    };
  }, []);

  return {
    hasExportedPdf,
    lastExportResumeId,
  };
};
