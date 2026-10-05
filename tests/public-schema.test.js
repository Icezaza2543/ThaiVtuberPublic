import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSnapshot, sanitizeCreator, parseCreatorQuery } from '../lib/public-schema.js';

const validCreator = {
  name: 'Alpha', agency: 'Independent', status: 'active', debut_year: 2024,
  platforms: [{name: 'youtube', url: 'https://youtube.com/@alpha'}]
};
const validSnapshot = {
  schema_version: 2,
  snapshot_id: 'snap-1',
  meta: {generated_at: '2026-10-05T10:00:00Z'},
  summary: {total_vtubers: 1, platforms: [{platform:'youtube',count:1}], lifecycle: [{status:'active',count:1}], debut_trend: [], known_debut_year_count: 1},
  creators: [validCreator]
};

test('valid snapshot containing only allowlisted fields passes', () => {
  const result = validateSnapshot(validSnapshot);
  assert.equal(result.snapshot_id, 'snap-1');
  assert.equal(result.creators[0].name, 'Alpha');
});

for (const forbidden of ['persona_id','account_id','evidence','followers','network','finance']) {
  test(`snapshot rejects forbidden creator field ${forbidden}`, () => {
    const bad = structuredClone(validSnapshot);
    bad.creators[0][forbidden] = 'secret';
    assert.throws(() => validateSnapshot(bad), /forbidden|allowlist/i);
  });
}

test('sanitizeCreator removes non-http platform URLs', () => {
  const creator = sanitizeCreator({...validCreator, platforms:[{name:'youtube',url:'javascript:alert(1)'},{name:'x',url:'https://x.com/alpha'}]});
  assert.deepEqual(creator.platforms, [{name:'youtube',url:null},{name:'x',url:'https://x.com/alpha'}]);
});

test('parseCreatorQuery defaults limit to 24 and rejects explicit limit above 24', () => {
  assert.equal(parseCreatorQuery(new URL('https://example.test/api/creators')).limit, 24);
  assert.throws(() => parseCreatorQuery(new URL('https://example.test/api/creators?limit=25')), /limit/i);
});

test('snapshot rejects lifecycle values outside public vocabulary', () => {
  const bad = structuredClone(validSnapshot);
  bad.creators[0].status = 'secret-status';
  assert.throws(() => validateSnapshot(bad), /status|lifecycle/i);
});


test('snapshot rejects forbidden fields nested inside public summary and meta',()=>{
  const badSummary=structuredClone(validSnapshot);badSummary.summary.internal_secret='do-not-publish';
  assert.throws(()=>validateSnapshot(badSummary),/summary.*forbidden|allowlist/i);
  const badMeta=structuredClone(validSnapshot);badMeta.meta.reviewer='private';
  assert.throws(()=>validateSnapshot(badMeta),/meta.*forbidden|allowlist/i);
});

test('snapshot rejects forbidden fields nested inside aggregate rows',()=>{
  const badPlatform=structuredClone(validSnapshot);badPlatform.summary.platforms[0].account_id='secret';
  assert.throws(()=>validateSnapshot(badPlatform),/platform.*forbidden|allowlist/i);
  const badLifecycle=structuredClone(validSnapshot);badLifecycle.summary.lifecycle[0].evidence='secret';
  assert.throws(()=>validateSnapshot(badLifecycle),/lifecycle.*forbidden|allowlist/i);
});
