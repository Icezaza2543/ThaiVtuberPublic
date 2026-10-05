import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStorage } from './storage-fake.js';
import { handleSpotlight } from '../api/spotlight.js';
import { handleCreators } from '../api/creators.js';

const cursorSecret=Buffer.alloc(32,9).toString('base64url');
function snapshot(){
  const creators=Array.from({length:20},(_,i)=>({name:`C${i}`,status:'unknown',...(i<5?{agency:'Big Agency'}:{}),
    platforms:[{name:i%2?'twitch':'youtube',url:`https://example.com/${i}`}]}));
  return {schema_version:2,snapshot_id:'s',meta:{generated_at:'2026-10-05T10:00:00Z'},summary:{total_vtubers:20,platforms:[],lifecycle:[],debut_trend:[],known_debut_year_count:0},creators};
}
const json=async r=>JSON.parse(await r.text());

test('spotlight returns only independent creators, distinct, at most 6',async()=>{
  const storage=createMemoryStorage();await storage.writeSnapshot(snapshot());
  const res=await handleSpotlight(new Request('https://t/api/spotlight?n=6'),{storage});
  const {items}=await json(res);
  assert.equal(res.status,200);assert.equal(items.length,6);
  assert.ok(items.every(c=>!c.agency));assert.equal(new Set(items.map(c=>c.name)).size,6);
  assert.equal((await handleSpotlight(new Request('https://t/api/spotlight?n=7'),{storage})).status,400);
  assert.equal((await handleSpotlight(new Request('https://t/api/spotlight?n=abc'),{storage})).status,400);
});

test('spotlight can be limited to one platform',async()=>{
  const storage=createMemoryStorage();await storage.writeSnapshot(snapshot());
  const {items}=await json(await handleSpotlight(new Request('https://t/api/spotlight?n=5&platform=twitch'),{storage}));
  assert.ok(items.length>0&&items.every(c=>c.platforms.some(p=>p.name==='twitch')));
});

test('creators scope filter separates independent and agency creators',async()=>{
  const storage=createMemoryStorage();await storage.writeSnapshot(snapshot());
  const indie=await json(await handleCreators(new Request('https://t/api/creators?scope=independent&limit=24'),{storage,cursorSecret}));
  const agency=await json(await handleCreators(new Request('https://t/api/creators?scope=agency&limit=24'),{storage,cursorSecret}));
  assert.equal(indie.items.length,15);assert.equal(agency.items.length,5);
  assert.equal((await handleCreators(new Request('https://t/api/creators?scope=nope'),{storage,cursorSecret})).status,400);
});
