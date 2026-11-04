import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
test('页面编辑保存与导出任务逐字一致；草稿不覆盖；回传不能修改要求',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'final-prompt-http-'));
 const fixture=JSON.parse(fs.readFileSync('seed.json'));
 fixture.projects=[{id:'prompts',workflow:'creative',flowVersion:5,name:'合书',duration:2,story:'回忆',brief:'',audio:'/assets/song.mp3',shots:[{title:'合书',start:0,end:2,image:'/assets/stills/01.png',imageRole:'first-frame',prompt:'构图草稿',production:{imagePrompt:'打开的书',startState:'开书',endState:'合上',beats:[{at:0,action:'合书'},{at:1,action:'停住'}],camera:'locked',transition:'cut',continuity:'固定书脊',execution:{actionType:'prop',method:'封面绕书脊合上',requiredAssets:['封面'],successCriteria:'合上书'}},finalPrompts:{image:'页面原始图片提示词',motion:'页面原始动态提示词'}}]}];fixture.jobs=[];
 fs.writeFileSync(path.join(dir,'studio.json'),JSON.stringify(fixture));
 const child=spawn(process.execPath,['server.mjs'],{cwd:path.resolve('.'),env:{...process.env,PORT:'15429',STUDIO_DATA:dir,STUDIO_DEVELOPER_MODE:'1'},windowsHide:true,stdio:'pipe'});
 try{
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',c=>reject(Error('server exit '+c)));});
  const root='http://127.0.0.1:15429',route='/api/projects/prompts';
  const get=async url=>(await(await fetch(root+url)).json());
  const post=async(url,body,method='POST')=>{const r=await fetch(root+url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
  const current=async()=>(await get('/api/state')).projects[0];
  let p=await current();p.shots[0].finalPrompts={image:'  页面编辑图片\n保持开书。\n',motion:'  页面编辑动态\n完整合书，不能轻压代替。\n'};
  assert.equal((await post(route,{expectedUpdatedAt:p.updatedAt,shots:p.shots},'PATCH')).status,200);
  p=await current();const exact=structuredClone(p.shots[0].finalPrompts);
  p.shots[0].production.endState='不应自动传递的草稿';
  assert.equal((await post(route,{shots:p.shots},'PATCH')).status,200);
  const draft=await get(route+'/prompt-drafts?index=0');assert.match(draft.motion,/不应自动传递的草稿/);
  assert.deepEqual((await current()).shots[0].finalPrompts,exact);
  assert.equal((await post(route+'/generate',{scope:'clips',indices:[0],executor:'manual'})).status,202);
  let tasks=await get(route+'/generation-tasks');
  // Image text changed, so regenerate the start frame before running motion.
  assert.equal(tasks.tasks.find(t=>t.kind==='image').request.prompt,exact.image);
  const motion=tasks.tasks.find(t=>t.kind==='motion');assert.equal(motion.request.prompt,exact.motion);
  assert.equal((await post(route+'/generation-result',{taskId:motion.id,artifact:'/uploads/unused.mp4',sourceDescription:'test',shots:[]})).status,400);
  assert.deepEqual((await current()).shots[0].finalPrompts,exact);
  p=await current();p.shots[0].finalPrompts.motion+='新版本';assert.equal((await post(route,{shots:p.shots},'PATCH')).status,200);
  tasks=await get(route+'/generation-tasks');assert.equal(tasks.tasks.length,0);assert.equal(tasks.historicalTaskCount,2);
  p=await current();p.shots[0].finalPrompts=null;assert.equal((await post(route,{shots:p.shots},'PATCH')).status,400);
 }finally{child.kill();await new Promise(resolve=>child.once('exit',resolve));fs.rmSync(dir,{recursive:true,force:true});}
});
