import { jsonResponse, noIndexHeaders } from '../lib/http.js';

// Anonymous visitor counter in Upstash Redis (Vercel integration env vars). Stores two numbers only:
// the all-time total and today's count (Asia/Bangkok day). The browser decides "new today" from a
// localStorage date, so no cookie, IP or identifier ever reaches the server.
const TOTAL = 'visits:total';
const dayKey = day => `visits:day:${day}`;
export const bangkokDay = (now = new Date()) => new Date(now.getTime() + 7 * 3600e3).toISOString().slice(0, 10);

export function upstashFromEnv(env = process.env, fetchImpl = fetch) {
  const url = env.KV_REST_API_URL, token = env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return async commands => {
    const r = await fetchImpl(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
    });
    if (!r.ok) throw new Error(`upstash ${r.status}`);
    return (await r.json()).map(x => x.result);
  };
}

export async function handleVisits(request, { redis = upstashFromEnv(), now = new Date() } = {}) {
  if (request.method !== 'GET' && request.method !== 'POST')
    return jsonResponse(405, { error: 'method_not_allowed' }, { ...noIndexHeaders(), Allow: 'GET, POST' });
  if (!redis) return jsonResponse(503, { error: 'counter_unavailable' }, noIndexHeaders());
  const day = dayKey(bangkokDay(now));
  try {
    const res = request.method === 'POST'
      ? await redis([['INCR', TOTAL], ['INCR', day], ['EXPIRE', day, 172800]])
      : await redis([['GET', TOTAL], ['GET', day]]);
    return jsonResponse(200, { total: Number(res[0]) || 0, today: Number(res[1]) || 0 }, noIndexHeaders());
  } catch {
    return jsonResponse(503, { error: 'counter_unavailable' }, noIndexHeaders());
  }
}
export function GET(request) { return handleVisits(request); }
export function POST(request) { return handleVisits(request); }
export default { fetch: handleVisits };
