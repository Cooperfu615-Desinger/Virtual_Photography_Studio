# Outfit Preset And Dress Cleanup Design

## Goal

Clean PAGE1 wardrobe `套裝/連身` so `套裝 (Outfit Presets)` means a clear themed outfit direction and `連身 (Dresses)` means one-piece garments that are not split into top and bottom pieces.

The cleaned system should preserve strong fashion direction while avoiding duplicated color, shoe, bag, and accessory details that should be controlled elsewhere.

## Scope

This design covers the next wardrobe cleanup batch:

- `套裝 (Outfit Presets)` rows in `knowledge_base/wardrobe_and_styling.md`.
- `連身 (Dresses)` rows in `knowledge_base/wardrobe_and_styling.md`.
- Synced data in `webapp/src/data/database.json`.
- Compatibility aliases for renamed, removed, or moved outfit and dress options.
- Focused tests for exposed option labels, color-neutral wording, and legacy lock normalization.

This batch does not redesign `特殊穿搭 (Special Outfits)`, individual tops, bottoms, shoes, legwear, accessories, character identity, scene, lighting, or photography controls.

## Current Issues

The current `套裝/連身` layer mixes several responsibilities:

- Abstract style options such as `極簡高級套裝`, `日系街頭套裝`, and `文青生活套裝` behave more like styling moods than concrete outfit structures.
- Some `套裝` rows are actually one-piece dresses, such as latex mini dresses, halter mini dresses, and gothic mini dresses.
- Several outfit prompts include fixed colors even though outfit and dress color controls already exist.
- Some outfit prompts include jewelry, shoes, legwear, bags, or other styling details that should be handled by separate wardrobe controls or by `特殊穿搭`.
- `漢服` is no longer wanted in the main outfit preset list.

The cleanup should make combinations easier to reason about:

- Outfit presets decide a clear themed clothing direction.
- Dresses decide a one-piece garment silhouette.
- Color controls decide dominant and contrast colors.
- Shoes, legwear, bags, and accessories stay outside this layer unless they are essential to a theme.

## Definitions

`套裝 (Outfit Presets)` should mean a clear themed outfit direction. Good examples include occupational outfits, uniforms, cosplay-like themes, traditional clothing, boudoir sets, swimwear sets, and visually specific fashion sets.

`連身 (Dresses)` should mean a one-piece garment that is not split into top and bottom pieces. It should not include shoes, bags, hats, eyewear, jewelry, or full styling packages.

`特殊穿搭 (Special Outfits)` remains the place for complete head-to-toe looks with detailed shoes, bags, eyewear, jewelry, and styling.

## Remove Abstract Outfit Presets

Remove these abstract style presets from `套裝 (Outfit Presets)`:

- `極簡高級套裝`
- `日系街頭套裝`
- `居家慵懶套裝`
- `文青生活套裝`
- `清爽運動套裝`
- `甜辣街頭套裝`
- `都會通勤套裝`
- `旅行度假套裝`
- `夜生活辣妹套裝`

These concepts can still be composed through individual tops, bottoms, outerwear, scene, photography style, and color controls.

## Occupational Outfit Presets

Add these clear work and occupation presets:

- `西裝長褲套裝`
- `秘書短裙套裝`
- `空服員制服套裝`
- `護士制服套裝`
- `醫生白袍套裝`

Rules:

- Prompts should describe the clothing structure and role signal without fixed color names.
- Necessary identifiers are allowed, such as an airline-style neck scarf, nurse cap, or doctor coat.
- Do not include specific shoes, bags, jewelry, or unrelated props.

## Sensual And Photo Outfit Presets

Keep these sensual, boudoir, swimwear, and costume presets, but rewrite them as short and precise prompts:

- `亮面乳膠束帶套裝`
- `鏈條緞面內衣套裝`
- `皮革馬甲束腰套裝`
- `BDSM 束縛套裝`
- `內衣寫真套裝`
- `泳裝度假套裝`
- `兔女郎套裝`
- `女僕套裝`
- `女僕風荷葉比基尼套裝`
- `玫瑰哥德蘿莉塔洋裝套裝`

Responsibility split:

- `亮面乳膠束帶套裝`: glossy latex one-piece or set, cut-outs, high-cut leg line, straps, metallic hardware, fetish couture.
- `鏈條緞面內衣套裝`: satin lingerie set, triangle bra, high-cut string bottom, chain connectors, small charms, refined boudoir mood.
- `皮革馬甲束腰套裝`: leather corset, cinched waist, sculpted cups, boning, lacing, lace or mesh accents, corset boudoir mood.
- `BDSM 束縛套裝`: leather harness, bondage straps, buckles, metal rings, restraint-inspired structure; avoid making latex the main material.
- `內衣寫真套裝`: lace lingerie, underwire bra structure, matching low-rise bottoms, scalloped trim, satin ribbon accents.
- `泳裝度假套裝`: triangle bikini top and low-rise side-tie bikini bottoms, clean beachwear silhouette.
- `兔女郎套裝`: rabbit-ear headband, fitted corset bodysuit, collar and cuffs, cabaret costume structure.
- `女僕套裝`: maid dress, apron, ruffles, headpiece, service-costume silhouette.
- `女僕風荷葉比基尼套裝`: maid headpiece, ruffled neck collar, triangle top, ruffled bikini bottom, wrist cuffs, costume-lingerie structure.
- `玫瑰哥德蘿莉塔洋裝套裝`: gothic Lolita theme, rose-print fabric, corset bodice, lace sleeves, voluminous skirt, ruffle trim.

All prompts should remove fixed color names and avoid optional shoes, legwear, jewelry, and bags.

## Traditional And Theme Outfit Presets

Keep these traditional and theme presets in `套裝 (Outfit Presets)`:

- `素色緞面旗袍套裝`
- `精緻刺繡旗袍套裝`
- `經典和服套裝`
- `輕盈浴衣套裝`
- `短袖女高生水手服`
- `長袖女高生水手服`
- `維多利亞古典套裝`
- `蘿莉塔套裝`
- `哥德休閒針織荷葉短裙套裝`

Remove these:

- `經典漢服套裝`
- `改良漢服套裝`

Traditional and theme presets should not include fixed colors unless the color is a structural contrast detail that must remain controlled by contrast palette wording.

## Fashion Outfit Presets To Keep As Concrete Structures

Keep or rewrite these only if their wording becomes concrete enough to be an outfit structure instead of an abstract mood:

- `春日巴黎亞麻長褲套裝` replacing `象牙白春日巴黎套裝`
- `長版襯衫百褶長裙套裝` replacing `全黑長版襯衫百褶長裙套裝`

Both should be color-neutral. They may describe garment structure and fabric mood, but they should not become general lifestyle mood presets.

## Dress Rules

`連身 (Dresses)` should be split by silhouette length and one-piece structure.

Short dress direction:

- `短版｜無袖迷你洋裝`
- `短版｜細肩帶迷你洋裝`
- `短版｜細肩帶蕾絲棉質迷你洋裝`
- `短版｜亮面乳膠迷你洋裝`
- `短版｜亮面深V掛脖迷你洋裝`
- `短版｜一字領哥德迷你洋裝`
- `短版｜復古雙排釦迷你洋裝`

Long dress direction:

- `長版｜無袖長洋裝`
- `長版｜細肩帶緞面長洋裝`
- `長版｜波希米亞罩衫洋裝`
- `長版｜針織長洋裝`

Remove `雛菊背心丹寧吊帶短褲連身造型` from `連身 (Dresses)` because denim overall shorts can be composed from bottom and styling controls.

Do not move qipao, kimono, yukata, or Lolita themed outfits into `連身`; keep them in `套裝` because they are stronger theme or cultural clothing directions.

## Color Rules

All `套裝` and `連身` prompts should avoid fixed color names in labels, English prompt text, and descriptions unless the color is explicitly part of a contrast-rule phrase.

Use language like:

- `dominant fabric color controlled by the outfit color selection`
- `main fabric color controlled by dress color selection`
- `contrast trim controlled by contrast palette`

Avoid names like black, white, ivory, silver, rose pink, burgundy, jewel-tone, nude beige, or deep red as fixed garment colors.

## Compatibility

Renaming, removing, and moving options can change generated ids. Implementation should preserve old saved locks where possible.

Expected compatibility behavior:

- Old abstract style presets should normalize to `全無` or the closest concrete replacement only when the replacement is obvious.
- `象牙白春日巴黎套裝` should map to `春日巴黎亞麻長褲套裝` if kept.
- `全黑長版襯衫百褶長裙套裝` should map to `長版襯衫百褶長裙套裝` if kept.
- Old dress-like outfit preset locks should migrate to the moved `連身` rows when the existing lock object can safely carry `dressId`.
- Old `玫瑰粉乳膠迷你洋裝套裝`, `銀色亮面深V掛脖迷你洋裝套裝`, `黑色細節一字領哥德洋裝套裝`, and `復古雙排釦洋裝套裝` locks should map to their new `連身` counterparts.
- Old `經典漢服套裝` and `改良漢服套裝` locks should fall back to `全無`.

Any cross-control migration from `outfitPresetId` to `dressId` must be explicit and covered by tests.

## Data Flow

Source edits:

- `knowledge_base/wardrobe_and_styling.md` for outfit preset and dress rows.
- `webapp/src/lib/engine.js` for compatibility aliases and cross-control migration if moved outfit presets become dresses.
- `webapp/src/data/database.json` generated from the Markdown source.
- Focused tests under `webapp/src/lib`.

After dictionary edits, run:

```bash
python3 scripts/sync_to_json.py
cd webapp
npm test
npm run lint
npm run build
```

The sync script updates `webapp/src/data/database.json`. The final `database.json` diff should be scoped to the `Wardrobe` section.

## Validation

Validation should confirm:

- Removed abstract outfit presets no longer appear in `outfitPresetId`.
- Work and occupation outfit presets appear in `outfitPresetId`.
- Sensual and costume presets remain but have shorter, color-neutral wording.
- Hanfu outfit presets no longer appear.
- Dress rows expose short and long one-piece silhouettes.
- Denim overall shorts no longer appear in `dressId`.
- Moved dress-like outfit preset legacy locks normalize into `dressId` when safe.
- Old renamed outfit preset locks normalize into intended replacements.
- `npm test`, `npm run lint`, and `npm run build` pass, allowing the existing Vite large chunk warning.

## Out Of Scope

This design does not tune `特殊穿搭`, individual tops, pants, skirts, shoes, legwear, accessories, special characters, scene, lighting, photography controls, or the UI panel layout beyond compatibility needed for moved outfit and dress options.
