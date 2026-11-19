"use strict";
// Engine adapter for the original FK implementation. The caller creates,
// registers, schedules and destroys its own private PoseableMeshComponent.
// No shared asset, player mesh, visibility, collision or animation class writes.
const FK=require('./retarget');
function decode(t){
 const s=t.Scale3D, scale=[s.X,s.Y,s.Z];
 if(scale.some(x=>!Number.isFinite(x)||x<=1e-10))throw Error('Positive nonzero bone scale required: '+scale.join(','));
 const p=t.Translation,q=t.Rotation;
 return {translation:[p.X,p.Y,p.Z],rotation:[q.X,q.Y,q.Z,q.W],scale};
}
function reference(component){
 const n=component.GetNumBones();
 if(!Number.isInteger(n)||n<1||n>4096)throw Error('Invalid skeleton size');
 const names=[],indices=new Map(),bones=[];
 for(let i=0;i<n;i++){
  const name=String(component.GetBoneName(i)),key=name.toLowerCase();
  if(!name||key==='none'||indices.has(key))throw Error('Invalid bone identity');
  names.push(name);indices.set(key,i);
 }
 for(let i=0;i<n;i++){
  const parent=String(component.GetParentBone(names[i])).toLowerCase();
  const index=parent===''||parent==='none'?-1:indices.get(parent);
  if(index===undefined||index>=i)throw Error('Invalid parent topology');
  bones.push({name:names[i],parent:index,...decode(component.GetRefPoseTransform(i))});
 }
 FK.componentSpace(bones); // Validate all values before any destination write.
 return bones;
}
function encode(UE,bone){
 const t=new UE.Transform();
 t.Translation=new UE.Vector(...bone.translation);
 t.Rotation=new UE.Quat(...bone.rotation);
 t.Scale3D=new UE.Vector(...bone.scale);
 return t;
}
function create({UE,source,target,ownedComponents,rootTranslationScale=1}){
 const valid=o=>!!o&&UE.KismetSystemLibrary.IsValid(o);
 if(!valid(source)||!valid(target)||source===target||!(ownedComponents instanceof Set)||!ownedComponents.has(target)||ownedComponents.has(source))throw Error('A distinct, privately owned pose target is required');
 if(!target.IsA(UE.PoseableMeshComponent.StaticClass()))throw Error('Target must be a private poseable component');
 const sourceAsset=source.GetSkinnedAsset(),targetAsset=target.GetSkinnedAsset();
 const sourceRest=reference(source),targetRest=reference(target);
 const sourceNames=new Set(sourceRest.map(x=>x.name.toLowerCase()));
 if(!targetRest.some(x=>x.parent>=0&&sourceNames.has(x.name.toLowerCase())))throw Error('No matching animated bones');
 let stopped=false;
 function step(){
  if(stopped)return false;
  if(!ownedComponents.has(target)||!valid(source)||!valid(target)||source.GetSkinnedAsset()!==sourceAsset||target.GetSkinnedAsset()!==targetAsset)throw Error('Pose component ownership or mesh changed; rebuild adapter');
  const pose=sourceRest.map(b=>({...b,...decode(source.GetSocketTransform(b.name,UE.ERelativeTransformSpace.RTS_Component))}));
  const result=FK.retarget(sourceRest,FK.toLocal(pose),targetRest,{rootTranslationScale});
  // Build all UE structs first. A conversion failure must not partly write a pose.
  const transforms=result.map(b=>encode(UE,b));
  for(let i=0;i<result.length;i++)target.SetBoneTransformByName(result[i].name,transforms[i],UE.EBoneSpaces.ComponentSpace);
  return {sourceBones:sourceRest.length,targetBones:targetRest.length};
 }
 return Object.freeze({step,dispose(){stopped=true;},reference:()=>targetRest.map(b=>({...b,translation:[...b.translation],rotation:[...b.rotation],scale:[...b.scale]}))});
}
module.exports={create,reference};
