import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCreatorUrl, creatorSummary, fetchCreatorsPage, fetchOverview } from '../src/lib/api.js';

test('overview fetches only the stats endpoint', async()=>{
  const calls=[];const fake=async url=>{calls.push(String(url));return new Response(JSON.stringify({total_vtubers:1,meta:{generated_at:'2026-10-05T10:00:00Z'},platforms:[],lifecycle:[],debut_trend:[],known_debut_year_count:0}),{status:200});};
  const data=await fetchOverview(fake);assert.equal(data.total_vtubers,1);assert.deepEqual(calls,['/api/stats']);
});
test('directory query is bounded and contains only active search filters',()=>{assert.equal(buildCreatorUrl({q:'alpha',platform:'youtube',status:'active',cursor:'opaque',limit:24}),'/api/creators?q=alpha&platform=youtube&status=active&cursor=opaque&limit=24');});
test('directory rejects client page sizes over 24',()=>{assert.throws(()=>buildCreatorUrl({limit:25}),/24/);});
test('fetchCreatorsPage returns one bounded page without accumulating global data',async()=>{const calls=[];const fake=async url=>{calls.push(String(url));return new Response(JSON.stringify({items:[{name:'Alpha',status:'active',platforms:[]}],next_cursor:'next'}),{status:200});};const page=await fetchCreatorsPage({q:'alpha',limit:24},fake);assert.equal(page.items.length,1);assert.equal(page.next_cursor,'next');assert.equal(calls.length,1);});


test('creator summary shows only API-provided facts and never invents an avatar',()=>{
  const c=creatorSummary({name:'Alpha',agency:'Indie',status:'active',debut_year:2024,platforms:[{name:'youtube',url:'https://youtube.com/@alpha'},{name:'x',url:null}]});
  assert.deepEqual(c,{name:'Alpha',agency:'Indie',statusLabel:'กำลังทำกิจกรรม',debutYear:2024,links:[{name:'youtube',label:'YouTube',url:'https://youtube.com/@alpha'}]});
  const bare=creatorSummary({name:'Beta',status:'unknown',platforms:[]});
  assert.equal(bare.agency,'Independent');assert.equal(bare.statusLabel,null);assert.equal('avatar' in bare,false);
});
