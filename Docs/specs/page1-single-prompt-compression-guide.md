# PAGE1 單人 Prompt 輸出撰寫規範

Last updated: 2026-07-12

這份文件整理 PAGE1 單人模式下 `Gpt` / `Grok/Z-Image` / `AI` 三組輸出的 prompt 撰寫規則。自 2026-07-03 起，`Gpt` 改為完整保留型輸出，不再以壓縮為目標；`Grok/Z-Image` 與 `AI` 仍可依各自模型需求維持自然語言壓縮。新增或修改 A 人物設定、B 神情姿態、C 穿搭設定資料時，請先依照對應 authoring guide 檢查欄位責任，再用本規範確認三組輸出的取向。

## 1. 三組輸出定位

### Gpt

- Internal field: `grokPrompt`
- Target: ChatGPT Image / GPT Image
- 格式：結構化自然段落。
- 新定位：`GPT Full-Fidelity Prompt` / `GPT 完整保留型 Prompt`。
- 目標：完整保留 PAGE1 工作台中被選到的有效英文描述，優先保留生成穩定性、造型鎖定與細節完整度。
- 固定主區塊順序：`Image Type`、`Subject`、`Wardrobe`、`Pose and Composition`、`Scene`、`Lighting`、`Camera Look`、`multi-cut sequence n=2`。
- 不輸出 `Constraints`。
- 結尾必須保留 `multi-cut sequence n=2`。
- 不做語意壓縮：不把長句縮成短片語，不刪除原本有視覺或控制意義的資訊。
- 允許格式整理：清理空白、標點、markdown 符號、空值，並放入正確 section。
- 單人特殊穿搭會把內建人物特徵移入 `Subject` 的 `Hair and body details` 子區塊；`Wardrobe` 則使用 `Full outfit` 與 `Headwear, eyewear, and bag` 子區塊。分類時只搬移內容，不應因壓縮而濾掉 fragment。
- 單人角色卡的 `Subject` 可用子區塊幫助人工微調：`Character Profile Card`、`Identity and body`、`Hair`、`Outfit`、`Accessories`、`Photographic direction`。

### 三組共用的構圖開頭（2026-07-12 已實作）

- 成品類型先輸出一個短句，例如 `Create a photorealistic editorial portrait.`；會依 PAGE1 的成品類型切換為對應的廣告、插畫或油畫描述。
- 三組輸出共用同一條精簡構圖句，格式為：`[景別], [俯仰角度], [環繞角度]`，例如 `Chest-up portrait, eye-level view, front-left three-quarter view`。
- 構圖句位於人物主體句之前，讓模型先讀到畫面範圍、相機高度與人物朝向；未選擇的控制不輸出。
- 構圖英文只保留幾何重點：`chest-up portrait`、`eye-level view`、`front-left three-quarter view` 等，不再重複完整資料庫長句。
- `Gpt` 保留 `Image Type` 區塊；`Grok/Z-Image` 與 `AI` 使用自然空行段落，但三者的構圖句來源與內容一致。
- UI 的環繞角度只顯示 `正面`、`左前`、`左側`、`左後`、`背面`、`右後`、`右側`、`右前`；內部 numeric ID 與舊儲存格式維持不變。

### Grok/Z-Image

- Internal field: `zImagePrompt`
- Target: Grok Imagine / Aurora / Z-Image
- 格式：自然語言空行段落。
- 不使用 GPT 式英文段落標籤。
- 不加入 `multi-cut sequence n=2`。
- 可以比 `AI` 更完整，但不使用 GPT 標籤段落。
- 可針對 Grok/Z-Image 的理解方式做自然語言壓縮與重排。

#### 已實作：來源可追溯的刪減式重組

Grok/Z-Image 必須是同一組 PAGE1 selections 的自然語言精簡版，而不是另一套獨立的 prompt 組裝結果。它應從和 Gpt 相同的完整語意模型／已解析選項取得內容；不得反向解析 Gpt 的 Markdown 成品，也不得自行補寫新的畫面資訊。

壓縮只允許三種操作：

- 刪除不會改變畫面的重複形容、一般正常狀態、內部控制語與純氣氛填充語。
- 在同一責任區塊中重新排序既有片段，讓自然句先出現主體、物件與結構。
- 以最小、無視覺意義的語法連接既有內容，例如 `with`、`and`、`She wears`、逗號與句號。

不得由 renderer 新增未被選擇資料或既有組裝規則支持的視覺描述、關係或氣氛詞。`layered over`、`paired with`、`styled with`、`natural`、`candid`、`editorial` 等詞，只有在選擇資料或明確組裝規則本來就提供時才可輸出。

保留與刪減規則：

| 區塊 | 必須保留 | 可刪減 |
| --- | --- | --- |
| 人物 | 主體、已選配件、完整身材數值／比例 anchor、五官方向、髮型、髮色、膚質、表情、角色卡永久身分錨點 | 重複美感詞、重複 silhouette 詞、無新結構資訊的髮絲或氣質形容 |
| 穿搭 | 已選衣物、配色、材質、剪裁、可見層次、鞋襪與重要配件 | 正常穿著說明、重複衣領／門襟／比例描述、`coordinated styling` 等泛用結尾 |
| 動作 | 姿勢基底、肢體關係、手部接觸、道具、支撐點、頭部方向 | 未增加動作資訊的 moment、mood 或 body-language 填充語 |
| 場景／光線 | 地點、必要實體 anchor、時段／天氣、人物光線方向、主色溫、必要投影或反射、scene priority | 重複的空間、亮度或可讀性語句 |
| 攝影 | 已選攝影風格、構圖、視角、鏡頭、主要光學效果、成像結果 | 同義的 editorial／cinematic／photographic 修飾與重複技術結果 |

人物身材的數值與比例 anchor 屬於不可刪除內容。壓縮可移除例如 `smooth natural silhouette`、`calm high-fashion presence` 等不增加結構資訊的片段，但不可刪除 `about 160-165 cm visual height`、`83-62-88 body proportion anchor`、比例、腰臀／胸部或其他已選身形關鍵資訊。

特殊穿搭內建的髮型、髮色、刺青與身體記憶點在 Grok/Z-Image 中也屬於人物資訊，應進入人物句，而非 `She wears complete special outfit` 句。雙人模式可維持輕量標籤以確保角色與服裝歸屬；單人模式維持自然空行段落，既有 `Scene:` 輕量錨點可保留。

驗收時必須確認 Gpt 與 Grok/Z-Image 的 selections 一致，且 Grok/Z-Image 沒有遺失身材 anchor、已選服裝與顏色、動作核心、場景 anchor、光線方向或主要攝影設定。

### AI

- Internal field: `midjourneyPrompt`
- Target: AI compact natural prompt
- 格式：極簡自然英文段落。
- 像早期手寫 prompt，短而直接。
- 不出現中文。
- 不加入「模型自然決定」類說明句。

#### 已實作：AI 自由導向的來源可追溯極簡版

本規則先適用於 PAGE1 單人模式；雙人 AI 維持既有輕量標籤格式，待另行討論。AI 必須使用和 Gpt／Grok-Z 相同的 resolved selections，但它的目的不是保留所有控制，而是在大方向不變下保留更多模型自由度。

AI renderer 只可刪除、重排與使用最小語法連接既有內容；不得以關鍵字映射、風格 shorthand、攝影 mood tail、負面 guard 或預設 fallback 補寫新語意。不得以「取前 N 個 fragment」任意截斷選項內容；應按欄位責任挑選需要保留的核心。

一般單人模式保留四個內容句，前面可先加成品類型與構圖開頭：

1. **人物句**：主體、完整身材數值／比例 anchor、髮型／髮色、已選眼鏡與耳機。
2. **穿搭句**：已選服裝、配色、外套、鞋襪與必要配件的極簡說明。
3. **場景句**：地點、1–2 個代表性實體 anchor、必要時段或天氣。
4. **成像句**：已選攝影風格、主要鏡頭／光學效果、底片或成像模擬。

前置句依序為成品類型、共用構圖句；構圖控制皆為 `全無` 時，構圖句可省略。

一般單人模式刻意不輸出五官、膚質、表情、姿勢／動作、環境光與人物光線；它們交由模型自由決定。

角色卡單人模式採「身份穩定、畫面自由」規則：人物句完整保留角色卡的結構化五官、膚質、永久特徵、身形、髮型與髮色，以及有效的眼鏡／耳機；穿搭句仍採極簡化。角色身份須從角色卡的結構化 profile fields 組裝，不可重複舊版完整 `identityAndBody` 段落，也不可將角色卡原始服裝與目前 PAGE1 選擇的服裝重複輸出。

特殊穿搭、套裝與連身服也採極簡化：只保留主服裝或主風格、關鍵上／下身或連身結構、外套、鞋襪與一項必要辨識配件；移除正常穿著、控制語、重複材質／剪裁與搭配解釋。特殊穿搭內建的髮型、髮色、刺青與身體記憶點屬於人物句，而非穿搭句。

AI 驗收重點：四句內仍可辨識人物／角色身份、服裝、場景與成像；不得出現未選擇資料衍生的 `Y2K ... look`、`captured as ... film still`、`not ...` guard 或其他 renderer 自行補寫的描述。

## 2. GPT 完整保留與壓縮分流原則

### GPT 完整保留型原則

`Gpt` 版現在以「完整保留」為主，不再以字數壓縮為目標。實作與資料維護時，應先問三件事：

1. 這個詞是否帶來新的可視覺化資訊？
2. 這個詞是否屬於目前欄位的責任？
3. 這個詞是否有助於生成穩定、造型鎖定或動作/場景可控？

如果答案是肯定的，`Gpt` 版應保留，不應為了縮短 prompt 而刪除。

`Gpt` 版應保留：

- 可被畫面辨識的結構、材質、版型、長度、穿法、位置。
- 影響生成結果的 anchor，例如 `low-rise`, `thigh-high stockings`, `side-part`, `direct eye contact`。
- 特殊穿搭、套裝、連身的造型核心與層次關係。
- Pose Composer 的身體結構、支撐點、手部位置、頭部方向。
- 人物體態、五官、膚質、髮型、髮色、表情中原始資料提供的有效細節。
- 場景、燈光、鏡頭、成像模擬中的有效環境與攝影控制資訊。

`Gpt` 版允許的清理範圍：

- 移除 markdown 符號。
- 清理重複空白與壞標點，例如 `.,`、`,.`。
- 不輸出空值、`全無`、`none`、`random`。
- 避免同一段完全重複出現兩次。
- 加上必要 section lead，例如 `The subject is...`、`She wears...`。
- 依 section 責任移動內容，例如特殊穿搭配件移到 `Headwear, eyewear, and bag`。

`Gpt` 版不應做：

- 把長描述縮成短片語。
- 刪除數值、比例、支撐點、材質、層次、guard 或造型鎖定資訊。
- 因為文字看似冗長就移除 `body proportion anchor`、`worn normally on the face`、palette、`controlled by selection` 等原始控制語。這些是否保留應由資料庫 authoring 或後續專案決策處理，不在 Gpt 最終輸出層任意刪除或自然化改寫。
- 把多個選項的內容合併時遺失原始描述。

### Grok/Z-Image 與 AI 壓縮原則

`Grok/Z-Image` 與 `AI` 可以繼續壓縮，但只能在不破壞核心資訊的前提下進行。Grok/Z-Image 必須遵守前節的來源可追溯規則；AI 可使用更激進的極簡化策略。

可刪減：

- 同義詞堆疊，例如同時寫多個 `beautiful / polished / refined / elegant`。
- 泛用結尾，例如 `coordinated styling`, `balanced look`, `fashionable presence`，除非它是唯一的風格 anchor。
- 正常狀態說明，例如眼鏡正常戴在臉上時不需要 `worn normally on the face`。
- 內部控制語言，例如 `controlled by selection`, `preserve selected wardrobe identity`。`body proportion anchor` 與完整身材數值／比例不可由 Grok/Z-Image 刪除。
- 過長解釋句，例如「模型自然決定姿勢」或「服裝按正常穿著順序」這類操作說明。

避免：

- 壓縮後遺失服裝、髮型、體態、姿勢支撐點或場景 anchor。
- 負面堆疊：`not...`, `avoid...`, `without...`。
- 把場景、光線、鏡頭、人物表情塞進服裝欄位。
- 把完整穿搭塞進一般上身或下身單品。
- 把顏色寫死在一般單品 prompt；顏色應交給配色欄位。

## 3. A 人物設定輸出規則

`Gpt` 版應完整保留被選到的體態、五官、膚質、髮型、髮色、神情與配件描述。不要在最終輸出層把長描述壓成短片語。

`Grok/Z-Image` 與 `AI` 可依模型需求壓縮，壓縮時仍須保留核心人物識別與造型特徵。

資料庫 authoring 建議長度仍可作為新增資料時的品質參考：

- 體態：8-16 words。
- 五官：8-16 words。
- 膚質：4-12 words。
- 髮型：8-16 words。
- 髮色：4-12 words。

建議寫法：

```text
core category, 1-3 concrete visible traits
```

`Gpt` 版應完整保留，`Grok/Z-Image` / `AI` 壓縮時至少保留：

- `long legs`, `narrow waist`, `rounded hips`
- `small refined face`, `clear bright eyes`
- `dewy glass skin`, `natural freckles`
- `silver-gray white deep side-parted long soft waves, realistic dyed texture`
- `natural black wet-look long wavy hair`

`AI` 壓縮時可刪減；Grok/Z-Image 不可刪除完整身材數值與比例 anchor：

- 數值比例、身高體重、測量式 anchor。
- `hair color applies only to scalp hair` 這類操作說明。
- `eyebrows remain natural` 可壓成 `natural eyebrows`，只有特殊髮色需要時才保留。
- 壓縮版中不要讓髮色獨立成無意義短句，例如 `wet-look long wavy hair. natural black hair.`；可合併為 `natural black wet-look long wavy hair`。
- 臉部美感同義詞堆疊。

## 4. B 神情姿態輸出規則

`Gpt` 版應完整保留神情、特殊動作與 Pose Composer 的原始有效描述，尤其是身體安排、重心、支撐、手部位置、道具接觸、頭部方向與 framing/camera guide。不要在最終輸出層把 Pose Composer 的結構壓短。

神情只寫臉、眼神、嘴型與情緒強度。姿態只寫身體安排、重心、支撐與動作狀態。

`Gpt` 版應完整保留，`Grok/Z-Image` / `AI` 壓縮時至少保留：

- `direct eye contact`
- `soft natural smile`
- `downward gaze`
- `standing pose with loosely crossed arms`
- `one hand brushing hair back`
- `visible hand-to-mouth contact`

`Grok/Z-Image` / `AI` 壓縮時可刪減：

- `body language` 可壓成 `posture`。
- `portrait moment`, `portrait interaction`, `beauty touch-up portrait moment` 這類泛用尾巴。
- `relaxed everyday...`, `polished...`, `controlled cinematic...` 若不影響畫面可刪。
- Pose Composer `手部 / 道具動作` 保留接觸點與道具狀態，不保留多餘情緒敘述。Legacy `特殊動作` 只作 restore 遷移參考，不作新增主路徑。

Pose Composer 相關描述應保留實際身體結構，例如 base arrangement、hand / prop placement、support anchor、head direction。`Gpt` 版完整保留，`Grok/Z-Image` / `AI` 只能在不丟失結構的前提下壓縮。不要新增 Pose Modifier，除非使用者明確要求。

## 5. C 穿搭設定輸出規則

### 一般上下身與配色

`Gpt` 版應完整保留被選到的一般單品、配色、版型、穿法、圖案、外層、鞋襪與 layering guard。一般單品仍只描述本身，不描述完整穿搭；但若組合器產生了必要 layering 或 waistline coordination 語句，`Gpt` 版不應因壓縮而刪除。

`Grok/Z-Image` / `AI` 可依模型需求壓縮一般單品。

資料庫 authoring 建議格式：

```text
fit or rise, color from palette if already composed, garment type, 1-2 concrete traits
```

範例方向：

- `tight white ribbed cotton camisole with slim straps`
- `high-rise fitted indigo straight-leg jeans`
- `washed denim jacket with chest pockets and metal buttons`

`Grok/Z-Image` / `AI` 壓縮時可刪減：

- `clean compact upper-body line`
- `balanced leg line`
- `classic five-pocket construction`
- `properly worn on both shoulders`
- `realistic outer-to-inner dressing order` 的長句；如需要只保留短 guard。

### 鞋襪與外層

`Gpt` 版應完整保留鞋襪與外層的款式辨識點、穿法、版型、開合、肩線、材質與必要正常穿著 guard。鞋襪與外套要保留款式辨識點，但避免在資料庫 authoring 時把正常穿著狀態寫得像特殊指令。

保留：

- 鞋型、鞋底、鞋面、signature accent。
- 襪長、材質、蕾絲、garter、ribbed texture。
- 外套種類、長度、材質、開合、肩線或 hood。

`Grok/Z-Image` / `AI` 壓縮時可刪減：

- 正常穿著、自然可見、完整覆蓋這類預設狀態。
- 過長的外層穿搭順序說明，除非該組合容易生成錯層。

### 套裝與連身

套裝與連身的主要用途是鎖定服裝造型與穿搭方式。`Gpt` 版應完整保留套裝/連身描述與配色控制資訊；`Grok/Z-Image` / `AI` 若壓縮，不能改變服裝設計方向。

`Gpt` 版應完整保留，`Grok/Z-Image` / `AI` 壓縮時至少保留：

- 主服裝類型。
- one-piece 或 set 的核心輪廓。
- neckline、hem、fabric、trim、主要結構。
- 套裝必要識別物，例如制服帽、apron、bunny-ear headband。
- 配色控制所需的目標區域，但語氣要短。
- 完整造型色系在 Gpt 中應融入服裝片語，例如 `black-and-red street solid satin cheongsam mini outfit`，不要保留 palette direction 操作句。
- 特殊上下配色用短片語保留上下區域，例如 `lime whisper lower hem or skirt accent`，不要輸出 `coordinated top-to-bottom palette`。

`Grok/Z-Image` / `AI` 壓縮時可刪減：

- `one-piece silhouette` 重複出現時可刪。
- `main fabric color controlled by...` 可壓成 `selected main fabric color`。
- `selected main fabric color`、`selected uniform color`、`controlled by...`、`complete outfit palette direction...` 可移除或融入服裝，不作為獨立控制語。
- `metal hardware kept in fixed metallic tones` 可壓成 `metal hardware in fixed metallic tones`。
- 泛用的 `complete styling`, `polished outfit`, `balanced silhouette`。

### 特殊穿搭

特殊穿搭是完整造型包，不能因壓縮而拆壞原始搭配。資料庫英文 prompt 仍必須以 `complete outfit:` 開頭。`Gpt` 版可維持人工易讀的分組，但新原則是「只分類，不刪除」。

資料庫建議格式：

```text
complete outfit: style direction. core top or one-piece, core bottom, outer layer if any, socks or footwear, key accessories, fixed visual anchors.
```

Gpt 單人輸出會將特殊穿搭整理成：

```text
Subject:
The subject is ...

Hair and body details:
...

Wardrobe:
Full outfit:
...

Headwear, eyewear, and bag:
...
```

Gpt 分類規則：

- `Hair and body details`: 放在 `Subject`，收納特殊穿搭內含的髮型、瀏海、髮色、刺青、身體小記憶點。
- `Full outfit`: 上衣、下身、連身、外套、襪類、鞋款、皮帶、首飾、手套、耳機、穿搭層次。
- `Headwear, eyewear, and bag`: 帽子、頭巾、髮夾、眼鏡、墨鏡、包包。

`Gpt` 版應完整保留，`Grok/Z-Image` / `AI` 壓縮時至少保留：

- 固定造型的主風格短句，例如 `Y2K schoolgirl-inspired styling`。
- 所有核心衣物層次。
- 鞋襪、包包、帽子、眼鏡等可人工刪改的 accessory anchor。
- image-reference outfits 的 hair、bags、accessories、footwear，除非該批資料明確要求 omit bags and hairstyles。

`Grok/Z-Image` / `AI` 壓縮時可刪減：

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

角色卡 GPT 分組規則：

- Identity 不寫表情、眼神狀態或情緒控制，例如 `calm gaze`、`seductive expression`、`melancholic expression`。神情應交給 B 神情姿態控制。
- 眼鏡類角色要把眼睛描述保留在 Identity，例如 `clear dark brown eyes`；眼鏡本體放進 Accessories。
- 唇形可以保留可視覺化形狀，例如 `fuller lower lip`、`softly parted shape`；不要把情緒塞進嘴型，例如 `melancholic pout`。
- Hair 不混入服裝或配件。若帽子或 hood 是服裝本體的一部分，可留在 Outfit；若是可拆配件，放 Accessories。
- Outfit 不混入眼鏡、耳環、項鍊、包包等配件；但必須保留服裝設計核心、穿法、材質與鞋款。
- Accessories 沒有內容時不要輸出空區塊。
- `en` 原始描述可保留給 Grok/Z-Image 與 AI；GPT 角色卡輸出以 `profile` 分組為準，`profile` 內容應完整保留角色穩定所需細節。

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
- Gpt 版會完整保留有效英文描述；新增資料時若使用數值 anchor、正常狀態說明、內部控制語或長 guard 句，需確認它們確實有助於生成穩定或造型鎖定。
- Grok/Z-Image 與 AI 壓縮後不得漏掉核心人物、服裝、姿勢、場景、燈光與 camera look。
- 一般單品沒有固定顏色，除非是不可拆的 signature detail。
- 套裝/連身在 Gpt 版完整保留，在 Grok/Z-Image / AI 壓縮後仍保留原設計方向。
- 特殊穿搭仍是完整造型包，且以 `complete outfit:` 開頭。
- 特殊穿搭在 Gpt 版可分組，但只分類不刪除。
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
