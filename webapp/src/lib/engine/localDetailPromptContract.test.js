import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { LOCAL_DETAIL_PROMPT_CONTRACT as contract } from './localDetailPromptContract.js';
import { LOCAL_DETAIL_PROMPT_FIXTURES as fixtures, LOCAL_DETAIL_PENDING_INTEGRATION_CASES as pending } from './localDetailPromptFixtures.js';
import { PROMPT_OUTPUT_CONTRACTS } from './promptOutputContracts.js';

const database = JSON.parse(fs.readFileSync(new URL('../../data/database.json', import.meta.url), 'utf8'));

test('local-detail contract is immutable and runtime plus PAGE1 consumer projection are connected', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(contract)), contract);
  assert.ok(Object.isFrozen(contract.targets.eyes.allowedGroups));
  assert.equal(contract.runtimeConnected, true);
  assert.equal(contract.consumerConnected, true);
  assert.equal(contract.storageConnected, false);
  assert.ok(!Object.values(PROMPT_OUTPUT_CONTRACTS).some((output) => output.source?.id === contract.outputId));
  assert.deepEqual(contract.supportedSubjectCounts, [1]);
  assert.equal(contract.source.reroll, false);
  assert.equal(contract.source.mutateExistingOutputs, false);
});

test('three local targets omit full-subject requirements and distinguish partial coverage', () => {
  assert.deepEqual(Object.keys(contract.targets), ['eyes', 'collarbone-chest', 'abdomen-navel']);
  assert.equal(contract.defaultTarget, 'eyes');
  assert.equal(contract.coverage.mixedRequiresSubregions, true);
  assert.equal(contract.coverage.noItemIsNotEvidenceOfBareSkin, true);
  assert.equal(contract.coverage.opaqueCoverSuppressesUnderlyingSkinAndPiercing, true);
  assert.equal(contract.coverage.automaticGarmentAlteration, false);
  for (const group of ['location', 'importedWorldScene', 'supineSurface', 'pose', 'ordinaryFraming', 'focalLength']) {
    assert.ok(contract.omittedGroups.includes(group));
  }
  assert.equal(contract.output.parameterTail, false);
  assert.equal(contract.output.multiCut, false);
  assert.equal(contract.output.fixedAspectRatio, null);
  assert.equal(contract.storageTarget.currentCodecPreservesTarget, false);
  assert.ok(contract.storageTarget.requiredReadyEntryFields.includes('target'));
});

for (const fixture of fixtures) {
  test(`local-detail source evidence and expected target policy: ${fixture.id}`, () => {
    const target = contract.targets[fixture.target];
    assert.ok(target);
    for (const ref of fixture.sources) {
      const items = database[ref.domain]?.[ref.category];
      const matches = items?.filter((item) => item.zh === ref.zh) || [];
      assert.equal(matches.length, 1, `${ref.domain}/${ref.category}/${ref.zh}`);
      assert.ok(matches[0].en.includes(ref.excerpt), `stale evidence: ${ref.excerpt}`);
    }
    for (const group of fixture.expected.retain) {
      assert.ok(target.allowedGroups.includes(group), `${group} not allowed in ${fixture.target}`);
      assert.ok(!fixture.expected.omit.includes(group));
    }
    if (fixture.expected.coverage) assert.ok(contract.coverage.states.includes(fixture.expected.coverage));
    if (fixture.expected.region) assert.ok(target.subregions.includes(fixture.expected.region));
    if (fixture.expected.coverage === 'unknown') assert.ok(fixture.expected.needs.length > 0);
  });
}

test('phase-one fixtures cover the three targets and name unimplemented integration gates', () => {
  assert.equal(new Set(fixtures.map((f) => f.id)).size, fixtures.length);
  const tags = new Set(fixtures.flatMap((f) => f.tags));
  for (const tag of ['eyes', 'chest', 'abdomen', 'separates', 'preset', 'dress', 'covered', 'exposed', 'translucent', 'unknown', 'opening', 'outerwear-layering', 'shoulder-wear', 'piercing-occlusion']) {
    assert.ok(tags.has(tag), tag);
  }
  assert.ok(!pending.includes('existing-six-output-byte-identity'));
  assert.ok(pending.includes('saved-card-target-version-text-roundtrip'));
});
