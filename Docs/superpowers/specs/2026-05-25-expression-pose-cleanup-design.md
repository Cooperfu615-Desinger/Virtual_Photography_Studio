# Expression And Pose Cleanup Design

## Goal

Clean PAGE1 section A `神情姿態` so expression, gaze, body pose, and social shooting interaction each have clearer responsibility with less duplicated wording.

The cleaned system should support both general portrait photography and social selfie-style portraits without scattering selfie variants across every body-pose category.

## Scope

This design covers the next A-section cleanup batch:

- `神情與眼神 (Expression & Gaze)` rows in `knowledge_base/character_design.md`.
- `姿勢與肢體語言 (Pose & Body Language)` rows in `knowledge_base/character_design.md`.
- A small set of social-shooting actions added to `特殊動作 (Special Actions)`.
- A minimal compatibility adjustment so social-shooting actions can combine with normal body poses.
- Synced data in `webapp/src/data/database.json`.
- Focused compatibility and prompt-output tests where needed.

This batch does not redesign `身份基底`, `特殊角色`, wardrobe, scene, lighting, photography controls, or the UI panel structure.

## Current Issues

The current `神情姿態` layer has several repeated concepts:

- Expression options and pose options both describe gaze direction, such as looking down, looking back, and looking away.
- Selfie and mirror-selfie options are repeated across standing, seated, reclined, and moving poses.
- Several direct-camera expressions are too close in practice, especially natural smile, confident smile, calm gaze, and lazy calm.
- Body-pose rows sometimes include emotion or facial direction that should belong to expression and gaze.

The cleanup should make combinations easier to reason about:

- Expression decides face, gaze, and emotional tone.
- Pose decides body structure only.
- Special actions decide concrete actions, props, or social shooting relationship.

## Expression And Gaze Rules

Expression and gaze should only describe the face, eye direction, mouth state, and emotional intensity. It should not decide whether the subject is standing, seated, reclined, walking, or taking a selfie.

Use these nine options:

- `直視鏡頭｜柔和微笑`
- `直視鏡頭｜平靜淡然`
- `直視鏡頭｜無辜清透`
- `抿唇忍笑｜俏皮`
- `離鏡凝視｜若有所思`
- `低頭垂眼｜內斂`
- `回眸側看｜輕柔注意`
- `閉眼沉浸`
- `大笑｜自然喜悅`

Merged behavior:

- `直視鏡頭｜柔和微笑` replaces the current natural smile and confident smile variants.
- `直視鏡頭｜平靜淡然` replaces the current calm gaze and lazy calm variants.
- `離鏡凝視｜若有所思` replaces the current distant gaze and side-gaze variants.

Descriptions should be concise. Avoid overloading expression rows with photography style, body pose, or scene mood.

## Pose And Body Language Rules

Pose should describe body structure, body weight, limb arrangement, and motion state. It should avoid gaze words such as looking at camera, lowered gaze, side glance, over-the-shoulder gaze, selfie, and mirror selfie.

Keep about 27 body-pose options across five groups.

Standing:

- `站姿｜自然站姿`
- `站姿｜單腳重心`
- `站姿｜雙手自然垂放`
- `站姿｜雙臂交疊`

Seated:

- `坐姿｜自然坐姿`
- `坐姿｜微微前傾`
- `坐姿｜雙手後撐`
- `坐姿｜單腿放鬆`
- `坐姿｜雙腿自然伸展`
- `坐姿｜盤腿坐姿`
- `坐姿｜側身坐姿`
- `坐姿｜抱膝坐姿`

Reclined and low posture:

- `半躺低姿態｜側身半躺`
- `半躺低姿態｜正面仰躺`
- `半躺低姿態｜手撐半躺`
- `半躺低姿態｜微蜷放鬆`
- `半躺低姿態｜趴姿`
- `半躺低姿態｜側躺延伸`

Squatting:

- `蹲姿｜自然蹲姿`
- `蹲姿｜單膝蹲姿`
- `蹲姿｜手扶膝蓋蹲姿`

Movement:

- `動態｜輕步移動`
- `動態｜整理頭髮`
- `動態｜整理衣襬`
- `動態｜抬手整理肩頸`
- `動態｜回身動作`
- `動態｜停步姿勢`

Removed or merged pose concepts:

- Remove repeated `自然自拍姿勢` and `鏡子自拍姿勢` from standing, seated, reclined, and moving pose groups.
- Remove pose variants that only differ by gaze direction, such as lowered gaze, looking back, or side glance, and rely on expression/gaze choices instead.
- Keep body structure variants that materially change the silhouette or subject placement.

## Social Shooting Actions

General portrait and social selfie portrait should both remain possible. Social shooting should be concentrated in `特殊動作 (Special Actions)` instead of repeated across pose categories.

Add these social shooting actions:

- `自然自拍感`
- `鏡子自拍`
- `男友視角拍攝`
- `閨蜜視角拍攝`

Action responsibilities:

- `自然自拍感`: social-media self-portrait energy without forcing a phone to appear; close camera awareness, natural arm-angle feel, relaxed face-near-camera interaction.
- `鏡子自拍`: visible phone and mirror, face unobstructed, reflective self-portrait composition.
- `男友視角拍攝`: photographed by someone close to her, intimate relaxed camera awareness, affectionate natural interaction with the lens.
- `閨蜜視角拍攝`: photographed by a friend, playful casual social snapshot, easy unposed energy, natural laughter or relaxed interaction.

Do not add `電梯鏡子自拍` or `浴室鏡子自拍` in this batch. Those should be composed from scene choice plus `鏡子自拍`.

## Pose Compatibility For Social Shooting

Current app behavior treats `poseId` and `specialActionId` as mutually exclusive because most special actions already define a full body action. Keep that rule for normal special actions.

Social shooting actions are different: they describe the camera relationship, not a full body structure. They should be composable with the 27 pose options.

Implementation should:

- Allow `自然自拍感`, `鏡子自拍`, `男友視角拍攝`, and `閨蜜視角拍攝` to coexist with `poseId`.
- Keep non-social special actions mutually exclusive with `poseId`.
- Include both the selected pose and selected social-shooting action in generated prompts.
- Avoid duplicated selfie wording if an old selfie pose is normalized.

This is a behavior adjustment, not a new UI panel. The controls can remain inside the existing `神情姿態` subpanel.

## Duo Interaction

Do not redesign duo interaction in this batch.

The existing split is still useful:

- `duoInteractionId` decides relationship atmosphere.
- `duoPoseId` decides shared geometric arrangement.

If the expression/pose cleanup exposes new conflicts with duo options, handle them as compatibility fixes only. A fuller duo cleanup can be a later batch.

## Compatibility

Renaming and merging options can change generated option ids because ids are derived from category, display name, and row index. Implementation should preserve old saved locks for renamed or merged expression, pose, and social-shooting options.

Use targeted legacy id mapping or option `legacyIds` added in engine code after catalog build. Old locks should map to the nearest new option instead of falling back to `全無`.

Examples:

- Natural smile and confident smile should map to `直視鏡頭｜柔和微笑`.
- Calm gaze and lazy calm should map to `直視鏡頭｜平靜淡然`.
- Distant gaze and side gaze should map to `離鏡凝視｜若有所思`.
- Old selfie pose variants should normalize to the nearest body pose and, where the existing lock object can safely carry it, set `specialActionId` to `自然自拍感`.
- Old mirror-selfie pose variants should normalize to the nearest body pose and, where safe, set `specialActionId` to `鏡子自拍`.

Because `poseId` and `specialActionId` are separate controls, any cross-control migration must be explicit and covered by tests. If an old saved lock cannot safely preserve both concepts, prefer preserving the body pose rather than dropping to `全無`.

## Data Flow

Source edits:

- `knowledge_base/character_design.md` for expression, pose, and new social shooting action rows.
- `webapp/src/lib/engine.js` for compatibility aliases, social-action composability, and prompt assembly if row labels or row indexes change.
- `webapp/src/components/Page1Workspace.jsx` for the minimal mutual-exclusion adjustment between `poseId` and social-shooting `specialActionId`.

After dictionary edits, run:

```bash
python3 scripts/sync_to_json.py
cd webapp
npm test
npm run lint
npm run build
```

The sync script updates `webapp/src/data/database.json`. The final `database.json` diff should be scoped to the `Character` section.

## Validation

Validation should confirm:

- Expression options expose the nine approved labels.
- Pose options expose the approved roughly 27 labels and no longer expose repeated selfie/mirror-selfie pose variants.
- Special actions expose `自然自拍感`, `鏡子自拍`, `男友視角拍攝`, and `閨蜜視角拍攝`.
- Generated prompts can combine a normal portrait expression with a body pose.
- Generated prompts can combine a social shooting action with a body pose without duplicated selfie wording.
- PAGE1 controls allow a body pose and social-shooting action to be selected together, while normal special actions still replace body pose.
- Legacy locks for merged expression and pose options normalize into intended new options.
- `npm test`, `npm run lint`, and `npm run build` pass, allowing the existing Vite large chunk warning.

## Out Of Scope

This design does not tune identity-base wording, special-subject character descriptions, duo interaction design, scene-specific selfie scenarios, or photography/imaging controls.
