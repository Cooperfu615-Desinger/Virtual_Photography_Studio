#!/usr/bin/env node
// Read-only advice: explicit semantics remain authoritative, even if inference disagrees.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getKnowledgeBaseSnapshot, getCompiledCatalogForTesting } from '../webapp/src/lib/engine.js';
import { differences } from './lib/catalogBaseline.mjs';
import { GROUPS, encode } from './lib/catalogSemantics.mjs';
export function suggestSemantics(id, database = getKnowledgeBaseSnapshot()) {
  assert(typeof id === 'string' && id.length, 'A full catalog ID is required');
  const copy=structuredClone(database), matches=[];
  for(const [section,cs] of Object.entries(copy))for(const [category,rows] of Object.entries(cs))for(const [index,row]of rows.entries())if(row.stableId===id)matches.push({section,category,index,row});
  assert.equal(matches.length,1,'ID must resolve to exactly one source record');
  const {section,category,index,row}=matches[0];
  const explicit=Object.hasOwn(row.meta||{},'semantic')?structuredClone(row.meta.semantic):null;
  if(row.meta)delete row.meta.semantic;
  const inferred=getCompiledCatalogForTesting(copy).entries[GROUPS[section]][category][index].inferredMeta;
  return {id,section,category,explicit,inferred,differences:differences(explicit,inferred),writesFiles:false};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert.equal(process.argv.length,3,'Usage: node scripts/suggest_catalog_semantics.mjs FULL_ID');
  console.log(encode(suggestSemantics(process.argv[2])));
}
