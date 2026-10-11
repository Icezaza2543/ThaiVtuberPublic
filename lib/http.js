export function noIndexHeaders(){return {'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'};}
export function jsonResponse(status, body, extraHeaders={}){
  return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8',...extraHeaders}});
}
export function methodNotAllowed(allowed){return jsonResponse(405,{error:'method_not_allowed'},{Allow:Array.isArray(allowed)?allowed.join(', '):String(allowed)});}

// Browsers still get no-store (vercel.json); only Vercel's CDN caches successful snapshot reads, so most
// requests never reach a function or Redis. Errors are never cached. Responses carrying a 15-minute cursor
// keep max-age + stale well under that, so a cached next_cursor is still valid.
export function cdnCachedHeaders(seconds,{stale=86400}={}){
  const extra=stale>0?`, stale-while-revalidate=${stale}, stale-if-error=${stale}`:'';
  return {...noIndexHeaders(),'Vercel-CDN-Cache-Control':`max-age=${seconds}${extra}`};
}
