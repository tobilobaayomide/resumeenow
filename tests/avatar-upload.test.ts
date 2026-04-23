import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectAvatarImageFormat,
  extractManagedAvatarPath,
  normalizeAvatarContentType,
} from '../api/_lib/avatar.js';

test('detectAvatarImageFormat recognizes supported avatar formats by signature', () => {
  assert.deepEqual(
    detectAvatarImageFormat(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    {
      extension: 'png',
      mimeType: 'image/png',
    },
  );

  assert.deepEqual(
    detectAvatarImageFormat(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])),
    {
      extension: 'jpg',
      mimeType: 'image/jpeg',
    },
  );

  assert.deepEqual(
    detectAvatarImageFormat(
      Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
    ),
    {
      extension: 'webp',
      mimeType: 'image/webp',
    },
  );

  assert.equal(detectAvatarImageFormat(Uint8Array.from([0x47, 0x49, 0x46])), null);
});

test('normalizeAvatarContentType only allows explicitly supported image types', () => {
  assert.equal(normalizeAvatarContentType('image/png'), 'image/png');
  assert.equal(normalizeAvatarContentType('image/jpeg; charset=utf-8'), 'image/jpeg');
  assert.equal(normalizeAvatarContentType('image/svg+xml'), null);
  assert.equal(normalizeAvatarContentType(null), null);
});

test('extractManagedAvatarPath only accepts managed avatar URLs for the current user', () => {
  assert.equal(
    extractManagedAvatarPath(
      'user-1/avatar.png',
      'user-1',
      'https://project.supabase.co',
    ),
    'user-1/avatar.png',
  );

  assert.equal(
    extractManagedAvatarPath(
      'https://project.supabase.co/storage/v1/object/public/avatars/user-1/avatar.png',
      'user-1',
      'https://project.supabase.co',
    ),
    'user-1/avatar.png',
  );

  assert.equal(
    extractManagedAvatarPath(
      'https://project.supabase.co/storage/v1/object/public/avatars/user-2/avatar.png',
      'user-1',
      'https://project.supabase.co',
    ),
    null,
  );

  assert.equal(
    extractManagedAvatarPath(
      'https://attacker.example.com/storage/v1/object/public/avatars/user-1/avatar.png',
      'user-1',
      'https://project.supabase.co',
    ),
    null,
  );

  assert.equal(
    extractManagedAvatarPath(
      'https://project.supabase.co/storage/v1/object/sign/avatars/user-1/avatar.png?token=test',
      'user-1',
      'https://project.supabase.co',
    ),
    'user-1/avatar.png',
  );
});
