export class MissingConfigError extends Error {
  constructor(name) { super(`missing ${name}`); this.name = 'MissingConfigError'; }
}
export function requireEnv(name, env = process.env) {
  if (typeof env[name] !== 'string' || !env[name].trim()) throw new MissingConfigError(name);
  return env[name];
}
export function requireBlobConfig(env = process.env) {
  // The SDK supports a long-lived token OR Vercel's rotating OIDC token + store ID.
  if (env.BLOB_READ_WRITE_TOKEN?.trim()) return;
  requireEnv('BLOB_STORE_ID', env);
  if (!env.VERCEL_OIDC_TOKEN?.trim()) throw new MissingConfigError('BLOB_READ_WRITE_TOKEN');
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
