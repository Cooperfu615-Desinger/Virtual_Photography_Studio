import { changeVideoModel, defaultVideoDraft, getVideoSession, prepareVideoPng, videoIsTerminal, videoMessage, videoSourceRatio, VIDEO_MODELS } from './comfyVideoClient.js';
import { videoStorage } from './videoWorkspaceStorage.js';

const initial = () => ({ uid: null, ready: false, open: false, source: null, sources: {}, draft: defaultVideoDraft(), results: [],
  pending: null, busy: false, status: '', error: '', notice: '', tab: 'source', selected: null });

export function createVideoController({ storage = videoStorage, session = getVideoSession, prepare = prepareVideoPng,
  locks = globalThis.navigator?.locks, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), maxPolls = 360,
  uuid = () => crypto.randomUUID() } = {}) {
  let state = initial(); let epoch = 0; let saving = Promise.resolve();
  const listeners = new Set();
  const emit = patch => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  const saved = () => ({ source: state.source, sources: state.sources, draft: state.draft, results: state.results, selected: state.selected });
  const persist = () => {
    if (!state.uid) return Promise.resolve();
    const uid = state.uid; const snapshot = saved();
    saving = saving.catch(() => {}).then(() => storage.save(uid, snapshot));
    return saving;
  };
  const saveDraft = () => { const stamp = epoch; void persist().catch(error => { if (stamp === epoch) emit({ error: videoMessage(error) }); }); };
  const check = stamp => { if (stamp !== epoch) throw new Error('登入帳號已變更，已停止查詢'); };
  const updateRecord = (marker, patch) => {
    const previous = state.results.find(item => item.requestId === marker.requestId);
    const record = { requestId: marker.requestId, sourceId: marker.sourceId, createdAt: marker.createdAt,
      draft: { ...state.draft }, ...previous, ...patch };
    emit({ results: [...state.results.filter(item => item.requestId !== marker.requestId), record] });
  };
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
      updateRecord(marker, job);
      if (videoIsTerminal(job.status)) {
        if (job.status === 'succeeded' && (!job.video?.src || job.video.mimeType !== 'video/mp4')) throw new Error('影片尚未取得，請重新查詢；不會重新生成');
        emit({ selected: marker.requestId, tab: 'video' });
        await persist(); check(stamp);
        storage.setPending(current.uid, null);
        emit({ pending: null, error: job.status === 'succeeded' ? '' : (job.error || '影片未完成，設定已保留，可調整後再生成') });
        return;
      }
      await persist(); check(stamp);
      if (job.status === 'uncertain') throw new Error('提交結果尚未確認，請稍後重新查詢或至 Comfy Cloud 確認；不會自動重送');
      if (attempt === maxPolls) throw new Error('等待較久，可稍後重新查詢；雲端作業不會因此取消');
      await sleep(5000); check(stamp);
      job = await current.call({ action: 'status', requestId: marker.requestId });
    }
  }
  async function run(resume) {
    if (state.busy || !state.ready) return;
    const stamp = epoch;
    let preparedMarker;
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
        if (VIDEO_MODELS[draft.modelKey]?.referenceImage && (png.width < 300 || png.height < 300)) throw new Error('Seedance 來源圖片需至少 300×300');
        const sourceId = source.id;
        const durableSource = { ...source, ...png };
        emit({ source: durableSource, sources: { ...state.sources, [sourceId]: durableSource } });
        if (VIDEO_MODELS[draft.modelKey]?.referenceImage) draft.ratio = videoSourceRatio(png);
        await persist(); check(stamp);
        // A new upload identity permits recovery from an unconfirmed upload;
        // this never retries a paid video submission.
        const upload = await current.call({ action: 'prepare', sourceId: uuid(), src: png.src }); check(stamp);
        const marker = { requestId: uuid(), uid: current.uid, sourceId, createdAt: Date.now() };
        preparedMarker = marker;
        updateRecord(marker, { draft, status: 'submitting', meta: { ...draft, width: png.width, height: png.height } });
        // Persist the immutable settings before writing the tiny recovery marker or submitting.
        await persist(); check(stamp);
        storage.setPending(current.uid, marker);
        emit({ pending: marker, status: 'submitting', selected: marker.requestId, tab: 'video' });
        const job = await current.call({ action: 'submit', ...draft, sourceId: upload.sourceId, requestId: marker.requestId });
        check(stamp);
        await track(current, marker, stamp, job);
      });
    } catch (error) {
      if (stamp === epoch) {
        emit({ error: videoMessage(error) });
        if (state.pending) {
          updateRecord(state.pending, { status: 'uncertain' });
          await persist().catch(() => {});
        } else if (preparedMarker) {
          updateRecord(preparedMarker, { status: 'rejected', error: '本機追蹤資料未保存，未送出生成任務' });
          await persist().catch(() => {});
        }
      }
    }
    finally { if (stamp === epoch) emit({ busy: false }); }
  }
  return {
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }, getSnapshot: () => state,
    async setUser(uid) {
      const stamp = ++epoch;
      const anonymous = !state.uid ? { source: state.source, sources: state.sources, draft: state.draft, open: state.open } : {};
      emit({ ...initial(), ...anonymous, uid });
      if (!uid) { emit({ ready: true }); return; }
      try {
        await saving.catch(() => {}); check(stamp);
        const data = await storage.load(uid); check(stamp);
        const pending = storage.pending(uid);
        const sources = { ...(data?.sources || {}) };
        if (data?.source?.id) sources[data.source.id] = data.source;
        const results = (data?.results || []).map(item => ({ ...item, status: item.status || (item.video ? 'succeeded' : 'uncertain') }));
        emit({ ...(data || {}), results, sources, ...(anonymous.source ? { ...anonymous, sources: { ...sources, ...anonymous.sources } } : {}), uid, pending, ready: true });
        if (pending) await run(true);
      } catch (error) { if (stamp === epoch) emit({ ready: false, error: videoMessage(error) }); }
    },
    open(image) {
      if (state.busy || state.pending) { emit({ open: true, notice: '請先完成或查詢目前影片作業，再切換來源圖片' }); return; }
      if (image && image.src !== state.source?.originalSrc && image.src !== state.source?.src) {
        const source = { ...image, id: uuid(), originalSrc: image.src };
        emit({ source, sources: { ...state.sources, [source.id]: source }, selected: null, tab: 'source', status: '', error: '' });
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
    reuse(requestId, sameImageOnly = false) {
      if (state.busy || state.pending) return;
      const item = state.results.find(result => result.requestId === requestId);
      const source = state.sources[item?.sourceId];
      if (!source) { emit({ error: '此紀錄的來源圖片已無法取得，請重新上傳圖片' }); return; }
      emit({ source, draft: sameImageOnly ? state.draft : { ...defaultVideoDraft(), ...item.draft }, tab: 'source',
        notice: '已帶入設定，確認後按「生成影片」才會送出新任務', error: '' }); saveDraft();
    },
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
