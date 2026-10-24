import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';

export const OUTPUTS = ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt', 'nanoBananaPrompt', 'chest-up-portrait', 'full-body-character'];
// Only these two top-level generator values are volatile. Nested option IDs are protected.
export const VOLATILE_PATHS = ['prompt.id', 'prompt.date'];
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const jsonBytes = value => Buffer.from(JSON.stringify(value));
export const pack = value => gzipSync(jsonBytes(value), { level: 9 });
export function readJson(file) {
  const bytes = readFileSync(file);
  return JSON.parse((file.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString('utf8'));
}
export function stablePrompt(prompt) {
  const copy = structuredClone(prompt);
  delete copy.id;
  delete copy.date;
  return copy;
}
export function outputStates(prompt) {
  const extras = prompt.extraPrompts || [];
  if (new Set(extras.map(x => x.id)).size !== extras.length) throw new Error('duplicate extra output ID');
  return Object.fromEntries(OUTPUTS.map(key => {
    const text = key.includes('-') ? extras.find(x => x.id === key)?.text : prompt[key];
    return [key, { status: text ? 'effective' : 'not-applicable', text: text ?? '' }];
  }));
}
export function differences(before, after, path = '$', result = []) {
  if (Object.is(before, after)) return result;
  if (before === null || after === null || typeof before !== 'object' || typeof after !== 'object'
      || Array.isArray(before) !== Array.isArray(after)) {
    result.push({ path, before, after });
    return result;
  }
  const left = Object.keys(before), right = Object.keys(after);
  if (JSON.stringify(left) !== JSON.stringify(right)) result.push({ path: `${path}.[keys/order]`, before: left, after: right });
  for (const key of new Set([...left, ...right])) differences(before[key], after[key], `${path}.${key}`, result);
  return result;
}
export function validateCapture(capture) {
  if (capture?.format !== 'catalog-baseline-v1' || !Array.isArray(capture.cases) || !capture.cases.length) throw new Error('invalid/empty capture');
  const seen = new Set();
  for (const row of capture.cases) {
    if (!row?.id || seen.has(row.id)) throw new Error(`duplicate/missing case ID: ${row?.id}`);
    seen.add(row.id);
    if (row.status !== 'resolved' || !row.prompt || !row.prompt.selection || !row.prompt.structured
        || !row.prompt.summaryFields || !Number.isInteger(row.rngCalls) || row.rngCalls < 0) throw new Error(`unresolved/incomplete case: ${row.id}`);
    if (JSON.stringify(Object.keys(row.outputs || {})) !== JSON.stringify(OUTPUTS)) throw new Error(`missing/extra output: ${row.id}`);
    if (differences(outputStates(row.prompt), row.outputs).length) throw new Error(`invalid output state: ${row.id}`);
    for (const key of OUTPUTS.slice(0, 4)) if (typeof row.prompt[key] !== 'string') throw new Error(`missing main output: ${row.id}.${key}`);
  }
  return capture;
}
export function compareCaptures(before, after) {
  validateCapture(before); validateCapture(after);
  const clean = capture => ({ ...capture, cases: capture.cases.map(row => ({ ...row, prompt: stablePrompt(row.prompt) })) });
  return differences(clean(before), clean(after)).map(diff => {
    const index = diff.path.match(/^\$\.cases\.(\d+)/)?.[1];
    return index === undefined ? diff : { caseId: before.cases[index]?.id || after.cases[index]?.id, ...diff };
  });
}

function uniqueSet(object, key, value) {
  if (Object.hasOwn(object, key)) throw new Error(`duplicate snapshot key: ${key}`);
  object[key] = value;
}
export function createCatalogSnapshots(compiled, controls) {
  const controlSnapshot = {}, catalog = {}, meta = {};
  const identity = item => ({ id: item.id, legacyIds: item.legacyIds || [] });
  for (const control of controls) {
    uniqueSet(controlSnapshot, control.key, control.options.map(identity));
    for (const item of control.options) uniqueSet(meta, `${control.key}::${item.id}`, item.meta || {});
  }
  for (const [group, categories] of Object.entries(compiled.catalog)) {
    catalog[group] = {};
    for (const [category, entries] of Object.entries(categories)) {
      catalog[group][category] = entries.map(identity);
      for (const item of entries) uniqueSet(meta, `${group}::${category}::${item.id}`, item.meta || {});
    }
  }
  return { controls: controlSnapshot, catalog, meta };
}

// Preserve ordered ownership AND actual normalizeLocks behavior for every control ID/alias.
// Ambiguous aliases intentionally retain the existing first-match outcome.
export function captureIdResolution(engine) {
  const controls = engine.getLockControls();
  return controls.map(control => ({ key: control.key, options: control.options.map(option => ({
    id: option.id,
    tokens: [option.id, ...(option.legacyIds || [])].map(token => {
      const raw = control.multi ? [token] : token;
      const normalized = engine.normalizeLocks({ [control.key]: raw }, controls);
      return { token, owners: control.options.filter(o => o.id === token || o.legacyIds?.includes(token)).map(o => o.id), resolved: normalized[control.key] };
    }),
  })) }));
}
