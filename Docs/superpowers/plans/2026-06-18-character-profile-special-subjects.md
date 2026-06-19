# Character Profile Special Subjects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reusable character cards as a special-subject subtype so a fixed character identity and signature outfit can replace normal PAGE1 character and wardrobe prompts while still composing with scene, lighting, camera, expression, actions, and Pose Composer.

**Architecture:** Treat character cards as `specialSubject: 'character-profile'` entries inside `SPECIAL_SUBJECT_OPTIONS` for V1, matching the existing special-subject routing instead of creating a second subject system. Add character-card-specific integration wording so ordinary character cards do not inherit the anomalous historical/skeleton phrasing. Keep reference images as metadata in V1; prompt outputs explicitly instruct the user/model to use the supplied character reference sheet when images are attached.

**Tech Stack:** Vite + React, Node test runner, PAGE1 prompt engine in `webapp/src/lib/engine.js`, PAGE1 state filtering in `webapp/src/App.jsx`.

---

## File Structure

- Modify: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js`
  - Add the first `character-profile` special subject option.
  - Add `isCharacterProfileSubject(subject)`.
  - Adjust `buildSpecialSubjectIntegrationPrompt(subject)` so character cards use identity-consistency wording, not anomalous-character wording.
  - Keep wardrobe suppression through existing `isSpecialSubject(subject)` flow.
- Modify: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engineSpecialSubjects.test.js`
  - Add tests for exposed character-card option, prompt identity/outfit preservation, reference image metadata, and Pose Composer coexistence.
- Modify: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/character-section-a-authoring-guide.md`
  - Document `character-profile` as a special-subject subtype and define authoring rules for future character cards.
- Optional asset copy if UI previews are desired in the same task:
  - Create: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/public/character-cards/48g/48_G_01.jpeg`
  - Create: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/public/character-cards/48g/48_G_02.jpeg`
  - Create: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/public/character-cards/48g/48_G_03.jpeg`
  - For V1 prompt behavior, the engine only needs metadata paths; copying assets can be a separate commit if avoiding binary churn.

## Character Card V1 Data Shape

Add this entry to `SPECIAL_SUBJECT_OPTIONS` after `female-android`:

```js
{
  id: 'character-48g',
  zh: '48G 灰帽黑髮角色',
  en: 'a fixed original adult female character profile based on the supplied character reference sheets, preserve the same doll-like East Asian face identity, pale luminous skin, large clear gray-brown eyes, soft smoky eye makeup, subtle pink under-eye blush, small straight nose, softly rounded lips, glossy black shoulder-length layered lob haircut with airy see-through bangs and face-framing side strands, slim petite fashion-model body proportions with a narrow waist and balanced curvy silhouette, signature outfit locked as a taupe-gray cropped hooded zip jacket worn open with the hood usually worn up framing the hair, black lace bralette neckline, low-rise faded blue denim mini skirt, visible black lace waistband detail, small off-white shoulder bag with thin black strap, black lace-up ankle boots with glossy rounded toes, contemporary street-fashion photographic realism',
  count: 1,
  specialSubject: 'character-profile',
  specialToneZh: '48G 固定角色卡',
  referenceImages: [
    {
      type: 'face-turnaround',
      label: '臉部髮型四視圖',
      sourcePath: '/Volumes/Extreme Pro/00_隨身碟用檔案/一致性設計架構/48_G_01.jpeg',
      publicPath: '/character-cards/48g/48_G_01.jpeg',
    },
    {
      type: 'full-body',
      label: '全身標準穿搭',
      sourcePath: '/Volumes/Extreme Pro/00_隨身碟用檔案/一致性設計架構/48_G_02.jpeg',
      publicPath: '/character-cards/48g/48_G_02.jpeg',
    },
    {
      type: 'expression-sheet',
      label: '表情九宮格',
      sourcePath: '/Volumes/Extreme Pro/00_隨身碟用檔案/一致性設計架構/48_G_03.jpeg',
      publicPath: '/character-cards/48g/48_G_03.jpeg',
    },
  ],
}
```

## Task 1: Failing Character Card Tests

**Files:**
- Modify: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engineSpecialSubjects.test.js`

- [ ] **Step 1: Add failing tests**

Add the following tests after `special subject control exposes dedicated character options`:

```js
test('special subject control exposes character profile cards', () => {
  const specialSubjectControl = getLockControls().find((control) => control.key === 'specialSubjectId');
  const characterCards = specialSubjectControl.options.filter((option) => option.specialSubject === 'character-profile');

  assert.deepEqual(
    characterCards.map((option) => [option.id, option.zh, option.specialToneZh]),
    [['character-48g', '48G 灰帽黑髮角色', '48G 固定角色卡']]
  );
  assert.deepEqual(
    characterCards[0].referenceImages.map((image) => [image.type, image.publicPath]),
    [
      ['face-turnaround', '/character-cards/48g/48_G_01.jpeg'],
      ['full-body', '/character-cards/48g/48_G_02.jpeg'],
      ['expression-sheet', '/character-cards/48g/48_G_03.jpeg'],
    ]
  );
});

test('character profile card replaces normal identity and wardrobe while preserving reference guidance', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'character-48g',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'character-48g');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /48G 灰帽黑髮角色|48G 固定角色卡/);
  assert.match(promptText, /fixed original female character profile/);
  assert.match(promptText, /preserve the same face identity/);
  assert.match(promptText, /doll-like East Asian face identity/);
  assert.match(promptText, /glossy black shoulder-length layered lob haircut with airy see-through bangs/);
  assert.match(promptText, /soft smoky eye makeup/);
  assert.match(promptText, /taupe-gray cropped hooded zip jacket worn open with the hood usually worn up/);
  assert.match(promptText, /black lace bralette neckline/);
  assert.match(promptText, /low-rise faded blue denim mini skirt/);
  assert.match(promptText, /small off-white shoulder bag with thin black strap/);
  assert.match(promptText, /black lace-up ankle boots with glossy rounded toes/);
  assert.match(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
});

test('character profile card still composes with expression pose composer and special actions', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'character-48g',
    expressionId: optionId('expressionId', '直視鏡頭｜平靜淡然'),
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '單腳重心'),
    poseHandId: optionId('poseHandId', '雙手在身前交握'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    poseAnchorId: optionId('poseAnchorId', '全無'),
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'character-48g');
  assert.equal(prompt.selection.poseBaseId, optionId('poseBaseId', '站姿'));
  assert.match(promptText, /calm neutral expression|relaxed half-lidded ease/);
  assert.match(promptText, /She is standing/);
  assert.match(promptText, /one-leg weight shift/);
  assert.match(promptText, /both hands clasped loosely in front of the body/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp
node --test src/lib/engineSpecialSubjects.test.js
```

Expected: FAIL because `character-48g` does not exist and character-card integration wording is not implemented.

## Task 2: Engine Data And Character-Card Integration

**Files:**
- Modify: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js`

- [ ] **Step 1: Add the `character-48g` entry**

Insert the data shape from the "Character Card V1 Data Shape" section into `SPECIAL_SUBJECT_OPTIONS`.

- [ ] **Step 2: Add character profile helper**

Add this helper near `isAndroidSubject(subject)`:

```js
function isCharacterProfileSubject(subject) {
  return subject?.specialSubject === 'character-profile';
}
```

- [ ] **Step 3: Adjust special subject integration prompt**

Change `buildSpecialSubjectIntegrationPrompt(subject)` to branch before the existing anomalous wording:

```js
function buildSpecialSubjectIntegrationPrompt(subject) {
  if (!isSpecialSubject(subject)) return '';

  if (isCharacterProfileSubject(subject)) {
    return 'use the supplied character reference sheets as identity and outfit anchors, preserve the same face, hairstyle, body proportions, signature outfit, and overall character continuity while adapting only pose, expression, lighting, camera, and scene context';
  }

  return 'an unknown anomalous figure appearing naturally inside a real contemporary environment, photographed as if genuinely present in the same physical space, grounded by realistic scale, contact shadows, ambient light, and ordinary surroundings';
}
```

- [ ] **Step 4: Verify GREEN for special subject tests**

Run:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp
node --test src/lib/engineSpecialSubjects.test.js
```

Expected: PASS.

## Task 3: Documentation Update

**Files:**
- Modify: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/character-section-a-authoring-guide.md`

- [ ] **Step 1: Update fixed special subject list**

Add this item under "目前固定選項與 id":

```md
- `character-48g` / `48G 灰帽黑髮角色`
```

- [ ] **Step 2: Add character-card behavior rules**

Add this block inside "特殊角色" after the current behavior rules:

```md
角色卡 `character-profile` 規則：

- 角色卡是特殊角色子類型，用於固定原創角色身份、臉、髮型、身形與招牌穿搭。
- 角色卡會 suppress normal wardrobe output，避免一般穿搭稀釋角色設定。
- 角色卡不保留一般髮型與髮色控制，髮型髮色寫在角色卡身份描述中。
- 角色卡仍可使用 B 神情姿態、特殊動作與 Pose Composer。
- 角色卡不應使用 `unknown anomalous figure` 共享融合句；應使用角色一致性與 reference sheet guidance。
- 每張角色卡可包含 `referenceImages` metadata，記錄 face-turnaround、full-body、expression-sheet 等來源。
```

- [ ] **Step 3: Add future character-card authoring template**

Add this block near "新增特殊角色":

```md
新增角色卡：

1. 在 `SPECIAL_SUBJECT_OPTIONS` 新增固定 id、zh、en、count、`specialSubject: 'character-profile'`。
2. `en` 需包含固定臉部身份、髮型、身形、招牌穿搭與寫實風格，不要包含固定場景。
3. 若有設定圖，加入 `referenceImages`，至少標註 `type`、`label`、`sourcePath`、`publicPath`。
4. 確認角色卡不輸出 normal wardrobe。
5. 確認角色卡輸出使用 character reference guidance，不使用 anomalous special subject guidance。
6. 更新 `engineSpecialSubjects.test.js`。
7. 跑完整驗證。
```

## Task 4: Optional Reference Image Assets

**Files:**
- Create: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/public/character-cards/48g/48_G_01.jpeg`
- Create: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/public/character-cards/48g/48_G_02.jpeg`
- Create: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/public/character-cards/48g/48_G_03.jpeg`

- [ ] **Step 1: Create the asset directory**

Run:

```bash
mkdir -p /Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/public/character-cards/48g
```

- [ ] **Step 2: Copy the three source images**

Run:

```bash
cp "/Volumes/Extreme Pro/00_隨身碟用檔案/一致性設計架構/48_G_01.jpeg" "/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/public/character-cards/48g/48_G_01.jpeg"
cp "/Volumes/Extreme Pro/00_隨身碟用檔案/一致性設計架構/48_G_02.jpeg" "/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/public/character-cards/48g/48_G_02.jpeg"
cp "/Volumes/Extreme Pro/00_隨身碟用檔案/一致性設計架構/48_G_03.jpeg" "/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/public/character-cards/48g/48_G_03.jpeg"
```

Expected: three image files exist in `webapp/public/character-cards/48g/`.

- [ ] **Step 3: Verify asset paths**

Run:

```bash
ls -lh /Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/public/character-cards/48g
```

Expected: `48_G_01.jpeg`, `48_G_02.jpeg`, and `48_G_03.jpeg` are listed.

## Task 5: Full Verification And Commit

**Files:**
- Verify all modified files from Tasks 1-4.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp
node --test src/lib/engineSpecialSubjects.test.js src/lib/enginePoseComposer.test.js
```

Expected: PASS.

- [ ] **Step 2: Run full validation**

Run:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp
npm test
npm run lint
npm run build
```

Expected: all tests pass, lint passes, build passes with only the existing Vite chunk-size warning.

- [ ] **Step 3: Review diff**

Run:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio
git diff --stat
git diff -- webapp/src/lib/engine.js webapp/src/lib/engineSpecialSubjects.test.js Docs/specs/character-section-a-authoring-guide.md
```

Expected: diff is limited to character-card special-subject data, tests, and authoring guide updates, plus optional copied image assets if Task 4 was executed.

- [ ] **Step 4: Commit**

Run:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio
git add webapp/src/lib/engine.js webapp/src/lib/engineSpecialSubjects.test.js Docs/specs/character-section-a-authoring-guide.md
git add webapp/public/character-cards/48g/48_G_01.jpeg webapp/public/character-cards/48g/48_G_02.jpeg webapp/public/character-cards/48g/48_G_03.jpeg
git commit -m "Add character profile special subject card"
```

Expected: one commit containing the character-card system and first `48G` card. If Task 4 was not executed, omit the second `git add` command for image assets.

## Self-Review

- Spec coverage: The plan covers reusable character cards, first 48G card, reference metadata, prompt replacement for character and wardrobe, Pose Composer coexistence, and documentation.
- Placeholder scan: No unresolved placeholders, no deferred behavior hidden behind vague text, and each code step includes concrete snippets or commands.
- Type consistency: The plan consistently uses `specialSubject: 'character-profile'`, `referenceImages`, `sourcePath`, `publicPath`, `isCharacterProfileSubject`, and `character-48g`.
