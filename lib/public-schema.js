const LIFECYCLE = new Set(['active','hiatus','inactive','graduated','unknown']);
const CREATOR_ALLOWED = new Set(['name','agency','status','debut_year','platforms']);
const PLATFORM_ALLOWED = new Set(['name','url']);

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
}

function assertOnlyKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new TypeError(`${label} contains forbidden/non-allowlisted field: ${key}`);
  }
}

function safeHttpUrl(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function sanitizeCreator(value) {
  assertObject(value, 'creator');
  assertOnlyKeys(value, CREATOR_ALLOWED, 'creator');
  const name = String(value.name ?? '').trim();
  if (!name) throw new TypeError('creator name is required');
  const status = String(value.status ?? 'unknown').trim().toLowerCase();
  if (!LIFECYCLE.has(status)) throw new TypeError(`invalid creator status: ${status}`);
  const creator = {name, status};
  if (value.agency != null && String(value.agency).trim()) creator.agency = String(value.agency).trim();
  if (value.debut_year != null) {
    if (!Number.isInteger(value.debut_year) || value.debut_year < 1900 || value.debut_year > 2100) throw new TypeError('invalid debut_year');
    creator.debut_year = value.debut_year;
  }
  if (!Array.isArray(value.platforms)) throw new TypeError('creator platforms must be an array');
  creator.platforms = value.platforms.map((platform) => {
    assertObject(platform, 'platform');
    assertOnlyKeys(platform, PLATFORM_ALLOWED, 'platform');
    const name = String(platform.name ?? '').trim().toLowerCase();
    if (!name) throw new TypeError('platform name is required');
    return {name, url: safeHttpUrl(platform.url)};
  });
  return creator;
}

function validateSummary(summary) {
  assertObject(summary, 'summary');
  const total = summary.total_vtubers;
  if (!Number.isInteger(total) || total < 0) throw new TypeError('summary.total_vtubers must be a non-negative integer');
  for (const key of ['platforms','lifecycle','debut_trend']) if (!Array.isArray(summary[key])) throw new TypeError(`summary.${key} must be an array`);
  if (!Number.isInteger(summary.known_debut_year_count) || summary.known_debut_year_count < 0) throw new TypeError('summary.known_debut_year_count must be a non-negative integer');
  for (const row of summary.lifecycle) {
    assertObject(row,'summary lifecycle row');
    if (!LIFECYCLE.has(String(row.status ?? '').toLowerCase())) throw new TypeError('invalid lifecycle status');
    if (!Number.isInteger(row.count) || row.count < 0) throw new TypeError('invalid lifecycle count');
  }
  return summary;
}

export function validateSnapshot(value) {
  assertObject(value, 'snapshot');
  const allowed = new Set(['schema_version','snapshot_id','meta','summary','creators']);
  assertOnlyKeys(value, allowed, 'snapshot');
  if (value.schema_version !== 2) throw new TypeError('unsupported snapshot schema_version');
  if (typeof value.snapshot_id !== 'string' || !value.snapshot_id.trim()) throw new TypeError('snapshot_id is required');
  assertObject(value.meta, 'snapshot meta');
  if (typeof value.meta.generated_at !== 'string' || Number.isNaN(Date.parse(value.meta.generated_at))) throw new TypeError('meta.generated_at must be an ISO date');
  validateSummary(value.summary);
  if (!Array.isArray(value.creators)) throw new TypeError('creators must be an array');
  return {...value, creators: value.creators.map(sanitizeCreator)};
}

export function parseCreatorQuery(url) {
  const params = url.searchParams;
  let limit = 24;
  if (params.has('limit')) {
    const raw = params.get('limit');
    if (!/^\d+$/.test(raw ?? '')) throw new TypeError('limit must be an integer');
    limit = Number(raw);
    if (limit < 1 || limit > 24) throw new TypeError('limit must be between 1 and 24');
  }
  const q = (params.get('q') ?? '').trim().slice(0,100);
  const platform = (params.get('platform') ?? '').trim().toLowerCase().slice(0,32);
  const status = (params.get('status') ?? '').trim().toLowerCase();
  if (status && !LIFECYCLE.has(status)) throw new TypeError('invalid status filter');
  const cursor = (params.get('cursor') ?? '').trim();
  return {q, platform, status, cursor, limit};
}
