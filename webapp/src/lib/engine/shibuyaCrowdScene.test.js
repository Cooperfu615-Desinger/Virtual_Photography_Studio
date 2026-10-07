import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import {
  createEmptyLocks, createSeededRandom, generatePrompts, getKnowledgeBaseSnapshot,
  getLockControls, normalizeLocks,
} from '../engine.js';
import {
  deserializeFavoritePrompt, parseLocksFromStandardPrompt, serializeFavoritePrompt,
} from '../../features/saved-cards/cardCodec.js';
import { LOW_CAMERA_LABELS } from './zImageSceneDirection.js';
import {
  normalizeShibuyaPromptForLegacy, normalizeShibuyaSceneForLegacy,
} from './shibuyaSceneTestSupport.js';

const controls = getLockControls();
const id = 'locations:城市與社群感-urban-social-snapshots:戶外-澀谷站前廣場人潮邊緣:11';
const label = '戶外：澀谷站前廣場人潮邊緣';
const legacySource = 'Shibuya Station front plaza edge near Hachiko Square, broad pedestrian paving, dense realistic foot traffic, station-front commercial facade layers, meeting crowd clusters, curb and railing fragments, recognizable public-plaza ground plane without focusing on a single monument';
// Independent approved source oracle. Keep the three depth layers in one
// comma-delimited clause so crop/compact selection cannot split their meaning.
const clauses = Object.freeze([
  'Shibuya Station front plaza with the QFRONT glass facade carrying TSUTAYA and STARBUCKS signage and large advertising screens in the background',
  'the subject as one person within a dense pedestrian flow with people passing in different directions beside and in front of and behind her; everyone sharing the same physical space and perspective with apparent size varying naturally by distance',
  'pedestrians in varied everyday clothing in mixed colors and styles sharing the same ambient light as the subject; nearby passersby naturally overlapping and partly cropped at frame edges',
  'surrounding Japanese shop signs',
]);
const source = clauses.join(', ');
const previousSource = [clauses[0], 'dense varied crowds walking in different directions around the subject through the foreground and midground into the background', 'nearby passersby partly cropped at frame edges', clauses[3]].join(', ');
const locationOptions = controls.find(c => c.key === 'locationId').options;
const option = (key, zh) => {
  const found = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(found, `${key}/${zh}`);
  return found.id;
};
const extra = (prompt, extraId) => prompt.extraPrompts.find(entry => entry.id === extraId)?.text || '';
const sceneTexts = prompt => [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt,
  extra(prompt, 'chest-up-portrait'), extra(prompt, 'chest-up-mj-portrait')];
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const stablePrompt = prompt => ({ selection: prompt.selection, summary: prompt.summary,
  grokPrompt: prompt.grokPrompt, zImagePrompt: prompt.zImagePrompt,
  midjourneyPrompt: prompt.midjourneyPrompt, extraPrompts: prompt.extraPrompts });

function locks(overrides = {}) {
  const values = { ...createEmptyLocks(), subjectCount: '1', aspectRatio: '9:16' };
  for (const control of controls) {
    const none = control.options.find(o => o.zh === '全無' || o.zh === '無額外表情');
    if (none) values[control.key] = none.id;
  }
  return {
    ...values,
    aspectRatio: '9:16',
    bodyTypeId: option('bodyTypeId', '柔和沙漏身形'),
    facialFeaturesId: option('facialFeaturesId', '甜美可愛臉'),
    hairstyleId: option('hairstyleId', '側分柔波中長髮'),
    hairColorId: option('hairColorId', '自然黑'),
    topId: option('topId', '棉質細肩背心'),
    pantsId: option('pantsId', '直筒牛仔褲'),
    poseBaseId: option('poseBaseId', '站姿'),
    poseArrangementId: option('poseArrangementId', '自然站姿'),
    locationId: id,
    framingId: option('framingId', '中景鏡頭 (Medium Shot)'),
    angleId: option('angleId', '平視高度鏡頭'),
    orbitId: option('orbitId', '正面 0 度'),
    ...overrides,
  };
}

function generate(overrides = {}, library = []) {
  const input = locks(overrides);
  const before = structuredClone(input);
  const random = createSeededRandom('shibuya-crowd-v1');
  let randomDraws = 0;
  const prompt = generatePrompts(1, input, library, {
    random: () => { randomDraws++; return random(); },
  })[0];
  assert.deepEqual(input, before, 'scene rendering must not mutate input locks');
  return { prompt, randomDraws };
}

function legacyLibrary() {
  const library = getKnowledgeBaseSnapshot();
  const entry = Object.values(library.Locations).flat().find(o => o.zh === label);
  assert.ok(entry);
  entry.en = legacySource;
  if (entry.meta?.legacyPromptAliases) delete entry.meta.legacyPromptAliases;
  return library;
}

function assertCrowd(text, message = '') {
  const normalized = text.toLowerCase();
  for (const clause of clauses.slice(0, 3)) {
    assert.equal(normalized.split(clause.toLowerCase()).length - 1, 1, `${message}: ${clause}`);
  }
  assert.doesNotMatch(text, /Hachiko|meeting crowd clusters|broad pedestrian paving|curb and railing|public-plaza ground plane|waiting pedestrian clusters/i);
}

test('Shibuya crowd source preserves the public label, ID, order and legacy English identity', () => {
  const location = locationOptions.find(o => o.id === id);
  assert.equal(location?.zh, label);
  assert.equal(locationOptions.findIndex(o => o.id === id), 92);
  assert.equal(digest(locationOptions.map(o => [o.id, o.zh])), '60c457753e4a34a29882a118cdf15a417f42c0ffc41c05fdbd9e43f6ad69a290');
  assert.equal(location.en, source);
  assert.deepEqual(location.en.split(', '), clauses);
  assert.ok(location.meta.legacyPromptAliases.includes(legacySource));
  assert.ok(location.meta.legacyPromptAliases.includes(previousSource));
  assert.equal(normalizeLocks(locks()).locationId, id);
  assert.doesNotMatch(location.en, /Hachiko|waiting|paving|ground plane|crosswalk|railing/i);
});

test('all public main crops and both same-state chest outputs retain landmark and three-layer moving crowd sources', () => {
  for (const crop of ['局部五官特寫', '半臉傾斜特寫', '胸上特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)', '全無']) {
    const { prompt } = generate({ framingId: option('framingId', crop) });
    assert.equal(prompt.selection.locationId, id, crop);
    assert.match(prompt.summary, /戶外：澀谷站前廣場人潮邊緣/);
    for (const text of sceneTexts(prompt)) assertCrowd(text, crop);
    const gptScene = prompt.grokPrompt.split('Scene:\n')[1]?.split('\n\n')[0] || '';
    assert.equal(gptScene.toLowerCase().includes(clauses[3].toLowerCase()), !['局部五官特寫', '半臉傾斜特寫', '胸上特寫'].includes(crop), crop);
    assert.ok(extra(prompt, 'chest-up-portrait').includes(clauses[3]), crop);
  }
});

test('all four effective low-camera angles keep crowds instead of replacing them with empty facades', () => {
  for (const angle of LOW_CAMERA_LABELS) {
    for (const crop of ['中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)']) {
      const angleId = option('angleId', angle);
      const framingId = option('framingId', crop);
      const { prompt } = generate({ angleId, framingId });
      assert.equal(prompt.selection.angleId, angleId);
      assert.equal(prompt.selection.framingId, framingId);
      for (const text of sceneTexts(prompt)) assertCrowd(text, `${angle}/${crop}`);
    }
  }
});

test('scene identity does not override selected high viewpoints, orbit or focal length', () => {
  for (const angle of ['高位俯視鏡頭', '鳥瞰視角', '正上方俯視鏡頭']) {
    const overrides = {
      angleId: option('angleId', angle), orbitId: option('orbitId', '背面 180 度'),
      lensId: option('lensId', '135mm 長焦壓縮'),
      framingId: option('framingId', '全身鏡頭 (Full Body Shot)'),
    };
    const { prompt } = generate(overrides);
    for (const [key, value] of Object.entries(overrides)) assert.equal(prompt.selection[key], value);
    for (const text of sceneTexts(prompt)) {
      assertCrowd(text, angle);
      assert.match(text, /135mm/i);
      assert.match(text, /back view|from behind/i);
    }
  }
});

test('all other location descriptions, metadata and positions remain byte-identical', () => {
  assert.equal(digest(locationOptions.filter(o => o.id !== id)), '9e65a646d08541af7ad4b797c39de4cde31893b81ff120821d96d899498f2de6');
});

test('scene-source-only revision preserves selections, random draws and the scene-free full-body character', () => {
  const previous = legacyLibrary();
  for (const angle of ['平視高度鏡頭', '地面高度鏡頭', '高位俯視鏡頭']) {
    const overrides = { angleId: option('angleId', angle) };
    const current = generate(overrides);
    const old = generate(overrides, previous);
    assert.deepEqual(current.prompt.selection, old.prompt.selection);
    assert.equal(current.randomDraws, old.randomDraws);
    const full = extra(current.prompt, 'full-body-character');
    assert.equal(full, extra(old.prompt, 'full-body-character'));
    assert.doesNotMatch(full, /Shibuya|QFRONT|TSUTAYA|STARBUCKS|passersby|crowds|Hachiko/i);
  }
  for (const location of ['戶外：八公銅像旁行人區', '戶外：新宿歌舞伎町招牌下', '室內：浴室鏡前 / 洗手台']) {
    const overrides = { locationId: option('locationId', location) };
    assert.deepEqual(stablePrompt(generate(overrides).prompt), stablePrompt(generate(overrides, previous).prompt), location);
  }
});

test('new and historical full English sources import to the same stable Shibuya location', () => {
  for (const text of [`Scene: ${source}.`, `Scene: ${legacySource}.`, `Scene: ${previousSource}.`, generate().prompt.grokPrompt]) {
    const imported = parseLocksFromStandardPrompt(text, controls).locks;
    assert.equal(imported.locationId, id);
    for (const output of sceneTexts(generate(imported).prompt)) assertCrowd(output, 'import');
  }
});

test('Saved Cards preserve both historical prompt bytes and stable location restore with new generation', () => {
  const current = generate().prompt;
  const currentRestored = deserializeFavoritePrompt(serializeFavoritePrompt(current));
  const historical = generate({}, legacyLibrary()).prompt;
  const historicalRestored = deserializeFavoritePrompt(serializeFavoritePrompt(historical));
  for (const [saved, original] of [[currentRestored, current], [historicalRestored, historical]]) {
    assert.deepEqual(sceneTexts(saved), sceneTexts(original));
    assert.deepEqual(saved.extraPrompts, original.extraPrompts);
    assert.equal(saved.summary, original.summary);
    // The existing codec canonicalizes empty optional values to none. Verify
    // effective selected state and verbatim text, not its empty-value encoding.
    for (const key of ['locationId', 'subjectCount', 'bodyTypeId', 'facialFeaturesId', 'hairstyleId',
      'hairColorId', 'topId', 'pantsId', 'poseBaseId', 'poseArrangementId',
      'framingId', 'angleId', 'orbitId', 'aspectRatio']) {
      assert.equal(saved.selection[key], original.selection[key], key);
    }
  }
  assert.equal(historicalRestored.selection.locationId, id);
  assert.match(historicalRestored.grokPrompt, /Hachiko Square/);
  for (const text of sceneTexts(generate(normalizeLocks(historicalRestored.selection)).prompt)) assertCrowd(text, 'old-card-regenerate');
});

test('historical snapshot inverse recognizes only the exact approved Shibuya scene sources', () => {
  const current = generate().prompt;
  const historical = generate({}, legacyLibrary()).prompt;
  const scene = current.grokPrompt.split('Scene:\n')[1]?.split('\n\n')[0] || '';
  const originalScene = historical.grokPrompt.split('Scene:\n')[1]?.split('\n\n')[0] || '';
  assert.equal(normalizeShibuyaSceneForLegacy(scene, current.selection), originalScene);
  const fields = ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt', 'chestUpPortraitPrompt', 'chestUpMjPortraitPrompt'];
  for (const [index, field] of fields.entries()) {
    assert.equal(normalizeShibuyaPromptForLegacy(sceneTexts(current)[index], field, current.selection),
      sceneTexts(historical)[index], field);
  }
  assert.equal(normalizeShibuyaPromptForLegacy(extra(current, 'full-body-character'),
    'fullBodyCharacterPrompt', current.selection), extra(current, 'full-body-character'));
});

test('historical inverse fails closed on wrong identities or changed scenes and cannot hide arbitrary added content', () => {
  const prompt = generate().prompt;
  const scene = prompt.grokPrompt.split('Scene:\n')[1]?.split('\n\n')[0] || '';
  const otherSelection = { ...prompt.selection, locationId: option('locationId', '戶外：八公銅像旁行人區') };
  const mutate = text => [
    text.replace('QFRONT', 'UNKNOWN-FACADE'),
    text.replace(/dense pedestrian flow/i, 'changed sparse pedestrians'),
    text.replace(clauses[2], `${clauses[2]}, unexpected crimson fountain`),
  ];
  assert.equal(normalizeShibuyaSceneForLegacy(scene, otherSelection), scene);
  for (const value of [...mutate(scene), `${scene} A custom scene addition.`, 'arbitrary imported scene']) {
    assert.equal(normalizeShibuyaSceneForLegacy(value, prompt.selection), value);
  }
  const fields = ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt', 'chestUpPortraitPrompt', 'chestUpMjPortraitPrompt'];
  for (const [index, field] of fields.entries()) {
    const text = sceneTexts(prompt)[index];
    assert.equal(normalizeShibuyaPromptForLegacy(text, field, otherSelection), text, field);
    for (const changed of mutate(text)) {
      assert.equal(normalizeShibuyaPromptForLegacy(changed, field, prompt.selection), changed, field);
    }
    const added = `${text}\n\nArbitrary added visual detail: a crimson fountain.`;
    const normalized = normalizeShibuyaPromptForLegacy(added, field, prompt.selection);
    assert.ok(normalized.endsWith('\n\nArbitrary added visual detail: a crimson fountain.'), field);
  }
});
