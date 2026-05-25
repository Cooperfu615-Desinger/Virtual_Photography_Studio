# Character Identity Base Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean PAGE1 A `身份基底` into a stable Japanese/Korean adult female character DNA layer with clearer body, face, hairstyle, and hair-color choices.

**Architecture:** Keep the existing PAGE1 UI and engine data flow. Update the source markdown dictionary, sync it to `database.json`, and add engine-level compatibility aliases so old saved locks for renamed or merged options normalize to the new choices. Add focused engine tests for option exposure, subject-count wording, prompt output, and legacy lock migration.

**Tech Stack:** Markdown knowledge base, Python sync script, JavaScript prompt engine, Node.js test runner, Vite/React webapp.

---

### Task 1: Add Identity Base Regression Tests

**Files:**
- Create: `webapp/src/lib/engineCharacterIdentityBase.test.js`

- [x] **Step 1: Add tests for the approved option lists**

Create a Node test file that imports `createEmptyLocks`, `generatePrompts`, `getLockControls`, and `normalizeLocks`. Add helpers:

```js
const controlOptions = (key) => getLockControls().find((control) => control.key === key).options;
const optionLabels = (key) => controlOptions(key).map((option) => option.zh);
const optionByLabel = (key, label) => controlOptions(key).find((option) => option.zh === label);
```

Test that:

- `bodyTypeId` exposes exactly `高挑時裝模特`, `優雅曲線模特`, `柔和沙漏身形`, `性感曲線身形`, `運動緊實身形`, `小隻精緻身形`.
- `facialFeaturesId` exposes `全無` plus `韓系偶像臉`, `日系清透臉`, `甜美可愛臉`, `冷感高級臉`, `成熟性感臉`, `混血立體臉`.
- `hairstyleId` exposes the approved reduced hairstyle list and does not expose `短髮｜精靈短髮` or `長髮（放髮）｜姬髮式長直髮`.
- `hairColorId` exposes the approved reduced hair-color list and does not expose `亮綠色`, `亮黃色`, `亮紫色`, `銅紅髮`, `霧感橄欖棕`, or `霧灰棕`.

- [x] **Step 2: Add tests for subject wording and generated prompt output**

Generate one prompt with these locks:

```js
{
  ...createEmptyLocks(),
  bodyTypeId: optionByLabel('bodyTypeId', '性感曲線身形').id,
  facialFeaturesId: optionByLabel('facialFeaturesId', '成熟性感臉').id,
  hairstyleId: optionByLabel('hairstyleId', '柔波：深側分').id,
  hairColorId: optionByLabel('hairColorId', '亮桃粉').id,
}
```

Assert that the combined prompt text:

- Contains `adult Japanese or Korean female portrait subject`.
- Does not contain the old subject-count phrase `seductive stunning & beautiful`.
- Contains the selected body, face, hairstyle, and hair-color prompt language.

- [x] **Step 3: Add tests for legacy lock migration**

Use `normalizeLocks()` to assert that old option ids map to new targets:

```js
normalizeLocks({ ...createEmptyLocks(), hairstyleId: 'character:髮型-hairstyle:短髮-齊耳法式短鮑伯:3' }).hairstyleId
```

should equal the new `乾淨短鮑伯` option id.

Include at least these mappings:

- `character:髮型-hairstyle:短髮-齊耳法式短鮑伯:3` -> `乾淨短鮑伯`
- `character:髮型-hairstyle:長髮-放髮-姬髮式長直髮:17` -> `直髮：日式瀏海`
- `character:髮型-hairstyle:長髮-綁髮-高級感低盤髮:26` -> `低包頭盤髮`
- `character:髮色-hair-color:亮紫色:16` -> `亮桃粉`
- `character:體態-body-type:模特兒:0` -> `高挑時裝模特`
- `character:五官特徵-facial-features:kpop:1` -> `韓系偶像臉`

- [x] **Step 4: Run the new test and confirm it fails before implementation**

Run:

```bash
cd webapp
node --test src/lib/engineCharacterIdentityBase.test.js
```

Expected before implementation: failures for missing/old option labels and old subject-count wording.

### Task 2: Update Character Identity Dictionary

**Files:**
- Modify: `knowledge_base/character_design.md`
- Modify by sync: `webapp/src/data/database.json`

- [x] **Step 1: Replace identity-base markdown rows**

In `knowledge_base/character_design.md`, replace only these categories:

- `五官特徵 (Facial Features)`
- `體態 (Body Type)`
- `髮型 (Hairstyle)`
- `髮色 (Hair Color)`

Keep `膚質特徵 (Skin Details)` unchanged except for surrounding placement. Do not edit `神情與眼神`, `姿勢與肢體語言`, or `特殊動作`.

Use the approved option names and concise prompt descriptions from the spec.

- [x] **Step 2: Sync markdown to JSON**

Run:

```bash
python3 scripts/sync_to_json.py
```

Expected: sync completes and `webapp/src/data/database.json` updates only from the markdown source.

### Task 3: Implement Engine Compatibility

**Files:**
- Modify: `webapp/src/lib/engine.js`

- [x] **Step 1: Update subject-count prompts**

Change `SUBJECT_COUNT_OPTIONS` to:

```js
{ id: '1', zh: '1 位', en: 'one adult Japanese or Korean female portrait subject', count: 1 }
{ id: '2', zh: '2 位', en: 'two adult Japanese or Korean female portrait subjects', count: 2 }
```

Keep the reference option identity-preservation wording.

- [x] **Step 2: Add legacy identity option aliases**

Add a small compatibility table and helper near `buildEntries()`:

```js
const CHARACTER_IDENTITY_LEGACY_OPTION_MAP = [
  {
    category: '體態 (Body Type)',
    targetZh: '高挑時裝模特',
    legacy: [['模特兒', 0]],
  },
  // Additional body, facial, hairstyle, and hair-color mappings.
];

function applyCharacterIdentityLegacyOptionIds(catalog) {
  CHARACTER_IDENTITY_LEGACY_OPTION_MAP.forEach(({ category, targetZh, legacy }) => {
    const target = getByKey(catalog.character, category).find((item) => item.zh === targetZh);
    if (!target) return;
    const legacyIds = legacy.map(([label, index]) => `character:${slugify(category)}:${slugify(label)}:${index}`);
    target.legacyIds = Array.from(new Set([...(target.legacyIds || []), ...legacyIds]));
  });
}
```

Call `applyCharacterIdentityLegacyOptionIds(catalog)` in `buildCatalog()` after `catalog` is built and before returning controls.

- [x] **Step 3: Cover all renamed and merged identity options**

Include body, facial-feature, hairstyle, and hair-color mappings listed in the design spec. Removed colors should map to their closest approved color:

- `霧感橄欖棕`, `亮綠色`, `深綠色` -> `深森林綠`
- `霧灰棕` -> `亞麻米棕`
- `亮黃色`, `黑底金色挑染` -> `淺金髮`
- `亮紫色`, `桃紅色` -> `亮桃粉`
- `銅紅髮` -> `玫瑰可可棕`

### Task 4: Validate And Commit

**Files:**
- Verify: all modified files

- [x] **Step 1: Run focused tests**

Run:

```bash
cd webapp
node --test src/lib/engineCharacterIdentityBase.test.js src/lib/engineSpecialSubjects.test.js
```

Expected: pass.

- [x] **Step 2: Run full validation**

Run:

```bash
cd webapp
npm test
npm run lint
npm run build
```

Expected: tests/lint/build pass. The existing Vite large chunk warning is acceptable.

- [x] **Step 3: Inspect changed files**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors. `Docs/conversation_handoff.md` may remain modified and should not be staged.

- [x] **Step 4: Commit implementation**

Stage only:

```bash
git add Docs/superpowers/plans/2026-05-25-character-identity-base-cleanup-implementation.md knowledge_base/character_design.md webapp/src/data/database.json webapp/src/lib/engine.js webapp/src/lib/engineCharacterIdentityBase.test.js webapp/src/lib/engineSpecialSubjects.test.js
```

Commit:

```bash
git commit -m "Clean character identity base prompts"
```
