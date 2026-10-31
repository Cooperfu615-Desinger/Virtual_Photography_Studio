import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import * as engine from '../webapp/src/lib/engine.js';
import * as lab from '../webapp/src/lib/characterCardLab.js';
import {serializeFavoritePrompt,deserializeFavoritePrompt,buildMarkdownExport,parseExportedMarkdownPrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import {createSavedCardsArchive} from '../webapp/src/features/saved-cards/savedCardArchive.js';
import JSZip from '../webapp/node_modules/jszip/lib/index.js';
import {BASE,REPORT,review,plain,fixtures,runCase,applyApprovedText,publicOutputs} from './lib/c1IdentityFixtures.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),file=join(root,REPORT,'before.json.gz');
const record=process.argv.includes('--record'),hash=s=>createHash('sha256').update(s).digest('hex'),m=fixtures(engine,lab);
if(record){
  assert.ok(!existsSync(file),'C1 baseline already exists; never overwrite');
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),BASE);
  for(const line of execFileSync('git',['ls-tree','-r',BASE,'webapp/src'],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024}).trim().split('\n')) {
    const [meta,path]=line.split('\t'),blob=meta.split(' ')[2];
    assert.equal(execFileSync('git',['hash-object','--',path],{cwd:root,encoding:'utf8'}).trim(),blob,'Modified pre-change source: '+path);
  }
  assert.equal(hash(readFileSync(join(root,review.path))),review.beforeHash);
}
const old=record?null:JSON.parse(gunzipSync(readFileSync(file)));
if(old){assert.equal(old.base,BASE);assert.deepEqual(old.review,review);assert.deepEqual(old.cases,m.cases);assert.deepEqual(old.page2Cases,m.page2);assert.deepEqual(applyApprovedText(old.controls),plain(m.controls));assert.deepEqual(applyApprovedText(old.cards),plain(m.cards));}
const rows=[],page2Rows=[],stats={base:BASE,record,page1:m.cases.length,page2:m.page2.length,page1Changed:0,page2Changed:0,saved:0,markdown:0,zipEntries:0};
for(const [i,row]of m.cases.entries()) {
  const actual=runCase(engine,row);if(record)rows.push(actual);
  else {const before=old.rows[i],expected=applyApprovedText(before);assert.deepEqual(actual,expected,row.name);assert.equal(actual.calls,before.calls,row.name+' RNG');assert.deepEqual(actual.prompt.selection,before.prompt.selection,row.name+' selections');if(JSON.stringify(actual)!==JSON.stringify(before))stats.page1Changed++;}
}
for(const [i,row]of m.page2.entries()) {
  const b=lab.buildCharacterCardPromptBundle(m.cards,row.variant),actual=plain({variant:b.variant,summary:b.summary,outputs:b.outputs});
  if(record)page2Rows.push(actual);else {assert.deepEqual(actual,applyApprovedText(old.page2Rows[i]),row.name);if(JSON.stringify(actual)!==JSON.stringify(old.page2Rows[i]))stats.page2Changed++;}
}
let saved=old?.saved;
if(record){
  saved=[];
  for(const target of review.rows){
    for(const mode of ['full-default','selected-layers']){
      const index=m.cases.findIndex(r=>r.locks.characterProfileId===target.id&&r.locks.characterCardWardrobeMode===mode);
      const p={...rows[index].prompt,id:'c1-old-page1-'+target.id+'-'+mode,date:'2026-10-31T00:00:00.000Z'};
      const raw=serializeFavoritePrompt(p);saved.push({source:'page1',raw,markdown:buildMarkdownExport(deserializeFavoritePrompt(raw))});
    }
    for(const mode of ['pure','all','one']){
      const i=m.page2.findIndex(r=>r.name===`${target.id}/default/${mode}/default`),variant=m.page2[i].variant;
      const bundle=lab.buildCharacterCardPromptBundle(m.cards,variant),p={...lab.buildCharacterCardSavedCard(m.cards,variant,bundle),id:'c1-old-page2-'+target.id+'-'+mode,date:'2026-10-31T00:00:00.000Z'};
      const raw=serializeFavoritePrompt(p);saved.push({source:'page2',variant:bundle.variant,bundle:plain(bundle),raw,markdown:buildMarkdownExport(deserializeFavoritePrompt(raw))});
    }
  }
}
const restored=[];
for(const row of saved){
  const p=deserializeFavoritePrompt(row.raw),again=serializeFavoritePrompt(p);assert.deepEqual({...again,l:null},{...row.raw,l:null});for(const[k,v]of Object.entries(row.raw.l||{}))assert.deepEqual(again.l[k],v);
  assert.equal(buildMarkdownExport(p),row.markdown);stats.saved++;stats.markdown++;restored.push(p);
  if(row.source==='page1'){
    const md=parseExportedMarkdownPrompt(row.markdown,m.controls,'c1-old-import');assert.deepEqual(publicOutputs(md),publicOutputs(p));assert.deepEqual(md.selection,p.selection);
  }else{
    const rebuilt=lab.buildCharacterCardSavedCard(m.cards,row.variant,row.bundle);
    assert.deepEqual(publicOutputs(rebuilt),publicOutputs(p));assert.deepEqual(rebuilt.profile,p.profile);
  }
}
const zip=await JSZip.loadAsync(await createSavedCardsArchive(restored,0,'nodebuffer'));
for(const p of restored){const name='prompt_'+p.id+'.md';assert.equal(await zip.file(name).async('string'),buildMarkdownExport(p));stats.zipEntries++;}
if(record){mkdirSync(join(root,REPORT),{recursive:true});writeFileSync(file,gzipSync(JSON.stringify({base:BASE,review,controls:plain(m.controls),cards:plain(m.cards),cases:m.cases,page2Cases:m.page2,rows,page2Rows,saved})),{flag:'wx'});}
console.log(JSON.stringify(stats));
