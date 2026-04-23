import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const supabaseSource = readFileSync(
  resolve(process.cwd(), '../../..', 'src/lib/supabase.ts'),
  'utf8',
);

test('supabase client disables persistent browser auth storage', () => {
  assert.match(supabaseSource, /persistSession:\s*false/);
  assert.match(supabaseSource, /autoRefreshToken:\s*false/);
});

test('supabase client no longer injects a custom browser storage adapter', () => {
  assert.doesNotMatch(supabaseSource, /\bstorage\s*:/);
});
