import {
  HttpError,
  isRecord,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './_lib/admin.js';
import { authenticateUserRequest } from './_lib/user.js';

export const config = {
  maxDuration: 30,
};

const PRO_WAITLIST_JOINED_AT_FIELD = 'pro_waitlist_joined_at';

const getJoinedAtValue = (value: unknown): string | null => {
  if (!isRecord(value)) {
    return null;
  }

  const joinedAt = value[PRO_WAITLIST_JOINED_AT_FIELD];
  return typeof joinedAt === 'string' && joinedAt.trim() ? joinedAt : null;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  try {
    const { supabase, user } = await authenticateUserRequest(req, res);
    const { data: existingData, error: existingError } = await supabase
      .from('profiles')
      .select(PRO_WAITLIST_JOINED_AT_FIELD)
      .eq('id', user.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const existingJoinedAt = getJoinedAtValue(existingData);

    if (req.method === 'GET') {
      sendJson(res, 200, {
        joined: existingJoinedAt !== null,
        joinedAt: existingJoinedAt,
      });
      return;
    }

    if (existingJoinedAt) {
      sendJson(res, 200, {
        joinedAt: existingJoinedAt,
        alreadyJoined: true,
      });
      return;
    }

    const joinedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
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
      throw new HttpError(500, 'Failed to record your Pro waitlist entry.');
    }

    sendJson(res, 200, {
      joinedAt: savedJoinedAt,
      alreadyJoined: false,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, {
        error: 'PRO_WAITLIST_REQUEST_FAILED',
        message: error.message,
      });
      return;
    }

    sendJson(res, 500, {
      error: 'PRO_WAITLIST_REQUEST_FAILED',
      message:
        error instanceof Error ? error.message : 'Unexpected Pro waitlist API error.',
    });
  }
}
