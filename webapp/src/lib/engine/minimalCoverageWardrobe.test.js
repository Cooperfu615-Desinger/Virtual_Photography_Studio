import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import baseline from './minimalCoverageWardrobeBaseline.json' with { type: 'json' };
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../engine.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt, parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const pairs = [
  ['小罩杯細帶蕾絲胸罩', '窄前片細繩蕾絲丁字褲', /small-cup lace bra top/i, /narrow-front lace G-string bottoms/i],
  ['小三角細繩比基尼上身', '窄前片細繩比基尼下身', /small-triangle string bikini top/i, /narrow-front string thong bikini bottoms/i],
];
const fullness = 'soft bust fullness extending slightly above and around the cup edges';
const tension = 'taut slender side ties fitted tightly around the hips';
const indentation = 'visible shallow indentations beneath the ties';
const option = (key, zh) => {
  const item = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(item, `${key}: ${zh}`);
  return item;
};
function noneLocks() {
  const locks = createEmptyLocks();
  for (const c of controls) {
    const none = c.options.find(o => o.zh === '全無');
    if (none) locks[c.key] = none.id;
  }
  return locks;
}
function generate(overrides = {}, seed = 'minimal-coverage-v1') {
  return generatePrompts(1, { ...noneLocks(), subjectCount: '1', framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id, ...overrides }, [], { random: createSeededRandom(seed) })[0];
}
const main = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt];
const chest = p => p.extraPrompts.filter(e => e.id.includes('chest')).map(e => e.text);
const fullBody = p => p.extraPrompts.find(e => e.id === 'full-body-character').text;
const snapshot = p => ({ selection: p.selection, grokPrompt: p.grokPrompt, zImagePrompt: p.zImagePrompt, midjourneyPrompt: p.midjourneyPrompt, extraPrompts: p.extraPrompts });

test('new pieces append to existing single and duo catalogs without changing prior IDs', () => {
  for (const key of ['topId', 'pantsId']) {
    const before = baseline.oldOptionIds[key];
    for (const suffix of ['', 'A', 'B']) {
      const current = controls.find(c => c.key === key.replace('Id', `${suffix}Id`)).options.map(o => o.id);
      assert.deepEqual(current.slice(0, before.length), before);
      assert.equal(current.length, before.length + 2);
    }
  }
});

for (const fixture of baseline.fixtures) test(`legacy bytes unchanged: ${fixture.title}`, () => {
  const p = generate(fixture.overrides, fixture.seed);
  assert.equal(createHash('sha256').update(JSON.stringify(snapshot(p))).digest('hex'), fixture.sha256);
});

for (const [top, pants, topType, pantsType] of pairs) {
  test(`${top}: fit details survive visible main/derived outputs without changing body source`, () => {
    for (const body of controls.find(c => c.key === 'bodyTypeId').options.filter(o => o.zh !== '全無')) {
      const p = generate({ topId: option('topId', top).id, pantsId: option('pantsId', pants).id, bodyTypeId: body.id });
      for (const text of [...main(p), fullBody(p)]) {
        assert.match(text, topType);
        assert.match(text, pantsType);
        for (const fragment of [fullness, tension, indentation, body.en]) assert.ok(text.includes(fragment), fragment);
        assert.doesNotMatch(text, /top length meets|top hem overlaps|top hem tucks|partially concealing/i);
      }
      for (const text of chest(p)) {
        assert.match(text, topType);
        assert.ok(text.includes(fullness));
        assert.doesNotMatch(text, pantsType);
        assert.ok(!text.includes(indentation));
      }
    }
  });
  test(`${pants}: crop hides lower details but preserves locks and full-body wardrobe`, () => {
    for (const framing of ['胸上特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '局部五官特寫']) {
      const topId = option('topId', top).id;
      const pantsId = option('pantsId', pants).id;
      const p = generate({ topId, pantsId, framingId: option('framingId', framing).id });
      assert.equal(p.selection.topId, topId);
      assert.equal(p.selection.pantsId, pantsId);
      assert.ok(fullBody(p).includes(indentation));
      for (const text of main(p)) {
        if (framing === '胸上特寫' || framing === '局部五官特寫') {
          assert.doesNotMatch(text, pantsType);
          assert.ok(!text.includes(indentation));
        } else {
          assert.match(text, pantsType);
          assert.ok(text.includes(tension));
          assert.ok(text.includes(indentation));
        }
        if (framing === '局部五官特寫') assert.ok(!text.includes(fullness));
      }
    }
  });
  test(`${top}: existing colors, pattern and hem-overlap exclusion remain coherent`, () => {
    const p = generate({ topId: option('topId', top).id, pantsId: option('pantsId', pants).id,
      topColorId: option('topColorId', '白色').id, bottomColorId: option('bottomColorId', '黑色').id,
      topPatternId: option('topPatternId', '粗橫條紋').id, topStylingId: 'hem-overlap' });
    for (const text of main(p)) {
      assert.match(text, /white/i);
      assert.match(text, /black/i);
      assert.match(text, /horizontal stripe/i);
      assert.ok(text.includes(fullness));
      assert.doesNotMatch(text, /partially concealing|top length meets/i);
    }
  });
  test(`${top}: Saved Cards and standard prompt imports retain the independent selections`, () => {
    const p = generate({ topId: option('topId', top).id, pantsId: option('pantsId', pants).id });
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(p));
    assert.equal(restored.selection.topId, p.selection.topId);
    assert.equal(restored.selection.pantsId, p.selection.pantsId);
    const regenerated = generate(normalizeLocks(restored.selection));
    for (const text of main(regenerated)) {
      assert.ok(text.includes(fullness));
      assert.ok(text.includes(indentation));
      assert.match(text, topType);
      assert.match(text, pantsType);
    }
    const { locks: imported } = parseLocksFromStandardPrompt(p.grokPrompt, controls);
    assert.equal(imported.topId, p.selection.topId);
    assert.equal(imported.pantsId, p.selection.pantsId);
  });
}

test('duo fit details stay with the selected wearer and respect chest visibility', () => {
  for (const framing of ['全身鏡頭 (Full Body Shot)', '胸上特寫']) {
    const p = generate({ subjectCount: '2', framingId: option('framingId', framing).id,
      topAId: option('topAId', pairs[0][0]).id, pantsAId: option('pantsAId', pairs[0][1]).id,
      topBId: option('topBId', '比基尼上身').id, pantsBId: option('pantsBId', '比基尼下身').id });
    for (const text of main(p)) {
      assert.equal(text.split(fullness).length - 1, 1);
      assert.equal(text.split(indentation).length - 1, framing === '胸上特寫' ? 0 : 1);
    }
  }
});

test('new bottoms preserve the existing reviewed garter-belt allowlist', () => {
  for (const [, pants] of pairs) {
    const p = generate({ pantsId: option('pantsId', pants).id, legwearId: option('legwearId', '膝上蕾絲吊帶襪').id });
    for (const text of main(p)) assert.doesNotMatch(text, /separate lace garter belt worn over the bottoms/i);
  }
});
