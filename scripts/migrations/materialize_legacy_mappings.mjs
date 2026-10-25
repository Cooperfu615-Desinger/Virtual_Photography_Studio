import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertOutputPath,publishRehearsal} from './migrate_catalog_to_json.mjs';
import * as L from '../lib/catalogLegacy.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
export async function materialize({sourceSha,output}) {
assert.equal(sourceSha,L.PRE_E,'Reviewed pre-E SHA required');
const target=assertOutputPath(output,root);
return publishRehearsal(target, async stage => {
const save=(p,v)=>{mkdirSync(dirname(join(stage,p)),{recursive:true});writeFileSync(join(stage,p),typeof v==='string'?v:L.encode(v));};
return L.withPreE(root,sourceSha,async({original,engine,codec})=>{
 assert.equal(L.hash(readFileSync(join(root,L.ENGINE))),L.hash(original),'Engine already relocated or changed');
 const parsed=L.parseSource(root,original),contract={version:1,constants:{},tables:{}};
 const group=n=>n.startsWith('REGIONAL')?'regional':n.startsWith('CAMERA')?'camera':n.startsWith('CHARACTER')||n==='LEGACY_HAIR_STYLING_STATE_MIGRATIONS'?'character':n.startsWith('LOCATION')?'locations':'wardrobe';
 const literal=n=>parsed.literal(parsed.declarations.get(n).init);
 const cat=n=>literal(n);
 const fieldsFor=(n,source)=>{
  const g=group(n),fields={};
  const descriptor=(field)=>{
   if(field==='category')return{fieldKind:'catalog-category',group:g};
   if(field==='legacyCategory')return{fieldKind:'legacy-category'};
   if(field==='targetZh')return{fieldKind:'catalog-zh',group:g,categoryField:'category'};
   if(field==='dressZh')return{fieldKind:'catalog-zh',group:'wardrobe',category:cat('WARDROBE_DRESS_CATEGORY')};
   const attr={stateZh:['character','HAIR_STYLING_STATE_CATEGORY'],frameZh:['wardrobe','WARDROBE_EYEWEAR_CATEGORY'],colorZh:['wardrobe','WARDROBE_EYEWEAR_COLOR_CATEGORY'],placementZh:['wardrobe','WARDROBE_EYEWEAR_PLACEMENT_CATEGORY'],openingZh:['wardrobe','WARDROBE_OUTERWEAR_OPENING_CATEGORY']};
   if(attr[field])return{fieldKind:'attribute',group:attr[field][0],category:cat(attr[field][1])};
   if(['baseZh','arrangementZh','handZh','propZh','headZh','anchorZh'].includes(field))return{fieldKind:'embedded-ref',module:'webapp/src/lib/engine/poseComposerOptions.js',export:'POSE_COMPOSER_'+field.slice(0,-2).toUpperCase()+'_OPTIONS',match:'zh'};
   if(field==='legacy')return{fieldKind:'legacy-key',format:Array.isArray(source.find(r=>r.legacy)?.legacy[0])?'pairs':'pair'};
   if(field==='prompts')return{fieldKind:'legacy-key',format:'strings'};
   if(['label','arrangementId'].includes(field))return{fieldKind:'legacy-key'};
   throw Error(field);
  };
  for(const key of new Set(source.flatMap(r=>Object.keys(r))))fields[key]={...descriptor(key),required:source.every(r=>Object.hasOwn(r,key))};
  return fields;
 };
 const source={version:1,constants:{},tables:{}};
 for(const row of parsed.inventory) {
  if(L.CONSTANTS.includes(row.name)){contract.constants[row.name]={fieldKind:'legacy-category'};source.constants[row.name]={...contract.constants[row.name],value:row.source};continue;}
  let spec;
  if(row.name==='CAMERA_PROFILE_RENDERING_MIGRATIONS')spec={shape:'dictionary',fields:{$key:{fieldKind:'legacy-key'},$value:{fieldKind:'catalog-zh',group:'camera',category:cat('CAMERA_FILM_CATEGORY')}}};
  else if(row.name==='LEGACY_POSE_HAND_TO_PROP_ID')spec={shape:'pairs',fields:{0:{fieldKind:'legacy-key'},1:{fieldKind:'embedded-ref',module:'webapp/src/lib/engine/poseComposerOptions.js',export:'POSE_COMPOSER_PROP_OPTIONS',match:'id'}}};
  else spec={shape:'records',fields:fieldsFor(row.name,row.source)};
  contract.tables[row.name]=spec; source.tables[row.name]={...spec,source:row.source};
 }
 const references=await L.validateLegacyReferences(root,source,engine);
 assert.deepEqual(references.issues,[],'Candidate references must pass');
 const snapshot=engine.getLegacyMappingsForTesting(),cases=L.restoreCases(snapshot,engine,codec);
 const baseline={sourceCommit:L.PRE_E,engineSha256:L.hash(original),snapshot,cases};
 save(L.SOURCE,source);save(L.GENERATED,L.encode(source));save('scripts/lib/legacyMappingContract.json',contract);
 save(L.FIXTURE,baseline);
 save('webapp/src/lib/engine/legacyMappings.test.js',`import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { readFileSync } from 'node:fs';\nimport { createHash } from 'node:crypto';\nimport baseline from './legacyMappings.baseline.json' with { type: 'json' };\nimport { getLegacyMappingsForTesting, getLockControls, normalizeLocks } from '../engine.js';\nimport { parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';\nconst hash = value => createHash('sha256').update(value).digest('hex');\ntest('E immutable pre-move snapshot: 22 computed tables and 2 legacy constants', () => {\n  assert.equal(hash(readFileSync(new URL('./legacyMappings.baseline.json', import.meta.url))), '${L.hash(L.encode(baseline))}');\n  assert.equal(JSON.stringify(getLegacyMappingsForTesting()), JSON.stringify(baseline.snapshot));\n  const copy = getLegacyMappingsForTesting(); copy.tables.REGIONAL_STYLE_LEGACY_OPTION_MAP.length = 0;\n  assert.equal(JSON.stringify(getLegacyMappingsForTesting()), JSON.stringify(baseline.snapshot));\n});\ntest('E every legacy source path restores exactly as pre-E, including first-match and explicit selections', () => {\n  const controls = getLockControls();\n  for (const row of baseline.cases) {\n    const actual = row.prompt === undefined ? normalizeLocks(row.input, controls) : parseLocksFromStandardPrompt(row.prompt, controls);\n    assert.equal(hash(JSON.stringify(actual)), row.expectedHash, row.table + ': ' + JSON.stringify(row.input ?? row.prompt));\n  }\n});\n`);
 const inventory=parsed.inventory.map(({range,source,...row})=>({...row,rows:Array.isArray(source)?source.length:typeof source==='object'?Object.keys(source).length:1,consumers:parsed.ast.body.map(n=>n.declaration || n).filter(n=>n.type==='FunctionDeclaration'&&new RegExp('\\b'+row.name+'\\b').test(original.slice(...n.range))).map(n=>n.id.name)}));
 save('Docs/reports/catalog-architecture-e-2026-10-25/migration-baseline.json',{sourceCommit:L.PRE_E,engineSha256:L.hash(original),fixtureSha256:L.hash(L.encode(baseline)),sourceSha256:L.hash(L.encode(source)),compiledSha256:L.valueHash(engine.getCompiledCatalogForTesting()),controlsSha256:L.valueHash(engine.getLockControls()),tables:22,constants:2,sourceRows:334,restoreCases:cases.length,inventory});
 save(L.ENGINE,L.relocatedEngine(root,original));
 assert.equal(L.hash(readFileSync(join(root,L.ENGINE))),L.hash(original),'Engine changed during rehearsal');
 return {sourceSha,tables:22,constants:2,cases:cases.length};
});
});
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
const args=process.argv.slice(2);assert(args.length===4 && args[0]==='--source-sha' && args[2]==='--output','Usage: --source-sha FULL_SHA --output NEW_EXTERNAL_DIRECTORY');
console.log(L.encode(await materialize({sourceSha:args[1],output:args[3]})));
}
