import {preC7NightLightingSource,preparePreC7NightLightingFiles} from './c7NightLightingReplay.mjs';
// Test-only exact inverse of the diagnostic-policy batch; never writes the checkout.
import assert from 'node:assert/strict';
import {existsSync, readFileSync, realpathSync, lstatSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import patches from './c2RenderingClassificationPatches.json' with {type:'json'};
const root=fileURLToPath(new URL('../../',import.meta.url));
const hash=value=>createHash('sha256').update(value).digest('hex');
export function preRenderingClassificationSource(path, source) {
 source=preC7NightLightingSource(path,source);
 const item=patches.files.find(item=>item.path===path);
 if (!item || hash(source)!==item.afterHash) return source;
 assert.equal(hash(item.beforeSource),item.beforeHash,'Corrupt classification history source');
 return Buffer.isBuffer(source)?Buffer.from(item.beforeSource):item.beforeSource;
}
export function preparePreRenderingClassificationFiles(directory) {
 const resolved=realpathSync(directory);
 assert.notEqual(resolved,realpathSync(root),'Classification history requires isolated copy');
 assert.ok(!existsSync(join(directory,'.git')),'Classification history rejects Git checkout');
 const present=patches.files.filter(item=>existsSync(join(directory,item.path)));
 for(const item of present) {
  const path=join(directory,item.path);
  assert.ok(!lstatSync(path).isSymbolicLink()&&realpathSync(path).startsWith(resolved+'/'),'Classification history rejects linked source');
 }
 const night=preparePreC7NightLightingFiles(directory);
 const sources=new Map(night.sources);
 if(present.some(item=>hash(readFileSync(join(directory,item.path)))===item.afterHash)) {
  for(const item of present) {
   const source=readFileSync(join(directory,item.path));
   assert.ok([item.beforeHash,item.afterHash].includes(hash(source)),'Classification history rejects unknown or mixed source: '+item.path);
   sources.set(item.path,preRenderingClassificationSource(item.path,source));
  }
 }
 return {sources,apply(){for(const [path,source] of sources)writeFileSync(join(directory,path),source);}};
}
