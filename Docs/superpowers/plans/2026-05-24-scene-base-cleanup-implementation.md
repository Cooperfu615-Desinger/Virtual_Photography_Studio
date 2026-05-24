# Scene Base Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean the first batch of older PAGE1 scene base prompts so `Location` stays physical, concrete, and less likely to create symmetrical left-right layouts.

**Architecture:** This is a data-only change. Edit `knowledge_base/locations_and_sets.md`, run the existing sync script to regenerate `webapp/src/data/database.json`, then validate the app and spot-check prompt output. No prompt-engine code changes are expected.

**Tech Stack:** Markdown knowledge base, Python sync script, Vite/React app validation through npm scripts.

---

### Task 1: Clean First-Batch Location Entries

**Files:**
- Modify: `knowledge_base/locations_and_sets.md`

- [ ] **Step 1: Update old indoor and lifestyle scene base prompts**

Replace mood-heavy `en` prompt fragments with physical anchors. Keep the same row names and categories. Use these target directions:

```text
室內：精品飯店房間
`boutique hotel room, crisp bed with white sheets, bedside table, lamp fixtures as physical objects, upholstered headboard, curtain edge, carpet or wood floor, compact corner of an elegant guest room`

室內：現代高樓公寓客廳
`modern high-rise apartment living room, large window wall, sofa edge, low coffee table, clean shelving, rug texture, city buildings visible outside the windows, offset residential interior composition`

室內：臥室窗邊
`bedroom window area, curtain panels, linen bedding near the window, pillow edges, small bedside surface, window frame, fabric textures around an offset corner of the room`

室內：浴室鏡前 / 洗手台
`bathroom vanity area, sink counter, faucet, mirror edge, tiled wall, toiletry bottles, reflective cabinet surface, compact washroom corner`

室內：更衣室 / 試衣間
`fitting room interior, mirror edge, curtain panels, wall hook, narrow bench or small stool, compact retail changing area with close wall surfaces`

室內：電梯內
`elevator interior, reflective metal wall panels, button panel, door seam, handrail edge, compact enclosed cabin surfaces`
```

- [ ] **Step 2: Update local indoor detail scene base prompts**

Clean library, British interior, and laundromat rows so they describe objects and surfaces instead of atmosphere.

```text
室內：木造圖書館閱讀桌旁
`historic library reading table, aged wood grain tabletop, desk lamp fixture, stacked books, chair edge, nearby shelf rows, worn floor surface`

室內：木造圖書館木窗邊
`historic library window corner, wooden window frame, book stacks on a side surface, shelf edge, worn wall texture, offset reading nook`

室內：木造圖書館書車旁
`historic library book cart, stacked books, metal cart frame, worn carpet, wood floor, nearby shelf edge`

室內：木造圖書館借書台前
`historic library check-out desk, card catalog drawers, stamped paper slips, aged wood counter, shelf edge, service-counter surface details`

室內：倫敦老咖啡館角落
`old London cafe corner, dark wood table, fogged window glass, pendant lamp fixture as a visible object, muted wall panels, chair edge`

室內：英式小旅館房間
`small British inn room, floral bedding, narrow sash window, cream walls, aged wooden furniture, bedside table, compact guest-room corner`

室內：傳統酒吧二樓包廂
`traditional British pub upstairs booth, dark wood paneling, red-brown leather bench seating, small table, framed vintage prints, low lamp fixtures as visible objects`

室內：英式溫室 conservatory
`British conservatory interior, white-painted window frames, glass roof panels, potted greenery, tiled or stone floor, garden-room corner with offset plant clusters`

室內：黑膠唱片聆聽角
`British record listening corner, turntable setup, stacked vinyl sleeves, bookshelf speakers, aged wood cabinet, lamp fixture as a visible object, small side table`

室內：老式鋼琴房
`old British piano room, upright piano, sheet music stand, worn wood floor, muted wallpaper, piano bench, side wall details`

室內：地下 live house 後台
`British underground live house backstage, black curtain, road cases, guitar amp, worn posters, cable clutter, taped floor marks, equipment stacked near a wall edge`

室內：洗衣店洗衣機門前
`laundromat washer-door detail, round chrome washer door, sticker-covered machine surface, detergent residue, tiled floor, machine row cropped from one side`

室內：洗衣店角落塑膠椅旁
`laundromat waiting corner, plastic chair, wall stickers, loose clothing, washer reflections, tiled floor, corner wall junction`
```

- [ ] **Step 3: Update old nature scene base prompts**

Remove mood/style language and add asymmetric landscape anchors.

```text
戶外：草地與樹木
`small grassy park patch, uneven lawn texture, scattered tree trunks set at different distances, low shrubs, ground-level natural surface, offset tree edge`

戶外：向日葵花田
`sunflower field edge, dense sunflower stems and large yellow flower heads, uneven rows broken by leaves, soil path fragment on one side, rural field background`

戶外：霧感森林步道
`forest path edge, dark tree trunks at varied distances, uneven ground, mossy roots, leaf litter, partial trail curve, dense woodland background`

戶外：湖邊木棧道
`lakeside wooden deck edge, weathered planks, low railing section, calm water surface beside the deck, reeds or shoreline plants on one side, natural bank detail`

戶外：海邊岩岸
`rocky shoreline edge, irregular stone slabs, tide-pool pockets, rough coastal rock texture, seawater visible beside the rocks, uneven standing surface`

戶外：沙丘與風痕地景
`sand dune slope, wind-shaped sand ripples, uneven dune ridge, sparse dry grass tufts, open sandy ground plane, off-center crest line`
```

- [ ] **Step 4: Review edited rows for anti-symmetry wording**

Run:

```bash
rg -n "symmetry|symmetrical|both sides|two rows|central road|central path|tree tunnel|avenue|corridor|mood|atmosphere|cinematic|editorial|snapshot|photobook|solitude|mysterious" knowledge_base/locations_and_sets.md
```

Expected: remaining matches are either outside this first batch, intentional existing guard wording, or physical scene identity terms that should be kept.

### Task 2: Sync Generated Database

**Files:**
- Modify: `webapp/src/data/database.json`

- [ ] **Step 1: Run the markdown-to-JSON sync**

Run:

```bash
python3 scripts/sync_to_json.py
```

Expected: command exits successfully and updates `webapp/src/data/database.json`.

- [ ] **Step 2: Confirm JSON parses**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('./webapp/src/data/database.json','utf8')); console.log('database json ok')"
```

Expected output includes:

```text
database json ok
```

- [ ] **Step 3: Preserve non-location database sections**

If `npm test` shows wardrobe, shoe, accessory, or outfit failures after sync, merge only the synced `Locations` section into the pre-cleanup database so this scene-base cleanup does not overwrite unrelated database sections.

Run:

```bash
node -e "const fs=require('fs'); const cp=require('child_process'); const previous=JSON.parse(cp.execFileSync('git',['show','HEAD~1:webapp/src/data/database.json'],{encoding:'utf8'})); const current=JSON.parse(fs.readFileSync('webapp/src/data/database.json','utf8')); previous.Locations=current.Locations; fs.writeFileSync('webapp/src/data/database.json', JSON.stringify(previous,null,2)+'\n'); console.log('merged locations into previous database');"
```

Expected output includes:

```text
merged locations into previous database
```

### Task 3: Validate and Spot-Check Prompts

**Files:**
- Read: `webapp/src/lib/engine.js`
- Read: `webapp/src/data/database.json`

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint
```

Working directory: `webapp`

Expected: lint passes.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Working directory: `webapp`

Expected: build passes. The existing Vite chunk-size warning is acceptable.

- [ ] **Step 3: Spot-check changed scene prompts in generated JSON**

Run:

```bash
node -e "const db=require('./webapp/src/data/database.json'); const names=['室內：精品飯店房間','室內：洗衣店洗衣機門前','戶外：霧感森林步道','戶外：海邊岩岸']; for (const name of names) { for (const [group, entries] of Object.entries(db.Locations)) { const item=entries.find((entry)=>entry.zh===name); if (item) console.log(name+' => '+item.en); } }"
```

Expected: each printed `Location` text is physical and does not contain `mood`, `atmosphere`, `cinematic`, `editorial`, `snapshot`, `photobook`, `solitude`, or `mysterious`.

### Task 4: Commit Data Cleanup

**Files:**
- Stage: `knowledge_base/locations_and_sets.md`
- Stage: `webapp/src/data/database.json`
- Stage: `Docs/superpowers/plans/2026-05-24-scene-base-cleanup-implementation.md`

- [ ] **Step 1: Review diff**

Run:

```bash
git diff -- knowledge_base/locations_and_sets.md webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-scene-base-cleanup-implementation.md
```

Expected: diff contains only first-batch scene base wording changes, generated JSON sync, and this plan.

- [ ] **Step 2: Commit**

Run:

```bash
git add knowledge_base/locations_and_sets.md webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-scene-base-cleanup-implementation.md
git commit -m "Clean legacy scene base prompts"
```

Expected: commit succeeds. Existing dirty `Docs/conversation_handoff.md` remains unstaged unless the user explicitly asks to include it.
