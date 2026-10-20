import { useCallback, useState, useSyncExternalStore } from 'react';
import { Download, Expand, Film, Images, ArrowUpRight, Trash2, RotateCcw, Play, Pause } from 'lucide-react';
import DllPicProPanel from './DllPicProPanel.jsx';
import DllDialog from './DllDialog.jsx';
import DllImageViewer from './DllImageViewer.jsx';
import { dllWorkspace, DLL_LOCAL_ACCEPTANCE } from '../lib/dllWorkspaceRuntime.js';
import { DLL_TASK_LABELS, taskNeedsAttention } from '../lib/dllWorkspaceController.js';
import { getDllPicModelConfig } from '../lib/dllPicProClient.js';
import { openVideoWorkspace } from '../lib/comfyVideoClient.js';
import { downloadImageFile } from '../lib/imageDownload.js';
import { downloadMagnificImageViaFirebase } from '../lib/magnificProxyClient.js';
import { readComfyPending } from '../lib/comfyCloudProxyClient.js';
import '../styles/dllWorkspace.css';

export default function DllPicWorkspace({ sources, incoming }) {
  const state = useSyncExternalStore(dllWorkspace.subscribe, dllWorkspace.getSnapshot);
  const [revision, setRevision] = useState(0);
  const [tab, setTab] = useState('current');
  const [historyLimit, setHistoryLimit] = useState(10);
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
  const visible = tab === 'history' ? tasks.slice(0, historyLimit) : current ? [current] : [];
  const allImages = tasks.flatMap(task => (task.images || []).map((image, index) => ({ ...image, key: `${task.id}:${index}`, task, index, label: task.snapshot.kind === 'upscale' ? `放大版本 · ${task.snapshot.scale} 倍` : `${task.snapshot.sourceLabel || '生成圖片'} · 第 ${index + 1} 張` })));
  const selectedImages = allImages.filter(image => checked.includes(image.key));
  const draft = state.draft || { sources, workspaceId: 'Prompt 工作台' };
  const applyDraft = next => { dllWorkspace.draft(next); setRevision(value => value + 1); setMobile('settings'); };
  const bringSources = () => {
    if (draft.custom && draft.customPrompt && !window.confirm('帶入新來源將取代目前自訂 Prompt，確定帶入？')) return;
    applyDraft({ ...draft, ...(incoming?.settings || {}), sources: incoming?.sources || sources, workspaceId: incoming?.workspaceId || 'Prompt 工作台', custom: false, customPrompt: '' });
  };
  const run = async work => { setError(''); try { await work(); } catch (e) { setError(e.message); } };
  if (!state.ready) return <p role="status">{state.error || '正在載入此瀏覽器的圖片工作區…'}</p>;
  return <main className="dll-workspace">
    {DLL_LOCAL_ACCEPTANCE && <p className="dll-workspace-error" role="status">本機模擬驗收 · 不呼叫生成服務、不扣額；範例圖片與放大效果均為測試資料，使用獨立儲存空間。</p>}
    <div className="dll-workspace-toolbar"><p>生成、比較與整理圖片 <span>・保存在此瀏覽器</span></p>
      <button className="secondary" onClick={bringSources}>帶入{incoming?.workspaceId || 'Prompt 工作台'}來源</button></div>
    <div className="dll-mobile-tabs"><button className={mobile === 'settings' ? 'tab-primary-active' : 'secondary'} onClick={() => setMobile('settings')}>設定</button><button className={mobile === 'results' ? 'tab-primary-active' : 'secondary'} onClick={() => setMobile('results')}>成果（{allImages.length}）</button></div>
    {(error || state.error) && <p role="alert" className="dll-workspace-error">{error || state.error}</p>}
    <div className={`dll-workspace-grid mobile-${mobile}`}>
      <aside className="dll-workspace-form"><DllPicProPanel key={`${state.owner}:${revision}`} full title="DLL_PIC Pro" workspaceId={draft.workspaceId || '完整版'} promptSources={draft.sources || sources} initialSettings={draft} /></aside>
      <div className="dll-workspace-main">
        <section className="dll-results" aria-label="圖片成果">
          <div className="dll-results-toolbar"><div className="dll-row"><button className={tab === 'current' ? 'tab-primary-active' : 'secondary'} onClick={() => setTab('current')}>本次成果</button><button className={tab === 'history' ? 'tab-primary-active' : 'secondary'} onClick={() => setTab('history')}>歷史成果</button></div>
            <button className="secondary" disabled={selectedImages.length !== 2} onClick={() => setViewer(selectedImages)}>比較已選（{selectedImages.length}/2）</button></div>
          {!visible.some(t => t.images?.length) && <div className="dll-empty"><Images size={40} /><h2>{current && tab === 'current' ? DLL_TASK_LABELS[current.status] || '等待結果' : '從一張圖片開始'}</h2><p>選擇左側 Prompt 與模型，生成後在這裡查看、比較與提升解析度。</p></div>}
          {visible.map(task => <section key={task.id} className="dll-result-group">
            <div className="dll-result-heading"><div><strong>{task.snapshot.kind === 'upscale' ? '提升解析度' : task.snapshot.sourceLabel || '生成圖片'}</strong><small>{new Date(task.createdAt).toLocaleString('zh-TW')} · {DLL_TASK_LABELS[task.status]}</small></div>
              <div className="dll-row"><button className="dll-text-button" disabled={!task.snapshot.prompt} onClick={() => applyDraft({ ...task.snapshot, sources: [{ id: task.snapshot.sourceId, label: task.snapshot.sourceLabel, value: task.snapshot.prompt, aspectRatio: task.snapshot.lockAspectRatio ? task.snapshot.aspectRatio : undefined, lockAspectRatio: task.snapshot.lockAspectRatio }], selectedSourceId: task.snapshot.sourceId, custom: true, customPrompt: task.snapshot.prompt, workspaceId: task.snapshot.workspace })}><RotateCcw size={14} />沿用設定</button>
              <button className="dll-text-button" disabled={state.busy || taskNeedsAttention(task)} onClick={() => { if (window.confirm('刪除此筆本機紀錄與圖片？已下載的檔案不受影響。')) run(() => dllWorkspace.remove(task.id)); }}><Trash2 size={14} />刪除</button></div></div>
            <div className="dll-image-grid">{allImages.filter(image => image.task.id === task.id).map(image => <article className={`dll-result-card ${checked.includes(image.key) ? 'selected' : ''}`} key={image.key}>
              <label className="dll-image-selection"><input type="checkbox" checked={checked.includes(image.key)} onChange={event => setChecked(list => event.target.checked ? [...list.slice(-1), image.key] : list.filter(id => id !== image.key))} />{image.label}</label>
              <button className="dll-image-open" onClick={() => setViewer([image])}><img src={image.src} alt={image.label} loading="lazy" /></button>
              <p className="dll-image-meta">{image.width && `${image.width} × ${image.height} · `}{task.snapshot.kind === 'upscale' ? 'SeedVR2' : getDllPicModelConfig(task.snapshot.modelKey).label} {image.meta?.seed != null && `· Seed ${image.meta.seed}`}</p>
              <div className="dll-card-actions"><button className="secondary" onClick={() => setViewer([image])}><Expand size={14} />檢視大圖</button><button className="secondary" onClick={() => run(() => downloadImageFile({ src: image.src, index: image.index, remoteDownload: downloadMagnificImageViaFirebase }))}><Download size={14} />下載</button><button className="secondary" onClick={() => { setUpscale(image); setScale(2); }}><ArrowUpRight size={14} />提升解析度</button><button className="secondary" disabled={DLL_LOCAL_ACCEPTANCE} title={DLL_LOCAL_ACCEPTANCE ? '影片入口請至一般模式驗收' : undefined} onClick={() => openVideoWorkspace(image, image.index)}><Film size={14} />製作影片</button></div>
              {Number.isSafeInteger(image.meta?.seed) && task.snapshot.kind !== 'upscale' && <button className="dll-text-button" onClick={() => applyDraft({ ...task.snapshot, seed: image.meta.seed, count: 1, sources: draft.sources, custom: true, customPrompt: task.snapshot.prompt, workspaceId: task.snapshot.workspace })}>沿用此張 Seed</button>}
              {task.snapshot.parentId && <button className="dll-text-button" onClick={() => { const parent = allImages.find(i => i.key === task.snapshot.parentId); if (parent) setViewer([parent, image]); else setError('原圖已從此瀏覽器刪除'); }}>比較原圖與放大版本</button>}
            </article>)}</div>
            <details className="dll-task-details"><summary>查看實際生成設定</summary><p>{task.snapshot.kind === 'upscale' ? `SeedVR2 · ${task.snapshot.scale} 倍 · 保留原圖` : `${task.snapshot.aspectRatio} · ${task.snapshot.resolution} · ${task.snapshot.count} 張 · ${task.snapshot.workspace}`}</p>{task.snapshot.loraStrength !== undefined && <p>Asian Mix LoKr · 強度 {task.snapshot.loraStrength}</p>}<pre>{task.snapshot.prompt || '此筆為圖片放大或舊任務，沒有保存 Prompt'}</pre>{task.message && <p>{task.message}</p>}</details>
          </section>)}
          {tab === 'history' && tasks.length > historyLimit && <button className="secondary" onClick={() => setHistoryLimit(value => value + 10)}>載入更多歷史</button>}
        </section>
        <section className="dll-tasks" aria-label="任務清單"><div className="dll-results-toolbar"><strong>任務清單 <small>待執行 {tasks.filter(t => t.status === 'waiting').length} 筆</small></strong>
          <div className="dll-row"><button className="secondary" disabled={!tasks.some(t => t.status === 'waiting') || state.busy} onClick={() => run(dllWorkspace.start)}><Play size={14} />開始清單</button><button className="secondary" disabled={!state.busy || state.paused} onClick={dllWorkspace.pause}><Pause size={14} />暫停清單</button></div></div>
          <p className="dll-help">依序執行；暫停只停止下一筆。重新開啟後，待生成清單需手動開始。</p>
          {pending && <button className="secondary" disabled={state.busy} onClick={() => run(() => dllWorkspace.recoverLegacy(pending))}>查詢上次 Comfy 任務</button>}
          {!tasks.length && <p className="dll-help">還沒有任務。</p>}
          {tasks.slice(0, taskLimit).map(task => <div className="dll-task-row" key={task.id}><button className="dll-text-button" onClick={() => { dllWorkspace.select(task.id); setTab('current'); setMobile('results'); }}>{task.snapshot.kind === 'upscale' ? '圖片提升解析度' : task.snapshot.sourceLabel || '自訂 Prompt'}</button><span>{DLL_TASK_LABELS[task.status] || task.status}{task.sequenceIndex ? ` · 第 ${task.sequenceIndex} 張` : ''}{task.queuePosition != null ? ` · 排隊 ${task.queuePosition}` : ''}</span><div className="dll-row">
            {taskNeedsAttention(task) && <button className="secondary" disabled={state.busy} onClick={() => run(() => dllWorkspace.resume(task.id))}>查詢</button>}
            {task.status === 'uncertain' && !state.busy && !pending && <button className="secondary" onClick={() => { if (window.confirm('請先在供應商確認這筆任務已結束。結束本機追蹤不會取消雲端作業，也不會重新提交。確定已核對？')) run(() => dllWorkspace.acknowledge(task.id)); }}>已核對並結束追蹤</button>}
            {(task.status === 'waiting' || taskNeedsAttention(task)) && <button className="secondary" onClick={() => run(() => dllWorkspace.cancel(task.id))}>{task.status === 'waiting' ? '移除待生成' : '請求取消'}</button>}
          </div></div>)}
          {tasks.length > taskLimit && <button className="secondary" onClick={() => setTaskLimit(value => value + 20)}>顯示更多任務</button>}
        </section>
      </div>
    </div>
    {upscale && <DllDialog onClose={closeUpscale}><h2>提升解析度</h2><img src={upscale.src} alt="放大來源原圖" /><p>保留原圖，另存放大版本。</p>{upscale.width && <p>原圖 {upscale.width} × {upscale.height} → 目標 {upscale.width * scale} × {upscale.height * scale}</p>}<label className="field">倍率<select value={scale} onChange={event => setScale(Number(event.target.value))}><option value={2}>2 倍</option><option value={4}>4 倍</option></select></label><p className="dll-help">SeedVR2 · 費用暫無法估算。輸出最多 8192 邊長／32 MP；實際 Cloud 畫質尚待驗收。</p><div className="dll-row"><button className="secondary" onClick={() => setUpscale(null)}>關閉</button><button className="primary-copy-btn" disabled={(state.owner === 'anonymous' && !DLL_LOCAL_ACCEPTANCE) || (upscale.width && (upscale.width * scale > 8192 || upscale.height * scale > 8192 || upscale.width * upscale.height * scale * scale > 32 * 1024 * 1024))} onClick={() => run(async () => { await dllWorkspace.enqueue({ kind: 'upscale', modelKey: 'seedvr2', sourceImage: { src: upscale.src }, parentId: upscale.key, workspace: '完整版', sourceLabel: '圖片提升解析度', scale }); setUpscale(null); })}>加入放大任務</button></div>{state.owner === 'anonymous' && !DLL_LOCAL_ACCEPTANCE && <p>請先登入 Firebase。</p>}</DllDialog>}
    {viewer && <DllImageViewer images={viewer} onClose={closeViewer} />}
  </main>;
}
