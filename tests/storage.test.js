import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStorage } from './storage-fake.js';
import { SNAPSHOT_KEY, readCurrentSnapshot, resetSnapshotCache, writeSnapshot } from '../lib/storage.js';

test('snapshot pointer changes only after version write succeeds', async () => {
  const store=createMemoryStorage();
  await store.writeSnapshot({snapshot_id:'one',meta:{generated_at:'2026-10-05T10:00:00Z'}});
  assert.equal((await store.readCurrentSnapshot()).snapshot_id,'one');
  store.failNextSnapshotWrite();
  await assert.rejects(()=>store.writeSnapshot({snapshot_id:'two',meta:{generated_at:'2026-10-05T11:00:00Z'}}),/simulated/);
  assert.equal((await store.readCurrentSnapshot()).snapshot_id,'one');
});

function fakeRedis(){
  const data=new Map(),calls=[];
  const redis=async commands=>commands.map(([cmd,key,value])=>{
    calls.push(cmd);
    if(cmd==='GET') return data.get(key)??null;
    if(cmd==='SET'){data.set(key,value);return 'OK';}
    throw Error(`unexpected ${cmd}`);
  });
  return {redis,data,calls};
}

test('snapshot is one Redis key and reads are cached for five minutes', async () => {
  resetSnapshotCache();
  const {redis,data,calls}=fakeRedis();
  assert.equal(await readCurrentSnapshot({redis,now:0}),null);
  data.set(SNAPSHOT_KEY,JSON.stringify({snapshot_id:'a'}));
  assert.equal((await readCurrentSnapshot({redis,now:1000})).snapshot_id,'a');
  data.set(SNAPSHOT_KEY,JSON.stringify({snapshot_id:'b'}));
  assert.equal((await readCurrentSnapshot({redis,now:1000+299e3})).snapshot_id,'a');
  assert.equal((await readCurrentSnapshot({redis,now:1000+301e3})).snapshot_id,'b');
  assert.equal((await readCurrentSnapshot({redis,now:1000+302e3,fresh:true})).snapshot_id,'b');
  assert.deepEqual(calls,['GET','GET','GET','GET']);
});

test('writeSnapshot stores JSON and refreshes the cache', async () => {
  resetSnapshotCache();
  const {redis,data}=fakeRedis();
  await writeSnapshot({snapshot_id:'new'},{redis,now:0});
  assert.deepEqual(JSON.parse(data.get(SNAPSHOT_KEY)),{snapshot_id:'new'});
  data.clear();
  assert.equal((await readCurrentSnapshot({redis,now:1})).snapshot_id,'new');
  await assert.rejects(()=>writeSnapshot({snapshot_id:'x'},{redis:async()=>[null]}),/snapshot write failed/);
});
