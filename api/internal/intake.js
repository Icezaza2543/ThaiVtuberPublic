import {createHmac,timingSafeEqual} from 'node:crypto';
import * as defaultStorage from '../../lib/storage.js';
import {jsonResponse,noIndexHeaders} from '../../lib/http.js';

const STATES=new Set(['pending','reviewed','rejected']);

function secureEqual(a,b){
  const left=Buffer.from(String(a??'')),right=Buffer.from(String(b??''));
  return left.length===right.length&&timingSafeEqual(left,right);
}
function authorized(request,secret){
  if(!secret)return false;
  const header=request.headers.get('authorization')||'';
  return secureEqual(header,`Bearer ${secret}`);
}
function signCursor(payload,secret){
  const encoded=Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig=createHmac('sha256',secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}
function readCursor(token,state,secret){
  if(!token)return 0;
  try{
    const [encoded,sig,...rest]=String(token).split('.');
    if(!encoded||!sig||rest.length||!secureEqual(sig,createHmac('sha256',secret).update(encoded).digest('base64url')))throw new Error();
    const value=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));
    if(value.v!==1||value.state!==state||!Number.isInteger(value.pos)||value.pos<0)throw new Error();
    return value.pos;
  }catch{throw new Error('invalid cursor');}
}
function metadata(record){return{id:record.id,state:record.state,received_at:record.received_at,kid:record.envelope?.kid??null};}

export async function handleInternalIntake(request,{storage=defaultStorage,operatorSecret=process.env.VTHAIDEX_OPERATOR_SECRET}={}){
  const headers=noIndexHeaders();
  if(!operatorSecret)return jsonResponse(503,{error:'operator_not_configured'},headers);
  if(!authorized(request,operatorSecret))return jsonResponse(401,{error:'unauthorized'},headers);
  const url=new URL(request.url);
  if(request.method==='GET'){
    const state=url.searchParams.get('state')||'pending';
    if(!STATES.has(state))return jsonResponse(400,{error:'invalid_state'},headers);
    const id=(url.searchParams.get('id')||'').trim();
    if(id){
      if(!/^[A-Za-z0-9_-]{1,128}$/.test(id))return jsonResponse(400,{error:'invalid_id'},headers);
      const record=await storage.getIntake(id,state);
      return record?jsonResponse(200,record,headers):jsonResponse(404,{error:'not_found'},headers);
    }
    const rawLimit=url.searchParams.get('limit')??'100';
    if(!/^\d+$/.test(rawLimit))return jsonResponse(400,{error:'invalid_limit'},headers);
    const limit=Number(rawLimit);
    if(limit<1||limit>100)return jsonResponse(400,{error:'invalid_limit'},headers);
    let pos;
    try{pos=readCursor(url.searchParams.get('cursor'),state,operatorSecret);}catch{return jsonResponse(400,{error:'invalid_cursor'},headers);}
    const rows=await storage.listIntake(state);
    if(pos>rows.length)return jsonResponse(400,{error:'invalid_cursor'},headers);
    const items=rows.slice(pos,pos+limit).map(metadata),nextPos=pos+items.length;
    return jsonResponse(200,{items,next_cursor:nextPos<rows.length?signCursor({v:1,state,pos:nextPos},operatorSecret):null},headers);
  }
  if(request.method==='PATCH'){
    if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return jsonResponse(415,{error:'unsupported_media_type'},headers);
    let value;try{value=await request.json();}catch{return jsonResponse(400,{error:'invalid_request'},headers);}
    if(!value||typeof value!=='object'||Array.isArray(value))return jsonResponse(400,{error:'invalid_request'},headers);
    const allowed=new Set(['id','from_state','to_state']);for(const k of Object.keys(value))if(!allowed.has(k))return jsonResponse(400,{error:'invalid_request'},headers);
    if(!/^[A-Za-z0-9_-]{1,128}$/.test(String(value.id||''))||value.from_state!=='pending'||!new Set(['reviewed','rejected']).has(value.to_state))return jsonResponse(400,{error:'invalid_transition'},headers);
    try{await storage.moveIntake(value.id,'pending',value.to_state);}catch(err){return /not found/i.test(err?.message||'')?jsonResponse(404,{error:'not_found'},headers):jsonResponse(500,{error:'storage_error'},headers);}
    return new Response(null,{status:204,headers});
  }
  return jsonResponse(405,{error:'method_not_allowed'},{...headers,Allow:'GET, PATCH'});
}
export function GET(request){return handleInternalIntake(request);}
export function PATCH(request){return handleInternalIntake(request);}
export default{fetch:request=>handleInternalIntake(request)};
