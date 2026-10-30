import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const root = path.resolve(import.meta.dirname, '..');
const pub = path.join(root, 'public');
fs.mkdirSync(pub, {recursive: true});
fs.mkdirSync(path.join(root, 'src', 'data'), {recursive: true});
fs.copyFileSync(path.join(root, '..', '王贰浪 - 把回忆拼好给你（选段）.mp3'), path.join(pub, 'song.mp3'));
const lrc = fs.readFileSync(path.join(root, '..', '王贰浪 - 把回忆拼好给你（选段）.lrc'), 'utf8');
fs.writeFileSync(path.join(pub, 'song.lrc'), lrc);
const lyrics = [...lrc.matchAll(/\[(\d+):(\d+)\.(\d+)\]([^\r\n]*)/g)].map(m => ({time: +m[1]*60 + +m[2] + +('0.'+m[3]), text: m[4].trim()}));
fs.writeFileSync(path.join(root, 'src', 'data', 'lyrics.json'), JSON.stringify(lyrics, null, 2));
// A fixed translucent paper fibre texture. It is an ordinary deterministic raster asset,
// not a changing SVG turbulence filter, so there is no temporal noise during rendering.
let state = 32971;
const rand = () => {state = (Math.imul(state,1664525)+1013904223)>>>0; return state/4294967296;};
const crc = b => {let c=0xffffffff; for(const v of b){c^=v;for(let j=0;j<8;j++) c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
const chunk = (tag, data) => {const name=Buffer.from(tag), len=Buffer.alloc(4), cs=Buffer.alloc(4); len.writeUInt32BE(data.length);cs.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([len,name,data,cs]);};
const w=600,h=600,raw=Buffer.alloc(h*(w*4+1));
for(let y=0;y<h;y++) for(let x=0;x<w;x++) {const i=y*(w*4+1)+1+x*4;const n=rand(); const dark=n<.49;raw[i]=raw[i+1]=raw[i+2]=dark?20:255;raw[i+3]=Math.round(5+rand()*25);}
const ih=Buffer.alloc(13);ih.writeUInt32BE(w);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;
fs.writeFileSync(path.join(pub,'paper.png'),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
// Original procedural foley, fixed seed, 48 kHz stereo. Quiet mix is intentional.
const sr=48000, duration=72.679, count=Math.ceil(sr*duration), samples=new Float32Array(count*2);
const events=[
 [0.135,'paper'],[1.644,'paper'],[3.153,'paper'],[5.794,'low'],[8.812,'paper'],
 [12.584,'chime'],[15.225,'water'],[16.734,'water'],[18.243,'paper'],[21.261,'paper'],
 [24.655,'stamp'],[25.410,'stamp'],[26.164,'stamp'],[27.296,'low'],[28.427,'chime'],
 [30.314,'paper'],[33.332,'wing'],[34.841,'wing'],[36.350,'paper'],[38.991,'low'],
 [40.500,'cosmos'],[45.027,'bloom'],[47.667,'paper'],[49.176,'paper'],[50.685,'paper'],
 [53.326,'water'],[56.344,'wing'],[58.984,'chime'],[62.003,'chime'],[65.020,'paper'],[68.038,'bloom']
];
for(const [at,kind] of events){
 const d={paper:.42,stamp:.16,water:.28,wing:.45,low:.8,chime:1.4,cosmos:3.6,bloom:2.1}[kind];
 let lp=0;
 for(let j=0;j<d*sr;j++){
  const t=j/sr,k=t/d,noise=rand()*2-1;lp=.91*lp+.09*noise;
  let v=0;
  if(kind==='paper'||kind==='wing')v=(noise*.2+lp*.8)*Math.sin(Math.PI*k)**2*(kind==='wing'?Math.sin(t*28)**2:1)*.09;
  if(kind==='stamp')v=(lp+Math.sin(t*460)*.4)*Math.exp(-t*45)*.085;
  if(kind==='water')v=Math.sin(2*Math.PI*(1450*t-1050*t*t))*Math.exp(-t*24)*.028;
  if(kind==='low')v=Math.sin(2*Math.PI*90*t)*Math.sin(Math.PI*k)**2*.014;
  if(kind==='cosmos')v=(lp*.5+Math.sin(2*Math.PI*(66*t+14*t*t))*.5)*Math.sin(Math.PI*k)**2*.026;
  if(kind==='chime'||kind==='bloom')v=(Math.sin(t*2*Math.PI*880)+.4*Math.sin(t*2*Math.PI*1320)+.2*Math.sin(t*2*Math.PI*1760))*Math.exp(-t*3)*Math.min(1,t*50)*.016;
  const ix=Math.round(at*sr)+j;if(ix>=count)break;
  samples[ix*2]+=v*.95;samples[ix*2+1]+=v;
 }
}
const data=Buffer.alloc(count*4);
for(let i=0;i<samples.length;i++)data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),i*2);
const hd=Buffer.alloc(44);hd.write('RIFF');hd.writeUInt32LE(36+data.length,4);hd.write('WAVEfmt ',8);hd.writeUInt32LE(16,16);hd.writeUInt16LE(1,20);hd.writeUInt16LE(2,22);hd.writeUInt32LE(sr,24);hd.writeUInt32LE(sr*4,28);hd.writeUInt16LE(4,32);hd.writeUInt16LE(16,34);hd.write('data',36);hd.writeUInt32LE(data.length,40);
fs.writeFileSync(path.join(pub,'foley.wav'),Buffer.concat([hd,data]));
console.log(`Prepared song, LRC (${lyrics.filter(l=>l.text).length} lines), fixed paper texture, original foley.`);
