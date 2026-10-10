import { jsonResponse, noIndexHeaders } from '../lib/http.js';
import { logApiError } from '../lib/api-error.js';
import { upstashFromEnv, bangkokDay, TOTAL, dayKey, visitKey, secondsUntilBangkokMidnight } from '../lib/counter.js';
export { upstashFromEnv, bangkokDay } from '../lib/counter.js';

// Store aggregate totals plus a daily salted SHA-256 gate, expiring at Bangkok midnight.
// No raw IP, browser ID or stable cross-day identifier is stored in Redis.
export async function handleVisits(request, { redis, env = process.env, salt = env.VTHAIDEX_CURSOR_SECRET, now = new Date() } = {}) {
  if (request.method !== 'GET' && request.method !== 'POST')
    return jsonResponse(405, { error: 'method_not_allowed' }, { ...noIndexHeaders(), Allow: 'GET, POST' });
  try {
    if (redis === undefined) redis = upstashFromEnv(env);
    if (!redis) throw new Error('counter configuration unavailable');
    const day = dayKey(bangkokDay(now));
    let count = false;
    if (request.method === 'POST') {
      const key = visitKey(request, now, salt);
      const [acquired] = await redis([['SET', key, '1', 'NX', 'EX', secondsUntilBangkokMidnight(now)]]);
      if (acquired !== 'OK' && acquired !== null) throw new Error('counter rate limit failed');
      count = acquired === 'OK';
    }
    const res = count
      ? await redis([['INCR', TOTAL], ['INCR', day], ['EXPIRE', day, 172800]])
      : await redis([['GET', TOTAL], ['GET', day]]);
    return jsonResponse(200, { total: Number(res[0]) || 0, today: Number(res[1]) || 0 }, noIndexHeaders());
  } catch (err) {
    logApiError('/api/visits', err, env);
    return jsonResponse(503, { error: 'counter_unavailable' }, noIndexHeaders());
  }
}
export function GET(request) { return handleVisits(request); }
export function POST(request) { return handleVisits(request); }
export default { fetch: handleVisits };
