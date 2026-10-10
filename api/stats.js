import { logApiError } from '../lib/api-error.js';
import * as defaultStorage from '../lib/storage.js';
import { jsonResponse, noIndexHeaders } from '../lib/http.js';

export async function handleStats(request,{storage=defaultStorage}={}){
  if(request.method!=='GET') return jsonResponse(405,{error:'method_not_allowed'},{...noIndexHeaders(),Allow:'GET'});
  let snapshot;
  try{snapshot=await storage.readCurrentSnapshot();}catch(err){logApiError('/api/stats',err);return jsonResponse(503,{error:'data_unavailable'},noIndexHeaders());}
  if(!snapshot){logApiError('/api/stats',new Error('snapshot unavailable'));return jsonResponse(503,{error:'data_unavailable'},noIndexHeaders());}
  return jsonResponse(200,{...snapshot.summary,meta:snapshot.meta},noIndexHeaders());
}
export function GET(request){return handleStats(request);}
export default {fetch:GET};
