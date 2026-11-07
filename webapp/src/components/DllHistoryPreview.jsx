import { useEffect, useState } from 'react';
import { dllWorkspaceStorage as storage } from '../lib/dllWorkspaceStorage.js';

let pending = Promise.resolve();
async function preview(task, index) {
  const key = [task.owner, task.id, index];
  const cached = await storage.readPreview(key);
  if (cached) return cached;
  const original = (await storage.readTask(task.owner, task.id)).images[index];
  const image = new Image();
  image.src = original.src;
  await image.decode();
  const ratio = Math.min(1, 320 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.78));
  if (!blob) throw new Error('無法建立縮圖');
  await storage.savePreview(key, blob).catch(() => {});
  return blob;
}

export default function DllHistoryPreview({ image }) {
  const { task, index } = image;
  const [thumbnail, setThumbnail] = useState(null);
  useEffect(() => {
    if (image.src) return;
    let active = true;
    let url;
    pending = pending.then(async () => {
      if (!active) return;
      const blob = await preview(task, index);
      if (active) {
        url = URL.createObjectURL(blob);
        setThumbnail({ key: image.key, url });
      }
    }).catch(() => {});
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [task, index, image.src, image.key]);
  const src = image.src || (thumbnail?.key === image.key && thumbnail.url);
  return src ? <img src={src} alt={image.label} loading="lazy" /> : <span>{image.label} · 檢視原圖</span>;
}
