#!/usr/bin/env node
// E acceptance only: compare against reviewed Git objects. Never re-record evidence.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import * as engine from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import {PRE_E,ENGINE,SOURCE,GENERATED,FIXTURE,withPreE,parseSource,relocatedEngine,restoreCases,validateLegacyReferences,hash,valueHash,encode} from './lib/catalogLegacy.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function validateLegacy(sourceSha) {
 return withPreE(root,sourceSha,async before=>{
  const equal=(a,b,label)=>assert.equal(JSON.stringify(a),JSON.stringify(b),label);
  const raw=readFileSync(join(root,SOURCE));assert.equal(raw.compare(readFileSync(join(root,GENERATED))),0,'Generated mapping must be byte identical');
  execFileSync('python3',['-B','-c',"from scripts.catalog_legacy import read_legacy_source; read_legacy_source('knowledge_base/catalog/legacy_mappings.json')"],{cwd:root});
  const source=JSON.parse(raw),baseline=JSON.parse(readFileSync(join(root,FIXTURE)));
  assert.equal(baseline.sourceCommit,PRE_E);assert.equal(baseline.engineSha256,hash(before.original));
  for(const row of parseSource(root,before.original).inventory)equal(source.constants[row.name]?.value ?? source.tables[row.name]?.source,row.source,row.name+': raw source');
  assert.equal(readFileSync(join(root,ENGINE),'utf8'),relocatedEngine(root,before.original),'Only literal initializers, import and test export may change');
  equal(baseline.snapshot,before.engine.getLegacyMappingsForTesting(),'Fixture comes from actual pre-E engine');
  equal(baseline.snapshot,engine.getLegacyMappingsForTesting(),'Computed tables');
  equal(baseline.cases,restoreCases(baseline.snapshot,before.engine,before.codec),'Restore fixture provenance');
  const controls=engine.getLockControls();
  for(const row of baseline.cases)assert.equal(valueHash(row.prompt===undefined?engine.normalizeLocks(row.input,controls):codec.parseLocksFromStandardPrompt(row.prompt,controls)),row.expectedHash,row.table+': restore');
  equal(engine.getCompiledCatalogForTesting(),before.engine.getCompiledCatalogForTesting(),'Compiled catalog/entries');
  equal(controls,before.engine.getLockControls(),'Controls');
  // Existing category data, registry, semantics, manifests and generated Markdown/database stay intact.
  const protectedPaths=execFileSync('git',['-C',root,'ls-tree','-rz','--name-only',PRE_E,'knowledge_base','webapp/src/data'],{encoding:'utf8'}).split('\0').filter(p=>p && !p.endsWith('README.md'));
  for(const path of protectedPaths)assert.equal(hash(readFileSync(join(root,path))),hash(execFileSync('git',['-C',root,'show',PRE_E+':'+path],{maxBuffer:16e6})),path+' changed');
  const refs=await validateLegacyReferences(root,source,engine);assert.deepEqual(refs.issues,[]);
  return {phase:'E',sourceSha,tables:22,constants:2,sourceRows:334,restoreCases:baseline.cases.length,sourceDifferences:0,computedDifferences:0,restoreDifferences:0,compiledDifferences:0,controlDifferences:0,engineLogicDifferences:0,protectedFiles:protectedPaths.length,sourceSha256:hash(raw),fixtureSha256:hash(readFileSync(join(root,FIXTURE))),references:refs};
 });
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert(process.argv.length===4&&process.argv[2]==='--source-sha','Usage: --source-sha PRE_E_FULL_SHA');
 console.log(encode(await validateLegacy(process.argv[3])));
}
