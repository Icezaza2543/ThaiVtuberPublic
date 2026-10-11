import { logApiError } from '../lib/api-error.js';
import { randomInt } from 'node:crypto';
import * as defaultStorage from '../lib/storage.js';
import { cdnCachedHeaders, jsonResponse, noIndexHeaders } from '../lib/http.js';

const MAX = 6;

/** A few random independent creators, to give small VTubers some visibility. Bounded: at most 6 per request. */
export async function handleSpotlight(request,{storage=defaultStorage,random=randomInt}={}){
  if(request.method!=='GET') return jsonResponse(405,{error:'method_not_allowed'},{...noIndexHeaders(),Allow:'GET'});
  const params=new URL(request.url).searchParams;
  const raw=params.get('n')??'3';
  if(!/^\d+$/.test(raw)) return jsonResponse(400,{error:'invalid_query'},noIndexHeaders());
  const n=Number(raw);
  if(n<1||n>MAX) return jsonResponse(400,{error:'invalid_query'},noIndexHeaders());
  const platform=(params.get('platform')??'').trim().toLowerCase().slice(0,32);
  let snapshot;
  try{snapshot=await storage.readCurrentSnapshot();}catch(err){logApiError('/api/spotlight',err);return jsonResponse(503,{error:'data_unavailable'},noIndexHeaders());}
  if(!snapshot){logApiError('/api/spotlight',new Error('snapshot unavailable'));return jsonResponse(503,{error:'data_unavailable'},noIndexHeaders());}
  const pool=snapshot.creators.filter(c=>!c.agency&&(c.platforms||[]).some(p=>p.url&&(!platform||p.name===platform)));
  const picked=[];
  const taken=new Set();
  while(picked.length<Math.min(n,pool.length)){
    const i=random(pool.length);
    if(taken.has(i))continue;
    taken.add(i);picked.push(pool[i]);
  }
  return jsonResponse(200,{items:picked},cdnCachedHeaders(30));
}

export function GET(request){return handleSpotlight(request);}
export default {fetch:GET};
