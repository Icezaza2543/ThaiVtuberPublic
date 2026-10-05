import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export function bodySha256(rawBody){
  return createHash('sha256').update(rawBody).digest('hex');
}
export function signingDigest(rawBody,timestamp,secret){
  if(typeof secret!=='string'||!secret) throw new Error('publish secret configuration missing');
  const bodyHash=bodySha256(rawBody);
  return createHmac('sha256',secret).update(`${timestamp}.${bodyHash}`).digest('hex');
}
export function verifyPublishRequest({rawBody,timestamp,signature},{secret,now=Date.now()}={}){
  if(typeof secret!=='string'||!secret) throw new Error('publish secret configuration missing');
  if(!/^\d{10}$/.test(String(timestamp??''))||!/^[0-9a-f]{64}$/i.test(String(signature??''))) throw new Error('unauthorized publish');
  const ts=Number(timestamp);
  if(Math.abs(Math.floor(now/1000)-ts)>300) throw new Error('unauthorized publish');
  const expected=Buffer.from(signingDigest(rawBody,String(timestamp),secret),'hex');
  const provided=Buffer.from(String(signature),'hex');
  if(expected.length!==provided.length||!timingSafeEqual(expected,provided)) throw new Error('unauthorized publish');
  return true;
}
