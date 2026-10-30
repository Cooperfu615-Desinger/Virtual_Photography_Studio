// Test-only, byte-exact inverse. Never mutate a checkout or historical baseline.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,realpathSync,existsSync,mkdtempSync,mkdirSync,cpSync,symlinkSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import patches from './c2WaistPatches.json' with {type:'json'};
export const C2_WAIST_ROOT=fileURLToPath(new URL('../../',import.meta.url));
const hash=x=>createHash('sha256').update(x).digest('hex');
export function preC2WaistSource(path,source){
 const f=patches.files.find(f=>f.path===path);
 if(!f||hash(source)!==f.afterHash)return source;
 assert.equal(hash(f.beforeSource),f.beforeHash,'C2 corrupt oracle');
 return Buffer.isBuffer(source)?Buffer.from(f.beforeSource):f.beforeSource;
}
export function preparePreC2WaistFiles(dir){
 assert.notEqual(realpathSync(dir),realpathSync(C2_WAIST_ROOT),'C2 requires isolated copy');
 assert.ok(!existsSync(join(dir,'.git')),'C2 rejects Git checkout');
 const present=patches.files.filter(f=>existsSync(join(dir,f.path))),sources=new Map();
 // Older already-replayed states pass through; mixed current/unknown copies fail atomically.
 if(present.some(f=>hash(readFileSync(join(dir,f.path)))===f.afterHash))for(const f of present){
  const source=readFileSync(join(dir,f.path));
  assert.ok([f.beforeHash,f.afterHash].includes(hash(source)),'C2 rejects unknown source: '+f.path);
  sources.set(f.path,preC2WaistSource(f.path,source));
 }
 return {sources,apply(){for(const [p,s]of sources)writeFileSync(join(dir,p),s);}};
}
export async function withPreC2WaistReplay(run){
 const dir=mkdtempSync(join(tmpdir(),'vps-c2-waist-'));
 try{
  mkdirSync(join(dir,'webapp'));cpSync(join(C2_WAIST_ROOT,'webapp/src'),join(dir,'webapp/src'),{recursive:true});
  for(const name of ['package.json','package-lock.json'])cpSync(join(C2_WAIST_ROOT,'webapp',name),join(dir,'webapp',name));
  symlinkSync(join(C2_WAIST_ROOT,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
  cpSync(join(C2_WAIST_ROOT,'scripts'),join(dir,'scripts'),{recursive:true});
  cpSync(join(C2_WAIST_ROOT,'knowledge_base'),join(dir,'knowledge_base'),{recursive:true});
  symlinkSync(join(C2_WAIST_ROOT,'Docs'),join(dir,'Docs'),'dir');
  preparePreC2WaistFiles(dir).apply();return await run(dir);
 }finally{rmSync(dir,{recursive:true,force:true});}
}
