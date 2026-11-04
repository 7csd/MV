import {draftFramePrompt,draftVideoPrompt,sourceFingerprint,clipReviewFingerprint} from './production.mjs';

export function validateFinalPrompts(value){
 if(!value||typeof value!=='object')throw Error('请保存图片和动态样片的最终提示词');
 for(const key of ['image','motion'])if(typeof value[key]!=='string'||!value[key].trim()||value[key].length>50000)throw Error('最终提示词不能为空或超过50000字');
 return {image:value.image,motion:value.motion};
}
export function promptDrafts(p,index,context={}){
 const s=p.shots[index];
 return {image:draftFramePrompt(p,s,{...context,previous:p.shots[index-1],next:p.shots[index+1]}),motion:draftVideoPrompt(p,s)};
}
// One-time conversion only. Existing final text is never regenerated on save or execution.
export function ensureFinalPrompts(p,context={}){
 for(const [index,s] of (p.shots||[]).entries()){
  if(s.finalPrompts||!s.production)continue;
  const before=sourceFingerprint(s),valid=s.motion?.sourceFingerprint===before;
  const approved=p.shotApprovals?.[index];const approvalValid=approved?.fingerprint===clipReviewFingerprint(p,index);
  s.finalPrompts=promptDrafts(p,index,context);
  if(valid)s.motion.sourceFingerprint=sourceFingerprint(s);
  if(approvalValid)approved.fingerprint=clipReviewFingerprint(p,index);
 }
}
