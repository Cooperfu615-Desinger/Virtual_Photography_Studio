#!/usr/bin/env node
// One-time D rehearsal. Produces a new external directory, never changes the repo.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { assertOutputPath, publishRehearsal } from './migrate_catalog_to_json.mjs';
import { PRE_D, readPreD, materializeDocument, encode, hash } from '../lib/catalogSemantics.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export async function materialize({sourceSha, output}) {
  assert.equal(sourceSha, PRE_D, 'Explicit reviewed pre-D source SHA required');
  const target = assertOutputPath(output, root);
  const before = await readPreD(root, sourceSha);
  const documents = before.files.map(file => {
    assert.equal(hash(readFileSync(join(root, file.path))), file.sha256, 'Source already changed or materialized: '+file.path);
    return {path:file.path, beforeSha256:file.sha256, document:materializeDocument(file.document, file.entries)};
  });
  // Check the complete candidate against the D schema before publishing anything.
  execFileSync('python3', ['-B', '-c', `import json,sys; from scripts.sync_to_json import validate_catalog_records; s=json.load(open('knowledge_base/catalog/schema.json')); docs=json.load(sys.stdin); [validate_catalog_records(s,d['document']['section'],d['document']['category'],d['document']['entries'],d['path']) for d in docs]`], {cwd:root, input:JSON.stringify(documents), encoding:'utf8', maxBuffer:8e6});
  return publishRehearsal(target, async staging => {
    for (const file of documents) {
      const path=join(staging,file.path);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,encode(file.document));
    }
    // Freeze check again immediately before publication; no overwrite on a concurrent edit.
    for (const file of before.files) assert.equal(hash(readFileSync(join(root,file.path))),file.sha256,'Source changed during rehearsal');
    const manifest={phase:'D',sourceSha,records:documents.reduce((n,f)=>n+f.document.entries.length,0),files:documents.map(f=>({path:f.path,beforeSha256:f.beforeSha256,afterSha256:hash(encode(f.document))}))};
    writeFileSync(join(staging,'manifest.json'),encode(manifest));
    return manifest;
  });
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2), options={};
  for(let i=0;i<args.length;i+=2){assert(['--source-sha','--output'].includes(args[i])&&args[i+1]&&!options[args[i]],'Usage: --source-sha FULL_SHA --output NEW_EXTERNAL_DIRECTORY');options[args[i]]=args[i+1];}
  assert(options['--output'],'External output is required');
  assert(!existsSync(options['--output']),'Refusing an existing destination');
  console.log(encode(await materialize({sourceSha:options['--source-sha'],output:options['--output']})));
}
