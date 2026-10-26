import contract from '../../../functions/src/videoModels.json' with { type: 'json' };

export const VIDEO_MODELS = contract.models;
export const VIDEO_CAMERA_PRESETS = ['固定鏡頭', '緩慢推近', '緩慢拉遠', '向左移動', '向右移動'];
export const defaultVideoDraft = () => ({ modelKey: 'wan3', duration: 5, resolution: '720P', audio: false, motion: '', camera: '' });
export function changeVideoModel(draft, modelKey) {
  const model = VIDEO_MODELS[modelKey];
  if (!Object.hasOwn(VIDEO_MODELS, modelKey)) return draft;
  return { ...draft, modelKey, duration: Math.min(model.maxDuration, Math.max(model.minDuration, draft.duration)),
    resolution: model.resolutions.find(value => value.toLowerCase() === draft.resolution?.toLowerCase()) || model.resolutions[0],
    audio: model.audioToggle ? false : true };
}
export function videoSourceRatio(source) {
  if (!source?.width || !source?.height) return 'adaptive';
  const aspect = source.width / source.height;
  return VIDEO_MODELS.seedance25.ratios.find(ratio => {
    const [w, h] = ratio.split(':').map(Number);
    return Number.isFinite(w / h) && Math.abs(aspect / (w / h) - 1) < 0.01;
  }) || 'adaptive';
}
export function videoMessage(error) {
  if (error?.code === 'functions/not-found') return '影片服務尚未部署；設定與來源圖片已保留';
  return error?.message || '影片操作失敗，請稍後再試';
}
export const VIDEO_STATUS = { preparing: '準備圖片', submitting: '正在提交', queued: '排隊中', running: '生成中',
  succeeded: '生成完成', uncertain: '等待確認，請重新查詢', failed: '生成失敗', canceled: '作業已取消',
  expired: '影片已到期', rejected: '請求未被接受', canceling: '雲端正在取消' };
export const videoIsTerminal = status => ['succeeded', 'failed', 'canceled', 'expired', 'rejected'].includes(status);

export async function getVideoSession() {
  const [{ getFunctions, httpsCallable }, { firebaseApp, firebaseAuth }] = await Promise.all([
    import('firebase/functions'), import('./firebase.js'),
  ]);
  await firebaseAuth?.authStateReady?.();
  const user = firebaseAuth?.currentUser;
  if (!user || !firebaseApp) throw new Error('請先在設定中登入 Firebase，再製作影片');
  const uid = user.uid;
  return { uid, call: async payload => {
    if (firebaseAuth.currentUser?.uid !== uid) throw new Error('登入帳號已變更，請切回原帳號查詢');
    return (await httpsCallable(getFunctions(firebaseApp), 'comfyCloudVideo', { timeout: 125000 })({ ...payload, expectedUid: uid })).data;
  } };
}

export async function prepareVideoPng(src) {
  let blob;
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error('無法讀取圖片');
    blob = await response.blob();
  } catch {
    if (!src.startsWith('https:')) throw new Error('來源圖片無法讀取，請重新開啟圖片');
    const { downloadMagnificImageViaFirebase } = await import('./magnificProxyClient.js');
    const result = await downloadMagnificImageViaFirebase({ imageUrl: src });
    blob = await (await fetch(result.src)).blob();
  }
  if (!blob.type.startsWith('image/') || blob.size > 25 * 1024 * 1024) throw new Error('來源圖片格式不符或超過 25 MB');
  const bitmap = await createImageBitmap(blob);
  try {
    if (bitmap.width < 256 || bitmap.height < 256 || bitmap.width > 8192 || bitmap.height > 8192
      || bitmap.width * bitmap.height > 32 * 1024 * 1024 || bitmap.width / bitmap.height < 0.4 || bitmap.width / bitmap.height > 2.5) {
      throw new Error('來源圖片需至少 256×256，比例介於 2:5 與 5:2；不會自動裁切');
    }
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    const png = canvas.toDataURL('image/png');
    if (png.length > 8 * 1024 * 1024 * 4 / 3 + 100) throw new Error('來源圖片轉換後超過 8 MB，請改用較小圖片');
    return { src: png, width: bitmap.width, height: bitmap.height };
  } finally { bitmap.close(); }
}

export async function downloadVideo(requestId) {
  const { firebaseApp, firebaseAuth } = await import('./firebase.js');
  const user = firebaseAuth?.currentUser;
  if (!user) throw new Error('請先登入後再下載影片');
  const blob = await collectVideoDownload(async offset => {
    const token = await user.getIdToken();
    if (firebaseAuth.currentUser?.uid !== user.uid) throw new Error('登入帳號已變更');
    const response = await fetch(`https://us-central1-${firebaseApp.options.projectId}.cloudfunctions.net/comfyCloudVideoDownload`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, offset, expectedUid: user.uid }), signal: AbortSignal.timeout(120000),
    });
    if (firebaseAuth.currentUser?.uid !== user.uid) throw new Error('登入帳號已變更，已停止下載');
    return response;
  });
  if (firebaseAuth.currentUser?.uid !== user.uid) throw new Error('登入帳號已變更，已停止下載');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `dll_video_${requestId}.mp4`;
  anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Only create a downloadable file after all bounded chunks match the same asset.
export async function collectVideoDownload(request) {
  const chunks = []; let offset = 0; let total; let assetId;
  do {
    const response = await request(offset);
    if (!response.ok) throw new Error('影片下載失敗，請先重新取得影片連結；也請確認影片服務已部署');
    const nextTotal = Number(response.headers.get('X-Video-Total'));
    const nextAsset = response.headers.get('X-Video-Asset');
    if (!Number.isSafeInteger(nextTotal) || nextTotal <= offset || nextTotal > 250 * 1024 * 1024 || !nextAsset
      || (total !== undefined && (total !== nextTotal || assetId !== nextAsset))) throw new Error('影片下載資料不一致，請重試');
    total = nextTotal; assetId = nextAsset;
    const chunk = await response.blob();
    if (!chunk.type.startsWith('video/mp4') || chunk.size !== Math.min(6 * 1024 * 1024, total - offset)) throw new Error('影片下載不完整，請重試');
    chunks.push(chunk); offset += chunk.size;
  } while (offset < total);
  return new Blob(chunks, { type: 'video/mp4' });
}

export function openVideoWorkspace(image, index) {
  window.dispatchEvent(new CustomEvent('dll-video-open', { detail: { ...image, index: index + 1 } }));
}
