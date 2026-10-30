import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {sourceFingerprint,projectFingerprint,frameReviewFingerprint,filmReviewReady,sampleIssues} from '../production.mjs';
import {command,ffmpeg,normalizeVideo} from '../media.mjs';

const plan={imagePrompt:'纸山合拢，星片被遮挡',startState:'纸山合拢',endState:'纸山展开露出星片',beats:[{at:0,action:'合拢静止'},{at:1,action:'独立纸山展开'}],camera:'locked',transition:'cut',continuity:'金色星片保持固定',execution:{actionType:'scene',method:'独立纸山层绕底部固定点展开，人物保持站立',requiredAssets:['远山层','近山层','星片'],successCriteria:'纸山依次展开，星片露出且无漂移'}};
test('整片与画面核对指纹覆盖路线、动作、歌词和片段版本',()=>{const p={duration:2,audio:'/a.mp3',lyrics:[],productionRoute:'layered',sampleShots:[{index:0,reason:'展开'}],shots:[{start:0,end:2,image:'/frame.png',production:plan}]};const s=p.shots[0],source=sourceFingerprint(s),frame=frameReviewFingerprint(p,s);p.filmReview={status:'approved',fingerprint:projectFingerprint(p)};assert.ok(filmReviewReady(p));p.lyrics=[{time:0,text:'新增'}];assert.ok(!filmReviewReady(p));p.productionRoute='video';assert.notEqual(frameReviewFingerprint(p,s),frame);assert.equal(sourceFingerprint(s),source);assert.ok(sampleIssues(p).length);});

test('对话路线可导出并回传任意镜头，逐镜确认前阻止全片制作',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'paperlight-workflow-'));const source=path.join(dir,'source.mp4'),low=path.join(dir,'low.mp4');
 await command(ffmpeg,['-v','error','-y','-i','public/assets/sample.mp4','-t','2.2','-an','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',source]);
 await command(ffmpeg,['-v','error','-y','-i',source,'-vf','scale=1280:720','-an','-c:v','libx264','-preset','ultrafast',low]);
 await assert.rejects(normalizeVideo(low,path.join(dir,'reject.mp4'),2),/1080/);
 const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'14319',STUDIO_DATA:dir},windowsHide:true,stdio:'pipe'});let stderr='';child.stderr.on('data',c=>stderr+=c);
 const base='http://127.0.0.1:14319';const request=async(route,value,method='POST')=>{const res=await fetch(base+route,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});return {status:res.status,value:await res.json()};};let id;
 const project=async()=>(await(await fetch(base+'/api/state')).json()).projects.find(p=>p.id===id);
 const preflight=async(i,extra={})=>{const s=(await project()).shots[i];return request(`/api/projects/${id}/preflight`,{index:i,status:'approved',fingerprint:s.frameReviewFingerprint,note:'看图确认纸山遮挡星片且运动空间充足',assetsEvidence:'独立纸山与星片层，底部固定点已在工程准备',checks:{startState:true,motionSpace:true,assets:true,contacts:true},...extra});};
 const review=async(i,extra={})=>{const s=(await project()).shots[i];return request(`/api/projects/${id}/motion-review`,{index:i,review:'approved',video:s.motion.video,fingerprint:s.motionFingerprint,note:'观看确认纸山展开自然、星片稳定且风格一致',checks:{action:true,identity:true,contacts:true,style:true,timing:true},...extra});};
 try{
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',()=>reject(Error(stderr)));});
  id=(await request('/api/projects',{name:'分层路线验收',duration:8,audio:'/assets/song.mp3',lyrics:[]})).value.id;
  assert.equal((await project()).productionRoute,'layered');
  const shots=Array.from({length:4},(_,i)=>({start:i*2,end:i*2+2,title:'展开'+i,prompt:'分层纸山',image:'/assets/stills/01.png',production:plan}));
  assert.equal((await request(`/api/projects/${id}`,{shots},'PATCH')).status,200);
  assert.equal((await request(`/api/projects/${id}/production`,{stage:'motion'})).status,400);
  assert.equal((await request(`/api/projects/${id}/workflow`,{route:'layered',samples:[0,1,2].map(index=>({index,reason:'验证独立场景层展开'+index}))})).status,200);
  const upload=async file=>{const res=await fetch(base+'/api/upload?name=clip.mp4',{method:'POST',body:fs.readFileSync(file)});assert.equal(res.status,201);return (await res.json()).url;};
  const video=await upload(source),small=await upload(low);
  const imported=async(i,extra={})=>{const s=(await project()).shots[i];return request(`/api/projects/${id}/motion-import`,{index:i,video,fingerprint:s.motionFingerprint,sourceDescription:'分层动画工程，独立纸山层与底部固定点',...extra});};
  assert.equal((await preflight(0,{checks:{}})).status,400);
  assert.equal((await preflight(0,{fingerprint:'old'})).status,400);
  assert.equal((await imported(0)).status,400);
  for(let i=0;i<4;i++)assert.equal((await preflight(i)).status,200);
  assert.equal((await imported(3)).status,200,'可回传任意镜头，不受固定样片范围限制');
  assert.equal((await imported(0,{video:small})).status,400,'720p不可冒充1080p源');
  assert.equal((await imported(0,{fingerprint:'old'})).status,400);
  const handoff=await(await fetch(base+`/api/projects/${id}/handoff`)).json();assert.deepEqual(handoff.allowedShotIndices,[0,1,2,3]);assert.ok(handoff.shots[0].referenceImage.file.endsWith('01.png'));assert.equal(handoff.route,'layered');
  for(let i=0;i<3;i++){
   assert.equal((await imported(i)).status,200);
   assert.equal((await project()).shots[i].motion.review,'pending');
   assert.equal((await review(i,{checks:{}})).status,400);
   assert.equal((await review(i)).status,200);
  }
  assert.equal((await project()).workflowSummary.samplesApproved,false,'内部检查不代替用户确认');
  for(let index=0;index<3;index++)assert.equal((await request(`/api/projects/${id}/clip-review`,{index,decision:'approved',fingerprint:(await project()).creativeFlow.clips[index].fingerprint})).status,200);assert.equal((await project()).workflowSummary.samplesApproved,false,'第四镜未确认');
  assert.equal((await imported(3)).status,200);assert.equal((await review(3)).status,200);assert.equal((await request(`/api/projects/${id}/clip-review`,{index:3,decision:'approved',fingerprint:(await project()).creativeFlow.clips[3].fingerprint})).status,200);assert.equal((await project()).creativeFlow.allApproved,true);
  assert.equal((await project()).productionSummary.ready,4);
  assert.equal((await request(`/api/projects/${id}/render`,{quality:'full'})).status,400,'整片未验收不得正式导出');
  const p=await project(),changed=structuredClone(p.shots);changed[0].production={...plan,endState:'纸山完全展开'};
  assert.equal((await request(`/api/projects/${id}`,{shots:changed},'PATCH')).status,200);
  assert.equal((await project()).workflowSummary.samplesApproved,false);assert.equal((await project()).creativeFlow.approvedCount,3,'改第一镜不影响其他三镜确认');assert.equal((await request(`/api/projects/${id}/compose`,{})).status,400,'第一镜变更后不可合成');
  assert.equal((await request(`/api/projects/${id}/film-review`,{jobId:'fake',status:'approved'})).status,400);
  assert.equal((await request(`/api/projects/${id}/workflow`,{route:'video',samples:[0,1,2].map(index=>({index,reason:'改用视频模型'}))})).status,200);
  assert.equal((await project()).productionSummary.ready,0,'切换路线使旧片段与画面核对失效');assert.equal((await request(`/api/projects/${id}/workflow`,{route:'layered',samples:[0,1,2].map(index=>({index,reason:'返回分层路线'}))})).status,200);assert.equal((await project()).productionSummary.ready,0,'切回原路线不能静默恢复审核');
  console.log('Layered workflow isolated data: '+dir);
 }finally{child.kill();}
});
