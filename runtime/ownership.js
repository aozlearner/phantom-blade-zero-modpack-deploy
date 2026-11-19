"use strict";
// Project-owned visual lifecycle. No game table writes, timers or shared asset edits.
// Providers return a handle with dispose(); failed cleanup blocks new activation.
function key(value){if(typeof value!=='string'||!value.trim())throw Error('Nonempty ID required');return value.toLowerCase();}
function create(knownIds){
 const allowed=new Map();
 for(const id of knownIds){const k=key(id);if(allowed.has(k))throw Error('Duplicate catalog ID '+id);allowed.set(k,id);}
 const registered=new Map(),providers=new Set(),active=new Map();
 let sealed=false,closed=false;
 function register({id,outfits,prepare}){
  if(sealed||closed)throw Error('Registration closed');
  const provider=key(id);
  if(providers.has(provider)||typeof prepare!=='function'||!Array.isArray(outfits)||!outfits.length)throw Error('Invalid provider '+id);
  const pending=new Map();
  for(const outfit of outfits){
   const k=key(outfit.id);
   if(!allowed.has(k)||registered.has(k)||pending.has(k))throw Error('Unknown or conflicting outfit '+outfit.id);
   pending.set(k,Object.freeze({...outfit,id:allowed.get(k)}));
  }
  // Validation completes before committing any IDs.
  for(const [k,outfit] of pending)registered.set(k,{provider,outfit,prepare});
  providers.add(provider);
 }
 function seal(){
  if(closed)throw Error('Registry disposed');
  if(registered.size!==allowed.size)throw Error('Incomplete outfit registry');
  sealed=true;
 }
 function clear(actor){
  const old=active.get(actor);
  if(!old)return;
  if(old.handle.dispose()===false)throw Error('Visual cleanup pending for '+old.id);
  active.delete(actor);
 }
 function activate(actor,id){
  if(closed)throw Error('Registry disposed');
  seal();
  if(!actor)throw Error('Actor required');
  const entry=typeof id==='string'?registered.get(id.toLowerCase()):undefined;
  const old=active.get(actor);
  if(entry&&old?.id===entry.outfit.id)return old.handle;
  // The old provider must restore visibility before the new one captures it.
  clear(actor);
  if(!entry)return null; // Native or unmanaged outfit.
  // prepare must not mutate the actor; begin may only touch handle-owned state.
  const handle=entry.prepare(entry.outfit);
  if(!handle||typeof handle.begin!=='function'||typeof handle.dispose!=='function')throw Error('Invalid visual handle');
  active.set(actor,{id:entry.outfit.id,handle});
  try{
   handle.begin(actor);
   return handle;
  }catch(error){
   try{clear(actor);}catch(cleanupError){throw new Error('Activation failed and cleanup remains pending: '+String(cleanupError),{cause:error});}
   throw error;
  }
 }
 function dispose(){
  closed=true;
  const failures=[];
  for(const actor of active.keys())try{clear(actor);}catch(error){failures.push(error);}
  if(failures.length)throw Error('Unable to dispose '+failures.length+' visual owner(s)');
 }
 return Object.freeze({register,seal,activate,clear,dispose,
  current:actor=>active.get(actor)?.id,
  status:()=>({registered:registered.size,expected:allowed.size,active:active.size,sealed,closed})});
}
module.exports={create};
