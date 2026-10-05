import * as defaultStorage from '../../lib/storage.js';
import { jsonResponse, noIndexHeaders } from '../../lib/http.js';
import { verifyPublishRequest } from '../../lib/publish-auth.js';
import { validateSnapshot } from '../../lib/public-schema.js';

const MAX_BODY=3*1024*1024;

export async function handlePublish(request,{storage=defaultStorage,publishSecret=process.env.VTHAIDEX_PUBLISH_SECRET,now=Date.now()}={}){
  if(request.method!=='POST') return jsonResponse(405,{error:'method_not_allowed'},{...noIndexHeaders(),Allow:'POST'});
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json')) return jsonResponse(415,{error:'unsupported_media_type'},noIndexHeaders());
  const declared=Number(request.headers.get('content-length')||0);
  if(declared>MAX_BODY) return jsonResponse(413,{error:'payload_too_large'},noIndexHeaders());
  const rawBody=Buffer.from(await request.arrayBuffer());
  if(rawBody.byteLength>MAX_BODY) return jsonResponse(413,{error:'payload_too_large'},noIndexHeaders());
  try{
    verifyPublishRequest({rawBody,timestamp:request.headers.get('x-vthaidex-timestamp'),signature:request.headers.get('x-vthaidex-signature')},{secret:publishSecret,now});
  }catch(err){
    if(/configuration/i.test(err?.message||'')) return jsonResponse(503,{error:'publish_not_configured'},noIndexHeaders());
    return jsonResponse(401,{error:'unauthorized'},noIndexHeaders());
  }
  let snapshot;
  try{snapshot=validateSnapshot(JSON.parse(rawBody.toString('utf8')));}catch{return jsonResponse(400,{error:'invalid_snapshot'},noIndexHeaders());}
  const current=await storage.readCurrentSnapshot();
  if(current){
    const incoming=Date.parse(snapshot.meta.generated_at),existing=Date.parse(current.meta?.generated_at||'');
    if(!Number.isFinite(incoming)||!Number.isFinite(existing)||incoming<=existing) return jsonResponse(409,{error:'stale_snapshot'},noIndexHeaders());
  }
  await storage.writeSnapshot(snapshot);
  return jsonResponse(201,{snapshot_id:snapshot.snapshot_id,generated_at:snapshot.meta.generated_at},noIndexHeaders());
}

export function POST(request){return handlePublish(request);}
export default {fetch:POST};
