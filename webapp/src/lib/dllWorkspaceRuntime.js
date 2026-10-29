import { createDllWorkspaceController } from './dllWorkspaceController.js';
import { generateOpenAISequence } from './openaiImageSequence.js';
import { dllWorkspaceStorage, configureDllAcceptanceStorage } from './dllWorkspaceStorage.js';
import { generateDllPicImages, getDllPicModelConfig, getDllPicApiKeyStorageKeys } from './dllPicProClient.js';
import { generateComfyViaFirebase, getComfySession, readComfyPending } from './comfyCloudProxyClient.js';
import { downloadMagnificImageViaFirebase } from './magnificProxyClient.js';
import { prepareVideoPng } from './comfyVideoClient.js';

export async function preserveDllImage(image) {
  let blob;
  try {
    const response = await fetch(image.src, { credentials: 'omit' });
    if (!response.ok) throw new Error('圖片讀取失敗');
    blob = await response.blob();
  } catch {
    const response = await downloadMagnificImageViaFirebase({ imageUrl: image.src });
    blob = await (await fetch(response.src)).blob();
  }
  if (!blob.type.startsWith('image/') || blob.size > 40 * 1024 * 1024) throw new Error('圖片無法保存在本機，請先下載原圖');
  const src = await new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob);
  });
  const bitmap = await createImageBitmap(blob);
  const dimensions = { width: bitmap.width, height: bitmap.height }; bitmap.close();
  return { ...image, ...dimensions, src, expiresAt: null };
}
const isComfy = task => task.snapshot.kind === 'upscale' || task.snapshot.legacy || getDllPicModelConfig(task.snapshot.modelKey).provider === 'comfyCloud';
async function submissionSession(task) {
  try {
    const session = await getComfySession();
    if (session.uid !== task.owner) throw new Error('登入帳號已變更');
    return session;
  } catch (error) { error.terminal = true; throw error; }
}
async function workspaceCall(payload) {
  const session = await getComfySession();
  return session.call('comfyCloudImageWorkspace', payload).catch(error => {
    if (error.code === 'functions/not-found') error.message = '圖片放大與取消服務尚未部署；請先使用本機模擬模式驗收。';
    throw error;
  });
}
async function trackUpscale(task, observers, recovery) {
  const session = recovery ? await getComfySession() : await submissionSession(task);
  if (session.uid !== task.owner) throw new Error('登入帳號已變更');
  const call = payload => session.call('comfyCloudImageWorkspace', payload);
  let job;
  if (recovery) job = await call({ action: 'status', requestId: task.id });
  else {
    await observers.onProgress({ status: 'preparing' });
    const png = await prepareVideoPng(task.snapshot.sourceImage.src);
    const source = await call({ action: 'prepare', sourceId: crypto.randomUUID(), src: png.src });
    await observers.onProgress({ status: 'submitting', requestId: task.id });
    job = await call({ action: 'submit', requestId: task.id, sourceId: source.sourceId, scale: task.snapshot.scale });
  }
  for (let attempt = 0; attempt < 600; attempt++) {
    await observers.onProgress({ ...job, requestId: task.id });
    if (job.status === 'succeeded') { await observers.onImages(job.images); return job; }
    if (['failed', 'canceled', 'expired', 'rejected'].includes(job.status)) {
      const error = new Error(job.errors?.[0] || '放大任務未完成'); error.terminal = true; error.canceled = job.status === 'canceled'; throw error;
    }
    if (job.status === 'uncertain') throw new Error('放大提交結果尚未確認，請稍後查詢，不會自動重送');
    await new Promise(resolve => setTimeout(resolve, 3000));
    job = await call({ action: 'status', requestId: task.id });
  }
  throw new Error('等待較久，請稍後查詢放大任務');
}
const runtimeOptions = {
  storage: dllWorkspaceStorage, materialize: preserveDllImage, pending: readComfyPending,
  async execute(task, observers) {
    if (task.snapshot.kind === 'upscale') return trackUpscale(task, observers, false).catch(error => {
      if (error.code === 'functions/not-found') { error.terminal = true; error.message = '圖片放大服務尚未部署；本次未送出放大。請先使用本機模擬模式驗收。'; }
      throw error;
    });
    const model = getDllPicModelConfig(task.snapshot.modelKey);
    if (model.provider === 'openai') {
      const session = await submissionSession(task);
      const [{ getFunctions, httpsCallable }, { firebaseApp }] = await Promise.all([import('firebase/functions'), import('./firebase.js')]);
      const call = httpsCallable(getFunctions(firebaseApp, 'us-central1'), 'openAIImageGenerate', { timeout: 310000 });
      return generateOpenAISequence(task, { ...observers, submit: async payload => (await call({ ...payload, expectedUid: session.uid })).data });
    }
    if (model.provider === 'comfyCloud') {
      await submissionSession(task);
    }
    const apiKey = getDllPicApiKeyStorageKeys(task.snapshot.modelKey).map(key => localStorage.getItem(key)).find(Boolean) || '';
    if (!model.usesServerProxy && !apiKey) {
      const error = new Error('請先設定此模型的 API Key'); error.terminal = true; throw error;
    }
    return generateDllPicImages({ ...task.snapshot, seed: task.snapshot.seed === '' ? undefined : Number(task.snapshot.seed),
      requestId: task.id, apiKey, comfyGenerate: generateComfyViaFirebase, ...observers }).catch(error => {
        if (error.code === 'functions/not-found') { error.terminal = true; error.message = '指定 Seed 服務尚未部署；本次未送出生成。可先使用隨機 Seed，或在本機模擬模式驗收。'; }
        throw error;
      });
  },
  async resume(task, observers) {
    if (!isComfy(task)) throw new Error('此服務無法查詢中斷任務；請先至供應商確認，完成核對後可沿用設定手動生成');
    if (task.snapshot.kind === 'upscale') return trackUpscale(task, observers, true);
    const marker = readComfyPending();
    if (marker && marker.requestId !== task.id) throw new Error('待查詢標記屬於另一筆任務，請先查詢該任務');
    if (marker) return generateComfyViaFirebase({}, { resume: true, ...observers });
    // A crash can occur after server completion/local persistence but before task finalization.
    const session = await getComfySession();
    if (session.uid !== task.owner) throw new Error('登入帳號已變更');
    const job = await session.call('comfyCloudStatus', { requestId: task.requestId || task.id });
    if (job.status !== 'succeeded') throw new Error('任務仍待確認，請稍後再查詢');
    const combined = [...(task.images || [])];
    for (const image of job.images || []) {
      if (!combined.some(existing => image.assetId && existing.assetId === image.assetId)) combined.push(image);
    }
    await observers.onImages(combined);
    return { ...job, meta: { ...job.meta, partial: combined.length < task.snapshot.count } };
  },
  async cancel(task) {
    if (!isComfy(task)) throw new Error('此服務不支援取消已送出的任務');
    return workspaceCall({ action: 'cancel', kind: task.snapshot.kind, requestId: task.requestId || task.id });
  },
};
export const DLL_LOCAL_ACCEPTANCE = import.meta.env.DEV && new URLSearchParams(window.location.search).get('dllAcceptance') === '1';
if (DLL_LOCAL_ACCEPTANCE) {
  configureDllAcceptanceStorage();
  const { acceptanceOptions } = await import('./dllWorkspaceAcceptance.js');
  Object.assign(runtimeOptions, acceptanceOptions(dllWorkspaceStorage, preserveDllImage, new URL('character-cards/eleanor/41_Eleanor_00.avif', window.location.href).href));
}
export const dllWorkspace = createDllWorkspaceController(runtimeOptions);
export function openDllWorkspace(detail = {}) {
  window.dispatchEvent(new CustomEvent('dll-workspace-open', { detail }));
}
