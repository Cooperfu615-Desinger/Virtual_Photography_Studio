// Final read-only source audit and isolated inverse proof; never rewrite historical evidence.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { PHASE4_ROOT as root, PHASE4_REVIEW as review, restorePrePhase4Files } from './lib/phase4Replay.mjs';
const report = join(root,'Docs/reports/phase4-completion-2026-10-28');
const read = path => JSON.parse(readFileSync(join(root,path),'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const output = resolve(process.argv[2] || join(report,'closure/final-source-audit.json'));
assert.ok(output.startsWith(join(report,'closure')+'/'), 'Write only the new closure evidence');
assert.ok(!existsSync(output), 'Refuse to overwrite existing closure evidence; select a fresh output path');
const sourceScan = [];
for (const name of readdirSync(join(root,'knowledge_base/catalog/Wardrobe'))) {
 if (!name.endsWith('.json')) continue;
 const path='knowledge_base/catalog/Wardrobe/'+name, data=read(path);
 for (const item of data.entries) {
  assert.doesNotMatch(item.en,/controlled by|color selection|palette direction|coordinated top.to.bottom/i,item.id);
  sourceScan.push({id:item.id,canonicalEnglishHash:sha(item.en),retainedAliases:(item.legacyPromptAliases||[]).length});
 }
}
const a4=read('Docs/reports/phase4-completion-2026-10-28/a4/review.json');
for (const row of a4.rows) {
 const actual=read(a4.source).entries.find(x=>x.id===row.id), expected=structuredClone(row);
 expected.meta.colorMode='fixed'; assert.deepEqual(actual,expected,row.id);
}
const a5=read('Docs/reports/phase4-completion-2026-10-28/a5/review.json');
for (const row of a5.rows) {
 const actual=read(row.source).entries.find(x=>x.id===row.id),expected=structuredClone(row.before);
 expected.meta.semantic.tags=row.afterTags; assert.deepEqual(actual,expected,row.id);
}
const a7=read('Docs/reports/phase4-completion-2026-10-28/a7/review.json');
const profilePath='webapp/src/lib/engine/characterProfiles.js';
assert.deepEqual(readFileSync(join(root,profilePath)),execFileSync('git',['-C',root,'show',a7.baseCommit+':'+profilePath]));
const dir=mkdtempSync(join(tmpdir(),'phase4-final-inverse-')), inverse=[];
try {
 for (const path of [...review.files.map(x=>x.path),...Object.keys(review.newFiles)]) {
  mkdirSync(dirname(join(dir,path)),{recursive:true}); writeFileSync(join(dir,path),readFileSync(join(root,path)));
 }
 restorePrePhase4Files(dir);
 for (const file of review.files) {
  const fixed=execFileSync('git',['-C',root,'show',review.baseCommit+':'+file.path]);
  assert.deepEqual(readFileSync(join(dir,file.path)),fixed); inverse.push({path:file.path,sha256:sha(fixed),equalsFixedGit:true});
 }
 for (const path of Object.keys(review.newFiles)) assert.equal(existsSync(join(dir,path)),false,path);
} finally { rmSync(dir,{recursive:true,force:true}); }
const result={passed:true,head:execFileSync('git',['-C',root,'rev-parse','HEAD']).toString().trim(),baseCommit:review.baseCommit,
 inverseManifestHash:sha(readFileSync(join(root,'scripts/lib/phase4Patches.json'))),canonicalWardrobeRows:sourceScan.length,sourceScan,
 fixedPaletteRows:a4.rows.length,scenePositionRows:a5.rows.length,originalCharacterProfilesUnchanged:true,inverse,newFilesRemoved:Object.keys(review.newFiles)};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:true,canonicalWardrobeRows:sourceScan.length,fixedPaletteRows:a4.rows.length,scenePositionRows:a5.rows.length,inverseSources:inverse.length,newFilesRemoved:result.newFilesRemoved.length}));
