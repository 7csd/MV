import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const tools=path.join(import.meta.dirname,'engine/node_modules/@remotion/compositor-win32-x64-msvc');
export const ffmpeg=process.env.STUDIO_FFMPEG||path.join(tools,'ffmpeg.exe');
const ffprobe=process.env.STUDIO_FFPROBE||path.join(tools,'ffprobe.exe');
export function command(binary,args,{timeout=120000,binaryOutput=false,maxBytes=16*1024*1024}={}){return new Promise((resolve,reject)=>{const child=spawn(binary,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});const chunks=[];let size=0,error='',settled=false;const finish=(e,result)=>{if(settled)return;settled=true;clearTimeout(timer);e?reject(e):resolve(result);};const timer=setTimeout(()=>{child.kill();finish(Error('媒体处理超时'));},timeout);child.stdout.on('data',c=>{size+=c.length;if(size>maxBytes){child.kill();finish(Error('媒体输出超出限制'));}else chunks.push(c);});child.stderr.on('data',c=>error=(error+c).slice(-2500));child.on('error',()=>finish(Error('无法启动媒体工具，请设置 STUDIO_FFMPEG / STUDIO_FFPROBE')));child.on('close',code=>finish(code===0?null:Error('媒体处理失败：'+error),binaryOutput?Buffer.concat(chunks):Buffer.concat(chunks).toString()));});}
export async function probe(file){const data=JSON.parse(await command(ffprobe,['-v','error','-show_entries','format=duration:stream=codec_type,width,height,r_frame_rate,duration,nb_frames','-of','json',file]));const video=data.streams?.find(s=>s.codec_type==='video');if(!video)throw Error('文件没有有效视频画面');return {...video,duration:Number(video.duration||data.format?.duration),containerDuration:Number(data.format?.duration)};}
export async function keyframe(file,output,width=1280,height=720){await command(ffmpeg,['-v','error','-y','-i',file,'-vf',`scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,'-frames:v','1',output]);return output;}
export async function verifyMotion(file,duration){
 const info=await probe(file);if(!Number.isFinite(info.duration)||info.duration<duration-.12)throw Error(`动态片段只有${info.duration.toFixed(2)}秒，需要至少${duration.toFixed(2)}秒；不使用定格或循环补足。`);
 if(info.width<320||info.height<180)throw Error('动态片段分辨率过低');
 if(Math.abs(info.width/info.height-16/9)>.12)throw Error('动态片段不是16:9横屏，请调整视频接口的比例参数。');
 // Decode the entire usable section, then sample temporal changes. This is technical QA, not semantic action verification.
 await command(ffmpeg,['-v','error','-i',file,'-t',String(duration),'-an','-c:v','rawvideo','-f','null','-']);
 const frames=await command(ffmpeg,['-v','error','-i',file,'-t',String(duration),'-vf','scale=64:36,format=gray','-r','4','-c:v','rawvideo','-f','image2pipe','-'],{binaryOutput:true});
 const count=Math.floor(frames.length/2304);let changes=0,total=0,maxStill=0,still=0;for(let f=1;f<count;f++){let difference=0;for(let i=0;i<2304;i++)difference+=Math.abs(frames[f*2304+i]-frames[(f-1)*2304+i]);difference/=2304;total+=difference;if(difference>.18){changes++;still=0;}else{still++;maxStill=Math.max(maxStill,still);}}
 if(count<3||changes<2||total/Math.max(1,count-1)<.12)throw Error('检测到画面基本静止，请重新生成动态片段。');
 return {passed:true,duration:info.duration,width:info.width,height:info.height,meanFrameChange:+(total/(count-1)).toFixed(3),longestStillSeconds:maxStill/4,warning:maxStill/4>1.5?'局部有较长停顿，请预览确认':'',semanticReview:'未自动验证人物身份、手部与动作语义，请预览检查',checkedAt:new Date().toISOString()};
}
export async function normalizeVideo(file,output,duration){const source=await probe(file);if(source.width<1920||source.height<1080)throw Error('源片段须达到1920×1080；不能用720p放大代替1080p制作');await command(ffmpeg,['-v','error','-y','-i',file,'-t',String(duration),'-vf','scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080','-r','24','-aspect','16:9','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',output]);return probe(output);}

export async function analyzeAudio(file,duration){
 const wav=await command(ffmpeg,['-v','error','-i',file,'-t',String(duration),'-ac','1','-ar','8000','-c:a','pcm_s16le','-f','wav','-'],{binaryOutput:true,maxBytes:12*1024*1024});let start=-1;for(let pos=12;pos+8<wav.length;){const size=wav.readUInt32LE(pos+4);if(wav.toString('ascii',pos,pos+4)==='data'){start=pos+8;break;}pos+=8+size+(size%2);}if(start<0)throw Error('无法读取音频采样');
 const energy=[];for(let pos=start;pos+1600<=wav.length;pos+=1600){let sum=0;for(let n=0;n<800;n++){const sample=wav.readInt16LE(pos+n*2)/32768;sum+=sample*sample;}energy.push(Math.sqrt(sum/800));}const peak=Math.max(...energy,.001),accents=[];for(let i=2;i<energy.length-1;i++)if(energy[i]>peak*.25&&energy[i]>energy[i-1]*1.12&&energy[i]>=energy[i+1]&&(!accents.length||i/10-accents.at(-1)>.3))accents.push(+(i/10).toFixed(1));return {method:'audio-rms-onset-v1',note:'实际音频能量与上升沿候选点，用于节奏参考；不等于准确鼓点或BPM。',stepSeconds:.1,energy:energy.map(v=>+(v/peak).toFixed(3)),accents,analyzedAt:new Date().toISOString()};
}
