#!/usr/bin/env node
// One-time D zero-difference acceptance; existing A/C evidence is never rewritten.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { getCompiledCatalogForTesting, getLockControls } from '../webapp/src/lib/engine.js';
import { readPreD, equalOrdered, withoutMaterializedSemantic, hash, encode } from './lib/catalogSemantics.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function validateSemantics(sourceSha) {
  const before=await readPreD(root,sourceSha);
  const database=JSON.parse(readFileSync(join(root,'webapp/src/data/database.json')));
  const compiled=getCompiledCatalogForTesting(database),controls=getLockControls(database);
  let records=0;
  for(const file of before.files){
    const doc=JSON.parse(readFileSync(join(root,file.path)));
    assert.equal(doc.entries.length,file.document.entries.length);
    equalOrdered({...doc, entries: file.document.entries}, file.document, file.path+': envelope');
    doc.entries.forEach((row,i)=>{
      const old=file.document.entries[i];assert.equal(row.id,old.id);
      equalOrdered(row.meta?.semantic,file.entries[i].inferredMeta,row.id+': semantic');
      equalOrdered(withoutMaterializedSemantic(row,old),old,row.id+': original source');records++;
    });
  }
  const stripped=structuredClone(database);
  equalOrdered(Object.keys(database),Object.keys(before.database),'section order');
  for(const [section,cs]of Object.entries(database)){
    equalOrdered(Object.keys(cs),Object.keys(before.database[section]),'category order');
    for(const [category,rows] of Object.entries(cs)){
      assert.equal(rows.length,before.database[section][category].length);
      stripped[section][category]=rows.map((r,i)=>withoutMaterializedSemantic(r,before.database[section][category][i]));
    }
  }
  equalOrdered(stripped,before.database,'generated original fields');
  equalOrdered(compiled,before.compiled,'compiled entries/catalog/inference');
  equalOrdered(controls,before.controls,'controls');
  const paths=['knowledge_base/catalog/index.json','knowledge_base/catalog/id_registry.json','knowledge_base/wardrobe_reference_manifest.json','knowledge_base/character_reference_manifest.json',...['regional_portrait_styles','wardrobe_and_styling','camera_and_lighting','locations_and_sets','character_design','negative_prompts'].map(n=>'knowledge_base/'+n+'.md')];
  for(const path of paths)assert.equal(hash(readFileSync(join(root,path))),hash(execFileSync('git',['-C',root,'show',sourceSha+':'+path])),path+' changed');
  assert(Object.values(compiled.entries).flatMap(cs=>Object.values(cs).flat()).every(row=>!Object.hasOwn(row.meta,'semantic')),'semantic container leaked');
  return {phase:'D',sourceSha,records,categories:before.files.length,semanticDifferences:0,sourceDifferences:0,databaseDifferences:0,compiledDifferences:0,controlDifferences:0,protectedFiles:paths.length,compiledSha256:hash(JSON.stringify(compiled)),controlsSha256:hash(JSON.stringify(controls))};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert(process.argv.length===4&&process.argv[2]==='--source-sha','Usage: --source-sha PRE_D_FULL_SHA');
  console.log(encode(await validateSemantics(process.argv[3])));
}
