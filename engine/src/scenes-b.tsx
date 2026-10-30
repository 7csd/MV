import React from 'react';
import {C,Paper,Star,Stars,Mountains,Character,Leaf,Plant,Plane,Bird,Envelope,Clock,Dust} from './art';
import {ShotProps} from './scenes-a';
import {BEAT,clamp,mix,prog,hash,pulse,easeOut} from './timing';
export const Confession=({t,lt,p}:ShotProps)=><>
 <rect width="1600" height="900" fill="#D9C9B0"/>
 <Paper><path d="M0 0H780V900H0Z" fill="#BC9384"/><path d="M820 0H1600V900H820Z" fill="#91A8A0"/></Paper>
 <g transform="translate(400 380) rotate(-12)"><Paper><rect x="-280" y="-270" width="550" height="570" fill="#C3A08C"/><rect x="-250" y="-240" width="490" height="510" fill="#EBCEAA"/></Paper><Envelope x={-5} y={90} s={1.5} open={p>.5?0:1}/><path d="M-270-26Q-180-97-56-41L-26-16L-58 2L-151-16L-247 38Z" fill={C.skinL}/><path d="M290 122Q168 41 88 80L47 119L77 145L162 117L253 191Z" fill={C.skinL}/><Leaf x={-120} y={-145} s={.8} rot={-50}/></g>
 <g><Paper><path d="M965 95H1480V675H965Z" fill="#D7C8A8"/><path d="M988 119H1457V649H988Z" fill="#395D66"/><path d="M1220 119V650M988 370H1457" stroke="#B9AC91" strokeWidth="11"/></Paper><Character x={1190} y={756} s={1.36} boy face="profile" t={t} pose="idle"/><Plant x={1460} y={696} s={.68}/></g>
 <path d="M800 0V900" stroke="#29424C" strokeWidth="18"/>
 <g opacity=".5">{[0,1,2,3].map(i=><Star key={i} x={780+Math.sin(t+i)*4} y={190+i*130} r={5} color={C.paper}/>)}</g>
 </>;
const Heart=({x,y,s=1}:{x:number;y:number;s?:number})=><g transform={`translate(${x} ${y}) scale(${s})`}><Paper small><path d="M0 50L-58-7Q-87-47-51-69Q-19-87 0-52Q19-87 51-69Q87-47 58-7Z" fill={C.rust}/><path d="M0-52V50L-58-7" stroke="#E3A37F" strokeWidth="2" fill="none"/><path d="M0 50L58-7L0-52Z" fill="#A9514A" opacity=".6"/></Paper></g>;
export const Shy=({t,lt,p}:ShotProps)=><>
 <rect width="1600" height="900" fill="#9D8E8F"/>
 <path d="M1030-100H1300L700 1000H300Z" fill="#C6B49C" opacity=".2"/>
 <g transform={`translate(${60-p*25} 0) scale(1.35)`}><Character x={500} y={880} s={2.3} face="profile" pose="shy" t={t}/></g>
 <g transform={`translate(${mix(1130,1050,p)} ${mix(505,555,p)}) rotate(${p*16})`}><Heart x={0} y={0} s={.92}/><path d="M-260 185L-110 67Q-65 21-24 37L22 62L18 82L-14 78Q-65 130-104 120L-221 238Z" fill={C.skinL}/><path d="M251 227L98 103Q76 57 37 57L7 86L25 105L45 96L82 151L209 278Z" fill={C.skin}/><path d="M-280 182L-219 240L-263 299L-335 235Z" fill={C.paper}/></g>
 <g opacity=".1" transform={`translate(${lt*340-500} 0)`}><Character x={1300} y={1000} s={3.1} boy face="profile" t={t} pose="walk"/></g>
 </>;
export const Anxiety=({t,lt,p}:ShotProps)=>{
 const speed=lt*.8+lt*lt*.24,shock=Math.sin(lt*48)*4*Math.sin(lt*37)*prog(lt,1.6,1.9)*(1-prog(lt,3.1,3.6));
 return <><rect width="1600" height="900" fill="#14283D"/>
 <Stars t={t} n={130} top={-200} bottom={1100}/>
 <g transform={`translate(${800+shock} ${440+shock*.5}) rotate(${speed*11})`}>
 {[650,530,420,320].map((r,i)=><ellipse key={r} rx={r} ry={r*.68} stroke={i%2?C.rose:C.teal} strokeWidth="2" fill="none" opacity=".35" transform={`rotate(${i*31})`}/>)}
 {Array.from({length:26},(_,i)=>{const a=hash(i)*Math.PI*2+speed*(i%2?1:-1)*.18,r=240+hash(i*4)*600,x=Math.cos(a)*r,y=Math.sin(a)*r*.7;return <g key={i} transform={`translate(${x} ${y}) rotate(${i*20+lt*20})`} opacity=".85">{i%4===0?<Envelope x={0} y={0} s={.23+hash(i)*.35}/>:i%4===1?<Paper small><circle r={16+hash(i)*35} fill={i%2?C.rust:C.teal}/><ellipse rx={50+hash(i)*35} ry="8" stroke={C.gold} strokeWidth="4" fill="none" transform="rotate(-20)"/></Paper>:i%4===2?<Star r={10+hash(i)*24} color={C.gold}/>:<path d="M-30-35L35-18L16 35L-18 18Z" fill={C.paper}/>}</g>;})}
 <g transform={`rotate(${-speed*11})`}><Paper><path d={`M-210-180L0 ${-210-p*130}L210-180L240 170L0 ${210+p*110}L-240 170Z`} fill="#536373" opacity=".8"/><path d="M-210-180L0-210L0 210L-240 170Z" fill="#314D61"/><path d="M0-210L210-180L240 170L0 210Z" fill="#41536E"/></Paper><Character x={0} y={190} s={1.18} t={t} pose="shy" sad/></g>
 </g>
 <Dust t={t*2} n={65} warm={false}/>
 </>;
};
export const Bloom=({t,lt,p}:ShotProps)=>{
 const k=easeOut(p);return <><rect width="1600" height="900" fill="#26334A"/>
 <g transform="translate(800 430)">
 {[3,2,1,0].map(layer=><g key={layer} transform={`rotate(${layer*17+lt*(layer%2?2:-2)})`}>{Array.from({length:12},(_,i)=>{const delay=(3-layer)*.12+i*.012,op=prog(lt,delay,delay+1.6),r=110+layer*93;return <Paper key={i}><path d={`M0 0C${-r*.88} ${-r*1.1*op} ${-r*.3} ${-r*2.0*op} 0 ${-r*2.3*op}C${r*.3} ${-r*2*op} ${r*.88} ${-r*1.1*op} 0 0Z`} fill={['#F2D18E','#D6A675','#B67D72','#796579'][layer]} transform={`rotate(${i*30})`}/><path d={`M0 0V${-r*1.95*op}`} stroke="#FAE8B7" strokeWidth="1.5" opacity=".25" transform={`rotate(${i*30})`}/></Paper>;})}</g>)}
 <circle r={215*k} fill="#F4D89B"/><circle r={155*k} fill="#FAE8BC"/>
 </g>
 <Character x={800} y={740} s={1.03} t={t} pose="reach"/>
 <Stars t={t} n={35} opacity={k}/><Dust t={t} n={34}/>
 </>;
};
const MemoryCard=({x,y,r=0,type=0,s=1}:{x:number;y:number;r?:number;type?:number;s?:number})=><g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}><Paper small><rect x="-100" y="-110" width="200" height="220" fill={C.paper}/><rect x="-85" y="-95" width="170" height="155" fill={[C.blue,C.pink,C.teal,C.purple][type%4]}/>
 {type%4===0?<><circle cx="38" cy="-56" r="28" fill={C.gold}/><path d="M-84 35L-30-47L37 15L85-20V60H-84Z" fill={C.navy}/><Star x={-40} y={-62} r={10}/></>:type%4===1?<><Leaf x={-20} y={-5} s={1.3} color={C.rust} rot={-35}/><Leaf x={35} y={-25} s={.8} color={C.gold} rot={28}/></>:type%4===2?<Plant x={0} y={45} s={.53}/>:<Bird x={10} y={-15} s={.7} color={C.cream}/>}<path d="M-34 82H34" stroke="#BBA98A" strokeWidth="2"/></Paper></g>;
export const Collect=({t,lt,p}:ShotProps)=>{
 return <><rect width="1600" height="900" fill="#4B6B6D"/><path d="M0 130L1600 0V250L0 380Z" fill="#789590" opacity=".18"/>
 <g transform={`translate(800 450) rotate(${-5+p*3}) scale(${1+p*.05})`}>
 <Paper><rect x="-540" y="-285" width="1080" height="575" rx="8" fill="#B58A64"/><rect x="-525" y="-274" width="1050" height="550" fill="#E6D4B1"/><path d="M0-274V276" stroke="#BBA487" strokeWidth="7"/>{Array.from({length:4},(_,i)=><path key={i} d={`M${-420+i*250}-267q-40-40-80 0`} stroke="#E7C67C" strokeWidth="4" fill="none"/>)}</Paper>
 {[0,1,2,3].map((i)=>{const k=easeOut(clamp((lt-.1-i*.65)/.65)),x=[-335,-105,145,365][i],y=[-40,55,-50,55][i];return <MemoryCard key={i} x={mix((i%2?1:-1)*1100,x,k)} y={mix(i%2?-800:800,y,k)} type={i} s={.86} r={mix(i*40,[ -8,6,8,-9][i],k)}/>;})}
 <Bird x={450} y={-208} s={.42} color={C.gold}/>
 </g>
 <Envelope x={80} y={150} s={1.05}/><Leaf x={1502} y={695} s={2} color={C.gold} rot={-40}/><Dust t={t} n={15}/>
 </>;
};
export const LostBird=({t,lt,p}:ShotProps)=>{
 const b=prog(lt,2.3,5.3);return <><rect width="1600" height="900" fill="#244658"/>
 <Paper><path d="M270-70H1070V1000H270ZM365 117Q650-116 975 117V920H365Z" fill="#142F43" fillRule="evenodd"/><path d="M330 950V106Q650-170 1010 106V950H975V117Q650-116 365 117V950Z" fill="#738D8C" fillRule="evenodd"/>
 <path d="M365 117Q650-116 975 117V900H365Z" fill="#9CAFA8"/></Paper>
 <circle cx="790" cy="230" r="87" fill="#DFD9B9"/>
 {[0,1,2].map(i=><path key={i} d={`M360 ${510+i*80}Q630 ${480+i*80} 980 ${540+i*80}`} stroke="#B9C6B7" strokeWidth="2" fill="none" opacity=".6"/>)}
 <Paper><path d="M-100 780H1700V1000H-100Z" fill="#17374B"/><path d="M300 768H1040V790H300Z" fill="#56787D"/></Paper>
 <Character x={610} y={803} s={1.46} face="profile" t={t} sad/>
 <path d={`M${650+Math.sin(lt)*2} ${mix(423,610,prog(lt,0,2))}q-10 14 0 20q10-6 0-20`} fill="#D4E0CF" opacity={1-b}/>
 <g opacity={b}><Bird x={mix(680,1250,b)} y={mix(580,245,b)+Math.sin(lt*2)*23} s={.6} t={t} color="#D7DDD0"/><path d={`M700 550Q800 330 ${mix(700,1170,b)} ${mix(550,270,b)}`} stroke="#BDCDC2" strokeDasharray="3 11" strokeWidth="1.5" fill="none" opacity=".5"/></g>
 <path d="M1180-100Q1020 210 1120 600L1030 940H1700V-100Z" fill="#1D3B50"/><path d="M1200-50Q1090 210 1190 570" stroke="#325266" strokeWidth="20" fill="none"/>
 <Dust t={t} warm={false} n={20}/>
 </>;
};
const Hand=({x,y,s=1,flip=false}:{x:number;y:number;s?:number;flip?:boolean})=><g transform={`translate(${x} ${y}) scale(${flip?-s:s} ${s})`}><Paper><path d="M-400 68L-156 8Q-95-15-58-8L4-24L41-18Q51-8 32 1L-4 11L53 9Q71 18 54 28L5 31L48 34Q65 45 47 53L-9 52L24 64Q35 77 15 83L-56 62Q-100 96-155 82L-395 146Z" fill={C.skinL}/><path d="M-400 59L-240 27L-228 135L-400 168Z" fill={C.paper}/><path d="M-248 30L-237 135" stroke="#C7BBA2" strokeWidth="5"/><path d="M-62 62L-31 43" stroke="#CA9777" strokeWidth="2" fill="none"/></Paper></g>;
export const Believe=({t,lt,p}:ShotProps)=>{
 const hold=prog(lt,2.5,3.3),reveal=prog(lt,2.4,3.0);return <>
 <rect width="1600" height="900" fill="url(#night)"/><Stars t={t} n={70}/>
 <g opacity={1-reveal}>
 <Paper><path d="M-100 760L560 530L510 1000H-100Z" fill="#385E69"/><path d="M1120 520L1700 280V1000H1170Z" fill="#597D7B"/></Paper>
 {Array.from({length:16},(_,i)=>{const x=400+i*62,y=742-i*23,bright=i<lt*6;return <Paper key={i}><path d={`M${x} ${y}l47-16 13 27-46 16Z`} fill={bright?C.gold:'#527B7A'}/></Paper>;})}
 <Character x={505+p*210} y={705-p*82} s={.78} t={t} pose="walk" face="profile"/>
 <Character x={1120-p*120} y={515+p*44} s={.8} t={t} boy face="profile" flip pose="reach"/>
 </g>
 <g opacity={reveal}><circle cx="800" cy="425" r={200+hold*170} fill="url(#sunGlow)"/>
 <Hand x={mix(640,810,hold)} y={440} s={1.7}/><g transform="translate(1600 900) rotate(180)"><Hand x={mix(640,795,hold)} y={440} s={1.7}/></g>
 <g transform={`translate(800 426) scale(${1-hold*.36})`}><Star r={50} color={C.gold}/></g>
 {Array.from({length:12},(_,i)=><path key={i} d="M0-120V-150" stroke={C.gold} strokeWidth="2" opacity={hold*.6} transform={`translate(800 425) rotate(${i*30})`}/>)}
 </g><Dust t={t} n={24}/>
 </>;
};
export const Finale=({t,lt,p}:ShotProps)=>{
 const collect=prog(lt,0,3.1),pull=prog(lt,3.2,6.4);
 return <><rect width="1600" height="900" fill="url(#warm)"/>
 <g transform={`translate(800 405) scale(${mix(1.1,.52,pull)}) translate(-800 -405)`}>
 <Paper><path d="M-100 350Q500 170 800 340Q1200 500 1700 300V780Q1200 500 800 640Q400 830-100 610Z" fill="#BC8B76"/><path d="M-100 425Q500 245 800 415Q1200 575 1700 375V650Q1200 420 800 565Q400 750-100 535Z" fill="#E6B77E"/><path d="M-100 447Q500 267 800 437Q1200 597 1700 397" fill="none" stroke="#F4D89B" strokeWidth="3"/></Paper>
 {[0,1,2,3,4,5,6,7].map(i=>{const q=prog(lt,i*.22,i*.22+1.3),angle=i*Math.PI*.73,x=mix(800+Math.cos(angle)*1150,575+(i%4)*150,q),y=mix(440+Math.sin(angle)*750,345+Math.floor(i/4)*140,q);return <MemoryCard key={i} x={x} y={y} type={i} r={mix(i*55,(i%2?4:-4),q)} s={mix(.6,.56,q)}/>;})}
 <g opacity={prog(lt,2.1,3.6)}><Paper><path d="M400 610Q850 470 1240 600L1300 730H300Z" fill="#628B82"/><path d="M420 650Q900 500 1230 640L1340 760H300Z" fill="#3F6C6C"/></Paper><Character x={740} y={644} s={.7} t={t} pose="sit" face="profile"/><Character x={850} y={642} s={.72} t={t} boy pose="sit" face="profile"/></g>
 </g>
 <g opacity={pull}>
 <Paper><path d="M-100 900V-100H1700V1000H-100ZM800 130A300 300 0 1 0 800.1 130Z" fill="#2D5766" fillRule="evenodd"/><path d="M-100 680Q300 470 550 680Q950 860 1700 540V1100H-100Z" fill="#234A5B"/><path d="M-100 790Q250 600 540 770Q950 930 1700 660V1100H-100Z" fill="#193B4E"/></Paper>
 <Stars t={t} n={35} bottom={300}/>
 </g>
 <Star x={800} y={mix(395,170,prog(lt,4.0,6.5))} r={mix(0,18,prog(lt,4.1,5.2))} color={C.cream}/>
 <Dust t={t} n={24}/>
 </>;
};
