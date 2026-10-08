import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDllPicGenerationMessage, getComfyGenerationNote } from './dllPicGenerationPresentation.js';

test('partial success reports the preserved image count and the failed second image', () => {
  assert.equal(formatDllPicGenerationMessage({ images: [{ src: 'first.png' }], errors: ['第 2 張生成失敗：quota exceeded'] }),
    '已生成 1 張圖像；第 2 張生成失敗：quota exceeded');
});

test('Krea unknown pixel dimensions show the documented resolution and ratio', () => {
  const message = formatDllPicGenerationMessage({
    images: [{ src: 'first.png' }], errors: [],
    meta: { provider: 'comfyCloud', width: null, height: null, resolution: '1k', aspectRatio: '4:5', seed: null },
  });
  assert.equal(message, '已生成 1 張圖像｜1K / 4:5');
  assert.doesNotMatch(message, /null|undefined/);
});

test('existing Comfy dimensions and seed remain visible after generation', () => {
  assert.equal(formatDllPicGenerationMessage({
    images: [{ src: 'first.png' }], errors: [],
    meta: { provider: 'comfyCloud', width: 1024, height: 1024, seed: 123 },
  }), '已生成 1 張圖像｜1024 × 1024｜Seed 123');
});

test('Krea variants share sequential one-or-two image copy without other partner settings', () => {
  for (const comfyModel of ['krea2Medium', 'krea2MediumTurbo', 'krea2Large']) {
    const note = getComfyGenerationNote({ comfyModel, partnerPricing: true });
    assert.match(note, /依序生成 1–2 張；1K/);
    assert.match(note, /合作夥伴節點另計耗額/);
    assert.doesNotMatch(note, /Thinking|Magic Prompt|2K|4:5 採自訂尺寸/);
  }
});

test('existing Comfy models preserve their provider settings in the sequential copy', () => {
  assert.match(getComfyGenerationNote({ comfyModel: 'ideogram45', partnerPricing: true }), /Medium 品質，Magic Prompt 關閉/);
  assert.match(getComfyGenerationNote({ comfyModel: 'seedream5Pro', partnerPricing: true }), /Thinking 關閉，4:5 採自訂尺寸/);
  assert.match(getComfyGenerationNote({ comfyModel: 'zImageTurbo', partnerPricing: false }), /無 LoRA、無 Prompt 重寫/);
});
