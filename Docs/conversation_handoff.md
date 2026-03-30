# Virtual Photography Studio Handoff

## Snapshot

- Repo: `/Users/cooperfu/Desktop/Virtual_Photography_Studio`
- Frontend: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`
- App type: Vite + React frontend-only prompt generator
- Knowledge base source: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base`
- Sync script: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/scripts/sync_to_json.py`
- Synced data target: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/data/database.json`

## Current Working State

- Latest pushed commit on `main`: `e90cbfe Refine face accessory wording`
- Working tree has no tracked code changes pending
- Untracked docs currently present and intentionally untouched:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/DUO_MODE_DESIGN_BRIEF.md`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/analysis_report.md`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/conversation_handoff.md`

## Main Code Areas

- Prompt engine:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js`
- Main app / page switch / library editor / Page2:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/App.jsx`
- Result card UI:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/PromptCard.jsx`
- Shared styles:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/index.css`

## Core Product State

- The app remains frontend-only with no backend.
- Work still commits directly to `main`.
- `Subject Count` still supports:
  - `1 位`
  - `2 位`
  - `上傳人物`
- `上傳人物` is still prompt-only guidance:
  - no in-app upload exists
  - prompt tells the image model to use the attached reference image as primary facial identity guidance
- Main controls still include:
  - `All Random`
  - `All None`

## Page Architecture

### PAGE1

- PAGE1 is the main prompt-generation workspace.
- It is the place for:
  - scene
  - wardrobe
  - body type
  - special action / pose
  - lighting
  - camera language
- PAGE1 no longer receives Page2 role prompt injection.

### PAGE2

- PAGE2 is now a separate character-reference builder.
- PAGE2 does **not** feed a role prompt back into PAGE1 anymore.
- PAGE2 is intended to generate face-lock / reference-image prompts, not final scene prompts.
- Current PAGE2 fields:
  - `眼睛`
  - `眉型`
  - `鼻子`
  - `嘴唇`
  - `臉型`
  - `皮膚`
  - `妝容`
- PAGE2 outputs:
  - a short `Face Anchor`
  - multiple character reference prompts
- Current reference outputs include:
  - `四角度合成一張`
  - `正面`
  - `左前 45 度`
  - `右前 45 度`
  - `側面`
  - `背面`
- The top UI now has direct `PAGE1` / `PAGE2` switch buttons.

## Library Editor

- In-app `Library Editor` exists and is usable.
- It is a browser-draft workflow, not direct repo writing.
- Current capabilities:
  - choose group/category
  - search entries
  - edit `zh / en / desc`
  - add new entry
  - save browser draft
  - restore built-in data
  - generate one test prompt from current draft
  - copy draft summary
- Draft summary export is intended to help later formal writeback into markdown knowledge-base files.
- Changes made in the editor apply immediately to prompt generation inside the browser session.

## Card / Remix System

- Prompt cards support:
  - summary-level lock-aware remix
  - retained / changed / adjusted diff states
  - quick remix buttons:
    - `保角色 DNA`
    - `保表情姿勢`
    - `保整體服裝`
    - `保場景鏡頭`
  - lineage display
  - branch remix
  - delete
- Favorites and feed stay in sync with deletes and replacements.

## Prompt-System State

### General

- Negative prompt output was removed from active UI / export flow.
- `Special Action` and normal `Pose` are mutually exclusive.
- `Special Action` is single-select and only available in single-subject mode.

### Grok Prompt

- Grok remains the fuller structured prompt.
- Grok structure was heavily reworked to prioritize:
  - subject
  - body type
  - clothing
  - action
  - then face / hair / expression
  - then location / lighting
  - camera language later
- The current ordering is intentionally biased toward “make the person exist correctly first”.
- This was done because Aurora / Grok was over-prioritizing face description and sometimes collapsing into headshot-like results or dropping outfit clarity.

### Current Grok Priority Direction

- Current intended priority is roughly:
  - `Subject Count`
  - `Body Type`
  - `Outfit Preset` or `Top / Pants / Skirt`
  - `Special Action / Pose`
  - `Facial Features`
  - `Hairstyle / Hair Color`
  - `Expression`
  - `Location`
  - `Environment Mood`
  - `Light Style`
  - `Aspect Ratio`
  - `Film`
  - `Angle`
  - `Orbit Angle`
  - `Lens`
  - `Optical Effect`
  - other accessories later

### Midjourney Prompt

- Midjourney Prompt v2 is active.
- Midjourney output is now flattened / direct-use oriented:
  - no visible section labels
  - no automatic `--ar`
- A second refinement pass already adjusted:
  - special action priority
  - angle / orbit conflicts for face-heavy actions
  - punctuation cleanup
- Midjourney is currently much more compact than older versions.

## Aurora / Grok-Specific Learnings

- Aurora / Grok was found to over-prioritize detailed face-lock text.
- Because of that:
  - Page2 no longer injects into PAGE1
  - face-heavy identity wording was reduced
  - composition / clothing / action are prioritized earlier in PAGE1 output
- This shift was based on real testing that showed overly detailed role identity text often caused:
  - headshot-like crops
  - dropped outfit details
  - reduced obedience to action / location

## Facial Feature / Face Accessory Logic

- For single-subject prompts, `Eyewear` and `Earrings` are now merged into `Facial Features`.
- Current behavior:
  - if `Facial Features` exists and face accessories are set, output becomes one combined block
  - face accessories are formatted as a single `wearing ... and ...` phrase
- Example direction:
  - `Facial Features: ... . wearing retro round glasses ... and small metallic earring detail ...`
- This was done because Grok follows face accessories better when they are attached to face description instead of emitted as detached accessory lines.
- Dual-subject prompts still keep safer separate logic.
- This face-accessory merge is the right place to extend later for:
  - nose ring
  - eyebrow piercing
  - lip ring

## Hair System Changes

- Hair color wording was extensively rewritten for realism.
- Major fixes:
  - removed ethnicity-driving hair terms like `European` / `Irish`
  - renamed hair entries:
    - `白人金髮` -> `淺金髮`
    - `愛爾蘭紅髮` -> `銅紅髮`
  - all hair colors now emphasize:
    - realistic human hair texture
    - visible strands
    - subtle root variation
    - no plastic wig texture
- High-risk hair colors also include eyebrow-protection wording so eyebrows are less likely to be dyed to match.
- A bug in none-like detection was fixed:
  - earlier, text containing `no ...` could be mistaken for “none”
  - this was causing some hair color lines to disappear from Grok

## Photography Style System

- Photography style wording was globally shortened and made less literary.
- Older long abstract tails were removed in favor of more image-controlling wording:
  - lighting
  - contrast
  - tone
  - texture
- `STYLE_PROMPT_INTROS` still exists in `engine.js`.
- Duplicate `Inspired by ...` repetition in Grok was already fixed:
  - intro remains
  - duplicated second prefix is stripped
- Added style preset:
  - `Yuki Aoyama（青山裕企）`

## Special Action System

- Special action system is active and separate from pose.
- Current special actions include items such as:
  - `塗口紅`
  - `喝咖啡`
  - `吃棒棒糖`
  - `抽煙`
  - `整理絲襪`
  - `半脫上衣整理肩線`
  - `霸氣坐在雕花單人沙發上`
  - `趴臥滑手機`
  - `側身斜躺伸腿`
  - `四足跪姿前傾`
  - `抱枕俯臥回眸`
  - `分腿跪坐仰視`
- Full-body-sensitive special actions already bias framing selection to keep limbs visible.
- Important recent tweak target:
  - `趴臥滑手機`
  - user wants the pose unchanged but gaze toward camera instead of looking down at phone
  - if not yet updated in KB, this is a likely next micro-task

## Accessory System

- Active separate accessory controls still include:
  - `眼鏡`
  - `耳環`
  - `頸部`
  - `腕部`
  - `戒指`
  - `腰部`
- However, face-adjacent accessories now behave differently in Grok:
  - `Eyewear`
  - `Earrings`
  - merged into `Facial Features` for single-subject prompts
- Accessory wording in general was also softened earlier so Grok would not over-focus on jewelry.

## Location / Scene Additions

### British Interior Set

- Added British lifestyle interiors:
  - `室內：倫敦老咖啡館角落`
  - `室內：英式小旅館房間`
  - `室內：傳統酒吧二樓包廂`
  - `室內：英式溫室 conservatory`

### British Music Interiors

- Added music-oriented British interiors:
  - `室內：黑膠唱片聆聽角`
  - `室內：老式鋼琴房`
  - `室內：地下 live house 後台`

### British Outdoor / Punk / Street-Art Set

- Added British outdoor scenes:
  - `戶外：倫敦排屋街道`
  - `戶外：雨後 mews 巷弄`
- Added East London street-art / punk scenes:
  - `戶外：Brick Lane 海報牆巷口`
  - `戶外：Shoreditch 紅磚塗鴉街`
  - `戶外：Camden 龐克街角`

## Camera / Lighting Notes

- `前景遮擋散景` wording was tightened to a more stable version:
  - `controlled foreground bokeh occlusion from a fixed out-of-focus object near the lens, soft edge blur framing the subject, stable layered depth, clean cinematic foreground veil`
- The goal was to avoid chaotic foreground blobs and make the occlusion feel physically anchored.

## Wardrobe / Prompt Safety Notes

- Wardrobe randomization no longer allows top to disappear accidentally due to `全無`.
- Top fallback logic exists so unlocked random generation does not silently remove upper clothing.
- Negative prompt UI / markdown export were removed from active usage.
- Added one more precise blouse top entry based on reference analysis:
  - `雪紡荷葉高領蝴蝶結襯衫`

## Page2 Notes For Next Session

- PAGE2 is now useful as a face-reference prompt generator, not a role injector.
- Good next-step ideas if continuing PAGE2:
  - allow one-click batch copy of all reference prompts
  - add more face options only after validating current 7-field set
  - possibly add a “4-panel sheet + back view” combined master prompt

## Implementation Notes

- Markdown knowledge-base edits should always be followed by:
  - `python3 scripts/sync_to_json.py`
- When manually editing code, continue using `apply_patch`.
- Be careful not to stage or remove untracked `Docs/` files unless explicitly asked.
- Recent sessions repeatedly saw a misleading first `git push origin main` that returned `Everything up-to-date` while a just-created commit still had not reached origin because commit and push were run in parallel.
  - safest practice after commit:
    - run `git push origin main` again if needed
    - then run `git status -sb`

## Good Next-Step Context

- High-value prompt-quality areas:
  - further Grok ordering refinement based on real renders
  - further Midjourney compactness / priority tuning
  - more face accessories:
    - nose ring
    - eyebrow piercing
    - lip ring
- High-value content expansion areas:
  - more British lighting presets
  - more British subculture locations
  - more outfit presets compatible with British interiors / punk exteriors
- High-value UI / workflow areas:
  - batch-copy tools for PAGE2 reference prompts
  - formal writeback path from Library Editor drafts into markdown KB
  - clearer indication of which prompt system parts are single-subject-only
