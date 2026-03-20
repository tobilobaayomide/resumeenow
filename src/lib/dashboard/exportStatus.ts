const EXPORT_STATUS_NAMESPACE = 'resumeenow:pdf-export';

const getExportStatusKey = (userId: string, field: 'at' | 'resumeId'): string =>
  `${EXPORT_STATUS_NAMESPACE}:${userId}:${field}`;

export const readPdfExportStatus = (
  userId: string | null | undefined,
): { hasExportedPdf: boolean; lastExportResumeId: string | null } => {
  if (typeof window === 'undefined' || !userId) {
    return { hasExportedPdf: false, lastExportResumeId: null };
  }

  try {
    return {
      hasExportedPdf: Boolean(localStorage.getItem(getExportStatusKey(userId, 'at'))),
      lastExportResumeId: localStorage.getItem(getExportStatusKey(userId, 'resumeId')),
    };
  } catch {
    return { hasExportedPdf: false, lastExportResumeId: null };
  }
};

export const recordPdfExport = (
  userId: string | null | undefined,
  resumeId?: string | null,
): void => {
  if (typeof window === 'undefined' || !userId) return;

  localStorage.setItem(getExportStatusKey(userId, 'at'), new Date().toISOString());

  if (resumeId) {
    localStorage.setItem(getExportStatusKey(userId, 'resumeId'), resumeId);
    return;
  }

  localStorage.removeItem(getExportStatusKey(userId, 'resumeId'));
};
