// Shared bounded MP4 inspection: trust container metadata, never caller-supplied duration.
export const REFERENCE_MAX_BYTES = 20 * 1024 * 1024;
export const supportsVideoReference = key => ['seedance25', 'minimaxH3'].includes(key);
export function validateVideoReference(meta, modelKey) {
  if (!meta || !Number.isFinite(meta.duration) || meta.duration < 2 || meta.duration > 15)
    throw new Error('參考影片需為 2～15 秒');
  if (!Number.isInteger(meta.width) || !Number.isInteger(meta.height) || meta.width < 256 || meta.height < 256
    || meta.width > 4096 || meta.height > 4096 || meta.width / meta.height < 0.4 || meta.width / meta.height > 2.5)
    throw new Error('參考影片需為 256～4096 像素，比例介於 2:5 與 5:2');
  if (modelKey === 'seedance25' && meta.width * meta.height < 409600) throw new Error('Seedance 參考影片需至少 409,600 像素（例如 640×640）');
  return meta;
}
export function inspectReferenceMp4(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length > REFERENCE_MAX_BYTES || bytes.length < 32)
    throw new Error('參考影片需為 20 MB 以內的 MP4');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (p, n) => String.fromCharCode(...bytes.subarray(p, p + n));
  const boxes = (start, end) => {
    const out = [];
    for (let p = start; p < end;) {
      if (p + 8 > end || out.length > 10000) throw new Error('MP4 結構不完整');
      let size = view.getUint32(p); let header = 8;
      if (size === 1) { if (p + 16 > end) throw new Error('MP4 結構不完整'); size = Number(view.getBigUint64(p + 8)); header = 16; }
      if (size === 0) size = end - p;
      if (!Number.isSafeInteger(size) || size < header || p + size > end) throw new Error('MP4 結構不完整');
      out.push({ type: text(p + 4, 4), start: p + header, end: p + size }); p += size;
    }
    return out;
  };
  const child = (box, type) => box && boxes(box.start, box.end).find(b => b.type === type);
  const durationOf = box => {
    if (!box) throw new Error('MP4 缺少影片長度');
    const v = bytes[box.start]; const scaleAt = box.start + (v === 1 ? 20 : 12);
    if (![0, 1].includes(v) || scaleAt + (v === 1 ? 12 : 8) > box.end) throw new Error('MP4 長度格式不符');
    const ticks = v === 1 ? Number(view.getBigUint64(scaleAt + 4)) : view.getUint32(scaleAt + 4);
    return ticks / view.getUint32(scaleAt);
  };
  const roots = boxes(0, bytes.length); const moov = roots.find(b => b.type === 'moov');
  if (!roots.some(b => b.type === 'ftyp') || !roots.some(b => b.type === 'mdat') || roots.some(b => b.type === 'moof') || !moov)
    throw new Error('請使用一般 MP4（H.264）影片，不支援分段串流');
  const tracks = boxes(moov.start, moov.end).filter(b => b.type === 'trak').filter(t => {
    const handler = child(child(t, 'mdia'), 'hdlr');
    return handler && handler.start + 12 <= handler.end && text(handler.start + 8, 4) === 'vide';
  });
  if (tracks.length !== 1) throw new Error('MP4 需包含一條影像軌');
  const track = tracks[0]; const tkhd = child(track, 'tkhd'); const mdia = child(track, 'mdia');
  const stsd = child(child(child(mdia, 'minf'), 'stbl'), 'stsd');
  if (!tkhd || tkhd.end - tkhd.start < 84 || !stsd || stsd.start + 8 > stsd.end
    || !boxes(stsd.start + 8, stsd.end).some(b => ['avc1', 'avc3'].includes(b.type)))
    throw new Error('請使用 H.264 編碼的 MP4 參考影片');
  return validateVideoReference({ width: view.getUint32(tkhd.end - 8) / 65536, height: view.getUint32(tkhd.end - 4) / 65536,
    duration: Math.max(durationOf(child(moov, 'mvhd')), durationOf(child(mdia, 'mdhd'))), size: bytes.length });
}
