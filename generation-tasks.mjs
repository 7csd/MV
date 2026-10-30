import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {framePrompt,videoPrompt,sourceFingerprint,routeOf,validateExecution,sampleApproved,motionAvailable,clipPending,clipNeedsRevision} from './production.mjs';
import {chooseSampleShots} from './creative-flow.mjs';
import {generateFrame} from './creative.mjs';
import {generateVideo} from './providers.mjs';
import {keyframe,verifyMotion,normalizeVideo} from './media.mjs';

export const TASK_VERSION=1;
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function generationContext(p,index){return digest({story:p.story,brief:p.brief,character:p.characterSnapshot||p.characterId,style:p.styleSnapshot||p.styleId,route:routeOf(p),feedback:(p.creativeFeedback||[]).filter(f=>p.flowVersion>=5?f.indices?.includes(index):f.scope==='sample').map(f=>f.note)});}
export function generationTask(p,index,kind,{character,style,dependsOn}={}){
 const s=p.shots[index];if(!s||!['image','motion'].includes(kind))throw Error('生成任务无效');validateExecution(s.production?.execution);
 const feedback=(p.creativeFeedback||[]).filter(f=>!(p.flowVersion>=5)||f.indices?.includes(index)).map(f=>f.scope+'：'+f.note).join('；');
 const references=[{role:'character',url:character?.image},{role:'style',url:style?.image},...(s.image?[{role:kind==='motion'?'first-frame':'composition-reference',url:s.image}]:[])].filter(r=>r.url);
 return {id:randomUUID(),version:TASK_VERSION,projectId:p.id,index,kind,status:dependsOn?'waiting-input':'queued',dependsOn:dependsOn||null,sourceFingerprint:sourceFingerprint(s),contextFingerprint:generationContext(p,index),createdAt:new Date().toISOString(),request:{prompt:(kind==='image'?framePrompt(p,s,{character,style,previous:p.shots[index-1],next:p.shots[index+1]}):videoPrompt(p,s))+(feedback?'\n用户修改意见：'+feedback:''),story:p.story,brief:p.brief,character,style,references,shot:structuredClone({title:s.title,start:s.start,end:s.end,production:s.production}),output:kind==='image'?{mime:'image/png',width:1920,height:1080}:{mime:'video/mp4',width:1920,height:1080,fps:24,seconds:s.end-s.start,audio:false},acceptance:['人物、服装、材质与参考一致','按起止状态和动作节点执行，接触关系连续','不以整体推拉或整个人物漂移冒充动作','技术检查不等于用户认可，结果需在平台预览确认']}};
}
export function generationService({db,DATA,save,config:currentConfig,localAsset,trackProjectFiles,onChange=()=>{}}){
 const running=new Map(),accepting=new Set();
 function changed(p){try{onChange(p);}catch(e){p.creativeRequest={...p.creativeRequest,status:'failed',error:'生成文件已保存，后续合成暂未开始：'+e.message};save();}}
 const context=p=>({character:db.characters.find(c=>c.id===p.characterId)||p.characterSnapshot,style:db.styles.find(c=>c.id===p.styleId)||p.styleSnapshot});
 function tasks(p){return p.generationTasks||(p.generationTasks=[]);}
 function isCurrent(p,t){return !!p.shots[t.index]&&t.sourceFingerprint===sourceFingerprint(p.shots[t.index])&&t.contextFingerprint===generationContext(p,t.index);}
 function enqueue(p,index,kind,dependsOn,force=false){
  const list=tasks(p),old=list.findLast(t=>t.index===index&&t.kind===kind&&isCurrent(p,t)&&!['superseded','cancelled'].includes(t.status));
  if(old&&!force&&(!dependsOn||old.dependsOn===dependsOn)){if(old.status==='failed'){if(old.remote?.id&&old.remote.status!=='failed')old.status='interrupted';else throw Error('上次生成失败；请核对服务商任务与错误后，以 force:true 明确发起重做，避免重复付费提交');}return old;}
  if(force)for(const t of list)if(t.index===index&&t.kind===kind&&['queued','waiting-input','interrupted'].includes(t.status))t.status='superseded';
  const t=generationTask(p,index,kind,{...context(p),dependsOn});list.push(t);return t;
 }
 function selected(p,scope,index,selection){
  if(p.flowVersion>=5){if(scope==='film')throw Error('请在所有镜头确认后使用生成全片 MV');const list=selection??(index!==undefined?[index]:p.shots.map((_,i)=>i));if(!Array.isArray(list)||!list.length||list.some(i=>!Number.isInteger(i)||!p.shots[i])||new Set(list).size!==list.length)throw Error('请选择有效镜头');return list;}
  if(!p.shots.length)throw Error('请先生成方案与分镜');if(!p.sampleShots?.length)p.sampleShots=chooseSampleShots(p);
  if(scope==='film'&&!sampleApproved(p))throw Error('请先确认动态样片效果');
  if(index!==undefined){if(!Number.isInteger(index)||!p.shots[index])throw Error('镜头不存在');if(scope==='sample'&&!p.sampleShots.some(s=>s.index===index)&&!sampleApproved(p))throw Error('请先确认动态样片效果');return [index];}
  return scope==='film'||scope==='images'&&sampleApproved(p)?p.shots.map((_,i)=>i):p.sampleShots.map(s=>s.index);
 }
 function start(p,{scope='sample',index,force=false,executor,indices:selection}={}){
  if(!['sample','film','images','clips'].includes(scope))throw Error('生成阶段无效');
  const cfg=structuredClone(currentConfig()),mode=executor||cfg.generationExecutor||'manual';if(!['manual','api'].includes(mode))throw Error('执行方式无效');
  if(running.has(p.id)||accepting.has(p.id))throw Error('项目当前正在生成或接收结果，请等待完成后再提交');
  const indices=selected(p,scope,index,selection),created=[];
  const needsImage=scope==='images'||indices.some(i=>!p.shots[i].image||p.shots[i].imageRole!=='first-frame');
  if(mode==='api'&&(needsImage&&(!cfg.imageApiKey||!cfg.imageBaseUrl||!cfg.imageModel)||scope!=='images'&&(!cfg.videoApiKey||!cfg.videoBaseUrl||!cfg.videoModel)))throw Error('请先配置本次生成需要的图像 / 视频 API');
  for(const i of indices){const s=p.shots[i];if(s.locked)throw Error('镜头已锁定');validateExecution(s.production?.execution);}
  for(const i of indices){const s=p.shots[i];let image;
   if(force)for(const t of tasks(p))if(t.index===i&&['queued','waiting-input','interrupted','failed'].includes(t.status))t.status='superseded';
   if(p.flowVersion>=5&&scope!=='images'&&!force&&motionAvailable(p,s)&&!clipPending(p,i)&&!clipNeedsRevision(p,i))continue;
   if(scope==='images'){if(!s.image||index!==undefined||selection!==undefined&&force)created.push(enqueue(p,i,'image',null,force));continue;}
   if(!s.image||s.imageRole!=='first-frame')image=enqueue(p,i,'image',null,force);
   const motion=enqueue(p,i,'motion',image?.id,force);created.push(...(image?[image]:[]),motion);
  }
  for(const t of created){t.executor=mode;if(p.flowVersion>=5&&t.status!=='completed'&&p.shotApprovals)delete p.shotApprovals[t.index];}
  p.creativeRequest={...(p.creativeRequest||{}),kind:scope==='images'?'sample':scope,status:mode==='manual'?'awaiting-producer':'running',message:mode==='manual'?'生成任务已保存，等待执行并回传':'正在调用配置的 API 执行生成',taskIds:created.map(t=>t.id)};
  if(created.every(t=>t.status==='completed')){p.creativeRequest.status='completed';p.creativeRequest.message='生成结果已回传，请预览确认';}
  save();changed(p);if(mode==='api'){running.set(p.id,new AbortController());setImmediate(()=>void run(p,cfg));}return p;
 }
 async function accept(p,t,{artifact,sourceDescription,sourceFiles=[],executor='manual'}={}){
  if(!isCurrent(p,t)||t.dependsOn)throw Error('任务输入已变化或首帧尚未完成，请读取最新任务');
  if(!['queued','running','interrupted','failed'].includes(t.status))throw Error('此任务已失效，请读取最新任务');
  if(typeof sourceDescription!=='string'||!sourceDescription.trim())throw Error('请记录实际生成方式');
  if(!artifact?.startsWith('/uploads/'))throw Error('请先上传生成结果');const input=localAsset(artifact),s=p.shots[t.index],name=randomUUID()+(t.kind==='image'?'.png':'.mp4'),output=path.join(DATA,'uploads',name);
  if(t.kind==='image'&&!/\.(png|jpe?g|webp)$/i.test(input)||t.kind==='motion'&&!/\.mp4$/i.test(input))throw Error('结果格式不符合任务要求');
  try{
   let qa;if(t.kind==='image'){await keyframe(input,output,1920,1080);qa={passed:true,width:1920,height:1080,scope:'image-decode'};}else{await verifyMotion(input,t.request.output.seconds);await normalizeVideo(input,output,t.request.output.seconds);qa=await verifyMotion(output,t.request.output.seconds);}
   if(!isCurrent(p,t))throw Error('生成期间输入发生变化，未覆盖当前内容');
   trackProjectFiles(p,[artifact,'/uploads/'+name]);t.status='completed';t.result={artifact:'/uploads/'+name,sourceArtifact:artifact,qa,sourceDescription,sourceFiles,executor,finishedAt:new Date().toISOString(),visualReview:'pending'};
   if(t.kind==='image'){
    s.image='/uploads/'+name;s.imageRole='first-frame';s.imageGeneration={taskId:t.id,prompt:t.request.prompt,executor,createdAt:new Date().toISOString()};
    for(const waiting of [...tasks(p)].filter(v=>v.dependsOn===t.id&&v.status==='waiting-input')){waiting.status='superseded';const next=enqueue(p,waiting.index,'motion',null,true);next.executor=waiting.executor;if(p.creativeRequest?.taskIds)p.creativeRequest.taskIds=p.creativeRequest.taskIds.map(id=>id===waiting.id?next.id:id);}
   }else{s.motion={status:'completed',video:'/uploads/'+name,sourceFingerprint:sourceFingerprint(s),route:routeOf(p),generationTaskId:t.id,qa,review:'pending',executor,sourceDescription,createdAt:new Date().toISOString()};}
   if(p.creativeRequest?.taskIds?.length&&p.creativeRequest.taskIds.every(id=>tasks(p).find(t=>t.id===id)?.status==='completed')){p.creativeRequest.status='completed';p.creativeRequest.message='生成结果已回传，请预览确认';}
   p.updatedAt=new Date().toISOString();save();changed(p);return t;
  }catch(e){fs.rmSync(output,{force:true});throw e;}
 }
 async function run(p,cfg){
  const controller=new AbortController();running.set(p.id,controller);
  try{for(;;){const t=tasks(p).find(t=>t.executor==='api'&&['queued','interrupted'].includes(t.status)&&!t.dependsOn&&isCurrent(p,t));if(!t)break;
    if(t.status==='interrupted'&&!t.remote?.id&&t.phase==='submitting')throw Error('上次提交结果未知，请先核对服务商任务后再重试');
    t.status='running';t.phase=t.remote?.id?'resuming':'submitting';save();
    try{let bytes;if(t.kind==='image'){const refs=t.request.references.filter(r=>['character','style','composition-reference'].includes(r.role)).map((r,i)=>({file:localAsset(r.url),name:'reference-'+i+'.png'}));bytes=await generateFrame(cfg,{prompt:t.request.prompt,references:refs,signal:controller.signal});}
     else{const first=t.request.references.find(r=>r.role==='first-frame');if(!first)throw Error('缺少首帧');const result=await generateVideo(cfg,{prompt:t.request.prompt,imageFile:localAsset(first.url),seconds:t.request.output.seconds,resume:t.remote,signal:controller.signal,onUpdate:remote=>{t.remote=remote;save();}});bytes=result.bytes;}
     const file=randomUUID()+(t.kind==='image'?'.png':'.mp4');fs.writeFileSync(path.join(DATA,'uploads',file),bytes);await accept(p,t,{artifact:'/uploads/'+file,sourceDescription:'平台 API 执行器，任务 '+t.id,executor:'api'});
    }catch(e){t.status='failed';t.error=e.message;save();throw e;}
   }
   if(!['rendering','failed'].includes(p.creativeRequest.status)){p.creativeRequest.status='completed';p.creativeRequest.message='生成结果已回传，请预览确认';}save();
  }catch(e){p.creativeRequest.status='failed';p.creativeRequest.error=e.message;save();}finally{running.delete(p.id);}
 }
 function exported(p){return {version:TASK_VERSION,projectId:p.id,tasks:tasks(p),references:context(p),music:{url:p.audio,lyrics:p.lyrics},returnEndpoint:`/api/projects/${p.id}/generation-result`,returnFormat:{taskId:'任务ID',artifact:'上传返回的 /uploads/ 路径',sourceDescription:'实际生成方式',sourceFiles:['动画工程、素材及配置位置']}};}
 return {busy:p=>running.has(p.id)||accepting.has(p.id),start,exported,result:async(p,v)=>{const t=tasks(p).find(t=>t.id===v.taskId);if(!t)throw Error('生成任务不存在');if(t.status==='completed')return t;if(running.has(p.id)||accepting.has(p.id))throw Error('项目正在接收生成结果，请稍后重试');accepting.add(p.id);try{return await accept(p,t,v);}finally{accepting.delete(p.id);}}};
}
