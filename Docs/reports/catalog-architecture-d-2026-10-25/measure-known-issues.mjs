import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readPreD,PRE_D} from '../../../scripts/lib/catalogSemantics.mjs';
import {assertOutputPath} from '../../../scripts/migrations/migrate_catalog_to_json.mjs';
import {validateSemantics} from '../../../scripts/validate_catalog_semantics.mjs';
import {getKnowledgeBaseSnapshot,getCompiledCatalogForTesting,getSceneDependentOptions} from '../../../webapp/src/lib/engine.js';
const root=resolve(fileURLToPath(new URL('../../..',import.meta.url)));
if(!process.argv[2])throw new Error('Provide a new external output path');
const output=assertOutputPath(process.argv[2],root);
await validateSemantics(PRE_D);
const before=await readPreD(root,PRE_D);
const altered=structuredClone(before.database);
for(const rows of Object.values(altered.Locations))for(const row of rows)for(const k of ['zh','en','desc'])if(typeof row[k]==='string')row[k]=row[k].replace(/small/gi,'compact');
const next=getCompiledCatalogForTesting(altered);
const issues=[];
for(const [c,rows]of Object.entries(before.compiled.entries.locations))for(const [i,row]of rows.entries()){
 if(row.inferredMeta.tags.includes('commercial')&&!next.entries.locations[c][i].inferredMeta.tags.includes('commercial'))issues.push({id:row.id,label:row.zh,category:c,field:'commercial',tags:row.inferredMeta.tags,cause:'small substring matches mall'});
 if(row.zh==='戶外：倫敦排屋街道')issues.push({id:row.id,label:row.zh,category:c,field:'subterranean',tags:row.inferredMeta.tags,cause:'drainage pipes matches drainage'});
}
const current=getKnowledgeBaseSnapshot();
for(const issue of issues){
 const changed=structuredClone(current);const row=changed.Locations[issue.category].find(r=>r.stableId===issue.id);row.meta.semantic.tags=row.meta.semantic.tags.filter(t=>t!==issue.field);
 issue.poolComparisons=[];
 for(const sceneAttributeId of ['indoor','outdoor']){
  const locks={subjectCount:'1',sceneAttributeId,locationId:issue.id,framingId:'camera:景別構圖-framing:全身鏡頭-full-body-shot:8'};
  const original=getSceneDependentOptions(current,locks),candidate=getSceneDependentOptions(changed,locks);
  if(!original.locationOptions.some(o=>o.id===issue.id))continue;
  const pick=o=>({id:o.id,zh:o.zh});
  issue.poolComparisons.push({sceneAttributeId,lightingBefore:original.lightingOptions.map(pick),lightingWithoutTag:candidate.lightingOptions.map(pick),subjectBefore:original.lightDirectionOptions.map(pick),subjectWithoutTag:candidate.lightDirectionOptions.map(pick)});
 }
}
writeFileSync(output,JSON.stringify({sourceSha:'17074fbe3850e2e9fea300b36697643913f707a1',commercialCount:issues.filter(i=>i.field==='commercial').length,issues},null,2)+'\n',{flag:'wx'});
console.log(issues.map(i=>({id:i.id,field:i.field,pools:i.poolComparisons.map(p=>({scope:p.sceneAttributeId,ambient:[p.lightingBefore.length,p.lightingWithoutTag.length],subject:[p.subjectBefore.length,p.subjectWithoutTag.length]}))})));
