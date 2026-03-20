import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { readPdfExportStatus } from '../../lib/dashboard/exportStatus';
import type { UseDashboardExportStatusResult } from '../../types/dashboard';

export const useDashboardExportStatus = (): UseDashboardExportStatusResult => {
  const { user } = useAuth();
  const [hasExportedPdf, setHasExportedPdf] = useState<boolean>(() =>
    readPdfExportStatus(user?.id).hasExportedPdf,
  );
  const [lastExportResumeId, setLastExportResumeId] = useState<string | null>(() =>
    readPdfExportStatus(user?.id).lastExportResumeId,
  );

  useEffect(() => {
    const refreshExportStatus = () => {
      const status = readPdfExportStatus(user?.id);
      setHasExportedPdf(status.hasExportedPdf);
      setLastExportResumeId(status.lastExportResumeId);
    };

    refreshExportStatus();
    window.addEventListener('focus', refreshExportStatus);
    window.addEventListener('storage', refreshExportStatus);

    return () => {
      window.removeEventListener('focus', refreshExportStatus);
      window.removeEventListener('storage', refreshExportStatus);
    };
  }, [user?.id]);

  return {
    hasExportedPdf,
    lastExportResumeId,
  };
};
