# Character Identity Base Cleanup Design

## Goal

Clean PAGE1 section A `身份基底` so it works as a stable character DNA layer for Japanese and Korean adult female portrait subjects.

The identity base should define subject count and lasting visual identity traits. It should not decide expression, pose, photography style, lighting, scene mood, or wardrobe styling.

## Scope

This design covers the first A-section cleanup batch:

- Subject count prompt wording in `webapp/src/lib/engine.js`.
- Identity-base dictionary rows in `knowledge_base/character_design.md`.
- Synced data in `webapp/src/data/database.json`.
- Focused compatibility and prompt-output tests where needed.

This batch includes:

- `體態 (Body Type)`
- `五官特徵 (Facial Features)`
- `膚質特徵 (Skin Details)` only for light wording cleanup if needed
- `髮型 (Hairstyle)`
- `髮色 (Hair Color)`

This batch does not redesign `神情姿態`, `特殊角色`, wardrobe, scene, lighting, or photography controls.

## Identity Rules

`subjectCount` should only decide count and the broad Japanese or Korean adult female subject direction:

- `1 位`: one adult Japanese or Korean female portrait subject.
- `2 位`: two adult Japanese or Korean female portrait subjects.
- `上傳人物`: preserve attached reference identity and likeness.

Remove overloaded default wording such as `seductive`, `stunning`, and `beautiful` from the subject-count line. Beauty, sensuality, cuteness, maturity, and editorial tone should come from body type, facial features, styling, wardrobe, and photography choices.

## Body Type

Body type becomes the main identity-base control for visible silhouette differences and can carry restrained sensuality.

Use these six options:

- `高挑時裝模特`: tall, long-legged editorial fashion model proportions.
- `優雅曲線模特`: tall fashion-model frame with balanced feminine curves.
- `柔和沙漏身形`: natural hourglass body line with clear waist and hip rhythm.
- `性感曲線身形`: mature, confident, sensual curvy silhouette in fashion portrait language.
- `運動緊實身形`: fit, toned, healthy athletic body line.
- `小隻精緻身形`: petite, polished, compact idol-like proportions.

Remove the `纖細清瘦` direction. Avoid bony, fragile, underweight, or cold-thin body language.

## Facial Features

Replace the current facial-feature set with six direct, short, easy-to-pick options:

- `韓系偶像臉`
- `日系清透臉`
- `甜美可愛臉`
- `冷感高級臉`
- `成熟性感臉`
- `混血立體臉`

Each prompt should be one concise phrase or sentence. It should describe face style and beauty direction, not detailed facial anatomy. Avoid over-specifying eyelid, cheekbone, nose-tip, and lip-cupid-bow details unless they are essential to that option.

## Hairstyle

Reduce hairstyle options from the current encyclopedia-like set into a practical portrait styling menu. Keep high-identity shapes, merge close variants, and remove options that push too strongly toward anime, cosplay, or overly narrow character design.

Keep these options:

Short hair:

- `帥氣濕亮油頭`
- `乾淨短鮑伯`
- `齊瀏海圓弧鮑伯`
- `不對稱濕感短鮑伯`
- `復古外翹短髮`

Medium hair:

- `自然層次鎖骨髮`
- `韓系柔順中長髮`
- `側分柔波中長髮`
- `半濕感中長髮`

Long loose hair:

- `直髮：中分`
- `直髮：旁分`
- `直髮：日式瀏海`
- `柔波：中分`
- `柔波：深側分`
- `柔波：瀏海`
- `濕潤感長波浪`

Tied and braided hair:

- `高位雙馬尾`
- `蓬鬆高馬尾`
- `低馬尾`
- `低包頭盤髮`
- `半綁公主頭`
- `柔和編髮造型`

Remove `俐落精靈短髮` and `姬髮式長直髮`. Long-hair labels should use the clearer texture plus parting/bangs pattern. Short, medium, tied, and braided hair can keep silhouette-based names because those structures are more important than parting.

## Hair Color

Reduce hair colors and simplify repeated realism guards. Keep enough range for Japanese and Korean portrait work while reducing noisy special colors.

Natural dark colors:

- `自然黑`
- `柔霧黑茶`
- `深咖啡棕`

Japanese and Korean salon colors:

- `栗子棕`
- `奶茶棕`
- `亞麻米棕`
- `蜂蜜焦糖棕`
- `玫瑰可可棕`
- `淺金髮`

Special fashion colors:

- `銀灰白`
- `亮桃粉`
- `寶石藍`
- `深森林綠`

Prompts should be short and should not repeat a long `visible individual strands`, `root variation`, `no plastic wig texture` guard in every row. Keep only minimal realistic dyed-hair wording where useful.

## Compatibility

Renaming and merging options can change generated option ids because ids are derived from category, display name, and row index. Implementation should preserve old saved locks for renamed or merged body, facial-feature, hairstyle, and hair-color options.

Use targeted legacy id mapping or option `legacyIds` added in engine code after catalog build. Old locks should map to the nearest new option instead of falling back to `全無`.

Merged examples:

- `齊耳法式短鮑伯`, `A 字線條鮑伯`, and `服貼光澤短鮑伯` should map to `乾淨短鮑伯`.
- `自然蓬鬆鎖骨髮` and `輕盈層次剪` should map to `自然層次鎖骨髮`.
- `韓系低包頭` and `高級感低盤髮` should map to `低包頭盤髮`.
- `瀑布編髮` and `魚骨辮` should map to `柔和編髮造型`.
- Removed or merged hair colors should map to the closest kept color where practical.

## Data Flow

Source edits:

- `webapp/src/lib/engine.js` for `SUBJECT_COUNT_OPTIONS` and any compatibility aliases.
- `knowledge_base/character_design.md` for identity-base dictionary rows.

After dictionary edits, run:

```bash
python3 scripts/sync_to_json.py
cd webapp
npm test
npm run lint
npm run build
```

The sync script updates `webapp/src/data/database.json`.

## Validation

Validation should confirm:

- `subjectCount` output no longer includes overloaded default beauty or sensuality words.
- Body type options expose the six approved body silhouettes.
- Facial feature options expose the six approved face types.
- Hairstyle options expose the approved reduced list and no longer expose removed labels.
- Hair color options expose the approved reduced list and no longer expose removed special colors.
- Legacy locks for renamed and merged options normalize into the intended new option.
- Generated Grok and Z-Image prompts still include identity-base traits in a natural order.
- `npm test`, `npm run lint`, and `npm run build` pass, allowing the existing Vite large chunk warning.

## Out Of Scope

This design does not tune expression and gaze wording, pose/action wording, special-subject descriptions, duo interactions, or prompt section ordering beyond what is required for identity-base compatibility.
