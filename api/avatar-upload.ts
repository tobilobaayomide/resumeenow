import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { HttpError } from './_lib/admin.js';
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

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_UPLOAD_RATE_LIMIT = {
  limit: 8,
  windowMs: 10 * 60 * 1000,
} as const;

const createJsonResponse = (
  status: number,
  payload: unknown,
  extraHeaders?: Record<string, string>,
): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });

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

const handleRequest = async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return createJsonResponse(405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    }, {
      Allow: 'POST',
    });
  }

  try {
    const {
      supabase,
      user,
    } = await authenticateUserRequest({
      method: request.method,
      headers: {
        authorization: request.headers.get('authorization') ?? undefined,
        cookie: request.headers.get('cookie') ?? undefined,
      },
    });

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
      });
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
      error instanceof RateLimitError
        ? { 'Retry-After': String(error.retryAfterSeconds) }
        : undefined,
    );
  }
};

export const config = {
  maxDuration: 30,
};

export async function POST(request: Request): Promise<Response> {
  return handleRequest(request);
}

export default {
  async fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },
};
