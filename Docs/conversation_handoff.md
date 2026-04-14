# Virtual Photography Studio Handoff

## Snapshot

- Repo: `/Users/cooperfu/Desktop/Virtual_Photography_Studio`
- Frontend: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`
- App type: Vite + React prompt generator with optional Firebase Favorites sync
- Knowledge base source: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base`
- Sync script: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/scripts/sync_to_json.py`
- Synced data target: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/data/database.json`

## Current Working State

- Latest pushed commit on `main`: `147f088 Optimize Firebase loading and safer body prompts`
- Recent important commits:
  - `147f088 Optimize Firebase loading and safer body prompts`
  - `b4fd8af Expand graffiti clothing prompt variations`
  - `a3877bc Move Firebase auth into settings menu`
  - `0086d4f Add Firebase favorites sync`
  - `6067712 Improve prompt feed persistence performance`
  - `455ff28 Remove portrait falloff from shallow depth prompt`
  - `18b8069 Add Z-Image prompt output`
- Working tree should be clean after `147f088`; if this handoff doc is edited, only this doc should be dirty
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

## Scene System State

- PAGE1 now has a separate `場景屬性` control:
  - `未指定`
  - `室內`
  - `戶外`
- `場景` options are filtered by `場景屬性`.
- Random scene selection also respects this filter.
- Scene-dependent lighting / light-direction filtering still exists and continues to work.

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
- High-value content expansion:
  - more Japanese everyday locations
  - more office / school / commute scenes
  - more one-piece dresses and layered outerwear combinations
