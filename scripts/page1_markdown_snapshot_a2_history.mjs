import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { SNAPSHOT_ROOT as root, restorePreA2MarkdownSnapshotFiles } from './lib/a2MarkdownSnapshotReplay.mjs';
import { supplySealedHistory } from './lib/a5XimendingHistoricalReplay.mjs';
const out=resolve(process.argv[2]||'/tmp/a2-markdown-history');mkdirSync(out,{recursive:true});
const directory=mkdtempSync(join(tmpdir(),'vps-a2-markdown-history-'));
try{
 for(const p of ['webapp/src','scripts','knowledge_base'])cpSync(join(root,p),join(directory,p),{recursive:true});
 for(const p of ['package.json','package-lock.json'])cpSync(join(root,'webapp',p),join(directory,'webapp',p));
 symlinkSync(join(root,'webapp/node_modules'),join(directory,'webapp/node_modules'),'dir');
 restorePreA2MarkdownSnapshotFiles(directory);
 supplySealedHistory(directory);
 cpSync(join(root,'Docs/reports/wardrobe-control-a2-outfits-2026-10-27'),join(directory,'Docs/reports/wardrobe-control-a2-outfits-2026-10-27'),{recursive:true});
 const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};
 for(const [script,dest] of [['wardrobe_color_recovery_a2_acceptance.mjs','a2-recovery'],['wardrobe_color_recovery_a2_history.mjs','earlier']])
  process.stdout.write(execFileSync(process.execPath,[join(directory,'scripts',script),join(out,dest)],{cwd:directory,env,encoding:'utf8',maxBuffer:32*1024*1024}));
}finally{rmSync(directory,{recursive:true,force:true});}
