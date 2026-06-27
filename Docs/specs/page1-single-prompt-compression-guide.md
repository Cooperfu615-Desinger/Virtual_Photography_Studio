# PAGE1 單人 Prompt 壓縮撰寫規範

Last updated: 2026-06-27

這份文件整理 PAGE1 單人模式下 `Gpt` / `Grok/Z-Image` / `AI` 三組輸出的 prompt 撰寫與壓縮規則。新增或修改 A 人物設定、B 神情姿態、C 穿搭設定資料時，請先依照對應 authoring guide 檢查欄位責任，再用本規範檢查英文 prompt 是否過度冗長。

## 1. 三組輸出定位

### Gpt

- Internal field: `grokPrompt`
- Target: ChatGPT Image / GPT Image
- 格式：結構化自然段落。
- 固定主區塊順序：`Image Type`、`Subject`、`Wardrobe`、`Pose and Composition`、`Scene`、`Lighting`、`Camera Look`、`multi-cut sequence n=2`。
- 不輸出 `Constraints`。
- 結尾必須保留 `multi-cut sequence n=2`。
- 單人特殊穿搭的 `Wardrobe` 可用子區塊幫助人工微調：`Hair and body details`、`Full outfit`、`Headwear, eyewear, and bag`。
- 單人角色卡的 `Subject` 可用子區塊幫助人工微調：`Character Profile Card`、`Identity and body`、`Hair`、`Outfit`、`Accessories`、`Photographic direction`。

### Grok/Z-Image

- Internal field: `zImagePrompt`
- Target: Grok Imagine / Aurora / Z-Image
- 格式：自然語言空行段落。
- 不使用 GPT 式英文段落標籤。
- 不加入 `multi-cut sequence n=2`。
- 可比 Gpt 多保留一些自然語氣，因為此輸出偏向直接給自然語言模型理解。

### AI

- Internal field: `midjourneyPrompt`
- Target: AI compact natural prompt
- 格式：極簡自然英文段落。
- 像早期手寫 prompt，短而直接。
- 不出現中文。
- 不加入「模型自然決定」類說明句。
- 不過度詳細，但不能漏掉核心服裝、姿勢、動作、場景、光線與 camera look。

## 2. 壓縮總原則

英文 prompt 應該先問三件事：

1. 這個詞是否帶來新的可視覺化資訊？
2. 這個詞是否屬於目前欄位的責任？
3. 移除後是否仍能維持服裝設計、人物特徵或姿勢意圖？

保留：

- 可被畫面辨識的結構、材質、版型、長度、穿法、位置。
- 影響生成結果的 anchor，例如 `low-rise`, `thigh-high stockings`, `side-part`, `direct eye contact`。
- 特殊穿搭、套裝、連身的造型核心與層次關係。
- Pose Composer 的身體結構、支撐點、手部位置、頭部方向。

刪減：

- 同義詞堆疊，例如同時寫多個 `beautiful / polished / refined / elegant`。
- 泛用結尾，例如 `coordinated styling`, `balanced look`, `fashionable presence`，除非它是唯一的風格 anchor。
- 正常狀態說明，例如眼鏡正常戴在臉上時不需要 `worn normally on the face`。
- 內部控制語言，例如 `controlled by selection`, `preserve selected wardrobe identity`, `body proportion anchor`。
- 過長解釋句，例如「模型自然決定姿勢」或「服裝按正常穿著順序」這類操作說明。

避免：

- 負面堆疊：`not...`, `avoid...`, `without...`。
- 把場景、光線、鏡頭、人物表情塞進服裝欄位。
- 把完整穿搭塞進一般上身或下身單品。
- 把顏色寫死在一般單品 prompt；顏色應交給配色欄位。

## 3. A 人物設定壓縮規則

體態、五官、膚質、髮型、髮色都應使用短片語，避免描述成完整小說句。

建議長度：

- 體態：8-16 words。
- 五官：8-16 words。
- 膚質：4-12 words。
- 髮型：8-16 words。
- 髮色：4-12 words。

建議寫法：

```text
core category, 1-3 concrete visible traits
```

可保留：

- `long legs`, `narrow waist`, `rounded hips`
- `small refined face`, `clear bright eyes`
- `dewy glass skin`, `natural freckles`
- `silver-gray white deep side-parted long soft waves, realistic dyed texture`
- `natural black wet-look long wavy hair`

應刪減：

- 數值比例、身高體重、測量式 anchor。
- `hair color applies only to scalp hair` 這類操作說明。
- `eyebrows remain natural` 可壓成 `natural eyebrows`，只有特殊髮色需要時才保留。
- Gpt 單人 Subject 中不要讓髮色獨立成短句，例如 `wet-look long wavy hair. natural black hair.`；應合併為 `natural black wet-look long wavy hair`。
- 臉部美感同義詞堆疊。

## 4. B 神情姿態壓縮規則

神情只寫臉、眼神、嘴型與情緒強度。姿態只寫身體安排、重心、支撐與動作狀態。

可保留：

- `direct eye contact`
- `soft natural smile`
- `downward gaze`
- `standing pose with loosely crossed arms`
- `one hand brushing hair back`
- `visible hand-to-mouth contact`

應刪減：

- `body language` 可壓成 `posture`。
- `portrait moment`, `portrait interaction`, `beauty touch-up portrait moment` 這類泛用尾巴。
- `relaxed everyday...`, `polished...`, `controlled cinematic...` 若不影響畫面可刪。
- 特殊動作保留接觸點與道具狀態，不保留多餘情緒敘述。

Pose Composer 相關描述應保留實際身體結構，例如 base arrangement、hand placement、support anchor、head direction。不要新增 Pose Modifier，除非使用者明確要求。

## 5. C 穿搭設定壓縮規則

### 一般上下身與配色

一般單品只描述本身，不描述完整穿搭。

建議格式：

```text
fit or rise, color from palette if already composed, garment type, 1-2 concrete traits
```

範例方向：

- `tight white ribbed cotton camisole with slim straps`
- `high-rise fitted indigo straight-leg jeans`
- `washed denim jacket with chest pockets and metal buttons`

應刪減：

- `clean compact upper-body line`
- `balanced leg line`
- `classic five-pocket construction`
- `properly worn on both shoulders`
- `realistic outer-to-inner dressing order` 的長句；如需要只保留短 guard。

### 鞋襪與外層

鞋襪與外套要保留款式辨識點，但避免把正常穿著狀態寫得像特殊指令。

保留：

- 鞋型、鞋底、鞋面、signature accent。
- 襪長、材質、蕾絲、garter、ribbed texture。
- 外套種類、長度、材質、開合、肩線或 hood。

刪減：

- 正常穿著、自然可見、完整覆蓋這類預設狀態。
- 過長的外層穿搭順序說明，除非該組合容易生成錯層。

### 套裝與連身

套裝與連身的主要用途是鎖定服裝造型與穿搭方式。壓縮時不能改變服裝設計方向。

保留：

- 主服裝類型。
- one-piece 或 set 的核心輪廓。
- neckline、hem、fabric、trim、主要結構。
- 套裝必要識別物，例如制服帽、apron、bunny-ear headband。
- 配色控制所需的目標區域，但語氣要短。
- 完整造型色系在 Gpt 中應融入服裝片語，例如 `black-and-red street solid satin cheongsam mini outfit`，不要保留 palette direction 操作句。
- 特殊上下配色用短片語保留上下區域，例如 `lime whisper lower hem or skirt accent`，不要輸出 `coordinated top-to-bottom palette`。

刪減：

- `one-piece silhouette` 重複出現時可刪。
- `main fabric color controlled by...` 可壓成 `selected main fabric color`。
- Gpt 輸出中 `selected main fabric color`、`selected uniform color`、`controlled by...`、`complete outfit palette direction...` 應移除或融入服裝，不作為獨立控制語。
- `metal hardware kept in fixed metallic tones` 可壓成 `metal hardware in fixed metallic tones`。
- 泛用的 `complete styling`, `polished outfit`, `balanced silhouette`。

### 特殊穿搭

特殊穿搭是完整造型包，不能因壓縮而拆壞原始搭配。資料庫英文 prompt 仍必須以 `complete outfit:` 開頭。

資料庫建議格式：

```text
complete outfit: style direction. core top or one-piece, core bottom, outer layer if any, socks or footwear, key accessories, fixed visual anchors.
```

Gpt 單人輸出會將特殊穿搭整理成：

```text
Wardrobe:
Hair and body details:
...

Full outfit:
...

Headwear, eyewear, and bag:
...
```

分類規則：

- `Hair and body details`: 特殊穿搭內含的髮型、瀏海、髮色、刺青、身體小記憶點。
- `Full outfit`: 上衣、下身、連身、外套、襪類、鞋款、皮帶、首飾、手套、耳機、穿搭層次。
- `Headwear, eyewear, and bag`: 帽子、頭巾、髮夾、眼鏡、墨鏡、包包。

保留：

- 固定造型的主風格短句，例如 `Y2K schoolgirl-inspired styling`。
- 所有核心衣物層次。
- 鞋襪、包包、帽子、眼鏡等可人工刪改的 accessory anchor。
- image-reference outfits 的 hair、bags、accessories、footwear，除非該批資料明確要求 omit bags and hairstyles。

刪減：

- 尾端純泛用 `coordinated ... styling`。
- `complete special outfit` 這種輸出層重複前綴；資料庫仍保留 `complete outfit:`。
- 不承載新資訊的 `look`, `styling`, `visible`, `delicate`, `small`；若該詞是唯一辨識重點則可保留。

## 6. 欄位責任邊界

### 角色卡 GPT 分組

角色卡的 GPT 版以「同一人物穩定性」為優先目標，因此 `Subject` 內使用固定分組。新增或修改角色卡時，應優先補 `profile` 分組資料，不要只依賴自動拆分 fallback。

Gpt 角色卡輸出格式：

```text
Subject:
Character Profile Card:
角色卡名稱

Identity and body:
...

Hair:
...

Outfit:
...

Accessories:
...

Photographic direction:
...
```

分組責任：

- `Identity and body`: 五官、臉型、眼睛、眉毛、鼻子、嘴唇、膚質、妝容、體態比例。這組是角色穩定性的核心，可以比一般 A 人物設定更完整，但仍要避免空泛美感詞堆疊。
- `Hair`: 髮色、髮型、瀏海、分線、髮尾、捲度、染髮層次。獨立出來方便後續衍生變化。
- `Outfit`: 上身、下身、連身、外套、鞋襪、固定穿搭層次。完整保留角色卡的 signature outfit，不因壓縮改變造型方向。
- `Accessories`: 眼鏡、耳環、項鍊、choker、戒指、手環、耳機、包包、鑰匙圈、腰帶等可被人工快速刪改的配件。
- `Photographic direction`: 角色卡整體攝影質感與穩定性要求，例如 `photorealistic editorial portrait`、`coherent facial identity`、`realistic fabric construction`。

角色卡壓縮規則：

- Identity 不寫表情、眼神狀態或情緒控制，例如 `calm gaze`、`seductive expression`、`melancholic expression`。神情應交給 B 神情姿態控制。
- 眼鏡類角色要把眼睛描述保留在 Identity，例如 `clear dark brown eyes`；眼鏡本體放進 Accessories。
- 唇形可以保留可視覺化形狀，例如 `fuller lower lip`、`softly parted shape`；不要把情緒塞進嘴型，例如 `melancholic pout`。
- Hair 不混入服裝或配件。若帽子或 hood 是服裝本體的一部分，可留在 Outfit；若是可拆配件，放 Accessories。
- Outfit 不混入眼鏡、耳環、項鍊、包包等配件；但必須保留服裝設計核心、穿法、材質與鞋款。
- Accessories 沒有內容時不要輸出空區塊。
- `en` 原始描述可暫時保留給 Grok/Z-Image 與 AI；GPT 精修內容以 `profile` 為準。

新增資料時先確認責任歸屬：

- A 人物設定：體態、五官、膚質、髮型、髮色、神情、姿勢、特殊動作；角色卡需額外拆成 `Identity and body`、`Hair`、`Outfit`、`Accessories`。
- C 穿搭設定：服裝、鞋襪、外套、配件、顏色、圖案、完整造型。
- 場景設定：地點、場景物件、環境氛圍。
- 攝影設定：構圖、鏡頭、光圈、快門、風格、成像。

不要讓一個欄位偷渡另一個欄位的責任。若一個描述必須跨多個欄位才能成立，優先拆成對應欄位，而不是新增一個過長 prompt。

## 7. 資料庫新增前檢查清單

送出新資料前確認：

- 已閱讀對應 authoring guide。
- 英文 prompt 每個片語都能回答「畫面上看得到什麼」。
- 沒有正常狀態說明，例如正常戴眼鏡、正常穿外套。
- 沒有內部控制語言或長 guard 句。
- 一般單品沒有固定顏色，除非是不可拆的 signature detail。
- 套裝/連身壓縮後仍保留原設計方向。
- 特殊穿搭仍是完整造型包，且以 `complete outfit:` 開頭。
- 角色卡已補 `profile` 分組，Identity 不含表情/眼神狀態，眼鏡與首飾等配件放在 Accessories。
- AI 版可從資料壓縮成短 prompt，但不會漏掉核心服裝與姿勢。
- Grok/Z-Image 可維持自然語言段落，不被 GPT 標籤化。
- 修改 prompt 生成邏輯時先補測試，確認紅燈，再改程式。

## 8. 相關測試

依修改範圍優先跑 targeted tests：

```bash
cd webapp
node --test src/lib/enginePromptPipeline.test.js
node --test src/lib/engineSpecialSubjects.test.js
node --test src/lib/engineSpecialOutfitCleanup.test.js
node --test src/lib/engineOutfitPresetDressCleanup.test.js
node --test src/lib/engineWardrobeControls.test.js
node --test src/lib/engineZImageWardrobeLanguage.test.js
node --test src/lib/engineExpressionPoseCleanup.test.js
node --test src/lib/enginePoseComposer.test.js
npm test
npm run lint
npm run build
git diff --check
```

允許既有 Vite chunk-size warning；其他錯誤需修正。
