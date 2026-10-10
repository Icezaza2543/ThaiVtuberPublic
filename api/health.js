import * as defaultStorage from '../lib/storage.js';
import { MissingConfigError, requireBlobConfig, requireCounterConfig } from '../lib/config.js';
import { upstashFromEnv } from '../lib/counter.js';
import { logApiError } from '../lib/api-error.js';
import { jsonResponse, noIndexHeaders } from '../lib/http.js';

export async function handleHealth(request, { storage = defaultStorage, env = process.env, redis } = {}) {
  if (request.method !== 'GET') return jsonResponse(405, { error: 'method_not_allowed' }, { ...noIndexHeaders(), Allow: 'GET' });
  const result = { blob: 'error', snapshot_id: null, generated_at: null, counter: 'error' };
  // Read only: a real snapshot read and Redis PING; no counter increments or probe writes.
  await Promise.all([
    (async () => {
      try {
        requireBlobConfig(env);
        const snapshot = await storage.readCurrentSnapshot();
        if (!snapshot?.snapshot_id) throw new Error('snapshot unavailable');
        result.blob = 'ok';
        result.snapshot_id = snapshot.snapshot_id;
        result.generated_at = snapshot.meta?.generated_at ?? null;
      } catch (err) {
        result.blob = err instanceof MissingConfigError ? 'missing_config' : 'error';
        logApiError('/api/health blob', err, env);
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
  return jsonResponse(result.blob === 'ok' ? 200 : 503, result, noIndexHeaders());
}
export function GET(request) { return handleHealth(request); }
export default { fetch: GET };
