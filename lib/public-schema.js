const LIFECYCLE = new Set(['active','hiatus','inactive','graduated','unknown']);
const CREATOR_ALLOWED = new Set(['name','agency','status','debut_year','platforms']);
const PLATFORM_ALLOWED = new Set(['name','url']);
const META_ALLOWED = new Set(['generated_at','count_unit','notes']);
const SUMMARY_ALLOWED = new Set(['total_vtubers','platforms','lifecycle','debut_trend','known_debut_year_count']);
const SUMMARY_PLATFORM_ALLOWED = new Set(['platform','count']);
const SUMMARY_LIFECYCLE_ALLOWED = new Set(['status','count']);
const SUMMARY_DEBUT_ALLOWED = new Set(['year','known_debuts','cumulative_known_debuts']);

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

function nonNegativeInt(value, label) {
  if (!Number.isInteger(value) || value < 0) throw new TypeError(`${label} must be a non-negative integer`);
  return value;
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
    const platformName = String(platform.name ?? '').trim().toLowerCase();
    if (!platformName) throw new TypeError('platform name is required');
    return {name: platformName, url: safeHttpUrl(platform.url)};
  });
  return creator;
}

function validateMeta(meta) {
  assertObject(meta, 'snapshot meta');
  assertOnlyKeys(meta, META_ALLOWED, 'snapshot meta');
  if (typeof meta.generated_at !== 'string' || Number.isNaN(Date.parse(meta.generated_at))) throw new TypeError('meta.generated_at must be an ISO date');
  const result = {generated_at: meta.generated_at};
  if (meta.count_unit != null) {
    if (typeof meta.count_unit !== 'string' || !meta.count_unit.trim()) throw new TypeError('meta.count_unit must be a non-empty string');
    result.count_unit = meta.count_unit.trim();
  }
  if (meta.notes != null) {
    if (!Array.isArray(meta.notes) || meta.notes.some(note => typeof note !== 'string')) throw new TypeError('meta.notes must be an array of strings');
    result.notes = meta.notes.map(note => note.trim()).filter(Boolean).slice(0, 20);
  }
  return result;
}

function validateSummary(summary) {
  assertObject(summary, 'summary');
  assertOnlyKeys(summary, SUMMARY_ALLOWED, 'summary');
  const total_vtubers = nonNegativeInt(summary.total_vtubers, 'summary.total_vtubers');
  for (const key of ['platforms','lifecycle','debut_trend']) if (!Array.isArray(summary[key])) throw new TypeError(`summary.${key} must be an array`);
  const known_debut_year_count = nonNegativeInt(summary.known_debut_year_count, 'summary.known_debut_year_count');
  if (known_debut_year_count > total_vtubers) throw new TypeError('summary.known_debut_year_count exceeds total_vtubers');

  const platforms = summary.platforms.map(row => {
    assertObject(row, 'summary platform row');
    assertOnlyKeys(row, SUMMARY_PLATFORM_ALLOWED, 'summary platform row');
    const platform = String(row.platform ?? '').trim().toLowerCase();
    if (!platform) throw new TypeError('summary platform row requires platform');
    const count = nonNegativeInt(row.count, 'summary platform count');
    if (count > total_vtubers) throw new TypeError('summary platform count exceeds total_vtubers');
    return {platform, count};
  });

  const lifecycle = summary.lifecycle.map(row => {
    assertObject(row,'summary lifecycle row');
    assertOnlyKeys(row, SUMMARY_LIFECYCLE_ALLOWED, 'summary lifecycle row');
    const status = String(row.status ?? '').toLowerCase();
    if (!LIFECYCLE.has(status)) throw new TypeError('invalid lifecycle status');
    const count = nonNegativeInt(row.count, 'summary lifecycle count');
    if (count > total_vtubers) throw new TypeError('summary lifecycle count exceeds total_vtubers');
    return {status, count};
  });

  const debut_trend = summary.debut_trend.map(row => {
    assertObject(row, 'summary debut row');
    assertOnlyKeys(row, SUMMARY_DEBUT_ALLOWED, 'summary debut row');
    if (!Number.isInteger(row.year) || row.year < 1900 || row.year > 2100) throw new TypeError('invalid summary debut year');
    const known_debuts = nonNegativeInt(row.known_debuts, 'summary known_debuts');
    const cumulative_known_debuts = nonNegativeInt(row.cumulative_known_debuts, 'summary cumulative_known_debuts');
    if (known_debuts > total_vtubers || cumulative_known_debuts > total_vtubers) throw new TypeError('summary debut count exceeds total_vtubers');
    return {year: row.year, known_debuts, cumulative_known_debuts};
  });

  return {total_vtubers, platforms, lifecycle, debut_trend, known_debut_year_count};
}

export function validateSnapshot(value) {
  assertObject(value, 'snapshot');
  const allowed = new Set(['schema_version','snapshot_id','meta','summary','creators']);
  assertOnlyKeys(value, allowed, 'snapshot');
  if (value.schema_version !== 2) throw new TypeError('unsupported snapshot schema_version');
  if (typeof value.snapshot_id !== 'string' || !value.snapshot_id.trim()) throw new TypeError('snapshot_id is required');
  const meta = validateMeta(value.meta);
  const summary = validateSummary(value.summary);
  if (!Array.isArray(value.creators)) throw new TypeError('creators must be an array');
  const creators = value.creators.map(sanitizeCreator);
  if (summary.total_vtubers !== creators.length) throw new TypeError('summary.total_vtubers must match creators length');
  return {schema_version: 2, snapshot_id: value.snapshot_id.trim(), meta, summary, creators};
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
