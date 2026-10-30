// Reproduce why apparently repeated nouns remain: custom catalogs are isolated in memory.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {getKnowledgeBaseSnapshot,generatePrompts,createSeededRandom} from '../webapp/src/lib/engine.js';
import review from './lib/c2OutfitReview.json' with {type:'json'};
const raw=readFileSync(new URL('../Docs/reports/c2-outfit-tails-2026-10-30/before.json.gz',import.meta.url));
const baseline=JSON.parse(gunzipSync(raw)),results=[];
for(const [i,row]of [[28,review.entries[1]],[1260,review.entries[18]]]){
 assert.equal(row.decision,'retain');const b=baseline.rows[i],catalog=getKnowledgeBaseSnapshot();
 const entry=catalog.Wardrobe['套裝 (Outfit Presets)'].find(e=>e.stableId===row.id);assert.equal(entry.en,row.before);entry.en=row.rejectedAlternative.after;
 const [p]=generatePrompts(1,b.input,catalog,{random:createSeededRandom('c2o:'+i)});
 const expected=b.outputs.grokPrompt.split(row.tailBefore).join(row.rejectedAlternative.tailAfter);
 assert.notEqual(p.grokPrompt,expected,'Removing noun must expose the protected projection difference');
 const [unchanged]=generatePrompts(1,b.input,[],{random:createSeededRandom('c2o:'+i)});assert.equal(unchanged.grokPrompt,b.outputs.grokPrompt,'Final preserved source remains byte-equal');
 results.push({id:row.id,caseIndex:i,framingId:b.input.framingId,reason:row.reason,baselineGpt:b.outputs.grokPrompt,nominalWordingOnlyGpt:expected,rejectedCandidateGpt:p.grokPrompt,finalGptUnchanged:true});
}
console.log(JSON.stringify({base:review.base,baselineSha256:createHash('sha256').update(raw).digest('hex'),results},null,2));
