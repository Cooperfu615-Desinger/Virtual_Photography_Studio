import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { RECOVERY_ROOT as root, restorePreA2WardrobeRecoveryFiles } from './lib/a2WardrobeColorRecoveryReplay.mjs';
import { supplySealedHistory } from './lib/a5XimendingHistoricalReplay.mjs';
const out=resolve(process.argv[2]||'/tmp/a2-recovery-history');mkdirSync(out,{recursive:true});
const directory=mkdtempSync(join(tmpdir(),'vps-a2-recovery-history-'));
try{
 for(const p of ['webapp/src','scripts','knowledge_base'])cpSync(join(root,p),join(directory,p),{recursive:true});
 for(const p of ['package.json','package-lock.json'])cpSync(join(root,'webapp',p),join(directory,'webapp',p));
 symlinkSync(join(root,'webapp/node_modules'),join(directory,'webapp/node_modules'),'dir');
 restorePreA2WardrobeRecoveryFiles(directory);
 supplySealedHistory(directory);
 const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};
 for(const [script,dest] of [['wardrobe_control_a2_outfits_acceptance.mjs','a2-outfits'],['wardrobe_control_a2_outfits_history.mjs','earlier']])
  process.stdout.write(execFileSync(process.execPath,[join(directory,'scripts',script),join(out,dest)],{cwd:directory,env,encoding:'utf8',maxBuffer:32*1024*1024}));
}finally{rmSync(directory,{recursive:true,force:true});}
