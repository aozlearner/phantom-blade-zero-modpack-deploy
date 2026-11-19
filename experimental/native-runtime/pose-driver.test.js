"use strict";
const assert=require('node:assert/strict'),Driver=require('./pose-driver');
const vec=(X,Y,Z)=>({X,Y,Z}),quat=(X,Y,Z,W)=>({X,Y,Z,W});
const transform=(x,y,z,q=quat(0,0,0,1))=>({Translation:vec(x,y,z),Rotation:q,Scale3D:vec(1,1,1)});
const poseClass={},UE={KismetSystemLibrary:{IsValid:x=>!!x&&x.valid!==false},PoseableMeshComponent:{StaticClass:()=>poseClass},Transform:class{},Vector:class{constructor(X,Y,Z){Object.assign(this,{X,Y,Z});}},Quat:class{constructor(X,Y,Z,W){Object.assign(this,{X,Y,Z,W});}},ERelativeTransformSpace:{RTS_Component:2},EBoneSpaces:{ComponentSpace:1}};
function fixture(){
 const written=[],sourceAsset={},targetAsset={};
 const source={GetNumBones:()=>2,GetBoneName:i=>['root','arm'][i],GetParentBone:name=>name==='root'?'None':'root',GetRefPoseTransform:i=>transform(i,0,0),GetSkinnedAsset:()=>sourceAsset,
  GetSocketTransform:name=>name==='root'?transform(0,0,0,quat(0,0,Math.SQRT1_2,Math.SQRT1_2)):transform(0,1,0,quat(0,0,Math.SQRT1_2,Math.SQRT1_2))};
 const target={GetNumBones:()=>3,GetBoneName:i=>['root','arm','ornament'][i],GetParentBone:name=>name==='root'?'None':name==='arm'?'root':'arm',GetRefPoseTransform:i=>transform(i===1?2:i===2?1:0,0,0),GetSkinnedAsset:()=>targetAsset,IsA:c=>c===poseClass,SetBoneTransformByName:(...args)=>written.push(args)};
 const ownedComponents=new Set([target]);
 return {source,target,ownedComponents,written};
}
{
 const f=fixture(),d=Driver.create({UE,...f});
 assert.deepEqual(d.step(),{sourceBones:2,targetBones:3});
 assert.equal(f.written.length,3);
 assert.ok(Math.abs(f.written[1][1].Translation.Y-2)<1e-8,'Target arm retains its own length');
 assert.ok(Math.abs(f.written[2][1].Translation.Y-3)<1e-8,'Extra native bone follows retargeted parent');
 assert.ok(f.written.every(x=>x[2]===UE.EBoneSpaces.ComponentSpace));
 d.dispose();assert.equal(d.step(),false);assert.equal(f.written.length,3);
}
for(const kind of ['same','unowned','shared-source','wrong-class']){
 const f=fixture();if(kind==='same')f.target=f.source;if(kind==='unowned')f.ownedComponents.clear();if(kind==='shared-source')f.ownedComponents.add(f.source);if(kind==='wrong-class')f.target.IsA=()=>false;
 assert.throws(()=>Driver.create({UE,...f}));assert.equal(f.written.length,0);
}
for(const kind of ['ownership','mesh','invalid','scale','nan']){
 const f=fixture(),d=Driver.create({UE,...f});
 if(kind==='ownership')f.ownedComponents.clear();
 if(kind==='mesh')f.target.GetSkinnedAsset=()=>({});
 if(kind==='invalid')f.source.valid=false;
 if(kind==='scale')f.source.GetSocketTransform=()=>({...transform(0,0,0),Scale3D:vec(0,1,1)});
 if(kind==='nan')f.source.GetSocketTransform=()=>transform(NaN,0,0);
 assert.throws(()=>d.step());assert.equal(f.written.length,0,'Reject invalid frame before any writes');
}
{
 const f=fixture(),original=f.target.GetRefPoseTransform;
 f.target.GetRefPoseTransform=i=>({...original(i),Scale3D:i===0?vec(0.5,0.5,0.5):vec(1,1,1)});
 const d=Driver.create({UE,...f});d.step();
 assert.ok(Math.abs(f.written[2][1].Translation.Y-1.5)<1e-8);
 assert.deepEqual([...Object.values(f.written[2][1].Scale3D)],[0.5,0.5,0.5]);
}
console.log('Pose driver: target proportions, extra bones, component space, ownership and failure-before-write verified');
