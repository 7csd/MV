import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {validateExecution,routeOf,capabilities,sourceFingerprint,frameReviewFingerprint,preflightReady,preflightIssues,sampleIssues,sampleSelection,motionTechnicalReady,productionIssues,projectFingerprint,filmReviewReady,batchIssues,sampleApproved} from './production.mjs';
import {probe,verifyMotion,normalizeVideo} from './media.mjs';

export const frameChecks=['startState','motionSpace','assets','contacts'];
export const motionChecks=['action','identity','contacts','style','timing'];
export const filmChecks=['rhythm','continuity','lyrics','style'];
function checks(value,keys){if(!keys.every(k=>value?.[k]===true))throw Error('请逐项观看核对后勾选验收项');return Object.fromEntries(keys.map(k=>[k,true]));}
function evidence(value,label){if(typeof value!=='string'||!value.trim()||value.length>6000)throw Error('请填写'+label);return value.trim();}
export function workflowSummary(p){return {route:routeOf(p),capabilities:capabilities(p),samples:sampleSelection(p),sampleIssues:batchIssues(p),samplesApproved:sampleApproved(p),preflightReady:p.shots.filter(s=>preflightReady(p,s)).length,technicalReady:p.shots.filter(motionTechnicalReady).length,filmApproved:filmReviewReady(p),fingerprint:projectFingerprint(p)};}

export function workflowService({db,DATA,save,localAsset,trackProjectFiles}){
 const importing=new Set();
 function shot(p,index){if(!Number.isInteger(index)||!p.shots[index])throw Error('镜头不存在');return p.shots[index];}
 function updated(p){p.updatedAt=new Date().toISOString();save();return p;}
 function settings(p,v){
  if(!['layered','video'].includes(v.route))throw Error('制作路线无效');
  if(!Array.isArray(v.samples)||v.samples.length>3)throw Error('请选择最多3个代表镜头');
  const samples=v.samples.map(s=>{shot(p,s.index);return {index:s.index,reason:evidence(s.reason,'样片选择理由')};});
  if(new Set(samples.map(s=>s.index)).size!==samples.length)throw Error('样片镜头不能重复');
  if(routeOf(p)!==v.route){p.shotApprovals={};for(const s of p.shots){if(s.preflight)s.preflight={...s.preflight,status:'pending',note:s.preflight.note+'；制作路线已切换，需重新核对'};if(s.motion){s.motion.review='pending';s.motion.reviewNote='制作路线已切换，需重新观看验收';}}if(p.filmReview)p.filmReview.status='pending';}
  p.productionRoute=v.route;p.sampleShots=samples;return updated(p);
 }
 function preflight(p,v){
  const s=shot(p,v.index);if(!['approved','rejected','pending'].includes(v.status))throw Error('核对状态无效');
  if(v.fingerprint!==frameReviewFingerprint(p,s))throw Error('画面或计划已更新，请刷新后重新核对');
  const record={status:v.status,fingerprint:v.fingerprint,note:evidence(v.note,'实际画面观察与核对说明'),reviewedAt:new Date().toISOString()};
  if(v.status==='approved'){validateExecution(s.production?.execution);if(routeOf(p)==='video'&&s.imageRole!=='first-frame')throw Error('视频模型需要动作起始帧；请核对图片用途或重新生成首帧');if(!s.image||!fs.existsSync(localAsset(s.image)))throw Error('请先准备参考画面');record.checks=checks(v.checks,frameChecks);record.assetsEvidence=evidence(v.assetsEvidence,routeOf(p)==='layered'?'已准备的分层素材、绑定与接触方案':'首帧与视频模型适配依据');}
  s.preflight=record;if(v.status!=='approved'&&s.motion){s.motion.review='pending';s.motion.reviewNote='画面或素材核对被退回，需修正后重新验收';}return updated(p);
 }
 function reviewMotion(p,v){
  const s=shot(p,v.index);if(!s.motion?.video||!['approved','rejected','pending'].includes(v.review))throw Error('镜头或评审状态无效');
  if(v.video!==s.motion.video||v.fingerprint!==sourceFingerprint(s))throw Error('片段或计划已更新，请刷新后重新观看');
  const m=s.motion;if(v.review==='approved'){
   if(!motionTechnicalReady(s)||!preflightReady(p,s)||m.route!==routeOf(p))throw Error('片段技术检查、画面核对或制作路线未通过');
   if(!sampleSelection(p).some(x=>x.index===v.index)&&batchIssues(p).length)throw Error('请先完成代表性样片验收');
   m.reviewChecks=checks(v.checks,motionChecks);
  }
  m.review=v.review;m.reviewNote=evidence(v.note,'动态观看结论');m.reviewedAt=new Date().toISOString();return updated(p);
 }
 function reviewFilm(p,v){
  if(!['approved','rejected'].includes(v.status))throw Error('整片评审状态无效');
  const job=db.jobs.find(j=>j.id===v.jobId&&j.projectId===p.id&&j.renderMode==='motion-preview'&&j.status==='completed'&&j.output);
  if(!job||job.fingerprint!==projectFingerprint(p)||v.fingerprint!==job.fingerprint)throw Error('请先制作并观看当前版本的整片预览');
  if(v.status==='approved'&&productionIssues(p).length)throw Error('逐镜验收尚未完成');
  p.filmReview={status:v.status,jobId:job.id,fingerprint:job.fingerprint,note:evidence(v.note,'整片观看结论'),...(v.status==='approved'?{checks:checks(v.checks,filmChecks)}:{}),reviewedAt:new Date().toISOString()};
  return updated(p);
 }
 function handoff(p){
  const samples=sampleSelection(p),allowed=batchIssues(p).length===0?p.shots.map((_,i)=>i):samples.map(s=>s.index);
  const ref=value=>value?{...value,...(value.image?{file:localAsset(value.image)}:{})}:null;const references={character:ref(db.characters.find(c=>c.id===p.characterId)||p.characterSnapshot),style:ref(db.styles.find(s=>s.id===p.styleId)||p.styleSnapshot)};
  return {imageRequests:p.imageRequests||[],creativeRequest:p.creativeRequest||null,sampleApproval:p.sampleApproval||null,scope:batchIssues(p).length?'sample':'film',references,schemaVersion:3,projectId:p.id,projectName:p.name,projectFingerprint:projectFingerprint(p),route:routeOf(p),capabilities:capabilities(p),output:{width:1920,height:1080,fps:24,audio:'各镜视频不含配乐和歌词；整片使用原歌曲和LRC'},instructions:['先看实际参考画面，核对起始姿态；冲突时修改计划或重制首帧。','分镜插画用于构图参考；分层路线须制作独立场景、人物关节与道具，不可整组漂移冒充动作。',p.flowVersion>=5?'可制作全部或所选镜头；用户逐镜确认后点击合成全片。':'先制作所选代表性样片；技术检查与视觉验收通过后再制作其他镜头。','回传MP4时提交本包内sourceFingerprint；素材或计划改变后重新导出制作包。','严禁将技术通过写成视觉通过。'],story:p.story,audio:{url:p.audio,file:localAsset(p.audio)},lyrics:p.lyrics,samples,allowedShotIndices:allowed,shots:p.shots.map((s,index)=>({index,title:s.title,start:s.start,end:s.end,seconds:s.end-s.start,referenceImage:s.image?{role:s.imageRole||'concept',url:s.image,file:localAsset(s.image)}:null,production:s.production,preflight:s.preflight,sourceFingerprint:sourceFingerprint(s),frameReviewFingerprint:frameReviewFingerprint(p,s),canProduce:allowed.includes(index)&&preflightReady(p,s),blockingIssues:preflightIssues(p,s,index)})),returnProtocol:{upload:'POST /api/upload?name=shot.mp4 (binary MP4)',import:`POST /api/projects/${p.id}/motion-import`,body:{index:'镜头索引，从0开始',video:'上传返回的 /uploads/*.mp4',fingerprint:'shot.sourceFingerprint',sourceDescription:'实际制作方式和工程/素材位置'},preflight:`POST /api/projects/${p.id}/preflight`,review:`POST /api/projects/${p.id}/motion-review`}};
 }
 async function importMotion(p,v){
  const s=shot(p,v.index);if(s.locked)throw Error('请先解锁镜头');
  const fingerprint=sourceFingerprint(s),frameFingerprint=frameReviewFingerprint(p,s);
  if(p.flowVersion<5&&!sampleSelection(p).length)throw Error('请先选齐代表性样片，再回传动态片段');
  if(v.fingerprint!==fingerprint)throw Error('制作包已过期，请核对当前镜头后重新回传');
  const issues=preflightIssues(p,s,v.index);if(issues.length)throw Error(issues.join('；'));
  if(!sampleSelection(p).some(x=>x.index===v.index)&&batchIssues(p).length)throw Error('请先完成代表性样片验收，再回传批量镜头');
  const description=evidence(v.sourceDescription,'实际制作方式与工程素材位置');
  if(!v.video?.startsWith('/uploads/')||path.extname(v.video).toLowerCase()!=='.mp4')throw Error('请上传MP4动态片段');
  const input=localAsset(v.video);if(!fs.existsSync(input))throw Error('上传的视频不存在');
  if(importing.has(p.id))throw Error('项目正在回传动态片段');
  importing.add(p.id);const name=randomUUID()+'.mp4',output=path.join(DATA,'uploads',name);
  try{
   const source=await probe(input);if(source.width<1920||source.height<1080)throw Error('源片段须达到1920×1080；请从动画工程重新导出1080p');
   await verifyMotion(input,s.end-s.start);await normalizeVideo(input,output,s.end-s.start);const qa=await verifyMotion(output,s.end-s.start);
   if(sourceFingerprint(s)!==fingerprint||frameReviewFingerprint(p,s)!==frameFingerprint)throw Error('项目已变更，请重新回传');
   trackProjectFiles(p,[v.video,'/uploads/'+name]);s.motion={status:'completed',video:'/uploads/'+name,sourceFingerprint:fingerprint,route:routeOf(p),qa,review:'pending',sourceDescription:description,sourceVideo:v.video,createdAt:new Date().toISOString()};return updated(p);
  }catch(e){fs.rmSync(output,{force:true});throw e;}finally{importing.delete(p.id);}
 }
 return {busy:p=>importing.has(p.id),settings,preflight,reviewMotion,reviewFilm,handoff,importMotion};
}
