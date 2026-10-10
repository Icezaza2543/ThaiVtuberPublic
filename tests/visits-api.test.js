import test from 'node:test';
import assert from 'node:assert/strict';
import { handleVisits, bangkokDay } from '../api/visits.js';
import { fetchVisits } from '../src/lib/api.js';

function fakeRedis(){
  const db=new Map(), calls=[];
  const redis=async cmds=>cmds.map(([op,k])=>{calls.push(op);
    if(op==='INCR'){db.set(k,(db.get(k)||0)+1);return db.get(k);}
    if(op==='GET') return db.has(k)?String(db.get(k)):null; return 1;});
  return {redis,calls};
}
const json=async r=>JSON.parse(await r.text());

test('POST counts a visit for total and the Bangkok day; GET only reads',async()=>{
  const {redis}=fakeRedis(); const now=new Date('2026-10-10T18:00:00Z'); // 01:00 on the 11th in Bangkok
  assert.equal(bangkokDay(now),'2026-10-11');
  await handleVisits(new Request('https://t/api/visits',{method:'POST'}),{redis,now});
  const r=await handleVisits(new Request('https://t/api/visits',{method:'POST'}),{redis,now});
  assert.deepEqual(await json(r),{total:2,today:2});
  const g=await handleVisits(new Request('https://t/api/visits'),{redis,now:new Date('2026-10-12T05:00:00Z')});
  assert.deepEqual(await json(g),{total:2,today:0});
});

test('missing Upstash config or bad method fails closed',async()=>{
  assert.equal((await handleVisits(new Request('https://t/api/visits'),{redis:null})).status,503);
  assert.equal((await handleVisits(new Request('https://t/api/visits',{method:'DELETE'}),{redis:async()=>[]})).status,405);
});

test('browser posts once per day, then reads',async()=>{
  const store=new Map(), ls={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
  const methods=[]; const f=async(_u,o)=>{methods.push(o.method);return new Response('{"total":1,"today":1}');};
  const now=new Date('2026-10-10T05:00:00Z');
  await fetchVisits(f,ls,now); await fetchVisits(f,ls,now);
  await fetchVisits(f,ls,new Date('2026-10-11T05:00:00Z'));
  assert.deepEqual(methods,['POST','GET','POST']);
});
