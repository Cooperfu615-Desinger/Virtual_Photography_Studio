import {preC7NightLightingSource,preparePreC7NightLightingFiles} from './c7NightLightingReplay.mjs';
import {preMaiOutfitSource} from './maiOutfitHistoricalReplay.mjs';
// Test-only exact inverse of the diagnostic-policy batch; never writes the checkout.
import assert from 'node:assert/strict';
import {existsSync, readFileSync, realpathSync, lstatSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import patches from './c2RenderingClassificationPatches.json' with {type:'json'};
const root=fileURLToPath(new URL('../../',import.meta.url));
const hash=value=>createHash('sha256').update(value).digest('hex');
function beforeMaiSchemaAssertion(path, source) {
 source=preMaiOutfitSource(path,source);
 if(path!=='scripts/tests/test_c2_scene_optics.py'||hash(source)!=='8ca995ad86683aa4a3302004e3a78f211393c954620a855b90d32ba375a3f35c')return source;
 const text=source.toString().replace("        schema['sections']['Wardrobe']['categories']['套裝 (Outfit Presets)']['properties']['meta']['properties'].pop('referenceImageOptional')\n",'').replace("        mapping['paths'].pop('meta.referenceImageOptional')\n",'');
 return Buffer.isBuffer(source)?Buffer.from(text):text;
}
export function preRenderingClassificationSource(path, source) {
 source=beforeMaiSchemaAssertion(path,source);
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
 if(present.some(item=>hash(beforeMaiSchemaAssertion(item.path,readFileSync(join(directory,item.path))))===item.afterHash)) {
  for(const item of present) {
   const source=beforeMaiSchemaAssertion(item.path,readFileSync(join(directory,item.path)));
   assert.ok([item.beforeHash,item.afterHash].includes(hash(source)),'Classification history rejects unknown or mixed source: '+item.path);
   sources.set(item.path,preRenderingClassificationSource(item.path,source));
  }
 }
 return {sources,apply(){for(const [path,source] of sources)writeFileSync(join(directory,path),source);}};
}
