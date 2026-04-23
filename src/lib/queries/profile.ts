import { reportRuntimeValidationIssue } from '../observability/runtimeValidation';
export type ProfileRecord = Record<string, unknown>;

export const PROFILE_QUERY_STALE_TIME = 300_000;

const isRecord = (value: unknown): value is ProfileRecord =>
  typeof value === 'object' && value !== null;

const normalizeProfileRecord = (value: unknown, userId: string): ProfileRecord | null => {
  if (value == null) {
    return null;
  }

  if (isRecord(value)) {
    return value;
  }

  reportRuntimeValidationIssue({
    key: `profile.query.invalid-row:${userId}`,
    source: 'profile.query',
    action: 'Ignored a malformed profile row returned from persistence.',
    details: {
      userId,
    },
  });

  return null;
};

export const getProfileQueryKey = (userId: string | null | undefined) =>
  ['profile', userId ?? null] as const;

const PROFILE_UPDATE_ENDPOINT = '/api/profile';
const AVATAR_UPLOAD_ENDPOINT = '/api/avatar-upload';

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.clone().json()) as {
      message?: string;
      error?: string;
    };

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }
  } catch {
    // Fall through to text parsing.
  }

  const text = (await response.text()).trim();
  return text || 'Failed to update profile.';
};

export const fetchProfileRecord = async (userId: string): Promise<ProfileRecord | null> => {
  const response = await fetch(PROFILE_UPDATE_ENDPOINT, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { profile?: unknown };
  return normalizeProfileRecord(payload.profile ?? null, userId);
};

export const upsertProfileRecord = async (
  userId: string,
  updates: Record<string, unknown>,
): Promise<ProfileRecord> => {
  const response = await fetch(PROFILE_UPDATE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { profile?: unknown };
  const data = payload.profile;

  const savedProfile = normalizeProfileRecord(data, userId);
  if (!savedProfile) {
    throw new Error('Failed to parse saved profile.');
  }

  return savedProfile;
};

export const uploadProfileAvatar = async (
  userId: string,
  file: File,
): Promise<{ profile: ProfileRecord; avatarUrl: string }> => {
  const response = await fetch(AVATAR_UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: {
      ...(file.type ? { 'Content-Type': file.type } : {}),
    },
    credentials: 'include',
    body: file,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as {
    profile?: unknown;
    avatarUrl?: unknown;
  };
  const profile = normalizeProfileRecord(payload.profile, userId);
  const avatarUrl =
    typeof payload.avatarUrl === 'string' && payload.avatarUrl.trim()
      ? payload.avatarUrl
      : null;

  if (!profile || !avatarUrl) {
    throw new Error('Failed to parse uploaded avatar response.');
  }

  return {
    profile,
    avatarUrl,
  };
};
