import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [baselineRoot, integrationRoot, outputFile] = process.argv.slice(2);
assert.ok(baselineRoot && integrationRoot && outputFile, 'Usage: node compare.mjs BASELINE_ROOT INTEGRATION_ROOT OUTPUT_JSON');
const load = (root, path) => import(pathToFileURL(resolve(root, path)));
const before = await load(baselineRoot, 'webapp/src/lib/engine.js');
const after = await load(integrationRoot, 'webapp/src/lib/engine.js');
const { FIXED_FRAMING_MAIN_OPTION_POLICY } = await load(integrationRoot, 'webapp/src/lib/engine/fixedFramingDerivedPromptContract.js');
const controls=after.getLockControls();const option=(k,z)=>{const o=controls.find(c=>c.key===k).options.find(o=>o.zh===z);assert.ok(o,k+z);return o.id};
const none=after.createEmptyLocks();for(const c of controls){const o=c.options.find(o=>o.zh==='全無'||o.id==='none');if(o)none[c.key]=o.id}none.subjectCount='1';
const cases=[['independent',{topId:option('topId','棉質細肩背心'),pantsId:option('pantsId','直筒牛仔褲'),legwearId:option('legwearId','羅紋短襪'),shoesId:option('shoesId','尖頭細跟高跟鞋')}],['outfit',{outfitPresetId:option('outfitPresetId','套裝：網狀蕾絲馬甲短裙長靴')}],['special',{specialOutfitId:option('specialOutfitId','黑色波點頭巾透紗套裝')}],['character',{characterProfileId:option('characterProfileId','06_Hinata')}],['closedCoat',{outfitPresetId:option('outfitPresetId','套裝：開扣短袖襯衫熱褲'),outerwearId:option('outerwearId','西裝外套'),outerwearOpeningId:'wardrobe:外套開合-outerwear-opening:fully-closed:5'}],['none',{}]];
const outputs=p=>Object.fromEntries([['gpt',p.grokPrompt],['z',p.zImagePrompt],['mj',p.midjourneyPrompt],['nano',p.nanoBananaPrompt],...p.extraPrompts.map(e=>[e.id,e.text])]);
const section=(t,k)=>t.match(new RegExp('(?:^|\\n\\n)'+k+':\\n([\\s\\S]*?)(?=\\n\\n[A-Z][^\\n:]*:\\n|$)'))?.[1]||'';
const rows=[];
for(const [id,values]of cases)for(const f of FIXED_FRAMING_MAIN_OPTION_POLICY.visible.filter(x=>x.randomCandidate)){
 const locks={...none,...values,framingId:f.id},seed='framing-main-integration-v1';
 const a=before.generatePrompts(1,locks,[],{random:before.createSeededRandom(seed)})[0];const b=after.generatePrompts(1,locks,[],{random:after.createSeededRandom(seed)})[0];
 for(const label of ['Image Type','Composition','Pose and Composition','Scene','Lighting','Camera Look'])assert.equal(section(b.grokPrompt,label),section(a.grokPrompt,label),id+'/'+f.zh+'/'+label);
 for(const [k,v]of Object.entries(values))assert.equal(b.selection[k],v,id+'/'+k);
 const out=outputs(b);assert.equal(Object.keys(out).length,6);
 for(const text of Object.values(out)){
  assert.ok(text.trim());assert.doesNotMatch(text,/\bundefined\b|\[object Object\]|retainResolved|fallback guard|integrity check/);
  if(id==='independent')for(const rx of [/camisole/i,/jeans/i,/socks/i,/stiletto|heels/i])assert.match(text,rx);
  if(id==='outfit'||id==='special')for(const rx of [/skirt/i,/boots/i])assert.match(text,rx);
  if(id==='character')for(const rx of [/jeans/i,/boots/i])assert.match(text,rx);
  if(id==='closedCoat'){assert.doesNotMatch(text,/button-up shirt/i);assert.match(text,/hot pants/i);}
  if(id==='none')assert.doesNotMatch(text,/Wardrobe:|She wears|barefoot|nude|naked/i);
 }
 rows.push({id,framing:f.zh,seed,locks,before:outputs(a),after:out,nonWardrobeSectionsEqual:true});
}
fs.writeFileSync(outputFile,JSON.stringify({baseline:'8cfeac421f15e1849ab86e2a1c270bbbec6392ee',count:rows.length,rows},null,2)+'\n');console.log('PASS',rows.length,'cases;',rows.length*6,'outputs; fixed selection and non-wardrobe sections verified.');
