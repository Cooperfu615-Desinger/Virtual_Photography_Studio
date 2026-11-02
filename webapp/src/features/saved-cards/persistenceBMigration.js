import { withIsolatedMigrationLock } from './persistenceBCoordinator.js';

// B-stage synthetic-only source adapter and read-only migration analysis.
// This module is intentionally not imported by the production app.
const KEYS = Object.freeze(['vps.favorites','vps.prompts','vps.viewMode','vps.savedCardsMigration']);
const isolatedSources = new WeakSet();

export function makeSyntheticSource(initial = {}, { readError = null } = {}) {
  const data = new Map(Object.entries(initial));
  let markerFailure = false;
  let readFailure = readError;
  const source = Object.freeze({
    read(key) { if (readFailure) throw new DOMException('Synthetic read failure', readFailure); return data.has(key) ? data.get(key) : null; },
    // Explicit test injection; never accepts a browser Storage object.
    simulateLegacyWrite(key, raw) {
      if (!KEYS.includes(key) || typeof raw !== 'string') throw new Error('Invalid synthetic source mutation');
      data.set(key, raw);
    },
    setMarkerFailure(enabled) { markerFailure = Boolean(enabled); },
    setReadFailure(name) { readFailure = name; },
    writeSyntheticMarker(value) { if (markerFailure) throw new Error('Synthetic marker write failure'); data.set('vps.savedCardsPersistence', value); },
    dump() { return Object.fromEntries(data); },
  });
  isolatedSources.add(source);
  return source;
}

// Only the disposable browser harness origin may bind real Storage. Production
// storage is never accepted, even if a caller imports this isolated module.
export function makeIsolatedBrowserSource() {
  if (globalThis.location?.origin !== 'http://127.0.0.1:28941') throw new Error('Isolated browser test origin required');
  const storage = globalThis.localStorage;
  const source = Object.freeze({
    read(key) { return storage.getItem(key); },
    writeSyntheticMarker(value) { storage.setItem('vps.savedCardsPersistence', value); },
  });
  isolatedSources.add(source);
  return source;
}

export function watchSyntheticLegacySource({ eventTarget, onState, onError, ...migration }) {
  if (!isolatedSources.has(migration.source) || !eventTarget || typeof onState !== 'function' || typeof onError !== 'function') throw new Error('Isolated watcher required');
  let closed = false;
  let pending = Promise.resolve();
  const check = () => {
    pending = pending.then(() => stageSyntheticMigration(migration)).then(result => { if (!closed) onState(result.state); }).catch(error => { if (!closed) onError(error); });
  };
  const storageChanged = event => { if (KEYS.includes(event.key)) check(); };
  const visible = () => { if (!eventTarget.document?.hidden) check(); };
  eventTarget.addEventListener('storage', storageChanged);
  eventTarget.addEventListener('focus', check);
  eventTarget.document?.addEventListener('visibilitychange', visible);
  return Object.freeze({ check, close() {
    closed = true;
    eventTarget.removeEventListener('storage', storageChanged);
    eventTarget.removeEventListener('focus', check);
    eventTarget.document?.removeEventListener('visibilitychange', visible);
  } });
}

export async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, '0')).join('');
}

export function stableJSON(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + Array.from(value, stableJSON).join(',') + ']';
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) throw new Error('Non-JSON payload');
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stableJSON(value[k])).join(',') + '}';
}

export async function snapshotSyntheticSource(source) {
  if (!isolatedSources.has(source)) throw new Error('Synthetic source required');
  const snapshot = {};
  for (const key of KEYS) {
    const raw = source.read(key);
    if (raw !== null && typeof raw !== 'string') throw new Error('Source read failed');
    snapshot[key] = raw === null ? { status: 'absent', raw: null, hash: null } : { status: 'present', raw, hash: await sha256(raw) };
  }
  return snapshot;
}

function parseArray(entry, key, problems) {
  if (entry.status === 'absent') return [];
  try {
    const data = JSON.parse(entry.raw);
    if (Array.isArray(data)) return data;
    problems.push({ source: key, reason: 'wrong-shape' });
  } catch {
    problems.push({ source: key, reason: 'invalid-json' });
  }
  return [];
}

function sourceHashes(snapshot) {
  return Object.fromEntries(KEYS.map(key => [key, snapshot[key].hash]));
}
function markerValue(generation, snapshot) {
  return JSON.stringify({ version: 1, generation, state: 'ready', sourceHashes: sourceHashes(snapshot) });
}

export async function inspectSyntheticMigration(snapshot) {
  const unresolved = [];
  if (snapshot['vps.favorites'].status === 'absent' && snapshot['vps.prompts'].status === 'absent'
      && (snapshot['vps.viewMode'].status === 'present' || snapshot['vps.savedCardsMigration'].status === 'present')) {
    unresolved.push({ source: 'storage', reason: 'legacy-marker-without-data' });
  }
  const favorites = parseArray(snapshot['vps.favorites'], 'vps.favorites', unresolved);
  const feed = parseArray(snapshot['vps.prompts'], 'vps.prompts', unresolved);
  const byId = new Map(), selected = [];
  const idOf = item => item && typeof item === 'object' ? (Object.hasOwn(item, 'v') ? item.i : item.id) : null;
  const wanted = new Set(favorites.filter(item => typeof item === 'string'));
  const feedMatches = feed.filter(item => wanted.has(idOf(item)));
  for (const id of wanted) if (!feedMatches.some(item => idOf(item) === id)) unresolved.push({ source: 'favorites', id, reason: 'missing-id-only' });
  // Existing ID-only lookup follows feed order; object favorites retain their order.
  const candidates = [...favorites.filter(item => typeof item !== 'string'), ...feedMatches, ...feed];
  for (const [index, item] of candidates.entries()) {
    const id = idOf(item);
    if (!item || Array.isArray(item) || typeof item !== 'object' || typeof id !== 'string' || !id) {
      unresolved.push({ source: 'candidate', index, reason: 'invalid-or-missing-id' }); continue;
    }
    if (Object.hasOwn(item, 'v') && ![2,3,4].includes(item.v)) {
      unresolved.push({ source: 'candidate', index, id, reason: 'unknown-version' }); continue;
    }
    const payloadHash = await sha256(stableJSON(item));
    if (byId.has(id)) {
      if (byId.get(id) !== payloadHash) unresolved.push({ source: 'candidate', index, id, reason: 'duplicate-conflict' });
      continue;
    }
    byId.set(id, payloadHash);
    selected.push({ cardId: id, payload: structuredClone(item), payloadHash, orderKey: selected.length });
  }
  return { records: selected, unresolved };
}

export function stageSyntheticMigration(options) {
  const lockManager = Object.hasOwn(options, 'lockManager') ? options.lockManager : globalThis.navigator?.locks;
  return withIsolatedMigrationLock({ lockManager, name: options.repository.name + ':migration', operation: () => runSyntheticMigration(options) });
}

async function runSyntheticMigration({ repository, source, generation, snapshotId, owner = crypto.randomUUID(), now, clock = Date.now, duration = 60000, interruptAfter = null, afterStaging = null, beforeActivation = null, recoveryProvenance = null }) {
  if (!isolatedSources.has(source)) throw new Error('Synthetic source required');
  const checkpoint = label => { if (interruptAfter === label) throw new Error('Synthetic interruption: ' + label); };
  const time = () => now === undefined ? clock() : now;
  const lease = await repository.acquireLease(owner, time(), duration);
  if (!lease) throw new Error('Migration is locked by another owner');
  try {
  const active = await repository.get('meta', 'activeGeneration');
  let snapshot;
  try { snapshot = await snapshotSyntheticSource(source); } catch (error) {
    if (active !== generation) throw error;
    await repository.markLegacyDiverged(generation, snapshotId + ':read-error:' + crypto.randomUUID(), { status: 'read-error', name: error.name });
    return { state: 'unavailable' };
  }
  const existing = await repository.get('snapshots', snapshotId);
  if (active == null && source.read('vps.savedCardsPersistence') !== null) throw new Error('Recovery required: marker exists but database is not ready');
  if (active != null) {
    if (active !== generation || existing === undefined) throw new Error('Ready generation exists');
    if (await repository.get('meta', 'legacyDiverged:' + generation)) return { state: 'legacy-diverged' };
    if (stableJSON(existing) !== stableJSON(snapshot)) {
      const divergenceId = snapshotId + ':diverged:' + await sha256(stableJSON(snapshot));
      await repository.markLegacyDiverged(generation, divergenceId, snapshot);
      return { state: 'legacy-diverged' };
    }
    source.writeSyntheticMarker(markerValue(generation, snapshot));
    return { state: 'ready', resumed: true };
  }
  if (await repository.get('meta', 'preActivationDiverged:' + generation) || (existing !== undefined && stableJSON(existing) !== stableJSON(snapshot))) {
    const divergenceId = snapshotId + ':diverged:' + await sha256(stableJSON(snapshot));
    await repository.markPreActivationDiverged(generation, divergenceId, snapshot);
    return { state: 'legacy-diverged' };
  }
  if (existing === undefined) await repository.putSnapshot(snapshotId, snapshot);
  checkpoint('snapshot');
  const analysis = await inspectSyntheticMigration(snapshot);
  if (recoveryProvenance && stableJSON(recoveryProvenance.sourceHashes) !== stableJSON(sourceHashes(snapshot))) throw new Error('Selected recovery source differs from provenance');
  const resolution = recoveryProvenance ? { kind: 'selected-snapshot', ...recoveryProvenance } : null;
  const staged = await repository.get('meta', 'generation:' + generation);
  if (!staged) await repository.stageGeneration(generation, analysis.records, lease, time(), { unresolved: analysis.unresolved, resolution, snapshotId, sourceHashes: sourceHashes(snapshot) });
  else if (staged.state !== 'staged' || staged.count !== analysis.records.length || stableJSON(staged.unresolved || []) !== stableJSON(analysis.unresolved) || staged.snapshotId !== snapshotId || stableJSON(staged.sourceHashes) !== stableJSON(sourceHashes(snapshot)) || stableJSON(staged.resolution) !== stableJSON(resolution)) throw new Error('Staging mismatch');
  checkpoint('staging');
  if (afterStaging) await afterStaging();
  const stored = (await repository.all('cards')).filter(row => row.generation === generation).sort((a,b) => a.orderKey-b.orderKey);
  const latest = await snapshotSyntheticSource(source);
  if (stableJSON(snapshot) !== stableJSON(latest)) {
    const divergenceId = snapshotId + ':diverged:' + await sha256(stableJSON(latest));
    await repository.markPreActivationDiverged(generation, divergenceId, latest);
    return { state: 'legacy-diverged' };
  }
  if (stored.length !== analysis.records.length) throw new Error('Read-back count mismatch');
  for (const [index,row] of stored.entries()) {
    const expected = analysis.records[index];
    if (!expected || row.cardId !== expected.cardId || row.orderKey !== expected.orderKey || row.payloadHash !== expected.payloadHash || await sha256(stableJSON(row.payload)) !== row.payloadHash) {
      throw new Error('Read-back payload or order mismatch');
    }
  }
  checkpoint('readback');
  if (analysis.unresolved.length) return { state: 'unresolved', ...analysis };
  if (beforeActivation) await beforeActivation();
  await repository.activateGeneration(generation, analysis.records.length, lease, time());
  let afterActivation;
  try { afterActivation = await snapshotSyntheticSource(source); } catch (error) {
    await repository.markLegacyDiverged(generation, snapshotId + ':read-error:' + crypto.randomUUID(), { status: 'read-error', name: error.name });
    return { state: 'unavailable' };
  }
  if (stableJSON(snapshot) !== stableJSON(afterActivation)) {
    const divergenceId = snapshotId + ':diverged:' + await sha256(stableJSON(afterActivation));
    await repository.markLegacyDiverged(generation, divergenceId, afterActivation);
    return { state: 'legacy-diverged' };
  }
  checkpoint('ready');
  source.writeSyntheticMarker(markerValue(generation, snapshot));
  return { state: 'ready', ...analysis };
  } finally { await repository.releaseLease(lease); }
}

// Explicit, synthetic-only resolution of duplicate-ID conflicts. Selections
// reference an exact saved source/index; no replacement payload is accepted.
export function resolveSyntheticConflicts(options) {
  const lockManager = Object.hasOwn(options, 'lockManager') ? options.lockManager : globalThis.navigator?.locks;
  return withIsolatedMigrationLock({ lockManager, name: options.repository.name + ':migration', operation: () => runSyntheticConflictResolution(options) });
}

async function runSyntheticConflictResolution({ repository, source, generation, snapshotId, choices, owner = crypto.randomUUID(), now, clock = Date.now, duration = 60000 }) {
  if (!isolatedSources.has(source) || !Array.isArray(choices)) throw new Error('Synthetic source and explicit choices required');
  const time = () => now === undefined ? clock() : now;
  const lease = await repository.acquireLease(owner, time(), duration);
  if (!lease) throw new Error('Resolution is locked by another owner');
  try {
  if (await repository.get('meta', 'activeGeneration') != null) throw new Error('Resolution is already ready');
  const snapshot = await repository.get('snapshots', snapshotId);
  if (!snapshot || stableJSON(snapshot) !== stableJSON(await snapshotSyntheticSource(source))) throw new Error('Resolution source differs from snapshot');
  const analysis = await inspectSyntheticMigration(snapshot);
  if (!analysis.unresolved.length || analysis.unresolved.some(item => item.reason !== 'duplicate-conflict')) throw new Error('Unsupported unresolved data');
  const ids = [...new Set(analysis.unresolved.map(item => item.id))].sort();
  if (choices.length !== ids.length || stableJSON(choices.map(item => item.id).sort()) !== stableJSON(ids)) throw new Error('Every conflict needs one explicit choice');
  const records = structuredClone(analysis.records);
  for (const choice of choices) {
    if (!['vps.favorites', 'vps.prompts'].includes(choice.source) || !Number.isSafeInteger(choice.index) || choice.index < 0) throw new Error('Invalid source reference');
    const sourceRows = JSON.parse(snapshot[choice.source].raw);
    const chosen = sourceRows[choice.index];
    const id = chosen && typeof chosen === 'object' ? (Object.hasOwn(chosen, 'v') ? chosen.i : chosen.id) : null;
    if (id !== choice.id || (Object.hasOwn(chosen, 'v') && ![2,3,4].includes(chosen.v))) throw new Error('Choice does not match a supported original');
    const row = records.find(item => item.cardId === id);
    if (!row) throw new Error('Chosen card missing');
    row.payload = structuredClone(chosen);
    row.payloadHash = await sha256(stableJSON(chosen));
  }
  const resolution = { snapshotId, choices: structuredClone(choices) };
  const prior = await repository.get('meta', 'generation:' + generation);
  if (!prior) await repository.stageGeneration(generation, records, lease, time(), { resolution, snapshotId, sourceHashes: sourceHashes(snapshot) });
  else if (prior.state !== 'staged' || prior.count !== records.length || stableJSON(prior.resolution) !== stableJSON(resolution) || prior.snapshotId !== snapshotId || stableJSON(prior.sourceHashes) !== stableJSON(sourceHashes(snapshot))) throw new Error('Resolution staging mismatch');
  const stored = (await repository.all('cards')).filter(row => row.generation === generation).sort((a,b) => a.orderKey-b.orderKey);
  if (stored.length !== records.length || stableJSON(snapshot) !== stableJSON(await snapshotSyntheticSource(source))) throw new Error('Resolution readback failed');
  for (const [i,row] of stored.entries()) {
    if (row.cardId !== records[i].cardId || row.orderKey !== records[i].orderKey || row.payloadHash !== records[i].payloadHash || await sha256(stableJSON(row.payload)) !== row.payloadHash) throw new Error('Resolution payload mismatch');
  }
  await repository.activateGeneration(generation, records.length, lease, time());
  let after;
  try { after = await snapshotSyntheticSource(source); } catch (error) {
    await repository.markLegacyDiverged(generation, snapshotId + ':read-error:' + crypto.randomUUID(), { status: 'read-error', name: error.name });
    return { state: 'unavailable' };
  }
  if (stableJSON(snapshot) !== stableJSON(after)) {
    await repository.markLegacyDiverged(generation, snapshotId + ':diverged:' + await sha256(stableJSON(after)), after);
    return { state: 'legacy-diverged' };
  }
  source.writeSyntheticMarker(markerValue(generation, snapshot));
  return { state: 'ready', records, resolution };
  } finally { await repository.releaseLease(lease); }
}

// A human/test must explicitly select one immutable snapshot. A new isolated
// target is still required; this function never overwrites the old database.
export async function selectSyntheticRecoverySnapshot(repository, snapshotId) {
  if (typeof snapshotId !== 'string' || !snapshotId) throw new Error('Explicit snapshot ID required');
  const snapshot = await repository.get('snapshots', snapshotId);
  if (!snapshot) throw new Error('Selected snapshot missing');
  const values = {};
  for (const key of KEYS) {
    const entry = snapshot[key];
    if (!entry || !['absent','present'].includes(entry.status)) throw new Error('Selected snapshot is not recoverable');
    if (entry.status === 'present') {
      if (typeof entry.raw !== 'string' || await sha256(entry.raw) !== entry.hash) throw new Error('Selected snapshot hash mismatch');
      values[key] = entry.raw;
    } else if (entry.raw !== null || entry.hash !== null) throw new Error('Invalid absent source');
  }
  return { source: makeSyntheticSource(values), provenance: { snapshotId, sourceHashes: sourceHashes(snapshot) } };
}

// Backup-only package, deliberately not connected to the application import UI.
export async function exportSyntheticRecovery(repository) {
  const entries = await repository.exportEntries();
  const payload = { format: 'vps-saved-cards-b-recovery', version: 1, restoreStatus: 'backup-only', entries };
  return { ...payload, sha256: await sha256(stableJSON(payload)) };
}

export async function restoreSyntheticRecovery(repository, recovery) {
  if (!recovery || recovery.format !== 'vps-saved-cards-b-recovery' || recovery.version !== 1 || recovery.restoreStatus !== 'backup-only') {
    throw new Error('Unsupported recovery package');
  }
  const { sha256: expected, ...payload } = recovery;
  if (typeof expected !== 'string' || await sha256(stableJSON(payload)) !== expected) throw new Error('Recovery checksum mismatch');
  await repository.restoreEntries(payload.entries);
}


// The isolated recovery artifact is JSON backup-only, not a Saved Cards ZIP.
export async function exportSyntheticRecoveryBlob(repository) {
  const pack = await exportSyntheticRecovery(repository);
  return new Blob([JSON.stringify(pack)], { type: 'application/json;charset=utf-8' });
}

export async function restoreSyntheticRecoveryBlob(repository, blob) {
  if (!(blob instanceof Blob)) throw new Error('Synthetic recovery Blob required');
  let value;
  try { value = JSON.parse(await blob.text()); } catch { throw new Error('Invalid recovery JSON'); }
  await restoreSyntheticRecovery(repository, value);
}
