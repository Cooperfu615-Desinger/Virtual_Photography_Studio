// Test-only inverse for approved runtime wording; reject unknown/mixed sources.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,realpathSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
export const RUNTIME_ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const RUNTIME_PATCHES=JSON.parse(readFileSync(new URL('./a2RuntimeColorPatches.json',import.meta.url)));
const hash=v=>createHash('sha256').update(v).digest('hex');
export function preA2RuntimeColorSources(sources){
  const restored={...sources},states=[];
  for(const file of RUNTIME_PATCHES.files){
    if(!Object.hasOwn(sources,file.path))continue;
    const text=sources[file.path],sha=hash(text);
    const state=sha===file.afterHash?'after':sha===file.beforeHash?'before':'unknown';
    assert.notEqual(state,'unknown','Runtime inverse rejects unreviewed source: '+file.path);states.push(state);
    let before=text;
    if(state==='after')for(const patch of file.patches){
      assert.equal(before.split(patch.after).length-1,1,'Runtime inverse requires exact patch');
      before=before.replace(patch.after,patch.before);
    }
    assert.equal(hash(before),file.beforeHash,'Runtime inverse restores fixed base');restored[file.path]=before;
  }
  assert.ok(new Set(states).size<=1,'Runtime inverse rejects mixed states');
  return restored;
}
export function preparePreA2RuntimeColorFiles(directory,{optional=false}={}){
  assert.notEqual(realpathSync(directory),realpathSync(RUNTIME_ROOT),'Runtime inverse requires an isolated tree');
  const present=RUNTIME_PATCHES.files.filter(f=>existsSync(join(directory,f.path)));
  // Small older fixture roots contain no runtime sources at all.
  if(optional&&!present.length)return {files:[],remove:[]};
  assert.equal(present.length,RUNTIME_PATCHES.files.length,'Runtime inverse rejects missing sources');
  const sources=Object.fromEntries(present.map(f=>[f.path,readFileSync(join(directory,f.path),'utf8')]));
  const restored=preA2RuntimeColorSources(sources);
  const after=hash(sources[present[0].path])===present[0].afterHash;
  const remove=[];
  for(const [path,sha]of Object.entries(RUNTIME_PATCHES.newTests)){
    if(after||existsSync(join(directory,path))){assert.equal(hash(readFileSync(join(directory,path))),sha,'Runtime inverse rejects changed test');remove.push(path);}
  }
  return {files:after?Object.entries(restored):[],remove};
}
export function applyPreA2RuntimeColorFiles(directory,prepared){
  for(const [path,text]of prepared.files)writeFileSync(join(directory,path),text);
  for(const path of prepared.remove)rmSync(join(directory,path));
}
export function restorePreA2RuntimeColorFiles(directory){
  applyPreA2RuntimeColorFiles(directory,preparePreA2RuntimeColorFiles(directory));
}
