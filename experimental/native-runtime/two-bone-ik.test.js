"use strict";
const assert=require('node:assert/strict');
const {solve}=require('./two-bone-ik');
const dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function check(input){
 const out=solve(input);
 near(dist(input.root,out.joint),dist(input.root,input.joint));
 near(dist(out.joint,out.end),dist(input.joint,input.end));
 assert.ok(out.joint.concat(out.end).every(Number.isFinite));
 return out;
}
const arm={root:[0,0,0],joint:[0,3,0],end:[4,3,0],pole:[0,10,0]};
const inReach=check({...arm,target:[5,0,0]});
assert.equal(inReach.reachable,true);near(inReach.error,0);assert.ok(inReach.joint[1]>0);
const tooFar=check({...arm,target:[100,0,0]});
assert.equal(tooFar.reachable,false);near(tooFar.end[0],7);near(tooFar.error,93);
const tooClose=check({...arm,target:[0.1,0,0]});
assert.equal(tooClose.reachable,false);near(dist(arm.root,tooClose.end),1);
check({...arm,target:[0,0,0]});
check({...arm,target:[7,0,0],pole:[20,0,0]});
const folded=check({root:[0,0,0],joint:[0,3,0],end:[0,0,0],target:[0,0,0],pole:[0,1,0]});
assert.equal(folded.reachable,true);near(dist(folded.end,[0,0,0]),0);
const straight={root:[1,1,1],joint:[4,1,1],end:[8,1,1],target:[5,1,1],pole:[50,1,1]};
check(straight);
// Different proportions, scales and target directions; all segment lengths stay fixed.
for(let i=1;i<=100;i++){
 const s=i/10;
 check({root:[1,2,3],joint:[1,2+3*s,3],end:[1+4*s,2+3*s,3],
  target:[s*Math.cos(i),s*Math.sin(i),3+i/2],pole:[2,20,4]});
}
const before=JSON.stringify(straight);solve(straight);assert.equal(JSON.stringify(straight),before);
assert.throws(()=>solve({...arm,target:[NaN,0,0]}));
assert.throws(()=>solve({...arm,joint:arm.root,target:[1,0,0]}));
console.log('Two-bone IK: reachable/unreachable targets, preserved lengths, folded and collinear limbs, proportions, immutable inputs passed');
