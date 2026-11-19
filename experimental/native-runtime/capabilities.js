"use strict";
// An API existing (or a probe returning without throwing) is not a pass.
function evaluate(report) {
 const row=report.transientRow||{}, json=report.jsonTable||{}, pose=report.poseable||{};
 const originalUnchanged=Number.isInteger(row.originalRowCount)&&row.originalRowCount===row.originalRowCountAfter;
 const typedRows=originalUnchanged&&row.added===true&&row.read===true&&row.count===1&&row.obtainable===false;
 const jsonRows=json.count===1&&json.roundtrip===true&&json.originalUnchanged===true;
 const nativePose=Number.isInteger(pose.bones)&&pose.bones>0&&pose.poseWriteReadback===true;
 return {
  originalUnchanged,
  typedRows,
  jsonRows,
  jsonWriteDisabled:typeof json.writeResult==='string'&&/unavailable in Shipping/i.test(json.writeResult),
  nativePose,
  wardrobeRegistration:typedRows||jsonRows,
  // No capability probe validates assembly, grip, voices, portraits or gameplay.
  fullPackReady:false,
 };
}
module.exports={evaluate};
