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
console.log('Voice policy: own/fallback, reactions/effort, NPC/dialogue/original isolation, failed posts, lane ownership and cleanup passed');
