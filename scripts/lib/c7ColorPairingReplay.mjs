import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,realpathSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import patches from './c7ColorPairingPatches.json' with {type:'json'};
const root=fileURLToPath(new URL('../../',import.meta.url)),hash=s=>createHash('sha256').update(s).digest('hex');
export function preC7ColorPairingSource(path,source){
 const item=patches.files.find(p=>p.path===path);if(!item)return source;
 const sha=hash(source);if(sha===item.afterHash){assert.equal(hash(item.beforeSource),item.beforeHash,'Corrupt C7 color historical source');return Buffer.isBuffer(source)?Buffer.from(item.beforeSource):item.beforeSource;}
 assert.ok(!/imagingColorCompatibility|preC7Color/.test(source.toString()),'C7 color rejects unknown or mixed source');
 return source;
}
export function preparePreC7ColorPairingFiles(directory,{allowEarlier=false}={}){
 const resolved=realpathSync(directory);assert.notEqual(resolved,realpathSync(root),'C7 color requires isolated copy');assert.ok(!existsSync(join(directory,'.git')),'C7 color rejects Git checkout');
 const sources=new Map();for(const item of patches.files){
  const p=join(directory,item.path);if(!existsSync(p))continue;
  assert.ok(!lstatSync(p).isSymbolicLink()&&realpathSync(p).startsWith(resolved+'/'),'C7 color rejects linked source');
  const source=readFileSync(p);if(!allowEarlier)assert.ok([item.beforeHash,item.afterHash].includes(hash(source)),'C7 color rejects unknown or mixed source');const before=preC7ColorPairingSource(item.path,source);if(!source.equals(before))sources.set(item.path,before);
 }
 return {sources,apply(){for(const[p,s]of sources)writeFileSync(join(directory,p),s);}};
}
