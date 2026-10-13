// 用 engine 匯出的 getSceneDependentOptions 實測 場景×環境光×光線表現 相容矩陣
import fs from 'node:fs';
const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const controls = E.getLockControls();
const opt = k => controls.find(c=>c.key===k).options;
const locs = opt('locationId'), lights = opt('lightingId'), dirs = opt('lightDirectionId'), framings = opt('framingId');
const isNone = o => o.zh==='全無';
const out = { locTags:{}, lightTags:{}, dirTags:{} };
locs.forEach(l=>out.locTags[l.zh]=l.meta?.tags||[]);
lights.forEach(l=>out.lightTags[l.zh]=l.meta?.tags||[]);
dirs.forEach(l=>out.dirTags[l.zh]=l.meta?.tags||[]);
// location -> allowed ambient
const realLights = lights.filter(l=>!isNone(l));
const realDirs = dirs.filter(l=>!isNone(l));
const matrix = {}; const ambUse = Object.fromEntries(realLights.map(l=>[l.zh,0]));
for (const l of locs) { if (isNone(l)) continue;
  const r = E.getSceneDependentOptions([], { locationId: l.id });
  const allowed = r.lightingOptions.filter(x=>!isNone(x)).map(x=>x.zh);
  matrix[l.zh] = allowed; allowed.forEach(a=>ambUse[a]++);
}
out.locAmbient = matrix; out.ambUse = ambUse;
// ambient × light style (no location, medium framing default)
const ambDir = {}; const dirUse = Object.fromEntries(realDirs.map(d=>[d.zh,0]));
for (const a of realLights) { const r = E.getSceneDependentOptions([], { lightingId: a.id }); const al = r.lightDirectionOptions.filter(x=>!isNone(x)).map(x=>x.zh); ambDir[a.zh]=al; al.forEach(d=>dirUse[d]++); }
out.ambDir = ambDir; out.dirUseAcrossAmbient = dirUse;
// full triple count: location × ambient(allowed) × dir(allowed)
let triples=0, pairs=0; const dirUseTriple = Object.fromEntries(realDirs.map(d=>[d.zh,0]));
for (const l of locs) { if (isNone(l)) continue; for (const a of matrix[l.zh]) { pairs++; const aid = realLights.find(x=>x.zh===a).id; const r = E.getSceneDependentOptions([], { locationId:l.id, lightingId:aid }); const al=r.lightDirectionOptions.filter(x=>!isNone(x)); triples+=al.length; al.forEach(d=>dirUseTriple[d.zh]++); } }
out.pairs=pairs; out.triples=triples; out.dirUseTriple=dirUseTriple;
// sceneAttribute flags
out.attr = {};
for (const a of ['indoor','outdoor','other']) { const r=E.getSceneDependentOptions([], {sceneAttributeId:a}); out.attr[a]={locations:r.locationOptions.filter(x=>!isNone(x)).length, lighting:r.lightingOptions.filter(x=>!isNone(x)).length, dirs:r.lightDirectionOptions.filter(x=>!isNone(x)).length, locNames:r.locationOptions.map(x=>x.zh)}; }
fs.writeFileSync(new URL('./compat.json', import.meta.url), JSON.stringify(out,null,1));
const cnt = Object.entries(matrix).map(([k,v])=>[k,v.length]).sort((a,b)=>a[1]-b[1]);
console.log('pairs',pairs,'triples',triples, 'locs', cnt.length);
console.log('fewest ambient:', cnt.slice(0,15));
console.log('most ambient:', cnt.slice(-8));
console.log('ambUse', Object.entries(ambUse).sort((a,b)=>a[1]-b[1]));
console.log('dirUseAcrossAmbient', Object.entries(dirUse).sort((a,b)=>a[1]-b[1]));
console.log('dirUseTriple', Object.entries(dirUseTriple).sort((a,b)=>a[1]-b[1]));
console.log('attr', JSON.stringify(Object.fromEntries(Object.entries(out.attr).map(([k,v])=>[k,{...v,locNames:undefined}]))));
const both = Object.keys(matrix).filter(z=>!out.attr.indoor.locNames.includes(z)&&!out.attr.outdoor.locNames.includes(z)&&!out.attr.other.locNames.includes(z));
console.log('locations in no sceneAttribute:', both);
const inBoth = Object.keys(matrix).filter(z=>out.attr.indoor.locNames.includes(z)&&out.attr.outdoor.locNames.includes(z));
console.log('locations in indoor AND outdoor:', inBoth);
