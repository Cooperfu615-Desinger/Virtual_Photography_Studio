import {preC2SceneOpticsSource,preparePreC2SceneOpticsFiles} from './c2SceneOpticsReplay.mjs';
// Exact test-only inverse; reject checkouts and unknown or incomplete trees.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,realpathSync,existsSync,mkdtempSync,mkdirSync,cpSync,symlinkSync,rmSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import patches from './c2OutfitPatches.json' with {type:'json'};
export const C2_OUTFIT_ROOT=fileURLToPath(new URL('../../',import.meta.url));
const hash=x=>createHash('sha256').update(x).digest('hex');
export function preC2OutfitSource(path,source){
 source=preC2SceneOpticsSource(path,source);
 const f=patches.files.find(f=>f.path===path);if(!f)return source;
 if(hash(source)!==f.afterHash)return source;
 assert.equal(hash(f.beforeSource),f.beforeHash,'C2 outfit corrupt oracle');
 return Buffer.isBuffer(source)?Buffer.from(f.beforeSource):f.beforeSource;
}
export function preparePreC2OutfitFiles(dir){
 assert.notEqual(realpathSync(dir),realpathSync(C2_OUTFIT_ROOT),'C2 outfit requires isolated copy');
 assert.ok(!existsSync(join(dir,'.git')),'C2 outfit rejects Git checkout');
 const scene=preparePreC2SceneOpticsFiles(dir);
 const present=patches.files.filter(f=>existsSync(join(dir,f.path))),sources=new Map(scene.sources);
 const read=f=>scene.sources.get(f.path)??readFileSync(join(dir,f.path));
 for(const f of present){const p=join(dir,f.path);assert.ok(!lstatSync(p).isSymbolicLink()&&realpathSync(p).startsWith(realpathSync(dir)+'/'),'C2 outfit rejects linked source');}
 if(present.some(f=>hash(read(f))===f.afterHash)){
  // Some historical consumers deliberately copy only runtime files.
  for(const f of present){const source=read(f);assert.ok([f.beforeHash,f.afterHash].includes(hash(source)),'C2 outfit rejects unknown source: '+f.path);sources.set(f.path,preC2OutfitSource(f.path,source));}
 }
 return {sources,apply(){for(const [p,s]of sources)writeFileSync(join(dir,p),s);}};
}
export async function withPreC2OutfitReplay(run){
 const dir=mkdtempSync(join(tmpdir(),'vps-c2-outfit-'));
 try{
  mkdirSync(join(dir,'webapp'));cpSync(join(C2_OUTFIT_ROOT,'webapp/src'),join(dir,'webapp/src'),{recursive:true});
  for(const name of ['package.json','package-lock.json'])cpSync(join(C2_OUTFIT_ROOT,'webapp',name),join(dir,'webapp',name));
  symlinkSync(join(C2_OUTFIT_ROOT,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
  cpSync(join(C2_OUTFIT_ROOT,'scripts'),join(dir,'scripts'),{recursive:true});cpSync(join(C2_OUTFIT_ROOT,'knowledge_base'),join(dir,'knowledge_base'),{recursive:true});
  symlinkSync(join(C2_OUTFIT_ROOT,'Docs'),join(dir,'Docs'),'dir');
  preparePreC2OutfitFiles(dir).apply();return await run(dir);
 }finally{rmSync(dir,{recursive:true,force:true});}
}
