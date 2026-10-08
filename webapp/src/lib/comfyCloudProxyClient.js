import { getProviderContract, normalizeProviderGenerationRequest } from './providerContract.js';

const STORAGE_KEY = 'dll_pic_pro_comfy_pending_v1';
const terminal = new Set(['succeeded', 'failed', 'canceled', 'expired', 'rejected']);
const activeStores = new WeakSet();
const LOCK_NAME = 'dll_pic_pro_comfy_sequence';
const itemStates = new Set(['planned', 'attempted', ...terminal]);

function getBrowserStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

export function readComfyPending(storage = getBrowserStorage()) {
  try { return loadTracking(storage); } catch { return { invalid: true, requestId: null }; }
}

async function withTrackingLock(storage, locks, work) {
  if (locks) return locks.request(LOCK_NAME, { ifAvailable: true }, async (lock) => {
    if (!lock) throw new Error('另一個頁面正在處理 Comfy Cloud 任務，請稍後再試');
    return work();
  });
  // Browser submissions require an origin-wide lock. The local guard is for
  // non-browser adapters/tests with isolated injected storage only.
  if (typeof window !== 'undefined') throw new Error('此瀏覽器不支援安全任務鎖，請使用支援 Web Locks 的瀏覽器');
  if (storage && activeStores.has(storage)) throw new Error('另一個頁面正在處理 Comfy Cloud 任務，請稍後再試');
  if (storage) activeStores.add(storage);
  try { return await work(); } finally { if (storage) activeStores.delete(storage); }
}

export async function clearComfyPending(storage = getBrowserStorage(), {
  locks = globalThis.navigator?.locks, expectedRequestId = readComfyPending(storage)?.requestId || null,
} = {}) {
  return withTrackingLock(storage, locks, async () => {
    if ((readComfyPending(storage)?.requestId || null) !== expectedRequestId) throw new Error('Comfy Cloud 追蹤資料已變更，請重新確認上次任務');
    storage?.removeItem(STORAGE_KEY);
  });
}

function loadTracking(storage) {
  let pending;
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    pending = raw == null ? null : JSON.parse(raw);
  } catch {
    throw new Error('無法讀取 Comfy Cloud 追蹤資料，請先確認上次任務或結束追蹤');
  }
  if (pending === null) return null;
  if (typeof pending !== 'object' || Array.isArray(pending)) throw new Error('Comfy Cloud 追蹤資料格式不符，請先確認上次任務或結束追蹤');
  const validId = (id) => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id || '');
  if (!validId(pending.requestId) || !pending.uid || !pending.modelKey) throw new Error('Comfy Cloud 追蹤資料格式不符，請先確認上次任務或結束追蹤');
  if (pending.version === undefined) return { ...pending, version: 2, count: 1, items: [{ requestId: pending.requestId, state: 'attempted' }] };
  if (pending.version !== 2 || ![1, 2].includes(pending.count) || !Array.isArray(pending.items)
    || pending.items.length !== pending.count || pending.items.some(item => !item || typeof item !== 'object')
    || pending.items[0].requestId !== pending.requestId
    || new Set(pending.items.map(item => item.requestId)).size !== pending.count
    || pending.items.some(item => !validId(item.requestId) || !itemStates.has(item.state))) {
    throw new Error('Comfy Cloud 追蹤資料格式不符，請先確認上次任務或結束追蹤');
  }
  return pending;
}

function saveTracking(storage, pending) {
  const current = loadTracking(storage);
  if (current?.requestId !== pending.requestId) throw new Error('Comfy Cloud 追蹤資料已變更，已停止提交後續圖像');
  storage.setItem(STORAGE_KEY, JSON.stringify(pending));
}

function removeTracking(storage, pending) {
  if (loadTracking(storage)?.requestId !== pending.requestId) throw new Error('Comfy Cloud 追蹤資料已變更，請確認上次任務');
  storage.removeItem(STORAGE_KEY);
}

async function getComfySession() {
  const [{ getFunctions, httpsCallable }, { firebaseApp, firebaseAuth }] = await Promise.all([
    import('firebase/functions'), import('./firebase.js'),
  ]);
  if (!firebaseApp || !firebaseAuth) throw new Error('Firebase Functions 尚未設定，無法使用 Comfy Cloud');
  await firebaseAuth.authStateReady?.();
  if (!firebaseAuth.currentUser) throw new Error('請先登入 Firebase 後再使用 Comfy Cloud');
  const functions = getFunctions(firebaseApp);
  const uid = firebaseAuth.currentUser.uid;
  return {
    uid,
    call: async (name, payload) => {
      if (firebaseAuth.currentUser?.uid !== uid) throw new Error('登入帳號已變更，已停止後續生成；請切回原帳號查詢上次任務');
      return (await httpsCallable(functions, name, { timeout: 65000 })({ ...payload, expectedUid: uid })).data;
    },
  };
}

export function formatComfyProgress(job) {
  const sequence = job.sequenceTotal > 1 ? `第 ${job.sequenceIndex}／${job.sequenceTotal} 張｜` : '';
  if (job.status === 'queued') return `${sequence}Comfy Cloud 排隊中${job.queuePosition == null ? '' : `（位置 ${job.queuePosition}）`}`;
  if (job.status === 'running') return `${sequence}Comfy Cloud 生成中…`;
  return `${sequence}Comfy Cloud：${job.status}`;
}

export async function readComfyQuotaViaFirebase(selection, { session = null } = {}) {
  const current = session || await getComfySession();
  return current.call('comfyCloudQuota', {
    modelKey: selection.modelKey, resolution: selection.resolution, aspectRatio: selection.aspectRatio,
  });
}

async function runSequence(payload, {
  onProgress, onImages, resume, session,
  storage, sleep, maxPolls,
}) {
  const { call, uid } = session || await getComfySession();
  let pending = loadTracking(storage);
  if (pending && pending.uid !== uid) throw new Error('待查詢任務屬於另一個登入帳號，請切回原帳號或結束追蹤');
  if (resume && !pending) throw new Error('沒有待查詢的 Comfy Cloud 任務');
  const maySubmit = !pending && !resume;
  let input;
  if (maySubmit) {
    const model = getProviderContract('comfyCloud').models[payload.modelKey];
    if (model && payload.aspectRatio && !model.aspectRatios.includes(payload.aspectRatio)) throw new Error('不支援的 Comfy Cloud 比例');
    if (model && payload.resolution && !model.resolutions.includes(String(payload.resolution).toLowerCase())) throw new Error('不支援的 Comfy Cloud 解析度');
    input = normalizeProviderGenerationRequest('comfyCloud', payload);
    if (!storage) throw new Error('瀏覽器儲存空間不可用，無法安全追蹤任務');
    const items = Array.from({ length: input.count }, () => ({ requestId: crypto.randomUUID(), state: 'planned' }));
    pending = { version: 2, requestId: items[0].requestId, uid, modelKey: input.modelKey, createdAt: Date.now(),
      count: input.count, resolution: input.resolution, aspectRatio: input.aspectRatio, items };
    // Do not persist prompts or signed image URLs. Each paid attempt is saved
    // before submission; recovery can only query those fixed request IDs.
    storage.setItem(STORAGE_KEY, JSON.stringify(pending));
  }
  const images = []; const errors = []; const jobs = []; let unresolved = false;
  try {
    for (let index = 0; index < pending.items.length; index += 1) {
      const item = pending.items[index];
      if (item.state === 'planned' && !maySubmit) {
        errors.push(`第 ${index + 1} 張尚未提交；本次只查詢已送出的任務，沒有新增生成或扣費`);
        continue;
      }
      try {
        let job;
        if (item.state === 'planned') {
          item.state = 'attempted';
          saveTracking(storage, pending);
          job = await call('comfyCloudSubmit', { ...input, count: 1, requestId: item.requestId,
            ...(index > 0 && Number.isSafeInteger(jobs.at(-1)?.seed) ? { previousSeed: jobs.at(-1).seed } : {}) });
        } else {
          job = await call('comfyCloudStatus', { requestId: item.requestId });
        }
        for (let attempt = 0; attempt <= maxPolls; attempt += 1) {
          await onProgress({ ...job, sequenceIndex: index + 1, sequenceTotal: pending.count });
          if (terminal.has(job.status)) break;
          if (job.status === 'uncertain') throw new Error('提交結果尚未確認；已保留追蹤且不會重送。請到 Comfy Cloud 作業佇列確認，或稍後查詢');
          if (attempt === maxPolls) throw new Error('等待逾時，任務仍在雲端執行；請按「查詢上次任務」繼續追蹤');
          await sleep(3000);
          job = await call('comfyCloudStatus', { requestId: item.requestId });
        }
        if (job.status !== 'succeeded') {
          item.state = job.status;
          saveTracking(storage, pending);
          errors.push(`第 ${index + 1} 張：${job.errors?.[0] || `Comfy Cloud 任務已${job.status === 'rejected' ? '拒絕' : job.status}`}`);
          if (maySubmit) break;
          continue;
        }
        if (job.images?.length !== 1 || !job.images[0]?.src || !job.images[0]?.mimeType?.startsWith('image/')) {
          throw new Error('Comfy Cloud 已完成，但未回傳完整的工作流最終圖像；已保留追蹤，請稍後查詢');
        }
        images.push({ ...job.images[0], meta: job.meta });
        jobs.push(job.meta || {});
        item.state = 'succeeded';
        // A storage or observer failure must stop subsequent paid calls while
        // retaining this result and its already-attempted request for recovery.
        saveTracking(storage, pending);
        await onImages([...images]);
      } catch (cause) {
        if (maySubmit) throw cause;
        unresolved = true;
        errors.push(`第 ${index + 1} 張：${cause instanceof Error ? cause.message : String(cause)}`);
      }
    }
    if (!unresolved) removeTracking(storage, pending);
    if (!images.length) throw new Error(errors[0] || 'Comfy Cloud 未回傳圖像');
    return { status: 'succeeded', images, errors, meta: { ...jobs[0], provider: 'comfyCloud',
      requestedCount: pending.count, completedCount: images.length, partial: images.length !== pending.count,
      jobs, seeds: jobs.map(job => job.seed) } };
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    error.images = [...images];
    error.meta = { provider: 'comfyCloud', requestedCount: pending.count, completedCount: images.length, jobs };
    throw error;
  }
}

export async function generateComfyViaFirebase(payload, {
  onProgress = () => {}, onImages = () => {}, resume = false, session = null,
  storage = getBrowserStorage(), sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  maxPolls = 600, locks = globalThis.navigator?.locks,
} = {}) {
  return withTrackingLock(storage, locks, () => runSequence(payload, { onProgress, onImages, resume, session, storage, sleep, maxPolls }));
}
