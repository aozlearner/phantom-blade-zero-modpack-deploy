"use strict";
const assert=require('node:assert/strict');
const Catalog=require('./Catalog');
const roster=require('../../../profiles/outfits.json').outfits;
const registryPath=(character,event)=>`/Game/Wwise/Events/SFX/Combat/Vo/Monster_Vo/${character}/SFX_Combat_VO_${character}_${event}.SFX_Combat_VO_${character}_${event}`;
function harness(paths,{unreadable=false,infinite=false}={}){
 const events=new Map();
 const UE={
  KismetSystemLibrary:{IsValid:x=>!!x&&x.valid!==false},NewArray:()=>({}),AssetData:{},
  AssetRegistryHelpers:{GetAssetRegistry:()=>({GetAssetsByPath:(_p,ref)=>{
   if(unreadable)throw Error('Unavailable');
   ref.value={Num:()=>paths.length,Get:i=>({PackageName:paths[i].slice(0,paths[i].lastIndexOf('.')),AssetName:paths[i].slice(paths[i].lastIndexOf('.')+1)})};
  }})},
  Object:{Load:path=>{
   if(!events.has(path))events.set(path,{LoadData(){},GetWwiseShortID:()=>42,IsInfinite:infinite});
   return events.get(path);
  }}
 };
 return Catalog.build(UE,{$ref:value=>({value}),$unref:ref=>ref.value},()=>{});
}
const paths=['Attack_Light','Attack_Heavy','Hurt','Hurt_Heavy','Break'].map(x=>registryPath('MuXiaoKui',x));
paths.push(registryPath('XianZhe','Attack_Light'),registryPath('XianZhe','Hurt'));
const catalog=harness(paths);
const ids=new Set(roster.map(x=>x.id));
for(const outfit of Object.keys(Catalog.OUTFITS)){
 assert.ok(ids.has(outfit),'Voice scope must belong to current roster');
 const selected=catalog.select(outfit);assert.ok(selected);
 for(const category of ['attack','heavy','hurt','hurtHeavy','break','effort']){
  const target=catalog.choose(selected,category,()=>0);assert.ok(target,`${outfit}: ${category}`);
  assert.ok(target.character===Catalog.OUTFITS[outfit]||target.character.startsWith('muxiaokui'));
 }
}
for(const outfit of ['Hun_OutFit_Default','Hun_OutFit_Climax','Hun_OutFit_HuanGui','Hun_OutFit_Raven','unknown'])assert.equal(catalog.select(outfit),undefined);
assert.equal(catalog.choose(catalog.select('Hun_OutFit_XianZhe'),'hurt',()=>0).character,'xianzhe');
assert.equal(catalog.choose(catalog.select('Hun_OutFit_XuKong'),'hurt',()=>0).character,'muxiaokui-p1');
assert.equal(catalog.choose(catalog.select('Hun_OutFit_XuKong'),'effort',()=>0).category,'attack');
catalog.profiles.get('xianzhe').hurt=[];
assert.equal(catalog.choose(catalog.select('Hun_OutFit_XianZhe'),'hurt',()=>0).character,'muxiaokui-p1');
for(const name of ['Story_Attack','Dialogue_Attack','Death','Attack_Breath','Taunt'])assert.equal(Catalog.classify(registryPath('XianZhe',name)),undefined);
assert.equal(Catalog.classify('/Game/Wwise/Events/VO/Dialogue/SFX_Combat_VO_XianZhe_Attack.SFX_Combat_VO_XianZhe_Attack'),undefined);
assert.equal(harness([],{unreadable:true}).select('Hun_OutFit_XuKong'),undefined);
assert.equal(harness(paths,{infinite:true}).select('Hun_OutFit_XuKong'),undefined);
assert.deepEqual(require('./ReferenceMap').pools,{});
console.log('Retained local voice catalog: current roster, own/Mu reactions, dialogue exclusion and unavailable registry verified');
