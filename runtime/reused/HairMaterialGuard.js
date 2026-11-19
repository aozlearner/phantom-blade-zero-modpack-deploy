"use strict";
const OUTFITS=Object.freeze(["Hun_OutFit_Boss_PengMeng","Hun_OutFit_Boss_XiaoXue","Hun_OutFit_Boss_SawMan","Hun_OutFit_Boss_TieGui","Hun_OutFit_Boss_PowerMan","Hun_OutFit_Boss_YoungZuoShang", "Hun_OutFit_Boss_ZuoShang", "Hun_OutFit_Boss_ZuoShangLongTi", "Hun_OutFit_Boss_HookMan", "Hun_OutFit_Boss_HuaQianXiao", "Hun_OutFit_Boss_JingYe", "Hun_OutFit_Boss_ChiLianP2", "Hun_OutFit_Boss_BiYuan", "Hun_OutFit_Boss_BiHai", "Hun_OutFit_Boss_DangHui", "Hun_OutFit_Boss_GuWanYue", "Hun_OutFit_Boss_GuiChaiRed", "Hun_OutFit_Boss_GuiChaiRedP2", "Hun_OutFit_Boss_LionDancerP2", "Hun_OutFit_Boss_YanRu", "Hun_OutFit_Boss_LeiTing", "Hun_OutFit_Boss_GuHe", "Hun_OutFit_Boss_HanSui", "Hun_OutFit_Boss_HuoDaoDuiZhang", "Hun_OutFit_Boss_YanYan", "Hun_OutFit_Boss_QiuFeng", "Hun_OutFit_Boss_DuanChang", "Hun_OutFit_Boss_DuYan", "Hun_OutFit_Boss_HuangXingZi", "Hun_OutFit_Boss_FengXueDaoKe", "Hun_OutFit_Boss_LeiDang", "Hun_OutFit_Boss_LeiDangP2", "Hun_OutFit_Boss_LengTu", "Hun_OutFit_Boss_MengHua", "Hun_OutFit_Boss_YuBi", "Hun_OutFit_Boss_YuZan", "Hun_OutFit_Boss_MoTianMasked", "Hun_OutFit_Boss_MoYuan", "Hun_OutFit_Boss_ChangHong", "Hun_OutFit_Boss_WanJun", "Hun_OutFit_Boss_RedSwordswoman", "Hun_OutFit_Boss_ChiefDisciple", "Hun_OutFit_Boss_ChiefDiscipleP2", "Hun_OutFit_Boss_AJin", "Hun_OutFit_Boss_BiFeng", "Hun_OutFit_Boss_JadeMaskMan", "Hun_OutFit_Boss_YouLong", "Hun_OutFit_Boss_YuCongP1", "Hun_OutFit_Boss_ZuoShangEnding", "Hun_OutFit_Boss_ChenZhu", "Hun_OutFit_XianZhe", "Hun_OutFit_YuYao", "Hun_OutFit_YuDing", "Hun_OutFit_MuXiaoKuiP1", "Hun_OutFit_MuXiaoKuiP2", "Hun_OutFit_BaiChiLian", "Hun_OutFit_BaiChiLian_LongHair", "Hun_OutFit_BiTaoTao", "Hun_OutFit_WuLengShuang", "Hun_OutFit_AHua", "Hun_OutFit_YuEr", "Hun_OutFit_YuErControlled", "Hun_OutFit_XuKong", "Hun_OutFit_YanQianSui", "Hun_OutFit_LianXie", "Hun_OutFit_HuanGuiCoat", "Hun_OutFit_Boss_YoungHun", "Hun_OutFit_Boss_ZhenYao"]);
const allowed=new Set(OUTFITS);
function create(UE,report=()=>{}){
 const records=new Map(),warnings=new Set();let lastPawn,lastOutfit,disposed=false;
 const read=fn=>{try{return fn();}catch(_){return undefined;}},valid=o=>!!o&&read(()=>UE.KismetSystemLibrary.IsValid(o))===true;
 const path=o=>valid(o)?String(read(()=>UE.KismetSystemLibrary.GetPathName(o))||''):'';
 const hair=p=>{const n=p.slice(p.lastIndexOf('.')+1);return /hair|groom/i.test(n)&&!/brow|lash|eye|occlusion/i.test(n)&&(/\/Characters\/Hero\/Hun_Young\//i.test(p)||!/(?:Hero_Hun|\/Hero\/|MI_Hun)/i.test(p));};
 function clean(material){
  const seen=new Set();for(let n=0;n<8&&valid(material);n++){
   if(seen.has(material))return;seen.add(material);
   if(!/MaterialInstanceDynamic/.test(path(read(()=>material.GetClass()))))return material;
   material=read(()=>material.Parent);
  }
 }
 function asset(c){return read(()=>c.GetSkeletalMeshAsset())||read(()=>c.GroomAsset)||read(()=>c.GetClothAsset())||read(()=>c.ClothAsset);}
 function originalSlot(a,i){return read(()=>a.Materials.Get(i).MaterialInterface);}
 function reset(){records.clear();warnings.clear();}
 function step(context){
  if(disposed)return;
  const pawn=read(()=>UE.GameplayStatics.GetPlayerPawn(context,0));
  const appearance=valid(pawn)?read(()=>UE.PBZAppearanceComponent.GetPBZAppearanceComponent(pawn)):undefined;
  const outfit=valid(appearance)?String(read(()=>appearance.GetCurrentOutfit())||''):'';
  if(pawn!==lastPawn||outfit!==lastOutfit){reset();lastPawn=pawn;lastOutfit=outfit;}
  if(!valid(pawn)||!allowed.has(outfit))return;
  if(read(()=>UE.GameplayStatics.IsGamePaused(context))===true)return;
  const seq=read(()=>UE.SubsystemBlueprintLibrary.GetWorldSubsystem(pawn,UE.PBZLevelSequenceManager.StaticClass()));
  if(valid(seq)&&read(()=>seq.IsInSequence())===true)return;
  const seen=new Set();
  for(const type of [UE.SkeletalMeshComponent,UE.GroomComponent,UE.ChaosClothComponent]){
   const list=read(()=>pawn.K2_GetComponentsByClass(type.StaticClass()));if(!list)continue;
   for(let n=0;n<list.Num();n++){
    const c=list.Get(n);if(!valid(c)||read(()=>c.GetOwner())!==pawn)continue;
    if(read(()=>c.IsVisible())!==true||read(()=>c.bHiddenInGame)===true){if(records.has(c))seen.add(c);continue;}
    const a=asset(c),signature=path(a),count=read(()=>c.GetNumMaterials());if(!Number.isInteger(count)||count<1)continue;
    seen.add(c);let record=records.get(c);
    if(!record||record.signature!==signature||record.count!==count){
     record={signature,count,slots:[],writes:0};records.set(c,record);
     for(let i=0;i<count;i++){
      const current=read(()=>c.GetMaterial(i));let base=clean(current),basePath=path(base);
      if(!hair(basePath)){const native=clean(originalSlot(a,i));if(hair(path(native))){base=native;basePath=path(base);}}
      if(!hair(basePath))continue;
      // Preserve the explicit white-hair override even if a flash happens before first observation.
      if(outfit==='Hun_OutFit_YuErControlled'&&!/brow|lash/i.test(basePath)){
       const name=/HairCard/i.test(basePath)||/CA_YuEr_Hair01/i.test(signature)?'MI_NPC_YuEr_P2_HairCard':'MI_NPC_YuEr_Hair_P2';
       const p='/Game/PBZContent/Characters/NPC/Yuer/Material/V02/P2/'+name+'.'+name;
       const white=read(()=>UE.Object.Load(p));if(valid(white)){base=white;basePath=p;}
      }
      record.slots.push({index:i,material:base,path:basePath});
     }
     if(record.slots.length)report('CAPTURE',{outfit,component:path(c),asset:signature,slots:record.slots.map(x=>({index:x.index,material:x.path}))});
    }
    for(const slot of record.slots){try{
     if(!valid(slot.material))continue;const current=c.GetMaterial(slot.index);if(current===slot.material)continue;
     c.SetMaterial(slot.index,slot.material);record.writes++;
     if(record.writes<=8)report('RESTORED',{outfit,component:path(c),index:slot.index,from:path(current),to:slot.path});
    }catch(error){const key=path(c)+':'+slot.index;if(!warnings.has(key)){warnings.add(key);report('REVIEW',{outfit,key,error:String(error)});}}}
   }
  }
  for(const c of records.keys())if(!seen.has(c))records.delete(c);
 }
 return {step,dispose:()=>{disposed=true;reset();},count:()=>records.size};
}
let started=false;
function start(context){
 if(started)return;started=true;const UE=require('ue'),lines=[];
 const report=(stage,data)=>{const line=new Date().toISOString()+' '+stage+' '+JSON.stringify(data);console.warn('[HairMaterialGuard v2] '+line);lines.push(line);if(lines.length>180)lines.shift();try{const root=UE.BlueprintPathsLibrary.ConvertRelativePathToFull(UE.BlueprintPathsLibrary.ProjectSavedDir(),'');UE.EasyCsv.SaveStringToFileWithFullPath(lines.join('\n'),root+'HairMaterialGuard-v2.log');}catch(_){}};
 const guard=create(UE,report);report('START',{outfits:OUTFITS,intervalMs:50});
 function tick(){if(!context||!UE.KismetSystemLibrary.IsValid(context)){guard.dispose();return;}try{guard.step(context);}catch(error){report('REVIEW',{error:String(error)});}setTimeout(tick,50);}
 setTimeout(tick,50);
}
module.exports={OUTFITS,create,start};
