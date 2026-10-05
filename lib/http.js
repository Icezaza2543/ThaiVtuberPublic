export function noIndexHeaders(){return {'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'};}
export function jsonResponse(status, body, extraHeaders={}){
  return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8',...extraHeaders}});
}
export function methodNotAllowed(allowed){return jsonResponse(405,{error:'method_not_allowed'},{Allow:Array.isArray(allowed)?allowed.join(', '):String(allowed)});}
