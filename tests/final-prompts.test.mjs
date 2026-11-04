import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ensureFinalPrompts,promptDrafts} from '../final-prompts.mjs';
import {generationService,generationTask} from '../generation-tasks.mjs';
import {framePrompt,videoPrompt,sourceFingerprint} from '../production.mjs';
import {selectMediaVersion} from '../media-versions.mjs';
import {expand} from '../providers.mjs';

const plan={imagePrompt:'打开的笔记本',startState:'封面打开',endState:'封面合上夹住纸星',beats:[{at:0,action:'封面绕书脊合拢'},{at:1,action:'合上后停住'}],camera:'locked',transition:'cut',continuity:'书脊固定',execution:{actionType:'prop',method:'封面与手保持接触',requiredAssets:['封面','纸星'],successCriteria:'书真的合上，星角露出'}};
function fixture(){return {id:'p',flowVersion:5,story:'回忆',brief:'克制',shots:[{title:'合书',start:0,end:2,image:'/uploads/frame.png',imageRole:'first-frame',production:structuredClone(plan),finalPrompts:{image:'  页面图片提示词\n保持开书。\n',motion:'  页面动态提示词\n合书；不能用轻压书面代替。\n'}}]};}
test('最终文本原样派工；改草稿和历史意见不会覆盖；修改最终文本使旧任务失效',async()=>{
 const p=fixture(),s=p.shots[0],original=structuredClone(s.finalPrompts);
 p.creativeFeedback=[{indices:[0],note:'过期意见不应附加'}];
 const first=generationTask(p,0,'motion');const fingerprint=sourceFingerprint(s);
 s.production.endState='轻压书面';s.production.beats[1].action='手部小幅摆动';
 ensureFinalPrompts(p);
 assert.deepEqual(s.finalPrompts,original);assert.equal(sourceFingerprint(s),fingerprint);
 assert.equal(framePrompt(p,s),original.image);assert.equal(videoPrompt(p,s),original.motion);
 assert.equal(first.request.prompt,original.motion);assert.equal(first.request.shot.production,undefined);
 const DATA=fs.mkdtempSync(path.join(os.tmpdir(),'final-prompts-'));
 try{
  const service=generationService({db:{projects:[p],characters:[],styles:[]},DATA,save(){},config:()=>({generationExecutor:'manual'}),localAsset:u=>u,trackProjectFiles(){}});
  service.start(p,{scope:'clips'});const t=p.generationTasks[0];assert.equal(t.request.prompt,original.motion);
  await assert.rejects(service.result(p,{taskId:t.id,artifact:'/uploads/x.mp4',sourceDescription:'manual',finalPrompts:{motion:'偷偷替换'}}),/不能修改/);
  s.finalPrompts.motion='新的页面动态提示词';
  assert.equal(t.request.prompt,original.motion);
  await assert.rejects(service.result(p,{taskId:t.id,artifact:'/uploads/x.mp4',sourceDescription:'manual'}),/输入已变化/);
  service.start(p,{scope:'clips'});assert.equal(p.generationTasks.at(-1).request.prompt,s.finalPrompts.motion);
 }finally{fs.rmSync(DATA,{recursive:true,force:true});}
});
test('草稿只在显式应用时改变最终文本；接口模板不能改写提示词',()=>{
 const p=fixture(),draft=promptDrafts(p,0);assert.match(draft.motion,/封面合上夹住纸星/);assert.match(draft.motion,/封面与手保持接触/);
 assert.notEqual(p.shots[0].finalPrompts.motion,draft.motion);
 assert.equal(expand('{{prompt}}',{prompt:p.shots[0].finalPrompts.motion}),p.shots[0].finalPrompts.motion);
 assert.throws(()=>expand('额外要求：{{prompt}}',{prompt:'页面文本'}),/原样传递/);
});
test('历史样片不能恢复另一份旧提示词',()=>{
 const p=fixture(),s=p.shots[0];s.mediaVersions={motion:[{id:'old',url:'/uploads/old.mp4',inputs:{start:0,end:2,finalPrompts:{image:'旧图',motion:'旧版微动'}},motion:{}}]};
 assert.throws(()=>selectMediaVersion(p,{index:0,kind:'motion',versionId:'old'},()=>import.meta.filename),/不能覆盖/);
 assert.match(s.finalPrompts.motion,/不能用轻压书面代替/);
});
