import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fixture, makeSyntheticCollection } from './lib/savedCardsPersistenceFixtures.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const sources = Object.fromEntries([
  ['repo.js', 'webapp/src/features/saved-cards/persistenceBRepository.js'],
  ['migration.js', 'webapp/src/features/saved-cards/persistenceBMigration.js'],
  ['persistenceBMigration.js', 'webapp/src/features/saved-cards/persistenceBMigration.js'],
  ['coordinator.js', 'webapp/src/features/saved-cards/persistenceBCoordinator.js'],
  ['persistenceBCoordinator.js', 'webapp/src/features/saved-cards/persistenceBCoordinator.js'],
].map(([name,path]) => [name, readFileSync(root + path, 'utf8')]));
const fixtures = {
  cards131: makeSyntheticCollection('131-large'),
  cards500: makeSyntheticCollection('500'),
  cards1000: makeSyntheticCollection('1000'),
  huge: makeSyntheticCollection('single-oversized'),
};
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
try {
  const context = await browser.newContext();
  const browserErrors = [];
  context.on('page', tab => {
    tab.on('pageerror', error => browserErrors.push('pageerror: ' + error.message));
    tab.on('console', message => { if (message.type() === 'error') browserErrors.push('console: ' + message.text()); });
  });
  const unexpected = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== 'http://127.0.0.1:28941') { unexpected.push(url.origin); return route.abort(); }
    const name = url.pathname.slice(1);
    return route.fulfill({ status: 200, contentType: name.endsWith('.js') ? 'text/javascript' : 'text/html', body: sources[name] || '<!doctype html><title>Synthetic B only</title>' });
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:28941/');
  const result = await page.evaluate(async ({ fixtures, storageCases }) => {
    const { openIsolatedRepository } = await import('/repo.js');
    const { makeSyntheticSource, stageSyntheticMigration, stableJSON, sha256, exportSyntheticRecovery, restoreSyntheticRecovery, exportSyntheticRecoveryBlob, restoreSyntheticRecoveryBlob, resolveSyntheticConflicts, selectSyntheticRecoverySnapshot } = await import('/migration.js');
    const outcomes = [];
    const ok = (condition, label) => { if (!condition) throw new Error(label); outcomes.push(label); };
    const makeRepo = name => openIsolatedRepository({ indexedDB, name: 'vps-saved-cards-b-test-' + name });
    const rowFor = async id => ({cardId:id,payload:{id},payloadHash:await sha256(stableJSON({id})),orderKey:0});
    const opFor = (id,kind='upsert',opId='op-'+id) => ({opId,cardId:id,kind,targetUid:'synthetic-user',payload:{id}});
    let rejected = false;
    try { await openIsolatedRepository({ indexedDB, name: 'vps_saved_cards' }); } catch { rejected = true; }
    ok(rejected, 'production name refused');
    for (const [name, cards] of Object.entries(fixtures)) {
      const repo = await makeRepo(name);
      const source = makeSyntheticSource({ 'vps.favorites': JSON.stringify(cards) });
      const before = source.read('vps.favorites');
      const result = await stageSyntheticMigration({ repository: repo, source, generation: 'g1', snapshotId: 's1' });
      ok(result.state === 'ready' && result.records.length === cards.length, name + ' ready and count');
      const restored = (await repo.all('cards')).sort((a,b) => a.orderKey-b.orderKey);
      ok(stableJSON(restored.map(x => x.payload)) === stableJSON(cards), name + ' exact payload and order');
      ok(source.read('vps.favorites') === before, name + ' original source unchanged');
      const marker=JSON.parse(source.read('vps.savedCardsPersistence'));
      ok(marker.version===1 && marker.generation==='g1' && typeof marker.sourceHashes['vps.favorites']==='string', name + ' marker records version and source hash');
      ok((await repo.get('meta','generation:g1')).snapshotId==='s1', name + ' generation references immutable snapshot');
      repo.close();
      const reopened = await makeRepo(name);
      ok((await reopened.get('meta','activeGeneration')) === 'g1' && (await reopened.all('cards')).length === cards.length, name + ' reopen');
      reopened.close();
    }
    const readyCases = new Set(['absent','empty-array','id-order','duplicate-same','migration-marker']);
    for (const item of storageCases) {
      const caseRepo = await makeRepo('fixture-' + item.name);
      const caseSource = makeSyntheticSource(item.keys, {readError:item.readError || null});
      let result = null, failed = false;
      try { result = await stageSyntheticMigration({repository:caseRepo,source:caseSource,generation:'g',snapshotId:'s'}); } catch { failed = true; }
      if (item.readError) {
        ok(failed && await caseRepo.get('meta','activeGeneration') == null, item.name + ' read failure does not activate');
      } else {
        const expected = readyCases.has(item.name) ? 'ready' : 'unresolved';
        ok(!failed && result.state === expected, item.name + ' classified as ' + expected);
        if (item.name === 'id-order') ok(result.records.map(x=>x.cardId).join(',') === 'legacy-a,legacy-b', 'ID-only preserves legacy feed order');
        for (const [key,raw] of Object.entries(item.keys)) ok(caseSource.read(key) === raw, item.name + ' keeps ' + key);
      }
      caseRepo.close();
    }
    const orphanRepo = await makeRepo('orphan-marker');
    const orphanSource = makeSyntheticSource({'vps.savedCardsMigration':'feed-to-favorites-v1'});
    const orphan = await stageSyntheticMigration({repository:orphanRepo,source:orphanSource,generation:'g',snapshotId:'s'});
    ok(orphan.state === 'unresolved' && await orphanRepo.get('meta','activeGeneration') == null, 'legacy marker without sources is unresolved');
    orphanRepo.close();
    for (const checkpoint of ['snapshot','staging','readback','ready']) {
      const retryRepo = await makeRepo('retry-' + checkpoint);
      const retrySource = makeSyntheticSource({ 'vps.favorites': JSON.stringify([{id:'r',grokPrompt:'原文 🧪'}]) });
      let interrupted = false;
      try { await stageSyntheticMigration({repository:retryRepo,source:retrySource,generation:'g',snapshotId:'s',interruptAfter:checkpoint}); } catch { interrupted = true; }
      const retried = await stageSyntheticMigration({repository:retryRepo,source:retrySource,generation:'g',snapshotId:'s'});
      ok(interrupted && retried.state === 'ready' && (await retryRepo.all('cards')).length === 1, checkpoint + ' interruption retry without duplication');
      retryRepo.close();
    }
    const readFailureRepo = await makeRepo('staging-read-denied');
    const readFailureSource = makeSyntheticSource({'vps.favorites':JSON.stringify([{id:'keep-on-read-failure'}])});
    let readRejected=false;
    try {await stageSyntheticMigration({repository:readFailureRepo,source:readFailureSource,generation:'g',snapshotId:'s',afterStaging:()=>readFailureSource.setReadFailure('SecurityError')});} catch {readRejected=true;}
    readFailureSource.setReadFailure(null);
    ok(readRejected && await readFailureRepo.get('meta','activeGeneration')==null && (await readFailureRepo.all('snapshots')).length===1 && readFailureSource.read('vps.favorites').includes('keep-on-read-failure'), 'read failure before ready keeps original and snapshot');
    readFailureRepo.close();
    const preRaceRepo = await makeRepo('pre-ready-race');
    const preRaceSource = makeSyntheticSource({'vps.favorites':JSON.stringify([{id:'first'}])});
    const preRaceResult = await stageSyntheticMigration({repository:preRaceRepo,source:preRaceSource,generation:'g',snapshotId:'s',afterStaging:()=>preRaceSource.simulateLegacyWrite('vps.favorites',JSON.stringify([{id:'second'}]))});
    ok(preRaceResult.state==='legacy-diverged' && await preRaceRepo.get('meta','activeGeneration')==null && (await preRaceRepo.all('snapshots')).length===2, 'pre-ready source change preserves both snapshots and blocks activation');
    const preRaceRetry = await stageSyntheticMigration({repository:preRaceRepo,source:preRaceSource,generation:'g',snapshotId:'s'});
    ok(preRaceRetry.state==='legacy-diverged' && await preRaceRepo.get('meta','activeGeneration')==null, 'pre-ready divergence cannot silently auto-resume');
    const divergentEntries=await preRaceRepo.exportEntries();
    const changedSnapshotId=divergentEntries.snapshots.keys.find(key=>String(key).startsWith('s:diverged:'));
    const chosen=await selectSyntheticRecoverySnapshot(preRaceRepo,changedSnapshotId);
    const chosenRepo=await makeRepo('explicit-snapshot-recovery');
    const chosenResult=await stageSyntheticMigration({repository:chosenRepo,source:chosen.source,generation:'g',snapshotId:'selected',recoveryProvenance:chosen.provenance});
    ok(chosenResult.state==='ready' && chosenResult.records[0].cardId==='second' && (await preRaceRepo.all('snapshots')).length===2, 'explicit snapshot choice restores to a new isolated database without overwriting originals');
    ok((await chosenRepo.get('meta','generation:g')).resolution.snapshotId===changedSnapshotId, 'snapshot recovery provenance is retained');
    chosenRepo.close(); preRaceRepo.close();
    const expiredRepo = await makeRepo('expired-during-migration');
    const expiredSource = makeSyntheticSource({'vps.favorites':JSON.stringify([{id:'expiry'}])});
    let fakeNow = 1000, expiredRejected=false;
    try { await stageSyntheticMigration({repository:expiredRepo,source:expiredSource,generation:'g',snapshotId:'s',clock:()=>fakeNow,duration:100,beforeActivation:()=>{fakeNow=1101;}}); } catch { expiredRejected=true; }
    ok(expiredRejected && await expiredRepo.get('meta','activeGeneration') == null, 'lease expiration during migration blocks activation');
    expiredRepo.close();
    const markerFailRepo = await makeRepo('marker-failure');
    const markerFailSource = makeSyntheticSource({ 'vps.favorites': JSON.stringify([{id:'marker'}]) });
    markerFailSource.setMarkerFailure(true);
    let markerFailure = false;
    try { await stageSyntheticMigration({repository:markerFailRepo,source:markerFailSource,generation:'g',snapshotId:'s'}); } catch { markerFailure = true; }
    markerFailSource.setMarkerFailure(false);
    const markerRetry = await stageSyntheticMigration({repository:markerFailRepo,source:markerFailSource,generation:'g',snapshotId:'s'});
    ok(markerFailure && markerRetry.resumed && (await markerFailRepo.all('cards')).length === 1, 'marker failure does not repeat ready migration');
    markerFailRepo.close();
    const unavailableRepo = await makeRepo('read-denied-after-ready');
    const unavailableSource = makeSyntheticSource({'vps.favorites':JSON.stringify([{id:'protected-read'}])});
    const unavailableResult = await stageSyntheticMigration({repository:unavailableRepo,source:unavailableSource,generation:'g',snapshotId:'s',beforeActivation:()=>unavailableSource.setReadFailure('SecurityError')});
    unavailableSource.setReadFailure(null);
    ok(unavailableResult.state==='unavailable' && await unavailableRepo.get('meta','legacyDiverged:g')===true && unavailableSource.read('vps.favorites').includes('protected-read'), 'read denial after activation freezes writing and preserves source');
    unavailableRepo.close();
    const raceRepo = await makeRepo('ready-race');
    const raceSource = makeSyntheticSource({ 'vps.favorites': JSON.stringify([{id:'before'}]) });
    const raceResult = await stageSyntheticMigration({repository:raceRepo,source:raceSource,generation:'g',snapshotId:'s',beforeActivation:()=>raceSource.simulateLegacyWrite('vps.favorites',JSON.stringify([{id:'after'}]))});
    ok(raceResult.state === 'legacy-diverged' && (await raceRepo.all('snapshots')).length === 2, 'old writer during activation triggers divergence after ready');
    raceRepo.close();
    const divergeRepo = await makeRepo('divergence');
    const divergeSource = makeSyntheticSource({ 'vps.favorites': JSON.stringify([{id:'x'}]) });
    await stageSyntheticMigration({ repository:divergeRepo, source:divergeSource, generation:'g', snapshotId:'s' });
    divergeSource.simulateLegacyWrite('vps.favorites', JSON.stringify([{id:'x'},{id:'new'}]));
    const diverged = await stageSyntheticMigration({ repository:divergeRepo, source:divergeSource, generation:'g', snapshotId:'s' });
    ok(diverged.state === 'legacy-diverged' && (await divergeRepo.all('snapshots')).length === 2, 'old writer divergence preserves two snapshots');
    const divergentLease = await divergeRepo.acquireLease('later', Date.now(), 60000);
    let stopped = false;
    try { await divergeRepo.commitBatch({generation:'g',expectedRevision:0,lease:divergentLease,now:Date.now(),puts:[await rowFor('no')],operations:[opFor('no')]}); } catch { stopped = true; }
    ok(stopped && (await divergeRepo.all('cards')).length === 1, 'divergence blocks subsequent mutations');
    divergeRepo.close();
    const newerName = 'vps-saved-cards-b-test-newer-schema';
    const newer = await new Promise((resolve,reject)=>{const request=indexedDB.open(newerName,2);request.onupgradeneeded=()=>request.result.createObjectStore('future');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
    newer.close();
    let versionRefused=false;
    try {await openIsolatedRepository({indexedDB,name:newerName});} catch(error) {versionRefused=error.name==='VersionError';}
    const futureDb=await new Promise((resolve,reject)=>{const request=indexedDB.open(newerName);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
    ok(versionRefused && futureDb.version===2 && futureDb.objectStoreNames.contains('future'), 'newer schema fails closed without clearing');
    futureDb.close();
    const blockedName = 'vps-saved-cards-b-test-blocked';
    const oldConnection = await new Promise((resolve,reject)=> {
      const request = indexedDB.open(blockedName,1);
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
    });
    oldConnection.onversionchange = () => {};
    let blockedObserved = false;
    const upgraded = await openIsolatedRepository({indexedDB:{open:name=>indexedDB.open(name,2)},name:blockedName,onBlocked:()=>{blockedObserved=true;oldConnection.close();}});
    ok(blockedObserved, 'blocked upgrade waits for old connection');
    upgraded.close();
    let denied = false;
    try { await openIsolatedRepository({indexedDB:{open(){throw new DOMException('synthetic denial','SecurityError');}},name:'vps-saved-cards-b-test-denied'}); } catch (error) { denied=error.name==='SecurityError'; }
    ok(denied, 'denied database opening is reported');
    const quotaRepo = await makeRepo('synthetic-quota');
    const quotaSource = makeSyntheticSource({'vps.favorites':JSON.stringify([{id:'quota-protected'}])});
    const nativeAdd = IDBObjectStore.prototype.add;
    let quotaError = '';
    IDBObjectStore.prototype.add = function(...args) {
      if (this.name === 'snapshots') throw new DOMException('Synthetic quota denial','QuotaExceededError');
      return nativeAdd.apply(this,args);
    };
    try { await stageSyntheticMigration({repository:quotaRepo,source:quotaSource,generation:'g',snapshotId:'s'}); } catch (error) { quotaError=error.name; }
    finally { IDBObjectStore.prototype.add=nativeAdd; }
    ok(quotaError==='QuotaExceededError' && await quotaRepo.get('meta','activeGeneration')==null && quotaSource.read('vps.favorites').includes('quota-protected'), 'injected quota failure preserves source and blocks ready');
    quotaRepo.close();
    for (const fault of ['snapshotAbort','stageAbort']) {
      const failingRepo = await openIsolatedRepository({indexedDB,name:'vps-saved-cards-b-test-' + fault,syntheticFaults:{[fault]:true}});
      const failingSource = makeSyntheticSource({'vps.favorites':JSON.stringify([{id:'protected',grokPrompt:'🧪'}])});
      const original=failingSource.read('vps.favorites');
      let failed=false;
      try { await stageSyntheticMigration({repository:failingRepo,source:failingSource,generation:'g',snapshotId:'s'}); } catch {failed=true;}
      ok(failed && await failingRepo.get('meta','activeGeneration') == null && (await failingRepo.all('cards')).length===0 && failingSource.read('vps.favorites')===original, fault + ' transaction abort preserves source and blocks ready');
      if (fault==='stageAbort') ok((await failingRepo.all('snapshots')).length===1, 'stage abort retains snapshot');
      failingRepo.close();
    }
    const abortRepo = await openIsolatedRepository({indexedDB,name:'vps-saved-cards-b-test-commitAbort',syntheticFaults:{commitAbort:true}});
    const abortLease = await abortRepo.acquireLease('abort',1000,100);
    await abortRepo.stageGeneration('g',[],abortLease,1000);
    await abortRepo.activateGeneration('g',0,abortLease,1000);
    let commitAborted=false;
    try {await abortRepo.commitBatch({generation:'g',expectedRevision:0,lease:abortLease,now:1001,puts:[await rowFor('abort')],operations:[opFor('abort')]});} catch {commitAborted=true;}
    ok(commitAborted && (await abortRepo.all('cards')).length===0 && (await abortRepo.all('syncOutbox')).length===0 && await abortRepo.get('meta','revision:g')==null, 'injected commit abort rolls back cards, outbox and revision');
    const batchRows=[];
    for (let index=0;index<131;index+=1) {const row=await rowFor('batch-'+index);row.orderKey=index;batchRows.push(row);}
    let batchAborted=false;
    try {await abortRepo.commitBatch({generation:'g',expectedRevision:0,lease:abortLease,now:1002,puts:batchRows,operations:batchRows.map(row=>opFor(row.cardId))});} catch {batchAborted=true;}
    ok(batchAborted && (await abortRepo.all('cards')).length===0 && (await abortRepo.all('syncOutbox')).length===0, '131-card interrupted batch is all-or-nothing');
    abortRepo.close();
    let reopenRepo=await makeRepo('write-reopen');
    const reopenLease=await reopenRepo.acquireLease('reopen',1000,100);
    await reopenRepo.stageGeneration('g',[],reopenLease,1000);
    await reopenRepo.activateGeneration('g',0,reopenLease,1000);
    await reopenRepo.commitBatch({generation:'g',expectedRevision:0,lease:reopenLease,now:1001,puts:[await rowFor('saved')],operations:[opFor('saved')]});
    reopenRepo.close();
    reopenRepo=await makeRepo('write-reopen');
    ok((await reopenRepo.all('cards')).some(x=>x.cardId==='saved') && await reopenRepo.get('meta','revision:g')===1, 'committed write survives database close and reopen');
    reopenRepo.close();
    const markerRepo = await makeRepo('marker-with-missing-db');
    const markerSource = makeSyntheticSource({ 'vps.savedCardsPersistence': '{\u0022state\u0022:\u0022ready\u0022}' });
    let markerRejected = false;
    try { await stageSyntheticMigration({repository:markerRepo,source:markerSource,generation:'g',snapshotId:'s'}); } catch { markerRejected = true; }
    ok(markerRejected && await markerRepo.get('meta','activeGeneration') == null && (await markerRepo.all('cards')).length === 0, 'existing marker with missing database never becomes empty ready');
    markerRepo.close();
    const repo = await makeRepo('conflict');
    const source = makeSyntheticSource({ 'vps.favorites': JSON.stringify([{id:'x',grokPrompt:'one'},{id:'x',grokPrompt:'two'}]) });
    const conflict = await stageSyntheticMigration({ repository: repo, source, generation: 'c1', snapshotId: 's1' });
    ok(conflict.state === 'unresolved' && await repo.get('meta','activeGeneration') == null, 'conflict never activates');
    ok((await repo.get('meta','generation:c1')).unresolved.some(x=>x.reason==='duplicate-conflict'), 'unresolved records persist in staged generation');
    const conflictPack = await exportSyntheticRecovery(repo);
    ok(conflictPack.entries.meta.values.some(x=>x?.unresolved?.some?.(item=>item.reason==='duplicate-conflict')), 'recovery package retains unresolved inventory');
    const conflictRestore=await makeRepo('conflict-restore');
    await restoreSyntheticRecovery(conflictRestore,conflictPack);
    ok(await conflictRestore.get('meta','activeGeneration') == null && (await conflictRestore.get('meta','generation:c1')).unresolved.some(x=>x.reason==='duplicate-conflict') && (await conflictRestore.all('snapshots')).length===1, 'restore preserves unresolved conflict and original snapshot without activation');
    conflictRestore.close();
    ok((await repo.get('snapshots','s1'))['vps.favorites'].raw === source.read('vps.favorites'), 'conflict snapshot retained');
    let wrongChoiceRejected = false;
    try { await resolveSyntheticConflicts({repository:repo,source,generation:'c2',snapshotId:'s1',choices:[{id:'x',source:'vps.favorites',index:5}]}); } catch { wrongChoiceRejected=true; }
    ok(wrongChoiceRejected && await repo.get('meta','activeGeneration') == null, 'fabricated conflict source rejected');
    const resolved=await resolveSyntheticConflicts({repository:repo,source,generation:'c2',snapshotId:'s1',choices:[{id:'x',source:'vps.favorites',index:1}]});
    ok(resolved.state==='ready' && resolved.records[0].payload.grokPrompt==='two' && (await repo.get('snapshots','s1'))['vps.favorites'].raw.includes('one'), 'explicit conflict choice preserves immutable original and records decision');
    ok((await repo.get('meta','generation:c2')).resolution.choices[0].index===1, 'conflict decision provenance persisted');
    repo.close();
    const badRepo = await makeRepo('bad-json');
    const bad = makeSyntheticSource({ 'vps.favorites': '{broken' });
    const badResult = await stageSyntheticMigration({ repository: badRepo, source: bad, generation: 'bad', snapshotId: 's1' });
    ok(badResult.state === 'unresolved' && await badRepo.get('meta','activeGeneration') == null, 'malformed source never activates');
    badRepo.close();
    const localDelete = await makeRepo('unbound-delete');
    const localLease = await localDelete.acquireLease('local',1000,100);
    await localDelete.stageGeneration('g',[],localLease,1000);
    await localDelete.activateGeneration('g',0,localLease,1000);
    await localDelete.commitBatch({generation:'g',expectedRevision:0,lease:localLease,now:1001,puts:[await rowFor('local')],operations:[{opId:'local-add',cardId:'local',kind:'upsert',targetUid:null,payload:{id:'local'}}]});
    await localDelete.commitBatch({generation:'g',expectedRevision:1,lease:localLease,now:1002,deletes:['local'],tombstones:[{cardId:'local',targetUid:null,payload:{id:'local'}}]});
    ok((await localDelete.all('cards')).length===0 && (await localDelete.all('syncOutbox')).length===0 && (await localDelete.all('tombstones')).length===1, 'deleting unsynced local card cancels unbound upsert without future cloud deletion');
    localDelete.close();
    const a = await makeRepo('tabs'), b = await makeRepo('tabs');
    const leaseA = await a.acquireLease('A', 1000, 100);
    await a.stageGeneration('g', [], leaseA, 1000);
    await a.activateGeneration('g', 0, leaseA, 1000);
    ok(await b.acquireLease('B', 1050, 100) === null, 'lease excludes other owner');
    ok(await b.acquireLease('A', 1050, 100) === null, 'same owner cannot steal active lease');
    const leaseB = await b.acquireLease('B', 1101, 100);
    ok(leaseB.fence > leaseA.fence, 'expired lease advances fencing token');
    let staleRejected = false;
    try { await a.commitBatch({generation:'g',expectedRevision:0,lease:leaseA,now:1102,puts:[await rowFor('lost')],operations:[opFor('lost')]}); } catch { staleRejected = true; }
    ok(staleRejected && (await a.all('cards')).length===0, 'stale writer refused');
    await b.commitBatch({generation:'g',expectedRevision:0,lease:leaseB,now:1102,puts:[await rowFor('kept')],deletes:['deleted'],operations:[opFor('kept','upsert','op'),opFor('deleted','delete')],tombstones:[{cardId:'deleted',payload:{id:'deleted'},targetUid:'synthetic-user'}]});
    let aborted = false;
    try { await b.commitBatch({generation:'g',expectedRevision:1,lease:leaseB,now:1103,puts:[await rowFor('rolled-back')],operations:[opFor('rolled-back','upsert','op')]}); } catch { aborted = true; }
    ok(aborted && !(await b.all('cards')).some(x=>x.cardId==='rolled-back') && await b.get('meta','revision:g')===1, 'duplicate outbox abort rolls back all stores');
    let wrongAccountRejected=false;
    try { await b.commitBatch({generation:'g',expectedRevision:1,lease:leaseB,now:1104,deletes:['kept'],tombstones:[{cardId:'kept',targetUid:null,payload:{id:'kept'}}]}); } catch { wrongAccountRejected=true; }
    ok(wrongAccountRejected && (await b.all('cards')).some(x=>x.cardId==='kept') && (await b.all('syncOutbox')).length===2, 'delete cannot discard known account intent');
    let mismatchRejected=false;
    const mismatched=await rowFor('mismatch'); mismatched.payload.id='other';
    try { await b.commitBatch({generation:'g',expectedRevision:1,lease:leaseB,now:1104,puts:[mismatched],operations:[opFor('mismatch')]}); } catch { mismatchRejected=true; }
    ok(mismatchRejected && (await b.all('cards')).length===1, 'card ID and hash mismatch rejected');
    let orderRejected=false;
    try { await b.commitBatch({generation:'g',expectedRevision:1,lease:leaseB,now:1104,puts:[await rowFor('duplicate-order')],operations:[opFor('duplicate-order')]}); } catch { orderRejected=true; }
    ok(orderRejected && (await b.all('cards')).length===1, 'duplicate display order rejected atomically');
    const pack = await exportSyntheticRecovery(b);
    ok(pack.restoreStatus === 'backup-only' && pack.entries.syncOutbox.values.length === 2 && pack.entries.tombstones.values.length === 1, 'recovery package includes pending operations and tombstones');
    const baselinePack=structuredClone(pack);
    baselinePack.entries.syncOutbox.keys=[];
    baselinePack.entries.syncOutbox.values=[];
    baselinePack.entries.syncBaselines.keys.push(['g','synthetic-user','kept']);
    baselinePack.entries.syncBaselines.values.push({exists:true,payloadHash:'synthetic-baseline'});
    const {sha256:ignoredHash,...baselinePayload}=baselinePack;
    baselinePack.sha256=await sha256(stableJSON(baselinePayload));
    const baselineRepo=await makeRepo('baseline-guard');
    await restoreSyntheticRecovery(baselineRepo,baselinePack);
    const baselineLease=await baselineRepo.acquireLease('baseline',1200,100);
    let baselineRejected=false;
    try {await baselineRepo.commitBatch({generation:'g',expectedRevision:1,lease:baselineLease,now:1201,deletes:['kept'],tombstones:[{cardId:'kept',targetUid:null,payload:{id:'kept'}}]});} catch {baselineRejected=true;}
    ok(baselineRejected && (await baselineRepo.all('cards')).some(x=>x.cardId==='kept'), 'known remote baseline prevents unbound deletion');
    baselineRepo.close();
    const restore = await makeRepo('restore');
    const recoveryBlob=await exportSyntheticRecoveryBlob(b);
    ok(recoveryBlob.type.startsWith('application/json') && JSON.parse(await recoveryBlob.text()).sha256===pack.sha256, 'backup-only JSON Blob preserves Unicode and checksum');
    await restoreSyntheticRecoveryBlob(restore, recoveryBlob);
    ok((await restore.get('meta','activeGeneration')) === 'g' && (await restore.all('syncOutbox')).length === 2 && (await restore.all('tombstones')).length === 1 && (await restore.all('cards')).some(x=>x.cardId==='kept'), 'recovery restores cards and outbox');
    ok(await restore.get('meta','lease') === undefined, 'recovery does not revive old lease');
    const restoredLease = await restore.acquireLease('B', 1200, 100);
    ok(restoredLease.fence > leaseB.fence, 'recovery preserves monotonic fencing');
    let rejectsOccupied = false;
    try { await restoreSyntheticRecovery(restore, pack); } catch { rejectsOccupied = true; }
    ok(rejectsOccupied && (await restore.all('cards')).length === 1, 'recovery refuses occupied target');
    const corrupted = structuredClone(pack); corrupted.entries.cards.values[0].payload.id = 'changed';
    const target = await makeRepo('corrupt-recovery');
    let rejectsCorruption = false;
    try { await restoreSyntheticRecovery(target, corrupted); } catch { rejectsCorruption = true; }
    ok(rejectsCorruption && (await target.all('cards')).length === 0, 'recovery refuses checksum mismatch');
    restore.close(); target.close();
    a.close(); b.close();
    return { outcomes, localStorageKeys: Object.keys(localStorage) };
  }, { fixtures, storageCases: fixture.storageCases });
  const webLock = await page.evaluate(async () => {
    const {withIsolatedMigrationLock}=await import('/coordinator.js');
    let release;
    const pending=new Promise(resolve=>{release=resolve});
    let entered=false;
    const first=withIsolatedMigrationLock({lockManager:navigator.locks,name:'vps-saved-cards-b-test-web-lock',operation:async()=>{entered=true;await pending;}});
    while (!entered) await new Promise(resolve=>setTimeout(resolve,5));
    let refused=false;
    try { await withIsolatedMigrationLock({lockManager:navigator.locks,name:'vps-saved-cards-b-test-web-lock',operation:()=>{}}); } catch { refused=true; }
    release(); await first;
    const fallback=await withIsolatedMigrationLock({lockManager:null,name:'vps-saved-cards-b-test-web-lock',operation:()=>42});
    return {refused,fallback};
  });
  assert.equal(webLock.refused,true);
  assert.equal(webLock.fallback,42);
  result.outcomes.push('Web Locks exclusion and explicit fallback pass');
  const transient = await context.newPage();
  await transient.goto('http://127.0.0.1:28941/');
  await transient.evaluate(async()=>{
    const {openIsolatedRepository}=await import('/repo.js');
    const {sha256,stableJSON}=await import('/migration.js');
    const repo=await openIsolatedRepository({indexedDB,name:'vps-saved-cards-b-test-page-close'});
    const lease=await repo.acquireLease('transient',1000,100);
    await repo.stageGeneration('g',[],lease,1000);
    await repo.activateGeneration('g',0,lease,1000);
    const payload={id:'closed-page',grokPrompt:'關閉前已提交 🧪'};
    const row={cardId:payload.id,payload,payloadHash:await sha256(stableJSON(payload)),orderKey:0};
    await repo.commitBatch({generation:'g',expectedRevision:0,lease,now:1001,puts:[row],operations:[{opId:'closed-op',cardId:payload.id,kind:'upsert',targetUid:null,payload}]});
  });
  await transient.close();
  const reopenedPage=await context.newPage();
  await reopenedPage.goto('http://127.0.0.1:28941/');
  const reopened=await reopenedPage.evaluate(async()=>{
    const {openIsolatedRepository}=await import('/repo.js');
    const repo=await openIsolatedRepository({indexedDB,name:'vps-saved-cards-b-test-page-close'});
    const rows=await repo.all('cards');const pending=await repo.all('syncOutbox');repo.close();
    return {rows,pending};
  });
  assert.equal(reopened.rows[0].payload.grokPrompt,'關閉前已提交 🧪');
  assert.equal(reopened.pending.length,1);
  await reopenedPage.close();
  result.outcomes.push('committed card and intent survive actual page close and reopen');
  const page2 = await context.newPage();
  await page2.goto('http://127.0.0.1:28941/');
  await page.evaluate(async () => {
    const {openIsolatedRepository}=await import('/repo.js');
    window.tabRepo=await openIsolatedRepository({indexedDB,name:'vps-saved-cards-b-test-two-real-tabs'});
    const {createIsolatedRevisionNotifier}=await import('/coordinator.js');
    window.notices=[];
    window.tabNotifier=createIsolatedRevisionNotifier({name:'vps-saved-cards-b-test-notify',Channel:BroadcastChannel,eventTarget:window,readRevision:()=>window.tabRepo.get('meta','revision:g'),onRevision:revision=>window.notices.push(revision)});
    const {sha256,stableJSON}=await import('/migration.js');
    window.makeRow=async id=>({cardId:id,payload:{id},payloadHash:await sha256(stableJSON({id})),orderKey:0});
    window.tabLease=await window.tabRepo.acquireLease('tab-one',1000,100);
    await window.tabRepo.stageGeneration('g',[],window.tabLease,1000);
    await window.tabRepo.activateGeneration('g',0,window.tabLease,1000);
  });
  await page2.evaluate(async () => {
    const {openIsolatedRepository}=await import('/repo.js');
    window.tabRepo=await openIsolatedRepository({indexedDB,name:'vps-saved-cards-b-test-two-real-tabs'});
    const {createIsolatedRevisionNotifier}=await import('/coordinator.js');
    window.tabNotifier=createIsolatedRevisionNotifier({name:'vps-saved-cards-b-test-notify',Channel:BroadcastChannel,eventTarget:window,readRevision:()=>window.tabRepo.get('meta','revision:g'),onRevision:()=>{}});
    const {sha256,stableJSON}=await import('/migration.js');
    window.makeRow=async id=>({cardId:id,payload:{id},payloadHash:await sha256(stableJSON({id})),orderKey:0});
    window.tabLease=await window.tabRepo.acquireLease('tab-two',1101,100);
  });
  const [stale,good] = await Promise.all([
    page.evaluate(async () => { try { await window.tabRepo.commitBatch({generation:'g',expectedRevision:0,lease:window.tabLease,now:1102,puts:[await window.makeRow('stale')],operations:[{opId:'stale',cardId:'stale',kind:'upsert',targetUid:null,payload:{id:'stale'}}]});return 'committed'; } catch {return 'rejected';} }),
    page2.evaluate(async () => { await window.tabRepo.commitBatch({generation:'g',expectedRevision:0,lease:window.tabLease,now:1102,puts:[await window.makeRow('new')],operations:[{opId:'new',cardId:'new',kind:'upsert',targetUid:null,payload:{id:'new'}}]});return 'committed'; }),
  ]);
  assert.equal(stale, 'rejected');
  assert.equal(good, 'committed');
  assert.deepEqual(await page.evaluate(async()=> (await window.tabRepo.all('cards')).map(x=>x.cardId)), ['new']);
  await page2.evaluate(()=>window.tabNotifier.publish());
  await page.waitForFunction(()=>window.notices.includes(1),null,{timeout:5000});
  result.outcomes.push('broadcast notifies revision and reloads from database');
  const fallback = await page.evaluate(async()=> {
    const {createIsolatedRevisionNotifier}=await import('/coordinator.js');
    let observed;
    const notifier=createIsolatedRevisionNotifier({name:'vps-saved-cards-b-test-fallback',Channel:null,eventTarget:window,readRevision:()=>window.tabRepo.get('meta','revision:g'),onRevision:revision=>{observed=revision}});
    window.dispatchEvent(new Event('focus'));
    await new Promise(resolve=>setTimeout(resolve,100));
    notifier.close();
    return observed;
  });
  assert.equal(fallback,1);
  result.outcomes.push('focus fallback reloads revision without BroadcastChannel');
  await page.evaluate(async()=>{
    const lease=await window.tabRepo.acquireLease('tab-one',1202,100);
    const row=await window.makeRow('later');row.orderKey=1;
    await window.tabRepo.commitBatch({generation:'g',expectedRevision:1,lease,now:1203,puts:[row],operations:[{opId:'later',cardId:'later',kind:'upsert',targetUid:null,payload:{id:'later'}}]});
  });
  await page2.evaluate(async()=>{
    const lease=await window.tabRepo.acquireLease('tab-two',1303,100);
    await window.tabRepo.commitBatch({generation:'g',expectedRevision:2,lease,now:1304,deletes:['new'],tombstones:[{cardId:'new',targetUid:null,payload:{id:'new'}}]});
  });
  assert.deepEqual(await page.evaluate(async()=> (await window.tabRepo.all('cards')).map(x=>x.cardId)),['later']);
  assert.deepEqual(await page2.evaluate(async()=> (await window.tabRepo.all('cards')).map(x=>x.cardId)),['later']);
  assert.equal((await page.evaluate(async()=>await window.tabRepo.all('syncOutbox'))).some(op=>op.cardId==='new'),false);
  result.outcomes.push('two real tabs add and delete without stale resurrection');

  await page.evaluate(async () => {
    const {openIsolatedRepository}=await import('/repo.js');
    const {makeIsolatedBrowserSource,stageSyntheticMigration,watchSyntheticLegacySource}=await import('/migration.js');
    localStorage.setItem('vps.favorites',JSON.stringify([{id:'synthetic-old-tab'}]));
    window.legacyRepo=await openIsolatedRepository({indexedDB,name:'vps-saved-cards-b-test-old-tab'});
    window.legacySource=makeIsolatedBrowserSource();
    await stageSyntheticMigration({repository:window.legacyRepo,source:window.legacySource,generation:'g',snapshotId:'s'});
    window.legacyState='';
    window.legacyError='';
    window.legacyWatcher=watchSyntheticLegacySource({eventTarget:window,repository:window.legacyRepo,source:window.legacySource,generation:'g',snapshotId:'s',onState:state=>{window.legacyState=state},onError:error=>{window.legacyError=error.message}});
  });
  await page2.evaluate(()=>localStorage.setItem('vps.favorites',JSON.stringify([{id:'synthetic-old-tab'},{id:'synthetic-old-new'}])));
  await page.waitForFunction(()=>window.legacyState==='legacy-diverged' || window.legacyError,null,{timeout:5000});
  assert.equal(await page.evaluate(()=>window.legacyError),'');
  assert.equal(await page.evaluate(()=>window.legacyState),'legacy-diverged');
  assert.equal(await page.evaluate(async()=> (await window.legacyRepo.all('snapshots')).length),2);
  await page.evaluate(()=>{window.legacyWatcher.close();window.legacyRepo.close()});
  result.outcomes.push('real old-tab storage event freezes and preserves divergence');
  await page.evaluate(()=>{window.tabNotifier.close();window.tabRepo.close()});
  await page2.evaluate(()=>{window.tabNotifier.close();window.tabRepo.close()});
  await page2.close();
  result.outcomes.push('two real tabs preserve new write and reject stale lease');
  assert.deepEqual(result.localStorageKeys, []);
  assert.deepEqual(unexpected, []);
  assert.deepEqual(browserErrors, []);
  console.log(JSON.stringify({ ...result, syntheticOnly: true, networkRequests: 0, browserErrors }, null, 2));
  await context.close();
} finally { await browser.close(); }
