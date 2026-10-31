// Test-only exact inverse. Product sources and historical seals are never rewritten.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,realpathSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import patch from './c7NightLightingPatch.json' with {type:'json'};
const root=fileURLToPath(new URL('../../',import.meta.url));
const hash=s=>createHash('sha256').update(s).digest('hex');
export function preC7NightLightingSource(path,source){
 if(path!==patch.path)return source;
 const text=source.toString(),sha=hash(source);
 if(sha!==patch.afterHash){
  // Older replay stages pass through. An edited C7 implementation must be reviewed.
  assert.ok(!text.includes('nightPartyAllowsRandomAmbient'),'C7 rejects unknown or mixed source');
  return source;
 }
 let before=text;
 for(const p of patch.patches){assert.equal(before.split(p.after).length,2,'C7 inverse fragment must be unique');before=before.replace(p.after,p.before);}
 assert.equal(hash(before),patch.beforeHash,'C7 inverse must reproduce trusted Git bytes');
 return Buffer.isBuffer(source)?Buffer.from(before):before;
}
export function preparePreC7NightLightingFiles(directory){
 const resolved=realpathSync(directory);
 assert.notEqual(resolved,realpathSync(root),'C7 requires isolated copy');
 assert.ok(!existsSync(join(directory,'.git')),'C7 rejects Git checkout');
 const sources=new Map(),path=join(directory,patch.path);
 if(existsSync(path)){
  assert.ok(!lstatSync(path).isSymbolicLink()&&realpathSync(path).startsWith(resolved+'/'),'C7 rejects linked source');
  const source=readFileSync(path),before=preC7NightLightingSource(patch.path,source);
  if(!source.equals(before))sources.set(patch.path,before);
 }
 return {sources,apply(){for(const [p,s]of sources)writeFileSync(join(directory,p),s);}};
}
