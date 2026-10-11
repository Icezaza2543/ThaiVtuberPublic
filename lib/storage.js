import { requireSnapshotStoreConfig } from './config.js';
import { upstashFromEnv } from './counter.js';

// The current snapshot lives in Upstash Redis as one JSON string (about 1.2 MB). Vercel Blob was dropped:
// every request listed and read Blob, which exhausted the Hobby quota for advanced operations.
export const SNAPSHOT_KEY = 'snapshot:current';
const TTL_MS = 5 * 60 * 1000;
let cache = null;

export function resetSnapshotCache(){ cache = null; }

export async function readCurrentSnapshot({ redis, fresh = false, now = Date.now(), env = process.env } = {}){
  if(!fresh && cache && now - cache.at < TTL_MS) return cache.value;
  if(!redis){ requireSnapshotStoreConfig(env); redis = upstashFromEnv(env); }
  const [raw] = await redis([['GET', SNAPSHOT_KEY]]);
  const value = raw == null ? null : JSON.parse(raw);
  if(value) cache = { value, at: now };
  return value;
}

export async function writeSnapshot(snapshot, { redis, now = Date.now(), env = process.env } = {}){
  if(!redis){ requireSnapshotStoreConfig(env); redis = upstashFromEnv(env); }
  const [ok] = await redis([['SET', SNAPSHOT_KEY, JSON.stringify(snapshot)]]);
  if(ok !== 'OK') throw new Error('snapshot write failed');
  cache = { value: snapshot, at: now };
  return { snapshot_id: snapshot.snapshot_id };
}
