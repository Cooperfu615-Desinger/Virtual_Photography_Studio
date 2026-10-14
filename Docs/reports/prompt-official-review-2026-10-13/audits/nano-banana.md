# Nano Banana 2.1（`nanoBananaPrompt`）官方規範稽核

- 稽核日期／官方來源存取日期：2026-10-13
- 範圍：只讀稽核；未修改 repo。樣本來自 `scratchpad/official_samples.md`（HEAD `e86703e`，其餘欄位「全無」、固定 seed）。
- 專案依據：`Docs/specs/nano-banana-21-prompt-v1.md`、`webapp/src/lib/engine/nanoBananaPrompt.js`、`webapp/src/lib/engine.js:12855-12960`（`renderNanoBananaPrompt`）。
- 結論僅供選項，不定案。商業與品味取捨由 Cooper 決定。

## 0. 實際依據的官方文件與版本

| # | 文件 | 涵蓋模型 | 日期 | 備註 |
|---|---|---|---|---|
| S1 | [Gemini Nano Banana 2.1 模型頁](https://ai.google.dev/gemini-api/docs/models/gemini-nano-banana-2.1) | `gemini-nano-banana-2.1`（Stable） | 頁面更新 2026-10-06 | 無專屬 prompting 建議，導向 image generation 文件 |
| S2 | [Nano Banana 2.1 Model Card（DeepMind）](https://deepmind.google/models/model-cards/nano-banana-2-1/) | Nano Banana 2.1 | 2026-10-06 | 已知限制（人物一致性、左右空間） |
| S3 | [Image generation（Interactions API，現行）](https://ai.google.dev/gemini-api/docs/image-generation) | 範例皆用 `gemini-nano-banana-2.1` | 更新日 not_stated（擷取片段未見） | 專案引用的 `#prompting-guide-and-strategies` 錨點在此；現行版只剩範本，**未見**「敘事勝過關鍵詞」原則與 Best practices 清單 |
| S4 | [Gemini Generate Content API（Legacy）image generation](https://ai.google.dev/gemini-api/docs/generate-content/image-generation) | 2.1／3.1 Flash／Pro 等 | Last updated 2026-10-09 | 完整保留「Describe the scene」原則、Best practices、Limitations、Aspect ratio 行為 |
| S5 | [Gemini image generation best practices（Cloud docs）](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/gemini-image-generation-best-practices) | Gemini 圖像生成（未指名版本） | 2026-10-09 | Best practices 清單 |
| S6 | [The ultimate Nano Banana prompting guide（Cloud Blog）](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana) | Nano Banana 2（3.1 Flash Image）、Pro | 2026-03-06 | 專案已引用；**非 2.1 專屬** |
| S7 | [How to create effective image prompts（DeepMind）](https://deepmind.google/models/gemini-image/prompt-guide/) | Nano Banana（版本 not_stated） | not_stated | 五要素、多角色命名 |
| S8 | [Nano Banana Pro prompt tips（blog.google）](https://blog.google/products-and-platforms/products/gemini/prompting-tips-nano-banana-pro/) | Nano Banana Pro | 2025-11-20 | 非 2.1，僅作輔助 |

找不到 Google 為 2.1 撰寫的專屬 prompting guide（S1 明確導向通用文件）。以下「官方建議」以 S3/S4/S5（皆已以 2.1 為主要模型）為主，S6–S8 為前代補充。第三方（letsdatascience、enterprisedna、lmmarketcap）只當發布日期線索，未採為依據。

> 引用提醒：專案規格引用的 S3 錨點，現行頁面已改為 Interactions API 版，原則性段落移至 S4（Legacy）。規格的「官方依據」連結是否補 S4/S5，屬文件維護選項。

## 1. 官方建議彙整

| 代號 | 主題 | 官方內容（引文 ≤15 字，其餘轉述） | 來源 |
|---|---|---|---|
| R1 | 敘事 vs 關鍵詞 | 標題 "Describe the scene, don't just list keywords"；敘事段落幾乎總比零散詞串更連貫 | S4；S6 亦稱關鍵詞清單 "won't cut it" |
| R2 | 具體度 | "The more detail you provide, the more control you have." | S4；S5、S6 同義 |
| R3 | 情境與意圖 | "Explain the purpose of the image." | S4、S5 |
| R4 | 正向描述／語意負向提示 | 以「空無車輛的街道」取代 "no cars"；S6："Describe what you want, not what you don't want." | S4、S5、S6 |
| R5 | 相機控制 | "Use photographic and cinematic language to control the composition." | S4；S6 舉 low angle、f/1.8、wide-angle |
| R6 | 攝影寫實範本 | 結構：寫實〔鏡別〕＋主體＋場景；光線；〔機位〕＋〔鏡頭〕 | S3 Photorealistic scenes |
| R7 | 動詞開頭／生成指令 | S6："start a prompt with a strong verb"；S5 建議 "create an image of" 以免回文字 | S5、S6 |
| R8 | 公式順序 | `[Subject]+[Action]+[Location]+[Composition]+[Style]`（框架，非強制） | S6；S7 五要素 Style/Subject/Setting/Action/Composition |
| R9 | 比例 | API `response_format.aspect_ratio`；無輸入圖時預設 1:1，有輸入圖則跟隨輸入；範例 prompt 亦會寫 "Aspect ratio 16:9" | S3、S4 |
| R10 | 分步指令 | 複雜場景 "break your prompt into steps"（背景→前景→主物件） | S4、S5 |
| R11 | 文字渲染 | 要出現的字用引號包住，並描述字型 | S6、S7 |
| R12 | 多人一致性 | 2.1 支援至多 4 角色；S7 建議為每個角色取不同名稱；S2 稱多角色一致性仍待改善 | S1、S2、S7 |
| R13 | 空間限制 | S2 Model Card：左右等空間定位可能混淆 | S2 |
| R14 | 長度 | not_stated（S7 只說短 prompt 亦可，細節越多越接近；S1 輸入上限 131,072 tokens） | S1、S7 |
| R15 | 迭代 | "Don't expect a perfect image on the first try." | S4 |
| R16 | 人體量測數值、罩杯 | not_stated（官方未提） | — |

## 2. 專案現況已符合之處

- **R7 動詞開頭**：所有樣本以 `Create a photorealistic editorial portrait.` 開頭，同時給出風格與用途（部分符合 R3）。
- **R1 段落化**：`nanoBananaPrompt.js:14-26` 以段落分組（構圖→人物→服裝→姿勢＋場景→光→相機），方向與官方一致。
- **R5 相機語言**：如 shibuya「camera is positioned near floor level and tilted upward」為良好的機位敘述。
- **R9 比例**：選了比例時 `buildGptAspectRatioPromptLine`（`engine.js:11115`）會寫入 prompt；Nano 呼叫時傳 `fixedCompositionSet: null`，固定構圖也保留比例句。
- 無模型名稱、MJ 參數、內部 guard 字樣（符合專案契約）。

## 3. 偏離點與優化建議

分類：
- **【違反】**＝違反官方建議
- **【可優化】**＝官方未規定，但可改善
- **【已核准】**＝Cooper 已核准的設計，這裡只提醒取捨

嚴重度：高／中／低（依對生圖結果的預期影響，未經實際生圖驗證）。

### F1【違反 R4】【高】否定詞堆疊
- fixture：normal-single，場景段
- 片段：`no wall corner, no floor seam, no ceiling, no fluorescent tubes…`（共 8 個 no）
- 依據：S4/S5/S6 均建議以正向描述表達「不要的東西」。否定詞反而把 wall corner、light stands 等概念帶進語境。
- 根源：場景來源文字由 GPT／Z 共用（`buildGptPromptSectionSources`，`engine.js:11148`），Nano 直接沿用。
- 選項：
  - A. Nano 專用的正向改寫映射，只限此背景 ID：
    - 前：`…solid black void, full-bleed black surface, …, no wall corner, no floor seam, no ceiling, no paper roll…`
    - 後：`…an edgeless matte black void that fills the entire frame; only the subject and her soft contact shadow are visible.`
  - B. 通則：Nano 組裝時把連續 `no X` 子句收斂成一句正向總結（例如 "an empty, uninterrupted black space"）。需要逐場景審閱，避免遺失語意。
  - C. 維持現狀。理由是 GPT 全保真與來源可追溯。
- 取捨：A/B 都偏離「直接用語意來源」的原則，需 Cooper 核准，並附 regression fixture。

### F2【可優化（影響 R1 敘事連貫）】【中】標點與小寫開頭瑕疵
- fixture：normal-single
  - 光線段：`bright daytime sky where visible., soft side light` → 句號後接逗號。
  - 服裝段：`clean compact upper-body line. dark blue straight-leg jeans` → 句號後小寫開頭。
- 根源（讀碼推定，未實跑驗證）：
  - `joinNaturalPromptValues`（`engine.js:10639-10644`）以 `, ` 串接，但不會去掉各值結尾的句號。
  - 相比之下，`joinScenePromptValues`（`engine.js:10646`）會呼叫 `stripTerminalPromptPunctuation`。
  - `lightingText`（`engine.js:11248`）原樣進入 Nano，於是出現 `., `；`wardrobeText` 經 `cleanGptSinglePromptText` 後變成 `. ` 接小寫。
  - GPT 樣本第 31 行也有 `where visible. soft side light`，所以這是共用來源問題，不是 Nano 獨有。
- 選項：
  - A. 只在 Nano 組裝時正規化：去掉值尾句號後再用逗號串接，或把每個值各自整理成首字大寫的句子。影響範圍只有 Nano。
  - B. 修共用 `joinNaturalPromptValues`。這會改動 GPT／Z 等輸出，觸及多輸出契約，需要全套 audit。
- 改寫：
  - 前：`…sky where visible., soft side light across the subject…`
  - 後：`…sky where visible. Soft side light falls across her, …`
- 附防再犯建議：在 Nano 測試加斷言，禁止出現 `/\.,/` 與 `/\. [a-z]/`。

### F3【違反 R1】【中】關鍵詞串列取代敘事
- 片段：
  - selected-top-chest-graphic：`She wears short-sleeve top, smooth stretch fabric, clean torso line, …`（缺冠詞，屬詞串）
  - head-dominant-top-down：`Shot on fisheye lens, extreme hemispherical field of view, barrel distortion, …`
  - head-dominant-top-down：`head from hair crown to chin occupying 50–60% of frame height, full face…, little headroom`
- 依據：S4 R1。現行做法只是在詞串前加了句首導語（`lead()`），段內仍是目錄式描述。
- 改寫：
  - 前：`Shot on fisheye lens, extreme hemispherical field of view, barrel distortion, curved straight lines near frame edges…`
  - 後：`Shot with a fisheye lens whose hemispherical view bends straight lines near the frame edges and wraps the space around her.`
  - 前：`She wears short-sleeve top, smooth stretch fabric, clean torso line…`
  - 後：`She wears a short-sleeve top in smooth stretch fabric, printed with a large cartoon doodle centered on the chest.`
- 取捨：
  - 句子化需要每個選項各寫一份 Nano 版文案，或加一條通用的「首片語＋with/in 修飾」規則。
  - 後者容易產生不自然的英文。
  - 也會牽動「不新增視覺事實」與來源追溯（同 F1）。
- 選項：
  - A. 只處理高頻類別（服裝、鏡頭）的 Nano 專用敘述映射。
  - B. 通用規則：開頭補冠詞 `a/an`，首個逗號後改為 `with …`。
  - C. 維持現狀。

### F4【已核准】【中】三圍／罩杯／身高數字
- fixture：normal-single、gpt-duo-standalone-body-omission
- 片段：`F–G cup bust … height 168–173 cm, bust–waist–hip 94–58–92 cm`
- 現況：規格寫明「GPT 專用省略不擴張到 Nano Banana」，保留 Body Type 是已核准設計。
- 官方依據：R16 not_stated。官方只鼓勵具體描述（R2）。
- 提醒（非官方，僅是推測，需實測）：
  - 圖像模型對公分數值與量測範圍的遵循度通常不高。
  - 同段已有 `narrow defined waist, rounded hips, long legs` 等形容詞，數字可能重複。
  - 罩杯描述可能提高安全過濾機率，屬 not_stated 假說。
- 選項：
  - A. 維持。
  - B. Nano 只去掉數字段（`; height … cm`），保留形容詞輪廓。
  - C. 數字改成相對描述（tall／petite）。
- 驗證方式：同一 prompt 的 A/B 版本各生成 ≥8 張，盲評身形符合度與被拒率。目前未做，結果 not_stated。

### F5【違反 R12/R13 精神＋可優化】【中】雙人：片段句、重複詞、缺區別錨點
- fixture：gpt-duo-standalone-body-omission
- 片段 1：`Two 20-year-old Japanese or Korean female portrait subjects.` 是無動詞的片段句（來源 `engine.js:156` 的 subject `en`，經 `sentence(capitalizePromptLead(...))` 輸出）。
- 片段 2：`Use a loose full-body or wider two-person composition as a loose photographic guide` 中 loose 出現兩次，語氣也像操作指令（來源 `engine.js:11698`）。
- 片段 3：開頭寫 `Full-body portrait.`，但結尾允許 `natural crop … partial occlusion`，兩者可能互相牽制。
- 兩人只靠體型區分（本 fixture 其餘全無）。S7 建議為角色命名；S2 指出多角色一致性與左右定位仍弱。
- 改寫：
  - 前：`Two 20-year-old Japanese or Korean female portrait subjects.`
  - 後：`The photo shows two 20-year-old East Asian women, referred to as the first woman and the second woman.`
  - 前：`Use a loose full-body or wider two-person composition as a loose photographic guide, allowing…`
  - 後：`Frame both women loosely in full body or wider; natural crops, overlap and partial occlusion are welcome when they feel candid.`
- 選項：
  - A. 只改 Nano 的雙人導語與指導句。
  - B. 另外在有站位資料時加入「從相機看左側／右側」的明確定位。
  - C. 維持。
- 注意：「Japanese or Korean」改成「East Asian」屬於身份語意變更，需 Cooper 決定。

### F6【可優化（R2 具體度）】【低】「Japanese or Korean … portrait subject」
- fixture：全部單人樣本
- 片段：`one 20-year-old Japanese or Korean female portrait subject`
- 問題：`or` 讓模型自行擲骰；`portrait subject` 是製作語言，不是視覺描述。
- 選項：
  - A. Nano 改寫為 `a 20-year-old Japanese or Korean woman`（只去掉 portrait subject）。
  - B. 由 Cooper 決定族裔寫法。
  - C. 維持。

### F7【可優化】【中】head-dominant：方向互相衝突
- fixture：head-dominant-top-down
- 片段：`…, front view. At close portrait distance, the camera is directly above her and points vertically downward…`
- 問題：「front view」與「90° 正俯拍」同時出現，可能互相拉扯。S2 指出空間推理有限。
- 選項：
  - A. 正俯拍時，Nano 省略水平 orbit 詞，或改為 `her face turned up toward the camera`（若姿勢來源支持）。
  - B. 維持。
- 需要實測才能確認是否真的造成衝突。

### F8【可優化（R6/R5）】【低】normal-single 光線句缺主詞
- 片段：`Clear bright daylight with clean visibility, …`
- 選項：改寫為 `She is lit by clear bright daylight…`，或依 S3 範本使用 `[Description of the light].`。純粹是句法改善。

### F9【已核准】【低】不補鏡頭與機位
- 情況：normal-single、selected-top 沒有 lens／camera 句，因為 fixture 為「全無」。規格明訂「不擅自補鏡頭、光源」。
- 官方 R5/R6 鼓勵寫 camera angle 與 lens。
- 取捨：當使用者選「全無」時，Nano 結果較依賴模型預設。
- 選項：
  - A. 維持。
  - B. 僅在 Nano 補中性預設，例如 `natural perspective, standard portrait lens`。這違反「不發明視覺事實」，需核准。

### F10【可優化（R9）】【低】未選比例時沒有比例訊號
- fixture：所有樣本（比例為全無）
- 依據：S4 指出無輸入圖時預設輸出 1:1。全身構圖在 1:1 畫面可能顯得擁擠。
- 選項：
  - A. 維持，並在 UI 或文件提醒使用者在 API／介面設定比例。
  - B. 全身景別且未選比例時補 `vertical` 方向詞。屬新增視覺事實，需核准。

### F11【可優化（R11）】【低】場景招牌文字未加引號
- fixture：shibuya-moving-crowds
- 片段：`QFRONT glass facade carrying TSUTAYA and STARBUCKS signage`
- 依據：S6/S7 建議要渲染的字用引號包住。
- 改寫：`…signage reading "TSUTAYA" and "STARBUCKS"`
- 取捨：
  - 引號會提高字樣被渲染的機率，品牌字樣是否希望清晰出現由 Cooper 決定。
  - 同一句後段有 `everyone sharing…; nearby passersby…` 這類分號長句，可一併拆句（同 F3）。

### F12【可優化（R10）】【低】複雜群眾場景可分步
- fixture：shibuya-moving-crowds（單一場景段約 90 字）
- 選項：依 S4 分步建議，拆成「背景地標 → 中景人流 → 前景遮擋路人」三句。
- 取捨：段落變長，但層次更清楚。

## 4. 共通建議的驗證方式（尚未執行）

- 文字層（可自動化）：
  - 在 `nanoBananaPrompt.test.js` 加入標點斷言 `/\.,|\. [a-z]/`，以及否定子句計數。
  - 依 AGENTS.md 跑 `npm run test:prompt-quality` 與同 seed 的 strict audit，確認其他六輸出雜湊不變。
- 影像層：任何 F1/F3/F4/F5/F7 改寫，都需以 `gemini-nano-banana-2.1` 對同一 prompt 做 A/B，每組 ≥8 張、盲評。本稽核未生圖，所有成效判斷均為 not_stated／待驗。

## 5. 不確定與限制

- S3 頁面更新日期未在擷取片段中出現（not_stated）。
- 官方各頁對 2.1 的基底描述不一致：S2 稱基於 Gemini 3.6 Flash；S1 稱是 Nano Banana 2（3.1 Flash Image）的更新。
- WebFetch 經摘要模型轉述，引文可能有細微出入；正式引用前建議人工核對原頁。
