import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { preFramingWardrobeSource, preparePreFramingWardrobeFiles } from '../../../../scripts/lib/framingWardrobeIntegrationReplay.mjs';
import review from '../../../../scripts/lib/framingWardrobeIntegrationPatches.json' with { type: 'json' };
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { FIXED_FRAMING_MAIN_OPTION_POLICY } from './fixedFramingDerivedPromptContract.js';
const root = new URL('../../../../', import.meta.url);
const sha = value => createHash('sha256').update(value).digest('hex');
const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const noSelections = () => {
  const locks = createEmptyLocks();
  for (const control of controls) {
    const none = control.options.find(o => o.zh === '全無' || o.id === 'none');
    if (none) locks[control.key] = none.id;
  }
  return { ...locks, subjectCount: '1' };
};
const texts = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.nanoBananaPrompt, ...p.extraPrompts.map(e => e.text)];

test('integration replay restores exact reviewed main source without replacing frozen baselines', () => {
  for (const item of review.files) {
    const current = readFileSync(new URL(item.path, root));
    assert.equal(sha(current), item.afterHash, item.path + ': current integration source must be reviewed');
    const before = preFramingWardrobeSource(item.path, current);
    assert.equal(sha(before), item.beforeHash, item.path);
    assert.deepEqual(preFramingWardrobeSource(item.path, before), before);
  }
});
test('integration replay rejects changed engine and refuses to write a Git checkout', () => {
  const engine = readFileSync(new URL('webapp/src/lib/engine.js', root), 'utf8');
  assert.throws(() => preFramingWardrobeSource('webapp/src/lib/engine.js', engine + '\n// unreviewed change\n'), /unknown current engine/);
  assert.throws(() => preparePreFramingWardrobeFiles(fileURLToPath(root)), /isolated copy/);
});
test('each explicit wardrobe none stays silent across six current crops and all six outputs', () => {
  const chosen = { topId: option('topId', '棉質細肩背心'), pantsId: option('pantsId', '直筒牛仔褲'), legwearId: option('legwearId', '羅紋短襪'), shoesId: option('shoesId', '尖頭細跟高跟鞋') };
  const terms = { topId: /camisole/i, pantsId: /jeans/i, legwearId: /socks/i, shoesId: /stiletto|heels/i };
  for (const framing of FIXED_FRAMING_MAIN_OPTION_POLICY.visible.filter(x => x.randomCandidate)) {
    for (const key of Object.keys(chosen)) {
      const locks = { ...noSelections(), ...chosen, framingId: framing.id, [key]: noSelections()[key] };
      const [prompt] = generatePrompts(1, locks, [], { random: createSeededRandom('framing-integration-none') });
      for (const text of texts(prompt)) {
        assert.doesNotMatch(text, terms[key], framing.zh + '/' + key);
        for (const other of Object.keys(terms).filter(k => k !== key)) assert.match(text, terms[other]);
        assert.doesNotMatch(text, /barefoot|nude|naked|retainResolved|\[object Object\]/i);
      }
    }
  }
});
