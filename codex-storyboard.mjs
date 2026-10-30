import {storyboardInstruction} from './creative.mjs';
import {storyboardSchema} from './production.mjs';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const binary=process.env.STUDIO_CODEX_BIN||'codex';
function run(args,{cwd,input,timeout=15000,onProgress=()=>{},signal}={}){
 return new Promise((resolve,reject)=>{
  if(signal?.aborted)return reject(Error('制作已停止'));
  const env={...process.env};delete env.OPENAI_API_KEY;delete env.CODEX_API_KEY;
  const child=spawn(binary,args,{cwd,env,windowsHide:true,shell:false});let output='',error='',pending='',eventError='',settled=false;const notify=(message,detail='')=>onProgress(message,detail);
  const abort=()=>{child.kill();finish(Error('制作已停止'));};
  const finish=(err,value)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);err?reject(err):resolve(value);};
  const timer=setTimeout(()=>{child.kill();finish(Error(`网站等待上限 ${Math.round(timeout/60000)} 分钟已到，已终止调用。${eventError?'最近错误：'+eventError:'尚未收到完整结果；无法仅凭超时判断是模型生成慢还是网络等待。'}`));},timeout);
  signal?.addEventListener('abort',abort,{once:true});
  child.stdout.on('data',c=>{output=(output+c).slice(-1048576);pending+=c;const lines=pending.split(/\r?\n/);pending=lines.pop();for(const line of lines){try{const event=JSON.parse(line);if(event.type==='thread.started')notify('已启动本地 Codex，等待模型响应');else if(event.type==='turn.started')notify('模型请求已开始，等待故事与分镜');else if(event.type==='item.completed')notify(event.item?.type==='agent_message'?'已收到模型内容，等待完整结果':'已收到模型活动，继续等待分镜结果');else if(event.type==='turn.completed')notify('模型已完成，正在校验分镜');else if(event.type==='error'||event.type==='turn.failed'){eventError=String(event.message||event.error?.message||'模型返回错误').slice(-600);notify('模型连接出现错误，正在等待最终状态',eventError);}}catch{}}});child.stderr.on('data',c=>{error=(error+c).slice(-2000);});
  child.on('error',()=>finish(Error('未找到或无法启动 Codex CLI，请安装后重启网站服务。')));
  child.on('close',code=>finish(code===0?null:Error('Codex 调用失败，请检查登录、模型权限和剩余额度。 '+error.slice(-1200)),output+'\n'+error));
  child.stdin.on('error',()=>{});child.stdin.end(input||'');
 });
}
export async function codexStatus(){
 try{const result=await run(['login','status']);const loggedIn=/Logged in using ChatGPT/i.test(result);return {available:true,loggedIn,message:loggedIn?'已通过 ChatGPT 登录 · 使用 Codex 账号额度':'请运行 codex login，选择 ChatGPT 账号登录。'};}
 catch(e){return {available:false,loggedIn:false,message:e.message};}
}
export async function codexStoryboard(payload,model='gpt-6.1-sol',onProgress=()=>{},signal,imageFiles=[]){
 onProgress('正在检查本地 Codex 登录');
 const status=await codexStatus();if(!status.loggedIn)throw Error(status.message);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'paperlight-codex-'));
 try{
  const schema=storyboardSchema;
  const schemaFile=path.join(dir,'schema.json'),output=path.join(dir,'result.json');fs.writeFileSync(schemaFile,JSON.stringify(schema));
  await run(['exec','--json','--ignore-user-config','--ephemeral','--skip-git-repo-check','--sandbox','read-only','--model',model,'--output-schema',schemaFile,'--output-last-message',output,...imageFiles.flatMap(file=>['--image',file]),'-'],{cwd:dir,timeout:600000,onProgress,signal,input:storyboardInstruction+'\n'+JSON.stringify(payload)});
  try{return JSON.parse(fs.readFileSync(output,'utf8'));}catch{throw Error('Codex 未返回有效分镜 JSON，请重试。');}
 }finally{try{fs.rmSync(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100});}catch{ /* Temporary cleanup must not hide the model result or error. */ }}
}
