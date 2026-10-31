import assert from 'node:assert/strict';
import test from 'node:test';
import * as engine from '../engine.js';
import {fixtures,runCase,sourceFlags,referenceAllows} from '../../../../scripts/lib/c7CaptureFixtures.mjs';
const m=fixtures(engine),opts=k=>m.controls.find(x=>x.key===k).options,by=(k,id)=>opts(k).find(x=>x.id===id);
test('C7 season avoids frozen winter in random light for a flowering sunflower field',()=>{
 for(let i=0;i<80;i++){const {prompt}=runCase(engine,{name:'sunflower',input:{...m.base,locationId:m.sunflower,lightingId:''},seed:'c7-sunflower:'+i});assert.equal(prompt.selection.locationId,m.sunflower);assert.ok(!sourceFlags('ambient',by('lightingId',prompt.selection.lightingId)).includes('frozen'));}
});
test('C7 random photography style respects manual fast shutter, ambient time and subject level',()=>{
 for(const patch of [{shutterId:m.fast},{lightingId:m.night},{lightDirectionId:m.high},{lightDirectionId:m.low}])for(let i=0;i<80;i++){
  const {prompt}=runCase(engine,{name:'manual anchor',input:{...m.base,styleId:'',...patch},seed:'c7-style-anchor:'+i});
  for(const[k,v]of Object.entries(patch))assert.equal(prompt.selection[k],v);
  assert.ok(referenceAllows('style',by('styleId',prompt.selection.styleId),{ambient:by('lightingId',patch.lightingId),subject:by('lightDirectionId',patch.lightDirectionId),shutter:by('shutterId',patch.shutterId)}));
 }
});
test('C7 manual conflicts and explicitly silent companions remain selected',()=>{
 for(const shutterId of ['', 'random']){const {prompt}=runCase(engine,{name:'shutter normalization',input:{...m.base,styleId:m.slow,shutterId},seed:'c7-silent-shutter'});assert.equal(prompt.selection.shutterId,m.base.shutterId);}
 for(const patch of [{locationId:m.sunflower,lightingId:m.winter},{styleId:m.slow,shutterId:m.fast,lightDirectionId:m.high},{styleId:m.dayStyle,lightingId:m.night},{locationId:m.party,styleId:m.dayStyle}]){
  const {prompt}=runCase(engine,{name:'manual',input:{...m.base,...patch},seed:'c7-all-manual'});for(const[k,v]of Object.entries(patch))assert.equal(prompt.selection[k],v);
 }
});

test('C7 exact reviewed sources retain unknown, edited and reasonable exceptions',async()=>{
 const h=await import('./captureCompatibility.js');
 for(const [kind,key]of [['style','styleId'],['location','locationId'],['ambient','lightingId'],['subject','lightDirectionId'],['shutter','shutterId']]){
  assert.equal(m.review[kind].length,opts(key).length);
  for(const item of opts(key)){const row=m.review[kind].find(x=>x.id===item.id);assert.ok(row);assert.equal(row.en,item.en);assert.ok(row.reason);assert.deepEqual(h.reviewedCaptureFlags(kind,item),row.flags);assert.deepEqual(h.reviewedCaptureFlags(kind,{...item,en:item.en+' edited'}),[]);assert.deepEqual(h.reviewedCaptureFlags(kind,{...item,id:'unknown'}),[]);}
 }
 const find=(key,s)=>opts(key).find(x=>x.zh.includes(s));
 for(const s of ['目黑川','金色海灘','泳池露台'])assert.ok(h.seasonAllowsAmbient(find('locationId',s),by('lightingId',m.winter)));
 assert.ok(h.styleAllowsShutter(find('styleId','莎莉'),by('shutterId',m.fast)));
 assert.ok(h.styleAllowsShutter(by('styleId',m.slow),find('shutterId','1/250s')));
 for(const style of opts('styleId'))for(const item of opts('lightDirectionId'))assert.equal(h.styleAllowsSubject(style,item),referenceAllows('subject',item,{style}));
});
test('C7 reverse season and style companions keep explicit anchors and random draw order',()=>{
 for(const patch of [{locationId:'',lightingId:m.winter},{locationId:'',lightingId:m.cold},{styleId:m.slow,lightingId:'',lightDirectionId:'',shutterId:'random'},{styleId:m.dayStyle,lightingId:'',lightDirectionId:''}])for(let i=0;i<60;i++){
  const {prompt}=runCase(engine,{name:'reverse',input:{...m.base,...patch},seed:'c7-reverse:'+i});const s=prompt.selection,state={location:by('locationId',s.locationId),style:by('styleId',s.styleId)};
  for(const[k,v]of Object.entries(patch))if(v&&v!=='random')assert.equal(s[k],v);
  assert.ok(referenceAllows('ambient',by('lightingId',s.lightingId),state));assert.ok(referenceAllows('subject',by('lightDirectionId',s.lightDirectionId),state));assert.ok(referenceAllows('shutter',by('shutterId',s.shutterId),state));
 }
});
test('C7 capture inverse is pinned, isolated, idempotent and rejects unknown or linked source',async()=>{
 const {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync}=await import('node:fs');
 const {join,dirname}=await import('node:path');const {tmpdir}=await import('node:os');const {fileURLToPath}=await import('node:url');
 const {execFileSync}=await import('node:child_process');const {createHash}=await import('node:crypto');
 const {preparePreC7CapturePairingFiles}=await import('../../../../scripts/lib/c7CapturePairingReplay.mjs');
 const patch=(await import('../../../../scripts/lib/c7CapturePairingPatches.json',{with:{type:'json'}})).default;
 const root=fileURLToPath(new URL('../../../../',import.meta.url)),dir=mkdtempSync(join(tmpdir(),'c7-capture-inverse-'));
 assert.throws(()=>preparePreC7CapturePairingFiles(root),/isolated/);
 try{
  for(const item of patch.files){assert.equal(execFileSync('git',['-C',root,'show',patch.base+':'+item.path],{encoding:'utf8',maxBuffer:16*1024*1024}),item.beforeSource);const content=readFileSync(join(root,item.path));assert.equal(createHash('sha256').update(content).digest('hex'),item.afterHash);mkdirSync(dirname(join(dir,item.path)),{recursive:true});writeFileSync(join(dir,item.path),content);}
  const[a,b]=patch.files,path=join(dir,a.path),original=readFileSync(path),untouched=readFileSync(join(dir,b.path));writeFileSync(path,'unknown');assert.throws(()=>preparePreC7CapturePairingFiles(dir),/unknown or mixed/);assert.deepEqual(readFileSync(join(dir,b.path)),untouched);rmSync(path);symlinkSync(join(root,a.path),path);assert.throws(()=>preparePreC7CapturePairingFiles(dir),/linked/);rmSync(path);writeFileSync(path,original);
  preparePreC7CapturePairingFiles(dir).apply();for(const item of patch.files)assert.equal(readFileSync(join(dir,item.path),'utf8'),item.beforeSource);preparePreC7CapturePairingFiles(dir).apply();mkdirSync(join(dir,'.git'));assert.throws(()=>preparePreC7CapturePairingFiles(dir),/Git checkout/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
