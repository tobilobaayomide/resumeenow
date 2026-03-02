export const getErrorMessage = (
  error: unknown,
  fallbackMessage = 'Something went wrong.',
): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};
