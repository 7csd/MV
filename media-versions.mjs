import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {sourceFingerprint} from './production.mjs';

const clone=v=>v===undefined?undefined:structuredClone(v);
const inputs=s=>Object.fromEntries(['start','end','image','imageRole','prompt','production','imageGeneration'].map(k=>[k,clone(s[k])]));
const urlOf=(s,kind)=>kind==='image'?s.image:s.motion?.video;
function remember(s,kind,url,metadata={}){
 if(!url)return;
 const history=s.mediaVersions||={image:[],motion:[]},list=history[kind]||=[];
 if(list.some(v=>v.url===url))return;
 const counters=history.nextNumber||={},number=Math.max(counters[kind]||1,...list.map(v=>(v.number||0)+1));counters[kind]=number+1;
 list.push({id:randomUUID(),number,url,createdAt:metadata.createdAt||new Date().toISOString(),...metadata});
}

// Run at every persistence boundary, including uploads and both generation paths.
export function captureMediaVersions(p){
 for(const s of p.shots||[]){
  remember(s,'image',s.image,{createdAt:s.imageGeneration?.createdAt||p.updatedAt||p.createdAt,imageRole:s.imageRole,imageGeneration:clone(s.imageGeneration)});
  if(s.motion?.status==='completed')remember(s,'motion',s.motion.video,{createdAt:s.motion.createdAt||p.updatedAt||p.createdAt,motion:clone(s.motion),inputs:sourceFingerprint(s)===s.motion.sourceFingerprint?inputs(s):undefined,preflight:clone(s.preflight)});
 }
 if(p.mediaVersionsMigrated)return;
 // Completed task artifacts from older installations can still be previewed.
 for(const t of p.generationTasks||[]){
  const s=p.shots?.[t.index],shot=t.request?.shot;
  if(!s||t.status!=='completed'||!t.result?.artifact||!shot||shot.start!==s.start||shot.end!==s.end||shot.title!==s.title)continue;
  if(!['image','motion'].includes(t.kind))continue;
  remember(s,t.kind,t.result.artifact,{createdAt:t.result.finishedAt||t.createdAt,imageRole:'first-frame',...(t.kind==='motion'?{motion:{status:'completed',video:t.result.artifact,sourceFingerprint:t.sourceFingerprint,route:p.productionRoute==='video'?'video':'layered',generationTaskId:t.id,qa:t.result.qa,review:'pending'}}:{})});
 }
 p.mediaVersionsMigrated=true;
}

export function selectMediaVersion(p,{index,kind,versionId},localAsset){
 const s=p.shots?.[index];
 if(!Number.isInteger(index)||!s||!['image','motion'].includes(kind))throw Error('请选择有效镜头和素材类型');
 if(s.locked)throw Error('请先解锁镜头');
 const v=s.mediaVersions?.[kind]?.find(v=>v.id===versionId);
 if(!v)throw Error('历史版本不存在或已删除');
 if(!fs.existsSync(localAsset(v.url)))throw Error('此版本的本地文件已不存在');
 if(urlOf(s,kind)===v.url)return;
 if(kind==='image'){
  s.image=v.url;s.imageRole=v.imageRole||'concept';s.imageGeneration=clone(v.imageGeneration);
  if(s.preflight)s.preflight={...s.preflight,status:'pending'};
 }else{
  if(!v.inputs&&v.motion?.sourceFingerprint!==sourceFingerprint(s))throw Error('此旧样片缺少原始动作安排，可预览；请先恢复对应图片和动作安排后再使用');
  if(v.inputs){if(v.inputs.start!==s.start||v.inputs.end!==s.end)throw Error('镜头时长已改变，此样片仅可预览');Object.assign(s,clone(v.inputs));}
  s.motion=clone(v.motion);s.preflight=clone(v.preflight)||s.preflight;
 }
 if(p.shotApprovals)delete p.shotApprovals[index];
 p.updatedAt=new Date().toISOString();
}

export function deleteMediaVersion(db,p,{index,kind,versionId,confirm},DATA){
 const s=p.shots?.[index],list=s?.mediaVersions?.[kind],v=list?.find(v=>v.id===versionId);
 if(!Number.isInteger(index)||!['image','motion'].includes(kind)||!v)throw Error('历史版本不存在或已删除');
 if(s.locked)throw Error('请先解锁镜头');
 if(confirm!==versionId)throw Error('请先确认删除此版本');
 if(urlOf(s,kind)===v.url)throw Error('当前使用的版本不能删除，请先切换到其他版本');
 // Plan the record change first so unrelated references can protect shared files.
 const next=structuredClone(db),project=next.projects.find(item=>item.id===p.id);
 project.shots[index].mediaVersions[kind]=list.filter(item=>item.id!==versionId);
 const candidates=new Set([v.url]);
 for(const t of project.generationTasks||[])if(t.result?.artifact===v.url){candidates.add(t.result.sourceArtifact);t.result={deleted:true,finishedAt:t.result.finishedAt};}
 for(const item of next.projects)item.ownedFiles=(item.ownedFiles||[]).filter(url=>!candidates.has(url));
 const used=new Set();
 const visit=value=>{if(typeof value==='string')used.add(value);else if(value&&typeof value==='object')Object.values(value).forEach(visit);};
 visit(next);
 const uploadRoot=path.resolve(DATA,'uploads');
 const fileKey=url=>{try{return path.resolve(uploadRoot,decodeURIComponent(url.slice(9))).toLowerCase();}catch{return null;}};
 const usedFiles=new Set([...used].filter(url=>url.startsWith('/uploads/')).map(fileKey));
 let removed=0;
 for(const url of candidates){
  if(typeof url!=='string'||!url.startsWith('/uploads/')||usedFiles.has(fileKey(url)))continue;
  const root=path.resolve(DATA,'uploads'),file=path.resolve(root,decodeURIComponent(url.slice(9)));
  if(!file.startsWith(root+path.sep))throw Error('文件路径超出素材目录');
  if(!fs.existsSync(file))continue;
  if(fs.lstatSync(file).isSymbolicLink()||!fs.realpathSync(file).startsWith(fs.realpathSync(root)+path.sep))throw Error('无法安全删除文件');
  fs.unlinkSync(file);removed++;
 }
 s.mediaVersions[kind]=project.shots[index].mediaVersions[kind];
 p.generationTasks=project.generationTasks;
 for(const item of db.projects)item.ownedFiles=next.projects.find(n=>n.id===item.id).ownedFiles;
 p.updatedAt=new Date().toISOString();
 return {deleted:true,removedFiles:removed};
}
