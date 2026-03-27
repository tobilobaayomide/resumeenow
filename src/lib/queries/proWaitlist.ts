import { supabase } from '../supabase';

const PRO_WAITLIST_JOINED_AT_FIELD = 'pro_waitlist_joined_at';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getJoinedAtValue = (value: unknown): string | null => {
  if (!isRecord(value)) {
    return null;
  }

  const joinedAt = value[PRO_WAITLIST_JOINED_AT_FIELD];
  return typeof joinedAt === 'string' && joinedAt.trim() ? joinedAt : null;
};

export interface JoinProWaitlistResult {
  joinedAt: string;
  alreadyJoined: boolean;
}

export const PRO_WAITLIST_QUERY_STALE_TIME = 300_000;

export const getProWaitlistQueryKey = (userId: string | null | undefined) =>
  ['proWaitlist', userId ?? null] as const;

export const fetchProWaitlistStatus = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(PRO_WAITLIST_JOINED_AT_FIELD)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return getJoinedAtValue(data) !== null;
};

export const joinProWaitlist = async (userId: string): Promise<JoinProWaitlistResult> => {
  const { data: existingData, error: existingError } = await supabase
    .from('profiles')
    .select(PRO_WAITLIST_JOINED_AT_FIELD)
    .eq('id', userId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const existingJoinedAt = getJoinedAtValue(existingData);
  if (existingJoinedAt) {
    return {
      joinedAt: existingJoinedAt,
      alreadyJoined: true,
    };
  }

  const joinedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        [PRO_WAITLIST_JOINED_AT_FIELD]: joinedAt,
        updated_at: joinedAt,
      },
      {
        onConflict: 'id',
      },
    )
    .select(PRO_WAITLIST_JOINED_AT_FIELD)
    .single();

  if (error) {
    throw error;
  }

  const savedJoinedAt = getJoinedAtValue(data);
  if (!savedJoinedAt) {
    throw new Error('Failed to record your Pro waitlist entry.');
  }

  return {
    joinedAt: savedJoinedAt,
    alreadyJoined: false,
  };
};
