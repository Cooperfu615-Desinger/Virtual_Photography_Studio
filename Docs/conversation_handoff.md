# Virtual Photography Studio Handoff

## Snapshot

- Repo: `/Users/cooperfu/Desktop/Virtual_Photography_Studio`
- Frontend: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`
- App type: Vite + React prompt generator with optional Firebase Favorites sync
- Knowledge base source: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base`
- Sync script: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/scripts/sync_to_json.py`
- Synced data target: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/data/database.json`

## Current Working State

- Latest pushed commit on `main`: `c51c5bc Group accessories into subject prompts`
- Recent important commits from the 2026-05-24 optimization session:
  - `c51c5bc Group accessories into subject prompts`
  - `b1147bb Refine shoes and legwear prompts`
  - `76d4fcb Refine wardrobe color picker cards`
  - `3398d7c Refine outerwear wardrobe controls`
  - `143fbdb Refine top wardrobe controls`
  - `801d91a Refine bottom wardrobe controls`
  - `d043b76 Refine top wardrobe descriptions`
  - `ada751f Improve wardrobe selection UX`
  - `cfa23f4 Add tattooed street style special outfits`
  - `44b79cf Unify outfit preset labels and palette support`
  - `1392412 Add wardrobe layering logic guards`
  - `796de07 Add six street style special outfits`
  - `86911cc Add more top bottom color palettes`
  - `a35b49f Add top bottom color card palettes`
  - `87fcd2f Naturalize Z-Image wardrobe language`
  - `28bb122 Refine office pantry scene prompt`
  - `e500f2b Enhance Page3 ruin location prompts`
  - `316d3e5 Prioritize scenes for wardrobe-heavy prompts`
  - `8f44c1b Add forward waistband grip action`
  - `37949b4 Add loosened pants waist option`
  - `5e1b341 Refine special subject character prompts`
  - `d3d13d5 Refine bohemian tunic dress preset`
  - `05aae44 Refine cropped fitted blazer wording`
  - `cf1f488 Add cropped fitted blazer outerwear`
  - `be8242b Refine train scenery and android subject`
  - `5104b04 Add crowded commuter train scene`
- Working tree should be clean after `c51c5bc`; if this handoff doc is edited, only this doc should be dirty
- Work continues directly on `main`
- Standard validation flow remains:
  - `python3 scripts/sync_to_json.py`
  - `npm run lint` from `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`
  - `npm run build`

## Session 2026-05-24 Update

This session focused on database growth, prompt stability, wardrobe simplification, and Grok / Z-Image output structure. Most edits touched `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/data/database.json` and `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js`.

### Scene / Location Updates

- Added a new indoor base scene:
  - `室內：電車車廂坐滿與站滿乘客`
  - Direction: Japanese commuter train during rush hour, packed with seated and standing passengers, with everyday-life density.
- Added outside-window scenery supplements to the three train-related scenes:
  - urban city scenery
  - countryside scenery
  - seaside scenery
  - These descriptions intentionally avoid day/night, lighting, and time-of-day wording; they only describe possible scenery outside the train windows and let the model choose one.
- Enhanced five PAGE3 special ruin locations:
  - stronger abandoned / ruined feeling
  - more clutter, damaged structures, old broken surfaces, grime, disorder, and plants growing everywhere
  - no extra people should appear; only the photographer / viewer presence is implied.
- Fixed the conflict between street-photo incidental pedestrians and empty ruin scenes:
  - when a ruin / empty special location is selected, incidental pedestrian hints are removed
  - non-ruin street scenes keep the usual incidental pedestrian language.
- Revised `室內：辦公室茶水間`:
  - removed vending-machine language
  - now describes a narrow long office pantry with small sink, coffee machine, storage cabinets, and common office break-room elements.

### Special Characters

- `日本戰國武士` and `歐洲騎士` were changed to female characters.
- Their armor descriptions were revised to emphasize feminine body shaping and female-character armor design while keeping the warrior identity.
- `女性機器人` was revised in two stages:
  - first pass: a human woman wearing a pure white mechanical suit, with black precision mechanical sections at joints, neck, waist, and other high-mobility areas, plus subtle glowing elements and optional helmet
  - current final direction: a near-human sexy female android with a real woman-like head and face, only subtle mechanical panel lines on the face, mechanical lines / block structures across the body, and black precision mechanisms at major joints.
- Female android now supports normal hairstyle and hair-color controls.

### Wardrobe Additions

- Added `緊身短版西裝外套` as an outerwear option.
- Final cropped blazer direction:
  - fitted and short
  - hem sits between the lower waist and upper hip, not above the waist
  - sharp shoulder line, long sleeves, back darts
  - double-button front, explicitly buttoned / closed.
- Revised `波西米亞刺繡蕾絲寬鬆罩衫洋裝` into the reference-style bohemian layered look:
  - loose open-knit sweater
  - layered boho skirt / wide lower silhouette
  - asymmetric lace and cloth panels
  - tassel / bead ornaments
  - shoe details are intentionally excluded.
- Added lower-body waist state for pants:
  - button undone
  - zipper slightly lowered
  - intended for pants styling only, not skirts.
- Added a special action based on the leaning-forward image:
  - body leans toward camera
  - hands near waistband / hips
  - direct gaze and dynamic forward posture
  - action only; no clothing or scene should be baked into it.

### Special Top / Bottom Color Palettes

- Added two batches of special upper/lower-body color palettes from user-provided color cards.
- Total added in this session: 29 palette options.
- Palette behavior:
  - exposed through `topBottomPaletteId`
  - applies coordinated but separate colors to upper and lower garments
  - also supports outfit preset / dress logic where relevant.
- Later wardrobe color picker UI was refined so these palette choices are easier to scan and use.

### Special Outfit Additions

- Added two rounds of image-derived special outfits, six looks per round.
- First six focused on street-style complete outfits:
  - patchwork fleece jacket with cream graphic work pants
  - red oversized tee with tan work overalls and bright boots
  - red long coat with tiger-pattern scarf
  - burgundy faux-fur jacket with mini-skirt, fishnet / tights, boots, and bag
  - brown shearling bomber with black slim pants and boots
  - black turtleneck with plaid mini skirt, tall black boots, and accessories.
- Second six focused on more detailed / tattooed street outfits:
  - green plaid jacket, dinosaur-print tee, mustard wide pants, oversized glasses, earrings, tote, sneakers
  - mint cropped floral shirt, pink floral ruffle mini skirt, pink lace-up boots, pearl necklace, rings, bag
  - blue floral vest, black leather mini skirt, visible tattoos, oversized sunglasses, crochet tote, cowboy boots
  - gray sports bra, exposed tattoos across arms / torso / neck / leg, low-slung workwear jeans, boots, keychain details
  - black studded hooded micro leather look, black mini skirt, layered necklaces, bracelets, high-top sneakers
  - brown trench coat, white cropped tee, distressed light jeans, sneakers, shoulder bag, subtle visible tattoo.
- For image-derived special outfits:
  - include visible glasses, jewelry, bags, gloves, tattoos, and styling details when requested
  - avoid unrelated temporary handheld props unless the user explicitly asks for them.

### Grok / Z-Image Prompt Structure

- User reported that `特殊穿搭` and `套裝/連身` often caused Grok Imagine to ignore the scene.
- Prompt structure was adjusted so scene/location appears earlier and stays more prominent before complex wardrobe text.
- Grok keeps a more structured format, but with scene priority improved.
- Z-Image was updated to a more natural-language wardrobe style and should no longer use `Wardrobe details:`.
- Important Z-Image wardrobe phrasing:
  - outfit only: `She wears {outfit preset}.`
  - outfit + outerwear: `She wears {outerwear}, layered over {outfit preset}.`
  - separated pieces: natural sentence form such as `She wears ... paired with ...`
  - when outerwear is combined with an outfit preset / dress / top, outerwear is described first as a layer, and the inner outfit remains explicit.
- Confirmed behavior:
  - `套裝/連身` can be combined with outerwear.
  - The outerwear should not replace or erase the outfit preset.
- The original AI prompt version was already performing better for this case and was not made identical to Z-Image.

### Wardrobe Layering Bug

- The initial suspected bug was that switching from one outfit preset to another still generated the previous white commute outfit.
- Actual root cause found during discussion:
  - when outfit preset + outerwear were selected, the model often treated the outerwear as the whole outfit and ignored the inner preset.
- Fix:
  - natural layered language for Z-Image
  - explicit outerwear-over-outfit relationship
  - layering guards in prompt composition.

### Top / Bottom Description Simplification

- Started broad database cleanup to reduce long, duplicated single-garment descriptions.
- Top garments:
  - priority items optimized first
  - secondary items optimized next
  - descriptions now focus on the garment identity and distinctive details only.
- Bottom garments:
  - pants and skirts were simplified so the base item is just the garment
  - rise / waist and fit language was removed from many item descriptions because `bottomRiseId` and `bottomFitId` control those separately.
- Prompt ordering was changed:
  - bottoms: `bottomRise` before `bottomFit` before base garment
  - tops: `topFit` before `topStyling` before base garment
- This is intended to make fit / styling controls stronger and avoid contradictions inside base garment descriptions.
- User noted fit / rise effects may still need more testing in real generations; next session can strengthen control wording if needed.

### Outerwear / Shoes / Socks Optimization

- Outerwear descriptions were simplified like tops:
  - less repeated fit / color wording
  - base description focuses on garment identity
  - `outerwearStyling` appears before the outerwear garment text.
- Socks / legwear descriptions were tightened and made less repetitive.
- Shoes were handled differently depending on type:
  - model-specific shoes keep the model name and only signature cues
  - generic shoes avoid hardcoded color wording so color controls can work.
- Example direction:
  - model-specific sneaker wording can rely on the model name, then add only key accent details such as gum sole / stripe / logo
  - generic high heels should not say black unless black is selected by the color control.

### Accessory Prompt Composition

- Latest change in this session: glasses, earrings, and neck accessories now bind into the subject/person description for Grok and Z-Image.
- User wanted a compact style similar to:
  - `A seductive stunning 20-year-old Japanese or Korean with dark round-frame glasses.`
- Current behavior:
  - single subject: accessories are grouped into the subject line, such as `with retro round-frame glasses, small pearl stud earrings, and slim metal choker`
  - duo subject: accessories are grouped per person, such as `woman 1 with ...`, `woman 2 with ...`
  - separate Grok lines like `Eyewear:`, `Earrings:`, and `Neck Accessory:` were removed.
- Neck accessories were removed from wardrobe/layer addon text so necklaces / chokers are not parsed as clothing layers.
- Head accessories remain near appearance / head-related wording and are not merged into wardrobe.
- Accessory database wording was simplified:
  - eyewear as noun phrases, such as `black-rimmed glasses`
  - earrings as noun phrases, such as `small pearl stud earrings`
  - neck accessories as noun phrases, such as `slim metal choker`
  - head accessories also simplified, but headphones / headwear still preserve head-silhouette information.

### Verification Status

- Latest validation before the handoff update:
  - `npm run test -- src/lib/engineWardrobeControls.test.js` passed, 42 / 42 tests
  - `npm run lint` passed
  - `npm run build` passed with the existing chunk-size warning only.
- The latest pushed code state before this handoff edit is:
  - `c51c5bc Group accessories into subject prompts`

### Suggested Next Session Focus

- Continue accessory-detail optimization:
  - decide whether head accessories should remain separate or get a more explicit subject-binding rule
  - audit any accessory categories beyond eyewear / earrings / neck / head if present.
- Review whether AI prompt should also mirror the new subject-bound accessory ordering, or remain closer to its current compact format.
- Continue concise database cleanup for remaining categories:
  - special outfits may remain more verbose because they are complete head-to-toe looks
  - scene / camera / lighting descriptions can be reviewed later for repetition.
- Test real-generation effectiveness of:
  - `topFit`
  - `topStyling`
  - `bottomFit`
  - `bottomRise`
  - `outerwearStyling`
  - If these controls still feel weak, strengthen their wording rather than re-adding fit/rise text into every base garment.

## Session 2026-05-17 Update

This session heavily refined PAGE1 prompt behavior, wardrobe data, Favorites usability, and supporting tools. Most changes were committed and pushed to `main`; the latest pushed code state is `4309a80`.

### Prompt Format / Prompt Engine

- AI prompt was redefined as a Grok-minimal version:
  - same category structure as Grok
  - keeps all selected option information
  - uses shorter, more model-direct phrasing
  - scene fields stay compact, such as `setting: Shibuya Station front plaza edge`, instead of copying Grok's full scene prose
- AI wardrobe prefix changed from fixed `main outfit:` to `She wearing` / same logic for duo subjects, to improve image-model clothing adherence.
- Special outfits now render with full outfit wording in all three prompt versions:
  - AI
  - Z-Image
  - Grok
- Fixed a bug where `特殊動作` could disappear from AI prompts when combined with `特殊穿搭`.
- Subject wording was changed from:
  - `an elegant beautiful 20-year-old Japanese or Korean woman`
  - to `an seductive stunning & beautiful 20-year-old Japanese or Korean woman`
  - duo subject wording follows the same direction.
- Wardrobe prompt ordering was normalized across AI / Grok / Z-Image:
  - subject-level accessories:
    - person > glasses > earrings > head accessory
  - wardrobe:
    - outerwear > top / outfit preset / dress > neck accessory > bottom > socks > shoes
- This ordering is intended to reduce missing garments and improve prompt parse stability.

### AI / Grok / Z-Image Relationship

- Final user-approved interpretation:
  - Grok = full detailed prompt
  - AI = Grok minimal version, but still includes every selected option
  - Z-Image = longer natural-language structured version
- Do not make AI and Z-Image identical.
- Do not collapse AI to only one vague sentence; keep the compact field format.

### Indoor Color Backgrounds

- Indoor color-background series was tuned toward seamless, pure, saturated single-color cyclorama wording.
- Goal:
  - avoid weak / muddy colors
  - avoid visible studio equipment
  - avoid backdrop stands, curtain folds, wall corners, props
- Example direction:
  - `seamless matte saturated pure red cyclorama`
  - one continuous color surface covering floor and background
  - clean full-bleed color field

### Optical Effects

- `前景遮擋散景` was adjusted toward a doorway / doorframe occlusion look.
- User wanted a more voyeuristic / hidden-camera feel:
  - foreground should cover at least about one third of the frame
  - left and right sides can be blocked by dark door edges or wall panels
  - subject remains visible through the center gap
- Committed as `4461b2c Strengthen doorway foreground occlusion effect`.

### Close-Up / Wardrobe Lock Rules

- Adopted the first user-proposed strategy:
  - when visible clothing is selected, tight close-up options that cannot show clothing are disabled / excluded from random.
- `臉部特寫` and equivalent tight face framings are excluded from random when wardrobe is active.
- `胸上特寫` logic was refined:
  - outfit presets are allowed
  - outerwear is allowed
  - scene/location is allowed
  - only socks and shoes are locked because they are not visible
- The previous issue where chest-up framing locked outfit presets, outerwear, or scene base was fixed through:
  - `2cdacfc Allow outfit presets in chest-up framing`
  - `e1d99a1 Allow outerwear in chest-up framing`
  - `19b2535 Allow location in chest-up framing`

### Wardrobe Structure / Controls

- `套裝` and `連身` were conceptually merged into the same top-level one-piece / preset selection path.
- A top-level `特殊穿搭` option exists:
  - when selected, all normal wardrobe pieces and accessories are unavailable
  - special outfit prompt is treated as a complete head-to-toe look
- Shoes / socks / outerwear control ordering was repeatedly refined:
  - final order in the UI should be `外套 > 襪類 > 鞋款`
  - this was fixed both in control order and display layout after the user noticed the previous change had not affected the visible order.
- Outerwear color options were aligned with top / bottom garment color options in `aa27889 Align outerwear color options with garments`.
- Outfit preset main-color options were expanded to match top / bottom color richness in `c84abf7 Expand outfit preset color options`.
- Neck accessory `皮革扣環頸鏈` was refined to specify a thin leather choker so models stop generating a belt-width collar.

### Special Outfit Database Additions

- Many image-derived special outfits were added to `webapp/src/data/database.json`.
- Special outfits are written as complete outfit blobs and should include:
  - headwear if part of the requested outfit
  - glasses / earrings / neck accessories
  - outerwear
  - top / one-piece / dress
  - bottom
  - socks / legwear
  - shoes
  - bags and jewelry when visible and requested
- Do not include temporary hand-held objects unless the user explicitly asks:
  - coffee cups, phones, bottles, food, and shopping bags are usually excluded unless clearly part of styling.
- Recent added examples include:
  - polka-dot pirate-bandana and scarf street look
  - blue-gray long coat with lace bralette and wide lace-up trousers
  - striped theatrical blazer / lace skirt gothic outfit
  - sporty bohemian black crop tank + leopard bike shorts outfit
  - lace corset / camo sheer top / layered black skirt outfit
  - grunge oversized graphic tee duo looks
  - denim jacket / washed jeans street looks
  - sequin floral black sheer set
  - red pants embroidered jacket look
  - plaid cropped tailoring with embellished ripped denim
  - brown blazer / white trouser menswear look
  - white crop tank / wide jeans look
  - black bandeau / track pants sport look
  - red varsity cardigan / plaid shorts look
  - leather jacket / cartoon knit / embellished denim look
  - olive glossy coat / cream knit / jeans look
  - white wide-brim hat / denim strapless dress look
  - rust-orange tie-dye workwear overalls + hoodie look
  - white ringer graphic baby tee + pinstripe lace mini skirt look
  - gold beret + faux fur jacket + wide indigo denim look
- Latest commit `4309a80` added:
  - `鏽橘紮染工裝吊帶褲帽T造型`
  - `白色字母短T條紋蕾絲裙靴造型`
  - `金色貝雷帽皮草外套寬牛仔造型`

### Special Actions

- Added image-derived special actions, with only the action body language and no scene props unless essential.
- Recent action concepts include:
  - relaxed side-sitting on bed / surface with one hand braced
  - knees-up sitting with both cheeks resting in hands
  - lying on back with arms relaxed near head
  - seated back-turn / over-shoulder hair-touch pose
  - lounging relaxed sprawl on ornate armchair
- These action prompts should avoid adding beds, rooms, or environmental details unless the action physically needs the support object.

### Hairstyles / Face Feature Presets

- Hairstyle list was rebalanced:
  - short hair category expanded
  - long-hair duplicates reduced
  - `油頭` was added as a short, cool, slicked-back style
  - short wolf cut was explicitly not added
- Hair prompt style references from X were analyzed and distilled:
  - keep hair length / silhouette / texture explicit
  - optionally pair hair with natural makeup mood
  - avoid overloading clothing / scene into hairstyle entries
- Face feature preset `圓潤` was replaced / repurposed toward a Japanese transparent pure look because the old wording made models generate a chubby face and sometimes a heavier body.
- New direction is more distinct from KPOP / sexy / Western face styles:
  - Japanese transparent clean beauty
  - soft pure expression
  - delicate natural proportions
  - no body-size implication

### Aspect Ratio Options

- Aspect ratios were simplified to a smaller set covering the broadest practical range.
- Final user-approved six-ratio direction:
  - `1:1`
  - `3:4`
  - `9:16`
  - `4:3`
  - `16:9`
  - one additional broad-use ratio retained per implementation
- Implemented in `9f98074 Refine aspect ratio options`.

### Scene Description Cleanup

- Indoor and outdoor scene descriptions were audited for embedded time-of-day / day-night wording.
- User asked to fix scene descriptions first, before later tuning environment mood and lighting.
- Scene base descriptions were normalized to stay physical / location-only where possible.
- Time, weather, light, and mood should be controlled by:
  - environment mood
  - lighting
  - scene accent layer
  - not raw scene base entries.
- Committed as `c84abf7 Normalize scene descriptions`.

### Favorites / Preview Workflow

- User requested easier fine-tuning after random generation.
- Chosen implementation:
  - add a button/action to apply the current live preview values back into the actual ABC option controls
  - avoids forcing every random generation to mutate visible controls automatically.
- Added `套用目前預覽` action for the live preview / selection restore workflow.
- Favorites cards also received a `套用目前預覽` button so saved cards can be used as a tuning base again.
- Favorites performance was previously optimized by compact storage / repository split and remains important because large Favorites counts had caused lag.

### Workspace Copy / UI Text

- Removed the following helper copy from the workspace:
  - `目前鎖定 43 個條件。左邊看階段、中間編輯、右邊直接校對 prompt。`
  - `一次只處理一小段，避免 prompt 在太多欄位之間互相干擾。`
  - `右側只保留 prompt 本體與複製操作，選項摘要請直接看左側工作台。`

### SUNO Styles Builder

- All SUNO Styles Builder options were localized to Chinese:
  - music style
  - main instruments
  - groove
  - vocal character
  - texture / atmosphere
- `STYLES PROMPT`, `COMPACT PROMPT`, and `MOOD PROMPT` were reviewed.
- User decided to keep only `STYLES PROMPT`.
- `COMPACT PROMPT` and `MOOD PROMPT` were removed.
- Committed as `3d0990a Simplify Suno styles prompt builder`.

### Validation Used During This Session

- For data-only changes:
  - `node -e "JSON.parse(require('fs').readFileSync('./webapp/src/data/database.json','utf8')); console.log('database json ok')"`
  - `npm run lint`
  - `npm run build`
- Last validation before `4309a80`:
  - JSON parse passed
  - `npm run lint` passed
  - `npm run build` passed
  - build still emits the expected large chunk warning, but completes successfully.

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
  - `骷髏`
  - `上傳人物`
- `上傳人物` is still prompt-only guidance:
  - no in-app upload exists
  - generated prompt expects the user to attach the same reference image directly in the target image tool
- `骷髏` is now a dedicated special-subject mode:
  - standalone subject only
  - full human skeleton
  - deep blue-black bone tone
  - clean specimen / surreal installation feel
  - no wardrobe generation
  - scene / camera / lighting / style remain active
- Main controls still include:
  - `隨機生成`
  - `清除已選`
  - `All Random`
  - `All None`
- `加入最愛` in live preview now saves directly to `Saved Cards`
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

## 2026-05-03 / 2026-05-04 Latest State

### Recent Mainline Commits

- Recent pushed commits after the older sections above:
  - `ad2d906 Refine garter stocking prompt details`
  - `4377620 Polish skeleton workspace UI`
  - `f46327e Refine framing prompts and skeleton posing`
  - `83e57e2 Add skeleton special subject mode`
  - `f4e2f8b Refine AI footwear prompt details`
  - `6ee71df Refine AI wardrobe layering output`
  - `40a8943 Prioritize outerwear in prompt layering`

### Prompt Family State

- PAGE1 prompt roles are now explicitly defined as:
  - `Grok`
    - full structured prompt
    - closest to exact control fidelity
  - `Z-Image`
    - natural-language version derived from the same deterministic selection data
    - still keeps most full control meaning
  - `AI`
    - intentionally simplified
    - keeps:
      - subject core
      - main outfit
      - eyewear if present
      - main scene
      - core camera
      - core lighting
      - limited atmosphere wording
- Current copy buttons in `LIVE PROMPT PREVIEW` are:
  - `Grok`
  - `Z-Image`
  - `AI`
  - `加入最愛`

### Outerwear-First Prompt Logic

- `Z-Image` and `AI` now prioritize outerwear when outerwear exists.
- New order for those two prompt families:
  - outerwear
  - outerwear styling
  - inner top / layered upper garment
  - lower-body garment
- `Grok` was intentionally left more structured and was not converted to this flattened order.
- Related commits:
  - `40a8943 Prioritize outerwear in prompt layering`
  - `6ee71df Refine AI wardrobe layering output`

### AI Footwear / Legwear Refinement

- `AI` prompt output now keeps:
  - sock / legwear color
  - shoe style silhouette
- This applies to both single and duo generation.
- Earlier duplication bugs in duo footwear wording were fixed.

### PAGE1 Workspace / Saved Cards UX

- PAGE1 remains the main 3-column workspace:
  - left = stage navigation + actions
  - center = focused control editor
  - right = live prompt preview
- `加入最愛` from the preview saves directly to `Saved Cards`.
- `Saved Cards` was simplified and now functions mainly as:
  - prompt storage
  - prompt copying
  - source split including `SUNO`
- The extra duplicated middle description card under each subpanel was removed.
- A/B/C sections now rely on the top header copy plus the active controls only.

### PAGE1 Wardrobe Panel Structure

- `B 穿搭設定` is now split into:
  - `整體穿搭`
  - `上下身單件`
  - `配色`
  - `鞋襪與外層`
  - `配件細節`
- `上下身單件` no longer includes:
  - `連身`
  - `連身配色`
- `整體穿搭` now owns:
  - outfit preset
  - dress
- `配色` now owns:
  - outfit preset color groups
  - dress color
  - top/bottom palette
  - top color / pattern
  - bottom color / pattern

### Duo Wardrobe Restoration

- Duo-specific independent controls were restored for:
  - `整體穿搭`
    - separate dress controls for A/B
  - `上下身單件`
    - top / fit / styling
    - pants / skirt
    - bottom fit / rise
  - `配色`
    - separate palette / top color / bottom color / pattern fields
  - `鞋襪與外層`
  - `配件細節`
- Prompt generation, selection snapshots, and favorites restore all support these A/B controls again.

### Wardrobe Refactor Progress

- The wardrobe refactor now has active first-pass normalized controls for:
  - `上身版型`
  - `上身穿法`
  - `下身版型`
  - `下身腰線`
- Current option sets remain:
  - `上身版型`
    - `正常`
    - `合身`
    - `緊身`
    - `oversize`
  - `上身穿法`
    - `正常穿著`
    - `紮入下身`
    - `半紮`
    - `自然放出`
    - `下擺打結`
  - `下身版型`
    - `正常`
    - `合身`
    - `緊身`
    - `寬版`
  - `下身腰線`
    - `高腰`
    - `正常腰線`
    - `低腰`
    - `超低腰`
- Prompt wording for these fields was intentionally shifted toward:
  - silhouette
  - construction
  - styling direction
  - cut / fit
  - reduced scene-like phrasing

### Random / Reroll State

- Wardrobe reroll logic was rewritten around a more stable decision tree.
- Main-body order now resolves through:
  - outfit preset
  - dress
  - top
  - pants
  - skirt
- Explicit locks should now be respected more consistently.
- Secondary layers are handled independently:
  - legwear
  - outerwear
  - accessories
- Important duo bug fix:
  - if `outfitPresetAId` / `outfitPresetBId` were set to `隨機`, they previously could be misread as “already specified,” which caused duo main wardrobe to disappear
  - fixed in `9cfb308`

### Framing / Close-Up Refinement

- Three high-risk close-up framings were rewritten to reduce split-face / multi-face artifacts:
  - `臉部特寫`
    - now:
      - `tight facial close-up portrait, face dominant in frame, balanced proportions, clean frontal readability`
  - `局部五官特寫`
    - now:
      - `tight close-up focused on the eye area and upper facial structure, cropped editorial framing, strong visual tension`
  - `半臉傾斜特寫`
    - now:
      - `stylized asymmetrical close-up portrait, one side of the face emphasized, off-center framing, slight dutch angle`
- Main reasoning:
  - older wording such as `one half of the face`, `partial face`, and `entire face filling almost the whole frame` was too likely to trigger:
    - split-face renders
    - dual-surface facial artifacts
    - half-human / half-object merges

### Skeleton Special Subject Mode

- `Subject Count` now includes `骷髏`.
- Current skeleton-mode behavior:
  - one complete human skeleton only
  - no flesh
  - deep blue-black bone tone
  - clean specimen texture
  - surreal studio / installation feel
- Prompt routing:
  - no wardrobe generation
  - no face / hair / skin-detail generation
  - `Grok`, `Z-Image`, and `AI` all switch to skeleton subject text
- UI behavior:
  - left `A 人物設定` summary now displays `骷髏`
  - wardrobe panel is effectively disabled with a skeleton-specific note
  - duplicate workspace explanation card was removed
- Motion support:
  - skeleton mode now keeps:
    - `姿勢動作`
    - `特殊動作`
  - this is currently single-subject only
- Important current limitation:
  - skeleton mode still shares the general scene/camera/style system, so some neutral human-photography phrasing may still appear in style or scene text even though direct human subject language has been removed

### Legwear Detail Fix

- `膝上蕾絲吊帶襪` was refined because models often rendered only the garter hardware and omitted the stockings.
- Updated wording now explicitly includes:
  - thigh-high stocking body
  - translucent nylon hosiery texture
  - lace top band
  - matching garter straps
  - satin ribbon garter detail
- Current wording:
  - `thigh-high sheer lace garter stockings, translucent stocking legs extending above the knee, floral lace top band, matching lace garter straps and satin ribbon garter details, delicate nylon hosiery texture, refined lingerie accessory styling`
- Legwear color should still apply through the normal `legwearColor` flow; no special engine rewrite was needed.

### New Skirt Variants

- Added:
  - `多層網紗荷葉短裙`
  - `不對稱荷葉短裙`
  - `透膚蕾絲荷葉短裙`
- Existing `荷葉短裙` was kept as the base general option.
- `龐克格紋百褶裙` was also refined to include black belt / hardware detail.

### SUNO State

- `SUNO` tab exists and remains active as a styles builder.
- Current fields:
  - genres
  - main instruments
  - BPM range
  - groove
  - vocal traits
  - texture / atmosphere
- Current BPM ranges:
  - `40~60`
  - `50~70`
  - `50~80`
  - `60~90`

### Validation Notes

- Recent implementation often relied on:
  - direct node-based prompt generation checks from `webapp/src/lib/engine.js`
  - git diff verification
- `npm run build` has sometimes appeared to hang in this environment after `vite build` starts transforming, so practical validation in recent sessions has often used direct generation checks when build completion was unclear.
- If a future session needs full validation, still try:
  - `python3 scripts/sync_to_json.py`
  - `npm run lint`
  - `npm run build`

### Best Current Follow-Up Areas

- Continue reducing human-photography residue in skeleton mode:
  - scene text
  - lighting adjectives
  - style / film phrases
- Add more outfit / accessory compatibility guardrails for close-up compositions.
- Continue wardrobe normalization:
  - reduce remaining item names that still embed fit / rise / styling state
  - keep base garment names cleaner and reusable
