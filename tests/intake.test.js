import test from 'node:test';import assert from 'node:assert/strict';import {createMemoryStorage} from './storage-fake.js';import {issueIntakeToken} from '../lib/intake.js';import {handleIntakeToken} from '../api/intake-token.js';import {handleIntake} from '../api/intake.js';
const secret='intake-token-secret-test',now=1_791_190_000_000,origin='https://vthaidex.test';const envelope={v:1,kid:'vtd-test-01',alg:'RSA-OAEP-256+A256GCM',iv:'AAAAAAAAAAAAAAAA',wrapped_key:'A'.repeat(512),ciphertext:'B'.repeat(200)};const body=async r=>JSON.parse(await r.text());const tokenAt=async(time=now-5000)=>issueIntakeToken({secret,now:time,nonce:'test-nonce'}).token;function request(payload,{requestOrigin=origin,headers={}}={}){return new Request(origin+'/api/intake',{method:'POST',headers:{'content-type':'application/json','origin':requestOrigin,'user-agent':'SecretUA','referer':'https://secret.example/','cookie':'session=secret',...headers},body:JSON.stringify(payload)});}
test('intake token is short lived and contains no identity fields',async()=>{const response=await handleIntakeToken(new Request(origin+'/api/intake-token'),{secret,now,nonce:'nonce-1',enabled:true});assert.equal(response.status,200);const payload=await body(response);assert.ok(payload.token);assert.equal(JSON.stringify(payload).includes('ip'),false);assert.equal(JSON.stringify(payload).includes('user'),false);});
test('valid ciphertext-only submission stores no request identity metadata or plaintext marker',async()=>{const storage=createMemoryStorage();const response=await handleIntake(request({token:await tokenAt(),honeypot:'',client_elapsed_ms:5000,envelope}),{storage,tokenSecret:secret,now,keyIds:new Set(['vtd-test-01']),randomId:()=> 'random-id',enabled:true});assert.equal(response.status,202);const rows=await storage.listIntake('pending');assert.equal(rows.length,1);const stored=JSON.stringify(rows[0]);assert.equal(rows[0].id,'random-id');assert.equal(stored.includes('SecretUA'),false);assert.equal(stored.includes('secret.example'),false);assert.equal(stored.includes('session=secret'),false);assert.equal('token' in rows[0],false);assert.equal((await body(response)).id,undefined);});
test('bad origin honeypot young token and unknown key fail',async()=>{for(const [payload,options] of [[{token:await tokenAt(),honeypot:'',client_elapsed_ms:5000,envelope},{requestOrigin:'https://evil.example'}],[{token:await tokenAt(),honeypot:'filled',client_elapsed_ms:5000,envelope},{}],[{token:issueIntakeToken({secret,now,nonce:'new'}).token,honeypot:'',client_elapsed_ms:5000,envelope},{}],[{token:await tokenAt(),honeypot:'',client_elapsed_ms:5000,envelope:{...envelope,kid:'unknown'}},{}]]){const storage=createMemoryStorage();const response=await handleIntake(request(payload,options),{storage,tokenSecret:secret,now,keyIds:new Set(['vtd-test-01']),randomId:()=> 'id',enabled:true});assert.ok(response.status>=400);assert.equal((await storage.listIntake('pending')).length,0);}});
test('intake rejects plaintext fields alongside envelope',async()=>{const storage=createMemoryStorage();const response=await handleIntake(request({token:await tokenAt(),honeypot:'',client_elapsed_ms:5000,envelope,name:'PLAINTEXT'}),{storage,tokenSecret:secret,now,keyIds:new Set(['vtd-test-01']),randomId:()=> 'id',enabled:true});assert.equal(response.status,400);assert.equal((await storage.listIntake('pending')).length,0);});


import { handleInternalIntake } from '../api/internal/intake.js';
import { handleMaintenance } from '../api/maintenance.js';

test('internal intake queue requires operator authentication',async()=>{
  const storage=createMemoryStorage();await storage.storeIntake({id:'a',state:'pending',received_at:'2026-10-01T00:00:00Z',envelope});
  const request=new Request(origin+'/api/internal/intake?state=pending');
  const response=await handleInternalIntake(request,{storage,operatorSecret:'operator-secret',now});
  assert.equal(response.status,401);
});

test('internal intake list exposes bounded metadata but not ciphertext',async()=>{
  const storage=createMemoryStorage();
  for(let i=0;i<3;i++)await storage.storeIntake({id:`id-${i}`,state:'pending',received_at:`2026-10-0${i+1}T00:00:00Z`,envelope:{...envelope,kid:'vtd-test-01'}});
  const request=new Request(origin+'/api/internal/intake?state=pending&limit=2',{headers:{authorization:'Bearer operator-secret'}});
  const response=await handleInternalIntake(request,{storage,operatorSecret:'operator-secret',now});
  assert.equal(response.status,200);const payload=await body(response);assert.equal(payload.items.length,2);assert.ok(payload.next_cursor);
  assert.deepEqual(Object.keys(payload.items[0]).sort(),['id','kid','received_at','state'].sort());
  assert.equal(JSON.stringify(payload).includes('ciphertext'),false);
});

test('internal intake fetch returns one encrypted record and patch moves state',async()=>{
  const storage=createMemoryStorage();await storage.storeIntake({id:'one',state:'pending',received_at:'2026-10-01T00:00:00Z',envelope});
  const auth={authorization:'Bearer operator-secret'};
  const getResponse=await handleInternalIntake(new Request(origin+'/api/internal/intake?state=pending&id=one',{headers:auth}),{storage,operatorSecret:'operator-secret',now});
  assert.equal(getResponse.status,200);const fetched=await body(getResponse);assert.equal(fetched.id,'one');assert.equal(fetched.envelope.ciphertext,envelope.ciphertext);
  const patchResponse=await handleInternalIntake(new Request(origin+'/api/internal/intake',{method:'PATCH',headers:{...auth,'content-type':'application/json'},body:JSON.stringify({id:'one',from_state:'pending',to_state:'reviewed'})}),{storage,operatorSecret:'operator-secret',now});
  assert.equal(patchResponse.status,204);assert.equal((await storage.listIntake('pending')).length,0);assert.equal((await storage.listIntake('reviewed')).length,1);
});

test('maintenance requires cron secret and purges according to retention windows',async()=>{
  const storage=createMemoryStorage();
  await storage.storeIntake({id:'pending-old',state:'pending',received_at:'2026-07-01T00:00:00Z',envelope});
  await storage.storeIntake({id:'pending-new',state:'pending',received_at:'2026-09-20T00:00:00Z',envelope});
  const denied=await handleMaintenance(new Request(origin+'/api/maintenance'),{storage,cronSecret:'cron-secret',now:new Date('2026-10-05T00:00:00Z')});assert.equal(denied.status,401);
  const allowed=await handleMaintenance(new Request(origin+'/api/maintenance',{headers:{authorization:'Bearer cron-secret'}}),{storage,cronSecret:'cron-secret',now:new Date('2026-10-05T00:00:00Z')});assert.equal(allowed.status,200);assert.deepEqual(await body(allowed),{purged:{pending:1,reviewed:0,rejected:0}});
});


test('intake token endpoint is disabled by default until explicitly enabled',async()=>{
  const response=await handleIntakeToken(new Request(origin+'/api/intake-token'),{secret,now,nonce:'nonce-disabled',enabled:false});
  assert.equal(response.status,503);assert.deepEqual(await body(response),{error:'intake_disabled'});
});

test('intake token endpoint issues token only when explicitly enabled',async()=>{
  const response=await handleIntakeToken(new Request(origin+'/api/intake-token'),{secret,now,nonce:'nonce-enabled',enabled:true});
  assert.equal(response.status,200);assert.ok((await body(response)).token);
});


test('intake POST is disabled even when a previously issued token is still valid',async()=>{
  const storage=createMemoryStorage();
  const response=await handleIntake(request({token:await tokenAt(),honeypot:'',client_elapsed_ms:5000,envelope}),{storage,tokenSecret:secret,now,keyIds:new Set(['vtd-test-01']),randomId:()=> 'id',enabled:false});
  assert.equal(response.status,503);assert.deepEqual(await body(response),{error:'intake_disabled'});
  assert.equal((await storage.listIntake('pending')).length,0);
});
