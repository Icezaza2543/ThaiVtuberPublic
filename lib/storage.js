const RETENTION_DAYS={pending:60,reviewed:7,rejected:7};
const DAY=24*60*60*1000;

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
  const versionPath=`snapshots/${snapshot.snapshot_id}.json`;
  const version=await putPrivate(versionPath,snapshot);
  await putPrivate('snapshots/current.json',{snapshot_id:snapshot.snapshot_id,url:version.url,generated_at:snapshot.meta?.generated_at},{allowOverwrite:true});
  return {snapshot_id:snapshot.snapshot_id};
}

export async function readCurrentSnapshot(){
  const pointerBlob=await findOne('snapshots/current.json');
  if(!pointerBlob) return null;
  const pointer=await readJsonBlob(pointerBlob.url);
  if(!pointer?.url) return null;
  return readJsonBlob(pointer.url);
}

export async function storeIntake(record){
  const state=record.state||'pending';
  await putPrivate(`intake/${state}/${record.id}.json`,{...record,state});
  return {id:record.id};
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

export async function listIntake(state){
  if(!Object.hasOwn(RETENTION_DAYS,state)) throw new Error('invalid intake state');
  const {list}=await blob();
  const items=await collectBlobItems(list,`intake/${state}/`);
  const rows=[];
  for(const item of items) rows.push(await readJsonBlob(item.url));
  return rows.filter(Boolean).sort((a,b)=>String(a.received_at).localeCompare(String(b.received_at)));
}

export async function getIntake(id,state='pending'){
  const item=await findOne(`intake/${state}/${id}.json`);
  return item?readJsonBlob(item.url):null;
}

export async function moveIntake(id,fromState,toState){
  if(!Object.hasOwn(RETENTION_DAYS,fromState)||!Object.hasOwn(RETENTION_DAYS,toState)) throw new Error('invalid intake state');
  const item=await findOne(`intake/${fromState}/${id}.json`);
  if(!item) throw new Error('intake not found');
  const {del}=await blob();
  const record=await readJsonBlob(item.url);
  await putPrivate(`intake/${toState}/${id}.json`,{...record,state:toState,state_changed_at:new Date().toISOString()});
  await del(item.url);
}

export async function deleteIntake(id,state){
  const item=await findOne(`intake/${state}/${id}.json`);
  if(!item) return false;
  const {del}=await blob();
  await del(item.url);return true;
}

export async function purgeExpiredIntake(now=new Date()){
  const counts={pending:0,reviewed:0,rejected:0};
  for(const [state,days] of Object.entries(RETENTION_DAYS)){
    for(const record of await listIntake(state)){
      const basis=state==='pending'?record.received_at:(record.state_changed_at||record.received_at);
      if(now.getTime()-new Date(basis).getTime()>days*DAY){await deleteIntake(record.id,state);counts[state]++;}
    }
  }
  return counts;
}
