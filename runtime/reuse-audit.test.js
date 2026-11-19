"use strict";
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const audit=JSON.parse(fs.readFileSync(path.join(root,'profiles/reuse-audit.json'),'utf8'));
for(const item of audit.reused){
 const source=fs.readFileSync(path.join(root,item.path));
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),item.sha256,item.path);
 assert.equal(item.mode,'byte-identical');
}
const roster=new Set(JSON.parse(fs.readFileSync(path.join(root,'profiles/outfits.json'),'utf8')).outfits.map(x=>x.id));
const models=JSON.parse(fs.readFileSync(path.join(root,'profiles/native-models.partial.json'),'utf8')).models;
const ids=new Set();
for(const m of models){
 assert.ok(roster.has(m.id));assert.ok(!ids.has(m.id));ids.add(m.id);
 assert.ok(typeof m.body==='string'&&m.body.startsWith('/'));
 assert.ok(!JSON.stringify(m).includes('/Mods/'));
}
assert.equal(models.length,audit.factual_configuration.outfits);
assert.equal(roster.size-models.length,audit.factual_configuration.remaining);
assert.equal(audit.complete_native_pack_ready,false);
console.log('Retained source byte hashes, native config IDs and declared incomplete coverage verified');
