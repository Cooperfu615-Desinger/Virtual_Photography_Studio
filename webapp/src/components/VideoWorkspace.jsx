import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { RefreshCw, PlayCircle, Download, Film, LoaderCircle, Upload, Copy, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { firebaseAuth } from '../lib/firebase.js';
import { VIDEO_MODELS, VIDEO_CAMERA_PRESETS, VIDEO_STATUS, getVideoSession, downloadVideo, videoMessage, prepareVideoPng, videoSourceRatio } from '../lib/comfyVideoClient.js';
import { createVideoController } from '../lib/videoWorkspaceController.js';
import '../styles/videoWorkspace.css';

const formatNumber = value => Number.isFinite(value) ? value.toLocaleString('zh-TW', { maximumFractionDigits: 2 }) : '—';
const loadVideoQuota = async (uid, selection) => {
  const session = await getVideoSession();
  if (session.uid !== uid) throw new Error('登入帳號已變更');
  return session.call({ action: 'quota', ...selection });
};

function VideoQuota({ uid, draft, refreshToken, loadQuota = loadVideoQuota }) {
  const { modelKey, resolution, duration, audio, ratio } = draft;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ data: null, loading: Boolean(uid), error: '' });
  useEffect(() => {
    if (!uid) return;
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      setState(previous => ({ ...previous, loading: true, error: '' }));
      try {
        const data = await loadQuota(uid, { modelKey, resolution, duration, audio, ratio });
        if (active) setState({ data, loading: false, error: '' });
      } catch (error) {
        if (active) setState(previous => ({ ...previous, loading: false, error: videoMessage(error) }));
      }
    });
    return () => { active = false; };
  }, [uid, modelKey, resolution, duration, audio, ratio, revision, refreshToken, loadQuota]);
  return <section className="video-quota" aria-label="影片額度" aria-busy={state.loading}>
    <div className="video-quota-heading"><strong>Comfy Cloud 額度</strong>
      <button className="video-text-button" type="button" disabled={!uid || state.loading} onClick={() => setRevision(value => value + 1)}>
        <RefreshCw size={14} className={state.loading ? 'video-spin' : ''} />重新整理
      </button></div>
    <dl><div><dt>剩餘額度</dt><dd>{!uid ? '請先登入' : state.data?.credits == null ? '暫無法取得' : `${formatNumber(state.data.credits)} Credits`}</dd></div>
      <div><dt>本次預估</dt><dd>{state.data?.estimatedCredits == null ? '暫無法估算' : `約 ${formatNumber(state.data.estimatedCredits)} Credits`}</dd></div>
      <div><dt>預估可生成</dt><dd>{state.data?.estimatedVideos == null ? '暫無法估算' : `約 ${formatNumber(state.data.estimatedVideos)} 支`}</dd></div></dl>
    <p className="video-help">依模型公開費率估算，不含可能的工作流執行費，實際扣額可能不同。</p>
    {state.data && <p className="video-help">更新於 {new Date(state.data.checkedAt).toLocaleTimeString('zh-TW')} · 費率 {state.data.rateDate}</p>}
    {state.error && <p className="video-error" role="status">{state.error}</p>}
  </section>;
}


export function VideoWorkspaceView({ state, controller, quotaLoader, download = downloadVideo, onChooseImage }) {
  const fileInput = useRef(null);
  const [filter, setFilter] = useState('all');
  const [mobilePanel, setMobilePanel] = useState('settings');
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState('');
  const model = VIDEO_MODELS[state.draft.modelKey] || VIDEO_MODELS.wan3;
  const result = state.results.find(item => item.requestId === state.selected);
  const resultSource = state.sources?.[result?.sourceId];
  const previewSource = state.tab === 'video' && result ? resultSource : state.source;
  const locked = state.busy || Boolean(state.pending) || uploading;
  const ratio = videoSourceRatio(state.source);
  const quotaDraft = { ...state.draft, ...(model.referenceImage ? { ratio } : {}) };
  const history = [...state.results].sort((a, b) => b.createdAt - a.createdAt).filter(item => filter === 'all'
    || (filter === 'complete' ? item.status === 'succeeded' : filter === 'pending'
      ? ['submitting', 'queued', 'running', 'canceling'].includes(item.status)
      : ['uncertain', 'failed', 'rejected', 'canceled', 'expired'].includes(item.status)));
  const activeResult = result?.status === 'succeeded' && result.video;
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || locked) return;
    const uid = controller.getSnapshot().uid;
    setUploading(true); setLocalError('');
    const url = URL.createObjectURL(file);
    try {
      const png = await prepareVideoPng(url);
      if (controller.getSnapshot().uid !== uid) return;
      controller.open({ ...png, name: file.name, origin: '本機上傳' });
    } catch (error) { if (controller.getSnapshot().uid === uid) setLocalError(videoMessage(error)); }
    finally { URL.revokeObjectURL(url); setUploading(false); }
  };
  const handleDownload = async () => {
    setDownloading(true); setLocalError('');
    try { await download(result.requestId); }
    catch (error) { setLocalError(videoMessage(error)); }
    finally { setDownloading(false); }
  };
  return <section className="video-workspace" aria-label="DLL_VIDEO Pro">
    <div className="video-workspace-intro">
      <p><span>1</span>選擇來源圖片<ArrowRight size={14} /><span>2</span>設定動作與模型<ArrowRight size={14} /><span>3</span>生成、播放與下載</p>
      <span className="video-help">影片紀錄保存在此瀏覽器，請下載保存成品</span>
    </div>
    <div className="video-mobile-nav" role="group" aria-label="影片工作區面板">
      <button type="button" aria-pressed={mobilePanel === 'settings'} onClick={() => setMobilePanel('settings')}>生成設定</button>
      <button type="button" aria-pressed={mobilePanel === 'history'} onClick={() => setMobilePanel('history')}>影片紀錄（{state.results.length}）</button>
    </div>
    <div className="video-workspace-body" data-mobile-panel={mobilePanel}>
      <aside className="video-history-column">
        <h2>影片紀錄</h2>
        <div className="video-history-filters" role="group" aria-label="影片篩選">
          {[['all', '全部'], ['pending', '生成中'], ['complete', '已完成'], ['attention', '待處理']].map(([key, label]) =>
            <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
        </div>
        <div className="video-history-list">
          {history.map(item => {
            const source = state.sources?.[item.sourceId];
            const settings = item.meta || item.draft;
            return <button className="video-history-card" type="button" key={item.requestId} aria-pressed={item.requestId === state.selected}
              onClick={() => { setLocalError(''); controller.select(item.requestId); }}>
              {source?.src ? <img src={source.src} alt="" /> : <span className="video-thumb-empty"><Film size={22} /></span>}
              <span><strong>{source?.name || '影片創作'}</strong><small>{VIDEO_MODELS[settings?.modelKey]?.label || '影片'} · {settings?.duration || '—'} 秒 · {settings?.resolution}</small>
                <span className={'video-record-status ' + (item.status === 'succeeded' ? 'is-complete' : '')}>{VIDEO_STATUS[item.status] || '待查詢'}</span></span>
            </button>;
          })}
          {!history.length && <div className="video-empty"><Film size={28} /><p>{filter === 'all' ? '開始你的第一支影片' : '目前沒有符合的影片'}</p><small>選擇圖片並設定動作，結果會保留在這裡。</small></div>}
        </div>
      </aside>
      <section className="video-preview-column">
        <div className="video-preview-heading"><h2>影片預覽</h2><div className="video-tabs" role="group" aria-label="預覽內容">
          <button type="button" aria-pressed={state.tab === 'source'} onClick={() => controller.tab('source')}>來源圖片</button>
          <button type="button" aria-pressed={state.tab === 'video'} disabled={!result} onClick={() => controller.tab('video')}>影片結果</button>
        </div></div>
        <p className="video-preview-title">{previewSource?.name || (previewSource ? 'DLL 生成圖片' : '選擇一張圖片，讓畫面動起來')}</p>
        <div className="video-preview-well">
          {state.tab === 'video' && activeResult ? <video key={result.video.src} aria-label="生成影片預覽" controls playsInline preload="metadata" src={result.video.src}
            poster={resultSource?.src} onError={() => setLocalError('影片暫時無法播放，請重新取得影片連結')} onLoadedData={() => setLocalError('')} />
            : previewSource?.src ? <img src={previewSource.src} alt="影片來源圖片" />
              : <div className="video-empty"><PlayCircle size={48} /><p>影片預覽會顯示在這裡</p><small>從 DLL_PIC Pro 帶入圖片，或在右側上傳圖片。</small></div>}
        </div>
        {state.tab === 'video' && result && <div className="video-result-meta">
          <span>{VIDEO_MODELS[(result.meta || result.draft)?.modelKey]?.label}</span><span>{(result.meta || result.draft)?.duration} 秒</span>
          <span>{(result.meta || result.draft)?.resolution}</span><span>{(result.meta || result.draft)?.audio ? '含音訊' : '無音訊'}</span>
        </div>}
        {state.tab === 'video' && result && <div className="video-result-actions">
          <button type="button" className="secondary" disabled={!activeResult || downloading} onClick={handleDownload}><Download size={16} />{downloading ? '下載中…' : '下載 MP4'}</button>
          <button type="button" className="secondary" disabled={locked || !resultSource} onClick={() => { controller.reuse(result.requestId); setMobilePanel('settings'); }}><Copy size={16} />沿用設定</button>
          <button type="button" className="secondary" disabled={locked || !resultSource} onClick={() => { controller.reuse(result.requestId, true); setMobilePanel('settings'); }}><RefreshCw size={16} />同圖再生成</button>
        </div>}
        {state.tab === 'video' && result && <div className="video-result-footer">
          <span role="status">{VIDEO_STATUS[result.status] || ''}</span>
          {activeResult && <button className="video-text-button" type="button" onClick={() => { setLocalError(''); void controller.refreshResult(result.requestId); }}><RefreshCw size={14} />重新取得影片連結</button>}
          {state.pending?.requestId === result.requestId && <button className="video-text-button" type="button" disabled={state.busy} onClick={() => controller.resume()}>重新查詢影片</button>}
          {result.error && <p className="video-error">{result.error}</p>}
        </div>}
        <div className="video-source-summary">
          {previewSource?.src && <img src={previewSource.src} alt="來源縮圖" />}
          <div><strong>來源圖片</strong><p>{previewSource?.origin || (previewSource ? '來自 DLL_PIC Pro' : '尚未選擇圖片')}</p></div>
        </div>
        <p className="video-help">生成期間可切換分頁，回來後繼續查看進度。影片連結有保存期限，請下載保存。</p>
        {localError && <p className="video-error" role="alert">{localError}</p>}
      </section>
      <form className="video-settings-column" onSubmit={event => { event.preventDefault(); void controller.generate(); }}>
        <h2>生成設定</h2>
        <fieldset disabled={locked || !state.ready}>
          <legend className="video-sr-only">影片設定</legend>
          <div className="video-field"><span>{model.referenceImage ? '參考圖片' : '來源圖片'}</span>
            <div className="video-source-picker">
              {state.source?.src ? <img src={state.source.src} alt="目前生成來源" /> : <ImageIcon size={32} />}
              <div><strong>{state.source?.name || (state.source ? 'DLL 生成圖片' : '尚未選擇圖片')}</strong>
                <div className="video-source-buttons"><button type="button" onClick={onChooseImage}><ImageIcon size={14} />選擇 DLL 圖片</button>
                  <button type="button" onClick={() => fileInput.current?.click()}><Upload size={14} />上傳圖片</button></div></div>
            </div>
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="video-sr-only" tabIndex={-1} onChange={upload} />
          </div>
          <label className="video-field">選擇模型<select value={state.draft.modelKey} onChange={event => controller.draft({ modelKey: event.target.value })}>
            {Object.entries(VIDEO_MODELS).map(([key, option]) => <option key={key} value={key}>{option.label}</option>)}
          </select></label>
          {model.referenceImage && <p className="video-help">以圖片作為參考，影片開頭可能與原圖不同。</p>}
          <label className="video-field">動作描述<textarea value={state.draft.motion} maxLength={8000} rows={2} required placeholder="人物緩慢抬頭，望向鏡頭並自然微笑。" onChange={event => controller.draft({ motion: event.target.value })} /></label>
          <label className="video-field">運鏡描述（選填）<textarea value={state.draft.camera} maxLength={1500} rows={2} placeholder="鏡頭緩慢推近，保持平穩。" onChange={event => controller.draft({ camera: event.target.value })} /></label>
          <div className="video-camera-presets">{VIDEO_CAMERA_PRESETS.map(text => <button type="button" key={text} aria-pressed={state.draft.camera === text} onClick={() => controller.draft({ camera: text })}>{text}</button>)}</div>
          <div className="video-settings-row">
            <label className="video-field">秒數<select value={state.draft.duration} onChange={event => controller.draft({ duration: Number(event.target.value) })}>{Array.from({ length: model.maxDuration - model.minDuration + 1 }, (_, index) => model.minDuration + index).map(value => <option key={value} value={value}>{value} 秒</option>)}</select></label>
            <label className="video-field">解析度<select value={state.draft.resolution} onChange={event => controller.draft({ resolution: event.target.value })}>{model.resolutions.map(value => <option key={value} value={value}>{value.replace('P', 'p')}</option>)}</select></label>
          </div>
          <p className="video-help">輸出比例：{model.referenceImage ? ratio === 'adaptive' ? '自動適應（額度採保守預估）' : ratio : '跟隨來源圖片'}</p>
          {model.audioToggle ? <label className="video-audio"><input type="checkbox" checked={state.draft.audio} onChange={event => controller.draft({ audio: event.target.checked })} />生成音訊</label>
            : <p className="video-help">MiniMax H3 會生成音訊，此節點不提供關閉選項。</p>}
        </fieldset>
        <div className="video-submit-area">
          <VideoQuota key={[state.uid, state.draft.modelKey, state.draft.resolution, state.draft.duration, state.draft.audio, ratio].join(':')} uid={state.uid}
            draft={quotaDraft} refreshToken={state.results.filter(item => item.status === 'succeeded').length} loadQuota={quotaLoader} />
          {state.notice && <p className="video-help" role="status">{state.notice}</p>}
          {state.error && <p className="video-error" role="alert">{state.error}</p>}
          {state.pending ? <button className="video-primary" type="button" disabled={state.busy || !state.uid} onClick={() => controller.resume()}>
            {state.busy && <LoaderCircle size={18} className="video-spin" />}{state.busy ? VIDEO_STATUS[state.status] || '正在查詢' : '重新查詢影片'}
          </button> : <button className="video-primary" type="submit" disabled={!state.uid || !state.ready || !state.source || !state.draft.motion.trim() || locked}>
            {state.busy ? <LoaderCircle size={18} className="video-spin" /> : <Film size={18} />}{state.busy ? VIDEO_STATUS[state.status] || '正在處理' : '生成影片'}
          </button>}
          <p className="video-submit-note">{!state.uid ? '請至右上角「設定」登入 Firebase' : uploading ? '正在讀取圖片…' : '按下生成才會提交付費任務'}</p>
        </div>
      </form>
    </div>
  </section>;
}

export default function VideoWorkspace({ active = false, onChooseImage, onNavigate }) {
  const [controller] = useState(() => createVideoController());
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => {
    const handler = event => controller.open(event.detail);
    window.addEventListener('dll-video-open', handler);
    const unsubscribe = firebaseAuth ? onAuthStateChanged(firebaseAuth, user => { void controller.setUser(user?.uid || null); }) : null;
    if (!firebaseAuth) void controller.setUser(null);
    return () => { window.removeEventListener('dll-video-open', handler); unsubscribe?.(); };
  }, [controller]);
  if (!active) return state.pending ? <button className="video-resume-button" type="button" onClick={onNavigate}><Film size={17} />查看影片作業</button> : null;
  return <VideoWorkspaceView key={state.uid || 'anonymous'} state={state} controller={controller} onChooseImage={onChooseImage} />;
}
