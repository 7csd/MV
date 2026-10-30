import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,openBrowser,renderStill,renderMedia} from '@remotion/renderer';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const mode=process.argv[2]||'stills';
const browserExecutable=[process.env.MV_BROWSER,process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'Google/Chrome/Application/chrome.exe'),'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(p=>p&&fs.existsSync(p));
if(!browserExecutable)throw new Error('Set MV_BROWSER to a local Chrome or Edge executable.');
const out=path.join(root,'out-v2');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(path.join(out,'stills'),{recursive:true});
console.log('Bundling React / SVG composition…');
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.tsx'),publicDir:path.join(root,'public'),outDir:path.join(root,`.bundle-v2-${mode}`)});
const browser=await openBrowser('chrome',{browserExecutable,chromeMode:'chrome-for-testing',chromiumOptions:{gl:'angle'}});
try{
 const inputProps={showLyrics:mode!=='clean',withSfx:mode!=='original'};
 const composition=await selectComposition({serveUrl,id:'PaperMemories',inputProps,browserExecutable,puppeteerInstance:browser});
 const options={serveUrl,composition,inputProps,browserExecutable,chromeMode:'chrome-for-testing',puppeteerInstance:browser,logLevel:'warn',timeoutInMilliseconds:120000};
 if(mode==='stills'||mode==='model'||mode==='rigcheck'){
  const model=await selectComposition({...options,id:'CharacterStudy',inputProps:{}});
  await renderStill({...options,composition:model,inputProps:{},output:path.join(out,'characters.png'),imageFormat:'png'});console.log('Character sheet ready');
  const times=mode==='model'?[]:mode==='rigcheck'?[10.9,14.3,19.1,31.8,39.9,57.3]:[3.3,7.4,10.9,14.3,16.95,21.5,26.7,29.1,31.8,35.0,38.1,39.9,43.4,46.7,51.4,57.3,63.1,70.0];
  for(let i=0;i<times.length;i++){
   await renderStill({...options,frame:Math.round(times[i]*24),output:path.join(out,mode==='rigcheck'?'': 'stills',mode==='rigcheck'?`rig-${i+1}.png`:`${String(i+1).padStart(2,'0')}.png`),imageFormat:'png',scale:2/3});
   console.log(`Shot ${i+1}/18 · ${times[i]}s`);
  }
 }else if(mode==='verify'){
  for(const [name,frame] of [['same-a',264],['next',265],['same-b',264]]){
   await renderStill({...options,frame,output:path.join(out,`${name}.png`),imageFormat:'png',scale:2/3});
   console.log(`Verification frame ${frame}: ${name}`);
  }
 }else{
  const modes=mode==='all'?['full','clean']:mode==='tests'?['preview','interaction']:[mode];
  for(const take of modes){
   const preview=take==='preview',interaction=take==='interaction',small=preview||interaction,videoOut=preview?'preview-climax-v2.mp4':interaction?'preview-interaction-v2.mp4':take==='clean'?'PaperMemories-v2-clean.mp4':take==='original'?'PaperMemories-v2-original-audio.mp4':'PaperMemories-v2.mp4';
   const takeProps={showLyrics:take!=='clean',withSfx:take!=='original'};
   let last=-1;
   await renderMedia({...options,inputProps:takeProps,codec:'h264',outputLocation:path.join(out,videoOut),crf:18,pixelFormat:'yuv420p',colorSpace:'bt709',audioCodec:'aac',audioBitrate:'256k',concurrency:4,scale:small?2/3:1, ...(preview?{frameRange:[972,1143]}:interaction?{frameRange:[212,575]}:{}),onProgress:({progress,renderedFrames})=>{const bucket=Math.floor(progress*20);if(bucket>last){last=bucket;console.log(`${videoOut}: ${Math.floor(progress*100)}% (${renderedFrames} rendered frames)`);}}});
   console.log(path.join(out,videoOut));
  }
 }
}finally{await browser.close({silent:true});}
