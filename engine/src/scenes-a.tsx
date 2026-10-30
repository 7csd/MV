import React from 'react';
import {C,Paper,Star,Stars,Mountains,Character,Leaf,Plant,Plane,Bird,Envelope,Clock,Dust} from './art';
import {BEAT,clamp,mix,smooth,prog,hash,pulse,easeOut} from './timing';
export type ShotProps={t:number;lt:number;p:number};
const foreLeaves=(t:number,n=12)=>Array.from({length:n},(_,i)=><Leaf key={i} x={hash(i*7)*1800-100+Math.sin(t*.4+i)*25} y={hash(i*4+8)*1100-100} s={.5+hash(i*3)*1.2} rot={i*55+t*8} color={i%2?C.rust:C.gold}/>);
export const Future=({t,lt,p}:ShotProps)=><>
 <g transform={`translate(${-p*16} ${-p*8}) scale(${1+p*.025})`}><Mountains t={t} open={prog(lt,0,3.9)}/>
 <Paper><path d="M630 1000Q660 820 842 682Q1018 585 1010 490Q1075 630 947 723Q790 838 887 1000Z" fill="#D9B584"/><path d="M692 1000Q704 834 879 703Q1037 586 1010 490Q1080 634 956 729Q808 855 925 1000Z" fill="#EAD5AA"/></Paper>
 <g opacity=".65">{Array.from({length:8},(_,i)=><path key={i} d={`M${940-i*20} ${560+i*30}l${20+i*3} 2`} stroke={C.cream} strokeWidth="2"/>)}</g>
 <Character x={806+p*26} y={754-p*18} s={.82} face="profile" pose="hold" t={t}/>
 <Paper><path d="M-100 810Q160 688 370 782L532 1000H-100Z" fill="#13374B"/><path d="M1150 960Q1290 699 1700 698V1000Z" fill="#17394A"/>
 {[-35,75,190,1370,1480,1590].map((x,i)=><g key={x} transform={`translate(${x} ${710+i%3*34}) rotate(${i%2?20:-15})`}><path d="M0 160Q-20 12 0-110Q27 10 0 160" fill={i%2?'#497D7B':'#315E65'}/><path d="M0 76Q-88 18-84-21Q-23-15 0 76M0 26Q59-46 81-37Q72 12 0 26" fill="#36696D"/></g>)}</Paper>
 <Stars t={t} n={40} opacity={.8*(1-prog(lt,2.77,5))}/><Dust t={t} n={24}/>
 </g>
 </>;
export const Reality=({t,lt,p}:ShotProps)=><>
 <rect width="1600" height="900" fill="#667E8A"/>
 <g transform={`translate(-100 ${-p*14}) rotate(-13 800 450)`}>
 {[0,1,2,3,4,5].map(i=><Paper key={i}><path d={`M${-180+i*310} 950V${360-i*60}h${95+i*8}v-100h${65+i*5}v${690+i*50}Z`} fill={['#8DA1A7','#8296A0','#708591','#526C7D','#3E5A6D','#29495D'][i]}/>{Array.from({length:5},(_,j)=><rect key={j} x={-150+i*310} y={410-i*60+j*65} width="12" height="25" fill="#B2B8AB" opacity=".5"/>)}</Paper>)}
 <Paper><path d="M-100 690H300V740H600V790H900V840H1200V890H1700V1080H-100Z" fill="#BBC2B5"/><path d="M-100 705H290V755H590V805H890V855H1190V905H1700V1080H-100Z" fill="#446373"/></Paper>
 <Character x={730} y={795} s={1.13} face="profile" t={t} sad pose="idle"/>
 </g>
 <g transform={`rotate(${Math.sin(lt*2.1)*12} 1220 -40)`}><path d="M1220-40V455" stroke={C.ink} strokeWidth="8"/><Clock x={1220} y={525} r={145} t={lt*3}/></g>
 <Paper><path d="M-80-50H1680V90Q1300 190 1030 120Q700 35 440 145Q180 230-80 160Z" fill="#2A4659"/></Paper>
 <Dust t={t} warm={false}/>
 </>;
export const Encounter=({t,lt,p}:ShotProps)=>{
 const meet=prog(lt,.2,2.4);
 return <><rect width="1600" height="900" fill="#D8BAA0"/><g transform={`rotate(-17 800 450)`}>
 <path d="M-200 200H1800V650H-200Z" fill="#DFCBB0"/><path d="M-200 220H1800M-200 625H1800" stroke="#F3DEC0" strokeWidth="5"/>
 {Array.from({length:9},(_,i)=><rect key={i} x={-180+i*250} y="220" width="70" height="405" fill="#BF9D89" opacity=".25"/>)}</g>
 <g opacity={1-meet*.65}>{Array.from({length:10},(_,i)=>{const side=i%2?1:-1,x=((i*217+lt*125*side+1800)%2000)-200;return <g key={i} opacity={.16+(i%3)*.09}><Character x={x} y={240+(i%3)*220} s={.7+(i%3)*.13} boy={i%2===0} face="back" pose="walk" t={t+i}/></g>;})}</g>
 <ellipse cx="800" cy="465" rx={260+meet*80} ry="260" fill="#F5DFC0" opacity={meet*.55}/>
 <g transform="translate(800 460) rotate(-14)"><Character x={mix(-340,-92,meet)} y={135} s={1.05} face="profile" pose="reach" t={t}/><Character x={mix(340,92,meet)} y={135} s={1.08} boy face="profile" flip pose="reach" t={t+.5}/><Star x={0} y={-92} r={10+meet*12}/></g>
 {foreLeaves(t,26)}<Dust t={t} n={18}/>
 </>;
};
export const Brave=({t,lt,p}:ShotProps)=>{
 const k=prog(lt,.2,1.6);return <><rect width="1600" height="900" fill="url(#night)"/>
 {[580,700,825].map((r,i)=><Paper key={r}><path d={`M800 ${510-r}A${r} ${r} 0 1 1 ${799.9} ${510-r}M800 ${510-r+50}A${r-50} ${r-50} 0 1 0 ${800.1} ${510-r+50}`} fill={['#496C7B','#304F65','#1C394F'][i]} fillRule="evenodd"/></Paper>)}
 {Array.from({length:65},(_,i)=>{const a=hash(i*9)*Math.PI*2,dist=(120+hash(i)*650)*mix(.3,1,k),x=800+Math.cos(a)*dist,y=470+Math.sin(a)*dist*.65;return <g key={i} opacity={clamp(k*2-hash(i)*.4)} transform={`rotate(${i*23} ${x} ${y})`}><Star x={x} y={y} r={2+hash(i*3)*9*k} color={i%3?C.gold:C.paper}/></g>;})}
 <Paper><path d="M-100 810Q400 700 800 745Q1190 715 1700 810V1000H-100Z" fill="#1A394A"/></Paper>
 <Character x={680} y={785} s={1.33} face="profile" pose="reach" t={t}/><Character x={940} y={785} s={1.37} boy flip face="profile" pose="reach" t={t}/>
 <circle cx="805" cy="503" r={90} fill="url(#sunGlow)"/><Star x={805} y={503} r={15+5*pulse(t,2)}/>
 </>;
};
export const Dream=({t,lt,p}:ShotProps)=><>
 <rect width="1600" height="900" fill="#D4D9C1"/>
 <Paper><path d="M900-100H1700V700H900Z" fill="#A8BDB1"/><path d="M950-10H1490V592H950Z" fill="#F2DDAE"/><path d="M1015 0V590M1210 0V590M1400 0V590M950 256H1490" stroke="#BDD0B7" strokeWidth="15"/></Paper>
 <path d="M1015 256L530 900H850L1210 256Z" fill="#FAE8B9" opacity=".3"/>
 <Paper><path d="M-100 687L1370 640L1700 900H-100Z" fill="#B27B5F"/><path d="M-100 703L1370 657L1700 920H-100Z" fill="#9A684F"/></Paper>
 <ellipse cx="815" cy="762" rx="240" ry="35" fill="#6C5140" opacity=".2"/>
 <Plant x={800} y={727} s={1.8} grow={prog(lt,.1,2.1)}/>
 <g transform={`translate(${1220-lt*15} ${397+Math.sin(t)*6}) rotate(-28)`}><Paper><path d="M-94-36H25Q68-40 70-2Q63 42 27 32H-95Z" fill={C.blue}/><path d="M-88-29L-147-63L-166-49L-88 3Z" fill={C.teal}/><path d="M25-28Q83-48 91-1Q78 47 29 23" fill="none" stroke={C.blue} strokeWidth="11"/><path d="M-85-24H24" stroke={C.mist} strokeWidth="3" opacity=".5"/></Paper></g>
 {Array.from({length:7},(_,i)=>{const yy=((lt*180+i*44)%280);return <path key={i} d={`M${1040-yy*.74} ${420+yy}q-9 10 0 16q9-6 0-16`} fill="#8BAFAA" opacity=".7"/>;})}
 <Leaf x={140} y={810} s={2.2} color={C.gold} rot={-60}/><Dust t={t} n={18}/>
 </>;
export const Days=({t,lt,p}:ShotProps)=>{
 const offset=easeOut(p)*1740;return <>
 <rect width="1600" height="900" fill="url(#dusk)"/>
 <circle cx={1280-p*230} cy={mix(220,610,p)} r="145" fill="#F2CB94"/>
 <g transform={`translate(${-offset*.22} 0)`}>{Array.from({length:12},(_,i)=><Paper key={i}><path d={`M${i*280-200} 680V${430+(i%3)*40}l72-55 75 55v250Z`} fill={i%2?'#956F80':'#AA7C86'}/><path d={`M${i*280-160} 530h24v47h-24Z`} fill="#E8C7A3"/></Paper>)}</g>
 <g transform={`translate(${-offset} 0)`}>
 <Paper><path d="M-300 710Q500 580 1000 710Q1550 770 2240 670Q2900 570 3700 730V1100H-300Z" fill="#475D6A"/><path d="M-300 765Q600 650 1300 780Q2000 835 2500 740Q3200 660 3700 765V1100H-300Z" fill="#304958"/></Paper>
 <g transform="translate(540 690)"><circle cx="-86" cy="-8" r="60" fill="none" stroke={C.paper} strokeWidth="5"/><circle cx="86" cy="-8" r="60" fill="none" stroke={C.paper} strokeWidth="5"/><path d="M-86-8L-33-86L25-8L-86-8M25-8L65-101L86-8M-33-86H52" stroke={C.rust} strokeWidth="7" fill="none"/><Character x={-12} y={6} s={.73} boy pose="sit" face="profile" t={t}/><Character x={-122} y={3} s={.7} pose="sit" face="profile" t={t}/></g>
 <g transform="translate(1390 745)"><Paper><path d="M-180-113H160V-95H-180Z" fill="#B79674"/><path d="M-160-95V15M139-95V15" stroke="#8E715B" strokeWidth="13"/></Paper><Character x={-55} y={-12} s={.78} pose="sit" t={t}/><Character x={45} y={-12} s={.8} boy pose="sit" t={t}/><path d="M-70-220Q-20-265 60-220" fill="none" stroke={C.gold} strokeWidth="4"/></g>
 <g transform="translate(2240 760)"><Character x={-95} y={0} s={.87} pose="walk" face="profile" t={t}/><Character x={45} y={0} s={.9} boy pose="reach" face="profile" t={t}/><Plane x={230+Math.sin(t)*20} y={-310} s={.72} rot={-18}/></g>
 </g>
 <Paper><path d="M-100 835Q620 785 1700 830V1000H-100Z" fill="#203C4B"/></Paper>
 {foreLeaves(t,9)}
 </>;
};
const Stamp=({x,y,type=0,s=1,angle=0}:{x:number;y:number;type?:number;s?:number;angle?:number})=><g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}><Paper small><path d="M-76-101H76V101H-76Z" fill={C.cream}/>{Array.from({length:9},(_,i)=><g key={i}><circle cx="-76" cy={-92+i*23} r="4" fill="#B2A18C"/><circle cx="76" cy={-92+i*23} r="4" fill="#B2A18C"/></g>)}<rect x="-63" y="-87" width="126" height="172" fill={[C.blue,C.rose,C.teal,C.gold][type%4]}/>
 {type%4===0?<><circle cy="-25" r="32" fill={C.paper}/><path d="M-45 70L-30 0H30L45 70Z" fill={C.ink}/><path d="M-14-25Q0-12 14-25" stroke={C.ink} strokeWidth="3" fill="none"/></>:type%4===1?<><path d="M-35-18Q-45-45-15-35Q0-55 20-34Q55-31 37-9H-34Z" fill={C.paper}/><path d="M-40 55L0 5L40 55Z" fill={C.gold}/></>:type%4===2?<><rect x="-45" y="-35" width="90" height="65" rx="5" fill={C.paper}/><circle r="25" fill={C.ink}/><circle r="15" fill={C.blue}/><rect x="-30" y="-44" width="29" height="13" fill={C.paper}/></>:<><Star r={49} color={C.paper}/><path d="M-38 64H38" stroke={C.cream} strokeWidth="2"/></>}
 </Paper></g>;
export const Philately=({t,lt,p}:ShotProps)=><>
 <rect width="1600" height="900" fill="#7B7166"/>
 <g transform={`translate(800 440) rotate(${-8+p*3}) scale(${1+p*.04})`}>
 <Paper><rect x="-625" y="-335" width="1250" height="680" rx="10" fill="#7A494B"/><path d="M-600-310H-8V320H-600ZM8-310H600V320H8Z" fill="#E9DDC3"/><path d="M-8-310Q-33 5-8 320H8Q33 5 8-310" fill="#C6B59D"/>
 {Array.from({length:7},(_,i)=><path key={i} d={`M-570 ${-260+i*85}H-44M44 ${-260+i*85}H570`} stroke="#C2AF92" opacity=".3"/>)}</Paper>
 {[-420,-180,175,410].map((x,i)=><g key={i} opacity={prog(lt,i*.27,i*.27+.25)}><Stamp x={x} y={i%2?120:-110} type={i} s={1.1} angle={i%2?5:-5}/></g>)}
 {[0,1,2].map(i=><g key={i} opacity={prog(lt,.5+i*.75,.57+i*.75)}><circle cx={[-360,200,435][i]} cy={[-30,-40,205][i]} r="53" stroke="#344E5D" strokeWidth="3" fill="none" opacity=".8"/><path d={`M${[-420,140,375][i]} ${[0,-10,235][i]}l160-28m-156 40l160-28`} stroke="#344E5D" strokeWidth="2" opacity=".7"/></g>)}
 </g><Leaf x={70} y={680} s={2.3} rot={-33}/><Envelope x={1500} y={190} s={1.4}/>
 </>;
export const Monsters=({t,lt,p}:ShotProps)=>{
 const light=prog(lt,.75,1.25);return <>
 <rect width="1600" height="900" fill="url(#night)"/>
 {[0,1,2,3,4].map(i=><Paper key={i}><path d={`M-200 ${-100-i*40}H1800V1100H-200ZM800 ${60+i*44}C${1390-i*70} ${-50+i*50} ${1550-i*70} ${700-i*40} 800 ${890-i*43}C${150+i*70} ${800-i*40} ${160+i*65} ${20+i*50} 800 ${60+i*44}Z`} fill={['#536775','#41596B','#35485E','#293E55','#1D3045'][i]} fillRule="evenodd"/></Paper>)}
 <g opacity={1-light*.92} transform={`translate(820 460) scale(${1+p*.15})`}><path d="M-280 200L-240-70L-170-210L-95-155L0-260L80-150L170-210L260-100L290 200Z" fill="#121F31"/><path d="M-130-60L-40-44L-75-10ZM125-60L40-44L75-10Z" fill={C.gold}/><path d="M-65 70L-35 91L0 63L35 92L65 70" stroke={C.rose} strokeWidth="5" fill="none"/></g>
 <g opacity={light}><ellipse cx="820" cy="490" rx="375" ry="320" fill="url(#sunGlow)"/><Paper><path d="M650 710Q700 450 890 400Q1010 590 930 735Z" fill="#476C6D"/><ellipse cx="850" cy="530" rx="48" ry="65" fill={C.rust}/><path d="M850 474V591M806 514L780 492M802 543L770 543M898 514L923 493M901 543L933 544" fill="none" stroke={C.ink} strokeWidth="6"/><circle cx="835" cy="485" r="3" fill={C.gold}/><circle cx="867" cy="485" r="3" fill={C.gold}/></Paper></g>
 <Character x={620} y={795} s={.9} pose="reach" face="profile" t={t}/><Character x={485} y={810} s={.93} boy face="profile" t={t}/>
 <Paper small><rect x="650" y="586" width="48" height="75" rx="12" fill={C.gold}/><path d="M658 590Q655 560 675 560Q695 561 690 590" stroke={C.paper} strokeWidth="3" fill="none"/><path d="M662 600V646M683 600V646" stroke={C.cream} strokeWidth="3"/></Paper>
 </>;
};
export const Daydream=({t,lt,p}:ShotProps)=><>
 <rect width="1600" height="900" fill="#C2C4AD"/>
 <Paper><path d="M660-100H1500V700H660Z" fill="#708C8D"/><path d="M690-60H1470V660H690Z" fill="#DFCAAC"/><path d="M720-60H1440V630H720Z" fill="#A9B8AE"/><circle cx="1220" cy="170" r="89" fill="#F0DBAB"/><path d="M720 430Q1000 290 1440 430V630H720Z" fill="#79958D"/><path d="M720 520Q1000 340 1440 530V630H720Z" fill="#526E6C"/><path d="M1060-60V650M690 330H1470" stroke="#D4C3A2" strokeWidth="17"/></Paper>
 <Paper><path d="M-100 720L1600 665V900H-100Z" fill="#9C7961"/><path d="M-100 738L1600 683" stroke="#B99673" strokeWidth="9"/></Paper>
 <Paper><path d="M987 541H1198V559H987Z" fill="#735C50"/><path d="M1000 559V740M1183 559V740M992 545V438" fill="none" stroke="#735C50" strokeWidth="13"/></Paper>
 <Character x={1090} y={757} s={1.62} boy pose="sit" face="profile" t={t}/>
 <Character x={182} y={835} s={1.15} face="profile" t={t} pose="shy"/>
 <Paper small><path d="M720 668H825L814 735H733Z" fill={C.paper}/><path d="M825 680Q874 675 856 708Q843 722 820 713" fill="none" stroke={C.paper} strokeWidth="9"/></Paper>
 {[0,1,2].map(i=><path key={i} d={`M${750+i*23} 650Q${730+i*23} 610 ${761+i*23} 574Q${785+i*23} 542 ${758+i*23} 510`} fill="none" stroke="#F0E3C7" strokeWidth={7-i} strokeLinecap="round" opacity={.2+.15*Math.sin(lt+i)**2}/>) }
 <Bird x={mix(950,570,p)} y={mix(625,310,easeOut(p))} s={.45} t={t}/>
 <Dust t={t} n={15}/>
 </>;
export const Childhood=({t,lt,p}:ShotProps)=><>
 <rect width="1600" height="900" fill="#EAD3AB"/>
 <g transform={`translate(800 440) rotate(${lt*4})`}>{Array.from({length:16},(_,i)=><path key={i} d="M0 0L-140-1000H140Z" fill={i%2?'#E2BB91':'#EDDBB7'} transform={`rotate(${i*22.5})`}/>)}</g>
 <Paper><path d="M-100 720Q800 610 1700 720V1000H-100Z" fill="#9BAD92"/><path d="M-100 820Q800 685 1700 810V1000H-100Z" fill="#738B78"/></Paper>
 <g transform={`translate(${600+p*220} 760) scale(.73)`}><Character x={0} y={0} s={1.05} boy face="profile" t={t*1.8} pose="walk"/><g transform="translate(0 -182) scale(1.2) translate(0 182)"/></g>
 <Plane x={1050+Math.sin(t*1.2)*150} y={220+Math.sin(t*2)*50} s={.8} rot={-12}/>
 <g transform={`translate(330 445) rotate(${lt*115})`}><path d="M0 0L-76-100L0-91Z" fill={C.rust}/><path d="M0 0L100-76L91 0Z" fill={C.blue}/><path d="M0 0L76 100L0 91Z" fill={C.gold}/><path d="M0 0L-100 76L-91 0Z" fill={C.teal}/><circle r="9" fill={C.paper}/></g><path d="M330 449V744" stroke="#B98C60" strokeWidth="7"/>
 <ellipse cx="810" cy="774" rx="145" ry="18" fill="#B9CDC0" opacity=".8"/>{[0,1,2].map(i=><ellipse key={i} cx="810" cy="775" rx={70+i*28+(lt*60%25)} ry={8+i*5} fill="none" stroke={C.mist} opacity=".6"/>)}
 <Character x={1300} y={785} s={1.05} t={t} pose="idle"/>
 {foreLeaves(t,9)}
 </>;
