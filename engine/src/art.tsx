import React from 'react';
import {hash, mix, smooth, clamp, pulse, prog} from './timing';
export const C={ink:'#172B3B',navy:'#17334A',blue:'#315B71',teal:'#6A9998',mist:'#A9C5BE',paper:'#F2E6CF',cream:'#FFF0CC',gold:'#E8B55D',rust:'#B8614F',pink:'#D6A19A',rose:'#9D6572',purple:'#473B62',skin:'#D9A77D',skinL:'#F0C69D',hair:'#28323D'};
export const Defs=()=> <defs>
 <linearGradient id="sky" x2=".1" y2="1"><stop stopColor="#15394E"/><stop offset=".65" stopColor="#618B91"/><stop offset="1" stopColor="#E8D2AB"/></linearGradient>
 <linearGradient id="dusk" x2="0" y2="1"><stop stopColor="#504865"/><stop offset=".55" stopColor="#D28E83"/><stop offset="1" stopColor="#F0C79A"/></linearGradient>
 <linearGradient id="night" x2="0" y2="1"><stop stopColor="#112436"/><stop offset="1" stopColor="#394D66"/></linearGradient>
 <linearGradient id="warm" x2=".4" y2="1"><stop stopColor="#F4D79D"/><stop offset="1" stopColor="#D4997E"/></linearGradient>
 <radialGradient id="vignette"><stop offset=".45" stopColor="#081A27" stopOpacity="0"/><stop offset="1" stopColor="#081A27" stopOpacity=".44"/></radialGradient>
 <radialGradient id="sunGlow"><stop stopColor="#FDE7AF" stopOpacity=".5"/><stop offset="1" stopColor="#FDE7AF" stopOpacity="0"/></radialGradient>
 <filter id="shadow" x="-30%" y="-40%" width="170%" height="190%"><feDropShadow dx="0" dy="10" stdDeviation="7" floodColor="#0B1B29" floodOpacity=".35"/></filter>
 <filter id="smallShadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="2" dy="4" stdDeviation="2" floodColor="#112333" floodOpacity=".3"/></filter>
 <pattern id="grainLines" width="71" height="49" patternUnits="userSpaceOnUse"><path d="M5 8h8m31 21h11m-22 14h4M63 3h2" stroke="#FFF3D6" strokeWidth=".7" opacity=".13"/></pattern>
 </defs>;
export const Paper=({children,small=false,...props}:React.SVGProps<SVGGElement>&{small?:boolean})=><g filter={`url(#${small?'smallShadow':'shadow'})`} {...props}>{children}</g>;
export const Star=({x=0,y=0,r=20,color=C.gold,rot=0}: {x?:number;y?:number;r?:number;color?:string;rot?:number})=>{
 const pts=Array.from({length:10},(_,i)=>{const a=(i*36-90)*Math.PI/180,rr=i%2?r*.46:r;return `${Math.cos(a)*rr},${Math.sin(a)*rr}`;}).join(' ');
 return <g transform={`translate(${x} ${y}) rotate(${rot})`}><polygon points={pts} fill={color}/><path d={`M0 ${-r}L0 ${r*.42}L${-r*.93} ${-r*.31}L${r*.58} ${r*.81}L0 0`} fill="none" stroke="#FFF3D0" strokeOpacity=".35" strokeWidth="1.2"/></g>;
};
export const Stars=({t,n=60,opacity=1,seed=1,top=0,bottom=630}:{t:number;n?:number;opacity?:number;seed?:number;top?:number;bottom?:number})=><g opacity={opacity}>{Array.from({length:n},(_,i)=>{const x=hash(i+seed*100)*1600,y=mix(top,bottom,hash(i*2.9+seed*80)),r=1.5+hash(i*4.7)*4;return <g key={i} opacity={.45+.3*Math.sin(t*1.2+i)}><Star x={x} y={y} r={r} color={C.cream}/></g>;})}</g>;
export const Mountains=({t,open=1,sun=true}:{t:number;open?:number;sun?:boolean})=><>
 <rect width="1600" height="900" fill="url(#sky)"/>
 {sun&&<><circle cx="1000" cy="310" r="370" fill="url(#sunGlow)"/><Paper><circle cx="1000" cy="310" r="165" fill="#F0C47B"/><circle cx="1000" cy="310" r="144" fill="#F5D49A"/><circle cx="1000" cy="310" r="119" fill="#F9E6B8"/></Paper></>}
 {['#9CB4AD','#7FA5A2','#5D9296','#386D7D','#275163','#183C50'].map((col,i)=>{const y=420+i*67,arrival=prog(t,.135+i*.75448,.135+i*.75448+.46),off=(1-arrival)*(6-i)*39;return <Paper key={i}><path d={`M-300 ${y+100}Q${130+i*30} ${y-270-off} ${480+i*47} ${y-32}Q${770+i*50} ${y+35} ${1120+i*25} ${y-145}Q1390 ${y-260+off} 1900 ${y+40}V1100H-300Z`} fill={col} transform={`translate(${Math.sin(t*.24+i)*6} ${off})`}/><path d={`M-300 ${y+107}Q${130+i*30} ${y-259-off} ${480+i*47} ${y-24}`} stroke="#E0E0BF" strokeWidth="2" opacity=".18" fill="none"/></Paper>;})}
 </>;
export const Leaf=({x,y,s=1,rot=0,color=C.rust}:{x:number;y:number;s?:number;rot?:number;color?:string})=><g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}><path d="M-2 22Q-39-8 0-42Q39-8 2 22Z" fill={color}/><path d="M0 27V-32M0 1L-12-10M0-10L12-21" stroke="#EAD6AD" strokeWidth="1.1" opacity=".5" fill="none"/></g>;
export const Bird=({x,y,s=1,t=0,color=C.paper}:{x:number;y:number;s?:number;t?:number;color?:string})=><g transform={`translate(${x} ${y}) scale(${s}) rotate(-8)`}>
 <Paper small><path d={`M0 0Q-27 ${-14-26*Math.sin(t*5)**2} -76 -30L-40 11L-6 15L-23 38L18 18L46-5L24-9L12-3L-2-27Z`} fill={color}/><path d="M-2-27L-6 15L24-9M-76-30L-6 15" fill="none" stroke={C.blue} strokeWidth="1.2" opacity=".4"/></Paper>
 </g>;
export const Plane=({x,y,s=1,rot=0}:{x:number;y:number;s?:number;rot?:number})=><g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}><Paper small><path d="M-90-25L82-7L-32 55L-25 8Z" fill={C.paper}/><path d="M-90-25L82-7L-25 8Z" fill="#FFECCA"/><path d="M-25 8L-32 55L-4 16L82-7Z" fill="#CFB58F"/></Paper></g>;
export const Envelope=({x,y,s=1,open=0}:{x:number;y:number;s?:number;open?:number})=><g transform={`translate(${x} ${y}) scale(${s})`}><Paper small><rect x="-95" y="-60" width="190" height="120" rx="3" fill={C.paper}/><path d="M-95-60L0 12L95-60" fill={open?C.cream:'#DDC9A7'}/><path d="M-95 60L-16-6L0 12L16-6L95 60" fill="#E6D6BA"/><Star x={0} y={15} r={17}/></Paper></g>;
export const Plant=({x,y,s=1,grow=1}:{x:number;y:number;s?:number;grow?:number})=><g transform={`translate(${x} ${y}) scale(${s})`}><Paper>
 <g transform={`translate(0 -60) scale(${.15+grow*.85})`}><path d="M0 10C-8-53 22-95-9-180" fill="none" stroke={C.teal} strokeWidth="7"/>
 {[-1,1,-1,1].map((dir,i)=><g key={i} transform={`translate(${i%2?6:-3} ${-30-i*35}) rotate(${dir*42})`}><path d="M0 0C-34-8-46-44-29-64C-5-60 11-27 0 0" fill={i%2?'#89AB91':'#507D78'}/><path d="M0 0L-23-53" stroke={C.mist} opacity=".5" fill="none"/></g>)}
 <Star y={-185} r={26} color={C.gold}/><circle cx="-4" cy="-184" r="9" fill={C.cream}/></g>
 <path d="M-70-70H70L48 20H-48Z" fill={C.rust}/><path d="M-68-68L-48 19H-34L-44-68" fill="#D58A68"/><rect x="-78" y="-78" width="156" height="19" rx="3" fill="#CE8267"/><path d="M-28-36H28M-18-26H18" stroke="#E5B999" strokeWidth="2" opacity=".5"/>
 </Paper></g>;
export type CharacterProps={x:number;y:number;s?:number;boy?:boolean;face?:'front'|'profile'|'back';flip?:boolean;t?:number;pose?:'idle'|'reach'|'hold'|'shy'|'walk'|'sit'|'wave';sad?:boolean};
// One consistent drawn model per character. Geometric paths never change randomly.
// Limbs rotate at explicit joints; hair, face and clothing keep fixed contours.
export const LegacyCharacter=({x,y,s=1,boy=false,face='front',flip=false,t=0,pose='idle',sad=false}:CharacterProps)=>{
 const walking=pose==='walk',seated=pose==='sit',breath=Math.sin(t*1.6)*.65;
 const armA=pose==='reach'?-65:pose==='wave'?-132:pose==='hold'?-38:pose==='shy'?24:walking?Math.sin(t*4)*14:6;
 const armB=pose==='hold'?42:walking?-Math.sin(t*4)*14:-8;
 const coat=boy?'#436575':'#F0DFBE',dark=boy?'#2A4B60':'#C5B69B',skirt='#B97C7F';
 const Arm=({side,angle}:{side:number;angle:number})=><g transform={`translate(${side*27} -218) rotate(${angle*side})`}>
  <path d={`M${-11} -2Q${side*16} 22 9 69L5 81H-8Q-18 43-17 7Z`} fill={coat}/>
  <path d="M-7 77Q-10 90-5 94L3 97L8 89L5 78Z" fill={C.skinL}/><path d="M-11 18L-6 71" fill="none" stroke={dark} strokeWidth="2" opacity=".8"/>
 </g>;
 return <g transform={`translate(${x} ${y}) scale(${s*(flip?-1:1)} ${s})`}>
  <ellipse cx="0" cy="1" rx={seated?61:42} ry="7" fill="#102B3B" opacity=".16"/>
  <g transform={`translate(0 ${breath+(walking?Math.sin(t*8)*1.5:0)})`}>
   {!boy&&<path d="M-32-282Q-65-255-45-223L-26-208L43-222Q62-259 33-287Z" fill={C.hair}/>}
   {[1,-1].map((side)=>seated?<g key={side}>
    <path d={`M${side*14-10}-132L${side*14+10}-132Q${side*27}-112 ${side*46}-110L${side*53}-28H${side*53-17}L${side*38}-96Q${side*11}-93 ${side*14-10}-112Z`} fill={boy?'#294354':'#B77F5E'}/>
    <path d={`M${side*53-17}-31H${side*53+2}L${side*53+17}-18Q${side*53+20}-10 ${side*53+7}-10H${side*53-20}Z`} fill={C.hair}/>
   </g>:<g key={side} transform={`translate(${side*14} -116) rotate(${walking?side*Math.sin(t*4)*17:side*2})`}><path d="M-10-10L11-10L10 94L3 108L-9 105Z" fill={boy?'#294354':'#B77F5E'}/>{!boy&&<path d="M-6-6L-5 88" stroke="#D9A883" strokeWidth="2" opacity=".7"/>}<path d="M-9 97L10 96L21 110Q26 117 16 118H-11Z" fill={C.hair}/>{boy&&<path d="M-5 4L0 94" fill="none" stroke="#4D6472" strokeWidth="1.5"/>}</g>)}
   <Arm side={-1} angle={armB}/>
   {!boy&&<Paper small><path d="M-25-214Q0-226 25-214L46-92Q17-79-46-92Z" fill={skirt}/><path d="M-12-208L-24-94M11-206L26-94M0-201V-88" stroke="#915D6A" strokeWidth="2" opacity=".6"/><path d="M-45-92Q0-80 44-92" stroke="#E2AFA3" strokeWidth="2" fill="none"/></Paper>}
   <Paper small><path d={boy?'M-28-235L27-235L36-126Q9-119-35-126L-32-197Z':'M-25-231Q0-239 25-231L32-176L24-158Q0-150-27-160L-32-194Z'} fill={coat}/><path d={boy?'M0-226L-3-128M-25-220L-12-202L0-225L12-202L25-220':'M-20-229Q0-208 20-229M-25-170Q0-162 25-170'} stroke={dark} strokeWidth="2" fill="none"/>{boy&&<><path d="M-9-229L-14-206L21-199L35-207L13-217L8-230" fill="#CE9A59"/><path d="M20-210L39-172L22-174L5-211" fill="#D9AC6D"/>{[-181,-153].map(yy=><circle key={yy} cx="4" cy={yy} r="2" fill={C.gold}/>)}</>}</Paper>
   <path d="M-10-254L-10-230Q0-217 13-232L11-257Z" fill={C.skin}/>
   <g transform={`rotate(${sad?10:Math.sin(t*.7)*1.1} 0 -270)`}>
    {face==='back'?<><path d="M-35-282Q-36-316-4-317Q34-318 37-285L29-247Q2-230-29-247Z" fill={C.hair}/>{!boy&&<path d="M-33-280Q-49-242-24-228L23-233L37-269Z" fill={C.hair}/>}</>:
    <><path d={face==='profile'?'M-24-295Q5-315 25-289L26-277L37-266L26-262Q24-239 7-240L-12-251L-28-273Z':'M-30-290Q-21-313 8-306Q36-301 31-272L27-258Q17-239 1-239Q-19-244-29-266Z'} fill={C.skinL}/>
     <path d={boy?'M-32-271L-39-292L-26-310L-12-308L0-320L17-314L32-312L38-296L32-278L24-290L12-288L-2-296L-11-279L-26-286L-25-267Z':'M-32-268Q-43-298-20-311Q-3-325 21-309Q46-296 34-267L23-280L15-294Q-5-276-25-278L-24-247L-37-238Q-47-256-32-268Z'} fill={C.hair}/>
     <path d={boy?'M-22-304L-3-310L14-303':'M-28-295Q-13-313 8-306'} stroke="#50606A" strokeWidth="2.2" opacity=".55" fill="none"/>
     {face==='front'?<><path d={sad?'M-15-268L-7-269M10-269L18-268':'M-16-271Q-11-274-6-271M10-272Q15-274 20-271'} stroke={C.hair} strokeWidth="1.6" fill="none" strokeLinecap="round"/>{!sad&&<><ellipse cx="-10" cy="-269" rx="1.5" ry="2" fill={C.hair}/><ellipse cx="16" cy="-269" rx="1.5" ry="2" fill={C.hair}/></>}<path d="M4-268L2-258L7-257" stroke="#C18A6E" strokeWidth="1.1" fill="none"/><path d={sad?'M-1-249Q4-251 9-249':'M-1-250Q5-246 11-251'} stroke="#9C5F59" strokeWidth="1.3" fill="none" strokeLinecap="round"/><ellipse cx="-17" cy="-257" rx="5" ry="2.3" fill="#D78F7A" opacity=".25"/></>:<><path d="M15-272L23-272" stroke={C.hair} strokeWidth="1.6"/><circle cx="21" cy="-270" r="1.4" fill={C.hair}/><path d="M24-250L29-251" stroke="#9C5F59" strokeWidth="1.3"/></>}
     {!boy&&<><path d="M-35-272L-46-231L-33-226L-25-265" fill={C.hair}/><path d="M-35-246L-40-230" stroke="#536269" strokeWidth="1.6"/><circle cx="-24" cy="-259" r="1.7" fill={C.gold}/></>}
    </>}
   </g>
   <Arm side={1} angle={armA}/>
   {pose==='hold'&&<Star x={79} y={-154} r={11}/>}
  </g>
 </g>;
};
export {Character} from './characters';
export const Dust=({t,n=35,seed=10,warm=true}:{t:number;n?:number;seed?:number;warm?:boolean})=><g>{Array.from({length:n},(_,i)=>{const x=hash(i+seed)*1600,y=hash(i*5+seed)*900-t*(2+hash(i)*8),r=1+hash(i*4)*3;return <circle key={i} cx={x+Math.sin(t*.4+i)*8} cy={((y%900)+900)%900} r={r} fill={warm?C.gold:C.mist} opacity={.14+hash(i*3)*.35}/>;})}</g>;
export const Clock=({x,y,r=140,t=0}:{x:number;y:number;r?:number;t?:number})=><g transform={`translate(${x} ${y})`}><Paper><circle r={r} fill={C.ink}/><circle r={r-9} fill="#C9C3AD"/><circle r={r-19} fill={C.paper}/>{Array.from({length:12},(_,i)=><path key={i} d={`M0 ${-r+27}V${-r+39}`} stroke={C.ink} strokeWidth="3" transform={`rotate(${i*30})`}/>)}<path d={`M0 ${-r*.5}V0L${r*.38} ${r*.16}`} stroke={C.ink} strokeWidth="7" fill="none" transform={`rotate(${t*8})`}/><circle r="8" fill={C.gold}/></Paper></g>;
