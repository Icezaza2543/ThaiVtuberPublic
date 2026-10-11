import * as defaultStorage from '../lib/storage.js';
import { MissingConfigError, requireCounterConfig, requireSnapshotStoreConfig } from '../lib/config.js';
import { upstashFromEnv } from '../lib/counter.js';
import { logApiError } from '../lib/api-error.js';
import { jsonResponse, noIndexHeaders } from '../lib/http.js';

export async function handleHealth(request, { storage = defaultStorage, env = process.env, redis } = {}) {
  if (request.method !== 'GET') return jsonResponse(405, { error: 'method_not_allowed' }, { ...noIndexHeaders(), Allow: 'GET' });
  const result = { data: 'error', snapshot_id: null, generated_at: null, counter: 'error' };
  // Read only: a real snapshot read and Redis PING; no counter increments or probe writes.
  await Promise.all([
    (async () => {
      try {
        requireSnapshotStoreConfig(env);
        const snapshot = await storage.readCurrentSnapshot({ fresh: true });
        if (!snapshot?.snapshot_id) throw new Error('snapshot unavailable');
        result.data = 'ok';
        result.snapshot_id = snapshot.snapshot_id;
        result.generated_at = snapshot.meta?.generated_at ?? null;
      } catch (err) {
        result.data = err instanceof MissingConfigError ? 'missing_config' : 'error';
        logApiError('/api/health data', err, env);
      }
    })(),
    (async () => {
      try {
        requireCounterConfig(env);
        const pong = await (redis ?? upstashFromEnv(env))([['PING']]);
        if (pong[0] !== 'PONG') throw new Error('counter ping failed');
        result.counter = 'ok';
      } catch (err) {
        result.counter = err instanceof MissingConfigError ? 'missing_config' : 'error';
        logApiError('/api/health counter', err, env);
      }
    })(),
  ]);
  return jsonResponse(result.data === 'ok' ? 200 : 503, result, noIndexHeaders());
}
export function GET(request) { return handleHealth(request); }
export default { fetch: GET };
