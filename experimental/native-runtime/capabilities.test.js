"use strict";
const assert=require('node:assert/strict');
const {evaluate}=require('./capabilities');
const observed={
 transientRow:{added:false,count:0,read:false,obtainable:true,originalRowCount:54,originalRowCountAfter:54},
 jsonTable:{count:0,writeResult:'Debug actions are unavailable in Shipping',originalUnchanged:true},
 poseable:{bones:301,poseWriteReadback:false},
};
assert.deepEqual(evaluate(observed),{
 originalUnchanged:true,typedRows:false,jsonRows:false,jsonWriteDisabled:true,
 nativePose:false,wardrobeRegistration:false,fullPackReady:false,
});
assert.equal(evaluate({done:true,errors:[]}).wardrobeRegistration,false);
const good={...observed,transientRow:{added:true,count:1,read:true,obtainable:false,originalRowCount:54,originalRowCountAfter:54}};
assert.equal(evaluate(good).wardrobeRegistration,true);
assert.equal(evaluate({...good,transientRow:{...good.transientRow,originalRowCountAfter:55}}).typedRows,false);
assert.equal(evaluate({...good,transientRow:{...good.transientRow,read:false}}).typedRows,false);
assert.equal(evaluate({...observed,poseable:{bones:301,poseWriteReadback:true}}).fullPackReady,false);
console.log('Capability evidence checks passed');
