export const DLL_TASK_LABELS = {
  waiting: '待執行', preparing: '準備中', submitting: '正在提交', queued: '雲端排隊中', running: '生成中',
  succeeded: '已完成', partial: '部分完成', failed: '未完成', uncertain: '待確認', canceling: '取消中', canceled: '已取消',
};
const active = ['preparing', 'submitting', 'queued', 'running', 'canceling'];
export const taskNeedsAttention = task => task.status === 'uncertain' || active.includes(task.status);
export function generationSnapshot(input) {
  const { modelKey, prompt = '', aspectRatio = '9:16', resolution = '1k', count = 1, seed = '',
    sourceId = 'custom', sourceLabel = '自訂', workspace = '完整版', lockAspectRatio = false,
    kind = 'generate', parentId = null, sourceImage = null, scale = 2 } = input;
  if (kind === 'generate' && !prompt.trim()) throw new Error('請先選擇或輸入 Prompt');
  if (![1, 2].includes(Number(count))) throw new Error('每筆可生成 1 或 2 張');
  if (seed !== '' && (!Number.isSafeInteger(Number(seed)) || Number(seed) < 0)) throw new Error('Seed 需為非負整數');
  return structuredClone({ modelKey, prompt, aspectRatio, resolution, count: Number(count), seed,
    sourceId, sourceLabel, workspace, lockAspectRatio, kind, parentId, sourceImage, scale });
}
export function createDllWorkspaceController({ storage, execute, resume, cancel, materialize,
  pending = () => null, locks = globalThis.navigator?.locks, uuid = () => crypto.randomUUID(), now = Date.now } = {}) {
  let state = { owner: 'anonymous', ready: false, tasks: [], draft: null, busy: false, paused: true, selected: null, error: '' };
  let epoch = 0; let draftWrites = Promise.resolve();
  const listeners = new Set();
  const emit = patch => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  const check = stamp => { if (stamp !== epoch) throw new Error('登入帳號已變更，已停止操作'); };
  const update = task => emit({ tasks: [...state.tasks.filter(t => t.id !== task.id), task].sort((a,b) => a.createdAt - b.createdAt) });
  async function save(task, stamp) { check(stamp); update(task); await storage.saveTask(structuredClone(task)); check(stamp); }
  async function one(task, recovery, stamp) {
    const onProgress = async job => {
      check(stamp);
      task = { ...task, status: job.status === 'succeeded' ? 'running' : job.status,
        progress: job.progress, queuePosition: job.queuePosition, sequenceIndex: job.sequenceIndex, requestId: job.requestId || task.requestId };
      await save(task, stamp);
    };
    const onImages = async images => {
      check(stamp);
      const existing = task.images || [];
      // Recovery can query only a subset of expired Cloud assets. Keep already
      // downloaded originals and deduplicate durable Cloud asset identities.
      if (recovery) images = [...existing.filter(image => image.assetId && !images.some(next => next.assetId === image.assetId)), ...images];
      const local = [];
      task = { ...task, images }; update(task);
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const previous = image.assetId ? existing.find(saved => saved.assetId === image.assetId) : existing[i];
        local.push(previous?.assetId && previous.assetId === image.assetId ? previous : await materialize(image));
        check(stamp);
      }
      task = { ...task, images: local };
      await save(task, stamp);
    };
    try {
      if (!recovery) { task = { ...task, status: 'submitting' }; await save(task, stamp); }
      const result = await (recovery ? resume : execute)(task, { onProgress, onImages });
      check(stamp);
      if (!task.images?.length && result.images?.length) await onImages(result.images);
      task = { ...task, status: result.status === 'canceled' ? 'canceled' : result.errors?.length || result.meta?.partial ? 'partial' : 'succeeded',
        meta: result.meta, message: (result.errors || []).join('\n') };
      await save(task, stamp);
      if (task.status !== 'succeeded') emit({ paused: true });
    } catch (error) {
      if (stamp !== epoch) return;
      // Once a request was attempted, never infer that a network failure means no charge.
      task = { ...task, images: task.images?.length ? task.images : (error.images || []),
        status: error.canceled ? 'canceled' : error.terminal || task.status === 'waiting' ? (task.images?.length ? 'partial' : 'failed') : 'uncertain', message: error.message || String(error) };
      update(task);
      try { await storage.saveTask(task); } catch { /* In-memory images remain downloadable. */ }
      emit({ paused: true, error: task.message });
    }
  }
  async function run(id, recovery = false, all = false) {
    if (!state.ready || state.busy) return;
    const stamp = epoch; emit({ busy: true, paused: !all, error: '' });
    try {
      if (!locks) throw new Error('此瀏覽器不支援安全任務鎖');
      await locks.request('dll_pic_workspace_execution_v1', { ifAvailable: true }, async lock => {
        if (!lock) throw new Error('另一個分頁正在生成，請稍後重新載入任務');
        const latest = await storage.load(state.owner); check(stamp);
        latest.tasks.sort((a,b) => a.createdAt - b.createdAt);
        emit({ tasks: latest.tasks });
        if (!recovery && (state.tasks.some(taskNeedsAttention) || pending())) throw new Error('請先查詢待確認的任務，再開始新的生成');
        let task = state.tasks.find(t => t.id === id) || (all ? state.tasks.find(t => t.status === 'waiting') : null);
        if (recovery && !task) throw new Error('找不到待查詢任務');
        while (task) {
          if (!recovery && task.status !== 'waiting') throw new Error('這筆任務已提交，請使用查詢或沿用設定');
          emit({ selected: task.id });
          await one(task, recovery, stamp); check(stamp);
          if (!all || state.paused) break;
          task = state.tasks.find(t => t.status === 'waiting');
        }
      });
    } catch (error) { if (stamp === epoch) emit({ error: error.message, paused: true }); }
    finally { if (stamp === epoch) emit({ busy: false, paused: true }); }
  }
  async function idleMutation(id, mutate) {
    const stamp = epoch;
    if (state.busy || !locks) throw new Error('請先完成目前任務');
    await locks.request('dll_pic_workspace_execution_v1', { ifAvailable: true }, async lock => {
      if (!lock) throw new Error('另一個分頁正在生成，請稍後重新載入任務');
      const latest = await storage.load(state.owner); check(stamp);
      emit({ tasks: latest.tasks.sort((a, b) => a.createdAt - b.createdAt) });
      await mutate(state.tasks.find(t => t.id === id), stamp);
    });
  }
  return {
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }, getSnapshot: () => state,
    async setUser(uid) {
      const owner = uid || 'anonymous';
      if (state.ready && state.owner === owner) return;
      const stamp = ++epoch;
      emit({ owner, ready: false, tasks: [], draft: null, busy: false, paused: true, selected: null, error: '' });
      try {
        const data = await storage.load(owner); check(stamp);
        emit({ ...data, tasks: data.tasks.map(t => taskNeedsAttention(t) ? { ...t, status: 'uncertain' } : t).sort((a, b) => a.createdAt - b.createdAt), ready: true });
        // Only query already-attempted Cloud jobs; waiting jobs never auto-start.
        const interrupted = state.tasks.find(t => t.status === 'uncertain' && (t.snapshot.kind === 'upscale' || t.snapshot.legacy || t.snapshot.modelKey?.startsWith('comfy')));
        if (interrupted) await run(interrupted.id, true);
      } catch (error) { if (stamp === epoch) emit({ error: error.message }); }
    },
    draft(draft) {
      const owner = state.owner, stamp = epoch;
      emit({ draft });
      draftWrites = draftWrites.catch(() => {}).then(() => storage.saveDraft(owner, structuredClone(draft)))
        .catch(error => { if (stamp === epoch) emit({ error: error.message }); });
    },
    async enqueue(input, start = false) {
      if (!state.ready) throw new Error('圖片儲存空間尚未就緒');
      const stamp = epoch;
      const task = { id: uuid(), owner: state.owner, createdAt: Math.max(now(), ...state.tasks.map(t => t.createdAt + 1)), status: 'waiting', images: [], snapshot: generationSnapshot(input) };
      await save(task, stamp); emit({ selected: task.id });
      if (start) await run(task.id);
      return task.id;
    },
    start: () => run(null, false, true), resume: id => run(id, true),
    pause: () => emit({ paused: true }), select: id => emit({ selected: id }),
    async cancel(id) {
      const stamp = epoch, task = state.tasks.find(t => t.id === id);
      if (!task) return;
      try {
        if (task.status === 'waiting') {
          const cancelWaiting = async (current, currentStamp) => {
            if (current?.status !== 'waiting') throw new Error('任務狀態已更新，請重新確認後取消');
            await save({ ...current, status: 'canceled' }, currentStamp);
          };
          await idleMutation(id, cancelWaiting);
          return;
        }
        const result = await cancel(task); check(stamp);
        // Polling owns terminal state/results; cancellation acknowledgement must not overwrite them.
        if (!state.busy) await save({ ...task, status: result.status === 'canceled' ? 'canceled' : 'uncertain', message: '已提出取消；請查詢確認最後狀態' }, stamp);
      } catch (error) { if (stamp === epoch) emit({ error: error.message }); }
    },
    async acknowledge(id) {
      if (state.busy || pending()) throw new Error('請先完成雲端任務查詢');
      await idleMutation(id, async (task, stamp) => {
        if (task?.status !== 'uncertain') return;
        await save({ ...task, status: task.images?.length ? 'partial' : 'failed', message: `${task.message || ''}\n使用者已核對供應商狀態並結束本機追蹤；沒有重新提交。` }, stamp);
      });
    },
    async remove(id) {
      await idleMutation(id, async (task, stamp) => {
        if (!task || taskNeedsAttention(task)) throw new Error('請先處理未完成任務');
        await storage.remove(state.owner, id); check(stamp);
        emit({ tasks: state.tasks.filter(t => t.id !== id) });
      });
    },
    async recoverLegacy(marker) {
      if (!marker || marker.invalid || marker.uid !== state.owner) throw new Error('請登入原帳號後查詢任務');
      const found = state.tasks.find(t => t.id === marker.requestId);
      if (!found) await save({ id: marker.requestId, owner: state.owner, createdAt: marker.createdAt || now(), status: 'uncertain', images: [],
        snapshot: { kind: 'generate', modelKey: `comfy-${marker.modelKey}`, workspace: '舊任務', prompt: '', count: marker.count, legacy: true } }, epoch);
      return run(marker.requestId, true);
    },
  };
}
