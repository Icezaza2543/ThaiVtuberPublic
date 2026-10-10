import { requireBlobConfig } from './config.js';
async function blob(){return import('@vercel/blob');}
export async function readJsonBlobWith(getFn,url){
  const result=await getFn(url,{access:'private',useCache:false});
  if(!result) return null;
  const text=await new Response(result.stream).text();
  return JSON.parse(text);
}
async function readJsonBlob(url){
  const {get}=await blob();
  return readJsonBlobWith(get,url);
}
async function findOne(pathname){
  const {list}=await blob();
  const {blobs}=await list({prefix:pathname,limit:2});
  return blobs.find(x=>x.pathname===pathname)||null;
}
async function putPrivate(pathname,value,{allowOverwrite=false}={}){
  const {put}=await blob();
  return put(pathname,JSON.stringify(value),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite});
}

export async function writeSnapshot(snapshot){
  requireBlobConfig();
  const versionPath=`snapshots/${snapshot.snapshot_id}.json`;
  const version=await putPrivate(versionPath,snapshot);
  await putPrivate('snapshots/current.json',{snapshot_id:snapshot.snapshot_id,url:version.url,generated_at:snapshot.meta?.generated_at},{allowOverwrite:true});
  return {snapshot_id:snapshot.snapshot_id};
}

export async function readCurrentSnapshot(){
  requireBlobConfig();
  const pointerBlob=await findOne('snapshots/current.json');
  if(!pointerBlob) return null;
  const pointer=await readJsonBlob(pointerBlob.url);
  if(!pointer?.url) return null;
  return readJsonBlob(pointer.url);
}

export async function collectBlobItems(listFn,prefix){
  const blobs=[];
  let cursor;
  do{
    const page=await listFn({prefix,limit:1000,...(cursor?{cursor}:{})});
    blobs.push(...(page.blobs||[]));
    if(!page.hasMore)break;
    if(!page.cursor)throw new Error('Blob pagination cursor missing');
    cursor=page.cursor;
  }while(true);
  return blobs;
}
