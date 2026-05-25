# Special Subject Prompt Enhancement Design

## Goal

Enhance `特殊角色` prompt descriptions while preserving every existing special subject option.

The result should feel like an unknown figure has appeared inside the real contemporary world and is being photographed naturally in the same physical space as the selected scene.

## Scope

This enhancement covers:

- `SPECIAL_SUBJECT_OPTIONS` in `webapp/src/lib/engine.js`.
- The special-subject prompt assembly path in `webapp/src/lib/engine.js`.
- Focused tests in `webapp/src/lib/engineSpecialSubjects.test.js`.

This enhancement does not add, remove, rename, or reorder special subjects. It does not move special subjects into Markdown or JSON. It does not redesign normal identity base, wardrobe, scene, lighting, camera, expression, or pose controls.

## Current State

Special subjects are currently defined directly in `webapp/src/lib/engine.js`.

Existing non-empty options:

- `黑骷髏`
- `白骷髏`
- `日本戰國武士`
- `歐洲騎士`
- `女性人形機器人`

Special subjects already override normal character identity and wardrobe. Android remains the exception that can keep hairstyle and hair color controls. Expression and pose can still be used with special subjects.

## Keep All Existing Options

Keep these ids and labels exactly:

- `skeleton` / `黑骷髏`
- `white-skeleton` / `白骷髏`
- `sengoku-samurai` / `日本戰國武士`
- `european-knight` / `歐洲騎士`
- `female-android` / `女性人形機器人`

The subject types should remain:

- Skeleton subjects use `specialSubject: 'skeleton'`.
- Warrior and knight subjects use `specialSubject: 'historical-warrior'`.
- Android uses `specialSubject: 'android'`.

## Creative Direction

Special subjects should read as physical beings or objects that have appeared inside a real modern photographic scene.

The prompt language should emphasize:

- Real-world photographic presence.
- Natural integration with ordinary surroundings.
- Realistic scale and contact with the ground or nearby surface.
- Ambient light from the selected scene affecting the subject.
- Material detail that fits live-action photography.
- A mysterious or anomalous presence while leaving the selected scene in control.

The selected scene should still control the location. The special subject prompt should not choose a scene, city, room, battlefield, castle, laboratory, or museum on its own.

## Shared Modern-World Integration Rule

When a non-empty special subject is selected, prompt output should include a shared integration sentence similar to:

`an unknown anomalous figure appearing naturally inside a real contemporary environment, photographed as if genuinely present in the same physical space, grounded by realistic scale, contact shadows, ambient light, and ordinary surroundings`

This sentence should be added by the prompt assembly path instead of repeated inside every option. That keeps the individual subject text focused on the character itself.

For skeleton subjects, this shared sentence should pass through the existing skeleton sanitizer where needed so it does not accidentally introduce clothing, skin, or living-person language.

## Subject-Specific Prompt Direction

### Black Skeleton

Keep the complete human skeleton and deep blue-black bone tone. Shift the wording away from pure anatomical specimen language and toward a full-body unknown skeletal figure with dry matte bone, visible joints, realistic proportions, and a surreal but physically present photographic quality.

### White Skeleton

Keep the complete human skeleton and warm ivory aged bone tone. Emphasize porous off-white bone texture, subtle age staining, realistic skeletal articulation, and quiet anomalous presence in a modern environment.

### Japanese Sengoku Warrior

Keep the female Japanese Sengoku-era samurai identity, lamellar armor, feminine armor shaping, waist sash, katana, and wakizashi. Reduce battlefield-setting language. Emphasize practical live-action armor, layered lacing, worn metal and lacquer surfaces, textile ties, and the feeling of a historical warrior standing naturally in the present-day world.

### European Knight

Keep the female medieval European knight identity, plate armor, chainmail, gambeson edges, leather straps, cloak, and longsword. Reduce castle or chivalric-setting pressure. Emphasize practical plate construction, realistic metal wear, articulated joints, leather fastening, and the feeling of a medieval knight standing naturally in the present-day world.

### Female Android

Keep the near-human female android identity and allow a longer prompt than normal identity options. Emphasize a realistic human female face, subtle facial seams, synthetic skin-like shell, precise mechanical joints, luminous circuit accents, and refined high-fashion robotics. The android should feel like a believable physical cyborg inside ordinary contemporary space, with readable human identity, elegant mechanical construction, and real object scale.

## Negative-Wording Policy

Avoid negative phrasing inside special subject prompts when possible.

Replace phrases like:

- `not anime`
- `not cosplay`
- `not fantasy armor`
- `not toy-like`
- `not a helmeted robot`

Use positive alternatives such as:

- `live-action photographic realism`
- `practical physical construction`
- `documentary-real material detail`
- `human-scale physical presence`
- `realistic robotics and synthetic material construction`

The only exception is if a later implementation discovers a specific regression that cannot be controlled with positive wording. In that case, add a focused test and keep the negative phrase as narrow as possible.

## Behavior Rules

Current behavior should remain:

- Special subject selection forces `subjectCount` to a single subject.
- Special subject output suppresses normal wardrobe lines.
- Historical warrior and knight do not keep normal hair or hair color controls.
- Android keeps hairstyle and hair color controls.
- Expression and pose can still compose with special subjects.
- Scene, lighting, camera, optical effect, and imaging simulation continue to work normally.

Special subjects should not automatically choose a compatible scene. The user will choose the scene separately.

## Length Rules

Special subject prompts may be longer than normal identity prompts because they fully replace identity and wardrobe.

Targets:

- Skeleton subjects: 45-85 English words.
- Historical warrior and knight subjects: 80-130 English words.
- Android subject: 100-160 English words.
- Shared integration sentence: 25-45 English words.

The prompt should be dense and precise, but not a paragraph of repeated synonyms.

## Tests

Update focused tests to verify:

- The five existing special subjects remain exposed with the same ids and labels.
- All special subject prompts include live-action or photographic real-world material language.
- Special subject prompt output includes the shared modern-world integration sentence.
- Historical warrior and knight descriptions avoid anime/cosplay/fantasy wording and include practical material construction.
- Skeleton descriptions keep their dark and ivory tone distinction.
- Android keeps hairstyle and hair color controls.
- Special subject mode still suppresses wardrobe output.
- Expression and pose remain available with special subjects.

## Data Flow

Implementation should edit `webapp/src/lib/engine.js` directly because special subjects are code-defined options.

Expected files:

- `webapp/src/lib/engine.js`
- `webapp/src/lib/engineSpecialSubjects.test.js`

No Markdown-to-JSON sync is needed for this task.
