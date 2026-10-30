import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const bin=path.join(root,'node_modules','@remotion','compositor-win32-x64-msvc');
const ff=process.env.MV_FFMPEG||(fs.existsSync('E:/MV/tools/bin/ffmpeg.exe')?'E:/MV/tools/bin/ffmpeg.exe':'ffmpeg');
const probe=path.join(bin,'ffprobe.exe');
const run=(args)=>{const p=spawnSync(ff,['-v','error','-y',...args],{stdio:'inherit',windowsHide:true});if(p.status!==0)throw new Error('ffmpeg failed');};
const times=[3.3,7.4,10.9,14.3,16.95,21.5,26.7,29.1,31.8,35,38.1,39.9,43.4,46.7,51.4,57.3,63.1,70];
for(let i=0;i<times.length;i++){
 run(['-ss',String(times[i]),'-i','out/PaperMemories.mp4','-vf','scale=1280:720','-frames:v','1',`out/stills/${String(i+1).padStart(2,'0')}.png`]);
}
run(['-start_number','1','-i','out/stills/%02d.png','-vf','scale=480:270,tile=3x6:padding=8:margin=8:color=0xe9dbc1','-frames:v','1','out/storyboard.jpg']);
run(['-ss','46.7','-i','out/PaperMemories.mp4','-frames:v','1','out/poster.png']);
run(['-ss','40.5','-i','out/PaperMemories.mp4','-t',String(172/24),'-vf','scale=1280:720','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-colorspace','bt709','-color_range','tv','-c:a','aac','-b:a','192k','-movflags','+faststart','out/preview-climax.mp4']);
run(['-i','out/PaperMemories.mp4','-i','public/song.mp3','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-af','volume=0.86,afade=t=out:st=72.27:d=0.409','-movflags','+faststart','-shortest','out/PaperMemories-original-audio.mp4']);
const metadata=spawnSync(probe,['-v','error','-show_format','-show_streams','-of','json','out/PaperMemories.mp4'],{encoding:'utf8',windowsHide:true});
if(metadata.status===0)fs.writeFileSync('out/metadata.json',metadata.stdout);
console.log('Final storyboard, poster, preview and original-audio version prepared.');
