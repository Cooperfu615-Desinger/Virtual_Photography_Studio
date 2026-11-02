import { sha256, stableJSON } from './persistenceBMigration.js';

// Stage B isolated repository. It is not connected to production startup or cloud.
// Explicit test-only database names and injected IndexedDB prevent accidental activation.
export const B_STORES = Object.freeze(['cards','syncOutbox','syncBaselines','tombstones','snapshots','meta']);
const PREFIX = 'vps-saved-cards-b-test-';

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function completed(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new DOMException('Transaction aborted', 'AbortError'));
    tx.onerror = () => {};
  });
}

export async function openIsolatedRepository({ indexedDB, name, onBlocked = () => {}, syntheticFaults = {} }) {
  if (!indexedDB || typeof indexedDB.open !== 'function' || typeof name !== 'string' || !name.startsWith(PREFIX) || name.length <= PREFIX.length) {
    throw new Error('An explicit isolated IndexedDB and test-only database name are required');
  }
  const open = indexedDB.open(name, 1);
  open.onupgradeneeded = () => {
    const db = open.result;
    for (const store of B_STORES) if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
  };
  open.onblocked = onBlocked;
  const db = await requestResult(open);
  db.onversionchange = () => db.close();

  function transact(stores, mode, schedule) {
    const tx = db.transaction(stores, mode);
    const done = completed(tx);
    let result;
    try { result = schedule(tx); } catch (error) { tx.abort(); return done.catch(() => { throw error; }); }
    return done.then(() => result);
  }
  async function get(store, key) {
    const tx = db.transaction(store, 'readonly');
    const done = completed(tx);
    const value = await requestResult(tx.objectStore(store).get(key));
    await done;
    return value;
  }
  async function all(store) {
    const tx = db.transaction(store, 'readonly');
    const done = completed(tx);
    const values = await requestResult(tx.objectStore(store).getAll());
    await done;
    return values;
  }
  function putSnapshot(id, snapshot) {
    return transact(['snapshots'], 'readwrite', tx => {
      const store = tx.objectStore('snapshots');
      // add, not put: a snapshot cannot silently replace earlier evidence.
      store.add(snapshot, id);
      if (syntheticFaults.snapshotAbort) tx.abort();
    });
  }
  function guardedMigration(generation, lease, now, action) {
    if (!lease || !Number.isFinite(now)) throw new Error('Migration lease required');
    const tx = db.transaction(['cards','meta'], 'readwrite');
    const done = completed(tx);
    let message = 'migration transaction aborted';
    const meta = tx.objectStore('meta');
    const leaseRequest = meta.get('lease');
    leaseRequest.onsuccess = () => {
      const current = leaseRequest.result;
      if (!current || current.owner !== lease.owner || current.fence !== lease.fence || current.expiresAt <= now) {
        message = 'stale migration lease'; tx.abort(); return;
      }
      const active = meta.get('activeGeneration');
      active.onsuccess = () => {
        if (active.result != null) { message = 'generation already active'; tx.abort(); return; }
        action(tx, meta);
      };
    };
    return done.catch(error => { throw new Error(message, { cause: error }); });
  }
  function stageGeneration(generation, records, lease, now, { unresolved = [], resolution = null, snapshotId = null, sourceHashes = null } = {}) {
    if (!generation || !Array.isArray(records) || !Array.isArray(unresolved)) throw new Error('Invalid staging input');
    return guardedMigration(generation, lease, now, (tx, meta) => {
      const cards = tx.objectStore('cards');
      for (const record of records) cards.add({ ...record, generation }, [generation, record.cardId]);
      meta.add({ state: 'staged', count: records.length, unresolved, resolution, snapshotId, sourceHashes }, 'generation:' + generation);
      if (syntheticFaults.stageAbort) tx.abort();
    });
  }
  function activateGeneration(generation, expectedCount, lease, now) {
    return guardedMigration(generation, lease, now, (tx, store) => {
      const staged = store.get('generation:' + generation);
      staged.onsuccess = () => {
        if (!staged.result || staged.result.state !== 'staged' || staged.result.count !== expectedCount || staged.result.unresolved?.length) { tx.abort(); return; }
        store.put({ ...staged.result, state: 'ready' }, 'generation:' + generation);
        store.add(generation, 'activeGeneration');
      };
    });
  }
  // A lease update is atomic; fencing increases even when an expired owner returns.
  function acquireLease(owner, now, duration) {
    if (!owner || !Number.isFinite(now) || !(duration > 0)) throw new Error('Invalid lease request');
    const tx = db.transaction('meta', 'readwrite');
    const done = completed(tx);
    const store = tx.objectStore('meta');
    let result;
    const req = store.get('lease');
    req.onsuccess = () => {
      const old = req.result;
      if (old && old.expiresAt > now) { result = null; return; }
      const fenceRequest = store.get('leaseFence');
      fenceRequest.onsuccess = () => {
        result = { owner, fence: Math.max(fenceRequest.result || 0, old?.fence || 0) + 1, expiresAt: now + duration };
        store.put(result.fence, 'leaseFence');
        store.put(result, 'lease');
      };
    };
    return done.then(() => result);
  }
  function releaseLease(lease) {
    const tx = db.transaction('meta', 'readwrite');
    const done = completed(tx);
    const store = tx.objectStore('meta');
    const current = store.get('lease');
    current.onsuccess = () => {
      if (current.result?.owner === lease?.owner && current.result?.fence === lease?.fence) store.delete('lease');
    };
    return done;
  }
  function markPreActivationDiverged(generation, snapshotId, snapshot) {
    const tx = db.transaction(['snapshots','meta'], 'readwrite');
    const done = completed(tx);
    const meta = tx.objectStore('meta');
    const active = meta.get('activeGeneration');
    active.onsuccess = () => {
      if (active.result != null) { tx.abort(); return; }
      const snapshots = tx.objectStore('snapshots');
      const existing = snapshots.get(snapshotId);
      existing.onsuccess = () => {
        if (existing.result === undefined) snapshots.add(snapshot, snapshotId);
        meta.put(true, 'preActivationDiverged:' + generation);
      };
    };
    return done;
  }
  function markLegacyDiverged(generation, snapshotId, snapshot) {
    const tx = db.transaction(['snapshots','meta'], 'readwrite');
    const done = completed(tx);
    const meta = tx.objectStore('meta');
    const active = meta.get('activeGeneration');
    active.onsuccess = () => {
      if (active.result !== generation) { tx.abort(); return; }
      const snapshots = tx.objectStore('snapshots');
      const existing = snapshots.get(snapshotId);
      existing.onsuccess = () => {
        if (existing.result === undefined) snapshots.add(snapshot, snapshotId);
        meta.put(true, 'legacyDiverged:' + generation);
      };
    };
    return done;
  }
  async function commitBatch({ generation, expectedRevision, lease, now, puts = [], deletes = [], operations = [], tombstones = [] }) {
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || !Number.isFinite(now) || !Array.isArray(puts) || !Array.isArray(deletes) || !Array.isArray(operations) || !Array.isArray(tombstones)) throw new Error('Invalid batch');
    const changed = [...puts.map(row => row?.cardId), ...deletes];
    if (!changed.length || changed.some(id => typeof id !== 'string' || !id) || new Set(changed).size !== changed.length) throw new Error('Invalid or duplicated card ID');
    for (const row of puts) {
      const payloadId = row.payload && Object.hasOwn(row.payload, 'v') ? row.payload.i : row.payload?.id;
      if (!row.payload || typeof row.payload !== 'object' || Array.isArray(row.payload) || payloadId !== row.cardId || !Number.isSafeInteger(row.orderKey) || row.orderKey < 0 || row.payloadHash !== await sha256(stableJSON(row.payload))) {
        throw new Error('Invalid card payload, order or hash');
      }
      if (!operations.some(op => op.cardId === row.cardId && op.kind === 'upsert')) throw new Error('Missing upsert intent');
    }
    for (const id of deletes) {
      const tombstone = tombstones.find(item => item.cardId === id);
      if (!tombstone) throw new Error('Missing deletion record');
      if (tombstone.targetUid && !operations.some(op => op.cardId === id && op.kind === 'delete' && op.targetUid === tombstone.targetUid)) throw new Error('Missing account-bound deletion intent');
    }
    if (tombstones.some(row => !deletes.includes(row.cardId))) throw new Error('Unexpected deletion record');
    if (new Set(operations.map(op => op?.opId)).size !== operations.length) throw new Error('Duplicate operation ID');
    for (const op of operations) {
      if (!op || typeof op.opId !== 'string' || !op.opId || !changed.includes(op.cardId) || !['upsert','delete'].includes(op.kind) || !(op.targetUid === null || typeof op.targetUid === 'string' && op.targetUid)) {
        throw new Error('Invalid sync intent');
      }
      const row = puts.find(item => item.cardId === op.cardId);
      if (op.kind === 'upsert' && (!row || stableJSON(op.payload) !== stableJSON(row.payload))) throw new Error('Upsert intent payload mismatch');
      if (op.kind === 'delete' && (!op.targetUid || !deletes.includes(op.cardId) || !tombstones.some(item => item.cardId === op.cardId && item.targetUid === op.targetUid))) throw new Error('Invalid deletion intent');
    }
    const stores = ['cards','meta','syncOutbox','syncBaselines','tombstones'];
    const tx = db.transaction(stores, 'readwrite');
    const done = completed(tx);
    let rejection = 'transaction aborted';
    const meta = tx.objectStore('meta');
    const stateRequest = meta.get('activeGeneration');
    stateRequest.onsuccess = () => {
      if (stateRequest.result !== generation) { rejection = 'generation not active'; tx.abort(); return; }
      const divergenceRequest = meta.get('legacyDiverged:' + generation);
      divergenceRequest.onsuccess = () => {
        if (divergenceRequest.result) { rejection = 'legacy source diverged'; tx.abort(); return; }
        const leaseRequest = meta.get('lease');
        leaseRequest.onsuccess = () => {
        const current = leaseRequest.result;
        if (!current || !lease || current.owner !== lease.owner || current.fence !== lease.fence || current.expiresAt <= now) {
          rejection = 'stale lease'; tx.abort(); return;
        }
        const revisionRequest = meta.get('revision:' + generation);
        revisionRequest.onsuccess = () => {
          const revision = revisionRequest.result || 0;
          if (revision !== expectedRevision) { rejection = 'revision conflict'; tx.abort(); return; }
          const cards = tx.objectStore('cards');
          const existingCards = cards.getAll();
          existingCards.onsuccess = () => {
          const retained = existingCards.result.filter(row => row.generation === generation && !changed.includes(row.cardId));
          const ordering = [...retained, ...puts].map(row => row.orderKey);
          if (ordering.some(value => !Number.isSafeInteger(value) || value < 0) || new Set(ordering).size !== ordering.length) {
            rejection = 'invalid or duplicate order'; tx.abort(); return;
          }
          const outbox = tx.objectStore('syncOutbox');
          const baselines = tx.objectStore('syncBaselines').openCursor();
          baselines.onsuccess = () => {
            const baseline = baselines.result;
            if (baseline) {
              const key = baseline.key;
              if (Array.isArray(key) && key[0] === generation && deletes.includes(key[2])) {
                const tombstone = tombstones.find(item => item.cardId === key[2]);
                if (tombstone.targetUid !== key[1]) { rejection = 'deletion misses known account baseline'; tx.abort(); return; }
              }
              baseline.continue();
              return;
            }
          const cursorRequest = outbox.openCursor();
          cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;
            if (cursor) {
              const op = cursor.value;
              if (op.generation === generation && deletes.includes(op.cardId) && op.kind === 'upsert') {
                if (op.targetUid === null) {
                  if (op.state === 'sending') { rejection = 'unbound operation is in flight'; tx.abort(); return; }
                  cursor.delete();
                } else {
                  const tombstone = tombstones.find(item => item.cardId === op.cardId);
                  if (tombstone.targetUid !== op.targetUid) { rejection = 'deletion misses queued account'; tx.abort(); return; }
                }
              }
              cursor.continue();
              return;
            }
            for (const row of puts) cards.put({ ...row, generation }, [generation, row.cardId]);
            for (const id of deletes) cards.delete([generation, id]);
            for (const op of operations) outbox.add({ ...op, generation, state: 'pending', revision: revision + 1 }, op.opId);
            for (const tombstone of tombstones) tx.objectStore('tombstones').put({ ...tombstone, generation, revision: revision + 1 }, [generation, tombstone.cardId]);
            meta.put(revision + 1, 'revision:' + generation);
            if (syntheticFaults.commitAbort) tx.abort();
          };
          };
          };
        };
        };
      };
    };
    return done.then(() => expectedRevision + 1, error => { throw new Error(rejection, { cause: error }); });
  }
  async function exportEntries() {
    const tx = db.transaction(B_STORES, 'readonly');
    const done = completed(tx);
    const pending = B_STORES.map(store => {
      const objectStore = tx.objectStore(store);
      return Promise.all([requestResult(objectStore.getAllKeys()), requestResult(objectStore.getAll())]);
    });
    const results = await Promise.all(pending);
    await done;
    return Object.fromEntries(B_STORES.map((name, index) => [name, { keys: results[index][0], values: results[index][1] }]));
  }
  function restoreEntries(entries) {
    if (!entries || B_STORES.some(store => !Array.isArray(entries[store]?.keys) || !Array.isArray(entries[store]?.values) || entries[store].keys.length !== entries[store].values.length)) {
      throw new Error('Invalid recovery entries');
    }
    const tx = db.transaction(B_STORES, 'readwrite');
    const done = completed(tx);
    let reason = 'Recovery transaction aborted';
    let waiting = B_STORES.length;
    for (const store of B_STORES) {
      const count = tx.objectStore(store).count();
      count.onsuccess = () => {
        if (count.result !== 0) { reason = 'Recovery target not empty'; tx.abort(); return; }
        waiting -= 1;
        if (waiting !== 0) return;
        for (const name of B_STORES) {
          const target = tx.objectStore(name);
          for (let i = 0; i < entries[name].keys.length; i += 1) {
            // A restored lease must never retain a prior owner's authority.
            if (name === 'meta' && entries[name].keys[i] === 'lease') continue;
            target.add(entries[name].values[i], entries[name].keys[i]);
          }
        }
      };
    }
    return done.catch(error => { throw new Error(reason, { cause: error }); });
  }
  return Object.freeze({ name, get, all, putSnapshot, stageGeneration, activateGeneration, acquireLease, releaseLease, markPreActivationDiverged, markLegacyDiverged, commitBatch, exportEntries, restoreEntries, close: () => db.close() });
}
