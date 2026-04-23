const PRO_WAITLIST_JOINED_AT_FIELD = 'pro_waitlist_joined_at';
const PRO_WAITLIST_ENDPOINT = '/api/pro-waitlist';

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
  return text || 'Failed to load Pro waitlist status.';
};

export const fetchProWaitlistStatus = async (): Promise<boolean> => {
  const response = await fetch(PRO_WAITLIST_ENDPOINT);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as {
    joined?: unknown;
    joinedAt?: unknown;
  };

  return payload.joined === true || getJoinedAtValue({
    [PRO_WAITLIST_JOINED_AT_FIELD]: payload.joinedAt,
  }) !== null;
};

export const joinProWaitlist = async (): Promise<JoinProWaitlistResult> => {
  const response = await fetch(PRO_WAITLIST_ENDPOINT, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as {
    joinedAt?: unknown;
    alreadyJoined?: unknown;
  };

  const savedJoinedAt = getJoinedAtValue({
    [PRO_WAITLIST_JOINED_AT_FIELD]: data.joinedAt,
  });
  if (!savedJoinedAt) {
    throw new Error('Failed to record your Pro waitlist entry.');
  }

  return {
    joinedAt: savedJoinedAt,
    alreadyJoined: data.alreadyJoined === true,
  };
};
