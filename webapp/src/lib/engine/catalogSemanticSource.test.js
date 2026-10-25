import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCompiledCatalogForTesting, getKnowledgeBaseSnapshot, getLockControls } from '../engine.js';
const compile = row => getCompiledCatalogForTesting({Locations:{'生活感室內 (Indoor & Lifestyle)':[row]}}).entries.locations['生活感室內 (Indoor & Lifestyle)'][0];
const item = () => ({zh:'測試室內',en:'small indoor room',desc:'test',stableId:'locations:fixture:test',legacyIds:[]});
test('semantic is authoritative even when text suggests different tags; no semantic container escapes', () => {
  const row={...item(),meta:{semantic:{tags:['outdoor'],family:'explicit'},family:'source',tags:['outdoor','controlled']}};
  const original=JSON.stringify(row),result=compile(row);
  assert.deepEqual(result.inferredMeta,{tags:['outdoor'],family:'explicit'});
  assert.deepEqual(result.meta,{tags:['outdoor','controlled'],family:'source'});
  assert.equal(Object.hasOwn(result.meta,'semantic'),false);assert.equal(JSON.stringify(row),original);
});
test('an explicitly empty semantic object does not invoke inference, while absent semantic retains legacy inference',()=>{
  assert.deepEqual(compile({...item(),meta:{semantic:{}}}).meta,{tags:[]});
  assert(compile(item()).meta.tags.includes('commercial'));
});
test('explicit source fields and ordered tag union keep the previous overwrite contract',()=>{
  const source={CameraLighting:{'光線表現 (Light Style)':[{
    zh:'fixture',en:'test',desc:'test',stableId:'camera:fixture:light',legacyIds:[],
    meta:{semantic:{tags:['a','shared'],archetype:null},tags:['shared','b'],outerwearFastenerRequirement:'inferred'},
    outerwearFastenerRequirement:'',subjectLight:{tags:['b','c'],independentKey:true},
  }]}};
  const out=getCompiledCatalogForTesting(source).entries.camera['光線表現 (Light Style)'][0];
  assert.deepEqual(out.meta.tags,['a','shared','b','c']);assert.equal(out.meta.archetype,null);
  assert.equal(out.meta.outerwearFastenerRequirement,'');assert.equal(out.meta.subjectLight.independentKey,true);
  assert.equal(Object.hasOwn(out.meta,'semantic'),false);
});
test('formal semantic covers all records, including Negative without tags, and leaves the cache isolated',()=>{
  const controls=getLockControls(),bytes=JSON.stringify(controls),source=getKnowledgeBaseSnapshot();
  const rows=Object.values(source).flatMap(cs=>Object.values(cs).flat());assert.equal(rows.length,1050);
  assert(rows.every(r=>r.meta && Object.hasOwn(r.meta,'semantic')));
  for(const row of Object.values(source.Negative).flat()){assert(!Object.hasOwn(row.meta.semantic,'tags'));assert(Array.isArray(row.meta.semantic.conflictTags));assert(Array.isArray(row.meta.semantic.useTags));}
  source.Locations[Object.keys(source.Locations)[0]][0].meta.semantic.tags.push('fixture-only');
  getCompiledCatalogForTesting(source);assert.equal(getLockControls(),controls);assert.equal(JSON.stringify(controls),bytes);
});

test('invalid explicit semantic is rejected instead of silently inferring',()=>{
  for(const semantic of [null,[],false,'invalid'])assert.throws(()=>compile({...item(),meta:{semantic}}),/Invalid catalog semantic/);
});
