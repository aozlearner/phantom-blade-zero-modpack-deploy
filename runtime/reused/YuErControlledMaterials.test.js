const assert=require('node:assert/strict');
const M=require('./YuErControlledMaterials');const scanned=new Set(require('./yuer-material-paths.json').map(x=>x.toLowerCase()));
const array=a=>({Num:()=>a.length,Get:i=>a[i]});
const mat=path=>({path});const slot=(name,path)=>({MaterialSlotName:name,MaterialInterface:mat(path)});
let failLoad=false,source=[];const reports=[],oldWarn=console.warn;console.warn=x=>reports.push(x);
const UE={KismetSystemLibrary:{IsValid:x=>!!x,GetPathName:x=>x.path},Object:{Load:path=>{assert.ok(scanned.has(path.toLowerCase()),path);return failLoad?null:path.includes('/SkinParts/')?{Materials:array(source)}:mat(path);}}};
function component(slots){const changes=[];return {changes,GetSkeletalMeshAsset:()=>({Materials:array(slots)}),SetMaterial:(i,m)=>changes.push([i,m.path])};}
// Reproduce the actual in-game failure: P2 body has a different slot name from P1.
source=[slot('ordinary-skin','/native/MI_NPC_YuEr_Skin_P1.MI_NPC_YuEr_Skin_P1')];
let c=component([slot('MI_NPC_YuErP2_Body','/native/original')]);assert.equal(M.applyMesh(UE,c,'body'),true);assert.equal(c.changes.length,1);assert.match(c.changes[0][1],/Skin_P2/);
// No shared slot name is needed when the actual target material identifies skin/eyes.
c=component([slot('P2-eye','/native/MI_NPC_YuEr_EyeBall_P1.MI_NPC_YuEr_EyeBall_P1'),slot('P2-face','/native/MI_NPC_YuEr_Skin_P1_Dirt.MI_NPC_YuEr_Skin_P1_Dirt'),slot('teeth','/native/teeth'),slot('unreviewed-extra','/native/custom')]);
assert.equal(M.applyMesh(UE,c,'head'),true);assert.equal(c.changes.length,2);assert.match(c.changes[0][1],/EyeBall_P2/);assert.match(c.changes[1][1],/Skin_P2/);assert.ok(reports.some(x=>x.includes('unreviewed-extra')));
// Duplicate or unknown labels retain native materials rather than rejecting the actor.
source=[slot('duplicate','/native/a'),slot('duplicate','/native/b')];c=component([slot('duplicate','/native/c')]);assert.equal(M.applyMesh(UE,c,'head'),true);assert.equal(c.changes.length,0);
const hair=[];assert.equal(M.applyHair(UE,{GetNumMaterials:()=>1,SetMaterial:(i,m)=>hair.push(m.path)},false),true);assert.match(hair[0],/Hair_P2/);
failLoad=true;assert.equal(M.validate(UE),false);assert.equal(M.applyHair(UE,{GetNumMaterials:()=>1},false),false);assert.equal(M.applyMesh(UE,component([slot('MI_NPC_YuErP2_Body','/native/original')]),'body'),false);
failLoad=false;assert.equal(M.applyMesh(UE,{GetSkeletalMeshAsset:()=>{throw Error('read error');}},'head'),false);
assert.ok(reports.some(x=>x.includes('retainNativeAppearance')));console.warn=oldWarn;

console.log('PASS: actual P2 body slot regression; mismatched P1/P2 labels; face/eye target materials; unknown/duplicate slots preserved; hair P2; optional material errors cannot throw into character rollback.');
