import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {initialState} from '../src/core.js';
test('local API authorization, release validation, provider contract and fallback',async()=>{
 const temp=await mkdtemp(path.join(os.tmpdir(),'jingjian-test-'));
 process.env.JINGJIAN_DATA_DIR=temp;process.env.PORT='4189';process.env.WORLDLABS_API_KEY='test-only';process.env.LLM_API_KEY='test-only';process.env.LLM_BASE_URL='https://provider.invalid/v1';process.env.LLM_MODEL='test-model';
 const {route}=await import('../server.mjs');const server=http.createServer(route);await new Promise(resolve=>server.listen(4189,'127.0.0.1',resolve));
 const originalFetch=globalThis.fetch;const calls=[];let badLLM=false;
 globalThis.fetch=async(url,options={})=>{
  if(String(url).startsWith('https://api.worldlabs.ai/')){calls.push({url,options});assert.equal(options.headers['WLT-Api-Key'],'test-only');if(options.method==='POST'){const p=JSON.parse(options.body);assert.equal(p.model,'marble-1.1');assert.equal(p.world_prompt.type,'image');assert.equal(p.world_prompt.image_prompt.source,'uri');return Response.json({operation_id:'test-op',done:false});}return Response.json({operation_id:'test-op',done:true,response:{assets:{splats:{spz_urls:{'500k':'https://assets.invalid/test.spz'}}}}});}
  if(String(url).startsWith('https://provider.invalid/')){const p=JSON.parse(options.body);assert.equal(p.model,'test-model');assert.ok(p.messages[1].content.includes('publishedFact'));return Response.json({choices:[{message:{content:JSON.stringify({text:'This is a test answer.',sourceIds:badLLM?['invented']:['unesco'],known:true})}}]});}
  return originalFetch(url,options);
 };
 const base='http://127.0.0.1:4189';const post=(endpoint,data,origin=base)=>fetch(base+endpoint,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
 try{
  const health=await (await fetch(base+'/api/health')).json();assert.equal(health.world,true);assert.equal(JSON.stringify(health).includes('test-only'),false);
  assert.equal((await post('/api/releases',{project:initialState().draft},'https://evil.invalid')).status,403);
  const unreviewed=initialState().draft;unreviewed.points[0].reviewed=false;assert.equal((await post('/api/releases',{project:unreviewed})).status,400);
  const release=await (await post('/api/releases',{project:initialState().draft})).json();const read=await (await fetch(base+'/api/releases/'+release.id)).json();assert.equal(read.title,initialState().draft.title);
  const request={requestId:'test-request-id',prompt:'A calm Chinese garden by a lake.',imageUrl:'https://assets.invalid/ref.jpg'};
  const first=await (await post('/api/worlds',request)).json();assert.equal(first.operation_id,'test-op');await post('/api/worlds',request);assert.equal(calls.length,1,'same request ID must not charge twice');
  assert.equal((await fetch(base+'/api/worlds/unknown')).status,404);const op=await (await fetch(base+'/api/worlds/test-op')).json();assert.equal(op.done,true);
  const query={project:initialState().draft,question:'Tell me about this view',pointId:'willow',lang:'en'};const answer=await (await post('/api/guide',query)).json();assert.equal(answer.mode,'llm');badLLM=true;const fallback=await (await post('/api/guide',query)).json();assert.equal(fallback.mode,'retrieval');assert.equal(fallback.fallback,true);
  const unknown=await (await post('/api/guide',{...query,question:'Ticket prices today?'})).json();assert.equal(unknown.known,false);
 }finally{globalThis.fetch=originalFetch;await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
});
