import {preC2WaistSource,preparePreC2WaistFiles} from './c2WaistReplay.mjs';
// C3 test-only exact inverse; old sources and seals remain immutable.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,realpathSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import review from './c3PoseReview.json' with {type:'json'};
const root=fileURLToPath(new URL('../../',import.meta.url));
const hash=x=>createHash('sha256').update(x).digest('hex');
export function preC3Source(path,source){
 source=preC2WaistSource(path,source);
 const f=review.files?.find(f=>f.path===path);
 if(!f||hash(source)!==f.afterHash)return source;
 assert.equal(hash(f.beforeSource),f.beforeHash,'C3 oracle corrupted');
 return Buffer.isBuffer(source)?Buffer.from(f.beforeSource):f.beforeSource;
}
export function preC3PoseSource(source){
 assert.equal(hash(review.beforeSource),review.beforeHash,'C3 oracle corrupted');
 assert.ok([review.beforeHash,review.afterHash].includes(hash(source)),'C3 rejects unknown source');
 return Buffer.isBuffer(source)?Buffer.from(review.beforeSource):review.beforeSource;
}
export function preparePreC3PoseFiles(dir){
 assert.notEqual(realpathSync(dir),realpathSync(root),'C3 requires isolated copy');
 assert.ok(!existsSync(join(dir,'.git')),'C3 rejects Git checkout');
 const c2=preparePreC2WaistFiles(dir),sources=new Map(c2.sources);
 for(const f of review.files){const path=join(dir,f.path);if(!existsSync(path))continue;const source=c2.sources.get(f.path)??readFileSync(path);assert.ok([f.beforeHash,f.afterHash].includes(hash(source)),'C3 rejects unknown source: '+f.path);sources.set(f.path,preC3Source(f.path,source));}
 return {sources,apply(){for(const [p,s]of sources)writeFileSync(join(dir,p),s);}};
}
