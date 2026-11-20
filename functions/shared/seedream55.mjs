import sizes from './seedream55Sizes.json' with { type: 'json' };
export function seedream55Settings(input = {}) {
  const resolution = input.resolution || '2k';
  const aspectRatio = input.aspectRatio || '9:16';
  const dimensions = resolution === 'custom' ? [Number(input.customWidth), Number(input.customHeight)] : sizes[resolution]?.[aspectRatio];
  if (!dimensions) throw new Error('不支援的 Seedream 5.5 尺寸');
  const [width, height] = dimensions;
  if (![width, height].every(n => Number.isInteger(n) && n >= 240 && n <= 8594 && n % 2 === 0)
    || width * height < 921600 || width * height > 4624220 || width / height < 1 / 16 || width / height > 16) throw new Error('尺寸須為 240～8594 的偶數，總像素 0.92～4.62 MP，比例 1:16～16:1');
  const background = input.background ?? 'auto';
  if (!['auto', 'opaque', 'transparent'].includes(background)) throw new Error('不支援的背景設定');
  const watermark = input.watermark ?? false;
  if (typeof watermark !== 'boolean') throw new Error('浮水印設定不符');
  return { background, watermark, customWidth: width, customHeight: height };
}
export function seedream55Price(input, referenceCount = 0) {
  const { customWidth: w, customHeight: h } = seedream55Settings(input);
  if (!Number.isInteger(referenceCount) || referenceCount < 0 || referenceCount > 10) throw new Error('最多 10 張參考圖');
  return Number(((w * h <= 2601123 ? 0.0286 : 0.05005) + referenceCount * 0.01144).toFixed(5));
}
