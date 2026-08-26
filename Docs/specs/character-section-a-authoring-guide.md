# A 人物設定新增與維護規格

Last updated: 2026-08-09

這份文件定義 PAGE1 `A. 人物設定` 的新增、修改、合併與測試規則。後續新增五官、體態、髮型、髮色、神情、姿勢、特殊動作或特殊角色時，請先依照本規格檢查責任邊界與 prompt 寫法。

單人模式的 Gpt / Grok/Z-Image / AI 輸出規則請同時參考 `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/page1-single-prompt-compression-guide.md`。目前 Gpt 版採完整保留型 Prompt，體態、五官、膚質、髮型、髮色、神情、姿勢與特殊動作中的有效英文描述應完整保留；Grok/Z-Image 與 AI 才依各自模型需求壓縮。新增資料時仍需確認數值 anchor、正常狀態說明、同義詞堆疊與內部控制語言是否真的有助於生成穩定或造型鎖定。

## 1. 核心原則

A 區只負責「人物是誰、長什麼樣、當下表情與身體狀態」。它不應該偷渡場景、環境光、鏡頭焦段、攝影風格、服裝顏色或完整穿搭，除非該選項本身就是 `特殊角色` 或 `特殊動作` 必須成立的物件。

整體人物主線維持：

- 20 歲日系或韓系女性寫真人像。
- 年輕、漂亮、真實攝影感。
- 可以有性感、成熟、可愛、冷感或偶像感，但必須由對應欄位承擔，不要塞進人物數量或每一列 prompt。

Prompt 應使用短而準的英文片語，避免堆疊同義詞。中文描述用來幫助選項理解，英文 prompt 用來控制生成結果。

## 2. 資料來源

| 控制項 | 主要來源 | 備註 |
| --- | --- | --- |
| 人物數量 `subjectCount` | `webapp/src/lib/engine.js` 的 `SUBJECT_COUNT_OPTIONS` | 只決定 1 位、2 位，不承擔美感或性感描述；舊 `reference` lock 會轉成 1 位。 |
| 特殊角色 `specialSubjectId` | `webapp/src/lib/engine.js` 的 `SPECIAL_SUBJECT_OPTIONS` | 直接 code-defined，不走 Markdown sync。 |
| 角色卡 `characterProfileId` | `webapp/src/lib/engine.js` 的 `CHARACTER_PROFILE_OPTIONS` | 直接 code-defined，獨立於特殊角色；用來接管人物身份與固定穿搭。 |
| 體態、五官、膚質、髮型、髮絲整理狀態、髮色 | `knowledge_base/character_design.md` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 神情、姿勢、特殊動作 | `knowledge_base/character_design.md` | `特殊動作` 目前保留為 legacy hidden 資料；一般新增請優先放入 Pose Composer。編輯 Markdown 後需同步到 `webapp/src/data/database.json`。 |
| Pose Composer 姿勢基底、肢體變化、手部動作、道具動作、頭部方向、接觸 / 支撐 | `webapp/src/lib/engine/poseComposerOptions.js` 的 `POSE_COMPOSER_*_OPTIONS` | 直接 code-defined，不走 Markdown sync。 |
| 相容舊選項 | `webapp/src/lib/engine.js` | 合併、改名、移除時需加 legacy mapping。 |

Markdown 資料同步流程：

```bash
python3 scripts/sync_to_json.py
```

特殊角色、角色卡與人物數量是直接寫在 `engine.js`，不需要跑 sync，但仍需要更新測試。角色卡新增或修改時，除原本 `en` 描述外，GPT 版應補 `profile` 分組資料，並依 `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/page1-single-prompt-compression-guide.md` 的角色卡 GPT 分組規範檢查 `Identity and body`、`Hair`、`Outfit`、`Accessories` 的邊界。

## 3. Prompt 寫法總則

英文 prompt 建議格式：

```text
core identity phrase, 1-3 concrete visual traits, restrained style or realism cue
```

描述應該：

- 使用正向描述，例如 `live-action photographic realism`、`realistic dyed hair texture`。
- 使用可以被畫面辨識的視覺資訊，例如 silhouette、hair length、gaze direction、hand contact。
- 控制在該欄位的責任範圍內。
- 優先用普通攝影語言，不用動畫、遊戲、cosplay 或 fantasy 語氣。

描述應避免：

- 負面堆疊：`not anime`、`not cosplay`、`without...`、`avoid...`。
- 場景詞：street、room、studio、forest、beach、castle、laboratory。
- 光線詞：sunset、neon light、softbox、rim light、blue sky。
- 攝影詞：35mm、film grain、cinematic lens、Dutch angle。
- 完整服裝詞，除非是 `特殊角色` 本身或 `特殊動作` 所需道具。
- 幼態或未成年暗示。可愛可以存在，但要寫成成人寫真中的甜美、親和、偶像感。

## 4. 人物數量

責任：只決定人物數量。

目前選項：

- `1 位`: one 20-year-old Japanese or Korean female portrait subject
- `2 位`: two 20-year-old Japanese or Korean female portrait subjects

舊資料相容：

- 舊 saved card / import 若帶有 `subjectCount: "reference"`，restore / normalize 時會轉成 `subjectCount: "1"`。
- PAGE1 不再輸出由 `subjectCount` 觸發的 attached-reference guidance。PAGE2 character reference prompt、角色卡 `referenceImages`、服裝 reference image picker、燈光 reference modal 與 `reference/wardrobe/...` 圖片路徑不受影響。

維護規則：

- 不加入 `beautiful`、`sexy`、`seductive`、`stunning` 這類美感預設。
- 不加入髮型、五官、表情、姿勢、服裝、場景。
- 若新增人物數量模式，必須確認 duo prompt、wardrobe role、selection lock 都能支援。

## 5. 身份基底

身份基底負責穩定的人物 DNA。它可以決定長期外觀特徵，但不決定當下表情、姿勢、衣服、場景或攝影。

### 5.1 體態

責任：人物身形輪廓、比例、體態氣質。性感要素主要放在這裡，以時裝寫真語氣呈現。

目前標準選項：

- `高挑時裝模特`
- `一般基本體型`
- `柔和沙漏身形`
- `性感曲線身形`
- `運動緊實身形`
- `小隻精緻身形`

新增規則：

- 新選項必須能帶出明顯 silhouette 差異。
- 英文 prompt 以 8-18 words 為目標。
- 可描述 `tall`、`petite`、`curvy`、`athletic`、`hourglass`、`long legs`、`defined waist`、`bust-waist-hip curves`、`rounded hips`。
- 避免 `underweight`、`bony`、`fragile`、`childlike`、過度誇張身材或不健康身形。
- 胸部與臀部曲線可以用比例與輪廓語氣描述，例如 `fuller bust-waist-hip curves`、`rounded hips`，避免露骨或過度物化。

構圖可見性目標規則：

- 體態 visibility phase 3 已讓正常單人、雙人 A/B、Character Card 結構化 `body` 與特殊穿搭 person-detail 共用 `compositionBodyProjection.js` 的 composition body policy。完整 `en`／`profile.body` 仍是 canonical full-body source，近景只使用 authored、可追溯的區域來源。
- 新增或修改 Body Type 時，必須同時提供可追溯的 `chestUp`、`mediumWaist`、`cowboyKnee` 區域描述，並更新 `compositionBodyVisibilityFixtures.js`。不得只依 renderer 正規表示式從混合全身句猜測區域。
- `faceDetail` 與 `headShoulders` 的目標 projected body 為空；臉、膚質、妝容、髮型、神情與臉部配件不得因此消失。
- `chestUp` 只描述胸部、胸廓、上半身緊實度等實際可見特徵，不輸出身高、體重、完整三圍、腰腹、臀腿、腿身比或 cup-scale 數值。
- `mediumWaist` 可加入軀幹、腰線與腹部；`cowboyKnee` 可再加入臀部與胸腰臀比例；只有 `fullBody`、`unconstrained` 與目前的 `fixedComposition` 使用完整原始體態。
- 新增或修改正式 Character Card 時，除了 canonical `profile.body`，也必須維護 `profile.bodyProjection` 的 `chestUp`、`mediumWaist`、`cowboyKnee` authored source。`identityAndBody` 相容欄位與四個 permanent identity anchors 不得刪除或由 projection 改寫。
- 景別省略只影響公開 Prompt，不得清除 body locks、Saved Cards、restore payload 或 generated selection；全身角色照必須恢復完整 body source。
- 體態 visibility phase 4 的 `compositionBodyPromptIntegration.test.js` 會自動遍歷所有公開 Body Type、正式 Character Card 與公開景別。新增選項若缺少 crop-specific source、破壞 identity anchors、讓三組輸出讀回隱藏 body，或無法由 `full-body-character` 還原，必須視為阻擋式回歸。

範例語氣：

```text
fit toned athletic female body, healthy firm silhouette, subtle muscle definition, energetic balanced proportions
```

### 5.2 五官特徵

責任：臉型美感方向與辨識度。五官描述要簡短，目標是「臉的類型」而不是解剖清單。

目前標準選項：

- `韓系偶像臉`
- `日系清透臉`
- `甜美可愛臉`
- `冷感高級臉`
- `成熟性感臉`
- `混血立體臉`

### 五官結構定案（2026-08-09）

以下是六組五官選項目前確認的結構方向。這份表格是 `mj.face` 的 Midjourney canonical 結構；共用 `en` 原始資料仍維持既有內容，Gpt 與 Grok/Z-Image 不因這份 MJ 變體而改寫。

| 選項 | 臉型輪廓 | 眼型／眉型 | 鼻子／嘴唇 | MJ `face` canonical |
| --- | --- | --- | --- | --- |
| `韓系偶像臉` | 小巧精緻橢圓臉 | 杏仁眼、直眉 | 細長鼻樑、柔和唇形 | `small refined oval face, clear almond eyes with straight brows, slender nose bridge and softly shaped lips` |
| `日系清透臉` | 柔和自然橢圓臉 | 杏仁眼、自然眉型 | 小巧鼻型、柔和輪廓嘴唇 | `soft natural oval face, gentle almond eyes with natural brows, small nose and softly defined lips` |
| `甜美可愛臉` | 與日系清透臉相同的柔和自然橢圓臉 | 圓眼、彎眉 | 小巧圓鼻、柔和唇形 | `soft natural oval face, bright round eyes with curved brows, small rounded nose and softly shaped lips` |
| `冷感高級臉` | 精緻修長橢圓臉 | 上挑眼、直眉 | 明確鼻樑、雕塑感唇形 | `refined elongated oval face, upturned eyes with straight brows, defined nose bridge and sculpted lips` |
| `成熟性感臉` | 柔和明確的橢圓臉 | 上挑眼、拱眉 | 清晰鼻樑、豐潤輪廓唇 | `softly defined oval face, upturned eyes with arched brows, clear nose bridge and full shaped lips` |
| `混血立體臉` | 立體修長臉型 | 深邃圓眼、明確眉型 | 高鼻樑、雕塑感唇形 | `dimensional elongated oval face, deep-set round eyes with defined brows, high nose bridge and sculpted lips` |

通用眼型與眉型名稱：

- `almond eyes` = 杏仁眼：眼裂較修長、兩端收束；韓系偶像臉與日系清透臉使用。
- `round eyes` = 圓眼／圓形眼：眼睛開口較圓；甜美可愛臉與混血立體臉使用。混血立體臉的 `deep-set` 是眼窩深度，不是把圓眼改成另一種眼型。
- `upturned eyes` = 上挑眼／上揚眼：外眼角方向略向上；冷感高級臉與成熟性感臉使用。
- `straight brows` = 直眉、`natural brows` = 自然眉型、`curved brows` = 彎眉、`arched brows` = 拱眉、`defined brows` = 明確眉型。

定案限制：

- `甜美可愛臉` 必須沿用 `日系清透臉` 的橢圓臉輪廓，不使用 `soft rounded face`、`full cheeks`、`rounded chin` 或其他容易把臉部生成為肥胖／過度圓潤的描述。
- 六組均固定使用「臉型輪廓 → 眼型／眉型 → 鼻子／嘴唇」三段結構，不依景別增加或刪除五官細節量。
- 五官結構不加入表情、視線、妝容、髮型、鏡頭、光線或姿勢；表情與視線依第 6 節處理。
- 六組的 `mj.face` 只是一份同選項的 renderer-specific 表面描述，不是新的控制項，也不新增第二個五官選擇。

新增規則：

- 英文 prompt 以 10-20 words 為目標。
- 可以寫 `young beautiful`，但不要每列都堆滿 beautiful synonyms。
- 每個選項只抓 2-3 個臉部氣質，例如 idol、transparent、sweet、cool editorial、seductive alluring、mixed editorial。
- 可愛選項要避免幼態，中文描述可明確寫「可愛但不幼態」。
- 不要加入表情、妝容、髮型、鏡頭或光線。
- `Gpt` 與 `Grok/Z-Image` 繼續使用同一份資料列的 `en` 原始描述；一般單人 `AI`（內部欄位 `midjourneyPrompt`）可使用同一選項下由 `knowledge_base/item_metadata.json` 提供的 `mj.face` 專用短描述。
- `mj.face` 不是第二個選項或第二份 resolved selection，而是同一五官選項針對 Midjourney 的另一種表面表達；沒有 `mj.face` 時，renderer 必須回退到既有 `en` 主錨點。
- `mj.face` 以「臉型輪廓＋眼型眉型＋鼻子嘴唇」三段可見結構為目標，例如 `small refined oval face, clear almond eyes with straight brows, slender nose bridge and softly shaped lips`；不得加入表情、妝容、髮型、鏡頭、光線或姿勢。
- `AI` 的 MJ 變體可保留完整三段結構，不套用既有 `en` 的單一主錨點截取；`Gpt`、`Grok/Z-Image`、Character Card 與原始 `en` 不受影響。

範例語氣：

```text
young beautiful Korean idol face, refined small face, clear bright eyes, polished youthful beauty
```

### 5.3 膚質特徵

責任：肌膚表面質感或少量臉部記憶點。

目前標準選項：

- `玻璃水光肌`
- `柔霧細緻肌`
- `自然雀斑`
- `淚痣／唇邊痣`
- `微曬陽光感膚質`

新增規則：

- 英文 prompt 以 6-14 words 為目標。
- 只描述皮膚質地、光澤、自然細節或小型記憶點。
- 不加入完整妝容、場景天氣或色溫。
- 皮膚色調應保持克制，避免變成角色種族或民族設定。

### 5.4 髮型

責任：頭髮長度、輪廓、瀏海、分線、綁法與基本形狀。髮型不負責髮色、濕感、風吹方向、毛躁程度或整體髮量狀態；這些由獨立的 `髮絲整理狀態 (Hair Styling State)` 控制。

目前標準選項：

- `帥氣濕亮油頭`（保留既有選項名稱；英文已改為輪廓描述）
- `乾淨短鮑伯`
- `齊瀏海圓弧鮑伯`
- `不對稱濕感短鮑伯`（保留既有選項名稱；英文已改為輪廓描述）
- `復古外翹短髮`
- `自然層次鎖骨髮`
- `韓系柔順中長髮`
- `側分柔波中長髮`
- `半濕感中長髮`（保留既有選項名稱；英文已改為輪廓描述）
- `直髮：中分`
- `直髮：旁分`
- `直髮：日式瀏海`
- `直髮：濕感`（保留既有選項名稱；英文已改為輪廓描述）
- `自然微彎：中分`
- `自然微彎：深側分`
- `自然微彎：瀏海`
- `自然微彎：濕感`（保留既有選項名稱；英文已改為輪廓描述）
- `柔波：中分`
- `柔波：深側分`
- `柔波：瀏海`
- `濕潤感長波浪`（保留既有選項名稱；英文已改為輪廓描述）
- `高位雙馬尾`
- `蓬鬆高馬尾`
- `低馬尾`
- `低包頭盤髮`
- `半綁公主頭`
- `柔和編髮造型`

新增規則：

- 英文 prompt 以 8-18 words 為目標。
- 長髮優先使用「質地：分線或瀏海」命名，例如 `直髮：中分`、`柔波：深側分`。
- 短髮、中長髮、綁髮可用輪廓命名，因為結構比分線更重要。
- 合併過近變體，不為髮尾微小差異新增選項。
- 不寫髮色，不寫服裝，不寫人物性格。
- 髮型英文只保留可辨識的形狀資訊，例如長度、輪廓、分線、瀏海、波形、綁法與髮尾；不要再把濕感、髮絲分束、風吹方向、蓬鬆或毛躁程度寫進髮型列。
- 髮型輪廓與整理狀態必須分開輸出。整理狀態固定提供四個選項：`柔順自然`、`濕髮分束`、`微風吹拂`、`強烈風感`；其中 `柔順自然` 是預設的乾淨控制版。
- `柔順自然` 應明確降低髮根膨脹、過度髮量、毛躁與隨機飛散髮絲；風感選項才負責方向性與被吹起的髮絲。
- 舊髮型名稱或 lock ID 若含有濕感語意，必須透過 `webapp/src/lib/engine.js` 的 legacy mapping 對應到新的髮型輪廓，並將濕感遷移到 `濕髮分束`，不得讓舊資料失效。
- AI 公開 Prompt 的欄位歸屬仍由 Subject 擁有髮型與髮色、C 穿搭設定擁有服裝與配件；跨來源去重應保留一份最具體的來源描述，不得因去重刪除髮型輪廓或服裝主體。
- 特殊穿搭若明確內含指定髮型，才可作為髮型來源例外；相同髮型不得同時在人物句與服裝句重複輸出。

### 5.4.1 髮絲整理狀態

責任：控制髮根服貼程度、髮量收斂、髮絲分束、光澤、毛躁與受風方向；不改變髮型輪廓、髮色或人物表情。

固定選項：

- `柔順自然`: clean controlled hair with close-to-head roots, restrained volume and aligned strands。
- `濕髮分束`: sleek wet finish with defined damp sections and neat separated strands。
- `微風吹拂`: light directional movement with only a few loose strands and a stable silhouette。
- `強烈風感`: visibly lifted directional strands with pronounced but coherent movement。

維護規則：

- 四個狀態是共用人物資料，可供 Gpt、Grok/Z-Image 與 AI/Midjourney 三種輸出使用；renderer 只可依模型合約壓縮，不得任意移除狀態責任。
- `柔順自然` 為缺少新 lock 的舊資料預設值；只有舊髮型本身明確含濕感時，compatibility migration 才轉成 `濕髮分束`。
- 整理狀態不應包含場景、風向來源、鏡頭、攝影風格或負面 prompt；它只描述頭髮在當下畫面中的可見整理結果。

### 5.5 髮色

責任：頭髮顏色。髮色不負責髮型、妝容或角色類型。

目前標準選項：

- `自然黑`
- `柔霧黑茶`
- `深咖啡棕`
- `栗子棕`
- `奶茶棕`
- `亞麻米棕`
- `蜂蜜焦糖棕`
- `玫瑰可可棕`
- `淺金髮`
- `銀灰白`
- `亮桃粉`
- `寶石藍`
- `深森林綠`

新增規則：

- 英文 prompt 以 6-14 words 為目標。
- 自然色、日韓沙龍色、少量特殊色即可，不要變成顏色百科。
- 特殊色要保留真實染髮質感，例如 `realistic dyed hair texture`。
- 避免螢光、塑膠假髮感、過多挑染細節。
- 新增特殊色時，先檢查是否能被現有色系覆蓋。

## 6. 神情與姿勢

這一層分成三個責任：

- `表情`: 只描述臉部可見的情緒反應、嘴型、眉毛、眼瞼狀態與情緒強度；不指定視線方向，也不等於頭部或身體動作。
- `姿勢與肢體語言`: 身體結構、重心、肢體安排、動作狀態。
- Pose Composer `手部動作`: 不依賴特定道具的手臂、手掌與手指位置，以及身體或服裝接觸。
- Pose Composer `道具動作`: 手持物、道具接觸與手機等物件互動；由獨立 `posePropId` 控制。
- Pose Composer `主要躺姿`: 僅在 `poseBaseId = lying` 時使用的主方向，由 `poseOrientationId` 選擇 `仰躺`、`側躺` 或 `趴臥`；不綁定鳥瞰或其他鏡頭角度。
- Legacy `特殊動作`: 舊資料保留給 saved cards / restore 遷移，不再作為 PAGE1 獨立 UI 欄位擴充。

### 6.1 表情

目前標準選項：

- `無額外表情`
- `柔和微笑`
- `平靜淡然`
- `無辜清透`
- `俏皮忍笑`
- `若有所思`
- `內斂克制`
- `溫柔含蓄`
- `沉浸平靜`
- `自然喜悅`
- `撒嬌生氣`
- `內斂悲傷`
- `克制憤怒`
- `輕微驚訝`
- `緊張不安`

新增規則：

- 英文 prompt 以 8-18 words 為目標。
- 表情只描述可在臉上看見的情緒反應與臉部線索，例如眉毛、眼瞼鬆緊、臉頰、嘴角、抿唇、嘟嘴或張口程度；不得描述眼睛的注意方向。
- 不描述站姿、坐姿、自拍、拿道具、服裝、場景或視線方向，也不把 `回眸`、`低頭`、`轉身`、`over the shoulder` 等頭部／身體動作寫進表情資料。
- 如果只是微笑強弱差異，優先合併，不新增。
- `eyes gently closed`、`relaxed eyelids` 與 `subtly widened eyes` 可作為表情的可見眼瞼／眼睛狀態，但不得延伸成 gaze、eye contact、looking away 或其他視線方向。
- 情緒選項應覆蓋喜、怒、哀、樂及其他自然狀態；每一個情緒都要搭配可見的臉部反應，不要只寫抽象的 `happy`、`sad` 或 `mood`。可加入低強度的 `撒嬌生氣`，但必須與真正憤怒區分。
- 共用 `en` 是三個 renderer 的 canonical 表情來源。`Gpt` 完整保留有效描述；`Grok/Z-Image` 與 `AI`／Midjourney 只可移除重複連接語與內部控制文字，不得刪掉嘴型、眼周或情緒線索，也不得自行補寫未選取的情緒。
- 一般單人 AI 不再一律省略已選表情；如果選取的不是 `無額外表情`，至少保留一個可見表情或嘴型片語，並使用同一份 resolved selection。Midjourney 不預設建立 `mj.expression` 覆寫；只有實測證明共用描述不穩定時，才可依既有 `mj.face` fallback 規則新增個別覆寫。
- 頭部方向仍由 Pose Composer 的 `poseHeadId` 控制。表情資料不得為了配合姿勢而加入頭部、身體或視線方向描述。
- 原有含視線或動作語意的表情選項已改為純表情名稱；實作改名時保留舊 `expressionId`、option ID 與 saved-card / restore 的 legacy mapping。

範例語氣：

```text
soft natural smile, relaxed cheeks, gently lifted mouth corners
```

獨立表情範例：

```text
playful pout, lightly furrowed brows, teasing mock annoyance, affectionate expression
```

表情與姿勢的責任示例：

```text
Expression: relaxed cheeks, gently lifted mouth corners, soft natural smile
Pose: natural seated pose, torso upright, one hand resting beside the body
```

### 6.2 姿勢與肢體語言

歷史相容清單（非目前 PAGE1 UI 選項）：

以下姿勢名稱保留作為舊 `poseId`、Saved Cards、匯入與 restore 的參照，不代表目前 Pose Composer 的完整公開選項。現行 UI 與隨機池以後文的五種姿勢專屬矩陣為準。

- `站姿｜自然站姿`
- `站姿｜單腳重心`
- `站姿｜身體微前傾`
- `站姿｜身體微後仰`
- `站姿｜交叉腿站姿`
- `站姿｜背對回身站姿`
- `站姿｜側身窄站姿`
- `站姿｜一腳向前點地`
- `站姿｜雙手自然垂放`
- `站姿｜雙臂交疊`

站姿分類目前保留八個公開的肢體變化，將重疊的前傾、側傾、回身、抬腳與微彎膝選項設為 `uiHidden: true`、`randomEligible: false`。這些舊 ID 不刪除，仍可由既有 Saved Cards、匯入或明確 restore 還原；新 UI 與隨機流程不再選取它們。

公開站姿的英文描述應維持正向、可直接接在 `a/an` 後面的視覺名詞片語，不使用 `arrangement`、內部控制語或抽象風格提示。完整身體描述與胸上／腰上裁切片段分開維護；裁切片段只能描述畫面可見的上半身重心、傾斜或方位，不得補造畫面外腿部動作。

站姿第一版專屬選項矩陣保留上述八個肢體變化。站姿手部動作排除 `雙手抱膝`；拉下肩線、拉褲頭、褲子口袋、外套口袋與三個眼鏡動作依服裝／眼鏡條件顯示。站姿頭部方向排除 `頭部貼近支撐面`、`頭靠近邊緣支撐` 與 `近鏡頭偏轉頭部` 這類支撐或攝影機專用描述。`自然受支撐` 保留作為相容性選項，但不列入站姿一般選單或隨機池；站姿的主要接觸／支撐使用垂直面、髖側邊緣，以及選取水域場景後才可見的水中／水邊／浴缸選項。明確還原的舊鎖仍可輸出，不因這些站姿矩陣限制而被靜默改寫。

坐姿的 10 個公開肢體變化必須在 `poseComposerOptions.js` 以 `projectionByBucket` 明確定義 `fullBody`、`cowboyKnee`、`mediumWaist`、`chestUp`、`fixedComposition`、`unconstrained`、`faceDetail` 與 `headShoulders` 的可見性。自然坐姿、前傾、隨性癱坐與開闊直立類坐姿在胸上／腰上裁切使用明確的上半身片段；雙腿屈起、盤腿、翹腿、屈膝、伸腿與側放腿等純下半身變化在胸上／腰上裁切應 `omit`，不得補造畫面外腿部動作。全身與牛仔中景保留完整坐姿描述。`雙手後撐`、`單腿放鬆` 與 `坐姿身體前傾` 為重複性較高的舊 ID，設為 `uiHidden: true`、`randomEligible: false`，但仍可由既有資料還原；原 `抱膝坐姿` 使用同一 ID 改名為公開的 `雙腿屈起`，英文只描述雙腿屈起，不綁定手部。坐姿投影不得再依賴 `engine.js` 的歷史硬編碼 fallback。

坐姿第一版專屬矩陣保留上述十個公開肢體變化。坐姿頭部方向排除 `頭部貼近支撐面`、`近鏡頭偏轉頭部` 與 `頭靠近邊緣支撐` 這類技術性支撐／攝影機描述；明確還原仍可輸出。`雙手抱膝` 不綁定坐姿選單，但隨機池只在 `雙腿屈起` 與 `單腿屈起坐姿` 下啟用，其他明確手動組合仍保留。坐姿的主要接觸／支撐使用具體座面、抬高邊緣、地面、柔軟平面與垂直面；`自然受支撐` 保留作為相容性選項，但不列入坐姿一般選單或隨機池。`坐在單人雕花絨布椅` 保留明確選取但不參與坐姿隨機。這些矩陣限制只作用於 UI 投影與隨機相容性，不能靜默覆寫明確鎖定或既有 Saved Cards／restore 值。

跪姿第一版結構矩陣保留八個公開肢體變化：`跪坐`、`分腿跪坐`、`前傾跪姿`、`四足跪姿`、`跪姿側身`、`直立端正跪姿`、`側坐跪姿` 與 `單膝前跨跪姿`。`單膝跪地` 與 `跪姿微後仰` 的既有 ID 不刪除，改設為 `uiHidden: true`、`randomEligible: false`，供舊 Saved Cards、匯入與明確 restore 使用。四足跪姿新增跪姿專用手部選項 `雙掌撐地` 與 `雙肘撐地`；兩者只在四足跪姿的隨機手部池中出現，四足跪姿的隨機手部也只允許這兩個支撐動作。`雙手抱膝` 保持獨立手部選項，但跪姿隨機只允許搭配 `跪坐`、`分腿跪坐` 與 `側坐跪姿`。八個公開肢體變化現在都以 `projectionByBucket` 明確定義八種 composition visibility bucket：`前傾跪姿`、`四足跪姿`、`跪姿側身`、`直立端正跪姿` 在胸上／腰上裁切保留只描述可見上半身的片段；`跪坐`、`分腿跪坐`、`側坐跪姿`、`單膝前跨跪姿` 在胸上／腰上裁切省略膝腿幾何，於牛仔中景與全身恢復完整描述。雙掌／雙肘撐地屬於地面接觸，胸上／腰上不輸出，牛仔中景與全身才保留。八個公開選項的完整英文改為直接描述可見的身體幾何與重心，不使用 `arrangement` 或內部控制語；上半身裁切片段維持可接在 `a/an` 後的名詞片語，避免投影產生冠詞錯誤。完整英文描述仍保留明確鎖定與舊資料還原不可被靜默覆寫的規則。

`雙手後撐`、`瑜伽小狗式交叉手托下巴` 與 `手肘支撐跪姿` 同樣保留舊 ID 但不再出現在一般選單或隨機池；`越肩回望`、`側臉轉向畫面外` 與 `下巴靠近肩線` 也是可還原但 UI 隱藏的舊頭部選項。`在水中`、`靠在水邊支撐` 與 `浴缸` 屬於場景依賴的水域支撐選項，只有選取相容水域場景後才顯示。

蹲姿目前只保留七個公開肢體變化：`自然蹲姿`、`單膝抬起不對稱蹲姿`、`側身蹲姿`、`低蹲單腿前伸`、`身體前傾蹲姿`、`雙膝合併半蹲`、`寬膝深蹲／流氓蹲姿`。其中 `側身蹲姿` 的定義是下半身維持蹲姿、上半身轉向鏡頭，不是整體側面站位；`身體前傾蹲姿` 不綁定手部；抱膝改由獨立 `poseHandId` 的 `雙手抱膝` 表達。七個公開選項必須在 `poseComposerOptions.js` 以 `projectionByBucket` 明確定義八種 composition visibility bucket。自然蹲姿與身體前傾蹲姿在胸上／腰上裁切使用明確的上半身片段；其餘下半身主導蹲姿在胸上／腰上裁切應 `omit`，中景只保留不補造腿部幾何的蹲姿基底；雙膝合併半蹲在牛仔中景使用可見膝蓋範圍的縮短片段。全身、unconstrained 與 fixed composition 保留完整 canonical pose。蹲姿另有六個獨立的下半身手部選項：`雙手向前伸展`、`雙手自然放在兩腿外側`、`單手托腮一手扶膝`、`單手碰嘴角一手自然下垂`、`單手在臉旁比 V`、`雙手托腮扶臉`；只在蹲姿顯示與加入隨機池，胸上裁切省略，且臉部動作在後視圖隨機池排除。原有重複或特殊化蹲姿 ID 不刪除，改設為 `uiHidden: true`、`randomEligible: false`，供既有資料還原；蹲姿 projection 不得再依賴 `engine.js` 的歷史硬編碼 arrangement fallback。

蹲姿公開英文已完成重寫：直接使用可接在 `a/an` 後面的視覺名詞片語，不使用 `arrangement` 或 renderer 控制語。`自然蹲姿` 必須明確寫出雙腳貼地與腳跟落地；`單膝抬起不對稱蹲姿` 必須寫出一側膝蓋較高與另一腿深屈；`側身蹲姿` 只寫臀腿維持低蹲、軀幹轉向鏡頭，不得使用會把整個人物變成側面的 `side-facing`；`低蹲單腿前伸` 必須寫出一腿向前伸直、另一腿折在身下；`身體前傾蹲姿` 必須寫出軀幹從髖部向大腿前傾；`雙膝合併半蹲` 使用 `half-squat` 與雙膝、雙腿平行的幾何；`寬膝深蹲／流氓蹲姿` 寫出雙腳寬距、膝蓋向外與低髖部。上半身裁切片段只能描述軀幹直立或前傾；下半身主導選項維持上裁切 `omit`。退役選項的英文不回寫，避免破壞舊 Saved Cards / restore 的歷史輸出。

下列舊姿勢名稱同樣只作 `poseId`／legacy 相容參照，不代表目前 PAGE1 的公開 Pose Composer 選項；新增或修改姿勢時不得以這份舊清單取代現行專屬矩陣。
- `坐姿｜自然坐姿`
- `坐姿｜微微前傾`
- `坐姿｜隨性癱坐`
- `坐姿｜雙腿自然伸展`
- `坐姿｜盤腿坐姿`
- `坐姿｜側身坐姿`
- `坐姿｜雙腿屈起`（舊資料中的 `坐姿｜抱膝坐姿` 仍可還原）
- `坐姿｜翹二郎腿`
- `坐姿｜單腿屈起坐姿`
- `坐姿｜雙腿側放坐姿`
- `坐姿｜開闊自信坐姿`
- `半躺低姿態｜側身半躺`
- `半躺低姿態｜正面仰躺`
- `半躺低姿態｜手撐半躺`
- `半躺低姿態｜微蜷放鬆`
- `半躺低姿態｜趴姿`
- `半躺低姿態｜側躺延伸`
- `蹲姿｜自然蹲姿`
- `蹲姿｜單膝蹲姿`
- `蹲姿｜手扶膝蓋蹲姿`
- `動態｜輕步移動`
- `動態｜整理頭髮`
- `動態｜整理衣襬`
- `動態｜抬手整理肩頸`
- `動態｜回身動作`
- `動態｜停步姿勢`

新增規則：

- 英文 prompt 以 8-24 words 為目標；複雜躺姿可略長，但要有測試保護。
- 只描述 body structure、weight、limbs、motion state。
- 不寫 `looking at camera`、`lowered gaze`、`over-the-shoulder gaze`，這些屬於神情。
- 不新增自拍或鏡子自拍為一般 `poseId` 姿勢；自拍類屬於 Pose Composer 的 `手部姿勢`。
- PAGE1 不再顯示一般 `poseId` 姿勢選單；舊 `poseId` restore / normalize 應轉成 `poseBaseId`、必要時的 `poseOrientationId`、`poseArrangementId`、`poseHandId`、`posePropId`、`poseHeadId`、`poseAnchorId` 的可見組合，並清空 `poseId`。
- 新姿勢必須改變身體輪廓或構圖效果；單純手的位置小差異不建議新增。

Pose Composer `手部動作` / `道具動作` 規則：

- `poseHandId` 只承擔不依賴特定道具的手部姿態；手持或使用具體物件改由獨立儲存與顯示的 `posePropId` 承擔。V1 不同時合成手部與道具層：有效道具會接管手部層，選擇道具時必須清空 `poseHandId`。
- 舊 saved card / import 若把既有道具 option ID 存在 `poseHandId`，normalize 應將該 ID 遷移至 `posePropId` 並清空舊手部 lock；若 payload 已有有效的明確 `posePropId`，不得用 legacy 值覆蓋，且同樣由明確道具接管並清空 `poseHandId`。
- 合併或改寫道具英文時，若舊 Markdown import 可能只留下舊 prompt 文字，應在 option `meta.legacyPromptAliases` 保留舊英文，讓標準 prompt parser 能映射至目前 option ID。

- 共用 `poseHandId` 維持精簡的 18 個具體動作：`雙手自然垂放`、`雙臂交疊`、`一手扶腰一手自然放下`、`雙手背在身後`、`雙手放在頭後`、`單手向鏡頭張開手掌`、`單手托下巴`、`單手碰嘴角`、`單手往後撥瀏海`、`雙手抓著整束頭髮與髮尾整理`、`拉下肩線整理上衣`、`雙手把褲子或裙子的褲頭往上拉`、`雙手抱膝`、`雙手插褲子口袋`、`雙手插外套口袋`、`單手拿著眼鏡`、`單手把眼鏡拉下`、`咬著眼鏡腳`。這 18 個是跨姿勢可共用的動作，不包含姿勢專屬手部池。`雙手抱膝` 是不綁定特定基底的下身手部動作，可與自然蹲姿、坐姿或其他可見下半身姿勢組合。
- 蹲姿另有六個專用手部動作：`雙手向前伸展`、`雙手自然放在兩腿外側`、`單手托腮一手扶膝`、`單手碰嘴角一手自然下垂`、`單手在臉旁比 V`、`雙手托腮扶臉`；只在蹲姿的 UI 與隨機池出現。
- 躺姿手部依 `仰躺`、`側躺`、`趴臥` 分成各自的專用池，並由 `visibleBuckets`、方向矩陣與隨機相容性規則控制；不得把躺姿專用動作誤列為共用手部。
- `雙手抓著整束頭髮與髮尾整理` 必須明確描述一手抓住髮根附近、另一手抓住並順過整束髮尾的自然整理動作，不得只寫籠統的 `arrange hair`。
- `單手往後撥瀏海` 必須描述手指把瀏海向後梳理的帥氣整理動作，不再使用含糊的 `brush hair`。
- `拉下肩線整理上衣` 必須描述從單側肩膀拉下領口／肩線、露出肩膀，同時衣服仍與身體相連並自然垂墜，避免模型把衣物生成成斷裂或脫落狀態。
- `雙手把褲子或裙子的褲頭往上拉` 必須明確是稍微往上拉回定位，不得寫成往下拉、脫下或移除服裝。
- `單手拿著眼鏡`、`單手把眼鏡拉下`、`咬著眼鏡腳` 都要求眼鏡是已存在的穿戴配件；其中咬眼鏡腳要寫明鏡腳輕放齒間、鏡框取下後自然垂在臉頰旁。
- 服裝／配件條件由手部 option metadata 與 shared random compatibility resolver 同步執行：褲頭／褲袋需有褲或裙，外套口袋需有外套，眼鏡互動需有眼鏡；明確 `全無` 只排除隨機候選，不覆寫使用者明確手勢 lock。
- 胸上、腰上、牛仔中景與全身／固定構圖使用同一份 `visibleBuckets` metadata 投影；臉部接觸與眼鏡互動的隨機候選會避開背面／後三分之四與鳥瞰角度。
- 原有自拍、下身接觸、遮臉、扶眼鏡、抓褲腰等低泛用手勢保留為 `uiHidden: true`、`randomEligible: false` 的退役解析項，供既有 restore／parser 使用但不再出現在新 UI 或隨機池。
- 手持道具類應描述手上有什麼，不要不必要地綁死道具位置。例如 `手持冰咖啡`、`手持香菸`、`手持波板糖` 由模型依姿勢與構圖自然決定位置。
- 若手部 / 道具動作需要更寬構圖，應保留相容性 tags，例如 `prop_action`、`face_action`、`eyewear_action`、`wardrobe_action`、`leg_focus_action`。

Pose Composer `接觸 / 支撐` legacy policy：

- 低泛用、場景綁定或已被新版泛用 anchor 取代的舊選項不得直接刪除；設為 `uiHidden: true`、`randomEligible: false`，使其不出現在新 UI、也不進入隨機候選。
- 這類 hidden anchor 的既有 ID 仍須能由 saved card / import / normalize 明確還原並產生原本 prompt；只有另有相容 migration 時才可改映射。

### 6.3 特殊動作

狀態：`specialActionId` 目前已從 PAGE1 `B 神情姿態` 的獨立 UI 欄位隱藏。資料仍保留在 `knowledge_base/character_design.md` 與 `database.json`，用途是 legacy saved cards / restore 遷移與回溯相容；確認新 Pose Composer 路徑長期穩定後，可再評估移除舊資料。

維護規則：

- 不再新增新的 `特殊動作` 選項。
- 道具、手機、口紅、飲料、香菸等物件互動新增到 Pose Composer `道具動作`；不依賴道具的手部姿態與服裝整理新增到 `手部動作`。
- 完整身體姿態新增到 Pose Composer `肢體變化`，必要支撐物則放入 `接觸 / 支撐`。
- 舊 `特殊動作` 若需要保留 restore 行為，應在 `engine.js` 加 legacy migration，轉成 `poseBaseId`、必要時的 `poseOrientationId`、`poseArrangementId`、`poseHandId`、`posePropId`、`poseHeadId`、`poseAnchorId` 的組合，並清空 `specialActionId`。

目前特殊動作全部保留，共 23 個非空選項：

- `塗口紅`
- `塗歪口紅`
- `喝冰咖啡`
- `咬著波板糖`
- `抽煙`
- `整理絲襪`
- `前傾抓住褲腰`
- `側坐單手後撐`
- `抱膝托腮坐姿`
- `仰躺雙手微抬`
- `跪坐回眸撩髮`
- `半脫上衣整理肩線`
- `隨性癱坐在雕花單人絨布沙發上`
- `趴臥滑手機`
- `靠牆站立`
- `靠牆坐姿`
- `靠牆後仰站姿`
- `靠牆仰躺抬腿`
- `側身斜躺伸腿`
- `跪姿前傾倚靠高背`
- `四足跪姿前傾`
- `抱枕俯臥回眸`
- `分腿跪坐仰視`

新增規則：

- 英文 prompt 必須 <= 55 words，且 <= 360 characters。
- 中文 `desc` 必須短，目標 <= 100 characters。
- 使用明確動詞與物件接觸，例如 `holding`、`biting`、`leaning`、`pulling`、`resting against`。
- 需要場景支撐的動作可以保留，但 prompt 只描述必要支撐物，不自動指定完整場景。
- 道具動作要明確道具可見性與接觸點。
- 全身動作要明確肢體結構，避免只寫情緒。

特殊動作類型：

- 道具或臉部互動：口紅、冰咖啡、波板糖、香菸。
- 穿搭整理：整理絲襪、半脫上衣整理肩線。
- 大型支撐物或場景物件：沙發、牆面、高背、抱枕。
- 完整身體動作：趴臥、跪姿、四足跪姿、分腿跪坐等。

非社群特殊動作規則：

- 通常會取代一般 `poseId`。
- 如果行為本身已經決定全身姿勢，不要同時要求一般 pose。

## 7. 特殊角色

特殊角色可以覆蓋身份基底與一般穿搭。它可以使用較長描述，因為它需要完整定義角色外觀、材質與真實世界融合方式。

目前固定選項與 id：

- `skeleton` / `黑骷髏`
- `white-skeleton` / `白骷髏`
- `sengoku-samurai` / `日本戰國武士`
- `european-knight` / `歐洲騎士`
- `female-android` / `女性人形機器人`

行為規則：

- 選中特殊角色時，人物數量強制為 1 位。
- 特殊角色會 suppress normal wardrobe output。
- 戰國武士、歐洲騎士不保留一般髮型與髮色控制。
- 女性人形機器人保留髮型與髮色控制。
- 神情與姿勢仍可和特殊角色共存。
- 場景、環境光、光線表現、攝影與成像仍由 B/C/D 區控制。

角色卡 `characterProfileId` 是 A 區第三個獨立入口，和特殊角色共用 dedicated subject 生成路徑，但不放在 `specialSubjectId` 選單中。

目前固定角色卡與 id：

- `character-rika` / `11_Rika`
- `character-48g` / `48_G`
- `character-philippa` / `29_Philippa`
- `character-lily` / `07_Lily`
- `character-hinata` / `06_Hinata`
- `character-rin` / `38_Rin`
- `character-sakura` / `12_Sakura`
- `character-sui` / `03_Sui`
- `character-yuri` / `02_Yuri`
- `character-hina` / `37_Hina`

角色卡 `character-profile` 規則：

- 角色卡用於固定原創角色身份、臉、髮型、身形與招牌穿搭。
- 角色卡會 suppress normal wardrobe output，避免一般穿搭稀釋角色設定。
- 角色卡不保留一般髮型與髮色控制，髮型髮色寫在角色卡身份描述中。
- 角色卡仍可使用 B 神情姿態、特殊動作與 Pose Composer。
- 角色卡選項使用圖片 picker 顯示，`meta.referenceImage` 應指定單張代表正面照 public path；完整 reference sheet 仍放在 `referenceImages` metadata。
- 角色卡不應使用 `unknown anomalous figure` 共享融合句；應使用角色一致性與 reference sheet guidance。
- 每張角色卡可包含 `referenceImages` metadata，記錄 face-turnaround、full-body、expression-sheet 等來源。

創作方向：

- 像一個未知角色突然出現在真實現代世界中。
- 自然融入選定場景，而不是自己帶出戰場、城堡、實驗室或博物館。
- 強調真實比例、接觸陰影、環境光影響、材質細節與 live-action photographic realism。

共享融合句應由 prompt assembly 加入，不要每列重複：

```text
an unknown anomalous figure appearing naturally inside a real contemporary environment, photographed as if genuinely present in the same physical space, grounded by realistic scale, contact shadows, ambient light, and ordinary surroundings
```

長度建議：

- 骷髏類：45-85 English words。
- 歷史武士與騎士：80-130 English words。
- 女性人形機器人：100-160 English words。
- 共享融合句：25-45 English words。

MJ 專用投影規則：

- `en` 是 Gpt／Grok-Z 的完整特殊角色來源；不要為了 MJ 字數直接刪改它。
- 需要 MJ 優化的特殊角色，可以在同一個 option 增加 `mjPromptByBucket`，由 `compositionVisibility.bucket` 選擇 `faceDetail`、`headShoulders`、`chestUp`、`mediumWaist`、`cowboyKnee` 或 `fullBody` 描述。
- MJ 投影只保留角色身份、主要材質與少量可辨識標誌；不得帶入與目前裁切不相容的 `full-body`、手腳、下半身或武器描述。
- MJ 版本不得使用 `model-decided`、`let the image model decide` 或多組互斥選項清單；需要穩定的畫面結果時，應在投影中選定單一正向視覺錨點。
- 目前 `日本戰國武士`、`歐洲騎士`、`女性人形機器人` 與黑／白骷髏已使用上述規則；Gpt／Grok-Z 仍保留完整甲冑、騎士板甲、機械關節、骷髏骨架與骨色來源，只有 AI／MJ 與 `MJ 胸上特寫照` 使用裁切相容的精簡版本。

負面詞規則：

- 避免 `not anime`、`not cosplay`、`not fantasy armor`、`not toy-like`。
- 改用 `live-action photographic realism`、`practical physical construction`、`documentary-real material detail`、`realistic robotics and synthetic material construction`。
- 若未來真的需要負面詞，必須先有明確 regression 測試。

## 8. 改名、合併與舊資料相容

多數 option id 會由 category、中文標籤與 row index 產生。因此改名、合併、調整排序都可能讓舊 favorite 或 saved lock 找不到選項。

維護規則：

- 優先 append 新選項，不任意插入中間。
- 改名、合併、移除時必須加入 legacy mapping。
- 舊選項應 map 到最接近的新選項，不要掉回 `全無`。
- 舊 `poseHandId` 道具 lock 必須遷移到 `posePropId`；legacy anchor 則依 `uiHidden` / `randomEligible` policy 保留可還原性。
- 社群自拍類舊姿勢若被拆分，應同時保留身體姿勢與 `specialActionId`。

目前相關 mapping 區域：

- `CHARACTER_IDENTITY_LEGACY_OPTION_MAP`
- `CHARACTER_EXPRESSION_POSE_LEGACY_OPTION_MAP`
- `CHARACTER_EXPRESSION_POSE_LEGACY_SOCIAL_POSE_MIGRATIONS`

特殊角色舊 subject count lock 也需要支援，例如舊的 `subjectCount: white-skeleton` 應轉為：

```js
{
  subjectCount: '1',
  specialSubjectId: 'white-skeleton'
}
```

舊版角色卡若曾存在於 `subjectCount` 或 `specialSubjectId`，需轉為：

```js
{
  subjectCount: '1',
  specialSubjectId: 'none',
  characterProfileId: 'character-48g'
}
```

## 9. 新增選項流程

新增一般 A 區選項：

1. 確認它屬於哪一個欄位，不跨欄位混寫。
2. 檢查現有選項是否已能覆蓋，能合併就不要新增。
3. 在 `knowledge_base/character_design.md` 新增或修改 row。
4. 跑 `python3 scripts/sync_to_json.py`。
5. 如果有改名、合併、刪除，更新 `engine.js` legacy mapping。
6. 更新對應測試的標準選項清單或 prompt 斷言。
7. 跑完整驗證。

新增特殊角色：

1. 在 `SPECIAL_SUBJECT_OPTIONS` 新增固定 id、zh、en、count、specialSubject 類型。
2. 確認是否需要新的特殊生成路徑或 sanitizer。
3. 不要讓特殊角色自帶場景。
4. 確認是否 suppress wardrobe、是否保留 hair controls。
5. 更新 `engineSpecialSubjects.test.js`。
6. 跑完整驗證。

新增角色卡：

1. 在 `CHARACTER_PROFILE_OPTIONS` 新增固定 id、zh、en、count、`specialSubject: 'character-profile'`。
2. `en` 需包含固定臉部身份、髮型、身形、招牌穿搭與寫實風格，不要包含固定場景。
3. 若有設定圖，加入 `referenceImages`，至少標註 `type`、`label`、`sourcePath`、`publicPath`。
4. 確認角色卡由 `characterProfileId` 控制，不出現在 `specialSubjectId` 選項中。
5. 確認角色卡不輸出 normal wardrobe。
6. 確認角色卡輸出使用 character reference guidance，不使用 anomalous special subject guidance。
7. 更新 `engineSpecialSubjects.test.js`。
8. 跑完整驗證。

## 10. 測試與驗證

依修改範圍更新或新增測試：

| 修改範圍 | 主要測試 |
| --- | --- |
| 身份基底、體態、五官、髮型、髮色 | `webapp/src/lib/engineCharacterIdentityBase.test.js` |
| 神情、姿勢、社群自拍相容 | `webapp/src/lib/engineExpressionPoseCleanup.test.js` |
| 特殊動作 prompt 與 meta tags | `webapp/src/lib/engineSpecialActionCleanup.test.js` |
| 特殊角色 | `webapp/src/lib/engineSpecialSubjects.test.js` |

完整驗證命令：

```bash
cd webapp
node --test src/lib/engineCharacterIdentityBase.test.js
node --test src/lib/engineExpressionPoseCleanup.test.js
node --test src/lib/engineSpecialActionCleanup.test.js
node --test src/lib/engineSpecialSubjects.test.js
npm test
npm run lint
npm run build
git diff --check
```

允許既有 Vite chunk-size warning；其他錯誤需修正。

躺姿現在採用兩層結構：`poseOrientationId` 提供三個主要方向 `仰躺`、`側躺`、`趴臥`，`poseArrangementId` 則提供五個獨立的身體／腿部變化：`自然伸展`、`雙腿屈起`、`身體微蜷`、`上半身半躺`、`上半身撐起`。主要躺姿不綁定鳥瞰鏡頭；鏡頭仍由攝影設定獨立控制。`自然伸展`、`雙腿屈起`、`身體微蜷` 可用於三種方向；`上半身半躺` 只進入仰躺；`上半身撐起` 只進入側躺與趴臥。前兩個變化屬於下半身幾何，在胸上／腰上裁切應 `omit`；後三個變化提供可見的上半身投影片段。全身、unconstrained 與 fixed composition 保留方向與身體變化的完整 canonical pose。舊躺姿專用 arrangement ID 保留但設為 `uiHidden: true`、`randomEligible: false`，供 Saved Cards、匯入與明確 restore 還原。

躺姿公開英文使用直接、正向的視覺片語：側躺與趴臥仍使用 `side-lying position, torso turned onto one side`、`prone position, torso facing downward`；仰躺改用表面主導的自然句型，不再輸出 `supine position` 或其他方向控制語，改由 `She lies on ... that dominates the composition` 表達「她躺在主要支撐面上」。方向片語只描述軀幹朝向，不自行指定臉部方向或具體支撐物；頭部、手部與接觸／支撐由各自獨立選項負責。身體／腿部變化使用 `her body resting in a relaxed extended line with the legs resting naturally`、`both knees comfortably bent and resting naturally`、`her body gently curled inward into a compact shape`、`her upper body slightly raised in a gentle half-recline`、`upper body raised into a supported incline`，只描述身體幾何，不加入鏡頭、視線或內部控制語。仰躺手部保留「雙手自然放在身側、一手放在頭後、一手放在腹部、雙手向頭頂伸展、雙手合掌靠在臉側」；側躺與趴臥各使用自己的下側手臂／身前／臉側／肘部支撐選項。共用手部與頭部選項在躺姿隨機池停用，但舊 ID 仍可明確還原。仰躺是特殊的表面主導模式：PAGE1 UI 將 `固定構圖場景`、`場景基底`、PAGE3 空景架構與其匯入／可見文字欄位顯示為 `全無` 並停用；生成 prompt 與 selection/export 同樣輸出 `none`，但公共 prompt 不輸出 `none`、`全無` 或場景控制語。只有 `環境光線` 保持可操作。仰躺的 `接觸／支撐` 選項改為獨立表面池：床、榻榻米、地板、乾浴缸、沙發、草地、水泥地、白色細沙沙灘與清澈海面，另保留水中／水邊支撐；每個表面可附一個簡短生活感環境句，並由支撐面主導構圖。海面描述清澈的海洋淺灘與可見珊瑚礁，水泥地使用水泥沙包、木材與鋼材等工地元素，榻榻米使用隨意擺放的日式坐墊與日本雜誌。切離仰躺回站、坐、蹲、跪、側躺或趴臥時，UI 會恢復切換前的場景／固定構圖值。Chest-up／Medium projection 仍只輸出畫面可見的上半身片段；下半身變化不回寫到胸上／腰上裁切。

## 11. Review Checklist

送出前請確認：

- 選項是否真的屬於 A 區，而不是 B 場景、C 光線或 D 攝影。
- 英文 prompt 是否短、清楚、正向。
- 是否避免了動畫、cosplay、fantasy、plastic wig、childlike 等不穩定方向。
- 是否沒有在體態、五官、髮型、髮色中偷渡表情、姿勢、服裝、場景。
- 是否沒有在神情中偷渡姿勢，或在姿勢中偷渡視線。
- 特殊動作是否有必要的 meta tags，社群拍攝動作是否可與 pose 共存。
- 特殊角色是否自然融入現代真實場景，而不是自己指定場景。
- 改名或合併是否保留舊 saved lock 相容性。
- 測試是否覆蓋新行為與舊資料遷移。
