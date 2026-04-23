const RETRY_DELAYS = [5000, 15000, 45000];

const RETRYABLE_PROVIDER_MESSAGE_PATTERNS = [
  /currently experiencing high demand/i,
  /spikes in demand/i,
  /temporarily unavailable/i,
  /please try again later/i,
  /try again in a moment/i,
  /rate limited/i,
  /resource exhausted/i,
];

export interface GeminiProxyErrorPayload {
  error?: string;
  message?: string;
  providerStatus?: number;
  retryAfterSeconds?: number;
  status?: number;
}

const normalizeErrorMessage = (message: string): string =>
  message.replace(/^(Error:\s*)+/i, '').trim();

export class GeminiProxyError extends Error {
  code?: string;
  providerStatus?: number;
  retryAfterSeconds?: number;
  status?: number;

  constructor(
    message: string,
    {
      error,
      providerStatus,
      retryAfterSeconds,
      status,
    }: GeminiProxyErrorPayload = {},
  ) {
    super(message);
    this.name = 'GeminiProxyError';
    this.code = typeof error === 'string' && error.trim() ? error.trim() : undefined;
    this.providerStatus = Number.isFinite(providerStatus) ? providerStatus : undefined;
    this.retryAfterSeconds = Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined;
    this.status = Number.isFinite(status) ? status : undefined;
  }
}

const isRetryableGeminiMessage = (message: string): boolean =>
  RETRYABLE_PROVIDER_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));

export const shouldRetryGeminiError = (error: unknown): boolean => {
  const message = normalizeErrorMessage(error instanceof Error ? error.message : String(error));

  if (
    message.includes('Daily AI limit reached.') ||
    message.includes('Another AI request is already running.') ||
    message.includes('Your session expired.')
  ) {
    return false;
  }

  if (error instanceof GeminiProxyError) {
    if (
      error.code === 'PAYMENT_REQUIRED' ||
      error.code === 'CONCURRENT_LIMIT' ||
      error.code === 'INVALID_JWT'
    ) {
      return false;
    }

    if (
      error.status === 429 ||
      error.status === 503 ||
      error.providerStatus === 429 ||
      error.providerStatus === 503
    ) {
      return true;
    }
  }

  return isRetryableGeminiMessage(message);
};

export const getGeminiRetryDelayMs = (error: unknown, retriesRemaining: number): number => {
  if (error instanceof GeminiProxyError && typeof error.retryAfterSeconds === 'number') {
    return Math.max(1000, Math.ceil(error.retryAfterSeconds) * 1000);
  }

  const retryIndex = Math.max(0, RETRY_DELAYS.length - (retriesRemaining + 1));
  return RETRY_DELAYS[retryIndex] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1] ?? 15000;
};
