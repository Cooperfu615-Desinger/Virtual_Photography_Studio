import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { prepareWebappTestArguments, SEATING_MATRIX_FILES as members, SEATING_MATRIX_AGGREGATOR as aggregator } from '../../../../scripts/run_webapp_tests.mjs';
import { preTestEfficiencySource } from '../../../../scripts/lib/testEfficiencyHistoricalReplay.mjs';
import review from '../../../../scripts/lib/testEfficiencyHistory.json' with { type: 'json' };
import { seatFixture, seatFramings } from '../../lib/engine/indoorSeatFixtures.js';
import { enableSeatFixtureReuse, seatRequestKey } from '../../lib/engine/seatFixtureReuseTestSupport.js';
const root=fileURLToPath(new URL('../../../../',import.meta.url)),cwd=resolve(root,'webapp');
const absolute=p=>resolve(cwd,p);
const expand=args=>new Set(args.flatMap(p=>absolute(p)===absolute(aggregator)?members.map(absolute):[absolute(p)]));
const files=directory=>readdirSync(resolve(cwd,directory)).filter(f=>f.endsWith('.test.js')).map(f=>directory+'/'+f);

test('seat grouping preserves both complete gate file sets and every focused subset',()=>{
 const pkg=JSON.parse(readFileSync(resolve(cwd,'package.json')));
 const full=[...files('src/lib'),...files('src/lib/engine'),...readdirSync(resolve(cwd,'src/features'),{withFileTypes:true}).filter(e=>e.isDirectory()).flatMap(e=>files('src/features/'+e.name))];
 for(const selected of [full,pkg.scripts['test:prompt-quality'].split(/\s+/).slice(2)]){
  const grouped=prepareWebappTestArguments(selected,cwd);
  assert.deepEqual(expand(grouped),expand(selected));assert.equal(grouped.filter(f=>f===aggregator).length,1);
 }
 for(const selected of [[],members.slice(0,1),members.slice(0,2),members.slice(1)])assert.deepEqual(prepareWebappTestArguments(selected,cwd),selected);
 const flag=['--test-name-pattern',members[2],...members.slice(0,2)];assert.deepEqual(prepareWebappTestArguments(flag,cwd),flag);
 assert.deepEqual(prepareWebappTestArguments(['--test-concurrency','4',...members],cwd),['--test-concurrency','4',aggregator]);
 assert.deepEqual(prepareWebappTestArguments(['--',...members.map(absolute)],cwd),['--',aggregator]);
 assert.deepEqual(prepareWebappTestArguments([members[0],aggregator,...members.slice(1)],cwd),[aggregator]);
});

test('test-only inverse restores exact original bytes and leaves all unknown changes untouched',()=>{
 assert.equal(review.base,'2b43c52f8315232b316cc5fc99383ed10e6a64b5');
 for(const file of review.files){
  const current=readFileSync(resolve(root,file.path));
  const original=execFileSync('git',['show',review.base+':'+file.path],{cwd:root,maxBuffer:16*1024*1024});
  assert.equal(createHash('sha256').update(current).digest('hex'),file.afterHash,file.path);
  assert.deepEqual(preTestEfficiencySource(file.path,current),original,file.path);
  assert.equal(preTestEfficiencySource(file.path,current.toString()),original.toString());
  assert.equal(preTestEfficiencySource(file.path,original),original);
  const unknown=Buffer.concat([current,Buffer.from('\n// unknown change')]);assert.equal(preTestEfficiencySource(file.path,unknown),unknown);
 }
});

test('real cached seat fixtures match fresh stable outputs, RNG and locks without sharing mutable state',()=>{
 const args=['室內：日本學校教室','自然坐姿',seatFramings[0],{indoorSeatId:'chair'}];
 const stable=result=>{const {id,date,...prompt}=result.prompt;assert.ok(id&&date);return {...result,prompt};};
 const fresh=stable(seatFixture(...args));const session=enableSeatFixtureReuse(new Map([[seatRequestKey(...args),2]]));
 try{const first=seatFixture(...args);assert.deepEqual(stable(first),fresh);first.cards[0].value='changed';
  assert.deepEqual(stable(seatFixture(...args)),fresh);assert.equal(session.statistics().hits,1);assert.equal(session.statistics().retainedEntries,0);
 }finally{session.stop();}
 assert.deepEqual(stable(seatFixture(...args)),fresh);
});
