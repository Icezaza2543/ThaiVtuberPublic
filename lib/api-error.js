// Log a useful provider message, never a stack, request, credential or provider URL.
export function logApiError(endpoint, err, env = process.env) {
  let message = err instanceof Error ? err.message : 'unknown error';
  for (const [name, value] of Object.entries(env)) {
    if (value && /TOKEN|SECRET|PASSWORD|BLOB_STORE_ID|KV_REST_API_URL/i.test(name))
      message = message.split(value).join('[redacted]');
  }
  message = message.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/https?:\/\/\S+/gi, '[provider URL]')
    .replace(/[\r\n]/g, ' ').slice(0, 500);
  console.error(`${endpoint}: ${message}`);
}
