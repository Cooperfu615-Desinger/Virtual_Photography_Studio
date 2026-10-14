# Z-Image（`zImagePrompt`）官方規範稽核

- 稽核日期／官方資料存取日期：2026-10-13
- Repo 狀態：只讀；HEAD `e86703e`（`codex/specified-actions-v1`，工作樹有他人未提交變更，未觸碰）
- 樣本：`scratchpad/official_samples.md` 五個 fixture 的 Z-Image 段落，加上以 audit 同一計畫（200 筆、seed `prompt-quality-baseline`）重新產生的 200 筆 `zImagePrompt`（`scratchpad/official-review/z_scan_report_prompts.txt`）
- 分類標記：
  - **【A 違反官方建議】**：與官方文件或官方實作的明文內容衝突
  - **【B 官方未規定，可優化】**：官方沒有明文規定，屬文法、歸屬或可讀性問題
  - **【C 已核准／實測決定】**：與官方範例不同，但屬 Cooper 已核准或實測後的決定；這類只提醒取捨，不視為錯誤
- 嚴重度：高／中／低

---

## 1. 實際依據的官方文件

| # | 文件 | 版本／日期 | URL | 用途 |
|---|---|---|---|---|
| O1 | Z-Image-Turbo Hugging Face model card | 頁面未標更新日；所屬 collection 顯示 "Updated Jun 11" | https://huggingface.co/Tongyi-MAI/Z-Image-Turbo | Turbo 的參數與範例 Prompt |
| O2 | GitHub `Tongyi-MAI/Z-Image` README（raw） | main 分支，2026-10-13 抓取 | https://github.com/Tongyi-MAI/Z-Image | Turbo／Base 參數、官方範例 Prompt |
| O3 | 官方 Prompt Enhancer 模板 `pe.py` | Space 最新 commit `9baf60e` | https://huggingface.co/spaces/Tongyi-MAI/Z-Image-Turbo/blob/main/pe.py | 官方對「理想 Prompt」的改寫規則 |
| O4 | 官方 Space `app.py` | 同上 | https://huggingface.co/spaces/Tongyi-MAI/Z-Image-Turbo/blob/main/app.py | 實際推論參數、`max_sequence_length`、官方範例 Prompt 清單 |
| O5 | HF 討論串 #8（Tongyi-MAI 成員 Cxxs、QJerry 回覆） | 2025-11-27 | https://huggingface.co/Tongyi-MAI/Z-Image-Turbo/discussions/8 | 長度、負向 Prompt、PE 使用建議 |
| O6 | 技術報告 arXiv 2511.22699 | v5（2026-07-06） | https://arxiv.org/abs/2511.22699 | 訓練 caption 風格、PE-aware SFT |
| O7 | diffusers `pipeline_z_image.py`（官方整合實作） | main 分支，2026-10-13 抓取 | https://github.com/huggingface/diffusers/blob/main/src/diffusers/pipelines/z_image/pipeline_z_image.py | 預設 512 token 截斷、chat template |
| O8 | Magnific API：POST Z-Image（Turbo） | sitemap lastmod 2026-04-28 | https://docs.magnific.com/api-reference/text-to-image/post-z-image | Magnific 端欄位與限制 |

查不到的官方資料：
- Magnific 網頁 UI 的 Z-Image 設定說明：not_stated。magnific.com 回傳 403，文件站只找到 API 參考。
- Magnific 後端實際使用的 `max_sequence_length`：not_stated。
- 官方的人像攝影或相機用語指南：not_stated。
- 官方對「否定句寫在正向 Prompt 中」的說明：not_stated。

只當線索、未作為依據的第三方來源：fal.ai、artlist、magichour、evolink、invideo 等站點的 Z-Image Turbo 教學。

---

## 2. 官方建議摘要（逐條附來源）

| # | 官方建議（轉述，引文 ≤15 字） | 來源 |
|---|---|---|
| R1 | 長而詳細的 Prompt 效果最好；官方建議先手寫，再用 LLM 加 PE 模板擴寫。 | O5（Cxxs，2025-11-27） |
| R2 | Turbo 不使用 CFG，也不支援負向 Prompt；只有 Base 版「強烈建議」使用負向 Prompt。 | O5、O2（Base 參數段） |
| R3 | Turbo 推論設定：`num_inference_steps=9`（實際 8 次 DiT forward），以及 "Guidance should be 0 for the Turbo models"。Magnific API 預設 8 steps，沒有 guidance 欄位，也沒有 negative 欄位。 | O2、O4、O8 |
| R4 | 文字編碼器是 Qwen3-4B，Prompt 會先套 chat template。官方 demo 與 diffusers 預設 `max_sequence_length=512`，超過的部分直接截斷且不會報錯。官方成員說本地可設成 1024。Magnific API 的 `prompt` 上限是 4096 字元，但沒有說明 token 截斷。 | O5（QJerry）、O4 第 209 行、O7 第 207–233 行、O8 |
| R5 | 雙語：英文與中文都可以，官方範例兩種語言都有。官方強調模型支援 "bilingual text rendering (English & Chinese)"。 | O1、O2、O4 |
| R6 | PE 改寫流程：先鎖定主體、數量、動作、狀態、顏色與文字，再補構圖、光影、材質、色彩與空間層次，最後處理文字。 | O3 |
| R7 | 描述要客觀、具體；PE 原文「严禁使用比喻、情感化修辞」。不加 "8K"、「杰作」這類元標籤或繪製指令。 | O3 |
| R8 | 畫面中要出現的文字須逐字照錄，並用英文雙引號括起來。招牌與螢幕還須寫出內容、位置、尺寸與材質。 | O3 |
| R9 | 訓練用的長 caption 只寫可觀察的事實，不含主觀詮釋。SFT 階段所有訓練 Prompt 都先經 PE 處理（PE-aware SFT），所以模型習慣的是 PE 式的客觀稠密描述。 | O6 §3.2、§4.8 |
| R10 | 官方範例的形式：Turbo 英文範例是「短名詞片語＋逗號」，每組用句號分隔，例如 "Young Chinese woman in red Hanfu, intricate embroidery."。中文長範例是單段完整句，通常先寫主體或景別，再寫場景、服裝、動作，最後寫光線與風格。雙人範例（Base 版）逐人描述，並寫明「左侧／右侧」。範例都沒有空行分段，也沒有段落標籤。 | O2、O4 |
| R11 | 官方 Space 支援 9:16、3:4 等比例；Magnific API 只提供 `portrait_9_16` 和 `portrait_3_4` 等 6 種尺寸，沒有 4:5。 | O4、O8 |

---

## 3. 專案現行決策（已讀）

- `AGENTS.md`：Z 是「可追溯來源的刪減」，連接語法保持最少，不得新增視覺事實。另有核准例外：同場拍攝段落、相機方向、上方場景等。
- `Docs/specs/page1-single-prompt-compression-guide.md:294-391`：
  - 英文輸出、空行分段的自然語言；開頭用 `Photorealistic editorial portrait.`。
  - 不使用段落標籤；連接語只用 `with`、`and`、`She wears`、逗號與句號。
  - 身材數值與比例 anchor 不可刪除。
  - 左右側身幾何依 2026-08-14 的 Magnific 實圖結果改寫（屬實測決定）。
- `z-image-on-location-capture-v1.md`：段落順序依序為場景、姿勢、自拍、光線、ambient 連接句、構圖；人物與服裝放在之後（已核准，影像實測待驗）。
- `z-image-full-body-camera-v1.md`、`z-image-scene-direction-v1.md`、`z-image-existing-scene-detail-priority-v2.md`、`page1-single-scene-integrated-assembly-v1.md`：都是一般單人主 Z 的窄例外，已核准。
- `zImageTurboPromptContract.js`（v1.18.0）：
  - 長度：`encoderSequenceLimit: 512`、`targetEstimatedTokens: 400`、`softMaxEstimatedTokens: 480`，估算方式是 words×1.22 + 標點×0.2，結果只作診斷，不截斷 Prompt。
  - 排序：先列 primary sections，style、optics、rendering 列為 secondary 並放最後。

---

## 4. 逐條比對

### 4.1 長度與 512 token 截斷：【A／條件式】嚴重度 **高**

**依據**：R4。截斷發生在套用 chat template 之後，從尾端直接切掉。

**實測方法（可重跑）**：
- 用本機快取中的 Qwen2Tokenizer（vocab.json＋merges.txt，151,643 BPE，與 Qwen3 系列同一套 BPE）實作 byte-level BPE，重新計數。
- template overhead 取約 8 token。
- 腳本：`scratchpad/official-review/tools/qwen_bpe.mjs`、`z_scan.mjs`。
- 結果：`scratchpad/official-review/z_scan_report.json`。

**200 筆結果（audit 同計畫）**：

| 指標 | words | Qwen 實際 token | 專案估算 token |
|---|---|---|---|
| avg | 349.7 | **501.2** | 446.3 |
| p95 | 427 | **599** | 541 |
| max | 479 | **676** | 609 |

- 有 **97/200** 筆加上 template 後超過 512。
- 實際 token 數約是專案估算值的 1.123 倍。主因是 Qwen 把數字逐位拆開，例如 `bust–waist–hip 94–58–92 cm` 就占 17 token。
- 依模式分：
  - 一般單人 2/13 筆超過，max 586。
  - 雙人 9/13 筆超過，max 652。
  - 固定構圖普遍偏長；`japan-carriage-rush-hour` 有 11/12 筆超過，max 676。

**被截掉的尾段（樣例）**：
- 單人：被截的是光學與成像，例如 `stopped-down aperture sparkle … Glossy Japanese portrait color grade` 被切掉。這是設計上排在最後的 secondary 內容，損失較小。
- 雙人：場景與光線排在人物之後，所以截斷時會切到場景本身，例如 `duo#2` 從 `…everyone sharing the same physical space…` 開始被切，`duo#8` 從 `The scene is traditional British pub…` 開始被切。

**判讀**：
- Magnific 是否沿用 512 是 not_stated。若沿用，約一半輸出的尾段會被靜默丟棄。
- 專案的 400／480 估算門檻本身也低估了實際 token 數。
- 這一點不屬於品味取捨，是可以驗證的技術風險。

**建議驗證（先做，再談改寫）**：
1. 在 Magnific 用同一 seed 做兩組對照：
   - (a) 約 620 token 的實際輸出；
   - (b) 同一份 Prompt，只在最末尾加一個醒目且容易辨認的元素，例如尾句改成 `A red umbrella lies on the ground.`。
   兩組各跑 4 張。若 (b) 從未出現紅傘，就能判定 Magnific 有截斷。
2. 若確認截斷，可選的處理方式（由 Cooper 決定）：
   - ① 把估算公式改成真實 Qwen BPE，只用於診斷；
   - ② 雙人模式把場景與光線提前；
   - ③ 身材數值去掉重複的單位或連字號格式。這會碰到「身材數值不可刪」的規則，需要 Cooper 拍板；
   - ④ 改用可設 1024 的路徑。Comfy Cloud Z-Image-Turbo INT8 的截斷行為是 not_stated，需另外驗證。

### 4.2 人物段落的長逗號鏈與屬性歸屬：【B】嚴重度 **中**

**依據**：R10。官方 Turbo 範例是「名詞＋2～3 個屬性」為一組，再用句號分組。專案的寫法本身與官方風格同源，差別在專案沒有切句。

**統計**：200 筆中，每筆「單句最多逗號數」的中位數是 **30**，max 39。

**樣本**：
- normal-single：`…94–58–92 cm, long soft waves with defined wave shape…`。量測數值後面直接接髮型，歸屬不清。
- audit `single#12`：`…woman with slim geometric drop earrings, … clean modern jewelry accent, I–K cup bust, …`。讀起來像胸型是 earrings 的屬性。

**改寫前後短例**（只用 `and`、`She has`、`Her hair is` 這類最小連接語，不新增事實）：

> 前：`A 20s … woman with slim geometric drop earrings, elongated rectangular metal pendant shapes, clean modern jewelry accent, I–K cup bust, slim arms, …`
>
> 後：`A 20s … woman. She has I–K cup bust, slim arms, … pronounced hourglass silhouette; height 163–168 cm, bust–waist–hip 103–60–98 cm. She wears slim geometric drop earrings with elongated rectangular metal pendant shapes. Her hair is long and straight with full Japanese bangs, … silver-gray white.`

**選項**：
- (a) 維持現狀；
- (b) 只在身體、臉、髮、膚與表情、配件之間加句號；
- (c) 每組前面加最小主語。

注意：`She has`、`Her hair is` 不在 compression guide 第 337 行列出的連接語清單裡，若採用需要擴充規範。

### 4.3 主觀、情緒與比喻詞：【A：PE 風格】／部分屬【C】嚴重度 **中**

**依據**：R7（PE 原文「必须客观、具象」）、R9（訓練 caption 不含主觀詮釋）。

**樣本**：
- 全部 200 筆都有 `seductive stunning`。屬【C】：這是跨模型固定的身份句，見 `engine-architecture.md:176`，並有測試鎖定。
- `airy fresh beauty`、`young beautiful Japanese transparent face`。`transparent face` 是「透明感」的直譯，在英文裡可能被照字面理解成透明的臉。
- `lazy sensual photobook moment, languid relaxed chemistry`（duo#0）、`casual social energy`。

**判讀**：
- 這些詞不是錯誤，但在官方「客觀可見事實」的訓練分布下，對畫面的約束力弱，又會佔用 token（與 4.1 相關）。
- 身份句屬 Cooper 決定，只提醒取捨。
- 其餘詞來自 catalog，改動要回到資料來源層處理，不能在 renderer 端改。

**改寫例**（來源層，需 Cooper 核准）：`transparent face` → `clear translucent-looking skin, luminous complexion`。

**選項**：
- (a) 不動；
- (b) 只修可能被照字面理解的詞，例如 transparent；
- (c) 做 A/B 實測：拿掉 `airy fresh beauty` 這類氣質詞，比較臉部是否改變。

### 4.4 畫面文字的寫法：【A：當目的是要清楚呈現文字時】嚴重度 **中**

**依據**：R8。

**樣本**：
- shibuya-moving-crowds：`QFRONT glass facade carrying TSUTAYA and STARBUCKS signage`。品牌字樣沒有加引號。
- 專案的精確文字 wrapper：`A wall poster within the scene clearly displays the exact … text "美華冰室".`。已經用引號並寫出位置，符合 R8 的主要要求，但缺少官方要求的字體、尺寸與材質。

**改寫例**（只對已存在的字樣加引號，不新增文字）：`QFRONT glass facade with signage reading "TSUTAYA" and "STARBUCKS"`

**選項**：
- (a) 維持不加引號，讓模型自由發揮，接受字樣可能糊掉；
- (b) 地標字樣一律加引號；
- (c) wrapper 加入使用者輸入的字體或尺寸。但這需要新增輸入欄，超出本稽核範圍。

### 4.5 片段句、大小寫、重複與組合矛盾：【B】嚴重度 **中／低**

**樣本**：
- 句首小寫、缺主語：
  - `single#12`：`standing pose with loosely crossed arms, relaxed closed posture, relaxed composed posture.`
  - carriage：`adjusting hair while moving, …`
  - carriage：`… body. eye-level view.`

  這是同場段落直接插入來源片段的結果。修法只需把句首改成大寫，或加最小主語，例如 `She stands with loosely crossed arms…`。後者是否被「逐字 canonical pose」規則允許，需要確認；大寫化屬純格式，風險最低。
- 近似重複：`relaxed closed posture, relaxed composed posture`（同一句）；head-dominant 的 `front view.` 與 `Photographed directly from the front.` 重複。
- 屬性順序：
  - `single#12`：`She wears wet-look glossy surface with smooth liquid-like highlights, light blue Venom cosplay bodysuit, a full-body skin-tight black suit…`。材質寫在衣物名之前，而且 light blue 與 black 互相矛盾。
  - 改寫例：`She wears a light blue Venom cosplay bodysuit with a wet-look glossy surface…`。顏色衝突屬來源問題，需 Cooper 決定以哪個為準。
- 組合矛盾（選項組合造成，不是格式問題）：
  - normal-single：`solid black void` 搭配 `bright daytime sky where visible`。
  - head-dominant：`camera is directly above her … 90-degree` 搭配 `Her chest and both shoulders face the lens`。
  - 規範已寫明這類矛盾交給使用者處理，這裡只記錄。
- 任務提到的 `She wears,`（She wears 後面多一個逗號）：在 5 個 fixture 與 200 筆 audit 的 Z 輸出中都是 **0 次**。Z 輸出未觀察到這個問題，可能出在其他輸出。

### 4.6 繪製指令、後設語與內部語：【A：PE】／【C】嚴重度 **低～中**

**依據**：R7（不加「繪製指令」）、`AGENTS.md`（不洩漏內部控制語）。

**樣本**：
- 日本車廂固定組合有 36/200 筆出現：
  - `The selected crop and lens may omit peripheral carriage details.`
  - `visible left-right relationships may change with the viewpoint`

  這是寫給模型看的容許說明，不是畫面描述，而且含有內部詞 `selected`。
- 改寫例：直接刪除，或改成可見事實，例如 `Peripheral carriage details fall outside the frame.`。
- 這屬於固定構圖既有文字，若是 Cooper 實測保留的，則歸【C】。

### 4.7 否定句寫在正向 Prompt：【C】嚴重度 **低**

**依據**：R2。Turbo 沒有負向 Prompt；至於否定句寫進正向 Prompt 是否有效，官方 not_stated。

**樣本**：
- full-face 模式：`subject must not be centered`（5 筆）。這是已核准的公開文字，見 `current_project_state.md:402`。
- carriage：`with no cleared space around the subject`（12 筆）。

**提醒**：CFG=0 時，`centered` 這個詞本身仍然會被編碼進條件。若 Cooper 的實測可接受，就維持。也可以只保留已有的正向描述（例如 `narrow margin on the left … broad negative space on the right` 已經足夠），把否定句改成可選的 A/B 測試。

### 4.8 段落順序與空行分段：【C】嚴重度 **低**

**依據**：R10。官方範例大多先寫主體（或景別＋主體），再寫場景與光線，而且都是單段、不空行。

**專案做法**：
- 同場拍攝段落把場景、姿勢、光線、構圖放在人物之前。
- 用空行分段。

**判讀**：屬 Cooper 已核准的決定（on-location v1，影像實測待驗）。這與官方範例的差異只提醒取捨，不判為錯誤。

**取捨點**：
- 場景在前：在 512 截斷時對場景較安全（見 4.1）。
- 主體在前：與官方範例和 PE 改寫流程一致。

### 4.9 數值、百分比與公尺數：【C】嚴重度 **低**

**依據**：官方對數值描述的效果 not_stated。

**樣本**：
- `head … occupying 50–60% of frame height`
- `height 168–173 cm, bust–waist–hip 94–58–92 cm`
- 全身俯視的約略公尺數

**提醒**：都屬已核准規範，其中身材數值明定不可刪除。代價是 token：身材量測一段約 30 token。是否能被模型準確執行，只能靠實測確認。

### 4.10 已符合官方方向的部分（不需改）

- 不使用負向 Prompt、不加 `8K` 或 `masterpiece`（200 筆中 0 次），符合 R2、R7。
- 開頭用直接的媒介描述 `Photorealistic editorial portrait.`，與官方範例「照片／写实摄影」的媒介宣告一致。
- 英文輸出，符合 R5。
- 雙人用 `Woman 1 has … She wears …` 逐人描述，與官方 Base 雙人範例逐人描述的方式一致。官方範例另外寫了左右位置；專案沒有選項來源可對應，不建議由 renderer 自行補位置。
- 精確文字使用英文雙引號，符合 R8 的主要要求。
- 攝影師風格、焦段、成像描述屬具體的世界知識錨點，PE 並未禁止。

---

## 5. 優先處理建議（只給選項，由 Cooper 決定）

1. **先驗證 4.1**：做一次 Magnific 尾段探針測試（4 張即可），並把 `z_scan.mjs` 的真實 token 統計記為基準。這一步成本低、資訊量最大。
2. **純格式修正**：句首大寫，以及刪除同一句內的完全重複。符合 compression guide「只移除完全重複」的範圍，與品味無關。
3. **屬性分組切句（4.2）**：需要擴充連接語清單，並做 A/B 實測。
4. **地標字樣加引號（4.4）**、**移除容許說明句（4.6）**：各自做一組 A/B 實測。
5. **主觀詞與 `transparent face`（4.3）**：屬來源資料層的修改，等 Cooper 決定後再排程。

## 6. 重跑方式

```bash
cd scratchpad/official-review/tools
QWEN_TOK_DIR=~/.cache/huggingface/hub/models--mlx-community--Qwen3-TTS-12Hz-1.7B-VoiceDesign-4bit/snapshots/5c390979e4b93af5f2932f90742ca99c7dd04687 \
  node z_scan.mjs 200 prompt-quality-baseline ../z_scan_report.json
```

限制：
- tokenizer 取自 Qwen3-TTS 快取，與 Z-Image 用的 Qwen3-4B 屬同一套 BPE；template overhead 以 8 token 近似。
- 若要精確到個位數，請改用官方 `Tongyi-MAI/Z-Image-Turbo` 的 tokenizer 複核。
- Magnific 實際截斷值需用 4.1 的探針測試確認。
