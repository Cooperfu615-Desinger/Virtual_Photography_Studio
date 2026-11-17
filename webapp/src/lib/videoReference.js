import { inspectReferenceMp4, validateVideoReference, REFERENCE_MAX_BYTES } from '../../../functions/shared/videoReference.mjs';
export { supportsVideoReference } from '../../../functions/shared/videoReference.mjs';
export async function prepareReferenceFile(file, modelKey) {
  if (!file || file.size > REFERENCE_MAX_BYTES || !/\.mp4$/i.test(file.name)) throw new Error('請選擇 20 MB 以內的 MP4 參考影片');
  const metadata = validateVideoReference(inspectReferenceMp4(new Uint8Array(await file.arrayBuffer())), modelKey);
  return { blob: file, name: file.name, ...metadata };
}
export function referenceBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.slice(reader.result.indexOf(',') + 1));
    reader.onerror = () => reject(new Error('參考影片無法讀取，請重新上傳'));
    reader.readAsDataURL(blob);
  });
}
