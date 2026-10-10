import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { requireCounterConfig, requireCursorSecret } from './config.js';

export const TOTAL = 'visits:total';
export const dayKey = day => `visits:day:${day}`;
export const bangkokDay = (now = new Date()) => new Date(now.getTime() + 7 * 3600e3).toISOString().slice(0, 10);

export function upstashFromEnv(env = process.env, fetchImpl = fetch) {
  requireCounterConfig(env);
  const url = env.KV_REST_API_URL, token = env.KV_REST_API_TOKEN;
  return async commands => {
    const r = await fetchImpl(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands), signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`upstash HTTP ${r.status}`);
    const payload = await r.json();
    if (!Array.isArray(payload) || payload.length !== commands.length || payload.some(x => !x || x.error || !('result' in x)))
      throw new Error('upstash command failed');
    return payload.map(x => x.result);
  };
}

export function visitKey(request, now, salt) {
  requireCursorSecret(salt);
  // Vercel overwrites this header; do not trust arbitrary forwarding headers.
  const ip = request.headers.get('x-vercel-forwarded-for')?.trim();
  const version = isIP(ip || '');
  if (!version) throw new Error('visitor IP unavailable');
  const normalized = version === 6 ? new URL(`http://[${ip}]/`).hostname.slice(1, -1) : ip;
  const hash = createHash('sha256').update(JSON.stringify([normalized, bangkokDay(now), salt])).digest('hex');
  return `visits:seen:${hash}`;
}

export function secondsUntilBangkokMidnight(now) {
  const next = Date.parse(`${bangkokDay(now)}T00:00:00+07:00`) + 86400e3;
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}
