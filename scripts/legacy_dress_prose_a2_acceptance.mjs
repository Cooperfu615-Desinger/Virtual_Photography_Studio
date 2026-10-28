// Independent fixed-Git oracle. Expected source ownership comes from fixtures, not the candidate parser.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, cpSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';
import JSZip from '../webapp/node_modules/jszip/lib/index.js';
import * as engine from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import { parseSavedCardsArchive } from '../webapp/src/features/saved-cards/savedCardArchive.js';
import { buildAllNoneLocks } from '../webapp/src/features/page1/page1Selectors.js';
import { transitionPage1Locks } from '../webapp/src/features/page1/lockTransitions.js';
import { stablePrompt, differences } from './lib/catalogBaseline.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),base='2caa6fdcd2ab63931339ee3018ca52025d3cef3f';
const out=resolve(process.argv[2]||'/tmp/a2-legacy-dress-prose-acceptance'),own=resolve(root,'Docs/reports/legacy-dress-prose-a2-2026-10-28');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');mkdirSync(out,{recursive:true});
const dir=mkdtempSync(join(tmpdir(),'vps-dress-prose-oracle-')),counts={mono:0,pairs:0,duo:0,restores:0,generations:0,structured:0,zip:0,archived:0},saved=[],mismatches=[];
const git=(...args)=>execFileSync('git',['-C',root,...args],{maxBuffer:128*1024*1024});
function same(label,a,b){const diff=differences(a,b);if(diff.length)mismatches.push({label,diff});assert.deepEqual(diff,[],label);}
function run(e,locks,seed){let calls=0;const rng=e.createSeededRandom(seed);const p=e.generatePrompts(1,structuredClone(locks),[],{random:()=>{calls++;return rng();}})[0];return {p,calls};}
try{
 execFileSync('tar',['-x','-C',dir],{input:git('archive',base,'webapp/src','webapp/package.json')});symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 const load=p=>import(pathToFileURL(join(dir,p)).href),old={engine:await load('webapp/src/lib/engine.js'),codec:await load('webapp/src/features/saved-cards/cardCodec.js')};
 // Run the reviewed new regressions against unchanged main to prove the defect.
 const newTest='webapp/src/features/saved-cards/legacyDressProseRecovery.test.js';cpSync(join(root,newTest),join(dir,newTest));
 const before=spawnSync(process.execPath,['--test',join(dir,newTest)],{cwd:dir,encoding:'utf8',maxBuffer:16*1024*1024});writeFileSync(join(out,'regression-fixed-main.log'),before.stdout+before.stderr);assert.equal(before.status,1);assert.match(before.stdout,/# fail [1-9]/);
 const controls=engine.getLockControls(),options=k=>controls.find(c=>c.key===k).options,active=k=>options(k).filter(o=>o.id&&!['none','random'].includes(o.id)&&o.zh!=='全無'),none=k=>options(k).find(o=>o.zh==='全無').id;
 same('controls',old.engine.getLockControls(),controls);same('catalog',old.engine.getKnowledgeBaseSnapshot(),engine.getKnowledgeBaseSnapshot());
 const dresses=active('dressId'),palettes=active('topBottomPaletteId'),colors=active('dressColorId'),dressIds=new Set(dresses.map(d=>d.id));assert.equal(dresses.length,24);assert.equal(palettes.length,42);assert.equal(colors.length,40);
 const empty=()=>({...buildAllNoneLocks(controls,engine.createEmptyLocks()),subjectCount:'1',framingId:options('framingId').find(o=>o.zh.includes('全身鏡頭')).id});
 const oldMd=p=>old.codec.buildMarkdownExport(p).replace(/^<!-- VPStudio PAGE1 Snapshot:.* -->\n/,'');
 const outputKeys=['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt'];
 function expected(raw,roles){
  const e={...raw};
  for(const role of ['','A','B']){
   const source=roles[role];
   if(source || dressIds.has(e[`dress${role}Id`]) || dressIds.has(e[`outfitPreset${role}Id`])){
    for(const part of ['','Color','PrimaryColor','ContrastColor','LockedPalette'])e[`outfitPreset${role}${part}Id`]=none(`outfitPreset${role}${part}Id`);
    e[`dress${role}Id`]=source?.dress||none(`dress${role}Id`);e[`dress${role}ColorId`]=source?.color||'none';e[`topBottomPalette${role}Id`]=source?.palette||'none';
   }
  }
  return old.codec.buildRestoreLocks(e,controls);
 }
 function generate(label,locks){const a=run(old.engine,locks,label),b=run(engine,locks,label);same(label, {p:stablePrompt(a.p),calls:a.calls},{p:stablePrompt(b.p),calls:b.calls});counts.generations++;return {...a.p,id:'dress-prose-'+counts.generations,date:'2026-10-28T00:00:00.000Z'};}
 function check(label,p,roles){
  for(const route of ['paste','markdown']){
   const text=route==='paste'?p.grokPrompt:`${p.grokPrompt}\n${p.zImagePrompt}\n${p.midjourneyPrompt}`;
   const prior=route==='paste'?old.codec.parseLocksFromStandardPrompt(text,controls).locks:old.codec.parseExportedMarkdownPrompt(oldMd(p),controls,'prior').selection;
   const wanted=expected(prior,roles);
   const imported=route==='paste'?null:codec.parseExportedMarkdownPrompt(oldMd(p),controls,'check');
   const actual=imported?.selection||codec.buildRestoreLocks(codec.parseLocksFromStandardPrompt(text,controls).locks,controls);
   same(label+':'+route,wanted,actual);counts.restores++;
   if(imported)for(const key of outputKeys)if(p[key]!==undefined)same(label+':original:'+key,p[key],imported[key]);
   const seed=label+':regenerated',a=run(old.engine,wanted,seed),b=run(engine,actual,seed);same(seed,{p:stablePrompt(a.p),calls:a.calls},{p:stablePrompt(b.p),calls:b.calls});counts.generations++;
   const applied=transitionPage1Locks({previousLocks:empty(),candidateLocks:engine.normalizeLocks(actual),lockControls:controls,restoringSelection:true});
   for(const [role,source]of Object.entries(roles)){same(label+':applied-dress',source.dress,applied[`dress${role}Id`]);if(source.palette)same(label+':applied-palette',source.palette,applied[`topBottomPalette${role}Id`]);}
  }
 }
 function structured(label,p){
  const a=old.codec.deserializeFavoritePrompt(old.codec.serializeFavoritePrompt(p)),b=codec.deserializeFavoritePrompt(codec.serializeFavoritePrompt(p));same(label+':json',stablePrompt(a),stablePrompt(b));
  same(label+':snapshot',stablePrompt(old.codec.parseExportedMarkdownPrompt(old.codec.buildMarkdownExport(p),controls,'structured')),stablePrompt(codec.parseExportedMarkdownPrompt(codec.buildMarkdownExport(p),controls,'structured')));counts.structured++;
 }
 for(const dress of dresses)for(const color of colors){const roles={'':{dress:dress.id,color:color.id}},p=generate('mono:'+dress.id+':'+color.id,{...empty(),dressId:dress.id,dressColorId:color.id});check('mono:'+dress.id+color.id,p,roles);counts.mono++;if(color.id==='red'){structured('mono:'+dress.id,p);saved.push({kind:'mono',roles,p,markdown:oldMd(p),raw:old.codec.serializeFavoritePrompt(p)});}}
 console.log(JSON.stringify({progress:'single colors',counts}));
 for(const dress of dresses)for(const palette of palettes){
  const p=generate('pair:'+dress.id+':'+palette.id,{...empty(),dressId:dress.id,topBottomPaletteId:palette.id}),roles={'':{dress:dress.id,palette:palette.id}};
  for(const historical of [false,true]){const q=structuredClone(p);if(historical)for(const k of outputKeys)if(q[k])q[k]=q[k].replaceAll('dress palette from top to bottom:','coordinated top-to-bottom palette:');check('pair:'+dress.id+palette.id+historical,q,roles);counts.pairs++;}
  if(dress===dresses[0]){structured('pair:'+palette.id,p);saved.push({kind:'pair',roles,p,markdown:oldMd(p),raw:old.codec.serializeFavoritePrompt(p)});}
 }
 console.log(JSON.stringify({progress:'paired colors',counts}));
 for(const [i,palette]of palettes.entries())for(const swap of [false,true]){
  const a=dresses[i%dresses.length],b=dresses[(i+1)%dresses.length],p2=palettes[(i+1)%palettes.length];
  const roles={A:{dress:(swap?b:a).id,palette:(swap?p2:palette).id},B:{dress:(swap?a:b).id,palette:(swap?palette:p2).id}};
  const p=generate('duo:'+i+swap,{...empty(),subjectCount:'2',dressAId:roles.A.dress,dressBId:roles.B.dress,topBottomPaletteAId:roles.A.palette,topBottomPaletteBId:roles.B.palette});check('duo:'+i+swap,p,roles);counts.duo++;if(i===0&&!swap){structured('duo',p);saved.push({kind:'duo',roles,p,markdown:oldMd(p),raw:old.codec.serializeFavoritePrompt(p)});}
 }
 const archive=JSON.parse(gunzipSync(readFileSync(join(root,'Docs/reports/wardrobe-control-a2-dresses-2026-10-26/baseline-and-saved.json.gz'))));
 for(const row of archive.saved){const actual=codec.parseExportedMarkdownPrompt(row.markdown,controls,'archive'),prior=old.codec.parseExportedMarkdownPrompt(row.markdown,controls,'archive');assert.equal(actual.selection.dressId,row.id);for(const k of outputKeys)same('archived-original:'+k,prior[k],actual[k]);counts.archived++;}
 for(const row of saved){const zip=new JSZip();zip.file('prompt_legacy.md',row.markdown);const [actual]=await parseSavedCardsArchive(await zip.generateAsync({type:'nodebuffer'}),controls);same('zip:'+row.p.id,codec.parseExportedMarkdownPrompt(row.markdown,controls,'zip').selection,actual.selection);for(const k of outputKeys)if(row.p[k]!==undefined)same('zip-original:'+k,row.p[k],actual[k]);counts.zip++;}
 // Production outside the two-file parser change and all catalog sources are byte-identical.
 const production=git('ls-tree','-r','-z','--name-only',base,'webapp/src','knowledge_base').toString().split('\0').filter(Boolean).filter(p=>!p.endsWith('.test.js')&&p!=='webapp/src/features/saved-cards/cardCodec.js');
 for(const p of production)same('protected:'+p,git('show',base+':'+p).toString('base64'),readFileSync(join(root,p)).toString('base64'));
 writeFileSync(join(out,'baseline-and-saved.json.gz'),gzipSync(JSON.stringify({baseCommit:base,counts,saved}),{level:9}));
 writeFileSync(join(out,'oracle-mismatches.json'),JSON.stringify(mismatches,null,2)+'\n');writeFileSync(join(out,'acceptance.json'),JSON.stringify({baseCommit:base,counts,protectedFiles:production.length,oracleMismatches:mismatches.length,passed:true},null,2)+'\n');console.log(JSON.stringify({counts,protectedFiles:production.length,passed:true}));
}catch(error){writeFileSync(join(out,'failure-'+Date.now()+'.json'),JSON.stringify({message:error.message,stack:error.stack,counts,mismatches},null,2)+'\n');throw error;}finally{rmSync(dir,{recursive:true,force:true});}
