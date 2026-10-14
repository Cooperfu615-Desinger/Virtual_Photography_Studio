# Midjourney 輸出官方規範稽核（主 MJ／MJ 胸上特寫）

- 稽核日期／官方資料存取日期：2026-10-13
- Repo 狀態：HEAD `e86703e`（`codex/specified-actions-v1`），只讀；未修改任何 repo 檔案
- 稽核對象：`midjourneyPrompt`（主 MJ，UI「AI」）、`extraPrompts` id `chest-up-mj-portrait`（MJ 胸上特寫）
- 樣本：`scratchpad/official_samples.md`（5 個 fixture，其餘欄位「全無」）；另用 `scratchpad/official-review/probe_mj.mjs` 以測試同款 locks 重跑做對照（只讀執行）
- 官方原文本機副本：`scratchpad/official-review/mjdocs/*.txt`（docs 文章 id 為檔名；`u-*.txt` 為 updates 文章）

## 0. 實際依據的官方文件版本

docs.midjourney.com 的 HTML 頁面被 Cloudflare 驗證擋住（HTTP 403）。因此改由**同網域的官方 Zendesk Help Center API**（`docs.midjourney.com/api/v2/help_center/en-us/articles/{id}.json`）取得同一篇文章的內文與 `updated_at`。updates.midjourney.com 則直接抓取。沒有用第三方資料作為依據。

官方目前的狀態：V8.2 是現行預設版本。Version 文章原文是 "The current default Midjourney version is V8.2."。官方**沒有** V8.2 專屬的 Prompt 寫法文件，各參數頁只寫「V8.2 請見 Version 文章」。因此以下依據是 2026-06 至 09 更新的通用 docs，加上 V8／V8.1／V8.2 的公告。

| 代號 | 文件 | 官方更新日 | URL |
|---|---|---|---|
| S1 | Prompt Basics | 2026-08-31 | https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics |
| S2 | Parameter List | 2026-09-01 | https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List |
| S3 | Version（含 V6/V7/V8.1&8.2 相容表） | 2026-09-01 | https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version |
| S4 | Raw | 2026-07-27 | https://docs.midjourney.com/hc/en-us/articles/32634113811853-Raw |
| S5 | Stylize | 2026-07-27 | https://docs.midjourney.com/hc/en-us/articles/32196176868109-Stylize |
| S6 | Chaos / Variety | 2026-07-27 | https://docs.midjourney.com/hc/en-us/articles/32099348346765-Chaos-Variety |
| S7 | Weird | 2026-07-27 | https://docs.midjourney.com/hc/en-us/articles/32390120435085-Weird |
| S8 | Aspect Ratio | 2026-07-27 | https://docs.midjourney.com/hc/en-us/articles/31894244298125-Aspect-Ratio |
| S9 | No | 2026-07-27 | https://docs.midjourney.com/hc/en-us/articles/32173351982093-No |
| S10 | Multi-Prompts & Weights | 2026-07-27 | https://docs.midjourney.com/hc/en-us/articles/32658968492557-Multi-Prompts-Weights |
| S11 | Text Generation | 2026-07-27 | https://docs.midjourney.com/hc/en-us/articles/32502277092109-Text-Generation |
| S12 | Quality | 2026-07-27 | https://docs.midjourney.com/hc/en-us/articles/32176522101773-Quality |
| S13 | Image Size & Resolution | 2026-07-27 | https://docs.midjourney.com/hc/en-us/articles/33329374594957-Image-Size-Resolution |
| S14 | Edit Model | 2026-09-24 | https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model |
| S15 | Omni Reference | 2026-09-01 | https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference |
| S16 | Image Prompts | 2026-08-31 | https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts |
| S17 | Personalization | 2026-07-27 | https://docs.midjourney.com/hc/en-us/articles/32433330574221-Personalization |
| S18 | Legacy Features（Character Reference 段） | 2026-09-01 | https://docs.midjourney.com/hc/en-us/articles/33329788681101-Legacy-Features |
| S19 | Character Reference（專案引用的舊頁） | API 回 `RecordNotFound` | https://docs.midjourney.com/hc/en-us/articles/32162917505293-Character-Reference |
| U1 | V8 Alpha | 2026-03-17 | https://updates.midjourney.com/v8-alpha/ |
| U2 | V8.1 Alpha | 2026-04-14 | https://updates.midjourney.com/v8-1-alpha/ |
| U3 | V8.1 Updates | 2026-04-30 | https://updates.midjourney.com/v8-1-updates/ |
| U4 | V8.1 is now the default | 2026-06-11 | https://updates.midjourney.com/v8-1-is-now-the-default-model/ |
| U5 | Draft mode for V8.1 | 2026-06-16 | https://updates.midjourney.com/draft-mode-for-v8-1-and-new-feature-previews/ |
| U6 | Version 8.2 | 2026-07-24 | https://updates.midjourney.com/version-8-2/ |
| U7 | Edit Model for V8 | 2026-08-27 | https://updates.midjourney.com/edit-model-for-v8/ |

所有來源的存取日期都是 2026-10-13。

## 1. 官方建議摘要（V8.x 適用性）

### 1.1 Prompt 寫法

| 主題 | 官方內容（引用每處 ≤15 字，其餘為轉述） | 來源 |
|---|---|---|
| 長度 | "Short and simple prompts typically generate the best images"。文件也提到 "Avoid making long lists or detailed instructions"。 | S1 |
| 長度（V8 公告，與 S1 有張力） | V8 表現最好的情況，是使用者 "trend towards longer more specific prompting"。V8 也 "may require totally new prompting styles"。 | U1 |
| 細節取捨 | "if specific elements are important to you, be sure to include them"。細節越少變化越多，但可控性越低。 | S1 |
| 長度上限 | V8.1 新增 Prompt Shortener，超過長度上限時會自動啟動。**上限數值：not_stated**。 | U2 |
| 自然語言 vs 關鍵詞 | 官方沒有明文要求哪一種。S1 示範的好例子是名詞片語（"Colored pencil illustration of…"），壞例子是命令句。U2 說新版 Describe 會產出「更長、更詳細」、符合 V8 風格的 Prompt。V8 主 Prompt 應採自然句還是關鍵詞：**not_stated**。 | S1、U2 |
| 詞序影響 | **not_stated**。官方沒有說前面的詞權重較高。 | — |
| 換行／分段 | **not_stated**。 | — |
| 否定 | "Describe what you do want instead of what you don't."。範例中寫「no cake」，蛋糕仍可能出現。要排除元素應改用 `--no`。 | S1 |
| `--no` 用法 | V8.1&8.2 支援。多個項目用逗號分隔。審核系統會 "reads every word you add to the --no parameter independently"。例如 `--no modern clothing` 可能被拆讀成 no clothing 而觸發警告。 | S3、S9 |
| 多段 `::` 權重 | 只列出 V1–V6.1 支援；相容表顯示 V7、V8.x 不支援。 | S3、S10 |
| 文字渲染 | 要讓文字出現在圖中，需 "putting them inside double quotation marks"。拉丁字母、短詞效果較好。不準時可用 Raw 或降低 Stylize。V8 公告也重申文字要放在引號內。 | S11、U1 |
| 寫實照片 | 公告建議 "recommend switching to --raw right away"。Raw 頁說簡單 Prompt 會更寫實、更接近照片。 | U1、S4 |
| 用編號而非模糊複數 | 寫具體數量（"three cats"）。 | S1 |

### 1.2 參數（V8.1 & V8.2）

| 參數 | V8.x 有效性 | 官方預設 | 來源 |
|---|---|---|---|
| `--v 8.2`／`--v 8.1` | 有效。8.2 是現行預設，8.1 仍可用。 | V8.2 | S3 |
| `--ar` | 有效。最大 14:1（HD 為 4:1）。 | "The default aspect ratio is 1:1." | S3、S8 |
| `--raw` | 有效（5.1 以後）。 | 關閉（Standard） | S3、S4 |
| `--s` | 有效，範圍 0–1000。使用 Personalization 時，`--s` 也控制個人化的強度。 | "The default value for stylize is 100" | S5、S17 |
| `--c` | 有效，範圍 0–100。 | "By default chaos is set to 0" | S6 |
| `--w` | 有效，範圍 0–3000，與 seed 不完全相容。 | "By default, weird is set to 0" | S7 |
| `--sd`／`--hd` | 有效。`--sd` 是 "standard resolution (1024px) using --sd"，`--hd` 為 2048px。S13 明寫 V8.2 SD 為 1024、HD 為 2048。GPU 成本：HD 1.3 分、SD 0.8 分。 | **現行預設：not_stated**。V8.1 Alpha 曾以 HD 為預設（U2）；2026-04-30 改為暫時以 SD 為預設（U3）。之後的現況未見官方更新。 | S2、S3、S13 |
| `--q` | V8.1&8.2 **不支援**（相容表）。注意：V8 Alpha 公告曾提 `--q 4`，已被 S3 取代。 | — | S3、U1 |
| `--draft` | 相容表顯示 V8.x 不支援。但 U5（2026-06-16）宣布 V8.1 可從選單按鈕開 Draft mode。**官方來源互相矛盾**，參數形式未提。 | — | S3、U5 |
| `--oref`／`--ow` | 只支援 V7；V8.x 由 Edit Model 取代。 | — | S2、S3、S15 |
| `--cref` | V6 的舊功能，已被 Omni（V7）與 Edit Model（V8.x）取代。 | — | S18 |
| `--turbo` | V8.x 不支援。 | — | S3 |
| `--p`（Personalization） | V8.x 支援。V8.2 主打個人化；V7 Global Profile 可用於 V8.2。 | 關閉 | S3、S17、U6 |
| `--edit` | V8.1/8.2 的 Edit Model，Discord 用 `--edit` 加圖片 URL；最多 4 張參考圖。 | — | S2、S14 |
| 參數格式 | "Always put parameters after your prompt text."。破折號前要有空格，參數內不可有標點，參數之後不可再接文字。 | — | S2 |

### 1.3 人物一致性

- V8.x 已沒有 Omni Reference／Character Reference。Edit Model 是 "replacing Omni Reference and Character Reference"，可用最多 4 張參考圖、可下指令式 Prompt，也能和 `--raw`、`--hd`、Personalization 併用（S14、U7）。
- 多角色時若特徵混淆，官方建議把角色合成到同一張參考圖（S14）。
- 用參考圖時，文字仍負責描述參考圖以外的場景（S15 對 V7 的建議；S16 Image Prompts 同義）。

## 2. 專案參數尾綴逐項檢查

樣本尾綴：主 MJ 為 `--v 8.2 --raw --s 25 --c 0 --w 0 --sd`，MJ 胸上為 `--v 8.2 --ar 4:5 --raw --s 25 --c 0 --w 0 --sd`（所有 fixture 相同）。契約見 `webapp/src/lib/engine/midjourneyParameterContract.js:10-11, 40-121, 211-238`。

| 參數 | 判定 | 說明 |
|---|---|---|
| `--v 8.2` | 符合 | 有效，且等於官方預設，屬冗餘。但在預設版本日後改變時，可以固定生成版本，保留有道理。 |
| `--ar`（主 MJ 缺） | **官方未規定但可優化（嚴重度：高）** | 主 MJ 的 F 預設是「跟隨 PAGE1」，而 PAGE1 `aspectRatio` 已退役並正規化為 `none`（`Docs/current_project_state.md:343`）。結果是主 MJ 預設**不輸出 `--ar`**，生成時落到官方預設 1:1。樣本 normal-single（Full-body portrait）的尾綴 `…--w 0 --sd` 就沒有 `--ar`，全身人像會以方形構圖生成。除非使用者每次手動調 F 比例，否則 Prompt 內的直幅景別描述會和方形畫布衝突。 |
| `--ar 4:5`（胸上） | 符合 | 有效，在 HD 4:1 上限內。 |
| `--raw` | 符合官方建議 | 寫實照片用 Raw 正是 U1／S4 的建議。 |
| `--s 25` | 屬 Cooper 已核准設計，只提醒取捨 | 有效，比預設 100 更貼近 Prompt（`page1-single-prompt-compression-guide.md:611-615` 已說明是專案實測起點）。取捨：U1 鼓勵 V8 搭配高 stylize／個人化；V8.2 也主打個人化（U6）。`--s 25` 會讓 V8.2 的「美學升級」與 `--p` 幾乎不起作用。 |
| `--c 0`、`--w 0` | 官方未規定但可優化（低） | 兩者都等於官方預設，屬冗餘。保留的好處（推論，官方未明文）：明寫可覆蓋使用者網頁上的 Variety／Weirdness 預設。若要縮短尾綴可省略，但會失去這項覆蓋。 |
| `--sd` | 符合 | 在 V8.2 有效（S2、S13）。Parameter List 的敘述寫的是「V8.1 images」，但 S3 相容表與 S13 已涵蓋 V8.2。提醒：明寫 `--sd` 會覆蓋使用者在設定面板開的 HD，最終輸出為 1024px。 |
| 不輸出 `--q/--draft/--oref/--ow/--turbo` | 符合 | 與 S3 相容表一致。`--draft` 官方說法互相矛盾（見 1.2），但專案本來就不輸出，不受影響。 |
| `--no` | 官方未規定但可優化 | V8.x 支援，但專案契約 `MIDJOURNEY_PARAMETER_TAIL_PATTERN_SOURCE` 不允許。Prompt 內文卻有行內否定（見 3-B）。 |
| 格式（位置、空格、無標點） | 符合 | 契約已禁止參數後接文字與參數內標點（`midjourneyParameterContract.js:220-222`），與 S2 一致。 |

## 3. Prompt 內文偏離點

分類代號：**[違反]** 違反官方建議；**[可優化]** 官方未規定但可優化；**[已核准]** 屬 Cooper 已核准設計，只提醒取捨。

### A. [可優化／高] 主 MJ 預設方形畫布與景別衝突
- 樣本：normal-single 主 MJ 為「Full-body portrait, eye-level view… --v 8.2 --raw --s 25」，沒有 `--ar`。
- 依據：S8 "The default aspect ratio is 1:1."
- 選項：(1) 主 MJ「跟隨 PAGE1」在 `none` 時改由景別推導預設比例，例如全身 2:3 或 9:16、中景 4:5；(2) 把 F 的預設由「跟隨 PAGE1」改成固定直幅；(3) 維持現狀，在 UI 提示。比例值屬商業／品味判斷，由 Cooper 決定。
- 改寫例：`--v 8.2 --raw --s 25 --c 0 --w 0 --sd` → `--v 8.2 --ar 2:3 --raw --s 25 --c 0 --w 0 --sd`

### B. [違反／高] 行內否定句
- 樣本 normal-single 主 MJ：「matte deep black color field, no wall corner, continuous…」
- 樣本 normal-single MJ 胸上：「No wall corner, continuous black ground-and-background plane」
- 依據：S1 "Describe what you do want instead of what you don't."。要排除元素應用 `--no`（S9）。
- 選項：(1) 直接刪除，因為 "horizonless seamless… continuous" 已表達同一件事；(2) 改成 `--no wall corner`。但這需要改尾綴契約，而且審核會逐字拆讀（S9），須確認詞組不會被拆成敏感詞。
- 改寫例：`Horizonless seamless matte deep black color field, no wall corner, continuous black ground-and-background plane…` → `Horizonless seamless matte deep black color field, continuous black ground-and-background plane…`

### C. [可優化／中] 壓縮造成語意矛盾（黑色虛空與明亮天空並存）
- 樣本 normal-single（兩組 MJ 都有）：「solid black void… Clear daylight environment, bright daytime sky」
- 對照：GPT 原文是 "bright daytime sky **where visible**"，MJ 壓縮時刪掉了條件語，矛盾因此成為無條件。
- 依據：S1 "Choose the Right Words"，要求精確描述想要的內容。官方沒有直接規範矛盾句，因此歸為可優化。
- 選項：(1) MJ 壓縮保留 `where visible`；(2) 場景沒有天空可見性時（純色棚），省略天空片語。
- 改寫例：`Clear daylight environment, bright daytime sky, soft side light…` → `Clear bright daylight, soft side light across the subject…`

### D. [違反（若要求文字可讀）／中] 品牌招牌文字沒有加雙引號
- 樣本 shibuya-moving-crowds（兩組 MJ）：「QFRONT glass facade carrying TSUTAYA and STARBUCKS signage」
- 依據：S11 要讓文字出現需 "putting them inside double quotation marks"；U1 同樣要求加引號。
- 改寫例：`…carrying TSUTAYA and STARBUCKS signage` → `…with signs reading "TSUTAYA" and "STARBUCKS"`
- 取捨：加引號會讓模型更努力渲染品牌字樣。若只想要「有招牌的氛圍」而不追求字樣可讀，現狀可接受。這屬品味判斷，由 Cooper 決定。

### E. [可優化／中] 場景含指令式、物理說明式文字
- 樣本 shibuya 主 MJ：「everyone sharing the same physical space and perspective with apparent size varying」
- 依據：S1 "Avoid making long lists or detailed instructions"。這段是在對模型解釋透視規則，不是描述畫面。
- 改寫例：`the subject as one person within a dense pedestrian flow…; everyone sharing the same physical space and perspective with apparent size varying naturally by distance…` → `she stands within a dense crowd of pedestrians walking in different directions in front of and behind her, passersby partly cropped at the frame edges`
- 注意：這段來源由主 GPT／Z 共用。MJ 端只能做 MJ 專屬投影，不可回改共用來源（依 AGENTS.md 的輸出隔離原則）。

### F. [可優化／中] 用百分比指定構圖
- 樣本 head-dominant-top-down 主 MJ：「head from hair crown to chin occupying 50–60% of frame height」
- 依據：官方對百分比或量測式構圖的解析能力 **not_stated**。S1 的「具體數字」指的是物件數量，不是版面比例。S1 的構圖範例是 "portrait, headshot, closeup, birds-eye view" 這類詞彙。
- 改寫例：`Head-dominant close portrait, close camera distance, head from hair crown to chin occupying 50–60% of frame height, full face and chin within the crop, little headroom…` → `Tight head-and-shoulders close-up, face filling most of the frame, little headroom…`

### G. [可優化／中，一致性] MJ 胸上沿用舊 renderer，與已核准的主 MJ 寫法不一致
| 項目 | 主 MJ（natural-main-v1） | MJ 胸上（樣本） |
|---|---|---|
| 身份句 | `A Japanese woman in her twenties.` | 「A 20s seductive stunning Japanese woman.」（全部 single fixture） |
| 體態 | 六種核准短句，不寫罩杯、身高、三圍 | 「F–G cup bust… height 168–173 cm, bust–waist–hip 94–58–92 cm」（normal-single） |
| 不可見部位 | 依景別投影 | 胸上構圖仍寫「long legs」「rounded hips」（normal-single） |
| 文法 | 完整句 | 「A 20s…」「Wearing white cotton camisole top.」缺冠詞；句中大寫「The setting is Horizonless」 |
| 場景 | 集中一段 | 拆成兩處：開頭一句、姿勢後再接一段（normal-single、shibuya） |
| 否定 | 同 B | 「No wall corner」（normal-single） |

- 依據：S1 建議精確用詞、描述畫面上看得到的東西。數字式三圍與身高無法在胸上畫面中呈現，主觀美感詞（seductive stunning）也不是可見的視覺事實。這些都屬「官方未規定但可優化」。
- **另一項專案內部不一致（待 Cooper 確認，不屬官方議題）**：`Docs/specs/chest-up-same-state-v1.md:19` 寫「MJ…也不帶入腰臀全身 anchor」，但 `webapp/src/lib/engine/chestUpSameState.test.js:79` 斷言 MJ 胸上必須包含**完整** Body Type 英文原文（含 hips、legs、height）。目前的行為與測試一致，與規格文字不一致。
- 改寫例（MJ 胸上，沿用主 MJ 已核准的句型）：`A 20s seductive stunning Japanese woman. F–G cup bust, lean limbs, narrow defined waist, rounded hips, long legs, dramatic lean hourglass silhouette; height 168–173 cm, bust–waist–hip 94–58–92 cm, long soft waves…` → `A Japanese woman in her twenties. Long soft waves with defined wave shape, natural black hair. A well-defined curvy figure with a slender waist and graceful lines.`（是否保留胸部描述，屬商業／品味判斷，由 Cooper 決定）

### H. [已核准，提醒取捨／中] 主 MJ 省略已選上衣圖案
- 樣本 selected-top-chest-graphic 主 MJ：「She wears a short-sleeve top.」；MJ 胸上則保留「large cartoon doodle chest graphic」。
- 依據 S1：「重要元素要寫進去」。圖案是使用者明確選的元素。
- 現況：natural-main-v1 規則 3 已核准省略圖案。`representativePromptFixtures.js` 尾端已把主 MJ 的期望改成只檢查 excludes，因此測試仍通過（本次實跑 `promptOutputContracts.test.js`：104/104 pass）。
- 文件落差：fixture 標題仍寫「survives every single-subject output」；`Docs/current_project_state.md:382-384`（2026-09-22）仍寫主 MJ 保留圖案。兩處都已過時。

### I. [可優化／低] 雙人「or」語意模糊
- 樣本 gpt-duo-standalone-body-omission 主 MJ：「Two 20-year-old Japanese or Korean women.」單人主 MJ 則固定寫「A Japanese woman in her twenties」。
- 依據：S1 要求具體（"Be Specific"）。MJ 沒有官方文件說明 "or" 的邏輯語意（not_stated），實際上會混合兩者或隨機取其一。
- 選項：雙人比照單人寫法，例如 `Two Japanese women in their twenties.`；或明寫 `a Japanese woman and a Korean woman`。改變的是人物身份，由 Cooper 決定。

### J. [可優化／低] 分段換行
- 主 MJ 用空行分成最多四段；MJ 胸上是單行。官方對換行的處理 **not_stated**。貼進 Discord 或網頁 Imagine bar 時是否保留換行、是否影響結果，需要實測。

### K. [可優化／低] 長度
- 樣本含尾綴實測：主 MJ 157–807 字元，MJ 胸上 262–887 字元。官方上限 **not_stated**，但 Prompt Shortener 的存在表示確實有上限（U2）。S1 主張短 Prompt，U1 則認為 V8 適合長而具體的 Prompt，兩者有張力。natural-main-v1 已核准保留原長度。建議以同 seed 實際生圖 A/B 測試，不要只靠推導。

### L. [符合] 已對齊的部分
- 開頭用媒材詞（`Photorealistic editorial portrait.`），符合 S1 的 Medium 建議。
- 主 MJ 用自然句、去掉內部控制語，與 U2「V8 風格較長、較詳細」的方向一致。
- 沒有使用 `::` 多段權重（V8.x 不支援）。
- 參數都放在句末，沒有標點。

## 4. 專案文件與官方現況的落差（只提醒）

1. `Docs/specs/midjourney-framing-pose-adaptation.md:44-45` 仍以 Character Reference（S19 已查無此文章，S18 列為舊功能）與 Omni Reference（只支援 V7）作為依據。V8.x 應改為參考 Edit Model（S14）。
2. `Docs/specs/page1-single-prompt-compression-guide.md:456` 寫主 MJ 與 MJ 胸上「固定使用 `A 20s seductive stunning Japanese woman.`」，與 natural-main-v1 實作後的主 MJ 不符。同檔 `:462` 引用的舊網址 `docs.midjourney.com/docs/prompts` 可改為 S1。
3. `midjourneyParameterContract.js:23` 寫 `targetModel: 'Midjourney V8'`，`parameterHelp` 寫「Raw 減少預設風格介入」，與官方一致；`--sd` 的說明也與官方一致，沒有發現錯誤。

## 5. 人物一致性（V8.x）建議選項（不定案）

- 專案目前只產生文字 Prompt，不涉及參考圖，因此 Omni／Character Reference 退場對輸出字串沒有直接影響。
- 若要讓角色卡跨圖一致，V8.x 官方途徑是 Edit Model（網頁「Attach to prompt」，Discord `--edit URL`，最多 4 張）。選項：(1) 只在說明文件或 UI 提示角色卡的用法；(2) 未來增加「參考圖模式」文字變體，以描述場景為主、減少臉部細節，避免與參考圖衝突（S15 的同類建議）。兩者都不改現有輸出。

## 6. 是否移除「MJ 胸上特寫」：正反面考量（不定案）

**支持移除**
- Cooper 自述很少使用。
- 它走舊的 `renderAiPrompt` 與同狀態投影，寫法和已核准的主 MJ 明顯分歧（見 G）：主觀美感詞、三圍數字、不可見部位、否定句。繼續保留，就得再做一輪對齊與驗證。
- 維護面廣：F 尾綴同步（`midjourneyParameterContract.js:26` 的 `affectsOnly`）、胸上專用測試與 baseline、public output contract、Saved Cards／Markdown consumer。
- 官方替代路徑：主 MJ 加 `--ar 4:5` 與胸上構圖詞即可生成；V8.x Edit Model 也能對既有圖做 Zoom／Pan 或依指令重新取景（S3 相容表、S14）。

**支持保留**
- 它是相容性面：`extraPrompts` id、Saved Cards 已存文字、匯入還原（AGENTS.md 的相容面清單）。移除時至少要保留讀取或還原能力。
- 它保留主 MJ 已省略的細節（例：上衣圖案），對近景有價值（見 H）。
- 它和「GPT 胸上特寫」成對，固定 4:5、一鍵可用。移除後兩邊不再對稱。
- `chest-up-same-state-v1.md` 是 2026-09-22 才核准的契約，近期投入成本高。

**可選路徑**
1. 維持現狀。
2. 對齊：改用主 MJ 自然 renderer 加胸上投影，消除 G 的分歧，並保留功能。
3. 從 UI 隱藏，但保留 codec、還原與舊收藏的顯示。
4. 完全移除，同步更新契約、測試、consumer，舊 Saved Cards 保留唯讀。

## 7. 驗證方式與限制

- 官方內容：以官方 API 取回原文（`mjdocs/*.json`），轉成文字後逐條核對。相容表的勾叉以 HTML 圖示檔名（check／no-symbol）解析。
- 樣本：使用已產生的 `official_samples.md`；另以 `probe_mj.mjs` 用測試同款 locks 重跑 normal-single 與 selected-top-chest-graphic，兩組 MJ 文字的偏離點一致。另實跑 `node --test --test-name-pattern=representative src/lib/engine/promptOutputContracts.test.js`：104/104 pass。
- **未做外部 Midjourney 實際生圖**。本報告中的「效果較好或較差」都是依官方文件推論，須以同 seed、同設定的實際生圖 A/B 才能確認。
- `--c 0`／`--w 0` 可以覆蓋網頁預設、`--sd` 會覆蓋設定面板的 HD，這兩點是推論，官方沒有明文。
