export const FPS = 24;
export const SECONDS = 72.679;
export const FRAMES = Math.ceil(SECONDS * FPS);
export const BPM = 159.05;
export const BEAT = 60 / BPM;
export const OFFSET = .135;
export const clamp = (x:number,a=0,b=1) => Math.max(a,Math.min(b,x));
export const mix = (a:number,b:number,k:number) => a+(b-a)*k;
export const smooth = (x:number) => {x=clamp(x);return x*x*(3-2*x);};
export const prog = (t:number,a:number,b:number) => smooth((t-a)/(b-a));
export const easeOut = (x:number) => 1-(1-clamp(x))**3;
export const hash = (n:number) => {const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export const pulse = (t:number,division=1) => {const b=(t-OFFSET)/(BEAT*division);return Math.exp(-((b-Math.floor(b)))*7);};
export const SHOTS = [
 {start:0,end:5.794,title:'光明的未来'},
 {start:5.794,end:8.812,title:'现实下沉'},
 {start:8.812,end:12.584,title:'相遇'},
 {start:12.584,end:15.225,title:'尘埃成星'},
 {start:15.225,end:17.865,title:'梦的盆栽'},
 {start:17.865,end:24.278,title:'快乐直到日落'},
 {start:24.278,end:27.296,title:'集邮册'},
 {start:27.296,end:29.937,title:'夜晚的妖怪'},
 {start:29.937,end:33.332,title:'心不在焉'},
 {start:33.332,end:36.350,title:'七岁的小孩'},
 {start:36.350,end:38.991,title:'未寄出的告白'},
 {start:38.991,end:40.500,title:'喜欢却不敢爱'},
 {start:40.500,end:45.027,title:'宇宙焦虑'},
 {start:45.027,end:47.667,title:'黎明盛开'},
 {start:47.667,end:53.326,title:'收集回忆'},
 {start:53.326,end:58.984,title:'偷偷哭泣的倦鸟'},
 {start:58.984,end:65.020,title:'相信与紧握'},
 {start:65.020,end:SECONDS,title:'没有遗失过去'},
];
export const shotAt = (t:number) => Math.max(0,SHOTS.findIndex(s=>t>=s.start&&t<s.end));
