"use strict";
const root='/Game/PBZContent/Characters/NPC/Yuer/Material/V02/';
const asset=(folder,name)=>root+folder+'/'+name+'.'+name;
const P2=Object.freeze({skin:asset('P2','MI_NPC_YuEr_Skin_P2'),eyes:asset('P2','MI_NPC_YuEr_EyeBall_P2'),hair:asset('P2','MI_NPC_YuEr_Hair_P2'),cards:asset('P2','MI_NPC_YuEr_P2_HairCard')});
const reference={body:'/HuaShira/Characters/NPC/YuEr/SkinParts/YuEr_Body.YuEr_Body',head:'/HuaShira/Characters/NPC/YuEr/SkinParts/YuEr_Head.YuEr_Head'};
function valid(UE,x){return !!x&&UE.KismetSystemLibrary.IsValid(x);}
function pathOf(UE,x){return valid(UE,x)?String(UE.KismetSystemLibrary.GetPathName(x)):'';}
function load(UE,path){const x=UE.Object.Load(path);if(!valid(UE,x))throw Error('YuEr P2 material resource unavailable: '+path);return x;}
function safe(stage,fn){try{return fn();}catch(error){console.warn('[YuErControlledMaterials] MATERIAL_REVIEW '+JSON.stringify({stage,error:String(error),retainNativeAppearance:true}));return false;}}
function validate(UE){return safe('validate',()=>{for(const p of Object.values(P2))load(UE,p);return true;});}
function mapped(UE,slot,material,role){
 // This is the exact P2 body slot observed in the failed in-game assembly.
 if(role==='body'&&slot==='MI_NPC_YuErP2_Body')return load(UE,P2.skin);
 const path=pathOf(UE,material);
 if(/MI_NPC_YuEr_Skin_/i.test(path))return load(UE,P2.skin);
 if(/MI_NPC_YuEr_EyeBall_/i.test(path))return load(UE,P2.eyes);
 return undefined;
}
function applyMesh(UE,component,role){return safe('mesh-'+role,()=>{
 const target=component.GetSkeletalMeshAsset(),slots=target.Materials;
 if(!slots)throw Error('YuEr target slot metadata missing');
 const source=UE.Object.Load(reference[role]),sourceSlots=valid(UE,source)?source.Materials:undefined;
 const report=[];
 for(let i=0;i<slots.Num();i++){
  const slot=slots.Get(i),name=String(slot.MaterialSlotName),native=slot.MaterialInterface;
  let replacement=mapped(UE,name,native,role);
  if(!replacement&&sourceSlots){
   const matches=[];for(let j=0;j<sourceSlots.Num();j++)if(String(sourceSlots.Get(j).MaterialSlotName)===name)matches.push(sourceSlots.Get(j));
   if(matches.length===1)replacement=mapped(UE,name,matches[0].MaterialInterface,role);
  }
  // Unmapped eye/teeth/occlusion/cloth slots keep their native material.
  // A different phase's slot label must never abort the full character.
  if(replacement)component.SetMaterial(i,replacement);
  report.push({index:i,slot:name,native:pathOf(UE,native),applied:replacement?pathOf(UE,replacement):null});
 }
 console.warn('[YuErControlledMaterials] P2_MESH_SLOTS '+JSON.stringify({role,slots:report}));return true;
});}
function applyHair(UE,component,cards){return safe(cards?'hair-cards':'hair-groom',()=>{
 const material=load(UE,cards?P2.cards:P2.hair),count=component.GetNumMaterials();
 if(count<1)throw Error('YuEr hair has no material slots');
 for(let i=0;i<count;i++)component.SetMaterial(i,material);
 console.warn('[YuErControlledMaterials] P2_HAIR_OK '+(cards?'cards':'groom')+' slots='+count);return true;
});}
module.exports={validate,applyMesh,applyHair};
