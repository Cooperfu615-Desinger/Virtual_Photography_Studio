export function formatDllPicGenerationMessage(result) {
  const images = result.images || [];
  const nsfwCount = images.filter((image) => image.hasNsfw).length;

  if (result.errors?.length > 0) {
    return images.length ? `已生成 ${images.length} 張圖像；${result.errors[0]}` : result.errors[0];
  }
  if (nsfwCount > 0) {
    return `已生成 ${images.length} 張圖像，其中 ${nsfwCount} 張被 Magnific 標記為安全風險`;
  }

  let details = '';
  const meta = result.meta;
  if (meta?.provider === 'comfyCloud') {
    const hasDimensions = Number.isInteger(meta.width) && meta.width > 0 && Number.isInteger(meta.height) && meta.height > 0;
    const size = hasDimensions
      ? `${meta.width} × ${meta.height}`
      : [meta.resolution?.toUpperCase(), meta.aspectRatio].filter(Boolean).join(' / ');
    if (size) details += `｜${size}`;
    if (meta.seed !== null && meta.seed !== undefined) details += `｜Seed ${meta.seed}`;
  }
  return `已生成 ${images.length} 張圖像${details}`;
}

export function getComfyGenerationNote(model) {
  const start = '依序生成 1–2 張；';
  const end = '完成後請下載保存，圖像網址會到期。';
  if (model.comfyModel?.startsWith('krea2')) {
    return `${start}1K，依比例生成。合作夥伴節點另計耗額。${end}`;
  }
  if (model.partnerPricing) {
    const settings = model.comfyModel === 'ideogram45'
      ? 'Medium 品質，Magic Prompt 關閉。'
      : 'Thinking 關閉，4:5 採自訂尺寸。';
    return `${start}依模型支援尺寸生成。${settings}合作夥伴節點另計耗額。${end}`;
  }
  return `${start}1K / 2K 為約 1 / 4 百萬像素，依比例決定尺寸。無 LoRA、無 Prompt 重寫。${end}`;
}
