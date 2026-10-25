// ID ownership is scoped by the actual migration input control, not by string alone.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const FAMILY = key => [key + 'Id', key + 'AId', key + 'BId'];
const SEALED = {
  'webapp/src/lib/engine/legacyMappings.baseline.json': '27418a72920655416cdbe38b50ee89f97388e6e261dc2f512d4ac237fe937a6c',
  'webapp/src/lib/engine/catalogSnapshot.controls.json': '0e60f11dd9c09f944c50ddd0efe6d7d4d8c4df848ebc5e72249bac8e6e918826',
};
function readSealed(root, file) {
  const raw = readFileSync(join(root, file));
  assert.equal(createHash('sha256').update(raw).digest('hex'), SEALED[file], 'Historical ownership seal changed: ' + file);
  return JSON.parse(raw);
}

export function migrationIdentityIssues(root, document, snapshot, compiled, controls, optionTables) {
  const reviewed = readSealed(root, 'webapp/src/lib/engine/legacyMappings.baseline.json').snapshot;
  const oldControls = readSealed(root, 'webapp/src/lib/engine/catalogSnapshot.controls.json');
  const primary = new Set(Object.values(compiled.entries).flatMap(cs => Object.values(cs).flat()).map(o => o.id));
  const byControl = new Map(controls.map(c => [c.key, c.options]));
  const issues = [], coverage = {}, checked = new Set();
  let checkedIds = 0, preservedOwners = 0;
  const issue = (code, itemKey, message) => issues.push({ code, itemKey, message, evidence: [] });
  const options = key => {
    assert(byControl.has(key), 'Missing migration source control: ' + key);
    return byControl.get(key);
  };
  const target = (key, zh) => options(key).find(o => o.zh === zh)?.id;
  const record = (name, index, row, ids, keys, own = []) => {
    const baselineRows = reviewed.tables[name];
    // Exact pre-E row + pre-move source control owner, never candidate-derived approval.
    const unchanged = Array.isArray(baselineRows)
      ? baselineRows.some(old => isDeepStrictEqual(old, row))
      : Object.entries(baselineRows).some(old => isDeepStrictEqual(old, row));
    let historicalIds = row.legacyIds || [row.legacyId || row.arrangementId].filter(Boolean);
    if (['CAMERA_PROFILE_RENDERING_MIGRATIONS', 'LEGACY_POSE_HAND_TO_PROP_ID'].includes(name)) historicalIds = [row[0]];
    if (name === 'LEGACY_HAIR_STYLING_STATE_MIGRATIONS') {
      const oldIndex = baselineRows.findIndex(old => isDeepStrictEqual(old, row));
      const start = baselineRows.slice(0, oldIndex).reduce((n, old) => n + old.legacy.length, 0);
      historicalIds = oldIndex < 0 ? [] : reviewed.hairLegacyIds.slice(start, start + row.legacy.length);
    }
    for (const id of ids) {
      assert.equal(typeof id, 'string', 'Missing computed legacy ID: ' + name);
      const allowed = new Set(own.filter(Boolean));
      for (const key of keys) {
        const current = options(key).find(o => o.id === id);
        if (current && unchanged && historicalIds.includes(id) && oldControls[key]?.some(o => o.id === id)) {
          allowed.add(id);
          preservedOwners++;
        }
      }
      const fail = namespace => {
        const itemKey = `${name}[${index}]:${namespace}:${id}`;
        if (!checked.has(itemKey)) {
          checked.add(itemKey);
          issue('LEGACY_CURRENT_ID_COLLISION', itemKey, 'Legacy input shadows another current item in ' + namespace);
        }
      };
      if (primary.has(id) && !allowed.has(id)) fail('catalog');
      for (const key of keys) if (options(key).some(o => o.id === id) && !allowed.has(id)) fail(key);
      checkedIds++;
    }
  };
  for (const [name, table] of Object.entries(document.tables)) {
    if (optionTables.includes(name)) { coverage[name] = 'option-alias: actual helper IDs and target ownership'; continue; }
    if (['WARDROBE_LEGACY_PROMPT_ALIASES', 'LOCATION_LEGACY_PROMPT_ALIASES'].includes(name)) {
      coverage[name] = 'prompt-text: no ID derivation; duplicate keys and target references checked';
      continue;
    }
    const rows = snapshot.tables[name];
    assert(rows, 'Missing computed migration table: ' + name);
    const rawRows = Array.isArray(rows) ? rows.map(row => {
      if (Array.isArray(row)) return row;
      const { legacyId, legacyIds, ...source } = row;
      return source;
    }) : rows;
    if (!isDeepStrictEqual(rawRows, table.source)) {
      issue('LEGACY_SNAPSHOT_SOURCE', name, 'Computed table does not correspond to source; sync before validating');
    }
    coverage[name] = 'migration-input: current catalog and source control ownership';
    if (name === 'CAMERA_PROFILE_RENDERING_MIGRATIONS') {
      Object.entries(rows).forEach(([id, zh], i) => record(name, i, [id, zh], [id], ['filmId', 'cameraSystemId'], [target('filmId', zh)]));
    } else if (name === 'LEGACY_POSE_HAND_TO_PROP_ID') {
      rows.forEach((row, i) => record(name, i, row, [row[0]], ['poseHandId']));
    } else if (name === 'CHARACTER_EXPRESSION_POSE_LEGACY_SOCIAL_POSE_MIGRATIONS') {
      rows.forEach((row, i) => record(name, i, row, [row.legacyId], ['poseId']));
    } else if (name === 'CHARACTER_LEGACY_SELFIE_SPECIAL_ACTION_MIGRATIONS') {
      rows.forEach((row, i) => {
        record(name, i, row, [row.legacyId], ['specialActionId']);
        // Runtime also accepts IDs containing the old label, not only the derived ID.
        const matches = options('specialActionId').filter(o => o.id.includes(row.label));
        record(name, `${i}:label`, row, matches.map(o => o.id), ['specialActionId']);
      });
    } else if (['CHARACTER_SPECIAL_ACTION_TO_POSE_COMPOSER_MIGRATIONS', 'CHARACTER_POSE_TO_POSE_COMPOSER_MIGRATIONS'].includes(name)) {
      const key = name.includes('SPECIAL_ACTION') ? 'specialActionId' : 'poseId';
      rows.forEach((row, i) => {
        // These migrations use resolved option.zh, so its existing primary/aliases are the inputs.
        const owner = options(key).find(o => o.zh === row.label);
        if (!owner) issue('LEGACY_SOURCE', `${name}[${i}].label`, 'Missing resolved source option: ' + row.label);
        else record(name, i, row, [owner.id, ...(owner.legacyIds || [])], [key], [owner.id]);
      });
      coverage[name] = 'resolved-label: current source owner primary/aliases, then cross-field migration';
    } else if (name === 'POSE_COMPOSER_ARRANGEMENT_TO_ANCHOR_MIGRATIONS') {
      rows.forEach((row, i) => record(name, i, row, [row.arrangementId], ['poseArrangementId'], [target('poseArrangementId', row.arrangementZh)]));
    } else if (name === 'WARDROBE_OUTFIT_TO_DRESS_LEGACY_LOCK_MIGRATIONS') {
      rows.forEach((row, i) => record(name, i, row, row.legacyIds, FAMILY('outfitPreset')));
    } else if (name === 'LEGACY_EYEWEAR_LOCK_MIGRATIONS') {
      const keys = FAMILY('eyewear');
      rows.forEach((row, i) => record(name, i, row, row.legacyIds, keys, keys.map(key => target(key, row.frameZh))));
    } else if (name === 'LEGACY_OUTERWEAR_OPENING_LOCK_MIGRATIONS') {
      rows.forEach((row, i) => record(name, i, row, row.legacyIds, FAMILY('outerwear')));
    } else if (name === 'LEGACY_HAIR_STYLING_STATE_MIGRATIONS') {
      // The real engine helper's flattened output is captured at call time, not recomputed here.
      assert.equal(snapshot.hairLegacyIds.length, rows.reduce((n, row) => n + row.legacy.length, 0));
      let offset = 0;
      rows.forEach((row, i) => {
        record(name, i, row, snapshot.hairLegacyIds.slice(offset, offset + row.legacy.length), FAMILY('hairstyle'));
        offset += row.legacy.length;
      });
    } else throw new Error('Undeclared legacy ID ownership policy: ' + name);
  }
  return { issues, coverage, checkedIds, preservedOwners };
}
