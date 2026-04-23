import {
  HttpError,
  isRecord,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './_lib/admin.js';
import { resolveProfileAvatar } from './_lib/avatar.js';
import { authenticateUserRequest } from './_lib/user.js';
import { parseSelfProfileUpdate } from '../src/schemas/integrations/profile.js';

export const config = {
  maxDuration: 30,
};

const parseRequestBody = (req: ApiRequest) => {
  let rawBody: unknown;

  if (typeof req.body === 'string') {
    try {
      rawBody = JSON.parse(req.body) as unknown;
    } catch {
      throw new HttpError(400, 'Invalid JSON request body.');
    }
  } else {
    rawBody = req.body ?? {};
  }

  if (!isRecord(rawBody)) {
    throw new HttpError(400, 'Invalid profile update payload.');
  }

  try {
    return parseSelfProfileUpdate(rawBody);
  } catch {
    throw new HttpError(400, 'Invalid profile update payload.');
  }
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
    const {
      supabase,
      user,
    } = await authenticateUserRequest(req, res);
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      sendJson(res, 200, {
        profile: await resolveProfileAvatar(supabase, data, user.id, supabaseUrl),
      });
      return;
    }

    const updates = parseRequestBody(req);

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        },
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    sendJson(res, 200, {
      profile: await resolveProfileAvatar(supabase, data, user.id, supabaseUrl),
    });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, {
        error: 'PROFILE_UPDATE_FAILED',
        message: error.message,
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Unexpected profile API error.';
    sendJson(res, 500, {
      error: 'PROFILE_UPDATE_FAILED',
      message,
    });
  }
}
