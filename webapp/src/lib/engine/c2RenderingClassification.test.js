import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync,symlinkSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {getLockControls,normalizeLocks,createEmptyLocks} from '../engine.js';
import {preparePreRenderingClassificationFiles} from '../../../../scripts/lib/c2RenderingClassificationReplay.mjs';
import patches from '../../../../scripts/lib/c2RenderingClassificationPatches.json' with {type:'json'};
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const hash=value=>createHash('sha256').update(value).digest('hex');

test('C2 classification exact isolated inverse preserves original history and rejects unsafe inputs atomically',()=>{
 assert.throws(()=>preparePreRenderingClassificationFiles(root),/isolated/);
 const directory=mkdtempSync(join(tmpdir(),'c2-classification-test-'));
 try {
  for(const item of patches.files) {
   assert.equal(execFileSync('git',['-C',root,'show',patches.base+':'+item.path],{encoding:'utf8',maxBuffer:16*1024*1024}),item.beforeSource);
   const content=readFileSync(join(root,item.path));assert.equal(hash(content),item.afterHash);
   mkdirSync(dirname(join(directory,item.path)),{recursive:true});writeFileSync(join(directory,item.path),content);
  }
  const [first,second]=patches.files;const path=join(directory,first.path);const original=readFileSync(path);const untouched=readFileSync(join(directory,second.path));
  writeFileSync(path,'unknown');assert.throws(()=>preparePreRenderingClassificationFiles(directory),/unknown or mixed/);assert.deepEqual(readFileSync(join(directory,second.path)),untouched);
  rmSync(path);symlinkSync(join(root,first.path),path);assert.throws(()=>preparePreRenderingClassificationFiles(directory),/linked/);rmSync(path);writeFileSync(path,original);
  preparePreRenderingClassificationFiles(directory).apply();
  for(const item of patches.files)assert.equal(readFileSync(join(directory,item.path),'utf8'),item.beforeSource);
  preparePreRenderingClassificationFiles(directory).apply();
 } finally {rmSync(directory,{recursive:true,force:true});}
});

test('C2 rendering classification leaves the 25 public looks and eight legacy profile routes intact',()=>{
 const controls=getLockControls(),film=controls.find(c=>c.key==='filmId'),legacy=controls.find(c=>c.key==='cameraSystemId');
 assert.equal(film.label,'成像模擬 / 調色');assert.equal(film.options.length,26);assert.ok(!film.options.some(o=>o.zh.startsWith('相機｜')));
 const targets=['復古微對比銳利感','高銳利快照黑位','富士 Provia 清透明亮','冷調清晰寫實','暖白 JPEG 直出','中片幅數位色深','高動態通透明亮','手機 HDR 直出'];
 const profiles=legacy.options.filter(o=>o.id!=='none');assert.equal(profiles.length,8);
 profiles.forEach((profile,index)=>{
  const a=normalizeLocks({...createEmptyLocks(),filmId:profile.id}),b=normalizeLocks({...createEmptyLocks(),cameraSystemId:profile.id});
  assert.equal(a.filmId,b.filmId);assert.equal(film.options.find(o=>o.id===a.filmId).zh,targets[index]);
  const selected=film.options.find(o=>o.zh==='VHS 錄影帶低畫質');
  assert.equal(normalizeLocks({...createEmptyLocks(),filmId:selected.id,cameraSystemId:profile.id}).filmId,selected.id);
 });
});
