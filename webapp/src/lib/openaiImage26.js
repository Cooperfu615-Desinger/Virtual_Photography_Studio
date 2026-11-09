export const OPENAI_26_KEYS = Object.freeze(['openaiImage26Flare', 'openaiImage26Sunburst']);
export const isOpenAI26 = key => OPENAI_26_KEYS.includes(key);
export const imageCountOptions = (modelKey, format) =>
  isOpenAI26(modelKey) && format !== 'svg' ? [1, 2, 4] : [1, 2];
export const OPENAI_26_DEFAULTS = Object.freeze({ imageMode: 'generate', quality: 'medium', complexity: 'high', outputFormat: 'png', background: 'auto', moderation: 'auto', outputCompression: 100, frameCount: 9, frameDurationMs: 200, customWidth: 1024, customHeight: 1536, referenceImage: '', referenceWidth: 0, referenceHeight: 0, mask: '', markup: '' });

export function openAI26Settings(input = {}) {
  const next = { ...OPENAI_26_DEFAULTS, ...Object.fromEntries(Object.keys(OPENAI_26_DEFAULTS).filter(key => input[key] !== undefined).map(key => [key, input[key]])) };
  if (!['generate', 'edit'].includes(next.imageMode)) throw new Error('不支援的圖片模式');
  if (!['auto', 'low', 'medium', 'high', 'xhigh', 'max'].includes(next.quality)) throw new Error('不支援的畫質');
  if (!['low', 'medium', 'high'].includes(next.complexity) || !['auto', 'opaque', 'transparent'].includes(next.background) || !['auto', 'low'].includes(next.moderation)) throw new Error('不支援的圖片設定');
  if (!['png', 'jpeg', 'webp', 'gif', 'svg'].includes(next.outputFormat)) throw new Error('不支援的輸出格式');
  if (next.imageMode === 'edit' && ['gif', 'svg'].includes(next.outputFormat)) throw new Error('圖片編輯僅支援 PNG、JPEG 或 WebP');
  if (next.background === 'transparent' && !['png', 'webp', 'svg'].includes(next.outputFormat)) throw new Error('透明背景僅支援 PNG、WebP 或 SVG');
  if (['jpeg', 'webp'].includes(next.outputFormat) && (!Number.isInteger(next.outputCompression) || next.outputCompression < 0 || next.outputCompression > 100)) throw new Error('壓縮品質需介於 0 至 100');
  if (next.outputFormat === 'gif' && (!Number.isInteger(next.frameCount) || next.frameCount < 2 || next.frameCount > 16 || !Number.isInteger(next.frameDurationMs) || next.frameDurationMs < 20 || next.frameDurationMs > 2000)) throw new Error('GIF 影格數或間隔不支援');
  if (input.resolution === 'custom' && next.outputFormat !== 'gif') {
    const w = next.customWidth, h = next.customHeight;
    if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0 || w > 3840 || h > 3840 || w % 16 || h % 16 || Math.max(w,h) / Math.min(w,h) > 3 || w*h < 655360 || w*h > 8294400) throw new Error('自訂尺寸不符合限制');
  }
  if (next.imageMode === 'edit' && !next.referenceImage) throw new Error('請先選擇參考圖片');
  if (next.mask && next.markup) throw new Error('遮罩與標記圖無法同時使用');
  if (next.imageMode === 'generate') Object.assign(next, { referenceImage: '', referenceWidth: 0, referenceHeight: 0, mask: '', markup: '' });
  return next;
}

export async function readOpenAIImage(file, { transparent = false, reference = null } = {}) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error('請選擇 2 MB 以下的 PNG、JPEG 或 WebP 圖片');
  if (transparent && file.type !== 'image/png') throw new Error('遮罩或標記圖需為透明 PNG');
  const bitmap = await createImageBitmap(file);
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width > 4096 || bitmap.height > 4096 || bitmap.width * bitmap.height > 16777216) throw new Error('圖片尺寸不可超過 4096 × 4096');
    if (reference && (bitmap.width !== reference.width || bitmap.height !== reference.height)) throw new Error('遮罩或標記圖尺寸必須與參考圖一致');
    const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: transparent });
    if (!ctx) throw new Error('無法讀取圖片');
    ctx.drawImage(bitmap, 0, 0);
    if (transparent) {
      const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
      let found = false; for (let i = 3; i < data.length; i += 4) if (data[i] < 255) { found = true; break; }
      if (!found) throw new Error('遮罩或標記圖必須包含透明區域');
    }
    const src = canvas.toDataURL('image/png');
    if (src.length > 2 * 1024 * 1024 * 4 / 3 + 100) throw new Error('轉換為 PNG 後超過 2 MB，請縮小圖片');
    return { src, width: bitmap.width, height: bitmap.height };
  } finally { bitmap.close(); }
}
