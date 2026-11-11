import { useState } from 'react';
import { GIF_SIZE_OPTIONS, readOpenAIImage } from '../lib/openaiImage26.js';

export default function OpenAI26Controls({ settings, setSettings, disabled, resolution }) {
  const [fileError, setFileError] = useState('');
  const update = patch => setSettings(previous => ({ ...previous, ...patch }));
  const load = async (file, target) => {
    setFileError('');
    try {
      const reference = target === 'referenceImage' ? null : { width: settings.referenceWidth, height: settings.referenceHeight };
      if (target !== 'referenceImage' && !settings.referenceImage) throw new Error('請先選擇參考圖片');
      const image = await readOpenAIImage(file, { transparent: target !== 'referenceImage', reference });
      if (target === 'referenceImage') update({ referenceImage: image.src, referenceWidth: image.width, referenceHeight: image.height, mask: '', markup: '' });
      else update({ [target]: image.src, [target === 'mask' ? 'markup' : 'mask']: '' });
    } catch (error) { setFileError(error.message); }
  };
  return <div className="openai26-settings">
    <div className="dll-source-choices" aria-label="圖片模式">
      <button type="button" className={settings.imageMode === 'generate' ? 'tab-primary-active' : 'secondary'} disabled={disabled} onClick={() => update({ imageMode: 'generate' })}>文字生圖</button>
      <button type="button" className={settings.imageMode === 'edit' ? 'tab-primary-active' : 'secondary'} disabled={disabled} onClick={() => update({ imageMode: 'edit', ...(['gif', 'svg'].includes(settings.outputFormat) ? { outputFormat: 'png' } : {}) })}>圖片編輯</button>
    </div>
    <div className="dll-pic-settings-grid">
      <label className="field dll-pic-field"><span>複雜度</span><select aria-label="複雜度" disabled={disabled} value={settings.complexity} onChange={e => update({ complexity: e.target.value })}><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></label>
      <label className="field dll-pic-field"><span>輸出格式</span><select aria-label="輸出格式" disabled={disabled} value={settings.outputFormat} onChange={e => update({ outputFormat: e.target.value })}><option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WebP</option>{settings.imageMode === 'generate' && <><option value="gif">GIF</option><option value="svg">SVG</option></>}</select></label>
      <label className="field dll-pic-field"><span>背景</span><select aria-label="背景" disabled={disabled} value={settings.background} onChange={e => update({ background: e.target.value })}><option value="auto">自動</option><option value="opaque">不透明</option><option value="transparent">透明</option></select></label>
      <label className="field dll-pic-field"><span>內容審核</span><select aria-label="內容審核" disabled={disabled} value={settings.moderation} onChange={e => update({ moderation: e.target.value })}><option value="auto">自動</option><option value="low">低</option></select></label>
    </div>
    {resolution === 'custom' && settings.outputFormat !== 'gif' && <div className="dll-pic-settings-grid"><label className="field"><span>寬度 px</span><input aria-label="自訂寬度" type="number" min="16" max="3840" step="16" value={settings.customWidth} onChange={e => update({ customWidth: e.target.value === '' ? '' : Number(e.target.value) })} /></label><label className="field"><span>高度 px</span><input aria-label="自訂高度" type="number" min="16" max="3840" step="16" value={settings.customHeight} onChange={e => update({ customHeight: e.target.value === '' ? '' : Number(e.target.value) })} /></label><small>16 的倍數，長短邊比例不超過 3:1。</small></div>}
    {settings.outputFormat === 'gif' && <label className="field dll-pic-field">
      <span>GIF 尺寸</span>
      <select aria-label="GIF 尺寸" disabled={disabled} value={settings.gifSize ?? 'auto'} onChange={e => update({ gifSize: e.target.value })}>
        {GIF_SIZE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>}
    <details className="dll-advanced-settings"><summary>進階設定</summary>
      {['jpeg', 'webp'].includes(settings.outputFormat) && <label className="field"><span>壓縮品質（0–100）</span><input aria-label="壓縮品質" type="number" min="0" max="100" value={settings.outputCompression} onChange={e => update({ outputCompression: e.target.value === '' ? '' : Number(e.target.value) })} /></label>}
      {settings.outputFormat === 'gif' && <div className="dll-pic-settings-grid"><label className="field"><span>影格數（2–16）</span><input aria-label="GIF 影格數" type="number" min="2" max="16" value={settings.frameCount} onChange={e => update({ frameCount: e.target.value === '' ? '' : Number(e.target.value) })} /></label><label className="field"><span>每格毫秒（20–2000）</span><input aria-label="GIF 每格毫秒" type="number" min="20" max="2000" step="10" value={settings.frameDurationMs} onChange={e => update({ frameDurationMs: e.target.value === '' ? '' : Number(e.target.value) })} /></label></div>}
      {settings.outputFormat === 'svg' && <p className="dll-help">SVG 使用服務的預設繪製模型，單次請求一張。</p>}
      {settings.outputFormat === 'gif' && <p className="dll-help">GIF 支援 2–16 影格；選 2 張依序生成，選 4 張一次送出。尺寸、影格數與張數受 API 總像素限制，超限時請降低影格數或張數，或改用自動尺寸。</p>}
      {!['jpeg', 'webp', 'gif', 'svg'].includes(settings.outputFormat) && <p className="dll-help">JPEG／WebP 壓縮、GIF 影格與 SVG 設定會依格式顯示。</p>}
    </details>
    {settings.imageMode === 'edit' && <section className="dll-prompt-section" aria-label="圖片編輯來源">
      <label className="field"><span>參考圖片（PNG、JPEG、WebP；2 MB 以內）</span><input aria-label="參考圖片" type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled} onChange={e => { if (e.target.files?.[0]) load(e.target.files[0], 'referenceImage'); e.target.value = ''; }} /></label>
      {settings.referenceImage && <div><img src={settings.referenceImage} alt="參考圖片預覽" style={{ maxWidth: '160px', maxHeight: '160px', objectFit: 'contain' }} /><p className="dll-help">{settings.referenceWidth} × {settings.referenceHeight}</p><button type="button" className="dll-text-button" onClick={() => update({ referenceImage: '', referenceWidth: 0, referenceHeight: 0, mask: '', markup: '' })}>移除參考圖</button></div>}
      <label className="field"><span>遮罩 PNG（選用）</span><input aria-label="遮罩 PNG" type="file" accept="image/png" disabled={disabled || !settings.referenceImage} onChange={e => { if (e.target.files?.[0]) load(e.target.files[0], 'mask'); e.target.value = ''; }} /></label>
      <label className="field"><span>標記圖 PNG（選用，與遮罩擇一）</span><input aria-label="標記圖 PNG" type="file" accept="image/png" disabled={disabled || !settings.referenceImage} onChange={e => { if (e.target.files?.[0]) load(e.target.files[0], 'markup'); e.target.value = ''; }} /></label>
      {(settings.mask || settings.markup) && <p className="dll-help">已選擇{settings.mask ? '遮罩' : '標記圖'}。<button type="button" className="dll-text-button" onClick={() => update({ mask: '', markup: '' })}>移除</button></p>}
      <p className="dll-help">遮罩或標記圖需與參考圖同尺寸，且包含透明區域。</p>
      {fileError && <p role="alert">{fileError}</p>}
    </section>}
  </div>;
}
