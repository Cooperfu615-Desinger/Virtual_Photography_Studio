let DB = 'dll_pic_workspace_v1';
export function configureDllAcceptanceStorage() { DB = 'dll_pic_acceptance_v1'; }
async function transact(store, mode, operation) {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('tasks', { keyPath: ['owner', 'id'] });
      request.result.createObjectStore('drafts');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('無法開啟圖片儲存空間'));
  });
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const request = operation(tx.objectStore(store));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () => reject(new Error('圖片資料保存失敗，請下載圖片並檢查瀏覽器空間；未繼續提交下一筆'));
    });
  } finally { db.close(); }
}
export const dllWorkspaceStorage = {
  async load(owner) {
    const tasks = await transact('tasks', 'readonly', store => store.getAll(IDBKeyRange.bound([owner, ''], [owner, '\uffff'])));
    const draft = await transact('drafts', 'readonly', store => store.get(owner));
    return { tasks: tasks.filter(task => task.owner === owner), draft };
  },
  saveTask: task => transact('tasks', 'readwrite', store => store.put(task)),
  saveDraft: (owner, draft) => transact('drafts', 'readwrite', store => store.put(draft, owner)),
  remove: (owner, id) => transact('tasks', 'readwrite', store => store.delete([owner, id])),
};
