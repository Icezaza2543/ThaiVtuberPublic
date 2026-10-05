import {timingSafeEqual} from 'node:crypto';
import * as defaultStorage from '../lib/storage.js';
import {jsonResponse,noIndexHeaders} from '../lib/http.js';

function authorized(request,secret){
  if(!secret)return false;
  const expected=Buffer.from(`Bearer ${secret}`),actual=Buffer.from(request.headers.get('authorization')||'');
  return expected.length===actual.length&&timingSafeEqual(expected,actual);
}

export async function handleMaintenance(request,{storage=defaultStorage,cronSecret=process.env.CRON_SECRET,now=new Date()}={}){
  const headers=noIndexHeaders();
  if(request.method!=='GET')return jsonResponse(405,{error:'method_not_allowed'},{...headers,Allow:'GET'});
  if(!cronSecret)return jsonResponse(503,{error:'maintenance_not_configured'},headers);
  if(!authorized(request,cronSecret))return jsonResponse(401,{error:'unauthorized'},headers);
  const purged=await storage.purgeExpiredIntake(now instanceof Date?now:new Date(now));
  return jsonResponse(200,{purged},headers);
}
export function GET(request){return handleMaintenance(request);}
export default{fetch:GET};
