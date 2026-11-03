import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import baseline from './framingWardrobePrechangeBaseline.json' with { type: 'json' };
import { SCENE_INTEGRATED_ASSEMBLY_FIXTURES as fixtures } from './sceneIntegratedAssemblyFixtures.js';
import { runLegacySceneFixture } from './sceneIntegratedAssemblyTestSupport.js';

const sha = value => createHash('sha256').update(value).digest('hex');
const section = (text, label) => text.match(new RegExp(`(?:^|\\n\\n)${label}:\\n([\\s\\S]*?)(?=\\n\\n[A-Z][^\\n:]*:\\n|$)`))?.[1] || '';

test('historical scenarios preserve GPT camera, pose, scene and unrelated selections', () => {
  assert.equal(baseline.count, fixtures.length);
  for (const fixture of fixtures) {
    const expected = baseline.cases.find(entry => entry.id === fixture.id);
    assert.ok(expected, fixture.id);
    const result = runLegacySceneFixture(fixture);
    assert.equal(result.inputHash, expected.inputHash, `${fixture.id}: fixture input`);
    const selection = { ...result.selection };
    for (const key of baseline.excludedSelectionKeys[fixture.id] || []) delete selection[key];
    assert.equal(sha(JSON.stringify(selection)), expected.selectionHash, `${fixture.id}: unrelated selections`);
    assert.equal(result.randomDraws, fixture.id === 'R09-half-face' ? 4 : expected.randomDraws, `${fixture.id}: random draws`);
    for (const [label, hash] of Object.entries(expected.gptSections)) {
      assert.equal(sha(section(result.outputs.grokPrompt, label)), hash, `${fixture.id}: ${label}`);
    }
  }
});
