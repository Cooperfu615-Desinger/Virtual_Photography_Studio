import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { materializeDocument, withoutMaterializedSemantic, equalOrdered, PRE_D } from '../lib/catalogSemantics.mjs';
import { materialize } from '../migrations/materialize_catalog_semantics.mjs';
import { suggestSemantics } from '../suggest_catalog_semantics.mjs';
import { checkFieldMapping } from '../lib/catalogIntegrity.mjs';
import { getKnowledgeBaseSnapshot, getLockControls, getCompiledCatalogForTesting } from '../../webapp/src/lib/engine.js';

test('materialization preserves ordered whole inference and source fields without mutating inputs',()=>{
  const doc={section:'S',category:'C',entries:[{id:'one',meta:{flag:false,empty:''}},{id:'two'}]};
  const entries=[{id:'one',inferredMeta:{tags:['b','a'],archetype:null}},{id:'two',inferredMeta:{conflictTags:[],useTags:[]}}];
  const before=JSON.stringify([doc,entries]),out=materializeDocument(doc,entries);
  equalOrdered(out.entries[0].meta.semantic,entries[0].inferredMeta,'whole object');
  out.entries.forEach((row,i)=>equalOrdered(withoutMaterializedSemantic(row,doc.entries[i]),doc.entries[i],'source'));
  assert.equal(JSON.stringify([doc,entries]),before);
  assert(!Object.hasOwn(out.entries[1].meta.semantic,'tags'));
  for(const invalid of [[{...entries[0],id:'wrong'},entries[1]],[entries[0]], [{...entries[0],inferredMeta:null},entries[1]]])assert.throws(()=>materializeDocument(doc,invalid));
  assert.throws(()=>materializeDocument(out,entries),/overwrite/);
  const empty={id:'x',meta:{}};assert.deepEqual(withoutMaterializedSemantic({id:'x',meta:{semantic:{}}},empty),empty);
});
test('acceptance rejects tag order, key order, field loss and changed falsy values',()=>{
  const original={tags:['b','a'],archetype:null,flag:false,empty:''};
  for(const changed of [{...original,tags:['a','b']},{archetype:null,tags:['b','a'],flag:false,empty:''},{tags:['b','a']},{...original,flag:true},{...original,empty:null}])assert.throws(()=>equalOrdered(changed,original,'fixture'));
});
test('suggestion removes only the target semantic in a copy, preserves explicit source and default cache',()=>{
  const db=getKnowledgeBaseSnapshot(),row=db.Locations['生活感室內 (Indoor & Lifestyle)'][0];
  row.meta.semantic={tags:['deliberate-decision']};
  const before=JSON.stringify(db),controls=getLockControls(),controlBytes=JSON.stringify(controls);
  const result=suggestSemantics(row.stableId,db);
  assert.deepEqual(result.explicit,{tags:['deliberate-decision']});assert(result.differences.length);assert.equal(result.writesFiles,false);
  assert.equal(JSON.stringify(db),before);assert.equal(getLockControls(),controls);assert.equal(JSON.stringify(controls),controlBytes);
  assert.throws(()=>suggestSemantics('missing',db),/exactly one/);
  db.Locations['生活感室內 (Indoor & Lifestyle)'].push(structuredClone(row));assert.throws(()=>suggestSemantics(row.stableId,db),/exactly one/);
});
test('field mapping detects lost semantic fields, leaked container and reordered merged tags',()=>{
  const db={Locations:{'生活感室內 (Indoor & Lifestyle)':[ {zh:'test',en:'small indoor room',desc:'test',meta:{semantic:{tags:['outdoor','urban'],archetype:null},tags:['urban','extra']}} ]}};
  const entries=getCompiledCatalogForTesting(db).entries;
  const fields=Object.fromEntries(Object.keys(db.Locations['生活感室內 (Indoor & Lifestyle)'][0]).map(k=>[k,{runtime:k}]));
  assert.deepEqual(checkFieldMapping(db,entries,{fields}).issues,[]);
  const row=entries.locations['生活感室內 (Indoor & Lifestyle)'][0];
  row.meta.tags.reverse();row.meta.semantic={};delete row.meta.archetype;
  const issues=checkFieldMapping(db,entries,{fields}).issues;
  for(const suffix of ['meta.tags.order','meta.semantic.leak','meta.semantic.archetype'])assert(issues.some(i=>i.itemKey.endsWith(suffix)));
});
test('one-time rehearsal rejects unsafe output, wrong baseline and already materialized source without publication',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'catalog-d-test-'));
  try{
    await assert.rejects(materialize({sourceSha:PRE_D,output:dir}));
    await assert.rejects(materialize({sourceSha:PRE_D,output:'knowledge_base/catalog/forbidden'}));
    const out=join(dir,'candidate');
    await assert.rejects(materialize({sourceSha:'0'.repeat(40),output:out}));assert(!existsSync(out));
    await assert.rejects(materialize({sourceSha:PRE_D,output:out}),/already changed or materialized/);assert(!existsSync(out));
    assert.deepEqual(readdirSync(dir),[]);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
