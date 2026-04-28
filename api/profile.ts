import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import {
  HttpError,
  isRecord,
  type ApiRequest,
  type ApiResponse,
} from './_lib/admin.js';
import {
  AVATAR_BUCKET,
  detectAvatarImageFormat,
  extractManagedAvatarPath,
  normalizeAvatarContentType,
  resolveProfileAvatar,
  type AvatarImageFormat,
} from './_lib/avatar.js';
import { authenticateUserRequest } from './_lib/user.js';
import {
  buildRateLimitKey,
  enforceInMemoryRateLimit,
  getClientIpFromHeaders,
  RateLimitError,
} from './_lib/rate-limit.js';
import { parseSelfProfileUpdate } from '../src/schemas/integrations/profile.js';

export const config = {
  maxDuration: 30,
};

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_UPLOAD_RATE_LIMIT = {
  limit: 8,
  windowMs: 10 * 60 * 1000,
} as const;

const parseRequestBody = (body: unknown) => {
  let rawBody: unknown;

  if (typeof body === 'string') {
    try {
      rawBody = JSON.parse(body) as unknown;
    } catch {
      throw new HttpError(400, 'Invalid JSON request body.');
    }
  } else {
    rawBody = body ?? {};
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

const createJsonResponse = (
  status: number,
  payload: unknown,
  headers?: Headers,
  extraHeaders?: Record<string, string>,
): Response => {
  const responseHeaders = headers ?? new Headers();
  responseHeaders.set('Content-Type', 'application/json');
  responseHeaders.set('Cache-Control', 'no-store');
  Object.entries(extraHeaders ?? {}).forEach(([name, value]) => {
    responseHeaders.set(name, value);
  });

  return new Response(JSON.stringify(payload), {
    status,
    headers: responseHeaders,
  });
};

const readRequestBuffer = async (request: Request): Promise<Buffer> => {
  const declaredLength = Number.parseInt(request.headers.get('content-length') ?? '', 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_AVATAR_BYTES) {
    throw new HttpError(413, 'Avatar images must be 2 MB or smaller.');
  }

  const arrayBuffer = await request.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!buffer.length) {
    throw new HttpError(400, 'Missing avatar upload.');
  }

  if (buffer.length > MAX_AVATAR_BYTES) {
    throw new HttpError(413, 'Avatar images must be 2 MB or smaller.');
  }

  return buffer;
};

const buildAvatarPath = (userId: string, format: AvatarImageFormat): string =>
  `${userId}/${Date.now()}-${randomUUID()}.${format.extension}`;

const createCapturedApiResponse = (headers: Headers): ApiResponse => ({
  setHeader(name, value) {
    headers.delete(name);
    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(name, entry));
      return;
    }
    headers.set(name, value);
  },
  status() {
    return this;
  },
  send() {
    return this;
  },
});

const getAction = (request: Request): 'profile' | 'avatar' => {
  const url = new URL(request.url);
  return url.searchParams.get('action') === 'avatar' ? 'avatar' : 'profile';
};

const buildApiRequest = async (request: Request): Promise<ApiRequest> => {
  const bodyText = request.method === 'GET' ? undefined : await request.text();

  return {
    method: request.method,
    url: request.url,
    body: bodyText,
    headers: {
      authorization: request.headers.get('authorization') ?? undefined,
      cookie: request.headers.get('cookie') ?? undefined,
      'content-type': request.headers.get('content-type') ?? undefined,
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? undefined,
      'x-real-ip': request.headers.get('x-real-ip') ?? undefined,
      host: request.headers.get('host') ?? undefined,
      'x-forwarded-proto': request.headers.get('x-forwarded-proto') ?? undefined,
    },
  };
};

const handleProfileRequest = async (request: Request): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return createJsonResponse(405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    }, undefined, {
      Allow: 'GET, POST',
    });
  }

  const headers = new Headers();

  try {
    const apiRequest = await buildApiRequest(request);
    const { supabase, user } = await authenticateUserRequest(
      apiRequest,
      createCapturedApiResponse(headers),
    );
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';

    if (request.method === 'GET') {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return createJsonResponse(200, {
        profile: await resolveProfileAvatar(supabase, data, user.id, supabaseUrl),
      }, headers);
    }

    const updates = parseRequestBody(apiRequest.body);

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

    return createJsonResponse(200, {
      profile: await resolveProfileAvatar(supabase, data, user.id, supabaseUrl),
    }, headers);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unexpected profile API error.';
    return createJsonResponse(status, {
      error: 'PROFILE_UPDATE_FAILED',
      message,
    }, headers);
  }
};

const handleAvatarUploadRequest = async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return createJsonResponse(405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    }, undefined, {
      Allow: 'POST',
    });
  }

  const headers = new Headers();

  try {
    const apiRequest = await buildApiRequest(request.clone());
    const { supabase, user } = await authenticateUserRequest(
      apiRequest,
      createCapturedApiResponse(headers),
    );

    enforceInMemoryRateLimit({
      key: buildRateLimitKey({
        namespace: 'avatar-upload',
        userId: user.id,
        ipAddress: getClientIpFromHeaders(request.headers),
      }),
      limit: AVATAR_UPLOAD_RATE_LIMIT.limit,
      windowMs: AVATAR_UPLOAD_RATE_LIMIT.windowMs,
    });

    const contentType = normalizeAvatarContentType(request.headers.get('content-type'));
    const buffer = await readRequestBuffer(request);
    const format = detectAvatarImageFormat(
      new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
    );

    if (!format) {
      throw new HttpError(415, 'Only PNG, JPEG, and WebP avatar uploads are supported.');
    }

    if (contentType && contentType !== format.mimeType) {
      throw new HttpError(415, 'Avatar upload content type did not match the file contents.');
    }

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfileError) {
      throw new HttpError(500, 'Failed to read the current avatar state.');
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
    const nextAvatarPath = buildAvatarPath(user.id, format);
    const uploadResult = await supabase.storage.from(AVATAR_BUCKET).upload(nextAvatarPath, buffer, {
      contentType: format.mimeType,
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadResult.error) {
      throw new HttpError(500, 'Failed to store avatar upload.');
    }

    try {
      const { data: savedProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            avatar_url: nextAvatarPath,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'id',
          },
        )
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      const oldAvatarPath = extractManagedAvatarPath(
        typeof existingProfile?.avatar_url === 'string' ? existingProfile.avatar_url : null,
        user.id,
        supabaseUrl,
      );
      const resolvedProfile = await resolveProfileAvatar(supabase, savedProfile, user.id, supabaseUrl);

      if (!resolvedProfile || typeof resolvedProfile.avatar_url !== 'string' || !resolvedProfile.avatar_url) {
        throw new HttpError(500, 'Failed to prepare the uploaded avatar for delivery.');
      }

      if (oldAvatarPath && oldAvatarPath !== nextAvatarPath) {
        const removalResult = await supabase.storage.from(AVATAR_BUCKET).remove([oldAvatarPath]);
        if (removalResult.error) {
          console.warn('[AvatarUpload] Failed to remove previous avatar.', {
            userId: user.id,
            oldAvatarPath,
            message: removalResult.error.message,
          });
        }
      }

      return createJsonResponse(200, {
        profile: resolvedProfile,
        avatarUrl: resolvedProfile.avatar_url,
      }, headers);
    } catch (error) {
      await supabase.storage.from(AVATAR_BUCKET).remove([nextAvatarPath]);
      throw error;
    }
  } catch (error) {
    const status =
      error instanceof HttpError || error instanceof RateLimitError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : 'Unexpected avatar upload error.';

    return createJsonResponse(
      status,
      {
        error: 'AVATAR_UPLOAD_FAILED',
        message,
      },
      headers,
      error instanceof RateLimitError
        ? { 'Retry-After': String(error.retryAfterSeconds) }
        : undefined,
    );
  }
};

const handleRequest = async (request: Request): Promise<Response> =>
  getAction(request) === 'avatar'
    ? handleAvatarUploadRequest(request)
    : handleProfileRequest(request);

export async function GET(request: Request): Promise<Response> {
  return handleProfileRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleRequest(request);
}

export default {
  async fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },
};
