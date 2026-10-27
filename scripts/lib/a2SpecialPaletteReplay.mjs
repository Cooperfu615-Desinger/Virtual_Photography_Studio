// Exact test-only inverse; never rewrite a real checkout or historical seal.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,realpathSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
export const SPECIAL_PALETTE_ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const SPECIAL_PALETTE_REVIEW=JSON.parse(readFileSync(new URL('./a2SpecialPalettePatch.json',import.meta.url)));
const hash=value=>createHash('sha256').update(value).digest('hex');
export function restorePreA2SpecialPaletteFiles(directory){
 assert.notEqual(realpathSync(directory),realpathSync(SPECIAL_PALETTE_ROOT),'Special palette inverse requires isolated copy');
 assert.ok(!existsSync(join(directory,'.git')),'Special palette inverse rejects Git checkout');
 const review=SPECIAL_PALETTE_REVIEW,path=join(directory,review.path);assert.ok(existsSync(path),'Special palette inverse missing source');
 const source=readFileSync(path,'utf8'),sha=hash(source),after=sha===review.afterHash;
 assert.ok(after||sha===review.beforeHash,'Special palette inverse rejects unknown source');
 for(const [file,expected]of Object.entries(review.newTests)){
  assert.equal(existsSync(join(directory,file)),after,'Special palette inverse rejects missing/mixed test state');
  if(after)assert.equal(hash(readFileSync(join(directory,file))),expected,'Special palette inverse rejects changed test');
 }
 if(!after)return;
 assert.equal(source.split(review.after).length-1,1,'Special palette inverse requires unique patch');
 const restored=source.replace(review.after,review.before);assert.equal(hash(restored),review.beforeHash,'Special palette inverse exact base');
 // All inputs pass before any write or removal.
 writeFileSync(path,restored);for(const file of Object.keys(review.newTests))rmSync(join(directory,file));
}
