import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {installWorkflow} from '../public/creative-ui.js';

test('旧项目可切换三个页签，原分镜不依赖视频或创作流程状态',async()=>{
 const listeners=[];
 const previousDocument=globalThis.document;
 globalThis.document={querySelectorAll:()=>[],addEventListener(type,handler){if(type==='click')listeners.push(handler);}};
 try{
  const p=JSON.parse(fs.readFileSync('data/studio.json')).projects.find(p=>p.id==='sample');
  const before=JSON.stringify(p);
  let saves=0;
  const ui=installWorkflow({$:()=>null,esc:s=>String(s??''),current:()=>p,state:{jobs:[],characters:[],styles:[]},saveEditor:async()=>{saves++;},render(){},perform:fn=>fn()});
  let html=ui.editorView(p);
  assert.ok(html.includes('此旧项目未单独保存故事方案正文'));
  assert.equal((html.match(/class="core-shot"/g)||[]).length,18);
  for(const shot of p.shots){assert.ok(html.includes(shot.title));assert.ok(html.includes(shot.prompt));}
  assert.ok(html.includes('/assets/stills/01.png'));
  assert.ok(html.includes('/assets/stills/18.png'));
  assert.ok(!html.includes('data-creative="plan"'));
  assert.ok(!html.includes('data-plan-shot'));
  assert.deepEqual(ui.planValues(),{});
  for(const view of ['film','sample','plan']){
   await listeners[0]({target:{closest:selector=>selector==='[data-creative-view]'?{dataset:{creativeView:view}}:null}});
   html=ui.editorView(p);
   assert.ok(html.includes(`class="active" data-creative-view="${view}"`));
   if(view==='sample'){assert.ok(html.includes('未保存独立动态样片'));assert.ok(!html.includes('<video'));}
   if(view==='plan')assert.ok(html.includes(p.shots[17].prompt));
  }
  assert.equal(saves,3);
  assert.equal(JSON.stringify(p),before);
  const other={...p,id:'other',shots:[{...p.shots[0],image:'/uploads/own.png'},p.shots[1]]};
  html=ui.editorView(other);
  assert.ok(html.includes('/uploads/own.png'));
  assert.ok(!html.includes('/assets/stills/'));
 }finally{globalThis.document=previousDocument;}
});
