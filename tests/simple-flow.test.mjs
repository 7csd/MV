import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {productionService} from '../studio-production.mjs';
import {creativeFlowService,chooseSampleShots,flowSummary} from '../creative-flow.mjs';
import {sourceFingerprint,frameReviewFingerprint,sampleApproved} from '../production.mjs';

const plan={imagePrompt:'纸山尚未展开',startState:'纸山合拢',endState:'纸山展开',beats:[{at:0,action:'静止'},{at:1,action:'展开'}],camera:'locked',transition:'cut',continuity:'固定星片',execution:{actionType:'scene',method:'独立纸山绕底部打开',requiredAssets:['纸山层'],successCriteria:'完整展开且固定点稳定'}};
test('先做短样片；确认前拦截全片生图；确认和修改绑定实际版本',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'paperlight-simple-'));fs.mkdirSync(path.join(dir,'uploads'));let calls=0;
 const mock=http.createServer(async(req,res)=>{for await(const c of req){}calls++;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data:[{b64_json:fs.readFileSync('public/assets/stills/01.png').toString('base64')}]}));});await new Promise(r=>mock.listen(0,'127.0.0.1',r));
 try{
  const p={id:'generic-project',workflow:'creative',flowVersion:4,productionRoute:'layered',duration:6,audio:'/assets/song.mp3',lyrics:[],story:'让回忆展开',brief:'温柔纸艺',characterId:'C',styleId:'paper-gold',shots:Array.from({length:3},(_,i)=>({start:i*2,end:i*2+2,prompt:'独立纸山',title:'镜头'+i,production:structuredClone(plan)}))};
  p.shots[0].production.execution.actionType='interaction';p.sampleShots=chooseSampleShots(p);assert.deepEqual(p.sampleShots.map(s=>s.index),[0,1]);
  const db={projects:[p],jobs:[],characters:[{id:'C',image:'/assets/stills/01.png'}],styles:[{id:'paper-gold',image:'/assets/stills/02.png'}]},localAsset=url=>url.startsWith('/assets/')?path.resolve('public'+url):path.join(dir,url.slice(1));
  const service=productionService({db,save(){},localAsset,DATA:dir,trackProjectFiles(){},config:()=>({imageBaseUrl:`http://127.0.0.1:${mock.address().port}`,imageModel:'mock',imageApiKey:'test'})});
  service.start(p,{stage:'frames'});for(let i=0;i<200&&p.productionTask.status==='running';i++)await new Promise(r=>setTimeout(r,10));assert.equal(p.productionTask.status,'completed',p.productionTask.error);assert.equal(calls,2);assert.ok(!p.shots[2].image,'样片确认前不生成全片图片');await assert.rejects(service.frame(p,2,{},undefined),/先验证动态样片/);assert.equal(calls,2);
  const flow=creativeFlowService({db,save(){},queueRender(){throw Error('全片未就绪不应渲染');}});flow.request(p,'sample');const firstRequest=p.creativeRequest.id;flow.request(p,'sample');assert.equal(firstRequest,p.creativeRequest.id,'重复请求不重复派工');assert.throws(()=>flow.request(p,'film'),/先确认/);
  flow.requestImages(p,{index:2});assert.equal(p.imageRequests[0].index,2,'用户可显式指定任意单镜制图');assert.throws(()=>flow.requestImages(p,{index:99}),/不存在/);
  await service.frame(p,2,{imageBaseUrl:`http://127.0.0.1:${mock.address().port}`,imageModel:'mock',imageApiKey:'test'},undefined,true);assert.equal(calls,3,'显式单镜生图可在样片前执行');assert.equal(p.imageRequests.length,0,'图片完成后清除待制作记录');delete p.shots[2].image;
  for(const {index}of p.sampleShots){const s=p.shots[index];s.preflight={status:'approved',fingerprint:frameReviewFingerprint(p,s)};s.motion={status:'completed',video:`/uploads/mock-${index}.mp4`,sourceFingerprint:sourceFingerprint(s),route:'layered',review:'approved',qa:{passed:true}};}
  let summary=flowSummary(p,[]);assert.equal(summary.sampleReady,true);assert.equal(summary.sampleApproved,false);assert.throws(()=>flow.decideSample(p,{decision:'approved',fingerprint:'old'}),/已更新/);
  flow.decideSample(p,{decision:'approved',fingerprint:summary.sampleFingerprint});assert.ok(sampleApproved(p));assert.equal(p.creativeRequest.kind,'film');
  const approvedFingerprint=flowSummary(p,[]).sampleFingerprint;await service.frame(p,2,{imageBaseUrl:`http://127.0.0.1:${mock.address().port}`,imageModel:'mock',imageApiKey:'test'});assert.equal(calls,4);assert.equal(flowSummary(p,[]).sampleFingerprint,approvedFingerprint,'批量制作不会使已确认样片失效');
  flow.feedback(p,{scope:'sample',note:'动作要更自然'});assert.ok(!sampleApproved(p));assert.equal(flowSummary(p,[]).sampleReady,false);assert.throws(()=>flow.decideSample(p,{decision:'approved',fingerprint:approvedFingerprint}),/尚未落实/);
  p.shots[0].motion.video='/uploads/revised.mp4';summary=flowSummary(p,[]);assert.equal(summary.sampleReady,true);flow.decideSample(p,{decision:'approved',fingerprint:summary.sampleFingerprint});assert.ok(sampleApproved(p));
  p.brief='改成紧张的氛围';assert.ok(!sampleApproved(p),'创作方向变化需要新样片确认');
 }finally{mock.close();}
});
