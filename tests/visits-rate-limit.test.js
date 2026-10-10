import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { handleVisits } from '../api/visits.js';
const salt=Buffer.alloc(32,9).toString('base64url');
function db(){
 const values=new Map(),calls=[];
 return {calls,redis:async commands=>commands.map(([op,key,value,...args])=>{
  calls.push([op,key,value,...args]);
  if(op==='SET'){if(values.has(key))return null;values.set(key,value);return 'OK';}
  if(op==='INCR'){const n=Number(values.get(key)||0)+1;values.set(key,n);return n;}
  if(op==='GET')return values.get(key)??null;
  if(op==='EXPIRE')return 1;
  throw Error('unexpected command');
 })};
}
const post=ip=>new Request('https://test/api/visits',{method:'POST',headers:{'x-vercel-forwarded-for':ip,'x-forwarded-for':'203.0.113.250'}});
const now=new Date('2026-10-10T16:59:00Z');

test('concurrent repeated POSTs count once per salted IP and Bangkok day; GET never sets keys',async()=>{
 const {redis,calls}=db();
 const options={redis,now,salt};
 const responses=await Promise.all(Array.from({length:12},()=>handleVisits(post('203.0.113.1'),options)));
 assert.ok(responses.every(r=>r.status===200));
 const r=await handleVisits(new Request('https://test/api/visits'),options);
 assert.deepEqual(await r.json(),{total:1,today:1});
 assert.equal(calls.filter(c=>c[0]==='INCR').length,2);
 const expected=createHash('sha256').update(JSON.stringify(['203.0.113.1','2026-10-10',salt])).digest('hex');
 const set=calls.find(c=>c[0]==='SET');
 assert.deepEqual(set,['SET',`visits:seen:${expected}`,'1','NX','EX',60]);
 assert.equal(JSON.stringify(calls).includes('203.0.113.1'),false);
 await handleVisits(post('203.0.113.2'),options);
 assert.deepEqual(await (await handleVisits(post('203.0.113.1'),{...options,now:new Date('2026-10-10T17:00:00Z')})).json(),{total:3,today:1});
});

test('missing IP or salt fails closed without incrementing or logging raw IP',async t=>{
 const {redis,calls}=db();const logs=[];t.mock.method(console,'error',s=>logs.push(s));
 assert.equal((await handleVisits(post('203.0.113.1'),{redis,now,salt:''})).status,503);
 assert.match(logs[0],/VTHAIDEX_CURSOR_SECRET/);
 assert.equal((await handleVisits(new Request('https://test/api/visits',{method:'POST'}),{redis,now,salt})).status,503);
 assert.equal(calls.length,0);assert.equal(logs.join(' ').includes('203.0.113.1'),false);
});

test('IPv6 spelling is canonicalized so it cannot bypass the daily limit',async()=>{
 const {redis}=db();const options={redis,now,salt};
 await handleVisits(post('2001:db8::1'),options);
 const r=await handleVisits(post('2001:0db8:0:0:0:0:0:1'),options);
 assert.deepEqual(await r.json(),{total:1,today:1});
});
