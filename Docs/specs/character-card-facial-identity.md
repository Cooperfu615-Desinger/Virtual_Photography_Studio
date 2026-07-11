# Character Card Facial Identity Specification

Status: implemented on `main` after the 2026-07-11 facial-identity optimization.

## Purpose and scope

This specification keeps the 22 formal Character Card identities visually distinct when PAGE1 or PAGE2 changes hair, wardrobe, accessories, makeup, framing, or photographic treatment. It covers only formal built-in Character Cards, their prompt serialization, and their Saved Cards compatibility contract.

It does not govern generic PAGE1 identity controls, and does not authorize the still-unintegrated image folders for Emily, Manami, Minji, Natsuki, or Shiori.

## Sources of truth and paths

`webapp/src/lib/engine/characterProfiles.js` is the single source of truth for formal-card data: identity fields, legacy compatibility string, hair, locked outfit/accessories, and preview metadata. Do not copy whole prompts into documentation or a second data file.

| Concern | Path |
| --- | --- |
| Formal profile data | `webapp/src/lib/engine/characterProfiles.js` |
| PAGE2 card shaping, layers, six copy outputs | `webapp/src/lib/characterCardLab.js` |
| PAGE1 identity resolution and renderers | `webapp/src/lib/engine.js` |
| Original reference images | `source-assets/character-cards/<character-folder>/` |
| Deployment preview | `webapp/public/character-cards/<character-folder>/<reference>.avif` |
| Preview manifest | `knowledge_base/character_reference_manifest.json` |
| Regression coverage | `webapp/src/lib/characterCardLab.test.js` and character-card engine tests |

## Profile schema

Every formal profile has the legacy fields `identityAndBody`, `hair`, `outfit`, `accessories` where applicable, and `photographicDirection`. It also has the structured fields below.

| Field | Meaning | Must contain | Must not contain |
| --- | --- | --- | --- |
| `facialGeometry` | Stable craniofacial proportions | Face outline, cheek volume/height, jaw, chin | Hair, glasses, blush, expression |
| `eyeSignature` | Stable eye structure | Shape, spacing, outer-corner direction, eyelid depth, stable lower-lid form | Eyeliner, eyeshadow, transient gaze/expression |
| `noseSignature` | Stable nasal form | Bridge height/width, length, tip form | Contour/highlight cosmetics |
| `mouthSignature` | Stable lip anatomy | Shape, cupid bow, upper/lower lip proportion, stable resting separation | Lipstick color or gloss finish |
| `skinSignature` | Stable complexion and texture | Skin tone/undertone, freckles, stable texture | Blush, contour, lighting bloom |
| `makeup` | Removable cosmetic treatment | Shadow, liner, blush, contour, lipstick treatment | Face geometry or permanent marks |
| `body` | Stable body proportion cue | Height/read, shoulders, waist, hip and leg proportions | Garments or camera crop |
| `distinctiveFeatures` | Non-negotiable identity anchors | Exactly four short comma-separated anchors covering face, eyes, nose/mouth, and a unique mark or strongest geometric contrast | Outfit, removable accessories, hairstyle as sole identifier |

`distinctiveFeatures` is intentionally separate from all replaceable styling. Eleanor's horns, red eyes, face markings, forehead sigil, and arcane linework are permanent identifiers and remain in this field.

### `identityAndBody` compatibility rule

`identityAndBody` is the historical serialized string. It is retained verbatim as `legacyIdentityAndBody` and exposed unchanged as `identityAndBody`; the structured fields do not rewrite or concatenate it. This protects stored PAGE1/PAGE2 selections, Saved Cards, older prompt consumers, and tests that consume the old schema.

New full-fidelity prompt code uses the structured blocks instead of repeating the compatible string. Compact and natural-language renderers may retain the legacy base phrase, but must append `distinctiveFeatures` once in both wardrobe modes. Never replace compatibility data with one facial subfield, and never make `face`, `skin`, and `makeup` aliases point back to one mixed string. Character Card Lab aliases resolve to `facialGeometry`, `skinSignature`, and `makeup` respectively.

## Prompt retention contract

### Full-fidelity PAGE1 and PAGE2 outputs

For a formal card, serialize identity in this order:

1. Character Profile Card label
2. `facialGeometry`
3. `eyeSignature`
4. `noseSignature`
5. `mouthSignature`
6. `skinSignature`
7. `makeup`
8. `body`
9. `distinctiveFeatures` as **Permanent identity anchors**
10. Hair and the selected hair variant
11. Outfit and accessories when the renderer includes them
12. Photographic direction

`buildGptCharacterProfileSubjectBlock()` uses the full structured sequence without repeating `identityAndBody`. `buildGptFullBodyCharacterProfileSubjectBlock()` keeps the same identity sequence and delegates clothing visibility to the full-body wardrobe section. PAGE2 GPT, headshot, four-view, full-body, Grok/Z-Image, and AI copy outputs also add the permanent anchors.

### Compact AI output

PAGE1 compact AI first uses a compact subject/base identity phrase, then appends all four comma-separated `distinctiveFeatures` fragments before hair variant and selected accessories. The anchor fragment limit is four because the current formal-card contract is exactly four anchors; do not reduce it. PAGE2 compact output places `permanent identity anchors: ...` immediately after `identityAndBody` and before hair or wardrobe.

Hair, clothes, glasses, jewelry, temporary makeup, pose, scene, lighting, camera, and color grade can vary. They must not displace, truncate, or contradict facial geometry, eye structure, nose, mouth, freckles/marks, or other permanent identifiers.

## Writing rules

### Separate stable identity from styling

- Biological facial identity: face shape, cheekbones, jaw/chin, eye anatomy, eyelids, nose, lip anatomy, skin undertone, natural freckles, stable moles, supernatural anatomy or permanent markings.
- Makeup: cosmetic liner, shadow, blush, contour, lip finish/color. It is removable and cannot carry identity alone.
- Hair: color, cut, part, fringe, waves, styling variants. It is replaceable.
- Wardrobe/accessories: garments, glasses, hats, jewelry, bags, footwear. They are replaceable unless an item is explicitly a permanent biological/supernatural feature.
- Photography: crop, focal length, light, grade, film, depth of field, and expression are rendering conditions, not anatomy.

Avoid vague interchangeable phrases such as “doll-like beauty,” “soft beautiful face,” “large pretty eyes,” “small refined nose,” “glowing skin,” “seductive expression,” or “idol-like features” unless a specific geometric cue immediately follows. Do not distinguish two cards only through hair color, eye color, outfit, glasses, makeup, or mood.

### Reconciling reference images

Use all available original images in the character's source folder. Treat a trait as stable only when it remains supported across usable views or is clearly structural in a front/three-quarter/side view. Account for perspective, focal length, head turn, facial expression, occlusion, makeup, lighting, and compression before recording a difference.

When views conflict, prefer: (1) multi-view reference sheets for geometry, (2) neutral front/three-quarter views for eye, nose, and mouth anatomy, and (3) repeated natural marks. Omit uncertain claims rather than inventing a new permanent feature. A reference-specific cosmetic or styling treatment belongs in `makeup`, `hair`, or wardrobe, not in `distinctiveFeatures`.

## Formal character identity matrix

The table is a concise maintenance aid, not a duplicate prompt store. “None” under permanent features means the four anatomical anchors are the permanent identity; it does not permit replacing them with styling.

| Name / ID | Facial outline | Eye signature | Nose signature | Mouth signature | Skin | Permanent feature | Most confusable with | Required contrast | Source folder |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 48_G / `character-48g` | Small round oval, full low cheeks, short chin | Level gray-brown round eyes, lower-lid fullness | Short low-bridge straight nose | Small rounded, fuller lower lip | Pale luminous | None | Rika, Hina | Keep narrow jaw and short nose distinct from Rika's cheek mole and Hina's rounder face | `source-assets/character-cards/48g/` |
| 29_Philippa / `character-philippa` | Long oval, high cheeks, tapered jaw | Wide-set pale gray-green almonds, level corners | Long narrow straight nose | Narrow muted-red lips | Cool porcelain | None | Koto, Mei | Keep long oval and wide-set pale eyes; do not rely on gothic hair/outfit | `source-assets/character-cards/philippa/` |
| 12_Sakura / `character-sakura` | Short heart-oval, high round cheeks | Very large wide-set blue round eyes | Low-bridge button nose | Parted peach lips, plush lower lip | Fair translucent | None | Lily | Keep short face and round blue eyes versus Lily's longer hazel almond structure | `source-assets/character-cards/sakura/` |
| 06_Hinata / `character-hinata` | Elongated oval, pointed chin | Gray-olive almonds, soft lift, shallow lids | Slim low-to-medium bridge | Even rose lips | Fair satin | None | Olivia, Chihiro | Keep elongated face and soft eye lift; not ash hair or sweater | `source-assets/character-cards/hinata/` |
| 11_Rika / `character-rika` | Petite oval, full cheeks, round jaw | Slightly close-set gray-brown rounds | Delicate low-bridge straight nose | Cushioned parted rose lips | Fair smooth | Outer-cheek beauty mark | 48_G, Hina | Preserve cheek mole and close-set eyes | `source-assets/character-cards/rika/` |
| 38_Rin / `character-rin` | Small porcelain oval, tapered jaw | Wide-set slender warm-brown almonds | Narrow straight nose, rounded tip | Defined cupid bow, fuller lower lip | Porcelain luminous | None | Hina, Yuri | Keep tapered jaw and slender eyes; glasses are removable | `source-assets/character-cards/rin/` |
| 07_Lily / `character-lily` | Long heart-oval, high cheeks | Hazel almonds, lifted corners | Slim medium bridge | Full coral lips, plush lower lip | Porcelain luminous | None | Sakura, Mei | Keep long high-cheek geometry and hazel almond eyes | `source-assets/character-cards/lily/` |
| 02_Yuri / `character-yuri` | Broad soft oval, rounded jaw | Level dark-brown round-almonds | Low-bridge rounded-tip nose | Small muted-rose, fuller lower lip | Fair smooth | None | Hina | Keep broader jaw and softer oval; glasses are removable | `source-assets/character-cards/yuri/` |
| 03_Sui / `character-sui` | Long narrow heart-oval, pointed chin | Downturned amber almonds, heavy upper lids | Narrow-bridge delicate nose | Small rose-coral cupid bow | Fair with freckles | Cheek/nose-bridge freckles | Rika, Chihiro | Preserve freckles and downturned heavy-lid eyes | `source-assets/character-cards/sui/` |
| 37_Hina / `character-hina` | Near-round small oval, full low cheeks | Level warm gray-brown round eyes | Short low-bridge nose | Small even rose-pink lips | Fair matte-satin | None | Yuri, Rika | Keep near-round face and short nose; hair/glasses are removable | `source-assets/character-cards/hina/` |
| 26_Yuna / `character-yuna` | Oval-heart, full cheeks, short round chin | Level warm gray-brown round-almonds | Smooth medium bridge | Coral-rose, plush lower lip | Fair ivory smooth | None | Chihiro | Keep short chin and rounder eye read | `source-assets/character-cards/yuna/` |
| 41_Eleanor / `character-eleanor` | Long oval-heart, high sculpted cheeks, angular jaw | Crimson lifted almonds, deep-set lids | High clean bridge | Full oxblood cupid bow | Porcelain-pale freckles | Horns, red eyes, eye markings, forehead sigil, arcane tattoos | Mei | Never remove permanent supernatural markers | `source-assets/character-cards/eleanor/` |
| 22_Olivia / `character-olivia` | Elongated oval, firm angled jaw | Deep-brown slender lifted almonds | Defined medium-high bridge | Muted rose, fuller lower lip | Warm light-olive satin | None | Mei, Hinata | Keep olive tone and firm jaw; cap is removable | `source-assets/character-cards/olivia/` |
| 08_Jiwoo / `character-jiwoo` | Small heart-oval, fine point chin | Wide-set gray-hazel lifted almonds | Narrow bridge, rounded tip | Full coral-brick cupid bow | Cool porcelain | None | Koto | Keep heart-oval, wide-set eyes, and clear double lids | `source-assets/character-cards/jiwoo/` |
| 05_Chihiro / `character-chihiro` | Long refined oval-heart, rounded-point chin | Slightly close-set light hazel-gray almonds | Slim low-to-medium bridge | Plush even coral-peach lips | Fair ivory clear | None | Yuna | Keep longer face and slightly close-set eyes | `source-assets/character-cards/chihiro/` |
| 04_Koto / `character-koto` | Small balanced oval, smooth cheeks | Cool-gray almonds, shallow lids | Clean narrow bridge | Compact muted-coral crisp bow | Cool pale porcelain | None | Jiwoo, Philippa | Keep balanced oval and shallow lids; do not use blue-black hair as the distinction | `source-assets/character-cards/koto/` |
| 00_Mei / `character-mei` | Long sculpted heart-oval, high cheeks, angular jaw | Elongated dark-brown sharply lifted almonds | High bridge, pointed tip | Full dark brick-red sharply bowed lips | Cool porcelain | None | Olivia, Eleanor, Lily | Keep angular high-cheek structure and high bridge; makeup alone is insufficient | `source-assets/character-cards/mei/` |
| 01_Rei / `character-rei` | Compact oval-heart, full upper cheeks, petite rounded chin | Slightly wide-set warm-brown almonds, level corners | Narrow straight medium-low bridge, rounded tip | Muted rose lips, soft cupid bow | Fair neutral | None | Rika, Yuna | Keep the compact heart-oval and wider eye spacing; do not add Rika's cheek mole | `source-assets/character-cards/rei/` |
| 09_Amy / `character-amy` | Slim soft oval, narrow gentle jaw | Level deep-brown round-almonds | Small low-bridge straight nose, rounded tip | Full muted-red lips, plush lower lip | Fair neutral porcelain | None | Rika, Hina | Keep the slim jaw and deep-brown eye read; beanie and red hoodie are removable | `source-assets/character-cards/amy/` |
| 10_Ji-Yoo / `character-jiyoo` | Long refined oval, high cheeks, narrow jaw | Cool gray-brown almonds, softly downturned corners | Slim high bridge, fine pointed tip | Muted berry compact cupid bow | Light neutral porcelain | None | Philippa, Mei | Keep the downturned gray-brown eyes; do not rely on black-and-crimson hanbok styling | `source-assets/character-cards/jiyoo/` |
| 13_Yui / `character-yui` | Short rounded oval, full lower cheeks | Wide-set pale hazel-gray round-almonds | Small short low-bridge rounded tip | Plush pale peach lips, shallow bow | Fair cool ivory | None | Sakura, Nana | Keep the pale hazel-gray eyes and compact round face; blonde bob is removable | `source-assets/character-cards/yui/` |
| 14_Nana / `character-nana` | Short rounded oval, broad soft cheeks | Warm-brown round-almonds, level corners | Small low bridge, neat rounded tip | Wide coral-peach lips, fuller lower lip | Warm fair beige | None | Hina, Yui | Keep warm coloring and broad cheeks; uniform and short bob are removable | `source-assets/character-cards/nana/` |

## Authoring and change workflow

### Add a formal card

1. Confirm the source folder is intentionally integrated and has a manifest-backed AVIF deployment preview. Do not promote an untracked image folder by inference.
2. Review every available source image and record uncertainty before writing profile text.
3. Add the canonical option and profile data only in `characterProfiles.js`.
4. Write the eight structured fields and exactly four short `distinctiveFeatures` anchors. Confirm at least one anchor is not hair, outfit, glasses, or makeup.
5. Add PAGE2 layer/hair compatibility only in `characterCardLab.js`; leave identity data in `characterProfiles.js`.
6. Add the concise matrix row and any necessary high-similarity pairing to this specification.
7. Add or update tests, then run the full validation sequence below.

### Modify an existing card

1. Compare all original reference views before changing a stable feature.
2. Change the narrowest structured field possible; do not rewrite `identityAndBody` unless a deliberate compatibility migration has been designed and tested.
3. Preserve the four-anchor count and update the matrix only if the stable visual rule changes.
4. Re-test the card, all prompt formats, Saved Card normalization, and its most-confusable pairing.

## Required tests and compatibility checks

At minimum, tests must verify:

- exactly 22 formal cards and non-empty structured fields;
- face shape, eye signature, nose signature, mouth signature, and one unique/permanent anchor per card;
- exactly four non-empty `distinctiveFeatures` fragments per formal card;
- `identityAndBody === legacyIdentityAndBody` for formal profiles;
- `face`, `skin`, and `makeup` resolve to distinct structured values;
- PAGE2 all six outputs, PAGE1 Gpt/full-body output, and PAGE1 compact AI preserve every anchor;
- high-similarity pair contrasts: Jiwoo/Koto, Yuna/Chihiro, Sakura/Lily, Yuri/Hina, Olivia/Mei, Rei/Amy, and Yui/Nana;
- Eleanor preserves all permanent supernatural identifiers;
- legacy profile inputs and Saved Card PAGE1/PAGE2 flows still normalize and render correctly.

Run from the repository root unless stated otherwise:

```bash
cd webapp && npm test && npm run lint && npm run build
cd ../functions && npm test && npm run lint
cd .. && python3 scripts/sync_to_json.py --check
python3 -m unittest discover -s scripts/tests
python3 scripts/check_public_assets.py
node scripts/validate_prompt_logic.mjs 200 facial-identity-audit
```

If public-assets validation reports pre-existing untracked unintegrated folders, report the blocker and leave them unchanged. Do not delete, move, add, or manifest those files to make this work pass.
