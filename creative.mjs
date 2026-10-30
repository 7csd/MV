import fs from 'node:fs';
import {productionRules} from './production.mjs';
import {download,expand} from './providers.mjs';
export const storyboardInstruction=productionRules;
export function timingDraft(p){const n=Math.max(1,Math.min(60,Math.round(p.duration/6))),shots=[];for(let i=0;i<n;i++){const start=+(p.duration*i/n).toFixed(3),end=+(p.duration*(i+1)/n).toFixed(3),lines=p.lyrics.filter(l=>l.time>=start&&l.time<end);shots.push({start,end,title:lines.map(l=>l.text).join(' / ').slice(0,80)||'器乐段落',prompt:'',image:'',locked:false});}return {story:'',shots};}
export async function generateFrame(config,{prompt,references,signal}){
 if(!config.imageBaseUrl||!config.imageModel||!config.imageApiKey)throw Error('请在模型设置配置图像接口，或为镜头上传分镜图。');
 const mime=file=>file.toLowerCase().endsWith('.png')?'image/png':file.toLowerCase().endsWith('.webp')?'image/webp':'image/jpeg';let body,path='/images/edits',headers={Authorization:'Bearer '+config.imageApiKey};
 if(config.imageAdapter==='json'){path=config.imagePath||'/images/generations';const images=references.map(r=>'data:'+mime(r.file)+';base64,'+fs.readFileSync(r.file).toString('base64'));body=JSON.stringify(expand(config.imageRequest||{model:'{{model}}',prompt:'{{prompt}}',images:'{{references}}',size:'1536x1024'},{model:config.imageModel,prompt,references:images}));headers['Content-Type']='application/json';}
 else{body=new FormData();body.set('model',config.imageModel);body.set('prompt',prompt);body.set('size',config.imageSize||'1536x1024');for(const ref of references)body.append('image[]',new Blob([fs.readFileSync(ref.file)],{type:mime(ref.file)}),ref.name);}
 const response=await fetch(config.imageBaseUrl+path,{method:'POST',headers,body,redirect:'error',signal:AbortSignal.any([AbortSignal.timeout(240000),...(signal?[signal]:[])])});if(!response.ok)throw Error('图像接口返回 HTTP '+response.status);const value=await response.json();const result=value.data?.[0];const bytes=result?.b64_json?Buffer.from(result.b64_json,'base64'):result?.url?await download(result.url,{maxBytes:30*1024*1024,signal}):null;if(!bytes)throw Error('图像接口需返回 data[0].b64_json 或 data[0].url');if(bytes.length<8||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('图像接口未返回有效 PNG。');return bytes;
}
