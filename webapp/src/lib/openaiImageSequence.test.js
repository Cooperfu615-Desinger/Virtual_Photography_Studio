import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOpenAISequence } from './openaiImageSequence.js';

const task = { id: 'request', snapshot: { count: 2, prompt: 'portrait', resolution: '1k', aspectRatio: '9:16', quality: 'high' } };
test('two images submit sequentially only after the first has been saved', async () => {
  const events = [];
  const result = await generateOpenAISequence(task, {
    onProgress: async () => {},
    submit: async p => { events.push(`submit:${p.requestId}`); return { images: [{ src: p.requestId }] }; },
    onImages: async images => { events.push(`save:${images.length}`); },
  });
  assert.deepEqual(events, ['submit:request_1', 'save:1', 'submit:request_2', 'save:2']);
  assert.equal(result.images.length, 2);
});
test('an uncertain second request retains the first and does not retry', async () => {
  let calls = 0;
  await assert.rejects(generateOpenAISequence(task, { onProgress: async () => {}, onImages: async () => {}, submit: async () => {
    calls += 1; if (calls === 2) throw new Error('network'); return { images: [{ src: 'first' }] };
  } }), error => { assert.equal(error.images[0].src, 'first'); assert.equal(error.terminal, undefined); return true; });
  assert.equal(calls, 2);
});
test('a failed first save never submits the second', async () => {
  let calls = 0;
  await assert.rejects(generateOpenAISequence(task, { onProgress: async () => {}, onImages: async () => { throw new Error('storage'); }, submit: async () => { calls += 1; return { images: [{ src: 'first' }] }; } }));
  assert.equal(calls, 1);
});

test('OpenAI task snapshots retain quality and reject unsupported values', async () => {
  const { generationSnapshot } = await import('./dllWorkspaceController.js');
  const input = { modelKey: 'openaiImage2', prompt: 'portrait', quality: 'high' };
  assert.equal(generationSnapshot(input).quality, 'high');
  assert.equal(generationSnapshot({ ...input, quality: undefined }).quality, 'medium');
  assert.throws(() => generationSnapshot({ ...input, quality: 'max' }), /畫質/);
  assert.ok(!Object.hasOwn(generationSnapshot({ ...input, modelKey: 'comfyZImageTurbo' }), 'quality'));
});
