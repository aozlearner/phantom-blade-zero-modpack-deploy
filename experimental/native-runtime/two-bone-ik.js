"use strict";
// Analytic two-segment IK, independently implemented from triangle geometry.
// Pure math only: never changes a shared skeleton or a player's capsule/weapon.
const EPS=1e-9;
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const scale=(a,n)=>a.map(x=>x*n);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const length=a=>Math.hypot(...a);
const normalized=a=>scale(a,1/length(a));
function point(p){if(!Array.isArray(p)||p.length!==3||p.some(v=>!Number.isFinite(v)))throw Error('Expected finite 3D point');}
function solve({root,joint,end,target,pole}){
 [root,joint,end,target,pole].forEach(point);
 const a=length(sub(joint,root)),b=length(sub(end,joint));
 if(a<=EPS||b<=EPS)throw Error('Zero-length limb segment');
 const delta=sub(target,root),requested=length(delta);
 let direction;
 if(requested>EPS)direction=normalized(delta);
 else{
  const current=sub(end,root);
  direction=normalized(length(current)>EPS?current:sub(joint,root));
 }
 const distance=Math.max(Math.abs(a-b),Math.min(a+b,requested));
 const projected=v=>sub(v,scale(direction,dot(v,direction)));
 let bend=projected(sub(pole,root));
 if(length(bend)<=EPS)bend=projected(sub(joint,root));
 if(length(bend)<=EPS){
  // Choose the least parallel coordinate axis. Deterministic singular fallback.
  const axis=[0,0,0];let k=0;
  for(let i=1;i<3;i++)if(Math.abs(direction[i])<Math.abs(direction[k]))k=i;
  axis[k]=1;bend=projected(axis);
 }
 bend=normalized(bend);
 let along,height;
 if(distance<=EPS){along=0;height=a;}
 else{
  along=(a*a-b*b+distance*distance)/(2*distance);
  height=Math.sqrt(Math.max(0,a*a-along*along));
 }
 const solvedJoint=add(root,add(scale(direction,along),scale(bend,height)));
 const solvedEnd=add(root,scale(direction,distance));
 return {joint:solvedJoint,end:solvedEnd,reachable:Math.abs(requested-distance)<=EPS,
  error:length(sub(target,solvedEnd)),upperLength:a,lowerLength:b};
}
module.exports={solve};
