import { preCopyHistoricalTest } from '../../../../scripts/lib/promptCopyHistoricalTest.mjs';
const copyHistoricalTest = preCopyHistoricalTest(import.meta.url);
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
import { setLegacyWardrobeModifierOrderForTests } from '../engine.js';
import { buildPage1GenerationPromptCards } from '../page1PromptOutputs.js';

// Frozen baseline written before the assembly changes of 2026-10-23.
setLegacyWardrobeModifierOrderForTests(true);
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

const upperTension = 'subtle fabric tension across the torso';
const lowerTension = 'subtle fabric tension along the visible lower-body contours';
const oldFabricClause = 'curves stretching fitted fabric with soft flesh bulges at snug garment edges';

test('the previous I–K English remains importable while generated body descriptions omit its clothing effect', () => {
  const body = BODY_TYPE_CATALOG_V2.find(item => item.zh === '豐胸纖腰沙漏身形');
  const option = bodyControl('bodyTypeId').options.find(item => item.id === body.id);
  const previous = option.meta.legacyPromptAliases.find(value => value.includes(oldFabricClause));
  assert.ok(previous, 'exact previous full English alias');
  assert.equal(parseLocksFromStandardPrompt(`Subject:\nBody Type: ${previous}`, controls).locks.bodyTypeId, body.id);
  assert.doesNotMatch(option.desc, /衣料|溢肉/);
  for (const { value } of buildPage1GenerationPromptCards(generate(locksFor(body)))) {
    assert.ok(!value.includes(oldFabricClause));
  }
});

test('regular tight tops and bottoms contribute separate tension only in visible regions', () => {
  const base = {
    ...locksFor(BODY_TYPE_CATALOG_V2[0]), topId: option('topId', '落肩 T 恤'), pantsId: option('pantsId', '工裝長褲'),
  };
  for (const frame of ['臉部特寫', '胸上特寫', '全身鏡頭 (Full Body Shot)']) {
    for (const [topFitId, bottomFitId] of [
      ['tight', 'standard'], ['standard', 'tight'], ['tight', 'tight'],
      ['underbust-tight', 'fitted'], ['oversized', 'wide'],
    ]) {
      const cards = buildPage1GenerationPromptCards(generate({
        ...base, framingId: option('framingId', frame), topFitId, bottomFitId,
      }));
      for (const { id, value } of cards) {
        const keepsFit = id !== 'ai';
        const showsTop = frame !== '臉部特寫' || ['chest-up-portrait', 'full-body-character'].includes(id);
        const showsBottom = id !== 'chest-up-portrait' && (frame.startsWith('全身') || id === 'full-body-character');
        assert.equal(value.toLowerCase().split(upperTension).length - 1, keepsFit && showsTop && topFitId === 'tight' ? 1 : 0, `${frame}/${id}/upper`);
        assert.equal(value.toLowerCase().split(lowerTension).length - 1, keepsFit && showsBottom && bottomFitId === 'tight' ? 1 : 0, `${frame}/${id}/lower`);
      }
    }
  }
});

test('an opaque closed jacket hides the tight top detail', () => {
  const prompt = generate({
    ...locksFor(BODY_TYPE_CATALOG_V2[0]), topId: option('topId', '落肩 T 恤'), topFitId: 'tight',
    outerwearId: option('outerwearId', '飛行夾克'),
    outerwearOpeningId: option('outerwearOpeningId', '全扣上／全拉上'),
  });
  for (const { id, value } of buildPage1GenerationPromptCards(prompt)) {
    assert.ok(!value.includes(upperTension), id);
  }
});

test('dual-subject tight-fit details stay with their own garment and person', () => {
  const prompt = generate({
    ...locksFor(BODY_TYPE_CATALOG_V2[0]), subjectCount: '2',
    topAId: option('topAId', '落肩 T 恤'), topFitAId: 'tight', pantsAId: option('pantsAId', '直筒牛仔褲'),
    topBId: option('topBId', '一字領上衣'), pantsBId: option('pantsBId', '工裝長褲'), bottomFitBId: 'tight',
  });
  const [first, second] = prompt.grokPrompt.split('Woman 2:');
  assert.ok(first.includes(upperTension));
  assert.ok(!first.includes(lowerTension));
  assert.ok(second.includes(lowerTension));
  assert.ok(!second.includes(upperTension));
  for (const { id, value } of buildPage1GenerationPromptCards(prompt)) {
    const count = id === 'ai' ? 0 : 1;
    assert.equal(value.split(upperTension).length - 1, count, id);
    assert.equal(value.split(lowerTension).length - 1, count, id);
  }
});

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

copyHistoricalTest('60 pre-change body/framing cases keep every non-body output byte and selection', () => {
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
    // The 60 cases were compared against an independent pre-retention engine.
    // Undo only their exact jeans additions / former medium-crop edge wording.
    const fullJeans = ' Straight-leg jeans, clean denim texture, balanced leg line, classic five-pocket construction.';
    assert.equal(historical[2].split(fullJeans).length - 1, 1, 'chest retains selected jeans');
    historical[2] = historical[2].replace(fullJeans, '');
    if (['半臉傾斜特寫', '全臉傾斜特寫'].includes(entry.framing)) {
      assert.equal(historical[0].split(fullJeans).length - 1, 1);
      historical[0] = historical[0].replace(fullJeans, '');
      const compactJeans = ', straight-leg jeans, clean denim texture';
      assert.equal(historical[1].split(compactJeans).length - 1, 1);
      historical[1] = historical[1].replace(compactJeans, '');
    }
    if (entry.framing === '中景鏡頭 (Medium Shot)') {
      const jeans = 'classic five-pocket construction.';
      const compactJeans = 'straight-leg jeans, clean denim texture.';
      assert.equal(historical[0].split(jeans).length - 1, 1);
      assert.equal(historical[1].split(compactJeans).length - 1, 1);
      historical[0] = historical[0].replace(jeans, 'classic five-pocket construction at the lower crop edge.');
      historical[1] = historical[1].replace(compactJeans, 'straight-leg jeans, clean denim texture, at the lower crop edge.');
    }
    assert.equal(hash(historical), entry.outputs, `${entry.body}/${entry.framing}: non-body bytes`);
    const historicalSelection = { ...p.selection };
    if (['半臉傾斜特寫', '全臉傾斜特寫'].includes(entry.framing)) {
      for (const key of ['bottomPatternId', 'earringsId', 'eyewearColorId', 'eyewearId', 'headAccessoryId', 'legwearId', 'neckAccessoryId', 'outerwearId', 'shoesId', 'topPatternId']) {
        assert.equal(historicalSelection[key], option(key, '全無'), `${key}: explicitly resolved none`);
        historicalSelection[key] = '';
      }
    }
    assert.equal(hash(historicalSelection), entry.selection, `${entry.body}/${entry.framing}: unrelated selection`);
  }
});
