import { normalizeProviderGenerationRequest } from './providerContract.js';

const STORAGE_KEY = 'dll_pic_pro_comfy_pending_v1';
const terminal = new Set(['succeeded', 'failed', 'canceled', 'expired', 'rejected']);

function getBrowserStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

export function readComfyPending(storage = getBrowserStorage()) {
  try { return JSON.parse(storage?.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}

export function clearComfyPending(storage = getBrowserStorage()) {
  storage?.removeItem(STORAGE_KEY);
}

async function getComfySession() {
  const [{ getFunctions, httpsCallable }, { firebaseApp, firebaseAuth }] = await Promise.all([
    import('firebase/functions'), import('./firebase.js'),
  ]);
  if (!firebaseApp || !firebaseAuth) throw new Error('Firebase Functions 尚未設定，無法使用 Comfy Cloud');
  await firebaseAuth.authStateReady?.();
  if (!firebaseAuth.currentUser) throw new Error('請先登入 Firebase 後再使用 Comfy Cloud');
  const functions = getFunctions(firebaseApp);
  return {
    uid: firebaseAuth.currentUser.uid,
    call: async (name, payload) => (await httpsCallable(functions, name, { timeout: 65000 })(payload)).data,
  };
}

export function formatComfyProgress(job) {
  if (job.status === 'queued') return `Comfy Cloud 排隊中${job.queuePosition == null ? '' : `（位置 ${job.queuePosition}）`}`;
  if (job.status === 'running') return 'Comfy Cloud 生成中…';
  return `Comfy Cloud：${job.status}`;
}

export async function generateComfyViaFirebase(payload, {
  onProgress = () => {}, resume = false, session = null,
  storage = getBrowserStorage(), sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  maxPolls = 600,
} = {}) {
  const { call, uid } = session || await getComfySession();
  let pending = readComfyPending(storage);
  if (pending && pending.uid !== uid) throw new Error('待查詢任務屬於另一個登入帳號，請切回原帳號或結束追蹤');
  if (resume && !pending) throw new Error('沒有待查詢的 Comfy Cloud 任務');
  let job;
  if (pending) {
    job = await call('comfyCloudStatus', { requestId: pending.requestId });
  } else {
    const input = normalizeProviderGenerationRequest('comfyCloud', payload);
    pending = { requestId: crypto.randomUUID(), uid, modelKey: input.modelKey, createdAt: Date.now() };
    // Fail before the paid call if persistence is unavailable.
    if (!storage) throw new Error('瀏覽器儲存空間不可用，無法安全追蹤任務');
    storage.setItem(STORAGE_KEY, JSON.stringify(pending));
    job = await call('comfyCloudSubmit', { ...input, requestId: pending.requestId });
  }
  for (let attempt = 0; attempt <= maxPolls; attempt += 1) {
    onProgress(job);
    if (terminal.has(job.status)) {
      clearComfyPending(storage);
      if (job.status !== 'succeeded') throw new Error(job.errors?.[0] || `Comfy Cloud 任務已${job.status === 'rejected' ? '拒絕' : job.status}`);
      if (!job.images?.length) throw new Error('Comfy Cloud 已完成，但未回傳工作流最終圖像');
      return job;
    }
    if (job.status === 'uncertain') throw new Error('提交結果尚未確認；已保留追蹤且不會重送。請到 Comfy Cloud 作業佇列確認，或稍後查詢');
    if (attempt === maxPolls) break;
    await sleep(3000);
    job = await call('comfyCloudStatus', { requestId: pending.requestId });
  }
  throw new Error('等待逾時，任務仍在雲端執行；請按「查詢上次任務」繼續追蹤');
}
