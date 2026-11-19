"use strict";
// New policy module. The engine hook and local-event catalog are separate inputs.
// No game audio, copied event implementation or third-party routing code here.
const categories=new Set(['attack','heavy','charge','hurt','hurtHeavy','break','effort']);
function alternatives(category){
 if(category==='hurtHeavy')return ['hurtHeavy','hurt'];
 if(category==='break')return ['break','hurtHeavy','hurt'];
 if(category==='heavy'||category==='charge')return [category,'attack'];
 return [category];
}
function candidates(profile,category,isFallback){
 const kinds=alternatives(category);
 if(isFallback&&category==='effort')kinds.push('attack');
 for(const kind of kinds){
  const events=profile?.[kind];
  if(Array.isArray(events)){
   const valid=events.filter(x=>typeof x==='string'&&x.length>0);
   if(valid.length)return valid;
  }
 }
 return [];
}
function createRouter({femaleOutfits,profiles,fallbackCharacter,sourceCategories,play,stop,random=Math.random,onStopError=()=>{}}){
 if(!(femaleOutfits instanceof Map)||!(sourceCategories instanceof Map))throw Error('Explicit outfit and event maps required');
 if(typeof play!=='function'||typeof stop!=='function')throw Error('Audio adapter required');
 let lane=null,disposed=false;
 const retiring=new Set();
 const drain=()=>{
  for(const id of retiring){
   try{stop(id);retiring.delete(id);}catch(error){try{onStopError(id,error);}catch(_){}}
  }
 };
 const finish=()=>{
  if(lane){retiring.add(lane.id);lane=null;}
  drain();
 };
 function synchronize({actor,outfit,inSequence}){
  if(lane&&(lane.actor!==actor||lane.outfit!==outfit||inSequence!==false))finish();
  else drain();
 }
 function route(input){
  const {actor,player,outfit,source,inSequence}=input;
  if(disposed)return {replace:false,reason:'disposed'};
  synchronize({actor:player,outfit,inSequence});
  // Unknown sequence state must not suppress original speech.
  if(!actor||actor!==player||inSequence!==false)return {replace:false,reason:'scope'};
  const character=femaleOutfits.get(outfit),category=sourceCategories.get(source);
  if(!character||!categories.has(category))return {replace:false,reason:'unmanaged'};
  // At most one own attempt and one fallback attempt; no broad audio interception.
  const groups=[{who:character,events:candidates(profiles[character],category,false)}];
  if(character!==fallbackCharacter)groups.push({who:fallbackCharacter,events:candidates(profiles[fallbackCharacter],category,true)});
  else groups[0].events=candidates(profiles[character],category,true);
  for(const group of groups){
   if(!group.events.length)continue;
   const r=random();
   if(!Number.isFinite(r)||r<0||r>=1)throw Error('Random sample outside [0,1)');
   const event=group.events[Math.floor(r*group.events.length)];
   let id;
   try{id=play(event,actor);}catch(_){continue;}
   if(!Number.isInteger(id)||id<=0)continue;
   // Only a confirmed successful post can replace original playback.
   finish();lane={id,actor,outfit};
   return {replace:true,id,event,character:group.who,category};
  }
  return {replace:false,reason:'unavailable'};
 }
 return {route,synchronize,
  ended(id){if(lane?.id===id)lane=null;retiring.delete(id);},
  dispose(){disposed=true;finish();},
 };
}
module.exports={createRouter};
