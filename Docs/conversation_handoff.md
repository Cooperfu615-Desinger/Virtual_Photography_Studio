# Virtual Photography Studio Handoff

## Snapshot

- Repo: `/Users/cooperfu/Desktop/Virtual_Photography_Studio`
- Frontend: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`
- App type: Vite + React frontend-only prompt generator
- Knowledge base source: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base`
- Sync script: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/scripts/sync_to_json.py`
- Synced data target: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/data/database.json`

## Current Working State

- Latest pushed commit on `main`: `0d6275d Add missing top stripe pattern variants`
- Working tree has no tracked code changes pending
- Untracked docs currently present and intentionally untouched:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/DUO_MODE_DESIGN_BRIEF.md`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/analysis_report.md`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/conversation_handoff.md`

## Main Code Areas

- Prompt engine:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js`
- Main app / lock controls / remix flow:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/App.jsx`
- Result card UI:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/PromptCard.jsx`
- Shared styles:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/index.css`

## Important Product Behavior

- The app remains a direct prompt-generation tool with no backend.
- The project still mostly commits directly to `main`.
- `Subject Count` now supports 3 modes:
  - `1 位`
  - `2 位`
  - `上傳人物`
- `上傳人物` is prompt-only guidance:
  - no in-app upload was added
  - prompt text tells Midjourney / Grok / Gemini to use the attached reference image as the primary facial-identity guide
- Control bar shortcuts now include:
  - `All Random`
  - `All None`

## Card / Remix System

- Prompt cards are no longer simple static result cards.
- Card behavior now includes:
  - summary-level lock-aware remix
  - explicit retained / changed / adjusted diff states
  - quick remix buttons:
    - `保角色 DNA`
    - `保表情姿勢`
    - `保整體服裝`
    - `保場景鏡頭`
  - lineage display on each card
  - branch remix flow that keeps the original card
  - per-card delete button in the top-right action area
- Card lineage is tracked in prompt data and rendered in `PromptCard.jsx`.
- Deleting a card removes it consistently from feed and favorites.

## Prompt-System Rules

### Subject / Character

- Base subject wording still explicitly anchors age at 20 years old.
- Locked character details were made more persistent across remix.
- Character lock behavior now more reliably preserves:
  - facial features
  - skin details
  - hairstyle
  - hair color
  - pose
- Character summary display was reworked to be more stable and less misleading than the older truncated summary approach.

### Grok Prompt

- Grok output remains the fuller structured version.
- Grok still emits explicit sections such as:
  - `Subject Count`
  - `Location`
  - `Framing`
  - `Angle`
  - `Orbit Angle`
  - `Lens`
  - `Optical Effect`
  - `Environment Mood`
  - `Light Style`
  - `Film`
  - `Expression`
  - `Pose`
- Accessory formatting in Grok is customized:
  - `眼鏡 / 耳環 / 頸部 / 腕部 / 戒指` append after `Subject Count`
  - `腰部` appends to `Pants` or `Skirt` first

### Midjourney Prompt

- Midjourney prompt is still structured, not a single comma-run sentence.
- Current Midjourney section priority is:
  - `Subject`
  - `Hair`
  - `Location`
  - `Clothing`
  - `Lens & Optical`
  - `Lighting & Mood`
  - `Film Style`
  - `Expression`
  - `Pose & Gesture`
  - `Accessories`
- `Framing & Composition` was intentionally removed from Midjourney output.
- The visible aspect-ratio line remains removed; only the tail command is kept:
  - `--ar 2:3`
- A recent high-pressure test case confirmed the current structure stayed within Midjourney length constraints:
  - sample length: `969` characters
- Goal of the latest Midjourney refactor:
  - fully preserve `Location`
  - fully preserve main `Clothing`
  - sacrifice lower-priority sections first if needed

## Current Taxonomy Highlights

### Photography Styles

- Added Japanese photography presets:
  - `Masumi Ishida（石田真澄）`
  - `Orie Ichihashi（市橋織江）`
  - `Yoko Takahashi（高橋ヨーコ）`
- Their wording was tuned toward:
  - lighting
  - color palette
  - texture / film feel

### Camera / Lighting

- `星芒高光` was removed from `光學效果`.
- `鏡頭焦段 (Focal Length)` remains active and uses simpler English wording like:
  - `shot on 50mm lens`
- `環境光氛` and `光線表現` remain the active lighting model.

### Locations

- Studio solid-color backdrops now include:
  - `室內：純藍背景`
  - `室內：純橘背景`
  - `室內：純紅背景`
  - `室內：純黃背景`
  - `室內：純紫背景`
  - `室內：純綠背景`

### Outfit Presets / Colors

- Outfit preset colors are active and already wired through prompt generation.
- Supported preset color directions include values like:
  - `白`
  - `黑`
  - `紅`
  - `藍`
  - `綠`
  - `黃`
  - `黑白`
  - `黑紅`
  - `白紅`
- Important recent color-compatibility change:
  - `復古雙排釦洋裝套裝`
  - `玫瑰哥德蘿莉塔洋裝套裝`
  - both were rewritten so fixed color words no longer fight `套裝配色`

### Recent Outfit Preset Additions

- `復古雙排釦洋裝套裝`
- `玫瑰哥德蘿莉塔洋裝套裝`
- `哥德休閒針織荷葉短裙套裝`

### Surface Design Overlay System

- Surface-design overlays are now a real system, not one-off garment variants.
- Active overlay controls:
  - `上身圖案 (Top Surface Design)`
  - `下身圖案 (Bottom Surface Design)`
  - `外套圖案 (Outerwear Surface Design)`
- Top pattern system currently includes:
  - `全無`
  - `粗橫條紋`
  - `細橫條紋`
  - `細直條紋`
  - `粗直條紋`
  - `胸前龐克塗鴉印花`
  - `滿版龐克塗鴉印花`
  - `胸前卡通塗鴉印花`
  - `滿版卡通塗鴉印花`
  - `胸前復古標語印花`
- Bottom and outerwear overlays follow the same “attach onto garment prompt” model.

### Wardrobe Safety / Prompt Quality

- Short skirts no longer carry the earlier low-rise wording.
- Several sensitive tops were rewritten to emphasize garment design rather than body exposure.
- Lingerie-adjacent wording was softened toward:
  - lace pattern
  - trim
  - embroidery
  - ribbon
  - fabric layering
- Three tops now explicitly include visible white bra straps in a styling-driven way:
  - `寬鬆落肩 T 恤（紮入下身）`
  - `寬鬆落肩 T 恤（放出衣襬）`
  - `一字領上衣`

## Accessory System

- The old combined jewelry control is gone from the active flow.
- Active separate accessory controls:
  - `眼鏡`
  - `耳環`
  - `頸部`
  - `腕部`
  - `戒指`
  - `腰部`
- Recent accessory expansion highlights:
  - neck accessories were expanded with more refined fashion-jewelry options
  - earrings now have 5 concrete styles
  - `串珠手環` description was upgraded to feel less cheap
  - eyewear now includes:
    - `白色鏡框眼鏡`
    - `玳瑁色鏡框眼鏡`
    - `復古圓框眼鏡`

## Implementation Notes

- Markdown knowledge-base edits should always be followed by:
  - `python3 scripts/sync_to_json.py`
- When manually editing code, continue using `apply_patch`.
- Be careful not to stage or remove the untracked `Docs/` files unless explicitly asked.
- Recent sessions repeatedly saw a misleading first `git push origin main` that returned `Everything up-to-date` while the branch was still `ahead 1`.
  - Best practice after pushing:
    - run `git status -sb`
    - if still `ahead 1`, run `git push origin main` again

## Good Next-Step Context

- If continuing prompt-quality work, likely high-value areas are:
  - further outfit preset tuning
  - more accessory variety
  - more pattern systems / textile overlays
  - Midjourney section-priority tuning if a new truncation case appears
- If continuing UI work, likely high-value areas are:
  - more comparison tooling on prompt cards
  - better lineage browsing
  - deeper lock visibility / explainability
