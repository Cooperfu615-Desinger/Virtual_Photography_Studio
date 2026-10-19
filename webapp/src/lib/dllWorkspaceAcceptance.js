// Imported only by the development-only acceptance URL. Never calls a provider.
// Its own database keeps fixtures separate from the user's image history.
export function acceptanceOptions(storage, materialize, imagePath) {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const canceled = new Set();
  const perform = async (task, cb) => {
    await cb.onProgress({ status: 'queued', requestId: task.id, queuePosition: 1 });
    await wait(600);
    await cb.onProgress({ status: 'running', requestId: task.id });
    await wait(900);
    if (canceled.has(task.id)) { const error = new Error('模擬任務已取消'); error.canceled = true; error.terminal = true; throw error; }
    if (task.snapshot.prompt.includes('[offline]')) throw new Error('模擬連線中斷：僅供測試恢復');
    const count = task.snapshot.kind === 'upscale' ? 1 : task.snapshot.count;
    const images = [];
    for (let i = 0; i < count; i++) {
      images.push({ src: task.snapshot.sourceImage?.src || imagePath, mimeType: 'image/avif', meta: { seed: Number(task.snapshot.seed || 1234) + i } });
      await cb.onImages([...images]);
    }
    return { images, errors: [], meta: { simulated: true } };
  };
  return { storage, materialize, pending: () => null, execute: perform,
    resume: async (task, cb) => perform({ ...task, snapshot: { ...task.snapshot, prompt: '恢復測試' } }, cb),
    cancel: async task => { canceled.add(task.id); return { status: 'canceling' }; },
  };
}
