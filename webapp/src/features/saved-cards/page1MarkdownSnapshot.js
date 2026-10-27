// PAGE1 persistence metadata only; never regenerate or infer a public output.
import { createEmptyLocks, getLockControls, normalizeLocks } from '../../lib/engine.js';
import { CAPTURE_GROUPS } from '../../lib/observationCaptureMode.js';
import { normalizeSpecifiedActionSceneRestore } from '../../lib/engine/poseScenePolicy.js';
import { normalizeZImageDisplayLabel } from './promptLabels.js';

const MARKER = '<!-- VPStudio PAGE1 Snapshot:';
const LIMIT = 8 * 1024 * 1024;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = message => { throw new Error(`Invalid PAGE1 Markdown snapshot: ${message}`); };
const same = (a, b) => {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => Object.hasOwn(b, key) && same(a[key], b[key]));
};
const newline = text => text.replace(/\r\n/g, '\n');
const keys = (value, allowed, required = allowed) => {
  if (!record(value) || Object.keys(value).some(key => !allowed.includes(key))
    || required.some(key => !Object.hasOwn(value, key))) fail('fields');
};
function safeJson(text) {
  if (text.length > LIMIT) fail('size');
  const value = JSON.parse(text);
  // JSON.parse silently accepts repeated properties; a persisted snapshot must not.
  const tokens = text.match(/"(?:\\.|[^"\\])*"|[{}[\],:]|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g) || [];
  const stack = [];
  let previous;
  for (const token of tokens) {
    if (token === '{' || token === '[') {
      stack.push(token === '{' ? new Set() : null);
      if (stack.length > 64) fail('depth');
    } else if (token === '}' || token === ']') stack.pop();
    else if (stack.at(-1) && (previous === '{' || previous === ',') && token.startsWith('"')) {
      const key = JSON.parse(token);
      if (['__proto__', 'prototype', 'constructor'].includes(key) || stack.at(-1).has(key)) fail('duplicate or unsafe key');
      stack.at(-1).add(key);
    }
    previous = token;
  }
  return value;
}
function validateSelection(selection, controls) {
  const defaults = normalizeLocks(createEmptyLocks(), controls);
  keys(selection, Object.keys(defaults));
  for (const [key, value] of Object.entries(selection)) {
    const expected = defaults[key];
    if (['observationCapture', 'specifiedActionSceneRestore'].includes(key)) {
      if (value !== null && value !== '' && !record(value)) fail(key);
    } else if (Array.isArray(expected)) {
      if (!Array.isArray(value) || value.some(id => typeof id !== 'string') || new Set(value).size !== value.length) fail(key);
    } else if (typeof value !== typeof expected || typeof value === 'number' && !Number.isFinite(value)) fail(key);
    const options = controls.find(control => control.key === key)?.options || [];
    if (options.length) for (const id of Array.isArray(value) ? value : [value]) {
      if (id && !options.some(option => option.id === id || option.legacyIds?.includes(id))) fail(`unknown ID: ${key}`);
    }
  }
  if (record(selection.observationCapture)) {
    for (const group of CAPTURE_GROUPS) {
      const id = selection.observationCapture.selected?.[group.key];
      if (id && id !== 'random' && !group.options.some(option => option.id === id)) fail('unknown capture ID');
    }
  }
  if (record(selection.specifiedActionSceneRestore)) {
    if (!same(selection.specifiedActionSceneRestore, normalizeSpecifiedActionSceneRestore(selection.specifiedActionSceneRestore))) fail('invalid scene restore');
    for (const [key, value] of Object.entries(selection.specifiedActionSceneRestore)) {
      const options = controls.find(control => control.key === key)?.options || [];
      if (options.length && value && !options.some(option => option.id === value || option.legacyIds?.includes(value))) fail('unknown scene restore ID');
    }
  }
  const normalized = normalizeLocks(selection, controls);
  for (const key of ['observationCapture', 'specifiedActionSceneRestore']) {
    if (!same(selection[key], normalized[key])) fail(`invalid nested ${key}`);
  }
  // Hidden enums and numeric ranges also normalize; reject silent repair except
  // documented option-ID migrations, which remain owned by normalizeLocks.
  for (const [key, value] of Object.entries(selection)) {
    if (same(value, normalized[key])) continue;
    const options = controls.find(control => control.key === key)?.options || [];
    if (!options.length) fail(`invalid value: ${key}`);
  }
  return normalized;
}
function validatePayload(payload, controls) {
  keys(payload, ['version', 'source', 'selection', 'outputs', 'promptLabels']);
  if (payload.version !== 1 || payload.source !== 'page1') fail('version or source');
  const outputs = payload.outputs;
  keys(outputs, ['grokPrompt', 'midjourneyPrompt', 'zImagePrompt', 'nanoBananaPrompt', 'extraPrompts'],
    ['grokPrompt', 'midjourneyPrompt', 'zImagePrompt', 'extraPrompts']);
  for (const [key, value] of Object.entries(outputs)) if (key !== 'extraPrompts' && typeof value !== 'string') fail('output text');
  if (!Array.isArray(outputs.extraPrompts)) fail('extra outputs');
  const ids = new Set(['grok', 'midjourney', 'zImage', 'nano-banana-2.1']);
  for (const entry of outputs.extraPrompts) {
    keys(entry, ['id', 'label', 'text']);
    if (!entry.id || !entry.label || !entry.text || Object.values(entry).some(value => typeof value !== 'string')
      || /[\r\n]/.test(entry.label) || ids.has(entry.id)) fail('extra output identity');
    ids.add(entry.id);
  }
  if (payload.promptLabels !== null) {
    keys(payload.promptLabels, ['grok', 'midjourney', 'zImage'], []);
    if (Object.values(payload.promptLabels).some(label => typeof label !== 'string' || /[\r\n]/.test(label))) fail('labels');
  }
  return { ...payload, selection: validateSelection(payload.selection, controls) };
}
export function encodePage1MarkdownSnapshot(data) {
  if ((data.source || 'page1') !== 'page1' || !record(data.selection)) return '';
  const payload = {
    version: 1, source: 'page1', selection: normalizeLocks(data.selection),
    outputs: {
      grokPrompt: data.grokPrompt || '', midjourneyPrompt: data.midjourneyPrompt || '', zImagePrompt: data.zImagePrompt || '',
      ...(typeof data.nanoBananaPrompt === 'string' ? { nanoBananaPrompt: data.nanoBananaPrompt } : {}),
      extraPrompts: data.extraPrompts || [],
    },
    promptLabels: data.promptLabels || null,
  };
  const json = JSON.stringify(payload).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  validatePayload(safeJson(json), getLockControls());
  return `${MARKER} ${json} -->\n`;
}
export function decodePage1MarkdownSnapshot(markdown, controls = getLockControls()) {
  // A new marker, including a truncated one, must never fall through to guessing.
  const text = newline(String(markdown || ''));
  if (!text.includes(MARKER)) return null;
  if (!text.startsWith(MARKER)) fail('misplaced metadata');
  const end = text.indexOf(' -->\n');
  if (end < 0) fail('truncated metadata');
  const payload = validatePayload(safeJson(text.slice(MARKER.length, end).trim()), controls);
  const body = text.slice(end + 5);
  const { outputs, promptLabels: labels } = payload;
  const main = {
    grok: { label: labels?.grok || 'Gpt', text: outputs.grokPrompt },
    midjourney: { label: labels?.midjourney || 'AI Prompt', text: outputs.midjourneyPrompt },
    zImage: { label: normalizeZImageDisplayLabel(labels?.zImage, 'Z-Image'), text: outputs.zImagePrompt },
  };
  const block = order => [...order.map(key => main[key]),
    ...(outputs.nanoBananaPrompt?.trim() ? [{ label: 'Nano Banana 2.1', text: outputs.nanoBananaPrompt }] : []),
    ...outputs.extraPrompts].filter(entry => entry.text)
    .map(entry => `## ${entry.label}\n\`\`\`text\n${newline(entry.text)}\n\`\`\``).join('\n\n');
  const publicBlock = [block(['grok', 'midjourney', 'zImage']), block(['midjourney', 'grok', 'zImage'])]
    .find(expected => expected && body.includes(`\n\n${expected}\n`));
  if (!publicBlock) fail('public outputs differ from snapshot');
  const metadataBody = body.replace(publicBlock, '');
  if (metadataBody.includes(MARKER)) fail('duplicate metadata');
  for (const [name, check] of [
    ['Observation Capture', value => same(normalizeLocks(value, controls), payload.selection)],
    ['Optional Silence', value => record(value) && Object.entries(value).every(([key, v]) => payload.selection[key] === v)],
  ]) {
    const prefix = `<!-- VPStudio ${name}:`;
    const count = metadataBody.split(prefix).length - 1;
    if (!count) continue;
    const match = metadataBody.match(new RegExp(`<!-- VPStudio ${name}: (\\{[^\\n]*\\}) -->`));
    if (count !== 1 || !match || !check(safeJson(match[1]))) fail('conflicting legacy metadata');
  }
  return payload;
}
