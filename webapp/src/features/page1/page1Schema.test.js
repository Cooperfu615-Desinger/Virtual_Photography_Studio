import assert from 'node:assert/strict';
import test from 'node:test';

import { SECTION_SUBPANELS, WORKSPACE_SECTIONS, getSectionKeys } from './page1Schema.js';

test('PAGE1 workspace schema defines every navigation section and unique panel ids', () => {
  assert.deepEqual(WORKSPACE_SECTIONS.map((section) => section.id), [
    'character',
    'pose',
    'wardrobe',
    'scene',
    'photography',
  ]);

  WORKSPACE_SECTIONS.forEach(({ id }) => {
    const panelIds = SECTION_SUBPANELS[id].map((panel) => panel.id);
    assert.ok(panelIds.length > 0);
    assert.equal(new Set(panelIds).size, panelIds.length);
    assert.ok(getSectionKeys(id).length > 0);
  });
});
