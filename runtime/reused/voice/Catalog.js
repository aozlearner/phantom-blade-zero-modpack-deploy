"use strict";
const reference=require('./ReferenceMap');
const OUTFITS=Object.freeze({
 Hun_OutFit_Boss_XiaoXue:'xiaoxue',
 Hun_OutFit_Boss_LeiTing:'leiting',Hun_OutFit_Boss_YanRu:'yanru',Hun_OutFit_Boss_ZhenYao:'zhenyao',
"Hun_OutFit_Boss_ChiLianP2":"baichilian","Hun_OutFit_Boss_GuWanYue":"guwanyue","Hun_OutFit_Boss_YanYan":"yanyan","Hun_OutFit_Boss_MengHua":"menghua","Hun_OutFit_Boss_YuBi":"yubi","Hun_OutFit_Boss_YuZan":"yuzan","Hun_OutFit_Boss_RedSwordswoman":"redswordswoman","Hun_OutFit_Boss_YuCongP1":"yucong",
 Hun_OutFit_XianZhe:'xianzhe', Hun_OutFit_YuYao:'yuyao', Hun_OutFit_YuDing:'yuding',
 Hun_OutFit_MuXiaoKuiP1:'muxiaokui-p1', Hun_OutFit_MuXiaoKuiP2:'muxiaokui-p2',
 Hun_OutFit_BaiChiLian:'baichilian',Hun_OutFit_BaiChiLian_LongHair:'baichilian',
 Hun_OutFit_BiTaoTao:'bitaotao',
 Hun_OutFit_WuLengShuang:'wulengshuang',Hun_OutFit_AHua:'ahua',Hun_OutFit_YuEr:'yuer',Hun_OutFit_YuErControlled:'yuer',Hun_OutFit_XuKong:'xukong',Hun_OutFit_YanQianSui:'yanqiansui',Hun_OutFit_LianXie:'lianxie',Hun_OutFit_HuanGuiCoat:'huangui'
});
function classify(objectPath){
 const p=String(objectPath).toLowerCase(), name=p.slice(p.lastIndexOf('.')+1);
 if(!p.startsWith('/game/wwise/events/') || !/(?:^|_)vo(?:_|$)/.test(name))return;
 const reviewedGuWanYue=/^sfx_combat_vo_guwanyue_(attack(?:_heavy)?|hurt(?:_heavy)?|break)$/.test(name);
 if(!reviewedGuWanYue&&!p.includes('/combat/')&&!p.includes('/battle/')&&!p.includes('/vo/int/vo_int_monster_battle/'))return;
 if(/death|die_|dialog|story|talk|laugh|intro|outro|breath|taunt/.test(name))return;
 const yanEffort=p==='/game/wwise/events/sfx/combat/vo/monster_vo/yanqiansui_vo/yanqiansui/sfx_combat_vo_yanqiansui_heng.sfx_combat_vo_yanqiansui_heng';
 if(!/attack|chuzhao|chu_zhao|charge|hurt|break|jump|dodge/.test(name)&&!yanEffort)return;
 let character;
 if(/muxiaokui|mu_xiao_kui/.test(p)) character=/(?:_p0?2(?:_|\.|\/)|phase2|muxiaokuip2)/.test(p)?'muxiaokui-p2':'muxiaokui-p1';
 else if(/xianzhe|xian_zhe/.test(p)) character='xianzhe';
 else if(/yuding|yu_ding/.test(p)) character='yuding';
 else if(/yuyao|yu_yao|(?:\/|_)yuu(?:\/|_|\.)/.test(p))character='yuyao';
 else if(/baichilian|bai_chi_lian/.test(p))character='baichilian';
 else if(/huangui|huan_gui/.test(p))character='huangui';
 else if(/bitaotao|bi_tao_tao/.test(p))character='bitaotao';
 else if(/wulengshuang|wu_leng_shuang/.test(p))character='wulengshuang';
 else if(/(?:\/|_)ahua(?:\/|_|\.)/.test(p))character='ahua';
 else if(/(?:\/|_)yuer(?:\/|_|\.)/.test(p))character='yuer';
 else if(/lianxie|lian_xie/.test(p))character='lianxie';
 else if(/yanqiansui|yan_qian_sui/.test(p))character='yanqiansui';
 else if(/guwanyue/.test(p))character='guwanyue';
 else if(/(?:\/|_)yanyan(?:\/|_|\.)/.test(p))character='yanyan';
 else if(/menghua/.test(p))character='menghua';
 else if(/(?:\/|_)emei/.test(p))character='redswordswoman';
 else if(/qishulei|qishu_lei/.test(p))character='leiting';
 else if(/qishuhuo|qishu_huo/.test(p))character='yanru';
 else if(/zhenyao|zhen_yao/.test(p))character='zhenyao';
 else if(/xiaoxue|xiao_xue/.test(p))character='xiaoxue';
 else if(/xukong|xu_kong/.test(p))character='xukong';
 if(!character)return;
 const category=yanEffort?'effort':/hurt/.test(name)?(/heavy/.test(name)?'hurtHeavy':'hurt'):/break/.test(name)?'break':/jump|dodge/.test(name)?'effort':/heavy|zhong|attack_h(?:_|$)/.test(name)?'heavy':/charge/.test(name)?'charge':'attack';
 return {character,category};
}
function build(UE,puerts,report){
 const valid=o=>!!o&&UE.KismetSystemLibrary.IsValid(o);
 const candidates=new Map(),inventory=[],eventPaths=[];
 let registryReadable=false;
 try{
  const registry=UE.AssetRegistryHelpers.GetAssetRegistry();
  const out=puerts.$ref(UE.NewArray(UE.AssetData));
  registry.GetAssetsByPath('/Game/Wwise/Events',out,true,true);
  const assets=puerts.$unref(out);
  registryReadable=assets.Num()>0;
  for(let i=0;i<assets.Num();i++){
   const a=assets.Get(i);
   let objectPath;
   if(a.PackageName&&a.AssetName)objectPath=String(a.PackageName)+'.'+String(a.AssetName);
   else {const full=String(UE.AssetRegistryHelpers.GetFullName(a));objectPath=full.slice(full.indexOf(' ')+1);}
   eventPaths.push(objectPath);
   const selected=classify(objectPath);
   if(selected){inventory.push({objectPath,...selected});candidates.set(objectPath.toLowerCase(),{objectPath,...selected});}
  }
  report('REGISTRY_SCAN',{assets:assets.Num(),candidates:inventory.length,registryReadable});
 }catch(error){report('REGISTRY_UNAVAILABLE',{error:String(error)});}
 // Explicit known events remain available if a character has no usable battle VO.
 for(const [category,pool] of Object.entries(reference.pools))for(const target of pool.targets){
  candidates.set(target.objectPath.toLowerCase(),{...target,character:'baichilian',category});
 }
 const profiles=new Map(),loaded=new Map(),limit=new Map();
 for(const target of candidates.values()){
  const key=target.character+'/'+target.category;
  if((limit.get(key)||0)>=16)continue;
  try{
   const event=UE.Object.Load(target.objectPath);
   if(!valid(event)||typeof event.LoadData!=='function'||typeof event.GetWwiseShortID!=='function')throw Error('Not a loadable Wwise event');
   const eventId=event.GetWwiseShortID();
   if(!Number.isInteger(eventId)||(eventId>>>0)===0)throw Error('Invalid event ID');
   if(target.eventId!==undefined&&(eventId>>>0)!==(target.eventId>>>0))throw Error('Reference event ID mismatch');
   if(event.IsInfinite===true)throw Error('Infinite event excluded');
   event.LoadData();
   let ownMax=NaN;try{ownMax=Number(event.MaximumDuration??event.MaxDuration);}catch(_){}
   const maximumMediaSeconds=Number.isFinite(ownMax)&&ownMax>0&&ownMax<60?ownMax:(target.maximumMediaSeconds||5);
   const item={...target,event,eventId:eventId>>>0,selectionWeight:target.selectionWeight||1,maximumMediaSeconds};
   if(!profiles.has(target.character))profiles.set(target.character,{attack:[],heavy:[],charge:[],hurt:[],hurtHeavy:[],break:[],effort:[]});
   profiles.get(target.character)[target.category].push(item);loaded.set(target.objectPath.toLowerCase(),event);
   limit.set(key,(limit.get(key)||0)+1);
   report('EVENT_READY',{character:target.character,category:target.category,path:target.objectPath,eventId:eventId>>>0});
  }catch(error){report('EVENT_UNAVAILABLE',{path:target.objectPath,error:String(error)});}
 }
 const usable=key=>{const p=profiles.get(key);return !!p&&(p.attack.length>0||p.heavy.length>0);};
 // Both phases share Mu's voice when phase-specific attack recordings are absent.
 if(!usable('muxiaokui-p2')&&usable('muxiaokui-p1'))profiles.set('muxiaokui-p2',profiles.get('muxiaokui-p1'));
 if(!usable('muxiaokui-p1')&&usable('muxiaokui-p2'))profiles.set('muxiaokui-p1',profiles.get('muxiaokui-p2'));
 for(const [outfit,character] of Object.entries(OUTFITS))report('PROFILE_READY',{outfit,character,ownVoiceAvailable:usable(character),registryReadable});
 function select(outfit,random=Math.random){
  const wanted=OUTFITS[outfit];if(!wanted)return;
  let chosen=wanted;
  if(!usable(chosen)){
   chosen=['muxiaokui-p1','muxiaokui-p2'].find(usable);
   if(!chosen)return;
  }
  return {outfit,wanted,character:chosen,ownVoice:chosen===wanted,profile:profiles.get(chosen)};
 }
 function choose(selection,category,random=Math.random,exclude){
  const p=selection.profile;
  const key=category==='execute'?'heavy':category;
  const available=list=>(list||[]).filter(t=>valid(t.event)&&t.objectPath!==exclude);
  const reaction=['hurt','hurtHeavy','break','effort'].includes(key);
  const keys=key==='break'?['break','hurtHeavy','hurt']:key==='hurtHeavy'?['hurtHeavy','hurt']:[key];
  let pool=[];
  const wanted=profiles.get(selection.wanted)||p;
  for(const k of keys){pool=available(wanted[k]);if(pool.length)break;}
  // A missing reaction uses Mu's matching reaction, never this character's attack.
  if(reaction&&!pool.length)for(const mu of ['muxiaokui-p1','muxiaokui-p2']){
   const fallback=profiles.get(mu);if(!fallback)continue;
   for(const k of key==='effort'?['effort','attack']:keys){pool=available(fallback[k]);if(pool.length)break;}
   if(pool.length)break;
  }
  if(!reaction&&!pool.length)pool=available(p.attack);
  if(!reaction&&!pool.length)pool=available(p.heavy);
  if(!pool.length)return;
  let n=random()*pool.reduce((s,t)=>s+t.selectionWeight,0);
  for(const t of pool){n-=t.selectionWeight;if(n<0)return t;}
  return pool[pool.length-1];
 }
 function fallbackTarget(selection,category,exclude){
  for(const character of ['muxiaokui-p1','muxiaokui-p2']){
   const profile=profiles.get(character);if(!profile)continue;
   const target=choose({profile},category,Math.random,exclude);if(target)return target;
  }
 }
 for(const outfit of Object.keys(OUTFITS)){
  const selection=select(outfit),categories={};
  for(const category of ['hurt','hurtHeavy','break','effort']){
   const target=selection&&choose(selection,category,()=>0);
   categories[category]=target?{character:target.character,path:target.objectPath}:null;
  }
  report('REACTION_PROFILE_READY',{outfit,categories,complete:Object.values(categories).every(Boolean)});
 }
 return {select,choose,fallbackTarget,inventory,eventPaths,registryReadable,profiles,loaded};
}
exports.OUTFITS=OUTFITS;exports.classify=classify;exports.build=build;
