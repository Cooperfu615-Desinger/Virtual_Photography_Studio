import { useState } from 'react';
import { prepareVideoPng } from '../lib/comfyVideoClient.js';
import { seedream55Price } from '../lib/seedream55.js';
import './seedream55Controls.css';

export default function Seedream55Controls({ settings, onChange, resolution, aspectRatio, count, disabled, onBusy }) {
  const [error, setError] = useState('');
  const refs = settings.referenceImages || [];
  const change = patch => onChange(previous => ({ ...previous, ...patch }));
  let usd = null;
  try { usd = seedream55Price({ ...settings, resolution, aspectRatio }, refs.length); } catch { /* Validation is shown next to Generate. */ }
  return <section className="seedream55-settings" aria-label="Seedream 5.5 設定">
    {resolution === 'custom' && <div className="dll-pic-settings-grid">
      {['customWidth', 'customHeight'].map((key, i) => <label className="field" key={key}><span>{i ? '高度' : '寬度'}</span><input type="number" aria-label={i ? 'Seedream 高度' : 'Seedream 寬度'} min="240" max="8594" step="2" value={settings[key]} disabled={disabled} onChange={e => change({ [key]: e.target.value })} /></label>)}
      <small>偶數尺寸，總像素 0.92～4.62 MP；比例 1:16～16:1。</small>
    </div>}
    <div className="dll-pic-settings-grid">
      <label className="field"><span>背景</span><select aria-label="Seedream 背景" value={settings.background} disabled={disabled} onChange={e => change({ background: e.target.value })}><option value="auto">自動</option><option value="opaque">不透明</option><option value="transparent">透明</option></select></label>
      <label className="field"><span>AI 浮水印</span><select aria-label="Seedream 浮水印" value={String(settings.watermark)} disabled={disabled} onChange={e => change({ watermark: e.target.value === 'true' })}><option value="false">關閉</option><option value="true">開啟</option></select></label>
    </div>
    <div className="dll-row"><strong>參考圖片（{refs.length}/10）</strong><label className="secondary dll-file-button">新增圖片<input type="file" multiple accept="image/png,image/jpeg,image/webp" aria-label="新增 Seedream 參考圖片" disabled={disabled || refs.length >= 10} onChange={async e => {
      const files = [...(e.target.files || [])]; e.target.value = ''; setError('');
      if (!files.length) return;
      if (files.length + refs.length > 10) { setError('最多 10 張參考圖片'); return; }
      onBusy(true);
      try {
        const converted = [];
        for (const file of files) {
          if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('請選擇 PNG、JPEG 或 WebP');
          const url = URL.createObjectURL(file);
          try { converted.push((await prepareVideoPng(url)).src); } finally { URL.revokeObjectURL(url); }
        }
        onChange(previous => ({ ...previous, referenceImages: [...(previous.referenceImages || []), ...converted].slice(0, 10) }));
      } catch (err) { setError(err.message); } finally { onBusy(false); }
    }} /></label></div>
    <p className="dll-pic-model-note">依編號在 Prompt 說明每張圖的用途。支援人物、服裝、場景等參考；移除全部即為文生圖。PNG／JPEG／WebP，轉換後每張最多 8 MB。</p>
    <div className="seedream55-references">{refs.map((src, index) => <figure key={`${index}-${src.length}`}><img src={src} alt={`參考圖 ${index + 1}`} /><figcaption>圖 {index + 1}<button type="button" className="dll-text-button" disabled={disabled || index === 0} aria-label={`前移參考圖 ${index + 1}`} onClick={() => { const next = [...refs]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; change({ referenceImages: next }); }}>前移</button><button type="button" className="dll-text-button" disabled={disabled} aria-label={`移除參考圖 ${index + 1}`} onClick={() => change({ referenceImages: refs.filter((_, i) => i !== index) })}>移除</button></figcaption></figure>)}</div>
    {error && <p role="status">{error}</p>}
    {usd !== null && <p className="dll-pic-model-note">預估每張 {(usd * 211).toFixed(2)} Credits · 本次 {count} 張約 {(usd * count * 211).toFixed(2)} Credits（含 {refs.length} 張參考圖，實際依 Cloud 扣額）</p>}
  </section>;
}
