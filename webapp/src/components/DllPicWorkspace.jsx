import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Download, Film, Images, ArrowUpRight, UserRound, Trash2, RotateCcw, Play, Pause } from 'lucide-react';
import DllPicProPanel from './DllPicProPanel.jsx';
import DllHistoryPreview from './DllHistoryPreview.jsx';
import DllDialog from './DllDialog.jsx';
import DllImageViewer from './DllImageViewer.jsx';
import { dllWorkspace, DLL_LOCAL_ACCEPTANCE } from '../lib/dllWorkspaceRuntime.js';
import { DLL_TASK_LABELS, taskNeedsAttention } from '../lib/dllWorkspaceController.js';
import { getDllPicModelConfig, getDllPicLoraSelection } from '../lib/dllPicProClient.js';
import { openVideoWorkspace, prepareVideoPng } from '../lib/comfyVideoClient.js';
import { downloadImageFile } from '../lib/imageDownload.js';
import { downloadMagnificImageViaFirebase } from '../lib/magnificProxyClient.js';
import { readComfyPending } from '../lib/comfyCloudProxyClient.js';
import '../styles/dllWorkspace.css';

export default function DllPicWorkspace({ sources, incoming }) {
  const state = useSyncExternalStore(dllWorkspace.subscribe, dllWorkspace.getSnapshot);
  const [revision, setRevision] = useState(0);
  const [historyId, setHistoryId] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [pickerPage, setPickerPage] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const closePicker = useCallback(() => setPicking(false), []);
  const [page, setPage] = useState(0);
  const [taskLimit, setTaskLimit] = useState(20);
  const [mobile, setMobile] = useState('settings');
  const [checked, setChecked] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [upscale, setUpscale] = useState(null);
  const [scale, setScale] = useState(2);
  const [error, setError] = useState('');
  const closeUpscale = useCallback(() => setUpscale(null), []);
  const closeViewer = useCallback(() => setViewer(null), []);
  const pending = DLL_LOCAL_ACCEPTANCE ? null : readComfyPending();
  const tasks = [...state.tasks].reverse();
  const current = tasks.find(t => t.id === state.selected) || tasks[0];
  const activeTasks = tasks.filter(task => task.status === 'waiting' || taskNeedsAttention(task));
  const history = tasks.filter(task => task.status !== 'waiting' && !taskNeedsAttention(task));
  const historical = tasks.find(task => task.id === historyId);
  const displayed = historical || (current && !current.images.length && activeTasks.includes(current) ? tasks.find(task => task.images.length) || current : current);
  const visible = displayed ? [displayed] : [];
  const lastPage = Math.max(0, Math.ceil(history.length / 10) - 1);
  const currentPage = Math.min(page, lastPage);
  const displayedIndex = Math.min(imageIndex, Math.max(0, (displayed?.images.length || 1) - 1));
  const allImages = tasks.flatMap(task => (task.images || []).map((image, index) => ({ ...image, key: `${task.id}:${index}`, task, index, label: task.snapshot.kind === 'upscale' ? `放大版本 · ${task.snapshot.scale} 倍` : `${task.snapshot.sourceLabel || '生成圖片'} · 第 ${index + 1} 張` })));
  async function original(image) {
    if (image.src) return image;
    const task = await dllWorkspace.readTask(image.task);
    return { ...image, ...task.images[image.index] };
  }
  const view = images => run(async () => setViewer(await Promise.all(images.map(original))));
  const reuse = (task, seed) => run(async () => {
    const { snapshot } = await dllWorkspace.readTask(task);
    const source = { id: snapshot.sourceId, label: snapshot.sourceLabel, value: snapshot.prompt, aspectRatio: snapshot.lockAspectRatio ? snapshot.aspectRatio : undefined, lockAspectRatio: snapshot.lockAspectRatio };
    applyDraft({ ...snapshot, sources: seed === undefined ? [source] : draft.sources, selectedSourceId: snapshot.sourceId, custom: true, customPrompt: snapshot.prompt, workspaceId: snapshot.workspace, ...(seed === undefined ? {} : { seed, count: 1 }) });
  });
  const selectedImages = allImages.filter(image => checked.includes(image.key));
  const draft = state.draft || { sources, workspaceId: 'Prompt 工作台' };
  const applyDraft = next => { dllWorkspace.draft(next); setRevision(value => value + 1); setMobile('settings'); };
  const bringSources = () => {
    if (draft.custom && draft.customPrompt && !window.confirm('帶入新來源將取代目前自訂 Prompt，確定帶入？')) return;
    applyDraft({ ...draft, ...(incoming?.settings || {}), sources: incoming?.sources || sources, workspaceId: incoming?.workspaceId || 'Prompt 工作台', custom: false, customPrompt: '' });
  };
  const run = async work => { setError(''); try { await work(); } catch (e) { setError(e.message); } };
  const faceChoices = allImages.filter(image => !['image/gif', 'image/svg+xml'].includes(image.mimeType));
  const applyFace = image => run(async () => {
    const owner = state.owner;
    const png = await prepareVideoPng((await original(image)).src);
    const latest = dllWorkspace.getSnapshot();
    if (latest.owner !== owner) return;
    applyDraft({ ...(latest.draft || draft), faceReference: png.src });
    closePicker();
  });
  const selectedImage = allImages.find(image => image.task.id === displayed?.id && image.index === displayedIndex);
  const [preview, setPreview] = useState(null);
  const previewTask = selectedImage?.task;
  useEffect(() => {
    let active = true;
    if (previewTask?.summaryOnly) dllWorkspace.readTask(previewTask).then(task => {
      if (active) setPreview({ task: previewTask, index: displayedIndex, src: task.images[displayedIndex]?.src });
    }).catch(() => {});

    return () => { active = false; };
  }, [previewTask, displayedIndex]);
  const showHistory = task => { setHistoryId(task.id); setImageIndex(0); setSidebarOpen(false); setMobile('results'); };
  if (!state.ready) return <p role="status">{state.error || '正在載入此瀏覽器的圖片工作區…'}</p>;
  return <main className="dll-workspace">
    {DLL_LOCAL_ACCEPTANCE && <p className="dll-workspace-error" role="status">本機模擬驗收 · 不呼叫生成服務、不扣額；範例圖片與放大效果均為測試資料，使用獨立儲存空間。</p>}

    <div className="dll-mobile-tabs"><button className={mobile === 'settings' ? 'tab-primary-active' : 'secondary'} onClick={() => setMobile('settings')}>設定</button><button className={mobile === 'results' ? 'tab-primary-active' : 'secondary'} onClick={() => setMobile('results')}>成果（{allImages.length}）</button></div>
    {(error || state.error) && <p role="alert" className="dll-workspace-error">{error || state.error}</p>}
    <button type="button" className="secondary dll-sidebar-toggle" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)}>任務與歷史（{activeTasks.length} 筆進行中）</button>
    <div className={`dll-workspace-grid ${sidebarOpen ? 'sidebar-open' : ''} mobile-${mobile}`}>
      <aside className="dll-workspace-form"><DllPicProPanel key={`${state.owner}:${revision}`} full onPickFace={() => { setPickerPage(0); setPicking(true); }} title="生成設定" onBringSources={bringSources} sourceWorkspace={incoming?.workspaceId} workspaceId={draft.workspaceId || '完整版'} promptSources={draft.sources || sources} initialSettings={draft} /></aside>
      <div className="dll-workspace-main">
        <section className="dll-results" aria-label="圖片成果">
          <div className="dll-results-toolbar"><strong>{historical ? '歷史成果' : '本次成果'}</strong>
            {historical && <button className="dll-text-button" onClick={() => { setHistoryId(null); setImageIndex(0); }}>回到本次成果</button>}
            {displayed?.images.length > 1 && <div className="dll-row"><button className="secondary" disabled={!displayedIndex} onClick={() => setImageIndex(displayedIndex - 1)}>上一張</button><span>{displayedIndex + 1} / {displayed.images.length}</span><button className="secondary" disabled={displayedIndex + 1 >= displayed.images.length} onClick={() => setImageIndex(displayedIndex + 1)}>下一張</button></div>}
            <button className="secondary" disabled={selectedImages.length !== 2} onClick={() => view(selectedImages)}>比較已選（{selectedImages.length}/2）</button></div>
          {!visible.some(t => t.images?.length) && <div className="dll-empty"><Images size={40} /><h2>{displayed ? DLL_TASK_LABELS[displayed.status] || '等待結果' : '從一張圖片開始'}</h2><p>{displayed && taskNeedsAttention(displayed) ? '請在任務與歷史查看目前進度或核對任務。' : '生成後可在這裡查看圖片。'}</p></div>}
          {visible.map(task => <section key={task.id} className="dll-result-group">
            <div className="dll-result-heading"><div><strong>{task.snapshot.kind === 'upscale' ? '提升解析度' : task.snapshot.sourceLabel || '生成圖片'}</strong><small>{new Date(task.createdAt).toLocaleString('zh-TW')} · {DLL_TASK_LABELS[task.status]}</small></div>
              <div className="dll-row"><button className="dll-text-button" disabled={!task.snapshot.prompt} onClick={() => reuse(task)}><RotateCcw size={14} />沿用設定</button>
              <button className="dll-text-button" disabled={state.busy || taskNeedsAttention(task)} onClick={() => { if (window.confirm('刪除此筆本機紀錄與圖片？已下載的檔案不受影響。')) run(() => dllWorkspace.remove(task.id)); }}><Trash2 size={14} />刪除</button></div></div>
            <div className="dll-image-grid">{allImages.filter(image => image.task.id === task.id && image.index === displayedIndex).map(image => <article className={`dll-result-card ${checked.includes(image.key) ? 'selected' : ''}`} key={image.key}>
              <label className="dll-image-selection"><input type="checkbox" checked={checked.includes(image.key)} onChange={event => setChecked(list => event.target.checked ? [...list.slice(-1), image.key] : list.filter(id => id !== image.key))} />{image.label}</label>
              <button className="dll-image-open" onClick={() => view([image])}>{preview?.task === task && preview.index === image.index && preview.src ? <img src={preview.src} alt={image.label} /> : <DllHistoryPreview image={image} />}</button>
              <p className="dll-image-meta">{image.width && `${image.width} × ${image.height} · `}{task.snapshot.kind === 'upscale' ? 'SeedVR2' : getDllPicModelConfig(task.snapshot.modelKey).label} {image.meta?.seed != null && `· Seed ${image.meta.seed}`}</p>
              <div className="dll-card-actions"><button className="secondary" onClick={() => run(async () => downloadImageFile({ src: (await original(image)).src, index: image.index, remoteDownload: downloadMagnificImageViaFirebase }))}><Download size={14} />下載</button><button className="secondary" disabled={draft.modelKey !== 'comfySeedream5Pro' || ['image/gif', 'image/svg+xml'].includes(image.mimeType)} title="適用於 Seedream 5.0 Pro" onClick={() => applyFace(image)}><UserRound size={14} />用作臉部參考</button><button className="secondary" disabled={['image/gif', 'image/svg+xml'].includes(image.mimeType)} onClick={() => run(async () => { setUpscale(await original(image)); setScale(2); })}><ArrowUpRight size={14} />提升解析度</button><button className="secondary" disabled={DLL_LOCAL_ACCEPTANCE || ['image/gif', 'image/svg+xml'].includes(image.mimeType)} title={DLL_LOCAL_ACCEPTANCE ? '影片入口請至一般模式驗收' : undefined} onClick={() => run(async () => openVideoWorkspace(await original(image), image.index))}><Film size={14} />製作影片</button></div>
              {Number.isSafeInteger(image.meta?.seed) && task.snapshot.kind !== 'upscale' && <button className="dll-text-button" onClick={() => reuse(task, image.meta.seed)}>沿用此張 Seed</button>}
              {task.snapshot.parentId && <button className="dll-text-button" onClick={() => { const parent = allImages.find(i => i.key === task.snapshot.parentId); if (parent) view([parent, image]); else setError('原圖已從此瀏覽器刪除'); }}>比較原圖與放大版本</button>}
            </article>)}</div>
            <details className="dll-task-details"><summary>查看實際生成設定</summary><p>{task.snapshot.kind === 'upscale' ? `SeedVR2 · ${task.snapshot.scale} 倍 · 保留原圖` : `${task.snapshot.outputFormat === 'gif' ? '自動尺寸（GIF）' : task.snapshot.resolution === 'auto' ? '自動尺寸' : task.snapshot.resolution === 'custom' ? `${task.snapshot.customWidth} × ${task.snapshot.customHeight}` : `${task.snapshot.aspectRatio} · ${task.snapshot.resolution}`} · ${task.snapshot.count} 張 · ${task.snapshot.workspace}`}</p>{task.snapshot.thinkingMode && <p>思考模式 · {task.snapshot.thinkingMode}</p>}{task.snapshot.complexity && <><p>{task.snapshot.imageMode === 'edit' ? '圖片編輯' : '文字生圖'} · 複雜度 {task.snapshot.complexity} · 格式 {task.snapshot.outputFormat?.toUpperCase()} · 背景 {task.snapshot.background} · 內容審核 {task.snapshot.moderation}</p>{['jpeg', 'webp'].includes(task.snapshot.outputFormat) && <p>壓縮品質 · {task.snapshot.outputCompression}</p>}{task.snapshot.outputFormat === 'gif' && <p>影格數 · {task.snapshot.frameCount} · 每格 {task.snapshot.frameDurationMs} ms</p>}</>}{task.snapshot.quality && <p>畫質 · {{ auto: '自動', low: '低', medium: '中', high: '高', xhigh: '超高', max: '最高' }[task.snapshot.quality]}</p>}{task.snapshot.loraStrength !== undefined && <p>{getDllPicLoraSelection(task.snapshot.modelKey).label || 'LoRA'} · 強度 {task.snapshot.loraStrength}</p>}<pre>{task.snapshot.prompt || '此筆為圖片放大或舊任務，沒有保存 Prompt'}</pre>{task.message && <p>{task.message}</p>}</details>
          </section>)}
        </section>
      </div>
        <section className="dll-tasks" aria-label="任務清單"><button type="button" className="dll-sidebar-close secondary" onClick={() => setSidebarOpen(false)}>收合任務與歷史</button><div className="dll-results-toolbar"><strong>任務與歷史 <small>待執行 {tasks.filter(t => t.status === 'waiting').length} 筆</small></strong>
          <div className="dll-row"><button className="secondary" disabled={!tasks.some(t => t.status === 'waiting') || state.busy} onClick={() => run(dllWorkspace.start)}><Play size={14} />開始清單</button><button className="secondary" disabled={!state.busy || state.paused} onClick={dllWorkspace.pause}><Pause size={14} />暫停清單</button></div></div>
          <p className="dll-help">依序執行；暫停只停止下一筆。重新開啟後，待生成清單需手動開始。</p>
          {pending && <button className="secondary" disabled={state.busy} onClick={() => run(() => dllWorkspace.recoverLegacy(pending))}>查詢上次 Comfy 任務</button>}
          {!activeTasks.length && <p className="dll-help">目前沒有執行中的任務。</p>}
          {activeTasks.slice(0, taskLimit).map(task => <div className="dll-task-row" key={task.id}><button className="dll-text-button" onClick={() => { showHistory(task); }}>{task.snapshot.kind === 'upscale' ? '圖片提升解析度' : task.snapshot.sourceLabel || '自訂 Prompt'}</button><span>{DLL_TASK_LABELS[task.status] || task.status}{task.sequenceIndex ? ` · 第 ${task.sequenceIndex} 張` : ''}{task.queuePosition != null ? ` · 排隊 ${task.queuePosition}` : ''}</span><div className="dll-row">
            {taskNeedsAttention(task) && <button className="secondary" disabled={state.busy} onClick={() => run(() => dllWorkspace.resume(task.id))}>查詢</button>}
            {task.status === 'uncertain' && !state.busy && !pending && <button className="secondary" onClick={() => { if (window.confirm('請先在供應商確認這筆任務已結束。結束本機追蹤不會取消雲端作業，也不會重新提交。確定已核對？')) run(() => dllWorkspace.acknowledge(task.id)); }}>已核對並結束追蹤</button>}
            {(task.status === 'waiting' || taskNeedsAttention(task)) && <button className="secondary" onClick={() => run(() => dllWorkspace.cancel(task.id))}>{task.status === 'waiting' ? '移除待生成' : '請求取消'}</button>}
          </div></div>)}
          {activeTasks.length > taskLimit && <button className="secondary" onClick={() => setTaskLimit(value => value + 20)}>顯示更多任務</button>}
          <h3>歷史成果</h3>
          {!history.length && <p className="dll-help">還沒有歷史成果。</p>}
          {history.slice(currentPage * 10, currentPage * 10 + 10).map(task => {
            const image = allImages.find(item => item.task.id === task.id);
            return <button key={task.id} className="dll-history-item" aria-pressed={displayed?.id === task.id} onClick={() => showHistory(task)}>
              {image && <DllHistoryPreview image={image} />}
              <span>{task.snapshot.sourceLabel || '生成圖片'}<small>{DLL_TASK_LABELS[task.status]} · {new Date(task.createdAt).toLocaleString('zh-TW')}</small></span>
            </button>;
          })}
          {lastPage > 0 && <nav className="dll-row" aria-label="歷史成果分頁"><button className="secondary" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>上一頁</button><span>{currentPage + 1} / {lastPage + 1}</span><button className="secondary" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>下一頁</button></nav>}
        </section>
    </div>
    {picking && <DllDialog onClose={closePicker} label="從成果選取"><h2>從成果選取</h2>
      {error && <p role="alert">{error}</p>}
      <div className="dll-face-choices">{faceChoices.slice(pickerPage * 10, pickerPage * 10 + 10).map(image =>
        <button className="secondary" key={image.key} onClick={() => applyFace(image)}><DllHistoryPreview image={image} /><span>{image.label}</span></button>)}</div>
      {!faceChoices.length && <p>目前沒有可選圖片。</p>}
      <div className="dll-row"><button className="secondary" disabled={!pickerPage} onClick={() => setPickerPage(pickerPage - 1)}>上一頁</button><button className="secondary" disabled={(pickerPage + 1) * 10 >= faceChoices.length} onClick={() => setPickerPage(pickerPage + 1)}>下一頁</button><button className="secondary" onClick={closePicker}>關閉</button></div>
    </DllDialog>}
    {upscale && <DllDialog onClose={closeUpscale}><h2>提升解析度</h2><img src={upscale.src} alt="放大來源原圖" /><p>保留原圖，另存放大版本。</p>{upscale.width && <p>原圖 {upscale.width} × {upscale.height} → 目標 {upscale.width * scale} × {upscale.height * scale}</p>}<label className="field">倍率<select value={scale} onChange={event => setScale(Number(event.target.value))}><option value={2}>2 倍</option><option value={4}>4 倍</option></select></label><p className="dll-help">SeedVR2 · 費用暫無法估算。輸出最多 8192 邊長／32 MP；實際 Cloud 畫質尚待驗收。</p><div className="dll-row"><button className="secondary" onClick={() => setUpscale(null)}>關閉</button><button className="primary-copy-btn" disabled={(state.owner === 'anonymous' && !DLL_LOCAL_ACCEPTANCE) || (upscale.width && (upscale.width * scale > 8192 || upscale.height * scale > 8192 || upscale.width * upscale.height * scale * scale > 32 * 1024 * 1024))} onClick={() => run(async () => { await dllWorkspace.enqueue({ kind: 'upscale', modelKey: 'seedvr2', sourceImage: { src: upscale.src }, parentId: upscale.key, workspace: '完整版', sourceLabel: '圖片提升解析度', scale }); setUpscale(null); })}>加入放大任務</button></div>{state.owner === 'anonymous' && !DLL_LOCAL_ACCEPTANCE && <p>請先登入 Firebase。</p>}</DllDialog>}
    {viewer && <DllImageViewer images={viewer} onClose={closeViewer} />}
  </main>;
}
