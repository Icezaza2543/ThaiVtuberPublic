import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptSubmission, canonicalAad } from '../assets/js/intake-crypto.js';
import { validateIdentity, validatePlatforms, buildSubmission } from '../assets/js/contribute.js';
const b64uToBytes=s=>Uint8Array.from(Buffer.from(s,'base64url'));
test('encryptSubmission produces authenticated hybrid envelope with no plaintext marker',async()=>{const pair=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt']);const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);jwk.kid='test-kid';jwk.alg='RSA-OAEP-256';jwk.use='enc';const data={name:'UNIQUE-PLAINTEXT-MARKER',evidence:'https://example.com/private-marker'};const envelope=await encryptSubmission(data,jwk);assert.equal(envelope.v,1);assert.equal(envelope.kid,'test-kid');assert.equal(envelope.alg,'RSA-OAEP-256+A256GCM');assert.equal(JSON.stringify(envelope).includes('UNIQUE-PLAINTEXT-MARKER'),false);const aesRaw=await crypto.subtle.decrypt({name:'RSA-OAEP'},pair.privateKey,b64uToBytes(envelope.wrapped_key));const aes=await crypto.subtle.importKey('raw',aesRaw,{name:'AES-GCM'},false,['decrypt']);const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64uToBytes(envelope.iv),additionalData:new TextEncoder().encode(canonicalAad(envelope))},aes,b64uToBytes(envelope.ciphertext));assert.deepEqual(JSON.parse(new TextDecoder().decode(plain)),data);});
test('identity validation requires public creator name',()=>{assert.deepEqual(validateIdentity({name:'   '}),{ok:false,error:'กรุณากรอกชื่อ VTuber'});assert.equal(validateIdentity({name:'Alpha'}).ok,true);});
test('platform validation requires one valid public URL',()=>{assert.equal(validatePlatforms({youtube:'',x:'',other:''}).ok,false);assert.equal(validatePlatforms({youtube:'javascript:alert(1)',x:'',other:''}).ok,false);assert.equal(validatePlatforms({youtube:'https://youtube.com/@alpha',x:'',other:''}).ok,true);});
test('buildSubmission contains creator public facts only',()=>{const value=buildSubmission({name:'Alpha',agency:'Indie',debut:'2024',status:'active',youtube:'https://youtube.com/@a',x:'',other:'',evidence:'https://example.com/post'});assert.equal(value.creator.name,'Alpha');assert.equal(value.platforms.youtube,'https://youtube.com/@a');assert.equal('email' in value,false);assert.equal('submitter' in value,false);});


test('platform validation checks the expected host for YouTube and X',()=>{
  assert.equal(validatePlatforms({youtube:'https://x.com/alpha',x:'',other:''}).ok,false);
  assert.equal(validatePlatforms({youtube:'https://www.youtube.com/@alpha',x:'',other:''}).ok,true);
  assert.equal(validatePlatforms({youtube:'',x:'https://youtube.com/@alpha',other:''}).ok,false);
  assert.equal(validatePlatforms({youtube:'',x:'https://twitter.com/alpha',other:''}).ok,true);
  assert.equal(validatePlatforms({youtube:'',x:'https://x.com/alpha',other:''}).ok,true);
});
