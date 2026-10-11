import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { CRT_MIDJOURNEY_SELECTIONS, midjourneyNaturalFixtures, naturalFixtureLocks, protectedNaturalOutputs } from './midjourneyNaturalFixtures.js';
import { extractMidjourneyItemNames, midjourneyItemName, naturalIdentity } from './midjourneyNaturalPrompt.js';
import { MIDJOURNEY_ITEM_NAMES } from './midjourneyItemNames.js';
import { parseMidjourneyParameterTail, stripMidjourneyParameterTail } from './midjourneyParameterTail.js';

const generate = selections => generatePrompts(1, naturalFixtureLocks(selections), [], { random: createSeededRandom('mj-natural-crt') })[0];
const hash = value => createHash('sha256').update(JSON.stringify(value) ?? 'undefined').digest('hex');
const baseline = JSON.parse(readFileSync(new URL('./midjourneyNaturalProtectedBaseline.json', import.meta.url), 'utf8'));
const bodyBaseline = JSON.parse(readFileSync(new URL('./midjourneyBodyPreservationBaseline.json', import.meta.url), 'utf8'));
// Literal approved wording, independent from the runtime projection table.
const bodyCases = [
  ['高挑時裝模特', 'A tall, slender figure with long legs and elegant, balanced proportions.'],
  ['柔和沙漏身形', 'A soft, balanced hourglass figure with a gently defined waist and naturally rounded curves.'],
  ['性感曲線身形', 'A well-defined curvy figure with a slender waist, long legs and graceful lines.'],
  ['運動緊實身形', 'A lean, toned figure with a firm waist and naturally athletic limbs.'],
  ['小隻精緻身形', 'A petite, slender figure with balanced proportions and soft, delicate lines.'],
  ['豐胸纖腰沙漏身形', 'A full, well-proportioned figure with a slender waist and naturally graceful curves.'],
];
const roleBody = (sentence, role) => `The ${role} woman has ${sentence[0].toLowerCase()}${sentence.slice(1)}`;
const sharedBody = sentence => `Both women have ${sentence[0].toLowerCase()}${sentence.slice(1)}`;
const removeBody = text => bodyCases.reduce((result, [, sentence]) =>
  [sentence, roleBody(sentence, 'first'), roleBody(sentence, 'second'), sharedBody(sentence)]
    .reduce((value, clause) => value.replace(` ${clause}`, ''), result), text);

test('main MJ CRT has the approved short body, item names, freckles, style and film without measurements or hidden boots', () => {
  const prompt = generate(CRT_MIDJOURNEY_SELECTIONS);
  const body = stripMidjourneyParameterTail(prompt.midjourneyPrompt);
  const paragraphs = body.split('\n\n');
  assert.equal(paragraphs.length, 4);
  assert.match(paragraphs[0], /twenties.*freckles.*waves.*bangs/is);
  assert.ok(paragraphs[0].includes(bodyCases[5][1]));
  assert.equal(paragraphs[1], 'She wears a bikini top, narrow-front string bikini bottoms and lace-top thigh-high stockings.');
  assert.match(paragraphs[2], /CRT.*static.*scan lines.*High-key white.*soft frontal/is);
  assert.match(paragraphs[3], /Mika Ninagawa.*Neon cross-processed.*cyan/is);
  assert.doesNotMatch(body, /cup bust|hourglass|height \d|bust[–-]waist|indentation|body-skimming|low-rise|Dr\.? Martens|--ar/);
  const full = generate({ ...CRT_MIDJOURNEY_SELECTIONS, framingId: { byZh: '全身鏡頭 (Full Body Shot)' } });
  assert.match(full.midjourneyPrompt, /dr martens 1460 round toe lace-up boots/i);
  assert.equal(parseMidjourneyParameterTail(prompt.midjourneyPrompt).tail, '--v 8.2 --raw --s 25 --c 0 --w 0 --sd');
});

test('all mode baselines protect five other outputs, raw selections, structured data and summaries byte for byte', () => {
  const fixtures = midjourneyNaturalFixtures();
  assert.equal(fixtures.length, baseline.length);
  for (let index = 0; index < fixtures.length; index += 1) {
    const fixture = fixtures[index];
    assert.equal(fixture.id, baseline[index].id);
    const prompt = generatePrompts(1, fixture.locks, [], { random: createSeededRandom(fixture.seed) })[0];
    assert.equal(fixture.id, bodyBaseline[index].id);
    assert.equal(createHash('sha256').update(removeBody(prompt.midjourneyPrompt)).digest('hex'), bodyBaseline[index].main,
      `${fixture.id}: main MJ changed beyond approved body sentences`);
    for (const [field, value] of Object.entries(protectedNaturalOutputs(prompt))) {
      assert.equal(hash(value), baseline[index].fields[field], `${fixture.id}: ${field} changed`);
    }
    assert.ok(parseMidjourneyParameterTail(prompt.midjourneyPrompt).matched, fixture.id);
    assert.doesNotMatch(prompt.midjourneyPrompt, /cup bust|bust[–-]waist[–-]hip|height \d+|shallow indentations/i, fixture.id);
  }
});

test('fit and additional garment colors do not influence main MJ or consume another random choice', () => {
  const base = generate(CRT_MIDJOURNEY_SELECTIONS);
  for (const changes of [
    { topFitId: { byZh: '全無' }, bottomRiseId: { byZh: '全無' } },
    { topColorId: { byZh: '紅色' }, bottomColorId: { byZh: '紅色' } },
  ]) assert.equal(generate({ ...CRT_MIDJOURNEY_SELECTIONS, ...changes }).midjourneyPrompt, base.midjourneyPrompt);
});

test('six reviewed bodies and none preserve CRT scene, lighting, imaging and parameter wording at every crop', () => {
  for (const framing of ['臉部特寫', '胸上特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)']) {
    const selections = { ...CRT_MIDJOURNEY_SELECTIONS, framingId: { byZh: framing }, bodyTypeId: { byZh: '全無' } };
    const none = generate(selections);
    assert.equal(removeBody(none.midjourneyPrompt), none.midjourneyPrompt);
    for (const [zh, sentence] of bodyCases) {
      const prompt = generate({ ...selections, bodyTypeId: { byZh: zh } });
      assert.equal(prompt.midjourneyPrompt.split(sentence).length - 1, 1, `${zh}/${framing}`);
      assert.equal(removeBody(prompt.midjourneyPrompt), none.midjourneyPrompt);
      assert.equal(prompt.grokPrompt, none.grokPrompt);
      const source = prompt.structured.Character.find(item => item.id === prompt.selection.bodyTypeId);
      assert.equal(source?.en, getLockControls().find(control => control.key === 'bodyTypeId').options.find(item => item.zh === zh).en,
        `${zh}: original catalog data retained`);
      assert.ok(prompt.zImagePrompt.includes(source.en), `${zh}: Z keeps full source`);
      assert.ok(prompt.extraPrompts.find(item => item.id === 'chest-up-mj-portrait').text.includes(source.en));
    }
  }
});

test('duo bodies keep A/B ownership for distinct, identical and none selections without changing other main wording', () => {
  const base = { subjectCount: '2', bodyTypeAId: { byZh: '全無' }, bodyTypeBId: { byZh: '全無' } };
  const none = generate(base);
  for (const [aZh, aSentence] of [...bodyCases, ['全無', '']]) {
    for (const [bZh, bSentence] of [...bodyCases, ['全無', '']]) {
      const prompt = generate({ ...base, bodyTypeAId: { byZh: aZh }, bodyTypeBId: { byZh: bZh } });
      if (aSentence && aSentence === bSentence) {
        assert.equal(prompt.midjourneyPrompt.split(sharedBody(aSentence)).length - 1, 1);
        assert.ok(!prompt.midjourneyPrompt.includes(roleBody(aSentence, 'first')));
        assert.ok(!prompt.midjourneyPrompt.includes(roleBody(aSentence, 'second')));
      } else for (const [sentence, role] of [[aSentence, 'first'], [bSentence, 'second']]) {
        if (sentence) assert.equal(prompt.midjourneyPrompt.split(roleBody(sentence, role)).length - 1, 1);
        else assert.ok(!bodyCases.some(([, body]) => prompt.midjourneyPrompt.includes(roleBody(body, role))));
      }
      assert.equal(removeBody(prompt.midjourneyPrompt), none.midjourneyPrompt, `${aZh}/${bZh}`);
    }
  }
});

test('card and dedicated modes ignore latent body locks while outfit and fixed modes keep the effective body', () => {
  const controls = getLockControls();
  const bodyTypeId = { byZh: bodyCases[5][0] };
  for (const key of ['characterProfileId', 'specialSubjectId', 'specialOutfitId', 'outfitPresetId', 'fixedCompositionSetId']) {
    for (const option of controls.find(control => control.key === key).options) {
      if (['none', 'random'].includes(option.id) || option.zh === '隨機') continue;
      const base = { subjectCount: '1', [key]: option.id, bodyTypeId: { byZh: '全無' } };
      const none = generate(base);
      const prompt = generate({ ...base, bodyTypeId });
      if (['characterProfileId', 'specialSubjectId'].includes(key)) assert.equal(prompt.midjourneyPrompt, none.midjourneyPrompt, option.id);
      else assert.ok(prompt.midjourneyPrompt.includes(bodyCases[5][1]), option.id);
      assert.equal(removeBody(prompt.midjourneyPrompt), none.midjourneyPrompt, option.id);
    }
  }
  const custom = selection => generatePrompts(1, naturalFixtureLocks(selection), [], {
    random: createSeededRandom('mj-body-custom'), characterProfilePrompt: 'An adult woman with an oval face and a narrow waist',
  })[0];
  assert.equal(custom({ bodyTypeId }).midjourneyPrompt, custom({ bodyTypeId: { byZh: '全無' } }).midjourneyPrompt);
});

test('catalog short names are explicit, nonempty and never contain construction or fit prose', () => {
  assert.ok(Object.keys(MIDJOURNEY_ITEM_NAMES).length > 250);
  for (const [id, name] of Object.entries(MIDJOURNEY_ITEM_NAMES)) {
    assert.ok(name.length > 3, id);
    assert.doesNotMatch(name, /with |fitted|low-rise|indentation|covering only|body-skimming|\bcm\b/i, id);
    const item = getLockControls().flatMap(control => control.options || []).find(option => option.id === id);
    assert.ok(item, id);
    assert.equal(midjourneyItemName(item), name);
  }
  assert.deepEqual(extractMidjourneyItemNames('fitted red silk blouse with compressed fabric, blue denim shorts, no shoes'), ['silk blouse', 'denim shorts']);
  assert.equal(naturalIdentity('oval face, narrow waist, gray eyes, height 170 cm'), 'oval face, gray eyes');
});


test('card selected layers keep PAGE1 garments in vacant slots and never reintroduce removed default layers', () => {
  const prompt = generate({ characterProfileId: 'character-rika', characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top'], pantsId: { byZh: '直筒牛仔褲' },
    outerwearId: { byZh: '西裝外套' }, shoesId: { byZh: '樂福鞋' },
    framingId: { byZh: '全身鏡頭 (Full Body Shot)' } });
  assert.match(prompt.midjourneyPrompt, /She wears a baby tee, straight-leg jeans, a blazer and classic loafers/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /low-top sneakers|beaded choker|narrow waist/);
  assert.match(prompt.midjourneyPrompt, /petite oval face.*round gray-brown eyes.*tiny beauty mark.*rose lips/);
});

test('duo item names remain assigned to the selected role without leaking dress construction', () => {
  const prompt = generate({ subjectCount: '2', topAId: { byZh: '比基尼上身' },
    pantsAId: { byZh: '直筒牛仔褲' }, topBId: { byZh: '坦克背心' }, skirtBId: { byZh: '牛仔短裙' },
    framingId: { byZh: '全身鏡頭 (Full Body Shot)' } });
  assert.match(prompt.midjourneyPrompt, /The first woman wears a bikini top and straight-leg jeans/);
  assert.match(prompt.midjourneyPrompt, /The second woman wears a tank top and a denim mini skirt/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /cup bust|height \d|waistband|body-skimming/);
});
