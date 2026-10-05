import test from 'node:test';
import assert from 'node:assert/strict';
import { signingDigest, verifyPublishRequest } from '../lib/publish-auth.js';

const secret='publish-secret-for-tests';
const now=1_791_190_000_000;
const timestamp=String(Math.floor(now/1000));
const body=Buffer.from('{"hello":"world"}');

test('valid publish signature succeeds',()=>{
  const signature=signingDigest(body,timestamp,secret);
  assert.equal(verifyPublishRequest({rawBody:body,timestamp,signature},{secret,now}),true);
});

test('modified body fails',()=>{
  const signature=signingDigest(body,timestamp,secret);
  assert.throws(()=>verifyPublishRequest({rawBody:Buffer.from('{"hello":"tampered"}'),timestamp,signature},{secret,now}),/unauthorized/i);
});

test('modified timestamp fails',()=>{
  const signature=signingDigest(body,timestamp,secret);
  assert.throws(()=>verifyPublishRequest({rawBody:body,timestamp:String(Number(timestamp)+1),signature},{secret,now}),/unauthorized/i);
});

test('timestamps outside five minute window fail',()=>{
  for(const offset of [-301,301]){
    const ts=String(Math.floor(now/1000)+offset);
    const sig=signingDigest(body,ts,secret);
    assert.throws(()=>verifyPublishRequest({rawBody:body,timestamp:ts,signature:sig},{secret,now}),/unauthorized/i);
  }
});

test('missing secret fails closed',()=>{
  assert.throws(()=>verifyPublishRequest({rawBody:body,timestamp,signature:'00'},{secret:'',now}),/configuration|secret/i);
});


import { readFileSync } from 'node:fs';

test('Node verifier matches shared Python signing vector',()=>{
  const vector=JSON.parse(readFileSync(new URL('./fixtures/publish-signature.json',import.meta.url),'utf8'));
  const raw=Buffer.from(vector.raw_body,'utf8');
  assert.equal(signingDigest(raw,vector.timestamp,vector.secret),vector.signature);
});
