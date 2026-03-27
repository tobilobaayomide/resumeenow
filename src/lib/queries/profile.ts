import { reportRuntimeValidationIssue } from '../observability/runtimeValidation';
import { supabase } from '../supabase';

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

export const fetchProfileRecord = async (userId: string): Promise<ProfileRecord | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeProfileRecord(data, userId);
};

export const upsertProfileRecord = async (
  userId: string,
  updates: Record<string, unknown>,
): Promise<ProfileRecord> => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(updates)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const savedProfile = normalizeProfileRecord(data, userId);
  if (!savedProfile) {
    throw new Error('Failed to parse saved profile.');
  }

  return savedProfile;
};
