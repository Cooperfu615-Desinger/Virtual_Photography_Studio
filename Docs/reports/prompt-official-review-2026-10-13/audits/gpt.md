# GPT／胸上特寫／全身角色照：官方 GPT Image 規範稽核

稽核日期：2026-10-13（官方頁面存取日同日）
稽核範圍：`grokPrompt`（GPT）、`chest-up-portrait`（胸上特寫）、`full-body-character`（全身角色照）
樣本來源：`scratchpad/official_samples.md`（HEAD `e86703e`，5 個 fixture，其餘欄位全無、固定 seed）
性質：只讀稽核，未修改 repo；所有優化建議**均未經實際生圖驗證**（見 §6 驗證方式）。

---

## 0. 實際依據的官方文件與版本

| 代號 | 文件 | URL | 版本／日期 | 用途 |
| --- | --- | --- | --- | --- |
| S1 | Image prompting（內含「GPT Image 2.5 prompting guide」章節） | https://developers.openai.com/api/docs/guides/image-prompting | 涵蓋 `gpt-image-2.5-flare`／`gpt-image-2.5-sunburst`，另附 GPT Image 2／1.5／1 reference；**頁面未標示發布日期** → 發布日 not_stated | **主要依據** |
| S2 | Image generation（API guide） | https://developers.openai.com/api/docs/guides/image-generation | 列出兩個 2.5 模型與 size／quality 參數；未標日期 | 參數 |
| S3 | Cookbook：GPT Image Generation Models Prompting Guide | https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide.md | 模型資訊標註「as of April 21, 2026」，頁面已標示 archived、可能過時；涵蓋 gpt-image-2，**未提 2.5** | 輔助對照（舊版） |
| S4 | Help Center：Images in ChatGPT | https://help.openai.com/en/articles/11084440-images-in-chatgpt | 未標日期 | ChatGPT 介面比例 |

- 2.5 的發布日（2026-09-08）與「Flare 品質接近 GPT Image 2」等說法，僅見於第三方（muapi.ai、felo.ai、morphic.com 等），**只作線索，不作依據**。
- 專案不經 OpenAI API 生圖（`webapp/src/lib/dllPicProClient.js` 走 xAI／Gemini；`functions/src/byteplusGeneration.js` 為 BytePlus），GPT 輸出推定是貼到 ChatGPT 使用 → 比例只能透過 prompt 或 ChatGPT 的比例選擇器控制（S4）。

---

## 1. 官方建議清單（轉述；引號內為原文 ≤15 字）

| # | 官方建議 | 來源 |
| --- | --- | --- |
| O1 | 先定義成品：寫出主體與用途，再寫構圖、比例、擺放限制。原文："Name the subject and intended use" | S1 |
| O2 | 格式不拘（短句、段落、JSON-like、tags 皆可），選「易讀易改」的；不需特殊語法。複雜需求可用標籤分段，順序為 scene、subject、details、constraints | S1；S3 同義 |
| O3 | 長度：無上限或建議字數 → **not_stated**；S3 建議從乾淨的基礎 prompt 開始再逐步修 | S1／S3 |
| O4 | 寫實需明說 "photorealistic" 或 "real photograph"；描述真實質感；相機規格只是外觀提示，非物理模擬 | S1；S3 |
| O5 | 人物：描述景別、比例、視線、與物件互動，例：「full body visible, feet included」 | S1 |
| O6 | 明確列出排除項（例："No extra text, no watermarks"）；標籤式範例把 `Constraints:` 獨立成段 | S1 |
| O7 | 否定句是否該避免堆疊 → **not_stated**（官方範例自身就用多個 "No …"） | S1 |
| O8 | 畫面文字：必要字句放引號、描述位置與字型、要求不加多餘文字、必要時逐字母拼寫 | S1；S3 |
| O9 | 角色一致性：撰寫可重用角色描述（外觀、比例、服裝、調性），以生成圖當後續輸入，重述細節並加 "Do not redesign the character"；建立角色的範例用「素背景以清楚展示角色」 | S1 |
| O10 | size／quality／background／output_format 為 API 參數，"Set API parameters separately from the prompt"；prompt 可描述比例，但實際尺寸由 `size` 決定，兩者衝突時誰優先 → not_stated | S1／S2 |
| O11 | ChatGPT 介面：可用比例選擇器或把比例寫進 prompt | S4 |
| O12 | 迭代：一次改一項；從 GPT Image 2 遷移時先保持 prompt 不變比較，"Compare quality levels before rewriting the prompt" | S1 |
| O13 | 指令矛盾、冗詞、重複、大小寫、標點 → **not_stated**（S1 只建議漂移時重述關鍵限制） | S1 |
| O14 | 光線：寫出光源與光質；暗光／霓虹／大場景要補尺度、氛圍、色彩 | S1 |

---

## 2. 專案已核准設計（不算錯誤，只提醒取捨）

| 設計 | 依據 | 與官方的關係 |
| --- | --- | --- |
| 固定段落順序 Image Type → Composition → Subject → Wardrobe → Pose and Composition → Scene → Lighting → Camera Look；明文「不將場景提前」 | compression-guide §1 Gpt；gpt-scene-lighting-visibility-v1；gpt-composition-camera-spatial-v1 | 符合 S1 的 O1（先主體／用途，再構圖）；與 S3 舊版 scene→subject 順序不同，屬可接受差異 |
| 不輸出 `Constraints` 段 | compression-guide §1 Gpt | 官方標籤範例有 Constraints 段（O6），但並非強制 |
| GPT 完整保留（含 catalog 片段、guard、控制語） | AGENTS.md；compression-guide §2 | 官方未限制長度，可接受；但與 O2「易讀易改」有張力 |
| GPT 三輸出與雙人主 GPT 省略獨立 Body Type | gpt-standalone-body-omission-v1 | 與 O9「可重用描述包含比例」衝突，見 F1 |
| 胸上沿用同一拍攝狀態、場景只依鏡頭方向投影 | chest-up-same-state-v1 | 導致胸上保留畫面外地面描述，見 F9 |
| 全身角色照固定 9:16、均勻光、自然站姿、頭到腳完整 | AGENTS.md；standalone-body spec | 符合 O5、O6 |

---

## 3. 逐項稽核結果

嚴重度：高＝可能直接影響用途或一致性；中＝可能影響畫面穩定度；低＝格式或可讀性。
分類：【違反】違反官方建議／【可優化】官方未規定但可優化／【核准取捨】Cooper 已核准設計，只提醒取捨。

### F1【核准取捨｜高】全身角色照（角色備份）不含體態，與官方角色一致性做法衝突
- 樣本（normal-single／全身角色照）：`The subject is one 20-year-old Japanese or Korean female portrait subject.`，Subject 段後直接接髮型，沒有任何身形比例。
- 官方 O9：可重用角色描述要包含 proportions。全身角色照的用途是「好造型的角色備份」，正是 O9 的情境。
- 取捨：body-omission spec 已核准，而且明說純 GPT 文字無法反推體態。補償因素：官方的一致性主要靠「把生成圖當後續輸入」（O9），所以只要備份**圖**被重用，體態仍由影像攜帶；文字缺體態只在「重貼文字重生」時有影響。
- 選項（由 Cooper 決定）：
  a. 維持現狀，並在使用說明中註明「角色備份以圖片為準，文字不含體態」。
  b. 只對 `full-body-character` 重開例外，加入短的非數值正向比例描述（需修訂 spec，不能偷改）。
  c. 不改 prompt，改從 Saved Cards 的結構化 selection 取回體態（已保存）。
- 是否與實測衝突：spec 自述「實際 GPT／ChatGPT 生圖接受情況尚未以外部生圖測試驗收」，沒有衝突紀錄。

### F2【可優化｜中】主體句「Japanese or Korean」讓模型二選一，且 "portrait subject" 重複
- 樣本（三種輸出、全部 fixture）：`one 20-year-old Japanese or Korean female portrait subject`（來源 `webapp/src/lib/engine.js:155`）
- 官方 O1／O9 強調具體與可重用；「or」等於每次生成都可能選不同族裔，不利一致性，對全身角色備份影響最大。`subject … portrait subject` 是冗詞，"female portrait subject" 讀起來像內部分類語。
- 改寫例：
  - 前：`The subject is one 20-year-old Japanese or Korean female portrait subject.`
  - 後（選項 A，保留語意）：`The subject is a 20-year-old woman of Japanese or Korean appearance.`
  - 後（選項 B，鎖定一致性，需 Cooper 決定族裔）：`The subject is a 20-year-old Japanese woman.`
- 注意：這句是 GPT 專用的人物數量來源，改動屬 prompt wording change，需先加 fixture、跑同 seed 比較（AGENTS.md）。族裔取捨屬商業／品味決策。

### F3【違反｜中】實景招牌文字沒有加引號
- 樣本（shibuya-moving-crowds／GPT、胸上）：`QFRONT glass facade carrying TSUTAYA and STARBUCKS signage`
- 官方 O8：必要字句放引號、說明位置、要求不加多餘文字。目前是裸寫，模型可能拼錯、亂造字，或在其他招牌補上多餘文字。
- 改寫例：
  - 後：`the QFRONT glass facade carrying the signage "TSUTAYA" and "STARBUCKS", each appearing once`
- 如果 Cooper 認為招牌不需要精準可讀（只要氛圍），那就不算違反，可改成描述為模糊或背景化。此為 Scene catalog 資料，屬 shibuya-station-crowds-v1 契約範圍，應走資料 authoring 流程。

### F4【可優化｜中】選項組合產生語意矛盾：黑色無限背景卻寫白天天空
- 樣本（normal-single／GPT、胸上）：Scene 為 `solid black void … no ceiling`，Lighting 卻是 `bright daytime sky where visible`
- 官方對矛盾指令 → not_stated（O13），但 O14 要求寫清楚光源；`where visible` 是把判斷丟給模型的含糊措辭。
- 這是使用者選項組合造成的（環境光 × 純色場景），不是 renderer 錯誤。選項：
  a. 在 Generation Summary 對「純色棚景 × 戶外天空環境光」顯示相容性提示（不改 prompt）。
  b. 在 Scene／Lighting 可見性投影加一條規則：場景沒有天空時省略 sky 片語（需新 spec，與 gpt-scene-lighting-visibility-v1 同類）。

### F5【核准取捨｜中】排除項散落在 Scene 中，且單句堆疊 8 個 "no …"
- 樣本（normal-single／GPT、胸上）：`no wall corner, no floor seam, no ceiling, no fluorescent tubes, no paper roll, …`（共 8 項）
- 官方：可以寫排除項（O6），否定堆疊是否有害 → not_stated（O7）；第三方（runware.ai）稱 inline negation 可用，只作線索。
- 偏離點：官方的標籤式範例把排除項集中在 `Constraints:`；專案已核准「不輸出 Constraints」。
- 選項：
  a. 維持現狀（符合完整保留原則）。
  b. 只做重排：把 Scene 中的 `no …` 片段移到最後一段 `Constraints:`，正向描述留在 Scene。這會新增 section label（屬相容性範圍），而且要推翻「不輸出 Constraints」，需要 Cooper 拍板。
  - 前：`Scene: … full-bleed black surface, subtle natural contact shadow under the subject, no wall corner, no floor seam, …`
  - 後：`Scene: … full-bleed black surface, subtle natural contact shadow under the subject.` ＋ 結尾 `Constraints: No wall corner, no floor seam, no ceiling, …`

### F6【可優化｜低】格式瑕疵：句首小寫、缺冠詞、逗號後大寫
GPT 完整保留規則本來就允許「壞標點／格式」清理，修這些不算語意壓縮。官方對大小寫 → not_stated。

| 樣本片段 | fixture／輸出 | 問題 |
| --- | --- | --- |
| `female portrait subject. long soft waves with defined wave shape` | normal-single／GPT、胸上、全身 | 句點後小寫 |
| `clean dark depth.` 前的 `natural black hair, soft realistic shine` | 同上 | 句首小寫 |
| `Lighting:` 下一行 `clear bright daylight with clean visibility` | normal-single／GPT、胸上 | 段首小寫 |
| `Camera Look:` 下一行 `shot on fisheye lens, extreme hemispherical` | head-dominant-top-down／GPT、胸上 | 段首小寫 |
| `upper-body line. dark blue straight-leg jeans` | normal-single／GPT、全身 | 句點後小寫 |
| `She wears white cotton camisole top` | normal-single | 缺冠詞 a |
| `She wears short-sleeve top, smooth stretch fabric` | selected-top-chest-graphic | 缺冠詞 a |
| `at a 4:5 aspect ratio, Chest-up portrait` | 全部胸上 | 逗號後大寫（`engine.js:11121` 前綴以 `, ` 接已大寫的景別） |

- 建議：GPT renderer 最後加「句首大寫」正規化（每段首字與 `. ` 後首字）；比例前綴改用句點分隔，或把後接景別首字改小寫。
  - 前：`Vertical portrait composition at a 4:5 aspect ratio, Chest-up portrait, eye-level view`
  - 後：`Vertical portrait composition at a 4:5 aspect ratio. Chest-up portrait, eye-level view`
- 冠詞要從資料或 lead 句修，不能靠 regex 補 "a"，否則會誤傷複數或不可數名詞。
- 實作時要注意：比例前綴的 regex 已寫死在 `gptCameraSpatialTestSupport.js:31`，歷史 hash 也會變，需要 scoped baseline。

### F7【可優化｜中】代名詞先於主體出現
- 樣本：normal-single／GPT 的 Composition 段 `Her entire figure is framed…`；shibuya／GPT 的 `tilted upward toward the woman`。這兩句都出現在 Subject 段之前。
- 官方 O1：先寫主體與用途。目前 Image Type 只寫畫面類型，沒寫主體，所以模型先讀到 "Her" 才讀到她是誰。
- 改寫例（只重排既有事實，不新增內容）：
  - 前：`Create a photorealistic editorial portrait.`
  - 後：`Create a photorealistic editorial portrait of one young adult woman.`（雙人寫 `of two young adult women`）
- 這是 Image Type 文字變更，會影響所有 GPT 系列 hash；需要 fixture，也需要 Cooper 同意。

### F8【可優化｜低】段落標籤「Composition」與「Pose and Composition」語意重疊
- 樣本：同一份 GPT 同時有 `Composition:` 與 `Pose and Composition:`，後者只寫姿勢，例如 `She presents a relaxed neutral standing posture.`
- 官方 O2 只要求易讀易改；兩個段都叫 Composition，人工微調時容易改錯段，模型也可能把它們當成兩組構圖指令。
- section label 屬相容性範圍（AGENTS.md），Saved Cards／匯入可能依賴標籤 → 建議**先不改**，最多列為之後的選項（例：改名為 `Pose:`，同時保留舊標籤可解析）。

### F9【核准取捨｜低】胸上特寫保留畫面外的地面描述
- 樣本（normal-single／胸上）：`subtle natural contact shadow under the subject, … no floor seam`
- chest-up-same-state-v1 核准「場景完整來源＋依鏡頭方向投影」，平視不省略地面。取捨：胸上畫面看不到腳下陰影；這類描述可能把模型拉向較寬的景別，或者根本無效。官方 → not_stated。
- 選項：維持現狀；或者另立 spec，讓胸上依景別（不只依角度）省略已審查的地面片語。

### F10【可優化｜中】全身角色照沒有背景與表情設定
- 樣本（全部 fixture／全身角色照）：只有 Image Type、Subject、Wardrobe、Lighting、Camera Look，**沒有任何背景描述**，也沒有視線或表情。
- 官方 O9 的建立角色範例用「素背景以清楚展示角色」；O5 建議寫視線。目前背景交給模型自由發揮，同一角色多次備份時背景不一，不利於日後當參考圖。
- 改寫例（新增視覺事實，需 Cooper 核准，屬品味決策）：
  - 在 Camera Look 前加：`Background: Plain light-gray seamless studio background, nothing else in frame.`
  - 在 Subject 加：`Neutral relaxed expression, looking at the camera.`
- 現有的 `no crop, no hidden limbs, … no visible text` 符合 O5／O6，建議保留。

### F11【可優化｜中】雙人主 GPT 構圖句含糊、重複，並帶控制語氣
- 樣本（gpt-duo-standalone-body-omission／GPT）：`Use a loose full-body or wider two-person composition as a loose photographic guide`
- 問題：(1) "loose" 出現兩次；(2) Composition 已寫 `Full-body portrait.`，這裡又寫 "or wider"，指令互相打架；(3) "as a … guide" 是內部控制語氣，AGENTS.md 禁止內部控制語外洩，這句屬邊界情況。
- 改寫例：
  - 後：`A candid two-person full-body composition; natural overlap and partial occlusion between the two women are acceptable.`
- 另外提醒：雙人 GPT 省略 Body Type 後，在 fixture（全無）中兩人完全無法區分。實務上有選其他欄位時應該會有差異，這點需要用實際選項樣本確認。

### F12【可優化｜低】寫實質感提示
- 官方 O4 建議描述真實質感（皮膚紋理、衣料磨損），想要自然感時加 "No glamorization, no heavy retouching"。目前三種輸出只寫 `photorealistic editorial portrait`，"editorial" 本身偏向精修。
- 這是品味決策：要「雜誌精修」還是「真實照片」由 Cooper 決定。選項：在 Image Type 後追加一句質感描述，或交給 A 區既有的膚質選項處理（已存在則不需新增）。

### F13【核准取捨｜低】catalog 片段帶抽象美感詞
- 樣本（normal-single／GPT）：`clean compact upper-body line`、`balanced leg line`、`natural dimension`
- 官方 O4 偏好可視覺化的具體細節；這些詞資訊量低。GPT 完整保留規則禁止在 renderer 層刪除，應走資料 authoring 檢討，不在 renderer 處理。

### F14【符合】已符合官方建議的部分
- Image Type 以 `Create a photorealistic …` 開頭，與 S1 寫實範例的開頭句型一致（O1、O4）。
- 標籤分段、固定順序屬 S1 允許的格式（O2）；順序先主體用途再構圖，符合 O1。
- 構圖使用景別、俯仰、環繞角度的自然語言（O5）；全身角色照的 `complete figure visible from head to toe, both hands and both feet completely visible` 幾乎就是官方的 "full body visible, feet included" 寫法。
- 比例寫在 prompt：專案在 ChatGPT 使用，符合 S4（O11）。若日後改走 API，需要另外設定 `size`（O10）：9:16 可用 `1152x2048`，4:5 可用 `1024x1280`。兩者都已用指令驗證符合 16 倍數、像素範圍與 3:1 限制（驗證指令見 §6）。
- 全身角色照的光線 `Clean even lighting with clear facial, body, fabric, and footwear readability` 有寫明用途與光質（O14）。
- 沒有 `multi-cut sequence n=2` 等歷史控制尾巴。

---

## 4. 與 Cooper 實測結論的對照

- `Docs/specs/page1-single-scene-integrated-regression-v1.md` V-02：Cooper 接受的人工 prompt 是**無標籤的連續散文段落**，ChatGPT Image 實測「以結果論可接受」。官方兩種格式都允許（O2），**不構成衝突**。不過這是目前唯一的 GPT 實測正面證據，而它不是標籤格式；標籤格式的 GPT 主輸出至今仍標記為「待正式輸出實測」（current_project_state.md:27）。建議用 §6 的 A/B 實測確認，**不要憑官方文件直接改格式**。
- `Docs/conversation_handoff.md:385`：style prefix 在 GPT Image 有效，但該範圍已暫停，本稽核不重開。
- 其他項目沒有找到與實測結論衝突的紀錄。

---

## 5. 優先順序建議（僅供參考，由 Cooper 拍板）

| 優先 | 項目 | 嚴重度 | 分類 | 改動成本 |
| --- | --- | --- | --- | --- |
| 1 | F1 全身角色備份缺體態 | 高 | 核准取捨 | 需重開 spec |
| 2 | F2 「Japanese or Korean」二選一＋冗詞 | 中 | 可優化 | 一行資料＋fixture |
| 3 | F3 招牌文字未加引號 | 中 | 違反 | 場景資料 |
| 4 | F10 全身角色照無背景／表情 | 中 | 可優化 | 固定文字＋fixture |
| 5 | F6 大小寫／冠詞／逗號格式 | 低 | 可優化（屬允許的清理） | renderer 正規化＋scoped baseline |
| 6 | F4 黑色背景 × 白天天空矛盾 | 中 | 可優化 | 提示或新投影規則 |
| 7 | F7 代名詞先於主體 | 中 | 可優化 | Image Type 文字 |
| 8 | F11 雙人構圖句 | 中 | 可優化 | 一句固定文字 |
| 9 | F5／F8／F9／F12／F13 | 低～中 | 核准取捨／可優化 | 需 Cooper 決定 |

---

## 6. 驗證方式（建議均未驗證）

1. **尺寸數值**（已執行）：`python3 -c` 檢查 1024x1280、1152x2048 的邊長為 16 倍數、像素數介於 655,360 與 8,294,400 之間、長短邊比 ≤3，結果為 True。
2. **prompt 改動的實際效果**：依官方遷移建議（S1 "Keep the prompt, references, dimensions, and output format unchanged"）做 A/B：
   - 同一模型（建議分別測 2.5 Flare 與 Sunburst，或 ChatGPT 預設）、同比例、同 quality；
   - 每個 fixture 的「現行版 vs. 單一改動版」各生成 ≥4 張，一次只改一項（O12）；
   - 檢查：族裔一致性（F2）、招牌拼字（F3）、背景一致性（F10）、景別是否被地面描述拉寬（F9）、黑底是否出現天空（F4）；
   - 記錄可重現資訊：prompt 全文 hash、模型、比例、張數、通過數。
3. **程式面**：任何採納項目都需依 AGENTS.md 先加 focused fixture，跑同 seed `scripts/validate_prompt_logic.mjs`、`npm run test:prompt-quality`、`npm run audit:prompts:strict`，並確認其他五個輸出逐字不變。

---

## 附註（範圍外觀察，僅記錄）
- Nano Banana 樣本（normal-single）有 `bright daytime sky where visible., soft side light` 的「.,」壞標點，不屬本稽核三種輸出，順帶記錄。
