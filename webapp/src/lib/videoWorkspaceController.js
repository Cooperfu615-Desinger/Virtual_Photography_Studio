import { changeVideoModel, defaultVideoDraft, getVideoSession, prepareVideoPng, videoIsTerminal, videoMessage } from './comfyVideoClient.js';
import { videoStorage } from './videoWorkspaceStorage.js';

const initial = () => ({ uid: null, ready: false, open: false, source: null, draft: defaultVideoDraft(), results: [],
  pending: null, busy: false, status: '', error: '', notice: '', tab: 'source', selected: null });

export function createVideoController({ storage = videoStorage, session = getVideoSession, prepare = prepareVideoPng,
  locks = globalThis.navigator?.locks, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), maxPolls = 360,
  uuid = () => crypto.randomUUID() } = {}) {
  let state = initial(); let epoch = 0; let saving = Promise.resolve();
  const listeners = new Set();
  const emit = patch => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  const saved = () => ({ source: state.source, draft: state.draft, results: state.results, selected: state.selected });
  const persist = () => {
    if (!state.uid) return Promise.resolve();
    const uid = state.uid; const snapshot = saved();
    saving = saving.catch(() => {}).then(() => storage.save(uid, snapshot));
    return saving;
  };
  const saveDraft = () => { const stamp = epoch; void persist().catch(error => { if (stamp === epoch) emit({ error: videoMessage(error) }); }); };
  const check = stamp => { if (stamp !== epoch) throw new Error('登入帳號已變更，已停止查詢'); };
  async function locked(work) {
    if (!locks) throw new Error('此瀏覽器不支援安全任務鎖，請改用支援 Web Locks 的瀏覽器');
    return locks.request('dll_video_generation_v1', { ifAvailable: true }, lock => {
      if (!lock) throw new Error('另一個頁面正在處理影片作業，請稍後再試');
      return work();
    });
  }
  async function track(current, marker, stamp, firstJob) {
    let job = firstJob || await current.call({ action: 'status', requestId: marker.requestId });
    for (let attempt = 0; attempt <= maxPolls; attempt += 1) {
      check(stamp);
      emit({ status: job.status });
      if (videoIsTerminal(job.status)) {
        if (job.status === 'succeeded' && (!job.video?.src || job.video.mimeType !== 'video/mp4')) throw new Error('影片尚未取得，請重新查詢；不會重新生成');
        if (job.status === 'succeeded') {
          const result = { requestId: marker.requestId, sourceId: marker.sourceId, draft: { ...state.draft }, ...job, createdAt: marker.createdAt };
          emit({ results: [...state.results.filter(r => r.requestId !== marker.requestId), result], selected: marker.requestId, tab: 'video' });
          await persist(); check(stamp);
        }
        storage.setPending(current.uid, null);
        emit({ pending: null, error: job.status === 'succeeded' ? '' : (job.error || '影片未完成，設定已保留，可調整後再生成') });
        return;
      }
      if (job.status === 'uncertain') throw new Error('提交結果尚未確認，請稍後重新查詢或至 Comfy Cloud 確認；不會自動重送');
      if (attempt === maxPolls) throw new Error('等待較久，可稍後重新查詢；雲端作業不會因此取消');
      await sleep(5000); check(stamp);
      job = await current.call({ action: 'status', requestId: marker.requestId });
    }
  }
  async function run(resume) {
    if (state.busy || !state.ready) return;
    const stamp = epoch;
    emit({ busy: true, error: '', notice: '' });
    try {
      await locked(async () => {
        const current = await session(); check(stamp);
        if (current.uid !== state.uid) throw new Error('登入帳號已變更');
        const pending = storage.pending(current.uid);
        if (pending) { emit({ pending }); return track(current, pending, stamp); }
        if (resume) throw new Error('沒有待查詢影片');
        if (!state.source) throw new Error('請先選擇生成圖片');
        if (!state.draft.motion.trim()) throw new Error('請填寫動作描述');
        const draft = { ...state.draft }; const source = { ...state.source };
        emit({ status: 'preparing' });
        const png = await prepare(source.src); check(stamp);
        const sourceId = source.id;
        emit({ source: { ...source, ...png } });
        await persist(); check(stamp);
        // A new upload identity permits recovery from an unconfirmed upload;
        // this never retries a paid video submission.
        const upload = await current.call({ action: 'prepare', sourceId: uuid(), src: png.src }); check(stamp);
        const marker = { requestId: uuid(), uid: current.uid, sourceId, createdAt: Date.now() };
        storage.setPending(current.uid, marker);
        emit({ pending: marker, status: 'submitting' });
        const job = await current.call({ action: 'submit', ...draft, sourceId: upload.sourceId, requestId: marker.requestId });
        await track(current, marker, stamp, job);
      });
    } catch (error) { if (stamp === epoch) emit({ error: videoMessage(error) }); }
    finally { if (stamp === epoch) emit({ busy: false }); }
  }
  return {
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }, getSnapshot: () => state,
    async setUser(uid) {
      const stamp = ++epoch;
      const anonymous = !state.uid ? { source: state.source, draft: state.draft, open: state.open } : {};
      emit({ ...initial(), ...anonymous, uid });
      if (!uid) { emit({ ready: true }); return; }
      try {
        const data = await storage.load(uid); check(stamp);
        const pending = storage.pending(uid);
        emit({ ...(data || {}), ...(anonymous.source ? anonymous : {}), uid, pending, ready: true });
        if (pending) await run(true);
      } catch (error) { if (stamp === epoch) emit({ ready: false, error: videoMessage(error) }); }
    },
    open(image) {
      if (state.busy || state.pending) { emit({ open: true, notice: '請先完成或查詢目前影片作業，再切換來源圖片' }); return; }
      if (image && image.src !== state.source?.originalSrc && image.src !== state.source?.src) {
        emit({ source: { ...image, id: uuid(), originalSrc: image.src }, results: [], selected: null, tab: 'source', status: '', error: '' });
      }
      emit({ open: true }); saveDraft();
    },
    close() { emit({ open: false }); saveDraft(); },
    draft(patch) {
      if (state.busy || state.pending) return;
      const next = patch.modelKey ? changeVideoModel(state.draft, patch.modelKey) : { ...state.draft, ...patch };
      emit({ draft: next, notice: patch.modelKey && next.resolution !== state.draft.resolution ? `已改為此模型支援的 ${next.resolution}` : '' }); saveDraft();
    },
    tab: tab => emit({ tab }),
    select: requestId => { emit({ selected: requestId, tab: 'video' }); saveDraft(); },
    generate: () => run(false), resume: () => run(true),
    async refreshResult(requestId) {
      const stamp = epoch;
      try {
        const current = await session(); check(stamp);
        if (current.uid !== state.uid) throw new Error('登入帳號已變更');
        const result = await current.call({ action: 'status', requestId }); check(stamp);
        if (result.status !== 'succeeded' || !result.video?.src) throw new Error(result.error || '影片暫時無法取得');
        emit({ results: state.results.map(item => item.requestId === requestId ? { ...item, ...result } : item), error: '' });
        await persist();
      } catch (error) { if (stamp === epoch) emit({ error: videoMessage(error) }); }
    },
  };
}
