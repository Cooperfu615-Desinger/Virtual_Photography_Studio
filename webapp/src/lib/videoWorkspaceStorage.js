// Large source images live in IndexedDB. The tiny pending marker is written
// synchronously before a paid request and never contains prompts or URLs.
const DB = 'dll_video_workspace_v1';
export const pendingKey = uid => `dll_video_pending_v1:${uid}`;
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('workspaces');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('無法開啟影片儲存空間'));
  });
}
async function transact(uid, state) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('workspaces', state === undefined ? 'readonly' : 'readwrite');
      const request = state === undefined ? tx.objectStore('workspaces').get(uid) : tx.objectStore('workspaces').put(state, uid);
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () => reject(new Error('影片資料無法保存，請確認瀏覽器儲存空間'));
    });
  } finally { db.close(); }
}
export const videoStorage = {
  load: uid => transact(uid),
  save: (uid, state) => transact(uid, state),
  pending: uid => {
    const raw = localStorage.getItem(pendingKey(uid));
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!/^[a-f0-9-]{36}$/.test(value.requestId || '') || value.uid !== uid) throw new Error('影片追蹤資料格式不符，請保留資料並確認雲端作業');
    return value;
  },
  setPending: (uid, value) => value ? localStorage.setItem(pendingKey(uid), JSON.stringify(value)) : localStorage.removeItem(pendingKey(uid)),
};
