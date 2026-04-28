# Virtual Photography Studio Handoff

## Snapshot

- Repo: `/Users/cooperfu/Desktop/Virtual_Photography_Studio`
- Frontend: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`
- App type: Vite + React prompt generator with optional Firebase Favorites sync
- Knowledge base source: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base`
- Sync script: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/scripts/sync_to_json.py`
- Synced data target: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/data/database.json`

## Current Working State

- Latest pushed commit on `main`: `083c9df Add nighttime scene accents and update lace dress`
- Recent important commits:
  - `083c9df Add nighttime scene accents and update lace dress`
  - `c384126 Refine striped color wording`
  - `ea6d7a7 Add knit sweater and palette options`
  - `e48812d Add lighting reference modal`
  - `162b6dd Refine light style controls`
  - `e7cfcd1 Add more indoor environment moods`
  - `147f088 Optimize Firebase loading and safer body prompts`
  - `b4fd8af Expand graffiti clothing prompt variations`
  - `a3877bc Move Firebase auth into settings menu`
  - `0086d4f Add Firebase favorites sync`
- Working tree should be clean after `083c9df`; if this handoff doc is edited, only this doc should be dirty
- Work continues directly on `main`
- Standard validation flow remains:
  - `python3 scripts/sync_to_json.py`
  - `npm run lint` from `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`
  - `npm run build`

## Main Code Areas

- Prompt engine:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js`
- Main app / page switch / locks / import-export / PAGE2 / PAGE3:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/App.jsx`
- PAGE1 workspace UI:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/Page1Workspace.jsx`
- PAGE2 workspace UI:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/Page2Workspace.jsx`
- PAGE3 workspace UI:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/Page3Workspace.jsx`
- Prompt card UI:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/PromptCard.jsx`
- Shared styles:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/index.css`

## Core Product State

- The app remains a Vite + React frontend app, but Favorites now optionally sync to Firebase Cloud Firestore via Firebase modular SDK.
- Firebase is used only for Favorites persistence / Google sign-in, not for prompt generation.
- `Subject Count` supports:
  - `1 位`
  - `2 位`
  - `上傳人物`
- `上傳人物` is still prompt-only guidance:
  - no in-app upload exists
  - generated prompt expects the user to attach the same reference image directly in the target image tool
- Main controls still include:
  - `Generate`
  - `Clear Feed`
  - `All Random`
  - `All None`
- The site-wide Firebase sign-in / sign-out control now lives in the top-right gear settings menu, not inside the Favorites toolbar.

## Page Architecture

### PAGE1

- PAGE1 is the main full-scene prompt generator.
- PAGE1 now includes:
  - scene + scene attribute
  - wardrobe
  - body type
  - pose / special action
  - lighting
  - camera language
  - restore / import tools
- PAGE1 remains the only page that generates full Midjourney + Grok prompts for final image use.

### PAGE2

- PAGE2 is a fully separate character-reference builder.
- PAGE2 does not inject role text back into PAGE1.
- PAGE2 is intended for identity-lock / reference prompts only.
- PAGE2 was moved toward a more passport / reference-photo direction for cross-model reuse.
- PAGE2 currently emphasizes standard identity views rather than editorial portrait language.
- Key PAGE2 outputs now include:
  - `Face Anchor`
  - `Identity Prompt`
  - `Master Sheet`
  - `Core Views Bundle`
  - `Prompt Bundle`
- Core reference-angle logic was tuned toward:
  - front
  - left three-quarter
  - side profile
  - back view

### PAGE3

- PAGE3 exists and is fully separate from PAGE1 / PAGE2.
- PAGE3 is a pure scene / world / environment prompt builder.
- PAGE3 outputs:
  - `Scene Anchor`
  - `Scene Prompt`
  - `Cinematic Prompt`
  - `World Prompt`
- PAGE3 currently supports:
  - scene scale
  - scene subject
  - city identity
  - worldview direction
  - photography style
  - time / weather
  - lighting mood
  - composition / lens language
  - material / environment details
- PAGE3 can now use PAGE1 photography styles in a scene-adapted way.
- PAGE3 also has a dedicated `城市定位` field:
  - 東京
  - 首爾
  - 台北
  - 上海
  - 紐約
  - 倫敦
  - 巴黎
- City identity wording includes landmark-aware cues:
  - Tokyo Tower / Skytree
  - Taipei 101
  - Oriental Pearl / Lujiazui
  - Big Ben / The Shard / London Eye
  - Eiffel Tower

## PAGE1 Restore / Import / Feed System

- Favorites now support direct restore back to PAGE1.
- Prompt cards in Favorites have a restore control that loads the saved structured selection back into the console.
- Favorites now support Firebase Cloud Firestore sync when signed in with the allowed Google account.
- Firebase path: `users/{uid}/favorites/{promptId}`.
- Existing local Favorites are merged with cloud Favorites after sign-in, so local records can migrate into Firebase.
- Favorites localStorage format is compact:
  - it stores essential prompt fields only
  - it no longer stores full prompt card objects verbatim
  - this does not remove or shorten the actual Midjourney / Grok / Z-Image prompt strings
- Favorites still keep localStorage as fallback when Firebase is unavailable or signed out.
- A `Clear Favorites` / clear saved content control exists to remove saved Favorites from the current app state.
- `回填 Prompt` exists next to `Library Editor`.
- Standard-format prompt restore is implemented:
  - paste a standard exported prompt
  - parse matching controls
  - restore them into PAGE1
- Restore default rule:
  - if a control has `全無` and restore misses it, it becomes `全無`
  - otherwise it falls back to `Random`
- `Download Feed` exists.
- `Import Feed` exists and is live.
- Feed ZIP import rules:
  - accepts the app’s own ZIP format only
  - merges into current Favorites
  - duplicate ids are overwritten by imported entries
  - invalid ZIP format rejects the whole import
- Feed and Favorites no longer have the old 120-item cap.

## Firebase Favorites / Auth State

- Firebase modular SDK dependency is installed in `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`.
- Main files:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/firebase.js`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/favoritesRepository.js`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/firebase_favorites_rules.md`
- Firebase config is provided through Vite env vars.
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/.env.production` exists so GitHub Pages builds can include the Firebase config.
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/.env.local` remains ignored for local overrides.
- Allowed account currently used by the user:
  - `cooperfu.615@gmail.com`
- The user already enabled:
  - Firebase Authentication with Google sign-in
  - Cloud Firestore
  - Firestore rules from `Docs/firebase_favorites_rules.md`
- Important user-facing setup reminder:
  - for GitHub Pages, Firebase Authorized Domains should include `cooperfu615-desinger.github.io`

## Firebase Performance State

- Firebase Favorites repository is now lazy-loaded with dynamic `import()` from `App.jsx`.
- Build output now splits Firebase into a separate `favoritesRepository-*.js` chunk.
- Recent measured production build after optimization:
  - main JS chunk: about `658 kB`
  - Firebase Favorites chunk: about `329 kB`
  - before this optimization, the main JS chunk was about `987 kB`
- Initial page render should now happen before Firebase repository initialization completes.
- `pagehide` / `visibilitychange` no longer trigger a full Firestore `replaceCloudFavorites()` flush.
- Background tab switching now only forces local prompt/Favorites persistence; cloud sync remains handled by the normal debounced Favorites sync flow.
- Build still shows Vite's existing `Some chunks are larger than 500 kB` warning, but the Firebase split is working.

## Prompt Card / Remix System

- Prompt cards support:
  - summary-level remix
  - retained / changed / adjusted diff states
  - lineage display
  - branch remix
  - delete
  - favorite toggle
  - restore from favorite
- Quick remix groups still exist and use summary / advanced group mappings.

## Prompt System State

### General

- Negative prompt output is not part of the active UI / export flow.
- `Pose` and `Special Action` remain mutually exclusive.
- `Special Action` is single-subject only.
- `Special Action: none.` and `Pose: none.` no longer appear in structured prompt output.

### Grok Prompt Direction

- Grok remains the fuller structured prompt.
- Grok prompt now includes a `Wardrobe Integrity` line to reduce Grok Imagine's tendency to drop clothing when body-type wording is present.
- Current guard wording:
  - `preserve the specified wardrobe as complete clothing, detailed realistic fabric folds and wrinkles visible, clothing covers the body appropriately, fully clothed styling, no nudity`
- Current priority still favors:
  - subject
  - body type
  - clothing
  - pose / action
  - face / hair / expression
  - then location / lighting / camera
- This ordering was intentionally kept because Grok / Aurora tends to over-prioritize face detail if face content is too early.
- `Optical Effect: shallow depth of field...` was updated earlier to remove `natural portrait falloff` because it caused Grok Imagine to bias toward tight portrait / upper-body compositions.
- As of `083c9df`, Grok prompt output can now include a separate `Scene Accent:` line for supported night-scene combinations.

### Current Night-Lighting Research Direction

- The user is actively testing a new direction for night-city prompts where the subject should not be independently brightened beyond the background.
- This is currently **discussion / manual prompt-testing only** and is not yet a generalized engine rule.
- Main observed problem:
  - urban night prompts can still render the woman noticeably brighter than the background
  - especially when using white / off-white dresses, medium portrait framings, and longer portrait lenses such as `135mm`
  - wording like `clear facial readability` also appears to encourage unwanted subject lift
- Current proposed future rule direction:
  - subject lit mainly by surrounding ambient urban light
  - no strong frontal key light
  - no bright front fill
  - no studio-like subject lift
  - subject brightness kept close to the surrounding night scene
  - white garments remain subdued, not glowing / not overexposed
- A full manual test prompt variant was drafted for the user to A/B test against the current prompt style.
- If that manual test works well, a future session should formalize the rule in:
  - environment mood wording
  - light-style wording
  - or additional exposure guard helpers in `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js`

### Midjourney Prompt

- Midjourney output is still flattened and direct-use oriented.
- No automatic `--ar`.
- Compact wording remains preferred.

### Z-Image Prompt

- Z-Image prompt output now exists alongside Midjourney and Grok.
- There are now three copyable prompt versions:
  - Midjourney
  - Grok
  - Z-Image
- Z-Image is implemented without connecting to an LLM / prompt enhancer service.
- User explicitly chose to keep Z-Image generation local and deterministic rather than integrating an external LLM enhancer.
- Z-Image direction:
  - longer, more structured natural-language prompt
  - keep current app architecture and data-driven composition
  - no official PE automation for now

## Close-up Mode

- PAGE1 has four dedicated close-up framings:
  - `臉部特寫`
  - `胸上特寫`
  - `局部五官特寫`
  - `半臉傾斜特寫`
- Choosing one of these activates close-up mode.
- Close-up mode automatically disables or clears non-face-relevant wardrobe / pose fields.
- `胸上特寫` is the only one that still keeps limited upper-clothing options.
- User explicitly reviewed this behavior and accepted it.
- Important consequence:
  - if everything is set to Random, some outputs will intentionally have no visible top / bottom when a close-up framing is randomly chosen
  - this is expected and should not currently be “fixed”

## Random Logic State

- Wardrobe random routing was upgraded.
- When core wardrobe is Random, routing now chooses among:
  - `套裝`
  - `連身`
  - separated `上身 + 下身`
- If random lands on `套裝`:
  - core clothing does not mix with separate top / pants / skirt
  - socks / shoes / small accessories can still randomize
- `Random` itself does not intentionally choose `全無` for core wardrobe items.
- Many earlier “conflict” cases came from close-up framing rules rather than wardrobe random itself.
- Additional random-conflict reduction was already added:
  - close-up framings do not randomly keep irrelevant pose
  - close-up framings do not keep unrelated lower-body clothing
  - indoor / underground scenes are more protected from obviously outdoor sky-like lighting combinations
  - outdoor scenes do not randomly choose the `鏡子自拍姿勢` pose family, because Grok Imagine often generated an actual mirror into outdoor scenes
- `Random` still intentionally excludes `全無` for most core content choices.

## Scene System State

- PAGE1 now has a separate `場景屬性` control:
  - `未指定`
  - `室內`
  - `戶外`
- `場景` options are filtered by `場景屬性`.
- Random scene selection also respects this filter.
- Scene-dependent lighting / light-direction filtering still exists and continues to work.

### Contextual Night Scene Accent Layer

- As of `083c9df`, PAGE1 prompt assembly now includes a new dynamic `Scene Accent` layer for supported outdoor night-scene combinations.
- This logic lives in `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js` and does **not** require rewriting the raw location database entries.
- Intended scene-assembly structure is now:
  - base `Location` stays neutral / physical
  - `Environment Mood` defines time-of-day and atmosphere
  - `Scene Accent` adds scene-reaction details when compatible
  - `Light Style` remains responsible for subject-light behavior

#### Current Triggered Night Moods

- `月光夜色`
- `藍調傍晚`
- `夜晚街燈`

#### Current Scene Profiles

- `urban_street`
- `urban_waterfront`

#### Current Accent Behavior

- `urban_street` examples:
  - moonlit:
    - softly lit windows
    - glowing vending machine panels
    - sparse street lamps
    - faint distant building lights
  - blue hour:
    - early practical lights appearing
    - dim interior windows
    - vending machine glow becoming visible
  - streetlit night:
    - lit windows
    - glowing vending machines
    - street lamps casting soft pools of light
- `urban_waterfront` examples:
  - moonlit:
    - sparse skyline lights
    - distant harbor / city lights
    - faint reflections from practical light sources
  - blue hour:
    - city lights beginning to emerge
    - illuminated windows across the skyline
    - subtle harbor and building lights in the distance
  - streetlit night:
    - layered building lights
    - brighter harbor / city light points
    - subtle artificial-light reflections

#### Current Injection Targets

- Grok structured prompt:
  - emits `Scene Accent: ...`
- Z-Image prompt:
  - appends accent into the scene sentence
- Midjourney-style flattened prompt:
  - appends a shorter accent clause to the location phrase
- Duo scene anchor:
  - also includes the accent when applicable

#### Important Guardrail

- Purely natural scenes such as beach / grassland / tatami-like contexts are intentionally excluded from the night-accent layer so they do not gain urban light artifacts.

#### Verified Local Cases During Implementation

- `戶外：社區自動販賣機旁 + 月光夜色`
  - now emits vending machine / window / streetlamp accent wording
- `戶外：城市遊艇碼頭欄杆旁 + 藍調傍晚`
  - now emits skyline / harbor lights beginning-to-appear wording

### Recent Japanese Lifestyle Scene Additions

- Added:
  - `室內：女高生房間`
  - `室內：日式和室`
  - `室內：日本學校教室`
  - `室內：辦公室茶水間`
  - `戶外：日本住宅陽台曬衣架旁`
  - `戶外：日本住宅外樓梯間`
  - `戶外：社區自動販賣機旁`
  - `戶外：辦公大樓人行道（上班途中）`

### Other Recent Scene Additions

- `戶外：目黑川旁的櫻花隧道`
  - refined to avoid generic two-row cherry avenue framing
  - intended framing is bridge foreground + river + one-side sakura + city
- `戶外：大阪道頓堀心齋橋河道`
- `戶外：清澈海灣岩岸`
- `戶外：岩洞感海灣淺灘`

## Wardrobe System State

### Structural Changes

- `連身 (Dresses)` is now a dedicated category.
- `無袖連身洋裝` and `細肩帶連身洋裝` were moved there from `裙裝`.
- `連身` is treated as a single one-piece outfit covering upper + lower body.
- It can still combine with:
  - outerwear
  - shoes
  - legwear
  - accessories

### Recent Dress Refinement

- `細肩帶蕾絲棉質迷你洋裝` was updated in `083c9df`.
- Previous wording leaned more toward:
  - visible underbust gathering
  - lace panels across bodice and waist
  - a more shaped summer mini dress
- Current wording now aims closer to:
  - loose layered lace mini dress
  - no defined waistline
  - relaxed shapeless / babydoll-like hang
  - opaque inner slip layer under a sheer floral-lace outer layer
  - airy loose-hanging body
  - softly scalloped semi-sheer lace hem
- Current `en` entry:
  - `spaghetti-strap loose layered lace mini dress, delicate shoulder straps, soft straight-to-gently-curved neckline, relaxed shapeless babydoll silhouette without a defined waistline, lightweight opaque inner slip layer under a sheer floral-lace outer layer, airy loose-hanging body, subtle lace texture throughout, softly scalloped semi-sheer lace hem, easy breezy summer one-piece silhouette`
- User briefly questioned whether the result might still read as having waist shaping, but then explicitly said to ignore that concern for now because the final wording conclusion already emphasizes `無腰身`.

### Outerwear

- Added `外套穿法`:
  - `正常穿著`
  - `滑落肩部`
- Added:
  - `人造毛皮草外套`
  - `寬鬆西裝外套`
  - `合身西裝外套`
- All `top + outerwear` combinations now favor a short merged prompt format rather than two loose lines.
- This was done because separate top / outerwear wording was causing frequent shoulder and layering conflicts.
- A tested special-case remains for:
  - `比基尼 + 人造毛皮草外套 + 正常穿著`
  - this combo was tuned with a short merged wording because it tested best in Grok Imagine.

### Head Accessories

- New `頭部配件` control exists.
- Current entries include:
  - `耳罩式耳機（戴在頭上）`
  - `耳罩式耳機（掛在脖子上）`
  - `有線耳機`
- Two headphone variants were later refined toward:
  - Marshall Major V black
  - AirPods Max silver

### Shoes / Color Pool

- Branded sneaker options were added:
  - `ADIZERO EVO SL JS4506`
  - `Samba OG`
  - `Nike P-6000`
  - `Onitsuka Tiger Mexico 66`
- Shoe colors were expanded with stronger vivid / fluorescent options.
- Garment color pool was also rebalanced by adding more vivid colors, which reduced the previous “green appears too often” feeling in Random tests.
- User tested this and reported that the current result feels much better.

### Outfit Presets and Recent Wardrobe Additions

- Added and refined multiple outfit presets and garments, including:
  - generalized monochrome long shirt + pleated skirt preset
  - gothic off-shoulder dress preset with fixed black details and variable main color
  - silver halter mini dress preset
  - high-neck high-cut bodysuit variants
  - multiple lifestyle and swimwear refinements
  - `長版寬鬆麻花針織毛衣`
  - the refined `細肩帶蕾絲棉質迷你洋裝` wording above

### Graphic / Graffiti Pattern Expansion

- Top and bottom surface-design prompts were expanded for more random variety.
- The original generic punk / cartoon graffiti entries remain, but more specific variants were added.
- Punk graffiti variants now include:
  - black-and-white punk slogan graffiti
  - red-and-black punk flyer / band-poster graffiti
  - sticker-bomb punk collage
  - spray-paint tag graffiti
  - skull / safety-pin punk doodle language
- Cartoon graffiti variants now include:
  - cute character doodles
  - quirky cartoon monster doodles
  - comic speech-bubble / action-mark doodles
  - pastel diary-like doodles
  - cartoon sticker collage prints
- This was done in `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base/wardrobe_and_styling.md`, then synced to `webapp/src/data/database.json`.

## Character / Body / Hair State

### Body Types

- `正常人` was removed from body types.
- Body type prompts were later rewritten again to reduce Grok Imagine nudity risk.
- High-risk body wording was removed or avoided:
  - `lingerie model body`
  - `fuller bust and hips`
  - `exaggerated hourglass`
  - `pronounced bust-waist-hip contrast`
  - `voluptuous proportions`
- Current body-type entries:
  - `模特兒`
  - `優雅曲線模特兒`
  - `柔和沙漏身形`
- Current direction:
  - use fashion / editorial proportion language
  - preserve tall, long-legged, elegant styling
  - avoid pushing Grok Imagine toward naked body-curve rendering
  - reinforce that curves appear under properly worn clothing where needed
- Related Grok guard is implemented in `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js` as `Wardrobe Integrity`.

### Hair

- Hairstyle list was recently pruned and regrouped.
- Display names are now grouped into:
  - `長髮（放髮）｜...`
  - `長髮（綁髮）｜...`
  - `短髮｜...`
- Some overlapping styles were removed, with user-approved keeps such as:
  - `韓系深側分柔波長髮`
  - `及肩內彎鮑伯`
  - `中短層次鮑伯`
- Hair color system remains realism-oriented:
  - real strands
  - subtle root variation
  - no plastic wig texture

## Special Action State

- Special action library expanded significantly during recent sessions.
- Recent additions include:
  - `靠牆站立`
  - `靠牆坐姿`
  - `跪姿前傾倚靠高背`
  - `靠牆後仰站姿`
  - multiple lipstick / lollipop / coffee / lounge / wall / recline refinements
- Lipstick actions were split for better control:
  - clean application
  - messy / outside-the-lip-line application
- `塗歪口紅` was explicitly updated to require the lipstick to be visibly held and applied, not just the smeared result.

## Library Editor

- Library Editor remains browser-draft based.
- It does not write markdown files directly.
- It supports:
  - choose group/category
  - search entries
  - edit `zh / en / desc`
  - create entry
  - save browser draft
  - reset to built-in library
  - generate one test card from current locks
  - copy draft summary

## Implementation Notes

- Markdown KB edits should always be followed by:
  - `python3 scripts/sync_to_json.py`
- Then validate with:
  - `npm run lint` from `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`
  - `npm run build`
- Continue using `apply_patch` for manual file edits.
- Recent validation after `083c9df`:
  - `npm run build` passed
  - local node-based prompt generation checks were run against:
    - `戶外：社區自動販賣機旁 + 月光夜色`
    - `戶外：城市遊艇碼頭欄杆旁 + 藍調傍晚`
  - both confirmed the new `Scene Accent` layer was emitted correctly
- Recent validation after `147f088`:
  - `npm run lint` passed
  - `npm run build` passed
  - build output kept Firebase in a separate `favoritesRepository-*.js` chunk
- If a first `git push origin main` says `Everything up-to-date` right after commit, verify with:
  - `git status -sb`
  - `git rev-parse HEAD`
  - `git rev-parse origin/main`
- This repo has occasionally hit stale `.git/index.lock`; removing it is safe only after confirming no other git process is running.

## Good Next-Step Context

- High-value PAGE3 next steps:
  - add more real-city scene subjects
  - add more Japan-specific lifestyle / city / station / neighborhood scene types
  - keep improving city landmark phrasing without turning every scene into a postcard
- High-value PAGE1 next steps:
  - continue random-conflict tuning as more wardrobe and scene categories are added
  - consider whether some scene groups should get stronger indoor / outdoor compatibility rules
  - keep evaluating merged `top + outerwear` prompt behavior across more clothing pairs
  - if the user approves the new night-city exposure direction, formalize a rule so subjects in city night scenes are not automatically brightened beyond the background
  - likely implementation area for that future work:
    - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js`
    - especially environment mood wording, light-style wording, or extra exposure guard helpers
- High-value content expansion:
  - more Japanese everyday locations
  - more office / school / commute scenes
  - more one-piece dresses and layered outerwear combinations

## 2026-04-28 Latest State

### Recent Mainline Commits

- Recent pushed commits after the older sections above:
  - `1f18e29 Add SUNO styles builder`
  - `9862d35 Refine wardrobe reroll decision flow`
  - `947bbde Refine AI and Z-Image prompt outputs`
  - `6a4aab2 Fix none leakage in prompt outputs`
  - `08b45b1 Fix stale wardrobe lock states`
  - `a517b94 Allow bottoms in chest-up closeup mode`

### PAGE1 / Workspace UX

- PAGE1 was reworked into a left / center / right workspace layout:
  - left: section navigation and workspace actions
  - center: active control group editor
  - right: live prompt preview
- `SAVE` in `LIVE PROMPT PREVIEW` no longer creates a normal feed card.
- `SAVE` now means: directly add the current prompt into favorites / `Saved Cards`.
- `Saved Cards` was simplified:
  - removed reroll
  - removed prompt backfill
  - removed in-card favorite toggle
  - removed quick keep / style-regenerate style actions
  - kept only prompt content + copy buttons
- `Settings` button now visually matches the main tab buttons and uses text instead of a gear icon.
- `Prompt Workspace` now includes:
  - `隨機生成`
  - `清除已選`
  - `全部隨機`
  - `全部全無`
  - `回填 Prompt`

### Prompt Roles

- Current prompt families are:
  - `Grok`
  - `Z-Image`
  - `AI`
- Their intended roles are now:
  - `Grok`:
    - most complete
    - structured
    - closest to direct selection fidelity
  - `Z-Image`:
    - derived from Grok-style content
    - rewritten into natural-language prompt flow
    - still keeps full selection meaning
  - `AI`:
    - highly simplified
    - preserves only:
      - subject core
      - main outfit
      - whether eyewear exists
      - main scene
      - core camera
      - core lighting
      - one or two atmosphere terms
- Important recent bugfix:
  - `AI` / duo prompts no longer leak strings such as:
    - `woman 1 with none, woman 2 with none`

### Random / Reroll Logic

- Wardrobe reroll logic was rewritten into a safer decision tree.
- Main-body wardrobe now resolves in this order:
  - outfit preset
  - dress
  - top
  - pants
  - skirt
- Key rules:
  - first real specified value wins as the reroll starting point
  - unresolved branches continue downward
  - top and bottom are protected from accidental empty results
  - reroll should preserve explicitly chosen values instead of overwriting them
- Secondary styling layers are now handled independently:
  - legwear
  - outerwear
  - accessories
- `none` remains acceptable in secondary layers, but those layers should not clear each other.

### Duo System

- Duo-specific wardrobe support was added earlier and remains active:
  - separate duo layer controls
  - separate duo accessory controls
- Duo interaction system was restructured twice and is now stabilized around:
  - relationship / interaction strength
  - duo composition pose
- Current `雙人互動` options:
  - `陌生`
  - `有距離`
  - `靠肩`
  - `親密`
  - `性感擁抱`
- Current `雙人構圖姿態` options:
  - `並肩站立`
  - `前後站立`
  - `並肩行進`
  - `前後行進`
  - `彼此倚靠`
  - `左右靠牆`
  - `蹲姿`
  - `站＋蹲`
  - `跪姿`
  - `跪＋蹲`
  - `坐姿`
  - `坐＋蹲`
  - `側躺`
  - `側躺＋坐`
  - `仰躺`
  - `仰躺＋側躺`
  - `俯臥`

### Scene / Set Updates

- `CRT 電視牆攝影棚` was revised:
  - screens are now stacked in uneven heights instead of forming a perfect flat wall
  - many CRTs should be on
  - screens may show:
    - the subject
    - broadcast / news imagery
    - static / visual noise
    - analog interference

### SUNO Tab

- New `SUNO` tab was added as a `SUNO Styles Builder`.
- Current supported fields:
  - music genres
  - core instruments
  - BPM range
  - groove
  - vocal traits
  - texture / atmosphere
- Current BPM range choices are intentionally broad:
  - `40~60`
  - `50~70`
  - `50~80`
  - `60~90`
- `Saved Cards` now also supports SUNO entries.

### Close-Up / Lock-State Fixes

- Two important PAGE1 lock-state fixes were made:
  - stale invalid wardrobe values are normalized instead of silently continuing to lock controls
  - `胸上特寫` no longer blocks editing of:
    - pants
    - skirt
    - bottom color
    - bottom pattern
- This means chest-up framing is now treated as compatible with lower-body prompt control even if the crop is upper-body-focused.

### Clothing Refactor: Phase 1 / Phase 2

- A two-phase wardrobe cleanup was started to normalize top / bottom clothing prompts.
- Core new controls added to PAGE1:
  - `上身版型`
  - `上身穿法`
  - `下身版型`
  - `下身腰線`
- Current option sets:
  - `上身版型`:
    - `正常`
    - `合身`
    - `緊身`
    - `oversize`
  - `上身穿法`:
    - `正常穿著`
    - `紮入下身`
    - `半紮`
    - `自然放出`
    - `下擺打結`
  - `下身版型`:
    - `正常`
    - `合身`
    - `緊身`
    - `寬版`
  - `下身腰線`:
    - `高腰`
    - `正常腰線`
    - `低腰`
    - `超低腰`
- These controls are now wired into prompt generation, not just UI display.
- Prompt language for tops / bottoms was intentionally shifted toward:
  - design direction
  - silhouette
  - cut
  - surface / fabric construction
  - reduced scene-like phrasing

### Current Name Normalization Direction

- Examples already normalized:
  - `合身襯衫` -> `襯衫`
  - `短版棉質露臍小可愛` -> `棉質細肩背心`
  - `合身削肩針織上衣` -> `削肩針織上衣`
  - `短袖貼身上衣` -> `短袖上衣`
  - `高腰直筒牛仔褲` -> `直筒牛仔褲`
  - `牛仔熱褲` -> `牛仔短褲`
  - `真理褲` -> `超短運動短褲`
  - `亮面緊身皮短褲` -> `皮革短褲`
  - `低腰寬褲` -> `寬褲`
  - `超低腰短褲` -> `短褲`
  - `緊身亮面皮裙` -> `皮革迷你裙`
  - `低腰長裙` -> `長裙`
  - `高腰窄裙` -> `短窄裙`
- Additional phase-2 normalization now also includes examples such as:
  - `合身高領針織上衣` -> `高領針織上衣`
  - `高領高衩連身彈性上衣` -> `高領連身上衣`
  - `高領高衩連身羅紋上衣` -> `羅紋高領連身上衣`
  - `寬鬆襯衫` -> `長版襯衫`
  - `貼身瑜珈褲 / leggings` -> `leggings`
  - `寬鬆運動棉褲` -> `運動棉褲`
  - `寬鬆尼龍工裝褲` -> `尼龍工裝褲`
  - `破壞抽鬚牛仔寬褲` -> `破壞牛仔寬褲`
  - `亮面貼身皮褲` -> `亮面皮革長褲`
  - `亮面乳膠緊身長褲` -> `乳膠長褲`
  - `亮面乳膠緊身短褲` -> `乳膠短褲`
  - `合身迷你裙` -> `迷你裙`
  - `包臀短裙` -> `窄身短裙`

### Legacy Mapping

- Because many wardrobe item names changed, `legacyIds` support was added in the wardrobe catalog build process.
- Old stored selection ids can now map onto renamed entries during normalization instead of silently becoming invalid.
- Relevant implementation lives in:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/data/database.json`

### Important Current Dirty-Tree Note

- If this handoff doc is being updated together with current wardrobe refactor work, expected dirty files may include:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/conversation_handoff.md`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/App.jsx`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/Page1Workspace.jsx`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/data/database.json`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base/wardrobe_and_styling.md`

### Recommended Next Wardrobe Step

- Continue reducing cases where a single item name still hardcodes:
  - fit
  - rise
  - tucked / untucked behavior
  - situation-like styling language
- Best next candidates:
  - remaining shirt / blouse variants
  - remaining cropped top variants
  - remaining bodycon / fitted skirt variants
  - any pants or skirts still implicitly encoding low-rise or tightness in the base item name
