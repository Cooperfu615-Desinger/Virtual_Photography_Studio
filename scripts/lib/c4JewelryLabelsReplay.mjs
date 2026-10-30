import {preparePreC3PoseFiles,preC3Source} from './c3PoseReplay.mjs';
import c3Review from './c3PoseReview.json' with {type:'json'};
// Test-only exact inverse. Never re-record historical seals.
import {prePikaVideoSource, PIKA_VIDEO_PATH} from './pikaVideoReplay.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,realpathSync,mkdtempSync,mkdirSync,cpSync,symlinkSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
export const C4_JEWELRY_ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const C4_JEWELRY_PATCHES=JSON.parse(readFileSync(new URL('./c4JewelryLabelsPatches.json',import.meta.url)));
const hash=x=>createHash('sha256').update(x).digest('hex');
export function preC4JewelrySource(path,source){
 source=preC3Source(path,source);
 const f=C4_JEWELRY_PATCHES.files.find(x=>x.path===path);
 if(!f||hash(source)!==f.afterHash)return source;
 assert.equal(hash(f.beforeSource),f.beforeHash,'corrupt C4 jewelry oracle');
 return Buffer.isBuffer(source)?Buffer.from(f.beforeSource):f.beforeSource;
}
export function preparePreC4JewelryFiles(directory){
 assert.notEqual(realpathSync(directory),realpathSync(C4_JEWELRY_ROOT),'C4 jewelry inverse requires isolated copy');
 assert.ok(!existsSync(join(directory,'.git')),'C4 jewelry inverse rejects Git checkout');
 const c3Path=join(directory,c3Review.path);
 const c3=existsSync(c3Path)&&hash(readFileSync(c3Path))===c3Review.afterHash?preparePreC3PoseFiles(directory):{sources:new Map()};
 const sources=new Map(c3.sources),present=C4_JEWELRY_PATCHES.files.filter(f=>existsSync(join(directory,f.path)));
 const pikaPath=join(directory,PIKA_VIDEO_PATH);
 if(existsSync(pikaPath)){
  const source=readFileSync(pikaPath), before=prePikaVideoSource(PIKA_VIDEO_PATH,source);
  if(!source.equals(before))sources.set(PIKA_VIDEO_PATH,before);
 }
 if(present.some(f=>hash(readFileSync(join(directory,f.path)))===f.afterHash)){
  for(const f of present){const bytes=readFileSync(join(directory,f.path));assert.ok([f.beforeHash,f.afterHash].includes(hash(bytes)),'C4 jewelry inverse rejects unknown source: '+f.path);sources.set(f.path,preC4JewelrySource(f.path,bytes));}
 }
 return {sources,apply(){for(const [path,bytes]of sources)writeFileSync(join(directory,path),bytes);}};
}
export async function withPreC4JewelryReplay(run){
 const dir=mkdtempSync(join(tmpdir(),'vps-c4-jewelry-'));
 try{
  mkdirSync(join(dir,'webapp'));cpSync(join(C4_JEWELRY_ROOT,'webapp/src'),join(dir,'webapp/src'),{recursive:true});
  cpSync(join(C4_JEWELRY_ROOT,'webapp/package.json'),join(dir,'webapp/package.json'));
  symlinkSync(join(C4_JEWELRY_ROOT,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
  cpSync(join(C4_JEWELRY_ROOT,'scripts/lib'),join(dir,'scripts/lib'),{recursive:true});
  cpSync(join(C4_JEWELRY_ROOT,'knowledge_base'),join(dir,'knowledge_base'),{recursive:true});
  preparePreC4JewelryFiles(dir).apply();return await run(dir);
 }finally{rmSync(dir,{recursive:true,force:true});}
}

// Only parser match display labels are projected back for historical comparisons.
export function preC4JewelryMatchLabels(value){
 const copy=structuredClone(value);
 const review=JSON.parse(readFileSync(new URL('./c4JewelryLabelsReview.json',import.meta.url)));
 for(const match of copy.matchedControls||[]){const row=review.entries.find(e=>e.id===match.option?.id);if(row&&match.option.zh===row.after)match.option.zh=row.before;}
 return copy;
}
