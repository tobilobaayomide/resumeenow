type HeaderValue = string | string[] | undefined;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface EnforceInMemoryRateLimitArgs {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}

const inMemoryRateLimitBuckets = new Map<string, RateLimitBucket>();

export class RateLimitError extends Error {
  status: number;
  retryAfterSeconds: number;

  constructor(
    retryAfterSeconds: number,
    message = 'Too many requests. Please try again shortly.',
  ) {
    super(message);
    this.status = 429;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const toSingleHeaderValue = (value: HeaderValue): string | null => {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const parseForwardedIp = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const firstIp = value
    .split(',')
    .map((part) => part.trim())
    .find(Boolean);

  return firstIp || null;
};

export const getClientIpFromHeaderRecord = (
  headers: Record<string, HeaderValue>,
): string | null =>
  parseForwardedIp(
    toSingleHeaderValue(headers['x-forwarded-for']) ||
      toSingleHeaderValue(headers['x-real-ip']),
  );

export const getClientIpFromHeaders = (headers: Headers): string | null =>
  parseForwardedIp(
    headers.get('x-forwarded-for') ||
      headers.get('x-real-ip'),
  );

export const buildRateLimitKey = ({
  namespace,
  userId,
  ipAddress,
}: {
  namespace: string;
  userId?: string | null;
  ipAddress?: string | null;
}): string => {
  const normalizedUserId =
    typeof userId === 'string' && userId.trim() ? userId.trim() : 'anonymous';
  const normalizedIp =
    typeof ipAddress === 'string' && ipAddress.trim() ? ipAddress.trim() : 'unknown-ip';

  return `${namespace}:${normalizedUserId}:${normalizedIp}`;
};

export const enforceInMemoryRateLimit = ({
  key,
  limit,
  windowMs,
  now = Date.now(),
}: EnforceInMemoryRateLimitArgs): void => {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('Rate limit must be a positive integer.');
  }

  if (!Number.isInteger(windowMs) || windowMs < 1) {
    throw new Error('Rate limit window must be a positive integer.');
  }

  for (const [bucketKey, bucket] of inMemoryRateLimitBuckets.entries()) {
    if (bucket.resetAt <= now) {
      inMemoryRateLimitBuckets.delete(bucketKey);
    }
  }

  const existingBucket = inMemoryRateLimitBuckets.get(key);
  if (!existingBucket || existingBucket.resetAt <= now) {
    inMemoryRateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  if (existingBucket.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existingBucket.resetAt - now) / 1000),
    );
    throw new RateLimitError(retryAfterSeconds);
  }

  existingBucket.count += 1;
  inMemoryRateLimitBuckets.set(key, existingBucket);
};

export const resetInMemoryRateLimits = (): void => {
  inMemoryRateLimitBuckets.clear();
};
