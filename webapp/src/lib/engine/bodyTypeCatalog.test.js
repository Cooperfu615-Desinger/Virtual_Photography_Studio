import catalogProtected from './midjourneyNaturalCatalogProtected.json' with { type: 'json' };
import assert from 'node:assert/strict';
import { restorePreEthnicityText } from './ethnicityRevisionTestSupport.js';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { buildRestoreLocks, parseLocksFromStandardPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { BODY_TYPE_CATALOG_V2 } from './bodyTypeCatalogFixtures.js';
import { normalizeLegacyBodyPrompt } from './bodyTypeLegacyTestSupport.js';
import { assertFullBodyCharacterBody, assertFullBodyCharacterHasNoBody } from './fullBodyCharacterBodyTestSupport.js';
import { polishPublicPromptText } from './publicPromptPolish.js';
// Public prompt polish (publicPromptPolish.js) capitalizes sentence starts. A
// catalog source keeps every word; accept only its exact polished letter case.
const sourceForms = (source) => [...new Set([source, polishPublicPromptText(source), source[0] + polishPublicPromptText(source).slice(1)])];
const includesSource = (text, source) => sourceForms(source).some(form => text.includes(form));

const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const bodyControl = key => controls.find(c => c.key === key);
function locksFor(body, framing = '全身鏡頭 (Full Body Shot)') {
  const locks = createEmptyLocks();
  for (const c of controls) {
    const none = c.options.find(o => o.zh === '全無' || o.zh === '無額外表情');
    if (none) locks[c.key] = none.id;
  }
  return { ...locks, subjectCount: '1', bodyTypeId: body.id, framingId: option('framingId', framing) };
}
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('body-catalog-v2') })[0];
const main = p => [p.grokPrompt, p.zImagePrompt];
const six = p => [...main(p), ...['chest-up-portrait', 'full-body-character'].map(id => p.extraPrompts.find(e => e.id === id).text)];
// Main GPT and GPT chest-up omit the standalone body; the full-body character
// reference keeps it under the approved 2026-10-14 exception.
const gpt = p => [p.grokPrompt, p.extraPrompts.find(e => e.id === 'chest-up-portrait').text];
const retained = p => [p.zImagePrompt];

test('six reviewed body sources and none retain stable IDs in single and duo controls', () => {
  for (const key of ['bodyTypeId', 'bodyTypeAId', 'bodyTypeBId']) {
    const options = bodyControl(key).options;
    assert.equal(options.length, 7);
    for (const source of BODY_TYPE_CATALOG_V2) {
      const item = options.find(o => o.zh === source.zh);
      assert.equal(item?.id, source.id);
      assert.equal(item?.en, source.en);
    }
    assert.equal(options.find(o => o.zh === '全無').id, 'character:體態-body-type:全無:6');
    assert.ok(!options.some(o => o.zh === '一般基本體型'));
  }
});

for (const source of BODY_TYPE_CATALOG_V2) {
  test(`${source.zh}: main/chest GPT omit body, full-body keeps it once, other outputs retain the source at every framing and with overlapping hems`, () => {
    for (const framing of controls.find(c => c.key === 'framingId').options) {
      const locks = { ...locksFor(source), framingId: framing.id };
      for (const overlap of [false, true]) {
        const prompt = generate(overlap ? {
          ...locks, topId: option('topId', '長版寬鬆麻花針織毛衣'),
          topStylingId: option('topStylingId', '衣襬遮住部分下身'), pantsId: option('pantsId', '牛仔短褲'),
        } : locks);
        assert.equal(prompt.selection.bodyTypeId, source.id);
        for (const [i, text] of retained(prompt).entries()) {
          assert.ok(includesSource(text, source.en), `${framing.zh}/${overlap}/${i}: missing verbatim source`);
        }
        for (const text of gpt(prompt)) assert.ok(!includesSource(text, source.en), `${framing.zh}/${overlap}: GPT omission`);
        assertFullBodyCharacterBody(prompt, source.en, `${framing.zh}/${overlap}`);
      }
    }
  });
}

test('duo body sources stay with their selected person without compacting or cross-person changes', () => {
  for (const source of BODY_TYPE_CATALOG_V2) {
    const other = BODY_TYPE_CATALOG_V2.find(s => s.id !== source.id);
    const p = generate({ ...locksFor(source, '臉部特寫'), subjectCount: '2', bodyTypeAId: source.id, bodyTypeBId: other.id });
    assert.ok(!p.grokPrompt.includes(source.en));
    assert.ok(!p.grokPrompt.includes(other.en));
    for (const text of [p.zImagePrompt]) {
      assert.ok(text.includes(source.en));
      assert.ok(text.includes(other.en));
      assert.equal(text.split(source.en).length - 1, 1);
      assert.equal(text.split(other.en).length - 1, 1);
      assert.ok(text.indexOf(source.en) < text.indexOf(other.en));
    }
  }
});

test('old basic IDs, old English sources and Saved Card payloads resolve to the merged option', () => {
  const soft = BODY_TYPE_CATALOG_V2.find(s => s.zh === '柔和沙漏身形');
  const oldId = 'character:體態-body-type:一般基本體型:1';
  for (const key of ['bodyTypeId', 'bodyTypeAId', 'bodyTypeBId']) {
    const locks = { ...locksFor(soft), subjectCount: key === 'bodyTypeId' ? '1' : '2', [key]: oldId };
    assert.equal(buildRestoreLocks(locks, controls)[key], soft.id);
    assert.equal(generate(locks).selection[key], soft.id);
  }
  for (const source of BODY_TYPE_CATALOG_V2) {
    const aliases = bodyControl('bodyTypeId').options.find(o => o.id === source.id).meta.legacyPromptAliases;
    assert.ok(aliases.length);
    for (const alias of aliases) {
      const parsed = parseLocksFromStandardPrompt(`Subject:\nBody Type: ${alias}`, controls);
      assert.equal(parsed.locks?.bodyTypeId ?? parsed.bodyTypeId, source.id, alias);
    }
    const prompt = generate(locksFor(source));
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
    assert.equal(buildRestoreLocks(restored.selection, controls).bodyTypeId, source.id);
    assert.equal(parseLocksFromStandardPrompt(`Subject:\nBody Type: ${source.en}`, controls).locks.bodyTypeId, source.id);
    assert.ok(!parseLocksFromStandardPrompt(prompt.grokPrompt, controls).locks.bodyTypeId);
  }
});

test('none remains silent and the fixed chest and full-body ratios remain unchanged', () => {
  const p = generate({ ...locksFor(BODY_TYPE_CATALOG_V2[0]), bodyTypeId: option('bodyTypeId', '全無') });
  for (const text of six(p)) {
    assert.doesNotMatch(text, /Body Type:|bust–waist–hip|\bnone\b/i);
  }
  assertFullBodyCharacterHasNoBody(p, BODY_TYPE_CATALOG_V2.map(source => source.en), 'none');
  for (const id of ['chest-up-portrait']) assert.match(p.extraPrompts.find(e => e.id === id).text, /4:5/);
  assert.match(p.extraPrompts.find(e => e.id === 'full-body-character').text, /9:16/);
});

test('60 pre-change body/framing cases keep every non-body output byte and selection', () => {
  // Generated with HEAD 6027041 before implementation, not the changed renderer.
  const baseline = catalogProtected.body;
  const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  for (const entry of baseline) {
    const source = BODY_TYPE_CATALOG_V2.find(s => s.zh === entry.body);
    const p = generate({ ...locksFor(source, entry.framing),
      topId: option('topId', '棉質細肩背心'), pantsId: option('pantsId', '直筒牛仔褲'),
      locationId: option('locationId', '室內：英倫復古窗邊房間'),
      poseBaseId: 'standing', poseArrangementId: 'standing-natural',
    });
    // The frozen hash predates the 2026-10-14 ethnicity revision; reverse only that rollout (no main MJ here).
    const historical = six(normalizeLegacyBodyPrompt(p)).map(text => restorePreEthnicityText(text, 'six'));
    assert.equal(hash(historical), entry.outputs, `${entry.body}/${entry.framing}: non-body bytes`);
    assert.equal(hash(p.selection), entry.selection, `${entry.body}/${entry.framing}: selection`);
  }
});
