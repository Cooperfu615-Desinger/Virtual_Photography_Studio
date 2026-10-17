import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { X, RefreshCw, PlayCircle, Download, Film, LoaderCircle, ChevronDown } from 'lucide-react';
import { firebaseAuth } from '../lib/firebase.js';
import { VIDEO_MODELS, VIDEO_CAMERA_PRESETS, VIDEO_STATUS, getVideoSession, downloadVideo, videoMessage } from '../lib/comfyVideoClient.js';
import { createVideoController } from '../lib/videoWorkspaceController.js';
import '../styles/videoWorkspace.css';

const formatNumber = value => Number.isFinite(value) ? value.toLocaleString('zh-TW', { maximumFractionDigits: 2 }) : '—';
const loadVideoQuota = async (uid, selection) => {
  const session = await getVideoSession();
  if (session.uid !== uid) throw new Error('登入帳號已變更');
  return session.call({ action: 'quota', ...selection });
};

function VideoQuota({ uid, draft, refreshToken, loadQuota = loadVideoQuota }) {
  const { modelKey, resolution, duration, audio } = draft;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ data: null, loading: Boolean(uid), error: '' });
  useEffect(() => {
    if (!uid) return;
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      setState(previous => ({ ...previous, loading: true, error: '' }));
      try {
        const data = await loadQuota(uid, { modelKey, resolution, duration, audio });
        if (active) setState({ data, loading: false, error: '' });
      } catch (error) {
        if (active) setState(previous => ({ ...previous, loading: false, error: videoMessage(error) }));
      }
    });
    return () => { active = false; };
  }, [uid, modelKey, resolution, duration, audio, revision, refreshToken, loadQuota]);
  return <section className="video-quota" aria-label="影片額度" aria-busy={state.loading}>
    <div className="video-quota-heading"><strong>Comfy Cloud 額度</strong>
      <button className="video-text-button" type="button" disabled={!uid || state.loading} onClick={() => setRevision(value => value + 1)}>
        <RefreshCw size={14} className={state.loading ? 'video-spin' : ''} />重新整理
      </button></div>
    <dl><div><dt>剩餘額度</dt><dd>{!uid ? '請先登入' : state.data?.credits == null ? '暫無法取得' : `${formatNumber(state.data.credits)} Credits`}</dd></div>
      <div><dt>本次預估</dt><dd>{state.data?.estimatedCredits == null ? '暫無法估算' : `${formatNumber(state.data.estimatedCredits)} Credits`}</dd></div>
      <div><dt>預估可生成</dt><dd>{state.data?.estimatedVideos == null ? '暫無法估算' : `約 ${formatNumber(state.data.estimatedVideos)} 支`}</dd></div></dl>
    <p className="video-help">依模型公開費率估算，不含可能的工作流執行費，實際扣額可能不同。</p>
    {state.data && <p className="video-help">更新於 {new Date(state.data.checkedAt).toLocaleTimeString('zh-TW')} · 費率 {state.data.rateDate}</p>}
    {state.error && <p className="video-error" role="status">{state.error}</p>}
  </section>;
}

export function VideoWorkspaceView({ state, controller, quotaLoader, download = downloadVideo }) {
  const dialog = useRef(null);
  const close = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [playbackError, setPlaybackError] = useState('');
  const model = VIDEO_MODELS[state.draft.modelKey];
  const result = state.results.find(item => item.requestId === state.selected) || state.results.at(-1);
  const locked = state.busy || Boolean(state.pending);
  const sourceRatio = state.source?.width && state.source?.height
    ? `${state.source.width} × ${state.source.height}` : '完整原圖';

  useEffect(() => {
    if (!state.open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const hidden = [...document.body.children].filter(element => !element.contains(dialog.current));
    const previousInert = hidden.map(element => element.inert);
    hidden.forEach(element => { element.inert = true; });
    close.current?.focus();
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); controller.close(); }
      if (event.key !== 'Tab') return;
      const controls = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, video[controls], a[href]')]
        .filter(element => element.getClientRects().length
          && (!element.closest('details:not([open])') || element.tagName === 'SUMMARY'));
      const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      hidden.forEach((element, index) => { element.inert = previousInert[index]; });
      if (previous?.isConnected && previous !== document.body) previous.focus();
      else document.querySelector('.video-resume-button')?.focus();
    };
  }, [state.open, controller]);

  if (!state.open) return null;
  const handleDownload = async () => {
    setDownloading(true); setDownloadError('');
    try { await download(result.requestId); }
    catch (error) { setDownloadError(videoMessage(error)); }
    finally { setDownloading(false); }
  };
  return createPortal(<div className="video-workspace-backdrop">
    <section className="video-workspace" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="video-workspace-title">
      <header className="video-workspace-header">
        <div><h2 id="video-workspace-title">製作影片</h2><p>DLL_PIC PRO</p></div>
        <div className="video-header-actions"><span role="status">{VIDEO_STATUS[state.status] || ''}</span>
          <button className="video-icon-button" ref={close} type="button" aria-label="關閉影片工作區" onClick={() => controller.close()}><X size={22} /></button></div>
      </header>
      <div className="video-workspace-body">
        <div className="video-preview-column">
          <div className="video-tabs" role="group" aria-label="預覽內容">
            <button type="button" aria-pressed={state.tab === 'source'} onClick={() => controller.tab('source')}>來源圖片</button>
            <button type="button" aria-pressed={state.tab === 'video'} disabled={!result} onClick={() => controller.tab('video')}>影片結果</button>
          </div>
          <div className="video-preview-well">
            {state.tab === 'video' && result ? <>
              <video key={result.video.src} controls playsInline preload="metadata" src={result.video.src}
                poster={state.source?.src} onError={() => setPlaybackError('影片暫時無法播放，請重新取得影片連結')} onLoadedData={() => setPlaybackError('')} />
              <p className="video-preview-caption">{VIDEO_MODELS[result.meta.modelKey]?.label} · {result.meta.duration} 秒 · {result.meta.resolution}</p>
            </> : state.source ? <>
              <img src={state.source.src} alt={`來源圖片 ${state.source.index || 1}`} onError={() => setPlaybackError('來源圖片無法讀取，請回到 DLL 重新選取圖片')} />
              <p className="video-preview-caption">來源圖片 #{state.source.index || 1} · {sourceRatio}</p>
            </> : <p>請從 DLL 圖片選擇「製作影片」</p>}
          </div>
          {state.tab === 'video' && result && <div className="video-result-actions">
            <button className="secondary" type="button" onClick={handleDownload} disabled={downloading}><Download size={16} />{downloading ? '下載中…' : '下載影片'}</button>
            <button className="video-text-button" type="button" onClick={() => { setPlaybackError(''); void controller.refreshResult(result.requestId); }}><RefreshCw size={14} />重新取得影片連結</button>
          </div>}
          {(playbackError || downloadError) && <p className="video-error" role="alert">{playbackError || downloadError}</p>}
          <section className="video-results" aria-label="本張圖片的影片"><h3>本張圖片的影片</h3>
            {state.results.length ? <div className="video-result-list">{state.results.map((item, index) => <button type="button" key={item.requestId}
              aria-pressed={item.requestId === result?.requestId} onClick={() => { setPlaybackError(''); setDownloadError(''); controller.select(item.requestId); }}>
              <video src={item.video.src} poster={state.source?.src} preload="metadata" muted aria-hidden="true" /><PlayCircle size={20} /><span>影片 {index + 1}<small>{VIDEO_MODELS[item.meta.modelKey]?.label} · {item.meta.duration} 秒 · {item.meta.resolution}</small></span>
            </button>)}</div> : <div className="video-results-empty"><PlayCircle size={30} /><p>{locked ? `${VIDEO_STATUS[state.status] || '正在查詢'}，可先關閉視窗繼續使用工作台` : '生成完成後，可在這裡比較與下載影片'}</p></div>}
            {!!state.results.length && <p className="video-help">影片連結有保存期限，請下載保存。</p>}
          </section>
        </div>
        <form className="video-settings-column" onSubmit={event => { event.preventDefault(); void controller.generate(); }}>
          <fieldset disabled={locked || !state.ready}>
            <legend className="video-sr-only">影片設定</legend>
            <div className="video-field"><span id="video-model-label">模型</span><div className="video-models" role="group" aria-labelledby="video-model-label">
              {Object.entries(VIDEO_MODELS).map(([key, option]) => <button type="button" key={key} aria-pressed={key === state.draft.modelKey} onClick={() => controller.draft({ modelKey: key })}>{option.label}</button>)}
            </div></div>
            <label className="video-field">動作描述<textarea value={state.draft.motion} maxLength={8000} rows={3} required placeholder="人物緩慢轉頭看向鏡頭，露出自然微笑，髮絲輕微晃動。" onChange={event => controller.draft({ motion: event.target.value })} /></label>
            <label className="video-field">運鏡描述（選填）<textarea value={state.draft.camera} maxLength={1500} rows={2} placeholder="鏡頭緩慢推近，保持平穩。" onChange={event => controller.draft({ camera: event.target.value })} /></label>
            <div className="video-camera-presets">{VIDEO_CAMERA_PRESETS.map(text => <button type="button" key={text} aria-pressed={state.draft.camera === text} onClick={() => controller.draft({ camera: text })}>{text}</button>)}</div>
            <div className="video-settings-row">
              <label className="video-field">秒數<select value={state.draft.duration} onChange={event => controller.draft({ duration: Number(event.target.value) })}>{Array.from({ length: model.maxDuration - model.minDuration + 1 }, (_, index) => model.minDuration + index).map(value => <option key={value} value={value}>{value} 秒</option>)}</select></label>
              <label className="video-field">解析度<select value={state.draft.resolution} onChange={event => controller.draft({ resolution: event.target.value })}>{model.resolutions.map(value => <option key={value} value={value}>{value.replace('P', 'p')}</option>)}</select></label>
            </div>
            <p className="video-help">畫面比例：跟隨來源圖片，不自動裁切</p>
            <details className="video-more"><summary>更多設定<ChevronDown size={16} /></summary>
              {model.audioToggle ? <label><input type="checkbox" checked={state.draft.audio} onChange={event => controller.draft({ audio: event.target.checked })} />生成音訊</label>
                : <p className="video-help">MiniMax H3 會生成音訊，此節點不提供關閉選項。</p>}
              <p className="video-help">使用原始描述，不啟用額外 Prompt 改寫。</p>
            </details>
          </fieldset>
          <div className="video-submit-area">
            <VideoQuota key={`${state.uid}:${state.draft.modelKey}:${state.draft.resolution}:${state.draft.duration}:${state.draft.audio}`} uid={state.uid}
              draft={state.draft} refreshToken={state.results.length} loadQuota={quotaLoader} />
            {state.notice && <p className="video-help" role="status">{state.notice}</p>}
            {state.error && <p className="video-error" role="alert">{state.error}</p>}
            {state.pending ? <button className="video-primary" type="button" disabled={state.busy || !state.uid} onClick={() => controller.resume()}>
              {state.busy && <LoaderCircle size={18} className="video-spin" />}{state.busy ? (VIDEO_STATUS[state.status] || '正在查詢') : '重新查詢影片'}
            </button> : <button className="video-primary" type="submit" disabled={!state.uid || !state.ready || !state.source || !state.draft.motion.trim() || state.busy}>
              {state.busy && <LoaderCircle size={18} className="video-spin" />}{state.busy ? (VIDEO_STATUS[state.status] || '正在處理') : state.results.length ? '再生成一支' : '生成影片'}
            </button>}
            <p className="video-submit-note">{state.uid ? '關閉視窗後，生成作業仍會繼續' : '請先關閉視窗，至「設定」登入 Firebase'}</p>
          </div>
        </form>
      </div>
    </section>
  </div>, document.body);
}

export default function VideoWorkspace() {
  const [controller] = useState(() => createVideoController());
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => {
    const handler = event => controller.open(event.detail);
    window.addEventListener('dll-video-open', handler);
    const unsubscribe = firebaseAuth ? onAuthStateChanged(firebaseAuth, user => { void controller.setUser(user?.uid || null); }) : null;
    if (!firebaseAuth) void controller.setUser(null);
    return () => { window.removeEventListener('dll-video-open', handler); unsubscribe?.(); };
  }, [controller]);
  return <>
    {!state.open && (state.source || state.pending || state.results.length || state.error) && <button className="video-resume-button" type="button" onClick={() => controller.open()}>
      <Film size={17} />{state.pending ? '影片生成中／查看作業' : '開啟影片工作區'}
    </button>}
    <VideoWorkspaceView key={state.uid || 'anonymous'} state={state} controller={controller} />
  </>;
}
