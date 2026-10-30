import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installWorkflow} from '../public/creative-ui.js';

test('镜头操作可见、动作编辑、意见选镜与所有镜头确认后的合成按钮',async()=>{
 const previous=globalThis.document,listeners={};let html='',modalHtml='',calls=[];
 globalThis.document={querySelectorAll:()=>[],addEventListener(type,fn){(listeners[type]||=[]).push(fn);}};
 const plan={imagePrompt:'纸山合拢',startState:'合拢',endState:'展开',camera:'locked',transition:'cut',continuity:'保持星片',beats:[{at:0,action:'静止'},{at:1,action:'展开'}],execution:{actionType:'scene',method:'分层展开',requiredAssets:['山层'],successCriteria:'底部稳定'}};
 const p={id:'ui',workflow:'creative',flowVersion:5,name:'纸山',duration:4,story:'展开回忆',brief:'温暖',audio:'/song.mp3',shots:[0,1].map(i=>({title:'纸山'+i,start:i*2,end:i*2+2,prompt:'纸山',production:structuredClone(plan)})),creativeFeedback:[{indices:[1],shotLabels:['镜头 2 · 纸山1'],note:'再慢一些'}],creativeFlow:{clips:[0,1].map(index=>({index,title:'纸山'+index,start:index*2,end:index*2+2,ready:false})),approvedCount:0,allApproved:false}};
 const ui=installWorkflow({$:()=>null,esc:s=>String(s??''),current:()=>p,state:{provider:{}},modal:(title,body)=>{modalHtml=body;},saveEditor:async()=>{},api:async(...v)=>calls.push(v),refresh:async()=>{},render:()=>{html=ui.editorView(p);},toast(){},perform:fn=>fn()});
 async function click(dataset,tab=false){const target={closest:selector=>selector===(tab?'[data-shot-view]':'[data-shot-action]')?{dataset}:null};await Promise.all(listeners.click.map(fn=>fn({target})));}
 try{
  html=ui.editorView(p);assert.ok(html.includes('生成此镜头样片'));assert.ok(html.includes('data-motion-key="startState"'));assert.ok(html.includes('data-beat-action'));assert.ok(html.includes('保存动作安排'));
  await click({shotView:'sample'},true);assert.equal((html.match(/class="clip-card"/g)||[]).length,2);assert.ok(html.includes('生成所选镜头'));assert.ok(html.includes('一键生成全部镜头'));assert.ok(html.includes('data-shot-action="compose" disabled'));assert.ok(html.includes('镜头 2 · 纸山1'));
  await click({shotAction:'feedback',index:'1',scope:'sample'});assert.ok(modalHtml.includes('type="checkbox" name="indices"'));assert.ok(modalHtml.includes('value="1" checked'));assert.ok(modalHtml.includes('保存意见并重做所选镜头'));
  await click({shotAction:'generate-one',index:'1'});assert.deepEqual(JSON.parse(calls.at(-1)[1].body),{scope:'clips',indices:[1],force:true});
  await click({shotAction:'generate-all'});assert.deepEqual(JSON.parse(calls.at(-1)[1].body),{scope:'clips',indices:[0,1],force:false});
  p.creativeFlow.allApproved=true;p.creativeFlow.approvedCount=2;html=ui.editorView(p);assert.ok(!html.includes('data-shot-action="compose" disabled'));assert.ok(!html.includes('按这个效果制作全片'));
 }finally{globalThis.document=previous;}
});
