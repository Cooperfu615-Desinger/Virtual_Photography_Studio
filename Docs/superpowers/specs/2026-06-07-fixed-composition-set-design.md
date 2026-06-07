# Fixed Composition Set Design

## Goal

Add a PAGE1 `D 場景環境` mode for fixed photographic compositions. A fixed composition set defines the physical set, camera position, framing, angle, orbit, lens perspective, and default aspect ratio as one locked scene package.

The user can then vary the subject, wardrobe, lighting, photography style, rendering simulation, set position, capture mode, and performance state without losing the identity of the selected composition.

This feature is for repeatable portrait series: the same room or set can produce photographer-shot portraits, loose social self-shot crops, and imperfect accidental-looking snapshots while keeping enough scene identity to feel connected.

## Scope

V1 covers only single-subject PAGE1 generation.

Add three test fixed composition sets:

- `清水模牆面沙發棚`
- `高級飯店落地窗都市夜景`
- `復古磁磚浴室浴缸`

Add three fixed-set-only controls:

- `固定場景人物位置`
- `固定場景拍攝型態`
- `固定場景演出狀態`

When a fixed composition set is active, it should take over normal location and camera geometry controls. PAGE1 still allows identity, wardrobe, ambient light, subject light, photography style, and imaging simulation.

This design does not implement Pose Modifier. It does not expand Pose Composer. Pose Composer can remain available as an optional concrete body-structure control, but fixed-set position and capture mode must constrain how it is interpreted.

## Conceptual Model

Current PAGE1 scene choices are mostly location bases: they say where the subject is, while E-section camera controls decide how the portrait is photographed.

A fixed composition set is different. It owns both:

- scene architecture: walls, furniture, surfaces, props, windows, bathtub, bed, and spatial anchors
- fixed camera architecture: shot size, angle, orbit, focal feel, aspect ratio, and layout priority

The set should be treated as a fixed photographic stage, not as a generic `locationId` row.

## V1 Fixed Sets

### 清水模牆面沙發棚

Default aspect ratio: `16:9`.

Fixed set prompt direction:

```text
fixed editorial set composition, raw concrete wall background, black vintage two-seat Chesterfield leather sofa spanning the lower frame, bare sculptural tree branches on one side, modern-retro interior styling, straight-on horizontal camera view, sofa and wall remain the main set architecture
```

Position options:

- `近鏡頭沙發前方`: subject in the foreground in front of the sofa, with the sofa becoming a background layer; standing, crouching, floor sitting, or close-lens behavior can be model-decided.
- `沙發座面中央`: subject placed on the sofa seat plane; sitting, lounging, half-reclining, lying, or leaning on an armrest can be model-decided.
- `沙發後方靠牆`: subject near the wall behind or around the sofa, with the sofa as a horizontal foreground anchor; standing, wall-leaning, or forward-leaning behavior can be model-decided.

Avoid requiring readable text. If a black poster panel is used, describe it as `vertical black graphic poster panel with bold cream typography-like blocks` rather than asking for specific readable words.

### 高級飯店落地窗都市夜景

Default aspect ratio: `3:4`.

Fixed set prompt direction:

```text
fixed luxury hotel window composition, large floor-to-ceiling glass window filling the background, New York-style high-rise city skyline outside, bed edge and soft white bedding in the lower foreground, intimate room-to-city depth, camera facing the window from inside the room
```

Position options:

- `近鏡頭床面前景`: subject close to the camera or bed foreground; the city view can be partially blocked or softened.
- `床邊靠窗`: subject around the bed edge or window-side mid-plane; body, bedding, glass, and city depth can all remain readable.
- `窗前城市剪影`: subject near the floor-to-ceiling window; city towers become the dominant background, allowing profile, back-view, window-gazing, or silhouette-like behavior.

This set should preserve the room-to-city depth relationship. In self-shot modes, the skyline can be clearer than the subject.

### 復古磁磚浴室浴缸

Default aspect ratio: `16:9`.

Fixed set prompt direction:

```text
fixed bathtub portrait composition, vintage tiled bathroom wall, bathtub rim crossing the lower foreground, white foam bubbles around the subject, chrome faucet and bath hardware on one side, intimate low horizontal camera view from the tub edge
```

Position options:

- `浴缸內中央`: subject in the middle of the bathtub, surrounded by foam and tub edges; face and upper body can remain the main portrait anchor.
- `低角度浴缸前景`: camera near the tub edge or waterline; tub rim, foam, legs, or partial body forms may create foreground occlusion and focus variation.
- `浴缸邊緣`: subject close to the bathtub edge; sitting on the rim, holding the rim, or leaning from inside the tub can be model-decided.

This set describes bathtub, foam, tile, rim, and low-angle composition. It should not force a specific wardrobe or explicit exposure level.

## Fixed-Set Controls

### 固定場景人物位置

This control is set-dependent. It describes depth plane, scene object relationship, and usable area inside the fixed composition. It is not a pose selector.

The prompt should avoid exact limb placement. It should let the model decide whether the subject stands, sits, leans, lies, crouches, or approaches the lens, unless the user explicitly selects Pose Composer.

### 固定場景拍攝型態

V1 options:

- `攝影師拍攝`
- `自然自拍感`
- `失控自拍感`

`攝影師拍攝` keeps the set readable and the portrait generally clear:

```text
photographer-shot fixed set portrait, subject arranged within the selected set, fixed composition remains readable, face and wardrobe generally clear where framing allows
```

`自然自拍感` is self-shot composition feeling without requiring a visible phone:

```text
self-shot social composition feeling, subject may move close to the lens, off-center partial face or half-body crop allowed, fixed set may remain only as recognizable background fragments, no visible phone required
```

`失控自拍感` allows stronger imperfection:

```text
imperfect self-shot camera behavior, focus may fall on the background or set objects instead of the face, subject may be slightly blurred or partially cropped, casual accidental framing, real social snapshot imperfection, no visible phone required
```

The self-shot modes can sacrifice full set visibility, perfect focus, clear face readability, and full wardrobe visibility. This is intentional.

### 固定場景演出狀態

V1 options:

- `模型自然發揮`
- `自信力量感`
- `慵懶無力感`

`模型自然發揮`:

```text
let the image model choose a natural body attitude and expression that fits the selected fixed set position and capture mode
```

`自信力量感`:

```text
confident powerful presence, strong self-possessed attitude, assertive body energy, direct control of the frame without specifying exact limb placement
```

`慵懶無力感`:

```text
lazy drained presence, softened body energy, relaxed weight sinking into the set, unforced tired attitude without specifying exact limb placement
```

Performance state should be treated as a fixed-set-specific state description. Do not name it Pose Modifier.

## UI Behavior

The simplest V1 UI is to add a `固定構圖場景` select under PAGE1 `D 場景環境`.

When `固定構圖場景` is `全無`, PAGE1 behaves as it does today.

When a fixed composition set is selected, show:

- `固定構圖場景`
- `固定場景人物位置`
- `固定場景拍攝型態`
- `固定場景演出狀態`
- `環境光條件`
- `光線表現`

When a fixed composition set is selected, clear or disable:

- `sceneAttributeId`
- `locationId`
- PAGE3 imported world-scene architecture
- `framingId`
- `angleId`
- `orbitId`
- `lensId`

When a fixed composition set is selected, keep available:

- subject and identity controls
- wardrobe controls
- Pose Composer, as an optional concrete pose layer
- `lightingId`
- `lightDirectionId`
- `styleId`
- `filmId`

Aspect ratio should be set by the fixed composition set. V1 does not need a user-facing aspect-ratio override while fixed set mode is active.

## Prompt Pipeline

Add fixed-set structured source lines before normal scene text:

- `Fixed Composition Set`
- `Fixed Set Position`
- `Fixed Set Capture Mode`
- `Fixed Set Performance State`

If fixed set mode is active, normal `Location`, PAGE3 `World Scene Architecture`, and camera geometry fields should not compete with the fixed set.

### Gpt / grokPrompt

`Gpt` should keep fixed set details in the `Scene` section, followed by position, capture mode, and performance state. `Lighting` should still contain ambient light and subject light. `Camera Look` should keep photography style and imaging simulation but omit normal framing, angle, orbit, and lens values that the fixed set already owns.

`Gpt` must continue ending with:

```text
multi-cut sequence n=2
```

### Grok/Z-Image / zImagePrompt

`Grok/Z-Image` should turn fixed set mode into natural language rather than a rigid list.

Example direction:

```text
The portrait uses a fixed bathtub set with a low tub-edge camera view. The subject may drift close to the lens with imperfect self-shot framing, while the tiled wall, foam, and bathtub rim remain only as partial background clues.
```

Self-shot modes should feel conversational and physical, not like a technical camera checklist.

### AI / midjourneyPrompt

`AI` should preserve:

- fixed set identity
- fixed set position
- capture mode
- performance state
- wardrobe
- pose or Pose Composer details when selected
- lighting and camera look essentials

Do not over-compress fixed set details so far that the selected set disappears. Do not drop wardrobe or pose details.

## Guard Behavior

Existing PAGE1 guard language often protects clear faces, visible outfits, and recognizable environments. Fixed-set mode needs two branches.

### Photographer-Shot Branch

Keep normal stability:

- fixed set remains readable
- face and subject are generally clear
- wardrobe is visible where the set framing allows
- set architecture remains recognizable

### Self-Shot Branch

Relax normal stability on purpose:

- the selected set can remain as partial background fragments
- the subject can move very close to the lens
- partial face, half-body crop, and off-center framing are allowed
- full wardrobe visibility is not required
- focus can fall on background or set objects
- the subject can be slightly blurred
- no visible phone is required

This branch should avoid prompts like `avoid collapsing into a face-only crop`, `clear facial readability`, or `preserve the selected environment as a visible, recognizable background` when they would make the self-shot look too perfect.

## Data Flow

Likely implementation files:

- `webapp/src/lib/engine.js`
- `webapp/src/components/Page1Workspace.jsx`
- `webapp/src/App.jsx`
- `webapp/src/lib/page1WorkspaceSummary.js`
- focused prompt pipeline tests under `webapp/src/lib`

The first implementation can define fixed composition set options in code near current option constants. If the concept proves stable, later batches can move the set library into a markdown knowledge base and sync it into `database.json`.

## Validation

Targeted tests should cover:

- fixed set controls appear only when fixed set mode is active
- fixed set mode clears or ignores normal location, PAGE3 import, framing, angle, orbit, and lens
- fixed set default aspect ratio is applied
- `Gpt` includes fixed set, position, capture mode, performance state, lighting, style, and rendering while still ending with `multi-cut sequence n=2`
- `Grok/Z-Image` keeps fixed set language natural
- `AI` preserves fixed set, wardrobe, and pose details
- photographer-shot mode keeps set readability guards
- self-shot modes allow partial crop, imperfect focus, and partial set visibility
- single-subject mode works first; duo behavior is ignored or disabled

Suggested validation commands:

```bash
cd webapp
node --test src/lib/enginePromptPipeline.test.js
node --test src/lib/engineGrokScenePriority.test.js
node --test src/lib/page1WorkspaceSummary.test.js
npm test
npm run lint
npm run build
git diff --check
```

## Out Of Scope

V1 does not include:

- duo fixed composition sets
- Pose Modifier
- broad Pose Composer expansion
- moving the fixed set library to markdown
- adding many fixed sets beyond the first three
- adding new aspect ratios beyond currently supported PAGE1 ratios
- requiring visible phone props for self-shot mode
- requiring readable poster text
- changing PAGE2, PAGE3, or SUNO behavior
