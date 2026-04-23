import type { SupabaseClient } from '@supabase/supabase-js';
import { isRecord } from './admin.js';

export const AVATAR_BUCKET = 'avatars';
export const AVATAR_SIGNED_URL_TTL_SECONDS = 6 * 60 * 60;

type AvatarMimeType = 'image/jpeg' | 'image/png' | 'image/webp';
type AvatarExtension = 'jpg' | 'png' | 'webp';

export interface AvatarImageFormat {
  extension: AvatarExtension;
  mimeType: AvatarMimeType;
}

export const detectAvatarImageFormat = (bytes: Uint8Array): AvatarImageFormat | null => {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return {
      extension: 'png',
      mimeType: 'image/png',
    };
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return {
      extension: 'jpg',
      mimeType: 'image/jpeg',
    };
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return {
      extension: 'webp',
      mimeType: 'image/webp',
    };
  }

  return null;
};

export const normalizeAvatarContentType = (value: string | null): AvatarMimeType | null => {
  if (!value) return null;

  const normalized = value.split(';', 1)[0]?.trim().toLowerCase();
  if (
    normalized === 'image/jpeg' ||
    normalized === 'image/png' ||
    normalized === 'image/webp'
  ) {
    return normalized;
  }

  return null;
};

const normalizeManagedAvatarPathPrefix = (
  prefix: string,
  pathName: string,
  userId: string,
): string | null => {
  if (!pathName.startsWith(prefix)) {
    return null;
  }

  return `${userId}/${decodeURIComponent(pathName.slice(prefix.length))}`;
};

export const extractManagedAvatarPath = (
  avatarValue: string | null | undefined,
  userId: string,
  supabaseUrl: string,
): string | null => {
  if (!avatarValue) return null;

  const trimmedValue = avatarValue.trim();
  if (!trimmedValue) return null;

  if (!trimmedValue.includes('://')) {
    return trimmedValue.startsWith(`${userId}/`) ? trimmedValue : null;
  }

  try {
    const baseUrl = new URL(supabaseUrl);
    const parsed = new URL(trimmedValue);

    if (parsed.origin !== baseUrl.origin) {
      return null;
    }

    const publicPrefix = `/storage/v1/object/public/${AVATAR_BUCKET}/${userId}/`;
    const signedPrefix = `/storage/v1/object/sign/${AVATAR_BUCKET}/${userId}/`;

    return (
      normalizeManagedAvatarPathPrefix(publicPrefix, parsed.pathname, userId) ??
      normalizeManagedAvatarPathPrefix(signedPrefix, parsed.pathname, userId)
    );
  } catch {
    return null;
  }
};

export const resolveAvatarDeliveryUrl = async (
  supabase: SupabaseClient,
  avatarValue: string | null | undefined,
  userId: string,
  supabaseUrl: string,
): Promise<string | null> => {
  if (!avatarValue) return null;

  const objectPath = extractManagedAvatarPath(avatarValue, userId, supabaseUrl);
  if (objectPath) {
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(objectPath, AVATAR_SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      console.warn('[AvatarStorage] Failed to create a signed avatar URL.', {
        userId,
        objectPath,
        message: error?.message ?? 'Missing signed URL.',
      });
      return null;
    }

    return data.signedUrl;
  }

  try {
    return new URL(avatarValue).toString();
  } catch {
    return null;
  }
};

export const resolveProfileAvatar = async (
  supabase: SupabaseClient,
  profile: unknown,
  userId: string,
  supabaseUrl: string,
): Promise<Record<string, unknown> | null> => {
  if (!isRecord(profile)) {
    return null;
  }

  return {
    ...profile,
    avatar_url: await resolveAvatarDeliveryUrl(
      supabase,
      typeof profile.avatar_url === 'string' || profile.avatar_url === null
        ? profile.avatar_url
        : null,
      userId,
      supabaseUrl,
    ),
  };
};
