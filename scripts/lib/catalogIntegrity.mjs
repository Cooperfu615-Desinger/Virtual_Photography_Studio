import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { isDeepStrictEqual } from 'node:util';
import { execFileSync } from 'node:child_process';
import { validateLegacyReferences } from './catalogLegacy.mjs';

export function controlIssues(controls) {
  const issues = [];
  for (const control of controls) {
    const owners = new Map(), primary = new Set();
    for (const option of control.options || []) {
      if (!option.id || primary.has(option.id)) issues.push({ code: 'DUPLICATE_ID_IN_CONTROL', itemKey: `${control.key}:${option.id}`, message: 'Missing or repeated primary ID', evidence: [] });
      primary.add(option.id);
      for (const token of new Set([option.id, ...(option.legacyIds || [])])) {
        if (!owners.has(token)) owners.set(token, []);
        owners.get(token).push(option.id);
      }
    }
    for (const [token, ids] of owners) if (new Set(ids).size > 1) issues.push({
      code: primary.has(token) ? 'LEGACY_ID_SHADOWED' : 'LEGACY_ID_AMBIGUOUS', itemKey: `${control.key}:${token}`,
      message: 'Token has multiple owners in this control', evidence: ids,
    });
  }
  return issues;
}

export function applyAllowlist(issues, allowlist) {
  if (!Array.isArray(allowlist)) throw new Error('allowlist must be an array');
  const known = new Set(), allowed = new Set(), stale = [];
  for (const entry of allowlist) {
    if (Object.keys(entry).some(k => !['code', 'itemKey', 'reason', 'decisionRef'].includes(k)) ||
        ['code', 'itemKey', 'reason', 'decisionRef'].some(k => typeof entry[k] !== 'string' || !entry[k].trim())) throw new Error('invalid allowlist entry');
    const key = `${entry.code}\0${entry.itemKey}`;
    if (known.has(key)) throw new Error(`duplicate allowlist entry ${entry.itemKey}`);
    known.add(key);
    if (issues.some(i => `${i.code}\0${i.itemKey}` === key)) allowed.add(key); else stale.push(entry);
  }
  return { allowed: issues.filter(i => allowed.has(`${i.code}\0${i.itemKey}`)),
    blocking: issues.filter(i => !allowed.has(`${i.code}\0${i.itemKey}`)), stale };
}

export function validateActions(actions, { bases, orientations, legacyCards }) {
  const failures = [];
  const bad = (a, field) => failures.push({ code: 'ACTION_REFERENCE', itemKey: `${a.id}:${field}`, message: `Invalid action ${field}`, evidence: [] });
  for (const a of actions) {
    if (!bases.has(a.baseId)) bad(a, 'baseId');
    if (!orientations.has(a.orientationId)) bad(a, 'orientationId');
    if (![...bases, 'free'].includes(a.family)) bad(a, 'family');
    if (!['accepted', 'pending', 'rejected'].includes(a.validation?.status)) bad(a, 'validation');
    if (!['free', 'fixed'].includes(a.hands?.mode)) bad(a, 'hands');
    if (!['ground', 'bed', 'none'].includes(a.scene?.support)) bad(a, 'support');
    if (a.legacyCardId && !legacyCards.has(a.legacyCardId)) bad(a, 'legacyCardId');
    if (!a.clauses?.length || a.clauses.some(c => !['core', 'upper', 'lower', 'support'].includes(c.region) || typeof c.join !== 'string' || typeof c.en !== 'string' || !c.en.trim())) bad(a, 'clauses');
    else if (a.en !== a.clauses.map((c, i) => (i ? c.join : '') + c.en).join('') + '.') bad(a, 'clause-output');
  }
  return failures;
}

export function checkFieldMapping(database, entries, responsibility) {
  const issues = [], coverage = new Map();
  const groups = { Regional: 'regional', Wardrobe: 'wardrobe', CameraLighting: 'camera', Locations: 'locations', Character: 'character', Negative: 'negative' };
  const fail = (id, key, actual, expected) => issues.push({ code: 'FIELD_MAPPING', itemKey: `${id}:${key}`, message: `Compiled field differs at ${key}`, evidence: [JSON.stringify({ actual, expected })] });
  const clean = s => String(s).replace(/[`*]/g, '').replace(/\s+/g, ' ').trim();
  for (const [section, categories] of Object.entries(database)) for (const [category, rows] of Object.entries(categories)) {
    const compiled = entries[groups[section]]?.[category];
    if (compiled?.length !== rows.length) { fail(`${section}/${category}`, 'length', compiled?.length, rows.length); continue; }
    rows.forEach((row, index) => {
      const out = compiled[index];
      for (const [key, value] of Object.entries(row)) {
        const mapping = responsibility.fields[key];
        if (!mapping) { fail(out.id, key, value, 'declared source field'); continue; }
        coverage.set(key, (coverage.get(key) || 0) + 1);
        let actual, expected = value;
        if (key === 'zh') continue; // display formatting is separately sealed by A snapshots
        if (key === 'en' || key === 'desc') { actual = out[key]; expected = clean(value); }
        else if (key === 'stableId') actual = out.id;
        else if (key === 'legacyIds') { actual = out.legacyIds; }
        else if (key === 'meta') { for (const [k, v] of Object.entries(value)) {
          if (k === 'semantic') {
            if (JSON.stringify(out.inferredMeta) !== JSON.stringify(v)) fail(out.id, 'meta.semantic', out.inferredMeta, v);
            if (Object.hasOwn(out.meta, 'semantic')) fail(out.id, 'meta.semantic.leak', out.meta.semantic, 'absent');
            for (const [semanticKey, semanticValue] of Object.entries(v)) {
              if (semanticKey === 'tags' || Object.hasOwn(value, semanticKey) || Object.hasOwn(row, semanticKey)) continue;
              if (!isDeepStrictEqual(out.meta[semanticKey], semanticValue)) fail(out.id, `meta.semantic.${semanticKey}`, out.meta[semanticKey], semanticValue);
            }
            const subjectTags = section === 'CameraLighting' && category === '光線表現 (Light Style)' ? row.subjectLight?.tags || [] : [];
            const expectedTags = [...new Set([...(v.tags || []), ...(value.tags || []), ...subjectTags].filter(Boolean).map(String))];
            if (!isDeepStrictEqual(out.meta.tags, expectedTags)) fail(out.id, 'meta.tags.order', out.meta.tags, expectedTags);
          }
          else if (k === 'tags') { if (v.some(t => !out.meta.tags.includes(t))) fail(out.id, 'meta.tags', out.meta.tags, v); }
          else if (!isDeepStrictEqual(out.meta[k], v)) fail(out.id, `meta.${k}`, out.meta[k], v);
        } continue; }
        else { actual = mapping.runtime.startsWith('meta.') ? out.meta[mapping.runtime.slice(5)] : out[mapping.runtime]; }
        if (!isDeepStrictEqual(actual, expected)) fail(out.id, key, actual, expected);
      }
    });
  }
  return { issues, coverage: Object.fromEntries(coverage) };
}

export function validatePoseMetadata(option, { bases, orientations, arrangements, hands, buckets, modes }) {
  const errors = [], meta = option.meta || {};
  const bad = field => errors.push({ code: 'POSE_META_REF', itemKey: `${option.id}:${field}`, message: 'Invalid metadata reference', evidence: [] });
  for (const key of ['supineEnvironmentByOrientation', 'supineSurfacePhraseByOrientation']) for (const id of Object.keys(meta[key] || {})) if (!orientations.has(id)) bad(key+':'+id);
  for (const [base, ids] of Object.entries(meta.randomEligibleForArrangements || {})) {
    if (!bases.has(base) || !Array.isArray(ids)) { bad('randomEligibleForArrangements:'+base); continue; }
    for (const id of ids) if (!arrangements.has(id)) bad('arrangement:'+id);
  }
  const projection = (map, path) => { for (const [bucket, value] of Object.entries(map || {})) {
    if (!buckets.has(bucket) || !modes.has(typeof value === 'string' ? value : value?.mode) || (value && typeof value === 'object' && 'en' in value && typeof value.en !== 'string')) bad(path+':'+bucket);
  } };
  projection(meta.projectionByBucket, 'projection');
  for (const bucket of meta.visibleBuckets || []) if (!buckets.has(bucket)) bad('visibleBuckets:'+bucket);
  for (const [id, v] of Object.entries(meta.supportVariants || {})) {
    if (!hands.has(id)) bad('supportVariants:'+id);
    projection(v.projectionByBucket, 'supportVariants:'+id);
  }
  if (meta.requiresSceneType && !['indoor', 'outdoor'].includes(meta.requiresSceneType)) bad('requiresSceneType');
  if (meta.requiresWardrobeRole && !['upperGarment', 'outerwear', 'bottom', 'pants', 'eyewear'].includes(meta.requiresWardrobeRole)) bad('requiresWardrobeRole');
  if ('supportSurface' in meta && !['ground', 'bed', ''].includes(meta.supportSurface)) bad('supportSurface');
  return errors;
}

export function checkDeclaredPaths(database, responsibility) {
  const issues = [], observed = new Set();
  const walk = (value, path, category) => {
    observed.add(path);
    if (!responsibility.paths?.[path]?.categories.includes(category)) issues.push({ code: 'FIELD_PATH', itemKey: `${category}:${path}`, message: 'Undeclared source path/category', evidence: [] });
    if (Array.isArray(value)) value.forEach(v => walk(v, path+'[]', category));
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, path+'.'+k, category);
  };
  for (const [s, cs] of Object.entries(database)) for (const [c, rows] of Object.entries(cs)) for (const row of rows) for (const [k, v] of Object.entries(row)) walk(v, k, `${s}/${c}`);
  return { issues, observedPaths: observed.size };
}

export async function extendedChecks(repo, controls, parseFile) {
  const load = p => import(pathToFileURL(join(repo, p)).href);
  const read = p => JSON.parse(readFileSync(join(repo, p), 'utf8'));
  const errors = [], require = createRequire(join(repo, 'webapp/package.json'));
  const espree = require('espree');
  const astValue = (file, name) => {
    const ast = espree.parse(readFileSync(join(repo, file), 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' });
    for (const stmt of ast.body) for (const d of (stmt.declaration || stmt).declarations || []) if (d.id.name === name) {
      let node = d.init;
      if (node.type === 'CallExpression' && node.callee?.property?.name === 'freeze') node = node.arguments[0];
      if (node.type === 'ArrayExpression') return node.elements.map(n => n.value);
      if (node.type === 'ObjectExpression') return node.properties.map(n => n.key.value || n.key.name);
    }
    throw new Error(`required static table missing ${file}:${name}`);
  };
  const add = (code, itemKey, message, evidence = []) => errors.push({ code, itemKey, message, evidence });
  const { CHARACTER_PROFILE_OPTIONS } = await load('webapp/src/lib/engine/characterProfiles.js');
  const profiles = CHARACTER_PROFILE_OPTIONS.filter(x => x.id !== 'none');
  const sets = {
    profiles: profiles.map(x => x.id),
    lab: astValue('webapp/src/lib/characterCardLab.js', 'CHARACTER_CARD_EXTENSIONS'),
    names: Object.keys((await load('webapp/src/lib/engine/midjourneyCardItemNames.js')).MIDJOURNEY_CARD_ITEM_NAMES),
    manifest: read('knowledge_base/character_reference_manifest.json').items.map(x => x.id),
    order: astValue('webapp/src/lib/engine.js', 'CHARACTER_PROFILE_CONTROL_ORDER'),
  };
  for (const [name, ids] of Object.entries(sets)) if (new Set(ids).size !== ids.length || !isDeepStrictEqual([...ids].sort(), [...sets.profiles].sort())) add('CHARACTER_ID_SET', name, 'Five character ID sets must match', ids);
  for (const p of profiles) {
    for (const field of ['identityAndBody', 'legacyIdentityAndBody', 'facialGeometry', 'eyeSignature', 'noseSignature', 'mouthSignature', 'skinSignature', 'makeup', 'body', 'distinctiveFeatures']) {
      if (typeof p.profile?.[field] !== 'string' || !p.profile[field].trim()) add('CHARACTER_FIELD', `${p.id}:${field}`, 'Required structured identity field missing');
    }
    if (p.profile?.distinctiveFeatures?.split(',').map(s => s.trim()).filter(Boolean).length !== 4) add('CHARACTER_ANCHORS', p.id, 'Exactly four permanent identity anchors required');
  }
  const pose = await load('webapp/src/lib/engine/poseComposerOptions.js');
  const bases = new Set(pose.POSE_COMPOSER_BASE_OPTIONS.map(x => x.id)), orientations = new Set(pose.POSE_COMPOSER_ORIENTATION_OPTIONS.map(x => x.id));
  const hands = new Set(pose.POSE_COMPOSER_HAND_OPTIONS.map(x => x.id)), props = new Set(pose.POSE_COMPOSER_PROP_OPTIONS.map(x => x.id)), heads = new Set(pose.POSE_COMPOSER_HEAD_OPTIONS.map(x => x.id));
  const metadataContext = { bases, orientations, hands, arrangements: new Set(pose.POSE_COMPOSER_ARRANGEMENT_OPTIONS.map(x => x.id)),
    buckets: new Set(Object.values((await load('webapp/src/lib/engine/compositionVisibilityContract.js')).COMPOSITION_VISIBILITY_BUCKETS)),
    modes: new Set(Object.values((await load('webapp/src/lib/engine/poseComposerProjection.js')).POSE_COMPOSER_PROJECTION_MODES)) };
  for (const [namespace, options] of Object.entries(pose)) if (Array.isArray(options)) {
    errors.push(...controlIssues([{ key: namespace, options }]));
    for (const o of options) {
      errors.push(...validatePoseMetadata(o, metadataContext));
      for (const id of [o.base, ...(o.bases || []), ...(o.meta?.hiddenForBases || []), ...Object.keys(o.phraseByBase || {}), ...Object.keys(o.meta?.randomEligibleForBases || {})].filter(Boolean)) if (!bases.has(id)) add('POSE_BASE_REF', `${o.id}:${id}`, 'Missing pose base');
      for (const id of [...(o.meta?.hiddenForOrientations || []), ...Object.keys(o.phraseByOrientation || {}), ...Object.keys(o.meta?.randomEligibleForOrientations || {})]) if (!orientations.has(id)) add('POSE_ORIENTATION_REF', `${o.id}:${id}`, 'Missing pose orientation');
    }
  }
  const actionModule = await load('webapp/src/lib/engine/specifiedActions.js');
  const cards = await load('webapp/src/data/actionPoseCards.js');
  const legacyCards = new Set(Object.values(cards).filter(Array.isArray).flat().map(x => x.id));
  errors.push(...controlIssues([{ key: 'specifiedActions', options: actionModule.SPECIFIED_ACTION_CONCRETE_OPTIONS }]));
  errors.push(...validateActions(actionModule.SPECIFIED_ACTION_CONCRETE_OPTIONS, { bases, orientations, legacyCards }));
  for (const action of actionModule.SPECIFIED_ACTION_CONCRETE_OPTIONS) errors.push(...validatePoseMetadata(action, metadataContext));
  const gaze = await load('webapp/src/lib/engine/gazeGesture.js');
  for (const g of gaze.GAZE_OPTIONS) for (const orientationId of orientations) {
    const id = gaze.gazeHeadId(g.id, { orientationId });
    if (id && !heads.has(id)) add('GAZE_HEAD_REF', `${g.id}:${orientationId}`, 'Missing head option', [id]);
  }
  for (const c of gaze.CAPTURE_STYLE_OPTIONS) {
    if (c.hand && !hands.has(c.hand)) add('CAPTURE_HAND_REF', c.id, 'Missing capture hand', [c.hand]);
    if (c.prop && !props.has(c.prop)) add('CAPTURE_PROP_REF', c.id, 'Missing capture prop', [c.prop]);
  }
  for (const file of ['duoOptions.js', 'fixedCompositionOptions.js']) {
    const mod = await load('webapp/src/lib/engine/'+file);
    for (const [namespace, options] of Object.entries(mod)) if (Array.isArray(options) && options.every(o => o && typeof o === 'object' && 'id' in o)) errors.push(...controlIssues([{ key: namespace, options }]).filter(i => i.code !== 'LEGACY_ID_AMBIGUOUS')); // final control preserves J12 namespace
  }
  const engine = await load('webapp/src/lib/engine.js');
  const compiled = engine.getCompiledCatalogForTesting();
  const catalogRows = Object.values(compiled.catalog).flatMap(c => Object.values(c).flat());
  const byId = new Map(catalogRows.map(x => [x.id, x]));
  const overlayFiles = readdirSync(join(repo, 'webapp/src/lib/engine')).filter(f => /(?:Descriptions|Priority|ItemNames)\.js$/.test(f));
  for (const file of overlayFiles) {
    parseFile(join(repo, 'webapp/src/lib/engine', file)); // parse failure is fatal, not possible
    for (const [name, value] of Object.entries(await load('webapp/src/lib/engine/'+file))) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      for (const [id, rule] of Object.entries(value)) {
        if (!/^(wardrobe|camera|locations|character|regional|negative):/.test(id)) continue;
        const row = byId.get(id);
        if (!row) { add('OVERLAY_KEY', `${name}:${id}`, 'Missing catalog key'); continue; }
        if (rule && typeof rule === 'object' && typeof rule.source === 'string' && rule.source !== row.en) add('OVERLAY_PIN', `${name}:${id}`, 'Source pin differs from current English');
        if (rule && typeof rule === 'object' && rule.zh && rule.zh !== row.zh) add('OVERLAY_PIN', `${name}:${id}:zh`, 'Source pin differs from current label');
        if (Array.isArray(rule?.preferred)) for (const part of rule.preferred) if (part.source && !row.en.includes(part.source)) add('OVERLAY_PIN', `${name}:${id}:${part.source}`, 'Pinned source fragment missing');
      }
    }
  }
  const fixed = await load('webapp/src/lib/engine/fixedCompositionOptions.js');
  const setIds = new Set(fixed.FIXED_COMPOSITION_SET_OPTIONS.map(x => x.id));
  const setGroups = new Set(fixed.FIXED_COMPOSITION_SET_OPTIONS.map(x => x.setGroupId).filter(Boolean));
  const ratios = new Set(controls.find(c => c.key === 'aspectRatio')?.options.map(x => x.id) || []);
  for (const options of Object.values(fixed)) if (Array.isArray(options)) for (const o of options) {
    if (o.setId && !setIds.has(o.setId)) add('FIXED_SET_REF', o.id, 'Missing fixed set', [o.setId]);
    if (o.setGroupId && !setGroups.has(o.setGroupId)) add('FIXED_GROUP_REF', o.id, 'Missing set group', [o.setGroupId]);
    if (o.baseId && !bases.has(o.baseId)) add('FIXED_BASE_REF', o.id, 'Missing base', [o.baseId]);
    if (o.aspectRatioId && !ratios.has(o.aspectRatioId)) add('FIXED_RATIO_REF', o.id, 'Missing ratio', [o.aspectRatioId]);
  }
  const scopes = new Set(['general', 'standing', 'sitting', 'kneeling', 'squatting', 'lying', 'lying-side', 'lying-prone', 'lying-supine']);
  for (const g of gaze.GESTURE_OPTIONS) for (const scope of [g.scope, ...(g.meta?.alsoScopes || [])].filter(Boolean)) if (!scopes.has(scope)) add('GESTURE_SCOPE', g.id, 'Missing gesture scope', [scope]);
  const schemaResult = JSON.parse(execFileSync('python3', ['-B', join(repo, 'scripts/sync_to_json.py'), '--check', '--report-json'], { encoding: 'utf8', maxBuffer: 8*1024*1024 }));
  const mapping = checkFieldMapping(read('webapp/src/data/database.json'), compiled.entries, read('knowledge_base/catalog/field_mapping.json'));
  const paths = checkDeclaredPaths(read('webapp/src/data/database.json'), read('knowledge_base/catalog/field_mapping.json'));
  const legacy = await validateLegacyReferences(repo, read('knowledge_base/catalog/legacy_mappings.json'), engine);
  errors.push(...mapping.issues, ...paths.issues, ...legacy.issues);
  return { issues: errors, characterSets: Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, v.length])), fieldCoverage: mapping.coverage, observedPaths: paths.observedPaths, schemaResult, overlayFiles, legacy };
}
