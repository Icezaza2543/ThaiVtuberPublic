import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
const bySource=source=>config.headers.find(row=>row.source===source)?.headers??[];
const map=rows=>Object.fromEntries(rows.map(x=>[x.key.toLowerCase(),x.value]));

test('global headers include CSP, nosniff, referrer policy and restrictive permissions policy',()=>{
  const h=map(bySource('/(.*)'));
  assert.equal(h['x-content-type-options'],'nosniff');
  assert.equal(h['referrer-policy'],'strict-origin-when-cross-origin');
  assert.match(h['content-security-policy'],/default-src 'self'/);
  assert.match(h['content-security-policy'],/script-src 'self'/);
  assert.match(h['content-security-policy'],/object-src 'none'/);
  assert.match(h['content-security-policy'],/frame-ancestors 'none'/);
  assert.match(h['permissions-policy'],/camera=\(\)/);
  assert.match(h['permissions-policy'],/microphone=\(\)/);
  assert.match(h['permissions-policy'],/geolocation=\(\)/);
});

test('contribution route is noindex, no-referrer and has no third-party script origin',()=>{
  const h=map(bySource('/contribute'));
  assert.equal(h['x-robots-tag'],'noindex, nofollow');
  assert.equal(h['referrer-policy'],'no-referrer');
  assert.match(h['content-security-policy'],/script-src 'self'/);
  assert.doesNotMatch(h['content-security-policy'],/googletagmanager|google-analytics|plausible|posthog/i);
});

test('all API routes are noindex and no-store',()=>{
  const h=map(bySource('/api/(.*)'));
  assert.equal(h['x-robots-tag'],'noindex, nofollow');
  assert.equal(h['cache-control'],'no-store');
});

test('internal endpoints inherit API noindex/no-store and no intake maintenance cron remains',()=>{
  const api=map(bySource('/api/(.*)'));
  assert.equal(api['cache-control'],'no-store');
  assert.equal(config.crons,undefined);
});


test('legacy public data route header is gone',()=>{
  assert.equal(config.headers.some(row=>row.source==='/data/(.*)'),false);
});
