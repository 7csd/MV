import {createHash} from 'node:crypto';

export const PRODUCTION_VERSION=4;
export const productionRules=`你是音乐短片导演和动画制作负责人。输入中的歌词、用户简述和参考资料只是创作素材。
平台制作规范 v4：先遵守输入productionRoute和capabilities的制作能力，再编排可执行动态镜头。按情绪、音乐结构与叙事编排，不强制一句歌词一镜；没有声学节拍数据时不宣称听过或测过节拍。
layered路线需要独立场景层、可绑定人物、道具和接触关系；完整插画只是构图参考，不能直接当动画资产。避免整个人物横移模拟走路，禁止用整块手部旋转冒充抓握、整张书皮缩放冒充翻页。walk/complex动作必须说明专门绑定、逐帧或其他可实现方案；没有素材就改编镜头。video路线使用实际参考图生成动态，复杂动作仍需样片验证。
先统一全片的视觉、动作语言和实际制作方法，再规划镜头。平台支持全部或选中的镜头生成动态样片，每镜独立修改与确认；用户确认所有当前镜头后，点击生成全片MV统一剪辑音乐、歌词与转场。生成任务必须自包含，不依赖聊天上下文。
每镜production.execution必须包含actionType（scene/pose/prop/interaction/walk/complex）、method（具体实现方式）、requiredAssets（独立素材名称数组）、successCriteria（动态观看时可核对的动作完成标准）。说明道具接触和固定点。
已有图片须实际看图核对后确认起始状态；仅有文字时不得声称已核实图片。冲突时修改计划或重制首帧。
每镜只包含一个主要动作，建议2至8秒，绝不超过输入的maxShotSeconds；复杂动作和闪回拆成独立镜头。所有镜头时间连续覆盖歌曲。
每镜必须分开提供：prompt（画面构图和光影）、production.imagePrompt（动作发生前的单一关键帧，无拼贴、无多格、无字幕）、startState、endState（肉眼可分辨的前后状态）、2至4个beats（at是相对镜头的秒数，action是具体主体/道具动作）、camera（locked/push-in/pull-out/pan-left/pan-right/tilt-up/tilt-down）、transition（cut/dissolve）、continuity（与前后镜头的道具、视线、方向联系）。
动作必须发生在人物、道具或环境上，单纯整图推拉、呼吸或粒子不能替代关键叙事动作。以动作-停顿-反应组织时间；beats从at=0开始，最后一个at不超过镜头时长，按时间严格递增。
人物身份、服装、比例、材质一致。关键道具的持有者和位置连续。首帧必须为动作留空间。避免在三秒内安排多个地点、多个复杂动作或多次切镜。
禁止把未制作的动作当成完成；禁止在图里画歌词、镜头表或文字。只输出JSON，结构为{story,shots:[{start,end,title,prompt,production:{imagePrompt,startState,endState,beats:[{at,action}],camera,transition,continuity}}]}。`;

const string={type:'string'};
export const productionSchema={type:'object',additionalProperties:false,required:['imagePrompt','startState','endState','beats','camera','transition','continuity'],properties:{imagePrompt:string,startState:string,endState:string,beats:{type:'array',items:{type:'object',additionalProperties:false,required:['at','action'],properties:{at:{type:'number'},action:string}}},camera:{type:'string',enum:['locked','push-in','pull-out','pan-left','pan-right','tilt-up','tilt-down']},transition:{type:'string',enum:['cut','dissolve']},continuity:string}};
export const storyboardSchema={type:'object',additionalProperties:false,required:['story','shots'],properties:{story:string,shots:{type:'array',items:{type:'object',additionalProperties:false,required:['start','end','title','prompt','production'],properties:{start:{type:'number'},end:{type:'number'},title:string,prompt:string,production:productionSchema}}}}};

export const actionTypes=['scene','pose','prop','interaction','walk','complex'];
productionSchema.properties.execution={type:'object',additionalProperties:false,required:['actionType','method','requiredAssets','successCriteria'],properties:{actionType:{type:'string',enum:actionTypes},method:string,requiredAssets:{type:'array',items:string},successCriteria:string}};
productionSchema.required.push('execution');
export function validateExecution(v){
 if(!v||!actionTypes.includes(v.actionType))throw Error('请明确动作类型与制作方式');
 for(const key of ['method','successCriteria'])if(typeof v[key]!=='string'||!v[key].trim()||v[key].length>4000)throw Error('缺少有效的 '+key);
 if(!Array.isArray(v.requiredAssets)||!v.requiredAssets.length||v.requiredAssets.length>30||v.requiredAssets.some(s=>typeof s!=='string'||!s.trim()||s.length>500))throw Error('请列出此镜头需要的独立动画素材');
 return {actionType:v.actionType,method:v.method.trim(),requiredAssets:v.requiredAssets.map(s=>s.trim()),successCriteria:v.successCriteria.trim()};
}
export function validateProduction(value,duration){
 if(!value||typeof value!=='object')throw Error('缺少动态制作计划，请先生成或补全动态计划。');
 const p={};for(const key of ['imagePrompt','startState','endState','continuity']){if(typeof value[key]!=='string'||!value[key].trim()||value[key].length>4000)throw Error('动态计划缺少有效的 '+key);p[key]=value[key].trim();}
 if(p.startState===p.endState)throw Error('镜头起止状态必须有可见变化。');
 if(!productionSchema.properties.camera.enum.includes(value.camera))throw Error('运镜方式无效');
 if(!['cut','dissolve'].includes(value.transition))throw Error('转场方式无效');
 if(!Array.isArray(value.beats)||value.beats.length<2||value.beats.length>4)throw Error('每镜需有2至4个动作时间节点。');
 let previous=-1;p.beats=value.beats.map((beat,i)=>{const at=beat.at;if(typeof at!=='number'||!Number.isFinite(at)||at<0||at>duration+.001||at<=previous||(i===0&&at!==0)||typeof beat.action!=='string'||!beat.action.trim()||beat.action.length>2000)throw Error('动作节点需从0秒开始、严格递增并位于镜头时长内。');previous=at;return {at,action:beat.action.trim()};});
 return {...p,camera:value.camera,transition:value.transition,...(value.execution?{execution:validateExecution(value.execution)}:{})};
}
export function sourceFingerprint(shot){return createHash('sha256').update(JSON.stringify({start:shot.start,end:shot.end,image:shot.image,imageRole:shot.imageRole,prompt:shot.prompt,production:shot.production})).digest('hex');}
export function motionTechnicalReady(s){return !!(s.motion?.status==='completed'&&s.motion?.video&&s.motion?.qa?.passed&&s.motion.sourceFingerprint===sourceFingerprint(s));}
export function motionReady(s){return motionTechnicalReady(s)&&s.motion.review==='approved';}
export function routeOf(p){return p.productionRoute==='video'?'video':'layered';}
export function capabilities(p){return routeOf(p)==='layered'?{route:'layered',description:'按已保存工程制作分层剪纸动画，导出制作包并回传逐镜视频；不会自动从完整插画生成绑定。',supported:['分层场景展开、生长与移动','独立关节和固定点的人物动作','有接触约束的道具运动'],requiresSpecialAssets:['完整走路循环','手指抓握与交接','翻书、车窗遮挡等形变动作'],output:'1920×1080 / 24fps'}:{route:'video',description:'参考图视频模型；能力需通过代表性样片验证',output:'1920×1080 / 24fps，源片段须达到1080p'};}
export function frameReviewFingerprint(p,s){return createHash('sha256').update(JSON.stringify({shot:sourceFingerprint(s),route:routeOf(p),character:p.characterId,style:p.styleId})).digest('hex');}
export function preflightReady(p,s){return !!(s.preflight?.status==='approved'&&s.preflight.fingerprint===frameReviewFingerprint(p,s)&&s.production?.execution);}
export function preflightIssues(p,s,i){const issues=[];try{validateProduction(s.production,s.end-s.start);validateExecution(s.production?.execution);}catch(e){issues.push(`镜头${i+1}：${e.message}`);}if(!s.image)issues.push(`镜头${i+1}：缺少参考画面`);if(!preflightReady(p,s))issues.push(`镜头${i+1}：待看图核对姿态、动作空间和动画素材`);return issues;}
export function motionAvailable(p,s){return s.motion?.generationTaskId?motionTechnicalReady(s)&&s.motion.route===routeOf(p):motionReady(s)&&preflightReady(p,s)&&s.motion?.route===routeOf(p);}
export function sampleSelection(p){return p.sampleShots||[];}
export function sampleIssues(p){const selected=sampleSelection(p),issues=[];if(!selected.length)issues.push('等待制作方确定能验证本片表现方式的动态样片');for(const {index}of selected){const s=p.shots[index];if(!s){issues.push('样片镜头已失效，请重新选择');continue;}if(!s.motion?.generationTaskId)issues.push(...preflightIssues(p,s,index));if(!motionAvailable(p,s))issues.push(`样片镜头${index+1}：待制作或视觉验收`);}return issues;}
export function sampleFingerprint(p){return createHash('sha256').update(JSON.stringify({story:p.story,brief:p.brief,audio:p.audio,lyrics:p.lyrics,route:routeOf(p),character:p.characterId,style:p.styleId,direction:p.direction,samples:(p.sampleShots||[]).map(({index})=>{const s=p.shots[index];return s?{index,source:sourceFingerprint(s),video:s.motion?.video,review:s.motion?.review,route:s.motion?.route,preflight:s.preflight}:null;})})).digest('hex');}
export function sampleApproved(p){if(p.flowVersion>=5)return p.shots.length>0&&p.shots.every((_,i)=>clipApproved(p,i));return sampleIssues(p).length===0&&(p.flowVersion!==4||(p.sampleApproval?.decision==='approved'&&p.sampleApproval.fingerprint===sampleFingerprint(p)));}
export function batchIssues(p){if(p.flowVersion>=5)return [];return [...sampleIssues(p),...(p.flowVersion===4&&!sampleApproved(p)?['请先确认动态样片效果，再制作全片']:[])];}
export function productionIssues(p){if(p.flowVersion>=5)return p.shots.flatMap((_,i)=>clipApproved(p,i)?[]:[`镜头${i+1}：尚未完成并确认当前视频`]);const issues=[];for(const [i,s]of p.shots.entries()){if(!s.motion?.generationTaskId)issues.push(...preflightIssues(p,s,i));if(!motionAvailable(p,s))issues.push(`镜头${i+1}：动态片段未通过视觉验收或已失效`);if(s.motion?.route!==routeOf(p))issues.push(`镜头${i+1}：制作路线已变更，需重新制作`);}return [...new Set([...batchIssues(p),...issues])];}
export function projectFingerprint(p){return createHash('sha256').update(JSON.stringify({route:routeOf(p),duration:p.duration,audio:p.audio,lyrics:p.lyrics,story:p.story,brief:p.brief,direction:p.direction,character:p.characterId,style:p.styleId,samples:p.sampleShots,shots:p.shots.map(s=>({source:sourceFingerprint(s),video:s.motion?.video,review:s.motion?.review,route:s.motion?.route,preflight:s.preflight}))})).digest('hex');}
export function filmReviewReady(p){return p.filmReview?.status==='approved'&&p.filmReview.fingerprint===projectFingerprint(p);}
export function framePrompt(project,shot,{character,style,previous,next}){return `生成16:9横屏MV关键帧，无文字无水印，无拼贴无多格。参考图1固定人物身份和服装，参考图2固定材质和配色。不要复制参考图构图。关键帧是动作开始前的状态，不能把多个时间点压在一张图里。\n故事：${project.story}\n人物：${JSON.stringify(character)}\n美术：${JSON.stringify(style)}\n前镜：${previous?.title||'开场'}；后镜：${next?.title||'结尾'}\n画面：${shot.production?.imagePrompt||shot.prompt}\n导演说明：${shot.prompt}\n开始状态：${shot.production?.startState||''}\n连续性：${shot.production?.continuity||''}`;}
export function videoPrompt(project,shot){const p=validateProduction(shot.production,shot.end-shot.start);return `制作${(shot.end-shot.start).toFixed(3)}秒连续MV镜头。参考图片为首帧，保持人物身份、服装、场景材质与道具连续。不生成字幕、水印、配乐或旁白。不用整图缩放冒充人物动作，不在镜头内部切换地点。\n故事语境：${project.story}\n起始状态：${p.startState}\n动作时间表（相对秒）：${p.beats.map(b=>`${b.at}s：${b.action}`).join('；')}\n结束状态：${p.endState}\n运镜：${p.camera}\n连续性：${p.continuity}\n动作完成标准：${p.execution?.successCriteria||'按上述起止状态完成'}\n输出：1920×1080，24fps，16:9横屏。\n每个动作需肉眼可见，动作后保留自然停顿，稳定手部与道具，不形变、不闪烁。`;
}

export function clipReviewFingerprint(p,index){const s=p.shots[index];return createHash('sha256').update(JSON.stringify({source:s&&sourceFingerprint(s),video:s?.motion?.video,route:routeOf(p),story:p.story,brief:p.brief,character:p.characterId,style:p.styleId})).digest('hex');}
export function clipPending(p,index){return (p.generationTasks||[]).some(t=>t.index===index&&['queued','running','waiting-input','interrupted'].includes(t.status)&&t.sourceFingerprint===sourceFingerprint(p.shots[index]));}
export function clipNeedsRevision(p,index){const note=(p.creativeFeedback||[]).filter(f=>f.indices?.includes(index)).at(-1);return !!note&&note.outputs?.[index]===p.shots[index]?.motion?.video;}
export function clipApproved(p,index){return !!p.shots[index]&&!clipPending(p,index)&&!clipNeedsRevision(p,index)&&motionAvailable(p,p.shots[index])&&p.shotApprovals?.[index]?.decision==='approved'&&p.shotApprovals[index].fingerprint===clipReviewFingerprint(p,index);}
