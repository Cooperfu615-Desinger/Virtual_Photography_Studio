// Run the original, unchanged named test against an exact pre-C4 isolated tree.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync,execFileSync} from 'node:child_process';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {C4_JEWELRY_ROOT,withPreC4JewelryReplay} from './c4JewelryLabelsReplay.mjs';
export function preC4JewelryHistoricalTest(fileUrl){return (name)=>test(name,async()=>withPreC4JewelryReplay(async directory=>{
 const env={...process.env,GIT_DIR:execFileSync('git',['-C',C4_JEWELRY_ROOT,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};delete env.NODE_TEST_CONTEXT;
 const pattern='^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$';
 const child=spawnSync(process.execPath,['--test','--test-reporter=tap','--test-name-pattern',pattern,join(directory,relative(C4_JEWELRY_ROOT,fileURLToPath(fileUrl)))],{cwd:directory,env,encoding:'utf8',maxBuffer:20*1024*1024});
 assert.equal(child.status,0,child.stdout+child.stderr);assert.match(child.stdout,/# pass 1\b/);assert.match(child.stdout,/# fail 0\b/);
}));}
