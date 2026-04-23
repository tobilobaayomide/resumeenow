import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type VercelHeader = {
  key: string;
  value: string;
};

type VercelHeaderRule = {
  source: string;
  headers: VercelHeader[];
};

type VercelConfig = {
  headers?: VercelHeaderRule[];
};

const readVercelConfig = (): VercelConfig =>
  JSON.parse(
    readFileSync(resolve(process.cwd(), '../../../vercel.json'), 'utf8'),
  ) as VercelConfig;

const findAppHeaderRule = (config: VercelConfig): VercelHeaderRule | undefined =>
  config.headers?.find((rule) => rule.source === '/(.*)');

const getHeaderValue = (rule: VercelHeaderRule, key: string): string | undefined =>
  rule.headers.find((header) => header.key === key)?.value;

test('vercel.json applies a security header baseline to all routes', () => {
  const config = readVercelConfig();
  const rule = findAppHeaderRule(config);

  assert.ok(rule, 'expected a global header rule in vercel.json');
  assert.equal(
    getHeaderValue(rule, 'Strict-Transport-Security'),
    'max-age=63072000; includeSubDomains; preload',
  );
  assert.equal(getHeaderValue(rule, 'X-Content-Type-Options'), 'nosniff');
  assert.equal(getHeaderValue(rule, 'X-Frame-Options'), 'DENY');
  assert.equal(getHeaderValue(rule, 'Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.equal(
    getHeaderValue(rule, 'Permissions-Policy'),
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  );
});

test('vercel.json content security policy preserves the required runtime directives', () => {
  const config = readVercelConfig();
  const rule = findAppHeaderRule(config);

  assert.ok(rule, 'expected a global header rule in vercel.json');

  const csp = getHeaderValue(rule, 'Content-Security-Policy');
  assert.ok(csp, 'expected Content-Security-Policy to be configured');

  const requiredDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ];

  requiredDirectives.forEach((directive) => {
    assert.ok(
      csp.includes(directive),
      `expected Content-Security-Policy to include "${directive}"`,
    );
  });
});
