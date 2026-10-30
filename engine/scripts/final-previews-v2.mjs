import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const out='out-v2',video=`${out}/PaperMemories-v2.mp4`;
const ff=process.env.MV_FFMPEG||(fs.existsSync('E:/MV/tools/bin/ffmpeg.exe')?'E:/MV/tools/bin/ffmpeg.exe':'ffmpeg');
const probe=path.join(root,'node_modules','@remotion','compositor-win32-x64-msvc','ffprobe.exe');
const run=(args)=>{const p=spawnSync(ff,['-v','error','-y',...args],{stdio:'inherit',windowsHide:true});if(p.status!==0)throw new Error('ffmpeg failed');};
const times=[3.3,7.4,10.9,14.3,16.95,21.5,26.7,29.1,31.8,35,38.1,39.9,43.4,46.7,51.4,57.3,63.1,70];
for(let i=0;i<times.length;i++){
 run(['-ss',String(times[i]),'-i',video,'-vf','scale=1280:720','-frames:v','1',`${out}/stills/${String(i+1).padStart(2,'0')}.png`]);
}
run(['-start_number','1','-i',`${out}/stills/%02d.png`,'-vf','scale=480:270,tile=3x6:padding=8:margin=8:color=0xe9dbc1','-frames:v','1',`${out}/storyboard-v2.jpg`]);
run(['-ss','46.7','-i',video,'-frames:v','1',`${out}/poster-v2.png`]);
run(['-ss','40.5','-i',video,'-t',String(172/24),'-vf','scale=1280:720','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-colorspace','bt709','-color_range','tv','-c:a','aac','-b:a','192k','-movflags','+faststart',`${out}/preview-climax-v2.mp4`]);
run(['-ss',String(212/24),'-i',video,'-t',String(364/24),'-vf','scale=1280:720','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-colorspace','bt709','-color_range','tv','-c:a','aac','-b:a','192k','-movflags','+faststart',`${out}/preview-interaction-v2.mp4`]);
run(['-i',video,'-i','public/song.mp3','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-af','volume=0.86,afade=t=out:st=72.27:d=0.409','-movflags','+faststart','-shortest',`${out}/PaperMemories-v2-original-audio.mp4`]);
const metadata=spawnSync(probe,['-v','error','-show_format','-show_streams','-of','json',video],{encoding:'utf8',windowsHide:true});
if(metadata.status===0)fs.writeFileSync(`${out}/metadata.json`,metadata.stdout);
console.log('V2 final previews, original-audio variant and metadata exported.');
