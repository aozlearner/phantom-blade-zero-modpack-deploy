"use strict";
// Original implementation of reference-relative FK. No sampled animations or
// serialized third-party animation graphs. Engine integration is not validated.
const EPS=1e-10;
function vector(v,n){if(!Array.isArray(v)||v.length!==n||v.some(x=>!Number.isFinite(x)))throw Error('Invalid transform');return v;}
function unit(q){vector(q,4);const n=Math.hypot(...q);if(n<EPS)throw Error('Zero quaternion');return q.map(x=>x/n);}
function multiply(a,b){
 const [x,y,z,w]=a,[X,Y,Z,W]=b;
 return unit([w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W,w*W-x*X-y*Y-z*Z]);
}
function inverse(q){const [x,y,z,w]=unit(q);return [-x,-y,-z,w];}
function rotate(q,v){
 vector(v,3);const [x,y,z,w]=unit(q),[a,b,c]=v;
 const t=[2*(y*c-z*b),2*(z*a-x*c),2*(x*b-y*a)];
 return [a+w*t[0]+y*t[2]-z*t[1],b+w*t[1]+z*t[0]-x*t[2],c+w*t[2]+x*t[1]-y*t[0]];
}
function validate(bones){
 if(!Array.isArray(bones)||!bones.length)throw Error('Empty skeleton');
 const names=new Set();
 bones.forEach((b,i)=>{
  if(typeof b.name!=='string'||!b.name||names.has(b.name.toLowerCase()))throw Error('Duplicate bone');
  names.add(b.name.toLowerCase());
  if(!Number.isInteger(b.parent)||b.parent<-1||b.parent>=i)throw Error('Parent must precede child');
  vector(b.translation,3);unit(b.rotation);
 });
}
function componentSpace(local){
 validate(local);const result=[];
 for(const b of local){
  const parent=result[b.parent];
  const t=parent?rotate(parent.rotation,b.translation).map((x,i)=>x+parent.translation[i]):[...b.translation];
  const q=parent?multiply(parent.rotation,b.rotation):unit(b.rotation);
  result.push({name:b.name,parent:b.parent,translation:t,rotation:q});
 }
 return result;
}
function toLocal(component){
 validate(component);
 return component.map(b=>{
  if(b.parent<0)return {...b,translation:[...b.translation],rotation:unit(b.rotation)};
  const p=component[b.parent],inv=inverse(p.rotation);
  return {name:b.name,parent:b.parent,translation:rotate(inv,b.translation.map((x,i)=>x-p.translation[i])),rotation:multiply(inv,b.rotation)};
 });
}
function retarget(sourceReference,sourcePose,targetReference,{rootTranslationScale=1}={}){
 validate(sourceReference);validate(sourcePose);validate(targetReference);
 if(!Number.isFinite(rootTranslationScale)||rootTranslationScale<=0)throw Error('Invalid root motion scale');
 if(sourceReference.length!==sourcePose.length||sourceReference.some((b,i)=>b.name!==sourcePose[i].name||b.parent!==sourcePose[i].parent))throw Error('Driver topology changed');
 const index=new Map(sourceReference.map((b,i)=>[b.name.toLowerCase(),i]));
 const local=targetReference.map(b=>{
  const i=index.get(b.name.toLowerCase());
  if(i===undefined)return {...b,translation:[...b.translation],rotation:unit(b.rotation)};
  const rest=sourceReference[i],pose=sourcePose[i];
  const rotation=multiply(b.rotation,multiply(inverse(rest.rotation),pose.rotation));
  // Preserve target segment lengths. Translation is propagated only for roots.
  const translation=b.translation.map((x,j)=>x+(b.parent===-1?(pose.translation[j]-rest.translation[j])*rootTranslationScale:0));
  return {name:b.name,parent:b.parent,translation,rotation};
 });
 return componentSpace(local);
}
module.exports={componentSpace,toLocal,retarget};
