import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStorage } from './storage-fake.js';
import { handleCreators } from '../api/creators.js';
import { handleStats } from '../api/stats.js';
import { handlePublish } from '../api/internal/publish.js';
import { signingDigest } from '../lib/publish-auth.js';

const cursorSecret=Buffer.alloc(32,9).toString('base64url');
const publishSecret='publish-test-secret';
const now=1_791_190_000_000;

function snapshot(id='snap-1',generated='2026-10-05T10:00:00Z',count=30){
  const creators=Array.from({length:count},(_,i)=>({
    name:`Creator ${String(i+1).padStart(2,'0')}`,
    agency:i%2?'Agency A':'Independent',
    status:i%3===0?'graduated':'active',
    debut_year:2020+(i%6),
    platforms:[{name:i%2?'x':'youtube',url:i%2?`https://x.com/c${i}`:`https://youtube.com/@c${i}`}]
  }));
  return {schema_version:2,snapshot_id:id,meta:{generated_at:generated},summary:{total_vtubers:creators.length,platforms:[],lifecycle:[],debut_trend:[],known_debut_year_count:creators.length},creators};
}

async function body(response){return JSON.parse(await response.text());}

test('creators API returns at most 24 and continues without duplicates',async()=>{
  const storage=createMemoryStorage();await storage.writeSnapshot(snapshot());
  const first=await handleCreators(new Request('https://vthaidex.test/api/creators?limit=24'),{storage,cursorSecret,now});
  assert.equal(first.status,200);const a=await body(first);assert.equal(a.items.length,24);assert.ok(a.next_cursor);
  const second=await handleCreators(new Request(`https://vthaidex.test/api/creators?limit=24&cursor=${encodeURIComponent(a.next_cursor)}`),{storage,cursorSecret,now});
  const b=await body(second);assert.equal(b.items.length,6);assert.equal(new Set([...a.items,...b.items].map(x=>x.name)).size,30);
});

test('creators API rejects oversized limit',async()=>{
  const storage=createMemoryStorage();await storage.writeSnapshot(snapshot());
  const response=await handleCreators(new Request('https://vthaidex.test/api/creators?limit=999'),{storage,cursorSecret,now});
  assert.equal(response.status,400);
});

test('modified cursor and filter mismatch fail',async()=>{
  const storage=createMemoryStorage();await storage.writeSnapshot(snapshot());
  const first=await body(await handleCreators(new Request('https://vthaidex.test/api/creators?q=creator'),{storage,cursorSecret,now}));
  const parts=first.next_cursor.split('.');
  const bytes=Buffer.from(parts[2],'base64url');bytes[0]^=1;parts[2]=bytes.toString('base64url');
  const changed=parts.join('.');
  assert.equal((await handleCreators(new Request(`https://vthaidex.test/api/creators?q=creator&cursor=${changed}`),{storage,cursorSecret,now})).status,400);
  assert.equal((await handleCreators(new Request(`https://vthaidex.test/api/creators?q=other&cursor=${encodeURIComponent(first.next_cursor)}`),{storage,cursorSecret,now})).status,400);
});

test('cursor becomes invalid after snapshot rotation',async()=>{
  const storage=createMemoryStorage();await storage.writeSnapshot(snapshot());
  const first=await body(await handleCreators(new Request('https://vthaidex.test/api/creators'),{storage,cursorSecret,now}));
  await storage.writeSnapshot(snapshot('snap-2','2026-10-05T11:00:00Z',30));
  const response=await handleCreators(new Request(`https://vthaidex.test/api/creators?cursor=${encodeURIComponent(first.next_cursor)}`),{storage,cursorSecret,now});
  assert.equal(response.status,400);
});

test('search matches name and agency only and response exposes no forbidden fields',async()=>{
  const storage=createMemoryStorage();const s=snapshot();s.creators[0].agency='Special Agency';await storage.writeSnapshot(s);
  const response=await handleCreators(new Request('https://vthaidex.test/api/creators?q=special'),{storage,cursorSecret,now});
  const payload=await body(response);assert.equal(payload.items.length,1);assert.equal(payload.items[0].name,'Creator 01');
  for(const key of ['persona_id','account_id','evidence','followers','network','finance']) assert.equal(JSON.stringify(payload).includes(key),false);
});

test('stats API returns summary only',async()=>{
  const storage=createMemoryStorage();await storage.writeSnapshot(snapshot());
  const response=await handleStats(new Request('https://vthaidex.test/api/stats'),{storage});
  const payload=await body(response);assert.equal(payload.total_vtubers,30);assert.equal(payload.meta.generated_at,'2026-10-05T10:00:00Z');assert.equal('creators' in payload,false);
});

test('publish API validates signature and rejects older snapshots without replacing current',async()=>{
  const storage=createMemoryStorage();await storage.writeSnapshot(snapshot('current','2026-10-05T10:00:00Z',2));
  const older=snapshot('older','2026-10-05T09:00:00Z',2);const raw=Buffer.from(JSON.stringify(older));const ts=String(Math.floor(now/1000));
  const request=new Request('https://vthaidex.test/api/internal/publish',{method:'POST',headers:{'content-type':'application/json','x-vthaidex-timestamp':ts,'x-vthaidex-signature':signingDigest(raw,ts,publishSecret)},body:raw});
  const response=await handlePublish(request,{storage,publishSecret,now});assert.equal(response.status,409);assert.equal((await storage.readCurrentSnapshot()).snapshot_id,'current');
});
