import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeCursor, decodeCursor } from '../lib/cursor.js';

const secret = Buffer.alloc(32, 7).toString('base64url');
const now = 1_791_190_000_000;
const state = {v:1,snapshot:'snap-1',pos:24,q:'alpha',platform:'youtube',status:'active',exp:Math.floor(now/1000)+900};
const expected = {snapshot:'snap-1',q:'alpha',platform:'youtube',status:'active'};

test('cursor round trips when state matches', () => {
  const token = encodeCursor(state,{secret,now});
  assert.deepEqual(decodeCursor(token, expected,{secret,now}), state);
});

test('tampering one byte fails authentication', () => {
  const token = encodeCursor(state,{secret,now});
  const chars = token.split('');
  chars[chars.length-2] = chars[chars.length-2] === 'A' ? 'B' : 'A';
  assert.throws(()=>decodeCursor(chars.join(''), expected,{secret,now}), /invalid cursor/i);
});

test('expired cursor fails', () => {
  const expired = {...state,exp:Math.floor(now/1000)-1};
  const token = encodeCursor(expired,{secret,now});
  assert.throws(()=>decodeCursor(token, expected,{secret,now}), /expired|invalid cursor/i);
});

test('cursor for another snapshot fails', () => {
  const token = encodeCursor(state,{secret,now});
  assert.throws(()=>decodeCursor(token,{...expected,snapshot:'snap-2'},{secret,now}), /invalid cursor/i);
});

test('cursor filter mismatch fails', () => {
  const token = encodeCursor(state,{secret,now});
  assert.throws(()=>decodeCursor(token,{...expected,q:'beta'},{secret,now}), /invalid cursor/i);
});

test('malformed token fails with generic error', () => {
  assert.throws(()=>decodeCursor('not-a-cursor', expected,{secret,now}), /^Error: invalid cursor$/i);
});
