# C 場景與環境新增與維護規格

Last updated: 2026-05-25

這份文件定義 PAGE1 `C. 場景與環境` 的新增、修改、合併與測試規則。後續新增室內、戶外、其他場景基底、環境光條件或光線表現時，請先依照本規格檢查責任邊界、prompt 寫法、相容性標籤與測試覆蓋。

## 1. 核心原則

C 區只負責「人物在哪裡、整個場景處於什麼環境狀態、人物被什麼光照到」。它不應該偷渡人物長相、體態、神情、姿勢、服裝、鏡頭焦段、底片模擬、攝影師風格或光學效果。

整體場景主線維持：

- 場景基底要先讓畫面知道人物腳下、身後與周圍是什麼地方。
- 環境光條件負責天空、時段、天氣、室內外明暗、空氣狀態與整體色溫感。
- 光線表現負責人物受光方向、硬度、反差、投影、反射與受光色溫。
- 場景、環境光與人物受光可以互相配合，但不要在同一欄位重複寫完整攝影語言。

Prompt 應使用短而準的英文片語。中文描述用來幫助維護者理解空間與光線方向，英文 prompt 用來控制生成結果。

## 2. 資料來源

| 控制項 | 主要來源 | 備註 |
| --- | --- | --- |
| 場景屬性 `sceneAttributeId` | `webapp/src/lib/engine.js` 的 `SCENE_ATTRIBUTE_OPTIONS` | 目前有 `未指定`、`室內`、`戶外`、`其他`。 |
| 場景基底 `locationId` | `knowledge_base/locations_and_sets.md` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 環境光條件 `lightingId` | `knowledge_base/camera_and_lighting.md` 的 `環境光條件 (Ambient Light Conditions)` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 光線表現 `lightDirectionId` | `knowledge_base/camera_and_lighting.md` 的 `光線表現 (Light Style)` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 場景與光線相容性 | `webapp/src/lib/engine.js` | 主要是 `locationMatchesSceneAttribute`、`lightingMatchesSceneAttribute`、`locationSupportsLighting`、`lightDirectionSupportsScene`。 |
| C 區 UI 顯示與摘要 | `webapp/src/components/Page1Workspace.jsx`、`webapp/src/components/LightingReferenceModal.jsx` | 新增控制鍵或改定位時需同步 UI 文案。 |
| 測試 | `webapp/src/lib/engineSceneBaseCleanup.test.js`、`engineLightingPromptCleanup.test.js`、`engineLightingCompatibility.test.js` | 依修改範圍更新。 |

Markdown 資料同步流程：

```bash
python3 scripts/sync_to_json.py
```

同步後需確認 `webapp/src/data/database.json` 只有預期分類改動，且既有 metadata 沒有被意外清掉。

## 3. Prompt 寫法總則

場景基底英文 prompt 建議格式：

```text
specific place or surface anchor, 2-5 concrete spatial/material details, offset or close scene-base cue
```

環境光英文 prompt 建議格式：

```text
sky/time/weather/interior-brightness environment, air or visibility state, restrained color-temperature cue
```

光線表現英文 prompt 建議格式：

```text
subject light direction or quality, visible effect on face/hair/body/clothing, shadow/highlight behavior
```

描述應該：

- 使用可被畫面辨識的物理資訊，例如 floor、wall edge、window frame、wet surface、cloud cover、rim edge。
- 讓 scene base、ambient light、subject light 三者各司其職。
- 優先描述畫面結果，不寫抽象情緒詞。
- 保持正向描述；只有在穩定生成很必要時，才使用短而具體的 guard。

描述應避免：

- A 區人物詞：beautiful face、sexy body、idol expression、pose。
- B 區穿搭詞：dress、jacket、boots、accessory。
- D 區攝影詞：35mm、film grain、cinematic lens、Leica、Polaroid、bokeh。
- 完整故事行為：working, dancing, running, holding camera。
- 過度負面堆疊：`avoid...`、`without...`、長串禁止詞。
- 把環境光和人物受光寫在同一欄，例如 ambient 裡寫 rim light，或 light style 裡寫整片天空。

長度建議：

- 一般場景基底：12-28 English words。
- 複雜室內、廢墟、城市局部：可到 35 English words。
- 純色攝影棚：可到 55 English words，因為需要穩定無縫背景與設備排除。
- 其他專屬場景：10-30 English words。
- 環境光條件：8-24 English words。
- 光線表現：8-24 English words。

## 4. 場景屬性

場景屬性是 C 區的第一層 filter，不是 prompt 裝飾。

目前選項：

- `未指定`: 不限制場景類型。
- `室內`: 只顯示室內或可視為室內的場景與光線。
- `戶外`: 只顯示戶外或可視為戶外的場景與光線。
- `其他`: 顯示專屬近景基底，例如床鋪、沙發、榻榻米、水面、雪地。

維護規則：

- 場景 label 的 `室內：`、`戶外：`、`其他：` 前綴會影響 UI 理解與測試閱讀，不要隨意更改。
- 新增場景時，必須確認它能被 `getLocationEnvironmentFlags` 正確判斷為 indoor、outdoor 或 other_scene。
- 新增環境光或光線表現時，必須確認 metadata tags 能通過正確的 sceneAttribute 過濾。
- `其他` 場景只是一種專屬基底，不應拿來放一般室內或戶外地點。

## 5. 場景基底

場景基底負責畫面的物理位置與可見空間。它應該像「人物站在哪裡、坐在哪裡、背後靠近什麼表面」的描述，而不是攝影風格或情緒形容。

目前主要分類：

| 分類 | 責任 |
| --- | --- |
| 攝影棚與背景 (Studio Sets) | 棚內背景、純色無縫色場、鏡面棚、CRT 電視牆等可控場景。 |
| 生活感室內 (Indoor & Lifestyle) | 住宅、飯店、浴室、廚房、餐館、圖書館、辦公、便利空間等真實室內。 |
| 地下與廢墟風格 (Abandoned & Underground) | 廢棄、地下、工業、醫療、校舍、施工與破敗空間。 |
| 城市與社群感 (Urban & Social Snapshots) | 店面、街角、車站、社群自拍感可用的城市局部。 |
| 自然與戶外 (Nature & Outdoors) | 海邊、草原、森林、山地、河岸、花田等戶外自然基底。 |
| 其他專屬場景 | 白色床鋪、沙發、榻榻米、水面、雪地等近距離 surface base。 |

### 5.1 一般場景

新增規則：

- 英文 prompt 以地點名或 surface anchor 開頭。
- 至少包含 2-3 個具體物件、材質或空間邊界。
- 優先使用 `corner`、`edge`、`side area`、`offset composition`、`close wall surfaces` 等局部空間語言。
- 室內可描述家具、牆面、地板、窗框、櫃面、管線、鏡面邊緣。
- 戶外可描述地面材質、邊坡、河岸、植被碎片、護欄、遠景片段。
- 不主動指定光線、鏡頭、人物姿勢或服裝。

範例語氣：

```text
modern high-rise apartment living room, large window wall, sofa edge, low coffee table, rug texture, offset residential interior composition
```

### 5.2 純色攝影棚

純色攝影棚的目標是「整個底色是單一顏色，分不出天花板、牆面與地板」，但人物仍要有自然接觸陰影。

維護規則：

- 必須包含 `horizonless seamless`。
- 必須描述 `continuous ... ground-and-background plane` 或相近的連續地面背景平面。
- 必須保留 `subtle natural contact shadow under the subject`。
- 必須排除可見棚內設備：`no paper roll`、`no backdrop stand`、`no light stands`、`no studio equipment`。
- 必須避免 wall corner、floor seam、ceiling、fluorescent tubes。
- 不要描述紙背景、紙架、燈架、棚燈腳架或天花板日光燈。

範例語氣：

```text
horizonless seamless matte pure white color field, continuous white ground-and-background plane blending into a solid white void, subtle natural contact shadow under the subject, no wall corner, no floor seam, no ceiling, no paper roll, no backdrop stand, no light stands, no studio equipment
```

### 5.3 戶外反對稱規則

戶外場景要避免生成「兩旁建築或樹木整齊排列在畫面左右」的對稱畫面。除非某個選項的核心就是正式軸線構圖，否則不要使用會誘發置中道路或兩側整列的語言。

避免使用：

- `symmetrical`
- `both sides`
- `central road`
- `avenue`
- `tree-lined`
- `lined with`
- `perfect rows`
- `straight corridor`

優先使用：

- `asymmetric riverside composition`
- `offset storefront edge`
- `side path fragment`
- `uneven tree clusters`
- `varied depth layers`
- `building edge at one side`
- `irregular foreground plants`

### 5.4 其他專屬場景

`其他：` 場景不是完整環境，而是近距離 surface 或 ground plane。

維護規則：

- 英文 prompt 必須讓人讀起來像 close scene base。
- 必須包含 `ground plane`、`surface` 或 `scene base` 其中之一。
- 控制在 30 English words 以內。
- 不加入房間、街道、天空、鏡頭、服裝或動作。

## 6. 環境光條件

環境光條件負責整個場景的光影狀態，尤其是天空、時段、天氣、室內亮度、空氣濕度、遠景能見度與大環境色溫。它不負責人物臉部受光方向或陰影形狀。

目前選項維持 36 個，包含：

- 戶外日間與天空：晴朗白日、藍天白雲、夏日深藍積雲、正午烈日。
- 陰天與濕度：雨前灰黑天空、陰天漫射、陰雨將至、雨天陰濕、雨後反光。
- 時段與夜色：清晨薄霧、晨光日出、黃昏夕陽、藍調傍晚、城市夜間混合光、月光夜色、城市高彩度夜色。
- 冬季環境：雪地冷光、冬季灰冷。
- 室內自然光：室內窗邊日光、室內清晨冷白日光、室內午後柔亮日光、室內陰影日光、室內陰雨昏暗天光、室內黃昏微暖餘光。
- 室內夜景與人造光：室內暖色夜景、室內低照度暖色夜景、室內社交暖色夜景、室內極暖低照度、室內冷白環境光、室內冷白高亮日常、室內高彩度色光夜景、室內外光滲入微暗空間、室內深夜冷暗微光。
- 攝影棚環境光：高調純白攝影棚、柔霧美妝攝影棚、舞台演出燈光。

新增規則：

- 英文 prompt 以 8-24 words 為目標。
- 必須聚焦 `environment`、`sky`、`air`、`visibility`、`room brightness`、`exterior if visible`。
- 可以描述雲層、天色、濕度、霧感、室內明暗、窗外狀態。
- 不寫 `on the subject`、`subject lighting`、`key light`、`rim light`、`facial illumination`。
- 不描述 skin、clothing、hair、body 上的亮暗效果。
- 不命名會被生成成畫面物件的實體光源，例如 candle、lamp、streetlight、fluorescent、LED、visible source；改用色溫、亮度、對比、可見度與 ambient cast 描述。
- 戶外環境光要避免直接變成人物受光，例如 `正午烈日` 描述高位太陽與熱空氣，不寫短硬人物陰影。
- 室內環境光若提到窗外，應使用 `if visible`，避免強迫生成窗戶。

範例語氣：

```text
deep azure summer sky, saturated clean blue atmosphere, towering luminous white cumulus clouds, crisp cloud-edge detail, vivid blue-and-white daylight
```

## 7. 光線表現

光線表現負責人物受光。它決定光從哪裡來、硬或軟、反差高低、是否有投影或反射、以及光色如何落在人物皮膚、髮絲、身體與衣物上。

目前選項維持 26 個，包含：

- 方向與硬度：柔和順光、均勻平光、側向柔光、側向硬光、側逆光、逆光輪廓光、頂部照明、下方反射光。
- 反差與包覆：漫射霧光、硬質晴光、低光高反差、高調亮光。
- 受光色溫：暖金黃昏色溫、冷白日光色溫、室內暖白燈色溫、冷藍夜色光、混合色溫光、霓虹染色光。
- 投影、反射與局部光：窗格投影光、百葉窗條紋投影光、冷調窗邊輪廓光、斑駁樹影光、潮濕反射光、局部暖光、深夜邊緣微光。

新增規則：

- 英文 prompt 以 8-24 words 為目標。
- 必須描述人物受光，至少落到 subject、face、skin、hair、shoulder、body、clothing、shadow、highlight 其中一類。
- 可以描述 key light、rim light、bounce fill、projection pattern、shadow edge、highlight detail。
- 不描述天空、天氣、完整場景、街景或室內裝潢。
- 色溫類選項只控制人物受光顏色，不主動生成天空、夕陽、夜景或月亮。
- 投影類選項必須說明圖案落在人物身上，而不是只描述窗戶或樹。

範例語氣：

```text
diagonal rear-side subject light, soft rim edge along hair and shoulder, partial facial fill, separated subject contour
```

## 8. 場景與光線相容性

C 區依賴 metadata tags 來避免明顯不合理的組合。只改 prompt 文字通常不需要改 engine；新增或拆分選項時，必須檢查 tags 與相容性。

主要規則：

- 場景屬性會過濾 location、ambient light 與 light style。
- 室內場景不應自動搭配純戶外天空、雨天或日照環境，除非該環境光明確支援室內窗外狀態。
- 戶外場景不應搭配純室內棚燈環境，除非該光線本身允許戶外閃光或柔光。
- 雨天、陰天、深夜或霓虹環境通常不應搭配硬質晴光、直射陽光或窗格日光投影。
- 攝影棚環境不應搭配自然窗光、戶外樹影、潮濕地面反射等場景依賴光線。
- 地下、廢墟、subterranean 場景不應搭配乾淨天空、純日間戶外或 studio-only 環境。

新增選項時需檢查：

- `location.meta.tags` 是否有 indoor、outdoor、studio、natural、urban、residential、hospitality、heritage、commercial、subterranean、other_scene 等必要標籤。
- `lighting.meta.tags` 是否有 ambient_indoor、ambient_outdoor、ambient_studio、day、sunlight、cloudy、rain、mist、dusk、night_ambient、window_light、studio_light 等必要標籤。
- `lightDirection.meta.tags` 是否有 supports_indoor、supports_outdoor、window_light、sunlight、portrait_light、backlight、overhead、artificial_light、wet_surface 等必要標籤。
- 新增 Markdown row 後，若 sync 沒有自動產生新 metadata，必須補上或調整資料來源，並用測試確認選項能在 UI 中正確出現。

## 9. 場景優先權

C 區場景要能和 A 區特殊角色、B 區特殊穿搭、D 區攝影與成像共存。

維護規則：

- 選中場景時，prompt 中仍應明確輸出 scene base，不應被特殊穿搭或特殊角色完全蓋掉。
- 特殊角色可覆蓋人物設定，但不應無條件覆蓋使用者指定的場景。
- 特殊穿搭是完整造型包，但不應把場景改成服裝描述。
- `其他：` 專屬場景若被選中，應保持 surface base，而不是擴寫成完整房間或戶外。
- D 區攝影風格、鏡頭、成像模擬只改拍法與質感，不應改 C 區場景內容。

## 10. 改名、合併與舊資料相容

多數 location、lighting、lightDirection option id 會由 category、中文標籤與 row index 產生。因此改名、合併、調整排序都可能讓舊 favorite 或 saved lock 找不到選項。

維護規則：

- 優先 append 新選項，不任意插入中間。
- 只做 prompt 精簡時，不改中文 label。
- 改名、合併、移除時必須檢查 `normalizeLocks` 與相關 legacy mapping 是否需要新增遷移。
- 若調整分類或場景前綴，必須更新 sceneAttribute 過濾、UI 摘要與測試。
- 舊選項應 map 到最接近的新選項；只有真的被淘汰且無替代時才 map 到 `全無`。

## 11. 新增選項流程

新增場景基底：

1. 確認它屬於室內、戶外或其他專屬場景。
2. 檢查現有 143 個場景是否已能覆蓋，能合併就不要新增。
3. 在 `knowledge_base/locations_and_sets.md` 新增或修改 row。
4. 跑 `python3 scripts/sync_to_json.py`。
5. 確認 `webapp/src/data/database.json` 的 zh、en、desc 與 meta tags 正確。
6. 若涉及新場景類型，更新 `locationMatchesSceneAttribute`、`locationSupportsLighting` 或相關相容性 helper。
7. 更新或新增場景基底測試。

新增環境光條件：

1. 確認它是環境狀態，不是人物受光。
2. 在 `knowledge_base/camera_and_lighting.md` 的 `環境光條件 (Ambient Light Conditions)` 新增 row。
3. 跑 `python3 scripts/sync_to_json.py`。
4. 補齊 ambient tags，確認 indoor/outdoor/studio 過濾正確。
5. 檢查是否會和既有 light style 發生不合理組合，必要時更新 `lightDirectionSupportsAmbientLight`。
6. 更新 `engineLightingPromptCleanup.test.js` 與 `engineLightingCompatibility.test.js`。

新增光線表現：

1. 確認它是人物受光，不是環境天氣或場景。
2. 在 `knowledge_base/camera_and_lighting.md` 的 `光線表現 (Light Style)` 新增 row。
3. 跑 `python3 scripts/sync_to_json.py`。
4. 補齊 lightDirection tags，確認室內、戶外、棚內與構圖景別限制正確。
5. 若它需要特定場景支撐，例如窗格、樹影、濕地面，必須更新相容性規則與測試。
6. 更新 `engineLightingPromptCleanup.test.js` 與 `engineLightingCompatibility.test.js`。

## 12. 測試與驗證

依修改範圍更新或新增測試：

| 修改範圍 | 主要測試 |
| --- | --- |
| 場景基底文字精簡、純色棚穩定、戶外反對稱、其他專屬場景 | `webapp/src/lib/engineSceneBaseCleanup.test.js` |
| 環境光與光線表現責任邊界、prompt 長度、生成輸出 | `webapp/src/lib/engineLightingPromptCleanup.test.js` |
| 場景屬性、環境光、光線表現相容性 | `webapp/src/lib/engineLightingCompatibility.test.js` |
| 特殊穿搭或特殊角色與場景共存 | `webapp/src/lib/engineGrokScenePriority.test.js` |
| Page3 世界場景與 C 區資料互動 | `webapp/src/lib/page3WorldScene.test.js` |

完整驗證命令：

```bash
cd webapp
node --test src/lib/engineSceneBaseCleanup.test.js
node --test src/lib/engineLightingPromptCleanup.test.js
node --test src/lib/engineLightingCompatibility.test.js
node --test src/lib/engineGrokScenePriority.test.js
node --test src/lib/page3WorldScene.test.js
npm test
npm run lint
npm run build
git diff --check
```

允許既有 Vite chunk-size warning；其他錯誤需修正。

## 13. Review Checklist

送出前請確認：

- 選項是否真的屬於 C 區，而不是 A 人物、B 穿搭或 D 攝影與成像。
- 場景基底是否只描述物理位置、材質、表面與空間 anchor。
- 純色攝影棚是否維持無縫單色、接觸陰影，且排除紙架、燈架、天花板與棚內設備。
- 戶外場景是否避免兩側建築、兩側樹列、置中道路與過度對稱語言。
- `其他：` 場景是否仍是 close scene base，而不是完整環境。
- 環境光條件是否只描述天空、時段、天氣、室內外明暗、空氣或能見度。
- 光線表現是否明確落在人物受光、陰影、亮部、投影或反射。
- 新增選項是否有正確 metadata tags，且可被 sceneAttribute 和相容性規則正確過濾。
- 改名、合併、移除是否保留舊 saved lock 相容性。
- 測試是否覆蓋 prompt 邊界、相容性與生成輸出。
