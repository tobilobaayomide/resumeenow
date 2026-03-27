type RuntimeValidationReport = {
  key: string;
  source: string;
  action: string;
  details?: Record<string, unknown>;
  error?: unknown;
  once?: boolean;
};

const reportedRuntimeValidationKeys = new Set<string>();

export const reportRuntimeValidationIssue = ({
  key,
  source,
  action,
  details,
  error,
  once = true,
}: RuntimeValidationReport): void => {
  if (once) {
    if (reportedRuntimeValidationKeys.has(key)) return;
    reportedRuntimeValidationKeys.add(key);
  }

  if (typeof console === 'undefined' || typeof console.warn !== 'function') {
    return;
  }

  const message = `[RuntimeValidation] ${source}: ${action}`;

  if (details && error !== undefined) {
    console.warn(message, details, error);
    return;
  }

  if (details) {
    console.warn(message, details);
    return;
  }

  if (error !== undefined) {
    console.warn(message, error);
    return;
  }

  console.warn(message);
};

export const resetRuntimeValidationReports = (): void => {
  reportedRuntimeValidationKeys.clear();
};
