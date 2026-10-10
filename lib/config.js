export class MissingConfigError extends Error {
  constructor(name) { super(`missing ${name}`); this.name = 'MissingConfigError'; }
}
export function requireEnv(name, env = process.env) {
  if (typeof env[name] !== 'string' || !env[name].trim()) throw new MissingConfigError(name);
  return env[name];
}
export function requireBlobConfig(env = process.env) {
  // Long-lived token, or a store ID with Vercel's OIDC token (at runtime the token comes per request, not as an env var).
  if (env.BLOB_READ_WRITE_TOKEN?.trim()) return;
  requireEnv('BLOB_STORE_ID', env);
}
export function requireCounterConfig(env = process.env) {
  requireEnv('KV_REST_API_URL', env);
  requireEnv('KV_REST_API_TOKEN', env);
}
export function requireCursorSecret(secret) {
  if (typeof secret !== 'string' || !/^[A-Za-z0-9_-]+$/.test(secret) || Buffer.from(secret, 'base64url').length !== 32)
    throw new Error('missing or invalid VTHAIDEX_CURSOR_SECRET');
  return secret;
}
