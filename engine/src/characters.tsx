import React,{useEffect,useState} from 'react';
import {staticFile,delayRender,continueRender,cancelRender} from 'remotion';
import atlas from './data/character-rig.json';
import type {CharacterProps} from './art';
import {LegacyCharacter,Star} from './art';

type Layer={file:string;box:number[]};
type Rig={width:number;height:number;center:number;floor:number;top:number;layers:Record<string,Layer>;headPivot?:number[];armPivots?:Record<string,number[]>;legPivot?:number[]};
const rigs=atlas as unknown as Record<string,Rig>;
const files=[...new Set(Object.values(rigs).flatMap(r=>Object.values(r.layers).map(l=>l.file)))];

// Browser-native SVG image elements need an explicit asset gate before capture.
export const CharacterAssetGate=()=>{
 const [handle]=useState(()=>delayRender('Loading approved paper character layers'));
 useEffect(()=>{
  let active=true;
  Promise.all(files.map(src=>new Promise<void>((resolve,reject)=>{
   const im=new Image();im.onload=()=>resolve();im.onerror=()=>reject(new Error(`Cannot load character asset ${src}`));im.src=staticFile(src);
  }))).then(()=>{if(active)continueRender(handle);}).catch(cancelRender);
  return()=>{active=false;};
 },[handle]);
 return null;
};

const turnPoint=(point:number[],pivot:number[],degrees:number)=>{
 const a=degrees*Math.PI/180,dx=point[0]-pivot[0],dy=point[1]-pivot[1];
 return [pivot[0]+dx*Math.cos(a)-dy*Math.sin(a),pivot[1]+dx*Math.sin(a)+dy*Math.cos(a)];
};

export const Character=({x,y,s=1,boy=false,face='front',flip=false,t=0,pose='idle',sad=false}:CharacterProps)=>{
 const neckClipId=React.useId().replace(/:/g,'');
 // Distant crowd silhouettes keep the original anonymous graphic vocabulary.
 if(face==='back')return <LegacyCharacter x={x} y={y} s={s} boy={boy} face="back" flip={flip} t={t} pose={pose} sad={sad}/>;
 const seated=pose==='sit';
 const neutralBody=!boy&&!seated&&(sad||pose==='idle'||pose==='shy'||pose==='walk');
 const key=seated?(boy?'man-seated':'woman-seated'):boy?'man-threequarter':neutralBody?'woman-sad':face==='front'?'woman-front':'woman-threequarter';
 const rig=rigs[key];
 const height=seated?270:332,k=height/(rig.floor-rig.top);
 const walking=pose==='walk',breath=Math.sin(t*1.6)*.65,bob=walking?Math.sin(t*8)*1.1:0;
 const headTilt=sad?Math.sin(t*.6)*.65:Math.sin(t*.65)*1.05;
 const rightAngle=neutralBody?Math.sin(t*.9)*.45:pose==='reach'?-10+Math.sin(t*1.2)*1.2:pose==='hold'?-2+Math.sin(t*.8):pose==='wave'?-57+Math.sin(t*2.5)*5:pose==='shy'?43:walking?43+Math.sin(t*4)*5:43+Math.sin(t*.8)*1.2;
 const leftAngle=neutralBody?Math.sin(t*.8)*.4:seated?0:pose==='shy'?-4:walking?Math.sin(t*4+Math.PI)*4:Math.sin(t*.9)*.8;
 const draw=(part:string,angle=0,pivot?:number[])=>{
  const layer=rig.layers[part];if(!layer)return null;
  const [l,top,r,b]=layer.box;
  return <g key={part} transform={pivot?`rotate(${angle} ${pivot[0]} ${pivot[1]})`:undefined}>
   <image href={staticFile(layer.file)} x={l} y={top} width={r-l} height={b-top} preserveAspectRatio="none"/>
  </g>;
 };
 const hand=boy?[915,604]:key==='woman-front'?[908,544]:[913,623];
 const palm=rig.armPivots?turnPoint(hand,rig.armPivots.rightArm,rightAngle):hand;
 const head=()=>{
  if(!neutralBody||sad)return draw('head',headTilt,rig.headPivot);
  const source=rigs[face==='front'?'woman-front':'woman-threequarter'],layer=source.layers.head;
  const [l,top,r,b]=layer.box,p=rig.headPivot!,q=source.headPivot!;
  return <g transform={`rotate(${headTilt} ${p[0]} ${p[1]})`}>
   <defs><clipPath id={neckClipId}><rect x={-1000} y={-1000} width={3000} height={1000+p[1]+2}/></clipPath></defs>
   <g clipPath={`url(#${neckClipId})`}>
    <g transform={`translate(${p[0]-q[0]} ${p[1]-q[1]})`}>
     <image href={staticFile(layer.file)} x={l} y={top} width={r-l} height={b-top} preserveAspectRatio="none"/>
    </g>
   </g>
  </g>;
 };
 return <g transform={`translate(${x} ${y}) scale(${s*(flip?-1:1)} ${s})`}>
  <ellipse cx="0" cy="1" rx={seated?45:34} ry="6" fill="#102B3B" opacity=".15"/>
  <g transform={`translate(0 ${breath+bob})`}>
   <g transform={`scale(${k}) translate(${-rig.center} ${-rig.floor})`}>
    {seated?draw('whole'): <>
     {draw('leftLeg',walking?Math.sin(t*4)*3.2:0,rig.legPivot)}
     {draw('rightLeg',walking?-Math.sin(t*4)*3.2:0,rig.legPivot)}
     {draw('leftArm',leftAngle,rig.armPivots?.leftArm)}
     {neutralBody&&!sad&&<ellipse cx={rig.headPivot![0]} cy={rig.headPivot![1]+18} rx={45} ry={43} fill="#F2CFB0"/>}
     {draw('body')}
     {head()}
     {draw('rightArm',rightAngle,rig.armPivots?.rightArm)}
    </>}
   </g>
   {pose==='hold'&&!seated&&<Star x={(palm[0]-rig.center)*k} y={(palm[1]-rig.floor)*k-3} r={10}/>}
  </g>
 </g>;
};
