// Test-only exact inverse. Never re-record historical seals.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,realpathSync,mkdtempSync,mkdirSync,cpSync,symlinkSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
export const C4_CATALOG_ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const C4_CATALOG_PATCHES=JSON.parse(readFileSync(new URL('./c4CatalogLabelsPatches.json',import.meta.url)));
const hash=x=>createHash('sha256').update(x).digest('hex');
export function preC4CatalogSource(path,source){
 const f=C4_CATALOG_PATCHES.files.find(x=>x.path===path);
 if(!f||hash(source)!==f.afterHash)return source;
 assert.equal(hash(f.beforeSource),f.beforeHash,'corrupt C4 catalog oracle');
 return Buffer.isBuffer(source)?Buffer.from(f.beforeSource):f.beforeSource;
}
export function preparePreC4CatalogFiles(directory){
 assert.notEqual(realpathSync(directory),realpathSync(C4_CATALOG_ROOT),'C4 catalog inverse requires isolated copy');
 assert.ok(!existsSync(join(directory,'.git')),'C4 catalog inverse rejects Git checkout');
 const sources=new Map(),present=C4_CATALOG_PATCHES.files.filter(f=>existsSync(join(directory,f.path)));
 if(present.some(f=>hash(readFileSync(join(directory,f.path)))===f.afterHash)){
  for(const f of present){const bytes=readFileSync(join(directory,f.path));assert.ok([f.beforeHash,f.afterHash].includes(hash(bytes)),'C4 catalog inverse rejects unknown source: '+f.path);sources.set(f.path,preC4CatalogSource(f.path,bytes));}
 }
 return {sources,apply(){for(const [path,bytes]of sources)writeFileSync(join(directory,path),bytes);}};
}
export async function withPreC4CatalogReplay(run){
 const dir=mkdtempSync(join(tmpdir(),'vps-c4-catalog-'));
 try{
  mkdirSync(join(dir,'webapp'));cpSync(join(C4_CATALOG_ROOT,'webapp/src'),join(dir,'webapp/src'),{recursive:true});
  cpSync(join(C4_CATALOG_ROOT,'webapp/package.json'),join(dir,'webapp/package.json'));
  symlinkSync(join(C4_CATALOG_ROOT,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
  preparePreC4CatalogFiles(dir).apply();return await run(dir);
 }finally{rmSync(dir,{recursive:true,force:true});}
}
