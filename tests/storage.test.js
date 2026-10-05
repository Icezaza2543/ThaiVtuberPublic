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

test('collectBlobItems follows every Blob cursor',async()=>{
  const calls=[];
  const pages={
    '':{blobs:[{pathname:'snapshots/a.json'}],hasMore:true,cursor:'page-2'},
    'page-2':{blobs:[{pathname:'snapshots/b.json'}],hasMore:true,cursor:'page-3'},
    'page-3':{blobs:[{pathname:'snapshots/c.json'}],hasMore:false,cursor:null},
  };
  const list=async options=>{calls.push(options);return pages[options.cursor||''];};
  const rows=await collectBlobItems(list,'snapshots/');
  assert.deepEqual(rows.map(x=>x.pathname),['snapshots/a.json','snapshots/b.json','snapshots/c.json']);
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
