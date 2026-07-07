# D 攝影與成像新增與維護規格

Last updated: 2026-07-07

這份文件定義 PAGE1 `D. 攝影與成像` 的新增、修改、合併與測試規則。後續新增攝影師風格、構圖景別、相機視角、拍攝方位、相機 profile、鏡頭焦段、光圈 / 景深、快門 / 動態殘影、光學效果或底片 / 成像 rendering 時，請先依照本規格檢查責任邊界、prompt 寫法、舊資料相容性與測試覆蓋。

## 1. 核心原則

D 區只負責「照片怎麼被拍、用什麼攝影語言與成像質感呈現」。它不應該偷渡人物長相、體態、神情、姿勢、服裝、場景基底、天氣、環境光條件或人物受光方式。

整體攝影主線維持：

- 攝影師風格負責影像語言、色彩節奏、編輯感、人物距離感與觀看方式。
- 構圖與視角負責裁切範圍、相機高度、俯仰、傾斜與人物相對鏡頭的方位。
- 相機 profile 負責器材系統、常見視角、操作感、對焦反應與基礎捕捉特性。
- 鏡頭焦段負責視角、透視、壓縮、變形、工作距離與焦平面特性。
- 光圈 / 景深負責 f-stop 語言、焦平面厚薄、前後景離焦程度與主體背景分離。
- 快門 / 動態殘影負責快門速度語言、動作凍結、背景拖影、主體拖影、全畫面慢門與後簾同步閃光殘影。
- 光學效果負責鏡頭、濾鏡、散景光斑、flare、暗角、色差、前景遮擋等可見光學現象。
- 底片 / 成像 rendering 負責色彩、階調、顆粒、黑位、亮部 roll-off、動態範圍與低畫質媒介質地。

Prompt 應使用短而準的英文片語。中文描述用來幫助維護者理解攝影方向，英文 prompt 用來控制生成結果。

## 2. 資料來源

| 控制項 | 主要來源 | 備註 |
| --- | --- | --- |
| 攝影風格 `styleId` | `knowledge_base/regional_portrait_styles.md` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 構圖景別 `framingId` | `knowledge_base/camera_and_lighting.md` 的 `景別構圖 (Framing)` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 俯仰角度 `angleId` | `knowledge_base/camera_and_lighting.md` 的 `相機視角 (Angle)` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 環繞角度 `orbitId` | `knowledge_base/camera_and_lighting.md` 的 `拍攝方位 (Orbit Angle)` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 鏡頭焦段 `lensId` | `knowledge_base/camera_and_lighting.md` 的 `鏡頭焦段 (Focal Length)` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 光圈 / 景深 `apertureId` | `knowledge_base/camera_and_lighting.md` 的 `光圈 / 景深 (Aperture & Depth of Field)` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 快門 / 動態殘影 `shutterId` | `knowledge_base/camera_and_lighting.md` 的 `快門 / 動態殘影 (Shutter & Motion Blur)` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 光學效果 `opticalEffectId` | `knowledge_base/camera_and_lighting.md` 的 `光學效果 (Optical Effects)` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 相機 profile | `webapp/src/lib/engine.js` 的 `CAMERA_SYSTEM_OPTIONS` | code-defined，併入 `filmId` 選項，不走 Markdown sync。 |
| 相機 / 底片 `filmId` | `CAMERA_SYSTEM_OPTIONS` 加上 `底片與相機模擬 (Camera & Film Simulation)` | UI label 是 `相機 / 底片`，選項包含相機 profile 與 rendering look。 |
| 舊資料相容 | `webapp/src/lib/engine.js` | 主要是 `CAMERA_FILM_LEGACY_OPTION_MAP`、`buildImagingSimulationOptions`、`normalizeLocks`。 |
| 測試 | `webapp/src/lib/enginePhotographyImagingCleanup.test.js`、`engineGrokScenePriority.test.js`、`engineLightingCompatibility.test.js` | 依修改範圍更新。 |

Markdown 資料同步流程：

```bash
python3 scripts/sync_to_json.py
```

同步後需確認 `webapp/src/data/database.json` 只有預期分類改動。相機 profile 是 code-defined，不需要 sync，但仍需要更新測試。

## 3. Prompt 寫法總則

攝影師風格英文 prompt 建議格式：

```text
Inspired by photographer name, image-language phrase, tonal palette, editorial rhythm, viewing distance or texture cue
```

構圖與視角英文 prompt 建議格式：

```text
shot size or camera geometry, crop boundary, camera height or viewing direction, perspective effect
```

相機 profile 英文 prompt 建議格式：

```text
camera system profile, sensor or body trait, common lens perspective, shooting response, capture character
```

鏡頭焦段英文 prompt 建議格式：

```text
shot on focal length or lens type, field of view, perspective or compression behavior, working distance or distortion cue
```

光圈 / 景深英文 prompt 建議格式：

```text
f-stop-style depth cue, focus plane thickness, foreground or background defocus behavior, subject-background separation
```

快門 / 動態殘影英文 prompt 建議格式：

```text
shutter-speed look, frozen or smeared movement behavior, sharp subject or moving subject cue, motion trail or flash-drag result
```

光學效果英文 prompt 建議格式：

```text
optical artifact or filter effect, visible frame behavior, highlight or focus response, boundary cue
```

底片 / 成像 rendering 英文 prompt 建議格式：

```text
film stock or rendering type, color response, contrast curve, grain or sharpness, highlight and shadow behavior
```

描述應該：

- 使用真實攝影語言，例如 framing、camera height、field of view、micro-contrast、highlight roll-off、film grain。
- 讓每個欄位只負責自己的攝影層級。
- 保持 prompt 可組合，不讓單一選項把其他 D 欄位覆蓋掉。
- 對需要穩定的光學效果使用短 guard，例如 `lens-only` 或 `clear opening toward the subject`。

描述應避免：

- A 區人物詞：beautiful face、sexy body、cute expression、heroic presence、vulnerable mood。
- B 區穿搭詞：dress、jacket、boots、accessory。
- C 區場景詞：street corner、studio background、hotel room、forest、beach。
- C 區環境光與人物受光詞：rainy sky、sunset environment、rim light on the subject、key light direction。
- 情緒替代幾何：`dominance`、`vulnerable`、`cute`、`unsettling`、`cinematic tension` 不應出現在構圖與角度。
- 底片欄位寫相機型號，或相機 profile 寫完整底片色彩。

長度建議：

- 攝影師風格：14-26 English words。
- 構圖景別、相機視角、拍攝方位：6-18 English words。
- 相機 profile：12-24 English words。
- 鏡頭焦段：12-24 English words。
- 光圈 / 景深：10-22 English words。
- 快門 / 動態殘影：10-24 English words。
- 光學效果：10-26 English words。
- 底片 / 成像 rendering：10-24 English words。

## 4. 攝影師風格

攝影師風格負責整體 image language。它可以帶出攝影師的色彩傾向、編輯感、距離感、快照性、雜誌性、日記性、商業完成度或藝術張力，但不應直接指定相機、鏡頭、底片或場景。

目前主線：

- 日系與東亞寫真語言：Mika Ninagawa、Yoshihiko Ueda、Osamu Yokonami、Rinko Kawauchi、Masumi Ishida、Orie Ichihashi、Yoko Takahashi、Kishin Shinoyama、Chikashi Suzuki、Yuki Aoyama、Yuhki Toyama。
- 國際時裝與肖像語言：Paolo Roversi、Ellen von Unwerth、Richard Avedon、Alec Soth、Wolfgang Tillmans、Leslie Kee、Guy Bourdin、Miles Aldridge、Elsa Bleda。
- 親密、粗糙、黑白與藝術語言：Nan Goldin、Juergen Teller、Sally Mann、Daido Moriyama、Nobuyoshi Araki、Eikoh Hosoe。

新增規則：

- 英文 prompt 以 `Inspired by ...` 開頭。
- 描述 image language，不描述角色身份。
- 可以寫 tonal palette、editorial rhythm、negative space、snapshot energy、diaristic tone、commercial polish。
- 若攝影師風格包含光線語言，只能作為風格傾向，例如 `direct-flash image language`，不能替代 C 區光線表現。
- 不指定具體相機型號、鏡頭焦段、底片型號或場景地點。
- 避免 `sensual`、`skin rendering`、`body tension` 這類容易落到 A 區人物或身體設定的詞。

範例語氣：

```text
Inspired by Chikashi Suzuki, relaxed fashion editorial on film, youthful candid immediacy, soft everyday realism, muted natural tones, delicate film grain
```

## 5. 構圖與視角

構圖與視角分成三層：

| 欄位 | 責任 |
| --- | --- |
| `景別構圖 (Framing)` | 畫面裁切範圍、人物可見比例、背景參與量。 |
| `相機視角 (Angle)` | 相機高度、俯仰、鳥瞰、正上方或荷蘭角。 |
| `拍攝方位 (Orbit Angle)` | 人物相對鏡頭的正面、側面、背面、前後斜側。 |

維護規則：

- 這三層只能描述 camera geometry，不描述人物情緒。
- `framingId` 可以描述 face dominant、chest upward、knee-up、full body、environmental scale。
- `angleId` 可以描述 camera height、looking upward/downward、vertical perspective、foreshortening、diagonal horizon。
- `orbitId` 可以描述 front-facing、three-quarter、profile、rear view、back view。
- 不使用 `dynamic pose`，姿勢由 A 區控制。
- 不使用 `heroic`、`dominance`、`vulnerable`、`cute`、`unsettling`、`cinematic tension`。
- 新增 close-up 類景別時，必須檢查 close-up lock 限制與 wardrobe lock 行為。

目前特殊行為：

- 部分 close-up framing 會限制或遷移不適合近景的 B/C/A 控制。
- `全身鏡頭` 與特殊動作、穿搭完整度關聯高，新增相近選項要避免破壞 wardrobe visibility。
- `鳥瞰視角`、`正上方俯視鏡頭`、`地面高度鏡頭` 屬於低頻特殊視角，需保留相容性限制。

範例語氣：

```text
low camera angle, looking upward from below eye level, elongated vertical perspective, stronger lower-body scale
```

## 6. 相機 Profile

相機 profile 是 `filmId` 的第一層選項，UI 顯示於 `相機 / 底片`。它由 `CAMERA_SYSTEM_OPTIONS` 定義，並透過 `buildImagingSimulationOptions` 和底片 / 成像 rendering 合併。

目前相機 profile 使用 `相機｜名稱` 命名：

- `相機｜Leica M 旁軸`
- `相機｜Ricoh GR 快拍`
- `相機｜Fujifilm X100`
- `相機｜Sony 全片幅無反`
- `相機｜Canon / Nikon DSLR`
- `相機｜中片幅數位`
- `相機｜空拍機小型感光元件`
- `相機｜手機紀實直出`

新增規則：

- 相機 label 使用 `相機｜名稱`。
- 英文 prompt 以 `camera profile` 為核心。
- 可描述 sensor/body trait、常見等效焦段、固定鏡頭或可換鏡頭、觀景器/對焦/快門/操作感、capture response。
- 不寫完整底片色彩、顆粒或 film stock，這些交給底片 / 成像 rendering。
- 不寫場景、人物、服裝或光線。
- 如果相機有常見焦段，例如 Ricoh GR 28mm equivalent、Fujifilm X100 35mm equivalent，可以寫在相機 profile，但使用者仍可用 `lensId` 覆蓋或加強視角。

範例語氣：

```text
Ricoh GR compact APS-C camera profile, 28mm-equivalent snap perspective, fast street-snapshot response, high-acutance detail, pocket-camera immediacy
```

## 7. 鏡頭焦段

鏡頭焦段負責 field of view、透視、壓縮、變形、工作距離與焦平面。它不負責相機品牌、底片色彩或攝影師風格。

目前主要選項：

- 廣角：20mm、24mm、28mm、35mm。
- 標準：50mm。
- 中長焦與長焦：85mm、105mm、135mm。
- 特殊鏡頭：Macro、Fisheye、Tilt-Shift、Anamorphic。

新增規則：

- 英文 prompt 以 `shot on ... lens` 開頭。
- 目標 12-24 English words。
- 廣角描述 wide field of view、perspective expansion、edge distortion。
- 標準鏡描述 neutral perspective、minimal distortion、natural proportions。
- 長焦描述 compression、narrow field of view、subject isolation、distant working distance。
- 特殊鏡頭描述其核心光學結果，例如 barrel distortion、tilted focus plane、oval bokeh。
- 不寫情緒，不寫場景，不寫底片，不寫光線。

範例語氣：

```text
shot on 135mm long telephoto lens, strong background compression, narrow field of view, flattened spatial layers, pronounced subject isolation
```

### 7.1 光圈 / 景深與快門 / 動態殘影

光圈 / 景深與快門 / 動態殘影是獨立控制，不應取代鏡頭焦段或光學效果。焦段仍負責透視與視角；光圈負責焦平面與離焦深度；快門負責動作凍結或殘影方式。

維護規則：

- label 可以使用 f-stop 或 shutter speed，但英文 prompt 必須同時描述可見結果，例如 `f/1.4-style ultra shallow depth of field` 或 `1/30s slow-shutter portrait blur`。
- 光圈不寫相機品牌、底片色彩、場景或人物情緒。
- 快門可以描述主體清楚、背景拖影、主體拖影、全畫面拖影或後簾同步閃光，但不要指定場景必須是街道、車流或棚拍。
- `主體動態殘影` 是合法的肖像拍法，不應被自動修正成主體清楚。
- 這兩個控制預設應保持 `全無`，避免所有舊 prompt 在未明確選擇時突然加入強烈光圈或慢門語言。

範例語氣：

```text
f/1.4-style ultra shallow depth of field, razor-thin focus plane, strong foreground and background defocus, large soft bokeh discs
```

```text
rear-curtain flash look, flash-frozen subject edge with trailing motion blur, sharp strobe imprint over slow-shutter drag
```

## 8. 光學效果

光學效果負責鏡頭、濾鏡或介質造成的可見現象。它不是環境光、天氣或場景霧。

目前主要選項：

- 散景與前景光學層：重散景光斑、旋渦散景、貓眼散景、肥皂泡散景、前景遮擋散景。
- 折射與點光源現象：玻璃前景折射、稜鏡折射、星芒光圈。
- flare 與底片邊緣現象：鏡頭光斑、變形鏡頭光斑、局部炫光霧面反差、漏光效果。
- 濾鏡與成像衰減：柔焦濾鏡、霧化高光、暗角、色差、邊緣模糊、中央清晰邊緣拉抹、光學朦朧薄霧。

新增規則：

- 描述 optical artifact、filter、frame edge behavior、highlight behavior、散景形狀或遮擋層次。
- 不描述天氣、天空、場景光線或人物受光方向。
- 不用光學效果重複承接 `光圈 / 景深` 已經負責的淺景深、極淺景深或焦平面厚薄描述。
- `前景遮擋散景` 必須保留「遮住部分畫面」的效果，但不要寫死固定比例。使用 `meaningful partial frame coverage`、`one or more frame edges`、`clear opening toward the subject`。
- `玻璃前景折射` 與 `稜鏡折射` 應強調 transparent / refracted / split-image 等折射語言，不要誤寫成單純前景模糊。
- `星芒光圈` 應聚焦 bright point lights 的繞射星芒，不要重複描述 flare、夜景天空或慢門拖線。
- `中央清晰邊緣拉抹` 應維持中心主體可讀，只把扭曲與拉抹放在周邊外圈。
- `光學朦朧薄霧` 必須強調 lens/filter，例如 `lens-only mist-filter haze`，不要變成環境霧或煙霧。
- 光學效果可以和鏡頭焦段共存，但不要重複寫同一種現象到爆量。

範例語氣：

```text
blurred foreground occlusion near the lens, out-of-focus shapes crossing one or more frame edges, meaningful partial frame coverage, thick near-field bokeh veil, clear opening toward the subject
```

## 9. 底片 / 成像 Rendering

底片 / 成像 rendering 負責色彩、階調、顆粒、黑位、亮部控制、動態範圍與媒介質地。它和相機 profile 共用 `filmId` 控制，但責任不同。

目前 rendering 類型：

- 真實底片：拍立得效果、Kodak Portra 400、Fujifilm Superia 400。
- 富士與數位色彩：Fujifilm Classic Chrome、Fujifilm Provia、暖白 JPEG 直出、冷調清晰寫實、高動態通透明亮。
- 質地與階調：數位微對比紀實感、高階黑白灰階、復古微對比銳利感、暖膚數位人像、高銳利快照黑位、中片幅數位色深。
- 低畫質媒介：VHS 錄影帶低畫質。

新增規則：

- 不用相機品牌做 label 的核心，除非它是真正不可拆的 film simulation 名稱，例如 Fujifilm Classic Chrome。
- 一般數位 rendering 使用抽象名稱，例如 `高銳利快照黑位`，不要寫成某台相機。
- 英文 prompt 描述 color response、contrast curve、grain、micro-contrast、highlight retention、shadow transparency、resolution。
- 不寫鏡頭焦段、不寫操作感、不寫相機 body。
- 不寫人物身份、服裝、場景或光線方向。
- 改名時必須保留 legacy id，避免舊 favorite 或 saved lock 失效。

範例語氣：

```text
high-acutance snapshot rendering, snap-focus clarity, contrasty black levels, crisp APS-C-like color response, candid compact-camera texture
```

## 10. 相機 / 底片合併邏輯

PAGE1 的 `filmId` 控制現在承擔 `相機 / 底片`：

- 相機 profile 來自 `CAMERA_SYSTEM_OPTIONS`。
- 底片 / 成像 rendering 來自 Markdown 的 `底片與相機模擬 (Camera & Film Simulation)`。
- `buildImagingSimulationOptions` 會把兩者合併成同一個 UI 選項集。
- `cameraSystemId` 是 hidden legacy control，保留給舊資料遷移。

維護規則：

- 新增相機 profile 時，直接更新 `CAMERA_SYSTEM_OPTIONS`，並補測試。
- 新增底片 / 成像 rendering 時，更新 `knowledge_base/camera_and_lighting.md` 並跑 sync。
- 相機 profile 和 rendering look 可以一起存在，但 prompt 應可組合，不能互相覆蓋。
- 如果改名、抽象化或合併 rendering look，必須更新 `CAMERA_FILM_LEGACY_OPTION_MAP`。
- 舊 `cameraSystemId` lock 必須能遷移到新的 `filmId` selection。

## 11. 舊資料相容

D 區有多種 id 來源，改名時風險不同。

| 類型 | id 來源 | 改名風險 |
| --- | --- | --- |
| 攝影師風格 | Markdown category + label + index | 改中文 label 可能影響舊 lock。 |
| 構圖、視角、鏡頭、光學、底片 rendering | Markdown category + label + index | 改中文 label 或排序可能影響舊 lock。 |
| 相機 profile | `CAMERA_SYSTEM_OPTIONS.id` | id 手動指定，label 可改但 id 不應改。 |
| 舊相機 `cameraSystemId` | hidden control | 必須繼續可遷移到 `filmId`。 |

維護規則：

- 優先 append 新選項，不任意插入中間。
- 只做 prompt 精簡時，不改中文 label。
- 若底片 / 成像 rendering 改名，更新 `CAMERA_FILM_LEGACY_OPTION_MAP`。
- 若相機 profile 改 label，不改 id，例如 `ricoh-gr-snapshot` 必須保持。
- 若刪除或合併選項，舊選項應 map 到最接近的新選項；只有真的無替代時才 map 到 `全無`。

## 12. 新增選項流程

新增攝影師風格：

1. 確認它是 image language，不是相機、底片、場景或人物設定。
2. 在 `knowledge_base/regional_portrait_styles.md` 新增 row。
3. 跑 `python3 scripts/sync_to_json.py`。
4. 若需要特殊 style tags，更新 `inferStyleMeta`。
5. 更新或新增攝影風格 prompt 測試。

新增構圖、視角或方位：

1. 確認它是 camera geometry。
2. 在 `knowledge_base/camera_and_lighting.md` 的對應 category 新增 row。
3. 跑 `python3 scripts/sync_to_json.py`。
4. 更新 `inferFramingMeta`、`inferAngleMeta` 或 `inferOrbitMeta`。
5. 檢查 close-up mode、wardrobe compatibility、special action compatibility。
6. 更新 `enginePhotographyImagingCleanup.test.js` 或相關相容性測試。

新增相機 profile：

1. 在 `CAMERA_SYSTEM_OPTIONS` 新增手動 id。
2. Label 使用 `相機｜名稱`。
3. Prompt 描述相機系統、常見視角、操作感與捕捉反應。
4. 不跑 sync，但需更新測試。
5. 若替代舊相機或舊成像選項，補 legacy mapping。

新增鏡頭或光學效果：

1. 在 `knowledge_base/camera_and_lighting.md` 的 `鏡頭焦段` 或 `光學效果` 新增 row。
2. 跑 `python3 scripts/sync_to_json.py`。
3. 更新 `inferLensMeta` 或 `inferEffectMeta`。
4. 若效果會影響構圖可讀性，例如前景遮擋，必須補測試。

新增底片 / 成像 rendering：

1. 確認它是色彩、階調、顆粒或媒介質地，不是相機 profile。
2. 在 `knowledge_base/camera_and_lighting.md` 的 `底片與相機模擬` 新增 row。
3. 跑 `python3 scripts/sync_to_json.py`。
4. 更新 `inferFilmMeta`。
5. 若改名或合併舊選項，補 `CAMERA_FILM_LEGACY_OPTION_MAP`。

## 13. 測試與驗證

依修改範圍更新或新增測試：

| 修改範圍 | 主要測試 |
| --- | --- |
| 構圖視角語氣、相機 / 底片分層、鏡頭光學長度、攝影師風格收斂 | `webapp/src/lib/enginePhotographyImagingCleanup.test.js` |
| 相機 profile 併入 `filmId`、legacy `cameraSystemId` 遷移 | `webapp/src/lib/engineGrokScenePriority.test.js` |
| 光學效果摘要與 C 區光線摘要分離 | `webapp/src/lib/engineLightingCompatibility.test.js` |
| PAGE3 攝影師風格沿用 | `webapp/src/lib/page3WorldScene.test.js` |

完整驗證命令：

```bash
cd webapp
node --test src/lib/enginePhotographyImagingCleanup.test.js
node --test src/lib/engineGrokScenePriority.test.js
node --test src/lib/engineLightingCompatibility.test.js
node --test src/lib/page3WorldScene.test.js
npm test
npm run lint
npm run build
git diff --check
```

允許既有 Vite chunk-size warning；其他錯誤需修正。

## 14. Review Checklist

送出前請確認：

- 選項是否真的屬於 D 區，而不是 A 人物、B 穿搭或 C 場景光線。
- 攝影師風格是否只描述 image language，沒有偷渡相機、底片、場景或人物身體設定。
- 構圖與視角是否只描述幾何、裁切、相機高度、方位與透視。
- 相機 profile 是否以 `相機｜` 命名，且保留穩定手動 id。
- 相機 profile 是否描述相機系統、常見視角、操作感與捕捉反應，而不是底片色彩。
- 鏡頭焦段是否描述 field of view、透視、壓縮、變形或焦平面，不寫相機品牌。
- 光學效果是否是鏡頭 / 濾鏡 / optical artifact，不變成天氣或環境光。
- `前景遮擋散景` 是否仍有部分畫面遮擋，但保留主體可讀開口。
- 底片 / 成像 rendering 是否只描述色彩、階調、顆粒、黑位、亮部與媒介質地。
- 改名、合併、移除是否保留舊 saved lock 相容性。
- 測試是否覆蓋 prompt 邊界、legacy 遷移與生成輸出。
