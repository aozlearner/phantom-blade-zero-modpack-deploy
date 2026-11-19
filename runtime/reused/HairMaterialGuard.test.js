const assert=require('node:assert/strict'),fs=require('node:fs');const Guard=require('./HairMaterialGuard');
const outfits=require('../../profiles/outfits.json').outfits.map(x=>x.id);assert.deepEqual([...Guard.OUTFITS].sort(),outfits.sort());assert.equal(new Set(Guard.OUTFITS).size,Guard.OUTFITS.length);
const arr=a=>({Num:()=>a.length,Get:i=>a[i]});
const material=(path,parent)=>({path,Parent:parent,GetClass:()=>({path:parent?'/Script/Engine.MaterialInstanceDynamic':'/Script/Engine.MaterialInstanceConstant'})});
const root='/Game/PBZContent/Characters/NPC/';
function harness(id='Hun_OutFit_XuKong'){
 let outfit=id,pawn={path:'/player'},paused=false,sequence=false;const originalPawn=pawn;const lists={skel:[],groom:[],cloth:[]},writes=[],reports=[],cache=new Map();
 const UE={KismetSystemLibrary:{IsValid:x=>!!x&&x.valid!==false,GetPathName:x=>x.path},GameplayStatics:{GetPlayerPawn:()=>pawn,IsGamePaused:()=>paused},PBZAppearanceComponent:{GetPBZAppearanceComponent:()=>({GetCurrentOutfit:()=>outfit})},SubsystemBlueprintLibrary:{GetWorldSubsystem:()=>({IsInSequence:()=>sequence})},PBZLevelSequenceManager:{StaticClass:()=>({})},Object:{Load:p=>{if(!cache.has(p))cache.set(p,material(p));return cache.get(p);}}};
 for(const [name,key] of [['SkeletalMeshComponent','skel'],['GroomComponent','groom'],['ChaosClothComponent','cloth']])UE[name]={StaticClass:()=>key};
 pawn.K2_GetComponentsByClass=key=>arr(lists[key]);
 function add(type,materials,assetName='Hair.Hair',owner=originalPawn){
  const native=materials.slice(),slots=materials.slice(),asset={path:'/native/'+assetName,Materials:arr(native.map(m=>({MaterialInterface:m})))};
  const c={path:'/component/'+type+'/'+lists[type].length,visible:true,bHiddenInGame:false,GetOwner:()=>owner,IsVisible:()=>c.visible,GetNumMaterials:()=>slots.length,GetMaterial:i=>slots[i],SetMaterial:(i,m)=>{writes.push({c,i,m});slots[i]=m;}};
  if(type==='skel')c.GetSkeletalMeshAsset=()=>asset;if(type==='groom')c.GroomAsset=asset;if(type==='cloth')c.GetClothAsset=()=>asset;
  lists[type].push(c);return {c,slots,native};
 }
 const guard=Guard.create(UE,(stage,data)=>reports.push({stage,...data}));
 return {guard,add,writes,reports,lists,tick:()=>guard.step({}),outfit:x=>outfit=x,paused:x=>paused=x,sequence:x=>sequence=x,pawn:x=>pawn=x};
}
// Every installed outfit, including five separate loader modules, is selected by current player ID.
for(const id of Guard.OUTFITS){
 const h=harness(id),base=material(root+'XuKong/MI_Hair.MI_Hair'),x=h.add('groom',[base]);h.tick();const expected=x.slots[0],initialWrites=h.writes.length;
 for(let i=0;i<3;i++){x.slots[0]=material('/temp/red-'+i,base);h.tick();assert.equal(x.slots[0],expected,id);}assert.equal(h.writes.length-initialWrites,3);
}
// Head-embedded hair (HuanGui) preserves face/eyes; cloth hair and independent groom are covered.
let h=harness('Hun_OutFit_HuanGuiCoat');const hair=material(root+'HuanGui/MI_HairCard.MI_HairCard'),skin=material(root+'HuanGui/MI_Skin.MI_Skin');let x=h.add('skel',[hair,hair,skin],'SK_HuanGuiHead.SK_HuanGuiHead');h.add('cloth',[hair]);h.add('groom',[hair]);h.tick();x.slots.fill(material('/effect/red'));h.tick();assert.equal(x.slots[0],hair);assert.equal(x.slots[1],hair);assert.equal(x.slots[2].path,'/effect/red');
// Existing red MID at first observation unwraps to immutable parent, not its tinted parameters.
h=harness();const red=material('/temp/red',hair);x=h.add('groom',[red]);h.tick();assert.equal(x.slots[0],hair);
// Temporary flash invisibility retains captured clean materials even if the later effect has a generic parent.
h=harness();x=h.add('groom',[hair]);h.tick();x.c.visible=false;h.tick();assert.equal(h.guard.count(),1);x.c.visible=true;x.slots[0]=material('/effect/red',material('/effect/master'));h.tick();assert.equal(x.slots[0],hair);
// White controlled-YuEr override wins over P1/default materials and survives recapture.
h=harness('Hun_OutFit_YuErControlled');x=h.add('groom',[material(root+'Yuer/MI_NPC_YuEr_Hair_P1.MI_NPC_YuEr_Hair_P1')]);h.tick();assert.match(x.slots[0].path,/Hair_P2/);
// Original outfits, removed mods, foreign owners, native Hun hair, eyebrows, scenes and hidden components excluded.
for(const id of ['Hun_OutFit_Default','Hun_OutFit_RavenLocal','Hun_OutFit_CodexSilkCorsair']){h=harness(id);x=h.add('groom',[red]);h.tick();assert.equal(h.writes.length,0);}
h=harness();h.add('groom',[red],'Hair.Hair',{});x=h.add('groom',[red]);x.c.visible=false;h.tick();assert.equal(h.writes.length,0);
h=harness();h.add('groom',[material(root+'YuEr/MI_Brow.MI_Brow')]);h.add('skel',[material('/Game/PBZContent/Characters/Hero/MI_Hun_Hair.MI_Hun_Hair')]);h.tick();assert.equal(h.reports.length,0);
h=harness();x=h.add('groom',[hair]);h.tick();x.slots[0]=red;h.sequence(true);h.tick();assert.equal(x.slots[0],red);h.sequence(false);h.paused(true);h.tick();assert.equal(x.slots[0],red);h.paused(false);h.tick();assert.equal(x.slots[0],hair);
h.outfit('Hun_OutFit_Default');x.slots[0]=red;h.tick();assert.equal(h.guard.count(),0);assert.equal(x.slots[0],red);h.guard.dispose();h.outfit('Hun_OutFit_XuKong');h.tick();assert.equal(h.guard.count(),0);
h=harness();x=h.add('groom',[hair]);h.tick();x.c.SetMaterial=()=>{throw Error('engine unavailable');};x.slots[0]=red;assert.doesNotThrow(h.tick);assert.ok(h.reports.some(x=>x.stage==='REVIEW'));
console.log('PASS reused hair guard for '+Guard.OUTFITS.length+' outfits: repeated material replacement, white hair, NPC/original exclusion, pause/sequence, cleanup and errors');
