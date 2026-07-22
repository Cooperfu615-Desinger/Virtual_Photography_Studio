import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createEmptyLocks, createSeededRandom, generatePrompts } from '../webapp/src/lib/engine.js';
import {
  PROMPT_OUTPUT_CONTRACTS,
  validatePromptOutputContract,
} from '../webapp/src/lib/engine/promptOutputContracts.js';

export const MAIN_OUTPUTS = Object.freeze([
  Object.freeze({ key: 'gpt', label: 'Gpt', field: 'grokPrompt' }),
  Object.freeze({ key: 'grokZImage', label: 'Grok/Z-Image', field: 'zImagePrompt' }),
  Object.freeze({ key: 'ai', label: 'AI', field: 'midjourneyPrompt' }),
]);

const CONTROL_LANGUAGE_RULES = Object.freeze([
  Object.freeze({
    code: 'fixed-set-integrity-label',
    label: 'Fixed Set Integrity label',
    pattern: /\bFixed Set Integrity\b/gi,
  }),
  Object.freeze({
    code: 'composition-priority-label',
    label: 'Composition Priority label',
    pattern: /\bComposition Priority\b/gi,
  }),
  Object.freeze({
    code: 'scene-priority-label',
    label: 'Scene Priority label',
    pattern: /\bScene Priority\b/gi,
  }),
  Object.freeze({
    code: 'wardrobe-integrity-label',
    label: 'Wardrobe Integrity label',
    pattern: /\bWardrobe Integrity\b/gi,
  }),
  Object.freeze({
    code: 'selection-control-language',
    label: 'selection-driven control language',
    pattern: /\b(?:controlled|determined) by (?:the )?(?:outfit|dress|uniform|fabric|garment|body|contrast|color|palette|styling|pattern|accessory|wardrobe)(?: [a-z-]+){0,3} selection\b/gi,
  }),
  Object.freeze({
    code: 'model-decided-language',
    label: 'model-decided control language',
    pattern: /\bmodel-decided\b/gi,
  }),
  Object.freeze({
    code: 'optional-scheme-language',
    label: 'optional scheme control language',
    pattern: /\boptional (?:classic|fixed)[^.\n]{0,100}\b(?:scheme|colors?) can retain\b/gi,
  }),
]);

const CONTRADICTION_RULES = Object.freeze([
  Object.freeze({
    code: 'full-body-vs-tight-crop',
    label: 'full-body and tight-crop constraints coexist',
    first: /\b(?:full[- ]body (?:portrait|view|shot|composition|framing|reference)|full figure visible from head to toe|complete figure visible from head to toe)\b/i,
    second: /\b(?:head-and-shoulders|chest-up|waist-up|face-only|tight close-up|close-up portrait)\b/i,
  }),
  Object.freeze({
    code: 'no-crop-vs-tight-crop',
    label: 'no-crop and tight-crop constraints coexist',
    first: /\bno crop\b/i,
    second: /\b(?:head-and-shoulders|chest-up|waist-up|face-only|tight close-up|close-up portrait)\b/i,
  }),
  Object.freeze({
    code: 'front-vs-rear-view',
    label: 'front-view and rear-view constraints coexist',
    first: /\bfront view\b/i,
    second: /\b(?:back view|rear(?:-[a-z]+)?(?: three-quarter)? view)\b/i,
    singleSubjectOnly: true,
  }),
  Object.freeze({
    code: 'left-vs-right-profile',
    label: 'left-profile and right-profile constraints coexist',
    first: /\bleft profile view\b/i,
    second: /\bright profile view\b/i,
    singleSubjectOnly: true,
  }),
  Object.freeze({
    code: 'closed-eyes-vs-direct-eye-contact',
    label: 'closed-eyes and direct-eye-contact constraints coexist',
    first: /\b(?:eyes (?:gently )?closed|closed eyes)\b/i,
    second: /\b(?:direct eye contact|looking directly at the camera|looks directly at the camera)\b/i,
    singleSubjectOnly: true,
  }),
  Object.freeze({
    code: 'shallow-vs-deep-focus',
    label: 'shallow-focus and deep-focus constraints coexist',
    first: /\b(?:shallow depth of field|shallow focus|razor-thin focus plane)\b/i,
    second: /\b(?:deep depth of field|deep focus|everything in sharp focus)\b/i,
  }),
]);

function hasText(items, matcher) {
  return items.some((item) => matcher(`${item?.zh || ''} ${item?.en || ''}`.toLowerCase()));
}

function normalizeForComparison(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{L}\p{N}'-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shorten(value, maxLength = 140) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1)}…`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasSection(text, label) {
  return new RegExp(`^${escapeRegExp(label)}:\\s*`, 'm').test(String(text || ''));
}

function nonEmptyBlocks(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function percentile(sortedValues, fraction) {
  if (sortedValues.length === 0) return 0;
  const index = Math.max(0, Math.ceil(sortedValues.length * fraction) - 1);
  return sortedValues[index];
}

export function countWords(text) {
  return String(text || '').match(/[\p{L}\p{N}]+(?:['\u2019:-][\p{L}\p{N}]+)*/gu)?.length || 0;
}

export function summarizeNumbers(values) {
  const sorted = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (sorted.length === 0) {
    return { samples: 0, min: 0, max: 0, average: 0, median: 0, p95: 0 };
  }
  const total = sorted.reduce((sum, value) => sum + value, 0);
  const midpoint = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
    : sorted[midpoint];
  return {
    samples: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    average: total / sorted.length,
    median,
    p95: percentile(sorted, 0.95),
  };
}

export function getPromptOutputs(prompt, { includeMissingMain = true } = {}) {
  const main = MAIN_OUTPUTS
    .map((descriptor) => ({
      ...descriptor,
      text: typeof prompt?.[descriptor.field] === 'string' ? prompt[descriptor.field] : '',
    }))
    .filter((output) => includeMissingMain || output.text.trim());
  const extras = Array.isArray(prompt?.extraPrompts)
    ? prompt.extraPrompts.map((extra, index) => ({
        key: extra?.id || `extra-${index + 1}`,
        label: extra?.label || `Extra ${index + 1}`,
        field: `extraPrompts[${index}]`,
        text: typeof extra?.text === 'string' ? extra.text : '',
        extra: true,
      }))
    : [];
  return [...main, ...extras];
}

export function summarizeOutputWordLengths(prompts) {
  const buckets = new Map(MAIN_OUTPUTS.map(({ key, label }) => [key, {
    key,
    label,
    expected: prompts.length,
    missing: 0,
    values: [],
  }]));

  for (const prompt of prompts) {
    for (const descriptor of MAIN_OUTPUTS) {
      const text = typeof prompt?.[descriptor.field] === 'string' ? prompt[descriptor.field].trim() : '';
      const bucket = buckets.get(descriptor.key);
      if (!text) bucket.missing += 1;
      else bucket.values.push(countWords(text));
    }

    for (const output of getPromptOutputs(prompt, { includeMissingMain: false }).filter((item) => item.extra)) {
      const bucketKey = `extra:${output.key}`;
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, {
          key: bucketKey,
          label: output.label,
          expected: prompts.length,
          missing: 0,
          values: [],
        });
      }
      if (output.text.trim()) buckets.get(bucketKey).values.push(countWords(output.text));
    }
  }

  return [...buckets.values()].map(({ values, ...bucket }) => ({
    ...bucket,
    missing: bucket.key.startsWith('extra:') ? bucket.expected - values.length : bucket.missing,
    ...summarizeNumbers(values),
  }));
}

export function extractComparableSegments(text, { minimumWords = 4 } = {}) {
  const rawSegments = String(text || '')
    .replace(/^\s*[A-Za-z][A-Za-z &/-]{1,40}:\s*/gm, '')
    .split(/(?:\n+|[.!?;]+|,\s+(?=(?:and\s+)?[a-z0-9]))/i)
    .map((segment) => segment.trim().replace(/^[,:\-\s]+|[,:\-\s]+$/g, ''))
    .filter(Boolean);

  return rawSegments
    .map((textValue, index) => ({
      index,
      text: textValue,
      normalized: normalizeForComparison(textValue),
      tokens: normalizeForComparison(textValue).split(' ').filter(Boolean),
    }))
    .filter((segment) => segment.tokens.length >= minimumWords);
}

function tokenDiceSimilarity(firstTokens, secondTokens) {
  const remaining = new Map();
  for (const token of firstTokens) remaining.set(token, (remaining.get(token) || 0) + 1);
  let intersection = 0;
  for (const token of secondTokens) {
    const count = remaining.get(token) || 0;
    if (count > 0) {
      intersection += 1;
      remaining.set(token, count - 1);
    }
  }
  return (2 * intersection) / (firstTokens.length + secondTokens.length);
}

export function findDuplicateSegments(text, {
  minimumWords = 4,
  nearMinimumWords = 6,
  nearThreshold = 0.84,
  maxSignals = 20,
} = {}) {
  const segments = extractComparableSegments(text, { minimumWords });
  const signals = [];

  for (let firstIndex = 0; firstIndex < segments.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < segments.length; secondIndex += 1) {
      const first = segments[firstIndex];
      const second = segments[secondIndex];
      if (first.normalized === second.normalized) {
        signals.push({
          type: 'exact',
          score: 1,
          first: first.text,
          second: second.text,
        });
      } else if (first.tokens.length >= nearMinimumWords && second.tokens.length >= nearMinimumWords) {
        const lengthRatio = Math.min(first.tokens.length, second.tokens.length) / Math.max(first.tokens.length, second.tokens.length);
        const score = lengthRatio >= 0.7 ? tokenDiceSimilarity(first.tokens, second.tokens) : 0;
        if (score >= nearThreshold) {
          signals.push({
            type: 'near',
            score,
            first: first.text,
            second: second.text,
          });
        }
      }
      if (signals.length >= maxSignals) return signals;
    }
  }
  return signals;
}

export function detectControlLanguage(text) {
  const signals = [];
  for (const rule of CONTROL_LANGUAGE_RULES) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags.includes('g') ? rule.pattern.flags : `${rule.pattern.flags}g`);
    for (const match of String(text || '').matchAll(pattern)) {
      signals.push({
        code: rule.code,
        label: rule.label,
        match: match[0],
        index: match.index,
      });
    }
  }
  return signals;
}

export function detectContradictions(text, { subjectCount = '' } = {}) {
  const value = String(text || '');
  const signals = [];
  for (const rule of CONTRADICTION_RULES) {
    if (rule.singleSubjectOnly && String(subjectCount) === '2') continue;
    const first = value.match(rule.first);
    const second = value.match(rule.second);
    if (first && second) {
      signals.push({
        code: rule.code,
        label: rule.label,
        first: first[0],
        second: second[0],
      });
    }
  }

  if (String(subjectCount) === '1' && /\bWoman 1\s*:/i.test(value) && /\bWoman 2\s*:/i.test(value)) {
    signals.push({
      code: 'single-vs-duo-role-labels',
      label: 'single-subject selection contains two role labels',
      first: 'subjectCount=1',
      second: 'Woman 1 + Woman 2',
    });
  }
  if (String(subjectCount) === '2' && /\bThe subject is one\b/i.test(value)) {
    signals.push({
      code: 'duo-vs-single-subject',
      label: 'duo selection contains a single-subject instruction',
      first: 'subjectCount=2',
      second: 'The subject is one',
    });
  }
  return signals;
}

function extractImageTypeInstruction(text) {
  return String(text || '').match(/\bCreate an? [^.\n]+[.]/i)?.[0] || '';
}

function extractCompositionInstruction(text) {
  const blocks = nonEmptyBlocks(text);
  const imageTypeIndex = blocks.findIndex((block) => /\bCreate an? [^.\n]+[.]/i.test(block));
  if (imageTypeIndex < 0) return '';
  return blocks[imageTypeIndex + 1] || '';
}

function addContractIssue(issues, output, code, message) {
  issues.push({ output, code, message });
}

export function validateOutputContracts(prompt) {
  const issues = [];
  const outputs = Object.fromEntries(MAIN_OUTPUTS.map((descriptor) => [descriptor.key, {
    ...descriptor,
    text: typeof prompt?.[descriptor.field] === 'string' ? prompt[descriptor.field].trim() : '',
  }]));
  const subjectCount = String(prompt?.selection?.subjectCount || '');
  const mode = subjectCount === '2' ? 'duo' : 'single';

  for (const output of Object.values(outputs)) {
    for (const contractIssue of validatePromptOutputContract(output.field, output.text, { mode })) {
      issues.push({
        output: output.label,
        ...contractIssue,
        category: contractIssue.code === 'control-leakage' ? 'control-leakage' : 'contract',
      });
    }
    if (!output.text) continue;
    if (/\b(?:undefined|null|\[object Object\])\b/.test(output.text)) {
      addContractIssue(issues, output.label, 'serialized-placeholder', `${output.label} contains a serialized placeholder value`);
    }
  }

  const availableMainOutputs = Object.values(outputs).filter((output) => output.text);
  const imageTypeInstructions = availableMainOutputs.map((output) => ({
    output: output.label,
    value: extractImageTypeInstruction(output.text),
  }));
  for (const instruction of imageTypeInstructions) {
    if (!instruction.value) {
      addContractIssue(issues, instruction.output, 'missing-image-type-instruction', `${instruction.output} has no Create an image-type instruction`);
    }
  }
  const resolvedImageTypes = new Set(imageTypeInstructions.map((item) => normalizeForComparison(item.value)).filter(Boolean));
  if (resolvedImageTypes.size > 1) {
    addContractIssue(issues, 'Cross-output', 'image-type-drift', 'Gpt, Grok/Z-Image, and AI do not share the same resolved image-type instruction');
  }

  const compositions = availableMainOutputs.map((output) => ({
    output: output.label,
    value: extractCompositionInstruction(output.text),
  }));
  if (compositions.every((item) => item.value)) {
    const resolvedCompositions = new Set(compositions.map((item) => normalizeForComparison(item.value)));
    if (resolvedCompositions.size > 1) {
      addContractIssue(issues, 'Cross-output', 'composition-drift', 'Gpt, Grok/Z-Image, and AI do not share the same resolved composition instruction');
    }
  }

  const extraPromptEntries = Array.isArray(prompt?.extraPrompts) ? prompt.extraPrompts : [];
  for (const field of [
    'facialCloseupPortraitPrompt',
    'chestUpPortraitPrompt',
    'fullBodyCharacterPrompt',
  ]) {
    const contract = PROMPT_OUTPUT_CONTRACTS[field];
    const matchingEntries = extraPromptEntries.filter((entry) => entry?.id === contract.source.id);
    const text = typeof matchingEntries[0]?.text === 'string' ? matchingEntries[0].text.trim() : '';
    for (const contractIssue of validatePromptOutputContract(field, text, { mode })) {
      issues.push({
        output: contract.uiLabel,
        ...contractIssue,
        category: contractIssue.code === 'control-leakage' ? 'control-leakage' : 'contract',
      });
    }
    const expectedCount = mode === 'single' ? 1 : 0;
    if (matchingEntries.length !== expectedCount) {
      addContractIssue(
        issues,
        contract.uiLabel,
        'invalid-extra-output-count',
        `${contract.uiLabel} must contain ${expectedCount} entries in ${mode} mode (found ${matchingEntries.length})`,
      );
    }
  }

  const fullBodyEntries = extraPromptEntries
    .filter((entry) => entry?.id === 'full-body-character' || entry?.label === '全身角色照');
  const fullBodyText = typeof fullBodyEntries[0]?.text === 'string' ? fullBodyEntries[0].text.trim() : '';
  if (subjectCount === '1' && fullBodyEntries.length > 1) {
    addContractIssue(issues, '全身角色照', 'invalid-full-body-output-count', `single-subject output must contain exactly one 全身角色照 entry (found ${fullBodyEntries.length})`);
  }
  if (subjectCount === '2' && fullBodyEntries.length > 0) {
    addContractIssue(issues, '全身角色照', 'unexpected-full-body-output', 'duo output must not contain the single-subject 全身角色照 entry');
  }

  for (const entry of fullBodyEntries) {
    const text = typeof entry?.text === 'string' ? entry.text.trim() : '';
    if (!text) {
      addContractIssue(issues, '全身角色照', 'missing-full-body-text', '全身角色照 text is missing or empty');
      continue;
    }
    const requirements = [
      ['full-body-9-16', /\b9:16 vertical image\b/i, 'must explicitly require a 9:16 vertical image'],
      ['full-body-framing', /\bfull[- ]body\b/i, 'must explicitly require full-body framing'],
      ['full-body-head-to-toe', /\bhead to toe\b/i, 'must keep the complete figure visible from head to toe'],
      ['full-body-hands-feet', /\bboth hands and both feet\b/i, 'must keep both hands and both feet visible'],
      ['full-body-no-crop', /\bno crop\b/i, 'must explicitly prohibit cropping'],
    ];
    for (const [code, pattern, message] of requirements) {
      if (!pattern.test(text)) addContractIssue(issues, '全身角色照', code, `全身角色照 ${message}`);
    }
    for (const section of ['Image Type', 'Subject', 'Lighting', 'Camera Look']) {
      if (!hasSection(text, section)) {
        addContractIssue(issues, '全身角色照', 'missing-full-body-section', `全身角色照 is missing the ${section} section`);
      }
    }
  }

  return issues;
}

// These compatibility heuristics intentionally preserve the original audit rules.
// They remain diagnostics rather than generation blockers in the default CLI mode.
export function validatePromptLogic(prompt) {
  const issues = [];
  const wardrobe = prompt?.structured?.Wardrobe || [];
  const location = prompt?.summaryFields?.location || '';
  const lighting = prompt?.summaryFields?.lighting || '';
  const style = prompt?.summaryFields?.style || '';

  const hasPants = hasText(wardrobe, (text) => text.includes('褲') || text.includes('pants') || text.includes('jeans') || text.includes('trousers') || text.includes('shorts'));
  const hasSkirt = hasText(wardrobe, (text) => text.includes('裙') || text.includes('skirt'));
  const hasLegwear = hasText(wardrobe, (text) => text.includes('絲襪') || text.includes('襪') || text.includes('stockings') || text.includes('pantyhose'));
  const bareLegs = hasText(wardrobe, (text) => text.includes('bare legs') || text.includes('全無'));
  const swimwear = hasText(wardrobe, (text) => text.includes('swimwear') || text.includes('泳裝'));
  const lolita = hasText(wardrobe, (text) => text.includes('lolita') || text.includes('蘿莉塔'));
  const schoolgirl = hasText(wardrobe, (text) => text.includes('schoolgirl') || text.includes('女高中生') || text.includes('jk'));
  const heritage = hasText(wardrobe, (text) => text.includes('victorian') || text.includes('baroque') || text.includes('維多利亞') || text.includes('巴洛克'));

  const outdoor = /(海|湖|花田|草地|森林|木棧道|岩岸|巷|街|夜市|街頭|海灘|outdoors|street|beach|forest|park)/i.test(location);
  const studio = /(攝影棚|背景|黑幕|白幕|清水模|鏡面地板|沙發場景|灰背景|studio|set)/i.test(location);
  const ruin = /(廢棄|地下|骨架|ruin|abandoned)/i.test(location);
  const nightUrban = /(夜|霓虹|九龍|新宿|弘大|soho|night)/i.test(location);

  const studioLight = /(高 key|high key|商業平光)/i.test(lighting);
  const lowKey = /(low key|暗調戲劇光)/i.test(lighting);
  const windowLight = /(window|百葉窗|窗縫)/i.test(lighting);
  const hardSun = /(烈日|harsh sunlight|藍天白雲|夕陽暖光|陰天漫射柔光)/i.test(lighting);

  if (hasPants && hasSkirt) issues.push('同時出現褲裝與裙裝');
  if (hasPants && hasLegwear && !bareLegs) issues.push('褲裝又搭明顯襪類');
  if (swimwear && !outdoor) issues.push('泳裝出現在非戶外/度假場景');
  if (swimwear && hasPants) issues.push('泳裝仍抽到褲裝');
  if (lolita && hasPants) issues.push('Lolita 仍抽到褲裝');
  if (schoolgirl && hasPants) issues.push('JK 仍抽到褲裝');
  if ((studioLight || lowKey) && ruin && studioLight) issues.push('廢墟場景抽到棚燈');
  if (windowLight && outdoor) issues.push('戶外場景抽到窗縫/百葉窗光');
  if (studio && /霓虹電影感|高反差黑白街頭感/.test(style) && !nightUrban) issues.push('棚景搭街頭/夜景型攝影風格');
  if (/清透寫真感|日常微光詩意感/.test(style) && ruin) issues.push('清透/日常風格搭廢墟場景');
  if (/極簡雕塑棚拍感|精緻棚拍感|純背景凝視肖像感/.test(style) && !studio) issues.push('棚拍型風格沒有落在棚景');
  if (heritage && /街頭|夜市|街景|街角/.test(location)) issues.push('古典服裝落在強都市街頭場景');
  if (hardSun && /地下|廢棄醫院|排洪道|商場中庭/.test(location)) issues.push('地下/廢墟場景抽到戶外日光');

  return issues;
}

export function auditPrompt(prompt, index = 0) {
  const duplicateSignals = [];
  const leakageSignals = [];
  const contradictionSignals = [];
  const subjectCount = String(prompt?.selection?.subjectCount || '');
  const allContractIssues = validateOutputContracts(prompt);

  for (const contractIssue of allContractIssues.filter((issue) => issue.category === 'control-leakage')) {
    leakageSignals.push({
      output: contractIssue.output,
      code: `contract-${contractIssue.code}`,
      label: 'public output-contract control leakage',
      match: contractIssue.value || contractIssue.message,
      index: -1,
    });
  }

  for (const output of getPromptOutputs(prompt, { includeMissingMain: false })) {
    for (const signal of findDuplicateSegments(output.text)) {
      duplicateSignals.push({ output: output.label, ...signal });
    }
    if (output.field === 'zImagePrompt' || output.field === 'midjourneyPrompt') {
      for (const signal of detectControlLanguage(output.text)) {
        leakageSignals.push({ output: output.label, ...signal });
      }
    }
    for (const signal of detectContradictions(output.text, { subjectCount })) {
      contradictionSignals.push({ output: output.label, ...signal });
    }
  }

  const deduplicatedLeakageSignals = [...new Map(leakageSignals.map((signal) => {
    const normalizedMatch = normalizeForComparison(signal.match);
    return [`${signal.output}|${normalizedMatch}`, signal];
  })).values()];

  return {
    index,
    promptId: prompt?.id || '',
    style: prompt?.summaryFields?.style || '',
    wardrobe: (prompt?.structured?.Wardrobe || []).map((item) => item?.zh || item?.en || '').filter(Boolean).join(' | '),
    location: prompt?.summaryFields?.location || '',
    lighting: prompt?.summaryFields?.lighting || '',
    logicIssues: validatePromptLogic(prompt),
    contractIssues: allContractIssues.filter((issue) => issue.category !== 'control-leakage'),
    duplicateSignals,
    leakageSignals: deduplicatedLeakageSignals,
    contradictionSignals,
  };
}

function categoryCount(findings, key) {
  return findings.reduce((sum, finding) => sum + finding[key].length, 0);
}

function promptsWithCategory(findings, key) {
  return findings.filter((finding) => finding[key].length > 0).length;
}

export function auditPrompts(prompts, { seed = '' } = {}) {
  const findings = prompts.map((prompt, index) => auditPrompt(prompt, index));
  const summary = {
    prompts: prompts.length,
    promptsWithFindings: findings.filter((finding) => (
      finding.logicIssues.length
      || finding.contractIssues.length
      || finding.duplicateSignals.length
      || finding.leakageSignals.length
      || finding.contradictionSignals.length
    )).length,
    logicIssues: categoryCount(findings, 'logicIssues'),
    contractIssues: categoryCount(findings, 'contractIssues'),
    exactDuplicateSignals: findings.reduce((sum, finding) => sum + finding.duplicateSignals.filter((signal) => signal.type === 'exact').length, 0),
    nearDuplicateSignals: findings.reduce((sum, finding) => sum + finding.duplicateSignals.filter((signal) => signal.type === 'near').length, 0),
    leakageSignals: categoryCount(findings, 'leakageSignals'),
    contradictionSignals: categoryCount(findings, 'contradictionSignals'),
    promptsWithLogicIssues: promptsWithCategory(findings, 'logicIssues'),
    promptsWithContractIssues: promptsWithCategory(findings, 'contractIssues'),
    promptsWithDuplicateSignals: promptsWithCategory(findings, 'duplicateSignals'),
    promptsWithLeakageSignals: promptsWithCategory(findings, 'leakageSignals'),
    promptsWithContradictionSignals: promptsWithCategory(findings, 'contradictionSignals'),
  };
  summary.totalSignals = summary.logicIssues
    + summary.contractIssues
    + summary.exactDuplicateSignals
    + summary.nearDuplicateSignals
    + summary.leakageSignals
    + summary.contradictionSignals;
  summary.blockingSignals = summary.contractIssues
    + summary.exactDuplicateSignals
    + summary.leakageSignals
    + summary.contradictionSignals;
  summary.diagnosticSignals = summary.logicIssues + summary.nearDuplicateSignals;

  return {
    seed,
    generatedCount: prompts.length,
    wordLengths: summarizeOutputWordLengths(prompts),
    summary,
    findings,
  };
}

function frequencyRows(findings, key, getLabel) {
  const counts = new Map();
  for (const finding of findings) {
    for (const item of finding[key]) {
      const label = getLabel(item);
      counts.set(label, (counts.get(label) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((first, second) => second[1] - first[1]);
}

function formatExamples(lines, findings, key, formatter, maximum = 3) {
  const examples = findings.filter((finding) => finding[key].length > 0).slice(0, maximum);
  if (examples.length === 0) return;
  lines.push('', `${formatter.title} examples:`);
  for (const finding of examples) {
    lines.push(`- Prompt ${finding.index + 1}: ${formatter.item(finding[key][0])}`);
  }
}

export function formatAuditReport(report) {
  const lines = [
    `Generated ${report.generatedCount} prompts`,
    `Seed: ${report.seed || '(not provided)'}`,
    `Prompts with findings: ${report.summary.promptsWithFindings}`,
    '',
    'Output word-length statistics:',
  ];

  for (const stats of report.wordLengths) {
    lines.push(`- ${stats.label}: n=${stats.samples}, missing=${stats.missing}, avg=${stats.average.toFixed(1)}, median=${stats.median.toFixed(1)}, p95=${stats.p95}, min=${stats.min}, max=${stats.max}`);
  }

  lines.push(
    '',
    'Quality summary:',
    `- Existing wardrobe/scene logic issues: ${report.summary.logicIssues} across ${report.summary.promptsWithLogicIssues} prompts`,
    `- Required output-shape/integrity issues: ${report.summary.contractIssues} across ${report.summary.promptsWithContractIssues} prompts`,
    `- Exact duplicate signals: ${report.summary.exactDuplicateSignals}`,
    `- Near-duplicate signals: ${report.summary.nearDuplicateSignals}`,
    `- Internal control-language leakage signals: ${report.summary.leakageSignals} across ${report.summary.promptsWithLeakageSignals} prompts`,
    `- Contradictory-constraint signals: ${report.summary.contradictionSignals} across ${report.summary.promptsWithContradictionSignals} prompts`,
    `- Strict-mode blocking signals: ${report.summary.blockingSignals}`,
    `- Diagnostic-only signals: ${report.summary.diagnosticSignals}`,
  );

  const logicRows = frequencyRows(report.findings, 'logicIssues', (item) => item);
  if (logicRows.length > 0) {
    lines.push('', 'Existing logic issue summary:');
    for (const [label, count] of logicRows) lines.push(`- ${label}: ${count}`);
  }

  const contractRows = frequencyRows(report.findings, 'contractIssues', (item) => `${item.output}: ${item.message}`);
  if (contractRows.length > 0) {
    lines.push('', 'Output contract issue summary:');
    for (const [label, count] of contractRows) lines.push(`- ${label}: ${count}`);
  }

  const leakageRows = frequencyRows(report.findings, 'leakageSignals', (item) => `${item.output}: ${item.label}`);
  if (leakageRows.length > 0) {
    lines.push('', 'Control-language leakage summary:');
    for (const [label, count] of leakageRows) lines.push(`- ${label}: ${count}`);
  }

  const contradictionRows = frequencyRows(report.findings, 'contradictionSignals', (item) => `${item.output}: ${item.label}`);
  if (contradictionRows.length > 0) {
    lines.push('', 'Contradiction summary:');
    for (const [label, count] of contradictionRows) lines.push(`- ${label}: ${count}`);
  }

  formatExamples(lines, report.findings, 'logicIssues', {
    title: 'Existing logic issue',
    item: (item) => item,
  });
  formatExamples(lines, report.findings, 'contractIssues', {
    title: 'Output contract issue',
    item: (item) => `${item.output}: ${item.message}`,
  });
  formatExamples(lines, report.findings, 'duplicateSignals', {
    title: 'Duplicate signal',
    item: (item) => `${item.output} ${item.type} (${item.score.toFixed(2)}): “${shorten(item.first)}” / “${shorten(item.second)}”`,
  });
  formatExamples(lines, report.findings, 'leakageSignals', {
    title: 'Control-language leakage',
    item: (item) => `${item.output}: ${item.label} (“${shorten(item.match)}”)`,
  });
  formatExamples(lines, report.findings, 'contradictionSignals', {
    title: 'Contradictory constraint',
    item: (item) => `${item.output}: ${item.label} (“${shorten(item.first)}” / “${shorten(item.second)}”)`,
  });

  return lines.join('\n');
}

export function parseCliArgs(argv) {
  const positional = [];
  const flags = new Set();
  for (const argument of argv) {
    if (argument.startsWith('--')) flags.add(argument);
    else positional.push(argument);
  }
  const count = positional[0] === undefined ? 200 : Number(positional[0]);
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`count must be a positive integer; received ${positional[0]}`);
  }
  return {
    count,
    seed: positional[1] || 'prompt-logic-default',
    strict: flags.has('--strict'),
    json: flags.has('--json'),
  };
}

export function runPromptAudit({ count = 200, seed = 'prompt-logic-default' } = {}) {
  const prompts = generatePrompts(count, createEmptyLocks(), [], {
    random: createSeededRandom(seed),
  });
  return auditPrompts(prompts, { seed });
}

async function main() {
  try {
    const options = parseCliArgs(process.argv.slice(2));
    const report = runPromptAudit(options);
    console.log(options.json ? JSON.stringify(report, null, 2) : formatAuditReport(report));
    if (options.strict && report.summary.blockingSignals > 0) process.exitCode = 1;
  } catch (error) {
    console.error(`Prompt audit failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}

const isMainModule = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMainModule) await main();
