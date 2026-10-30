import React from 'react';
import {AbsoluteFill,Audio,Img,staticFile,useCurrentFrame} from 'remotion';
import lyrics from './data/lyrics.json';
import {FPS,SECONDS,SHOTS,shotAt,clamp,prog} from './timing';
import {C,Defs,Character,Star,Paper} from './art';
import {CharacterAssetGate} from './characters';
import {Future,Reality,Encounter,Brave,Dream,Days,Philately,Monsters,Daydream,Childhood} from './scenes-a';
import {Confession,Shy,Anxiety,Bloom,Collect,LostBird,Believe,Finale} from './scenes-b';
const SCENES=[Future,Reality,Encounter,Brave,Dream,Days,Philately,Monsters,Daydream,Childhood,Confession,Shy,Anxiety,Bloom,Collect,LostBird,Believe,Finale];
export type MVProps={showLyrics:boolean;withSfx:boolean;noAudio?:boolean};
const Karaoke=({t}:{t:number})=>{
 const index=lyrics.findLastIndex(l=>l.time<=t),line=lyrics[index];
 if(!line?.text)return null;
 const next=lyrics[index+1]?.time??SECONDS,end=Math.min(next-.12,line.time+Math.min(5.9,line.text.replace(/\s/g,'').length*.225));
 const progress=clamp((t-line.time)/Math.max(.5,end-line.time));
 const size=line.text.length>22?32:35,width=line.text.length*size+100;
 const opacity=prog(t,line.time,line.time+.16)*(1-prog(t,next-.13,next));
 return <g opacity={opacity}>
  <path d={`M${800-width/2-35} 794Q800 773 ${800+width/2+35} 794V867Q800 881 ${800-width/2-35} 867Z`} fill="#102A3B" opacity=".52"/>
  <line x1={800-width*.44} x2={800+width*.44} y1="874" y2="874" stroke={C.paper} opacity=".17"/>
  <line x1={800-width*.44} x2={800-width*.44+width*.88*progress} y1="874" y2="874" stroke={C.gold} opacity=".65"/>
  <defs><clipPath id="karaokeReveal"><rect x={800-width/2+35} y="790" width={(width-70)*progress} height="80"/></clipPath></defs>
  <text x="800" y="843" textAnchor="middle" fontFamily="KaiTi, STKaiti, Microsoft YaHei, serif" fontSize={size} letterSpacing="2" fill={C.paper}>{line.text}</text>
  <text x="800" y="843" textAnchor="middle" fontFamily="KaiTi, STKaiti, Microsoft YaHei, serif" fontSize={size} letterSpacing="2" fill="#F6CF88" clipPath="url(#karaokeReveal)">{line.text}</text>
 </g>;
};
export const MusicVideo=({showLyrics=true,withSfx=true,noAudio=false}:MVProps)=>{
 const frame=useCurrentFrame(),t=frame/FPS,id=shotAt(Math.min(t,SECONDS-.001)),shot=SHOTS[id],lt=t-shot.start,p=clamp(lt/(shot.end-shot.start)),Scene=SCENES[id];
 // Short paper-toned light dissolves soften selected cuts without hiding the beat.
 const seam=[3,5,9,13,14,17].includes(id)?(1-prog(lt,0,.16))*.32:0;
 const fade=prog(t,0,.2)*(1-prog(t,71.72,72.679));
 return <AbsoluteFill style={{backgroundColor:'#132C3D'}}>
  <CharacterAssetGate/>
  <svg viewBox="0 0 1600 900" width="1920" height="1080" style={{opacity:fade}}>
   <Defs/><Scene t={t} lt={lt} p={p}/>
   <rect width="1600" height="900" fill="url(#grainLines)" pointerEvents="none"/>
   <rect width="1600" height="900" fill="url(#vignette)" pointerEvents="none"/>
   {seam>0&&<rect width="1600" height="900" fill={C.paper} opacity={seam}/>}
   {showLyrics&&<Karaoke t={t}/>}
  </svg>
  <AbsoluteFill style={{pointerEvents:'none',opacity:fade*.4,backgroundImage:`url(${staticFile('paper.png')})`,backgroundSize:'600px 600px',mixBlendMode:'soft-light'}}/>
  {!noAudio&&<><Audio src={staticFile('song.mp3')} volume={f=>.86*(1-prog(f/FPS,72.27,72.679))}/>{withSfx&&<Audio src={staticFile('foley.wav')} volume={.8}/>}</>}
 </AbsoluteFill>;
};
export const ModelSheet=()=> <AbsoluteFill style={{backgroundColor:C.paper}}>
 <CharacterAssetGate/>
 <svg width="1920" height="1080" viewBox="0 0 1600 900"><Defs/>
  <rect width="1600" height="900" fill="#E9DBC1"/>
  <path d="M0 670Q800 585 1600 670V900H0Z" fill="#D2C1A4"/>
  <text x="100" y="95" fontFamily="KaiTi,serif" fontSize="43" fill={C.ink}>把回忆拼好给你</text>
  <text x="103" y="130" fontFamily="Georgia,serif" fontSize="13" letterSpacing="5" fill={C.blue}>PAPER MEMORIES · CHARACTER STUDY</text>
  <path d="M100 155H1500" stroke="#B7A68B"/>
  <Character x={260} y={730} s={1.58}/><Character x={530} y={730} s={1.58} face="profile" pose="hold"/>
  <Character x={920} y={730} s={1.62} boy/><Character x={1200} y={730} s={1.62} boy face="profile" pose="reach"/>
  <Star x={755} y={405} r={34}/><path d="M750 470V670" stroke="#C3B18D" strokeDasharray="3 9"/>
  <text x="400" y="807" textAnchor="middle" fontFamily="KaiTi,serif" fontSize="25" fill={C.ink}>她 · 象牙白与陶土粉</text>
  <text x="1060" y="807" textAnchor="middle" fontFamily="KaiTi,serif" fontSize="25" fill={C.ink}>他 · 靛蓝与赭金</text>
 </svg>
 <AbsoluteFill style={{pointerEvents:'none',opacity:.32,backgroundImage:`url(${staticFile('paper.png')})`,backgroundSize:'600px'}}/>
 </AbsoluteFill>;
