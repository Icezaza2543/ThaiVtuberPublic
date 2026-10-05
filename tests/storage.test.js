import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStorage } from './storage-fake.js';
import { collectBlobItems, readJsonBlobWith } from '../lib/storage.js';

test('snapshot pointer changes only after version write succeeds', async () => {
  const store=createMemoryStorage();
  await store.writeSnapshot({snapshot_id:'one',meta:{generated_at:'2026-10-05T10:00:00Z'}});
  assert.equal((await store.readCurrentSnapshot()).snapshot_id,'one');
  store.failNextSnapshotWrite();
  await assert.rejects(()=>store.writeSnapshot({snapshot_id:'two',meta:{generated_at:'2026-10-05T11:00:00Z'}}),/simulated/);
  assert.equal((await store.readCurrentSnapshot()).snapshot_id,'one');
});

test('intake moves per record between isolated states', async () => {
  const store=createMemoryStorage();
  await store.storeIntake({id:'a',received_at:'2026-10-01T00:00:00Z',state:'pending'});
  await store.storeIntake({id:'b',received_at:'2026-10-02T00:00:00Z',state:'pending'});
  await store.moveIntake('a','pending','reviewed');
  assert.deepEqual((await store.listIntake('pending')).map(x=>x.id),['b']);
  assert.deepEqual((await store.listIntake('reviewed')).map(x=>x.id),['a']);
});

test('purgeExpiredIntake uses state-specific retention', async () => {
  const store=createMemoryStorage();
  await store.storeIntake({id:'pending-old',received_at:'2026-07-01T00:00:00Z',state:'pending'});
  await store.storeIntake({id:'pending-new',received_at:'2026-09-20T00:00:00Z',state:'pending'});
  await store.storeIntake({id:'reviewed-old',received_at:'2026-09-01T00:00:00Z',state:'reviewed',state_changed_at:'2026-09-20T00:00:00Z'});
  await store.storeIntake({id:'rejected-new',received_at:'2026-09-01T00:00:00Z',state:'rejected',state_changed_at:'2026-10-03T00:00:00Z'});
  const result=await store.purgeExpiredIntake(new Date('2026-10-05T00:00:00Z'));
  assert.deepEqual(result,{pending:1,reviewed:1,rejected:0});
  assert.deepEqual((await store.listIntake('pending')).map(x=>x.id),['pending-new']);
  assert.deepEqual((await store.listIntake('rejected')).map(x=>x.id),['rejected-new']);
});


test('collectBlobItems follows every Blob cursor',async()=>{
  const calls=[];
  const pages={
    '':{blobs:[{pathname:'intake/pending/a.json'}],hasMore:true,cursor:'page-2'},
    'page-2':{blobs:[{pathname:'intake/pending/b.json'}],hasMore:true,cursor:'page-3'},
    'page-3':{blobs:[{pathname:'intake/pending/c.json'}],hasMore:false,cursor:null},
  };
  const list=async options=>{calls.push(options);return pages[options.cursor||''];};
  const rows=await collectBlobItems(list,'intake/pending/');
  assert.deepEqual(rows.map(x=>x.pathname),['intake/pending/a.json','intake/pending/b.json','intake/pending/c.json']);
  assert.deepEqual(calls.map(x=>x.cursor??null),[null,'page-2','page-3']);
  assert.ok(calls.every(x=>x.limit===1000));
});

test('readJsonBlobWith bypasses Blob cache for consistent private reads',async()=>{
  let options;
  const get=async(_url,opts)=>{options=opts;return{stream:new Response('{"ok":true}').body};};
  const value=await readJsonBlobWith(get,'private://pointer');
  assert.deepEqual(value,{ok:true});
  assert.deepEqual(options,{access:'private',useCache:false});
});
