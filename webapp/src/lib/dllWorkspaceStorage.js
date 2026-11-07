let DB = 'dll_pic_workspace_v1';
export function configureDllAcceptanceStorage() { DB = 'dll_pic_acceptance_v1'; }

export function summarizeTask(task) {
  const snapshot = { ...task.snapshot };
  for (const field of ['sourceImage', 'referenceImage', 'mask', 'markup']) delete snapshot[field];
  return { ...task, summaryOnly: true, snapshot, images: (task.images || []).map(image => {
    const metadata = { ...image };
    delete metadata.src;
    return metadata;
  }) };
}

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 2);
    request.onupgradeneeded = event => {
      const db = request.result;
      if (event.oldVersion === 0) {
        db.createObjectStore('tasks', { keyPath: ['owner', 'id'] });
        db.createObjectStore('drafts');
      }
      const summaries = db.createObjectStore('summaries', { keyPath: ['owner', 'id'] });
      db.createObjectStore('previews');
      // Index legacy records one at a time. Originals stay in the same store.
      const cursor = request.transaction.objectStore('tasks').openCursor();
      cursor.onsuccess = () => {
        if (!cursor.result) return;
        summaries.put(summarizeTask(cursor.result.value));
        cursor.result.continue();
      };
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact(stores, mode, operation) {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(stores, mode);
      const request = operation(tx);
      tx.oncomplete = () => resolve(request?.result);
      tx.onerror = tx.onabort = () => reject(new Error('圖片資料存取失敗，請確認瀏覽器儲存空間'));
    });
  } finally { db.close(); }
}
function read(store, key) {
  return transact(store, 'readonly', tx => tx.objectStore(store).get(key));
}
const imageRange = (owner, id) => IDBKeyRange.bound([owner, id, 0], [owner, id, Infinity]);

export const dllWorkspaceStorage = {
  summarizeTask,
  async load(owner) {
    const range = IDBKeyRange.bound([owner, ''], [owner, '\uffff']);
    const tasks = await transact('summaries', 'readonly', tx => tx.objectStore('summaries').getAll(range));
    return { tasks, draft: await read('drafts', owner) };
  },
  async readTask(owner, id) {
    const task = await read('tasks', [owner, id]);
    if (!task) throw new Error('找不到原始任務，請重新開啟工作區');
    return task;
  },
  saveTask(task) {
    if (task.summaryOnly) throw new Error('缺少任務原始資料');
    return transact(['tasks', 'summaries', 'previews'], 'readwrite', tx => {
      tx.objectStore('tasks').put(task);
      tx.objectStore('summaries').put(summarizeTask(task));
      tx.objectStore('previews').delete(imageRange(task.owner, task.id));
    });
  },
  saveDraft: (owner, draft) => transact('drafts', 'readwrite', tx => tx.objectStore('drafts').put(draft, owner)),
  remove: (owner, id) => transact(['tasks', 'summaries', 'previews'], 'readwrite', tx => {
    for (const name of ['tasks', 'summaries']) tx.objectStore(name).delete([owner, id]);
    tx.objectStore('previews').delete(imageRange(owner, id));
  }),
  readPreview: key => read('previews', key),
  savePreview: (key, blob) => transact(['previews','tasks'], 'readwrite', tx => {
    const exists = tx.objectStore('tasks').getKey(key.slice(0, 2));
    exists.onsuccess = () => { if (exists.result) tx.objectStore('previews').put(blob, key); };
  }),
};
