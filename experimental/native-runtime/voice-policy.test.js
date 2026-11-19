"use strict";
const assert=require('node:assert/strict');
const {createRouter}=require('./voice-policy');
const player={},npc={},posts=[],stops=[];
let fail=new Set();
const router=createRouter({
 femaleOutfits:new Map([['female-own','own'],['female-missing','missing'],['mu','mu']]),
 profiles:{own:{attack:['own-attack'],hurt:['own-hurt']},mu:{attack:['mu-attack'],hurt:['mu-hurt']}},
 fallbackCharacter:'mu',sourceCategories:new Map([['native-hit','attack'],['native-hurt','hurtHeavy'],['native-effort','effort']]),
 random:()=>0,play:(event,actor)=>{posts.push({event,actor});return fail.has(event)?0:posts.length;},stop:id=>stops.push(id),
});
const input={actor:player,player,outfit:'female-own',source:'native-hit',inSequence:false};
assert.equal(router.route(input).event,'own-attack');
assert.equal(router.route({...input,source:'native-hurt'}).event,'own-hurt');
assert.equal(router.route({...input,outfit:'female-missing',source:'native-hurt'}).event,'mu-hurt');
assert.equal(router.route({...input,source:'native-effort'}).event,'mu-attack');
const count=posts.length;
for(const delta of [{actor:npc},{outfit:'original'},{inSequence:true},{inSequence:undefined},{source:'story-dialogue'},{source:'footstep'},{source:'death'}]){
 assert.equal(router.route({...input,...delta}).replace,false);
}
assert.equal(posts.length,count);
fail=new Set(['own-attack']);
assert.equal(router.route(input).event,'mu-attack');
fail.add('mu-attack');
const before=posts.length;
assert.equal(router.route(input).replace,false);
assert.equal(posts.length-before,2);
fail.clear();
const result=router.route(input);
router.ended(result.id);
const stopped=stops.length;
router.synchronize({actor:player,outfit:'original',inSequence:false});
assert.equal(stops.length,stopped);
router.route(input);
router.synchronize({actor:player,outfit:'original',inSequence:false});
assert.equal(stops.length,stopped+1);
router.route(input);router.dispose();const disposedCount=stops.length;router.dispose();
assert.equal(stops.length,disposedCount);
assert.equal(router.route(input).replace,false);
let stopFails=true;const errors=[];
const faulty=createRouter({femaleOutfits:new Map([['female-own','mu']]),profiles:{mu:{attack:['mu-attack']}},
 fallbackCharacter:'mu',sourceCategories:new Map([['native-hit','attack']]),play:()=>90,
 stop:()=>{if(stopFails)throw Error('Adapter error');},onStopError:id=>errors.push(id)});
faulty.route(input);faulty.dispose();assert.deepEqual(errors,[90]);
stopFails=false;faulty.dispose();faulty.dispose();assert.deepEqual(errors,[90]);
{
 const calls=[],ended=[];let failed=false;
 const r=createRouter({outfitProfiles:new Map([
  ['woman',{character:'woman',gender:'female'}],['man',{character:'man',gender:'male'}],['male-missing',{character:'absent',gender:'male'}],['young-hun',{character:'hun',gender:'male'}]
 ]),profiles:{woman:{attack:['woman-attack']},man:{attack:['man-attack']},mu:{attack:['mu-attack'],hurt:['mu-hurt']}},fallbackCharacter:'mu',
 sourceCategories:new Map([['native-hit','attack'],['native-hurt','hurt']]),play:event=>{calls.push(event);return failed?0:101;},stop:id=>ended.push(id)});
 assert.equal(r.route({...input,outfit:'man'}).event,'man-attack');
 let result=r.route({...input,outfit:'man',source:'native-hurt'});
 assert.equal(result.replace,false);assert.equal(result.character,'hun');assert.equal(result.reason,'native-fallback');
 assert.deepEqual(calls,['man-attack']);assert.deepEqual(ended,[101]);
 assert.equal(r.route({...input,outfit:'woman',source:'native-hurt'}).event,'mu-hurt');
 const count=calls.length;
 for(const outfit of ['male-missing','young-hun'])assert.equal(r.route({...input,outfit}).character,'hun');
 assert.equal(calls.length,count,'Male fallback uses native playback without a duplicate post');
 failed=true;assert.equal(r.route({...input,outfit:'man'}).character,'hun');
 assert.equal(calls.at(-1),'man-attack','Male fallback must never post Mu');
 assert.equal(r.route({...input,outfit:'man',source:'story-dialogue'}).replace,false);
 assert.equal(r.route({...input,outfit:'original'}).replace,false);
 r.dispose();
}
assert.throws(()=>createRouter({outfitProfiles:new Map([['unknown',{character:'someone'}]]),profiles:{},sourceCategories:new Map(),play:()=>1,stop:()=>{}}),/gender/);
console.log('Voice policy: own voice, female-to-Mu/male-to-native-Hun fallback, reactions, isolation, failed posts and cleanup passed');
