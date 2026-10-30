import {shotSummary} from './shot-flow.mjs';
import {randomUUID} from 'node:crypto';
import {sourceFingerprint,routeOf,motionReady,preflightReady,sampleIssues,projectFingerprint,productionIssues,sampleApproved,sampleFingerprint,motionAvailable} from './production.mjs';

// A sample proves the production method before the rest of the artwork is made.
export function chooseSampleShots(p){
 const ranked=p.shots.map((s,index)=>({index,score:({complex:6,walk:5,interaction:5,prop:3,pose:2,scene:1}[s.production?.execution?.actionType]||(/走|递|握|翻|合本|合书/.test(s.prompt||'')?4:1)),type:s.production?.execution?.actionType||'unknown'})).sort((a,b)=>b.score-a.score||a.index-b.index);
 if(!ranked.length)return [];
 const first=ranked[0],second=ranked.find(s=>s.type==='scene'&&s.type!==first.type)||ranked.find(s=>s.type!==first.type);
 return [first,...(second?[second]:[])].sort((a,b)=>a.index-b.index).map(s=>({index:s.index,reason:s.type==='scene'?'验证整体画面与场景运动':'验证本片主要动作与人物表现'}));
}
export function flowSummary(p,jobs=[]){if(p.flowVersion>=5)return shotSummary(p,jobs);
 const samples=(p.sampleShots||[]).map(({index})=>({index,video:p.shots[index]?.motion?.video,title:p.shots[index]?.title,ready:!!(p.shots[index]&&motionAvailable(p,p.shots[index]))}));
 const fingerprint=projectFingerprint(p),films=jobs.filter(j=>j.projectId===p.id&&j.fingerprint===fingerprint&&j.status==='completed'&&j.output&&['motion','motion-preview'].includes(j.renderMode));
  const latestFeedback=(p.creativeFeedback||[]).filter(n=>n.scope==='sample').at(-1),pendingRevision=latestFeedback?.fingerprint===sampleFingerprint(p);
  return {stage:sampleApproved(p)?'film':'sample',sampleReady:samples.length>0&&samples.every(s=>s.ready)&&!pendingRevision,sampleApproved:sampleApproved(p),sampleFingerprint:sampleFingerprint(p),samples,film:films.find(j=>j.renderMode==='motion')||films[0]||null,exporting:jobs.some(j=>j.projectId===p.id&&j.fingerprint===fingerprint&&j.renderMode==='motion'&&['queued','running'].includes(j.status)),request:p.creativeRequest||null,feedback:p.creativeFeedback||[]};
}
export function creativeFlowService({db,save,queueRender}){
 function ensure(p){if(p.workflow!=='creative')throw Error('原样板请直接播放或下载');if(!p.flowVersion)p.flowVersion=5;if(!p.sampleShots?.length)p.sampleShots=chooseSampleShots(p);}
 function saveProject(p){p.updatedAt=new Date().toISOString();save();return p;}
 function requestImages(p,v={}){
  ensure(p);if(v.index!==undefined&&(!Number.isInteger(v.index)||!p.shots[v.index]))throw Error('镜头不存在');
  const indices=v.index!==undefined?[v.index]:(sampleApproved(p)?p.shots.map((_,i)=>i):p.sampleShots.map(s=>s.index)).filter(i=>!p.shots[i].image);
  if(!p.shots.length)throw Error('请先生成方案与分镜');
  for(const index of indices){if(p.shots[index].locked)throw Error('请先解锁镜头');const fingerprint=sourceFingerprint(p.shots[index]);p.imageRequests=(p.imageRequests||[]).filter(r=>r.index!==index);p.imageRequests.push({index,status:'awaiting-producer',fingerprint,createdAt:new Date().toISOString()});}
  return saveProject(p);
 }
 function request(p,kind,note=''){
  ensure(p);if(!['sample','film'].includes(kind))throw Error('制作阶段无效');if(p.flowVersion<5&&kind==='film'&&!sampleApproved(p))throw Error('请先确认动态样片效果');
  if(p.creativeRequest?.kind===kind&&p.creativeRequest?.status==='awaiting-producer'&&!note)return p;
  p.creativeRequest={id:randomUUID(),kind,status:'awaiting-producer',note:String(note).slice(0,6000),createdAt:new Date().toISOString(),message:kind==='sample'?'已保存动态样片任务，等待执行与回传':'样片已确认，按保存的任务继续制作全片'};
  return saveProject(p);
 }
 function decideSample(p,v){
  ensure(p);if(!['approved','changes-requested'].includes(v.decision))throw Error('确认结果无效');
  if(v.fingerprint!==sampleFingerprint(p))throw Error('样片已更新，请重新观看后确认');
  if(v.decision==='approved'&&sampleIssues(p).length)throw Error('当前动态样片尚未完成制作与内部检查');
  if(v.decision==='approved'&&(p.creativeFeedback||[]).filter(n=>n.scope==='sample').at(-1)?.fingerprint===sampleFingerprint(p))throw Error('修改意见尚未落实，请等待更新后的动态样片');
  if(v.decision==='changes-requested'&&!String(v.note||'').trim())throw Error('请描述希望调整的地方');
  p.sampleApproval={decision:v.decision,fingerprint:v.fingerprint,note:String(v.note||'').slice(0,6000),decidedAt:new Date().toISOString()};
  if(v.decision==='approved')request(p,'film');else feedback(p,{scope:'sample',note:v.note});
  return saveProject(p);
 }
 function feedback(p,v){ensure(p);const note=String(v.note||'').trim();if(!note||note.length>6000)throw Error('请填写修改意见（最多6000字）');if(!['sample','film'].includes(v.scope))throw Error('修改范围无效');if(v.scope==='film'&&!sampleApproved(p))throw Error('请先确认动态样片效果');p.creativeFeedback=[...(p.creativeFeedback||[]),{scope:v.scope,note,createdAt:new Date().toISOString(),fingerprint:v.scope==='sample'?sampleFingerprint(p):projectFingerprint(p)}];if(v.scope==='sample')p.sampleApproval={decision:'changes-requested',note};else if(p.filmReview)p.filmReview.status='pending';request(p,v.scope,note);return saveProject(p);}
 function advance(p){if(p.flowVersion>=5)return;if(p.flowVersion!==4||p.creativeRequest?.kind!=='film'||!sampleApproved(p)||productionIssues(p).length)return;
  const fingerprint=projectFingerprint(p);if(db.jobs.some(j=>j.projectId===p.id&&j.fingerprint===fingerprint&&['queued','running','completed'].includes(j.status)))return;
  queueRender(p,{mode:'motion-preview',quality:'preview'});p.creativeRequest.status='rendering';save();
 }
 function finish(p,v){ensure(p);const fingerprint=projectFingerprint(p),job=db.jobs.find(j=>j.projectId===p.id&&j.id===v.jobId&&j.fingerprint===fingerprint&&j.renderMode==='motion-preview'&&j.status==='completed'&&j.output);if(!job||v.fingerprint!==fingerprint)throw Error('请先观看当前版本的完整成片');if(!sampleApproved(p)||productionIssues(p).length)throw Error('当前版本尚未完成制作');
  const existing=db.jobs.find(j=>j.projectId===p.id&&j.fingerprint===fingerprint&&j.renderMode==='motion'&&['queued','running','completed'].includes(j.status));if(existing)return existing;
  p.filmReview={status:'approved',fingerprint,jobId:job.id,userDecision:'accept-and-export',reviewedAt:new Date().toISOString()};const result=queueRender(p,{quality:'full'});saveProject(p);return result;
 }
 return {request,requestImages,decideSample,feedback,advance,finish};
}
