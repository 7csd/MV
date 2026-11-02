import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {captureMediaVersions,selectMediaVersion,deleteMediaVersion} from '../media-versions.mjs';
import {sourceFingerprint} from '../production.mjs';

test('历史保存、样片恢复原始输入、重新确认与共享文件保护',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'media-history-'));
 fs.mkdirSync(path.join(dir,'uploads'));
 const local=url=>path.join(dir,url);
 for(const file of ['old.png','new.png','old.mp4','new.mp4'])fs.writeFileSync(local('/uploads/'+file),'fixture');
 const s={start:0,end:2,title:'镜头',image:'/uploads/old.png',imageRole:'first-frame',prompt:'旧动作',production:{startState:'旧姿势'}};
 s.motion={status:'completed',video:'/uploads/old.mp4',sourceFingerprint:sourceFingerprint(s),qa:{passed:true},generationTaskId:'t'};
 const p={id:'p',shots:[s],shotApprovals:{0:{decision:'approved'}}},db={projects:[p],jobs:[]};
 captureMediaVersions(p);const old=s.mediaVersions.motion[0];
 s.image='/uploads/new.png';s.prompt='新动作';s.motion={...s.motion,video:'/uploads/new.mp4',sourceFingerprint:sourceFingerprint(s)};
 captureMediaVersions(p);captureMediaVersions(p);
 assert.equal(s.mediaVersions.image.length,2);assert.equal(s.mediaVersions.motion.length,2);
 selectMediaVersion(p,{index:0,kind:'motion',versionId:old.id},local);
 assert.equal(s.image,'/uploads/old.png');assert.equal(s.prompt,'旧动作');assert.equal(s.motion.sourceFingerprint,sourceFingerprint(s));assert.equal(p.shotApprovals[0],undefined);
 assert.throws(()=>deleteMediaVersion(db,p,{index:0,kind:'motion',versionId:old.id,confirm:old.id},dir),/当前使用/);
 const newer=s.mediaVersions.motion[1];
 db.jobs.push({snapshot:{video:newer.url}});
 deleteMediaVersion(db,p,{index:0,kind:'motion',versionId:newer.id,confirm:newer.id},dir);
 assert.equal(s.mediaVersions.motion.length,1);assert.ok(fs.existsSync(local(newer.url)));
 const image=s.mediaVersions.image[1];
 assert.throws(()=>deleteMediaVersion(db,p,{index:0,kind:'image',versionId:image.id},dir),/确认/);
 const result=deleteMediaVersion(db,p,{index:0,kind:'image',versionId:image.id,confirm:image.id},dir);
 assert.equal(result.removedFiles,1);assert.ok(!fs.existsSync(local(image.url)));
 captureMediaVersions(p);assert.equal(s.mediaVersions.image.length,1);
});

test('HTTP 上传替换后历史持久化、冲突校验和版本删除',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'media-history-api-')),root=path.resolve(import.meta.dirname,'..');
 const fixture=JSON.parse(fs.readFileSync(path.join(root,'seed.json'),'utf8'));
 fixture.projects=[{id:'history',name:'历史测试',workflow:'creative',flowVersion:5,duration:2,audio:'/assets/song.mp3',updatedAt:'initial',shots:[{start:0,end:2,title:'镜头',prompt:'画面',image:'/assets/stills/01.png'}]}];fixture.jobs=[];
 fs.writeFileSync(path.join(dir,'studio.json'),JSON.stringify(fixture));
 const child=spawn(process.execPath,[path.join(root,'server.mjs')],{env:{...process.env,PORT:'14391',STUDIO_DATA:dir},windowsHide:true,stdio:'pipe'});
 try{
  // Use an isolated data directory and dedicated integration test port.
  let out='';const port=await new Promise((resolve,reject)=>{child.stdout.on('data',data=>{out+=data;const m=out.match(/127\.0\.0\.1:(\d+)/);if(m)resolve(m[1]);});child.once('error',reject);child.once('exit',code=>reject(Error('server exited '+code)));});
  const base=`http://127.0.0.1:${port}`,endpoint=base+'/api/projects/history';
  const request=async(url,method,body)=>{const r=await fetch(url,{method,body:JSON.stringify(body),headers:{'Content-Type':'application/json'}});return {status:r.status,data:await r.json()};};
  const file=await (await fetch(base+'/api/upload?name=history.png',{method:'POST',body:'fixture image'})).json();
  let p=(await request(endpoint,'PATCH',{shots:[{...fixture.projects[0].shots[0],image:file.url}]})).data;
  assert.equal(p.shots[0].mediaVersions.image.length,2);
  const old=p.shots[0].mediaVersions.image[0],newer=p.shots[0].mediaVersions.image[1];
  assert.equal((await request(endpoint+'/media-versions','POST',{index:0,kind:'image',versionId:old.id,expectedUpdatedAt:'stale'})).status,409);
  p=(await request(endpoint+'/media-versions','POST',{index:0,kind:'image',versionId:old.id,expectedUpdatedAt:p.updatedAt})).data;
  assert.equal(p.shots[0].image,old.url);
  assert.equal((await request(endpoint+'/media-versions','DELETE',{index:0,kind:'image',versionId:newer.id,confirm:newer.id,expectedUpdatedAt:p.updatedAt})).status,200);
  assert.ok(!fs.existsSync(path.join(dir,file.url)));
  const saved=JSON.parse(fs.readFileSync(path.join(dir,'studio.json')));
  assert.equal(saved.projects[0].shots[0].mediaVersions.image.length,1);
 }finally{child.kill();}
});
