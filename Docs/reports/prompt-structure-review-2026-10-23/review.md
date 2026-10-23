# 六組 Prompt 組成結構檢視（2026-10-23）

- 範圍：只檢視與報告，沒有改任何程式或輸出。
- 樣本：[sample-six-outputs.txt](sample-six-outputs.txt)（main @ 5cfa9eb，站姿自然、道具打開的書、牛仔中景、seed `six-1`）。使用者貼的範例是 Z-Image 主輸出。
- 注意：這次對話前半段的幾個實驗（跨景別穿搭、外套穿法）誤在舊分支 `codex/shirt-black-bottom` 的主工作區跑，已在 main 上重跑跨景別選擇比對（0/120）確認結論不變。

## 1. 六組現行順序

| 輸出 | 順序 |
| --- | --- |
| 主 GPT | 成品類型 → 構圖 → 人物 → 服裝 → 姿勢 → 場景 → 光線 → 攝影風格與鏡頭與成像 |
| 主 Z-Image | 成品類型 → [場景 → 姿勢 → 光線 → 環境光句 → 構圖與機位]（同場段落）→ 人物（體態、臉、髮、表情、臉部配件）→ 服裝 → 風格 → 鏡頭 → 成像 |
| 主 MJ | 成品類型＋構圖 → 人物（含姿勢句）→ 服裝 → 場景＋光線 → 風格與鏡頭與成像＋參數 |
| 主 Nano | 成品類型＋構圖 → 人物 → 服裝 → 姿勢＋場景 → 光線 → 風格與鏡頭與成像 |
| 胸上 | 同 GPT 結構（4:5、服裝只留上身） |
| 全身角色照 | 成品類型 → 人物 → 服裝 → 光線 → 全身構圖（不含姿勢與場景） |

## 2. 問題清單（依影響排序）

| # | 問題 | 影響的輸出 | 例子 |
| --- | --- | --- | --- |
| P1 | **Z-Image 的 "She" 在主角介紹之前就出現**：姿勢句、環境光句、機位句都在人物段落之前 | Z | `She stands in…` 排在第 3 行，`A 20-year-old… woman` 在第 7 行 |
| P2 | **服裝修飾語排在衣物名稱前面**：版型、穿法、褲腰、下擺等描述先寫，衣物名稱最後才出現，修飾語與衣物脫節 | 全部 | `pants waist button undone…, tight body-skimming lower-body fit, light blue denim shorts`；`layered over underbust-cropped tight fit, hem ending just below the bust, off-white t-shirt`；`wide-leg volume…, olive green nylon cargo pants` |
| P3 | **服裝來源文字自相矛盾**：衣物是 shorts，描述寫 pants waist | 全部 | 同上例；屬資料問題，不是順序問題 |
| P4 | **同一個人的配件被拆成兩處**：臉與頸部配件（眼鏡、耳骨夾、耳機、項鍊）放在人物段落，肚臍環放在服裝段落 | Z、GPT、Nano | 範例中眼鏡在第 7 行、肚臍環在第 8 行末尾 |
| P5 | **懸空片語**：眼鏡顏色／造型被獨立抽出，句子變成「A 20-year-old … woman with white frame, thin-frame glasses」，`white frame` 沒有主詞 | Z | 範例人物段落第一句 |
| P6 | **鏡頭資訊被拆在兩處**：構圖／機位與方位在前（同場段落），焦段與光圈在後（風格之後） | Z、其餘多數 | `Knee-up cowboy shot…strict 90-degree lateral…` 與 `Shot on 24mm…` 相隔約 12 行 |
| P7 | **臉部資訊拆成兩處**：頭部角度與視線在姿勢句，表情在人物段落 | Z、MJ、Nano | `She has her head lowered…` 與 `calm absorbed expression…` 相隔 |
| P8 | **孤立句子**：`She is photographed within the scene's ambient light.` 單獨成行，與其前後都沒有連接 | Z | 範例第 4 行 |
| P9 | **內容權重失衡**：人物與服裝是最重要的資訊，但 Z-Image 排在場景、姿勢、光線、機位之後 | Z | 人物與服裝合計約佔全文 60% 字數，卻排在第 5–6 段 |
| P10 | **GPT 小標題名稱與內容不符**：`Pose and Composition` 段落只有姿勢，構圖已在 `Composition` | GPT、胸上 | 範例 |
| P11 | **全身角色照不含姿勢與場景**：這是核准設計（固定站姿 9:16），不算問題 | 全身 | — |

## 3. 判斷

- **Z-Image 的同場段落（場景→姿勢→光線→機位在最前）是 2026-10-01 使用者核准的設計**（[z-image-on-location-capture-v1.md](../../specs/z-image-on-location-capture-v1.md)）；規格寫明「外部影像驗收待測」。P1、P8、P9 都是這個設計的副作用，需要你重新決定要不要保留。
- P2、P3、P4、P5 是跨輸出共用的來源問題，不是 Z 專屬。
- P2（修飾語在名詞前）影響最大：它會讓模型把「褲腰、版型、下擺」套錯衣物，也與你昨天看到的外套雙肩露出問題同屬一類（修飾語與衣物脫節、關鍵描述被埋）。

## 4. 建議的處理順序（待 Cooper 決定）

1. P2＋P3：服裝內部改成「顏色＋衣物名稱 → 版型 → 穿法細節」，並修正 shorts／pants 這類來源矛盾。範圍最大，影響所有輸出，需要同 seed 比對與分輸出逐步做。
2. P5、P4：把臉與頸部配件合併成「戴著…」句，不再獨立抽出顏色；肚臍環併進同一組配件。
3. Z-Image 順序（P1、P6、P7、P8、P9）：先在實測前提下比較兩種版本再決定，不先改。
4. P10：GPT 小標題改名。

## 5. 第 2 項設計草案：配件合併與重複句清理（2026-10-23，待 Cooper 確認，尚未動程式）

Cooper 2026-10-23 補充原則：**六組都要調整（MJ 本身沒問題可不動）；不要因為組裝而出現重複或類似的句子。** 樣本見 [sample-accessories.txt](sample-accessories.txt)（鎖定眼鏡、耳環、頸圈、鼻釘、唇環、棒球帽、腰帶）。

### 5.1 目前的配件組裝問題

| # | 問題 | 輸出 | 例子 |
| --- | --- | --- | --- |
| A1 | 眼鏡顏色與款式被拆開，句子變成 `woman with black frame, bold thick-frame glasses` | GPT、Z、Nano | 懸空片語 |
| A2 | 眼鏡款式後面又接配戴方式，且與款式語意重複 | GPT、Nano | `…glasses, worn normally on the face, lenses aligned over the eyes` |
| A3 | 帽子單獨一句、沒有動詞（GPT）；塞在體態數字之後（Z）；變成第二個 `She wears`（Nano） | GPT、Z、Nano | `Baseball cap, curved brim, …`；`She wears baseball cap…` 與 `She wears neon yellow…` 並存 |
| A4 | 臉頸配件掛在 `The subject is … woman with …`，帽子在另一處，腰帶與肚臍環又在服裝 | GPT、Z、Nano | 同一個人的配件散在三處 |
| A5 | 填充詞：`subtle understated jewelry styling`、`subtle close-fitting neck accent` | GPT、Nano（Z 部分保留） | 屬目錄來源文字 |

### 5.2 目前的重複或類似句子（組裝造成）

| # | 位置 | 例子 | 建議 |
| --- | --- | --- | --- |
| D1 | Z 的機位 | `rear-right three-quarter view` 之後又接 `Photographed from the woman's rear-right side. … forming a rear-right three-quarter silhouette.` | 保留一次（保留幾何描述，刪第一次方位）— 屬第 3 項（Z-Image 順序）一併處理 |
| D2 | Nano 的表情 | `Her expression is delicate innocent expression` | 去掉重複的 expression |
| D3 | Nano 的服裝 | 兩個 `She wears`（帽子、衣服） | 合併成一個配件句 |
| D4 | Z 的環境光 | `She is photographed within the scene's ambient light.` 與光線句語意重疊 | 屬第 3 項 |
| D5 | GPT／Nano 的眼鏡配戴 | 見 A2 | 見 §5.3 |

### 5.3 建議做法（分兩層，GPT 受「完整保留」規則限制）

1. **結構層（六組都做，MJ 已是精簡句，不動）**
   - 臉、頭、頸部配件合成**一句**：`She wears <帽子>, <眼鏡>, <耳環>, <鼻釘與唇環>, <頸圈>, <耳機>`，放在人物段落、身份句之後、體態之前；不再用 `woman with …` 掛在身份句上。
   - 眼鏡改成「名稱在前、顏色與配戴跟在後」：`bold thick-frame glasses, black frame, worn normally on the face`（比照第 1 項的衣物名稱在前）。
   - 腰帶與肚臍環等身體飾品維持在服裝，並接在同一個服裝句內，不另開 `She wears`。
   - 臉特寫與頭肩景別仍只保留臉部可見的配件（沿用既有可見性規則）。
2. **用字層**
   - GPT：只重組與刪除完全相同的片語（Cooper 既有規則：GPT 完整保留所選英文）。因此 `worn normally on the face, lenses aligned over the eyes`、`subtle understated jewelry styling` 這類目錄文字在 GPT 保留；要不要改目錄文字是另一個決定。
   - Z／Nano：可依「來源可追溯的縮減」處理，刪掉 `subtle … styling`、`worn normally on the face` 這類填充，不新增任何視覺事實。
3. **衝突規則不變**：頭戴式耳機與帽子衝突時仍省略耳機（實測確認是既有行為）。

### 5.4 影響範圍與驗證

- 影響所有有配件的 GPT、Z、Nano、胸上、全身角色照；MJ 不變。選擇快照與抽選不變。
- 同第 1 項做法：凍結基準用測試專用開關保留舊結構；新增測試擋住 `woman with <顏色>,`、第二個 `She wears`、`expression … expression`。
- 以子句集合比對確認沒有任何配件子句遺失或新增（GPT），Z／Nano 的刪減項逐項列出。

### 5.5 待決

1. 配件合成一句、放在人物段落身份句之後，可以嗎？（替代：放進服裝段落，但臉特寫會看不到）
2. Z／Nano 要不要刪填充詞（`subtle understated jewelry styling` 等）？GPT 維持完整保留。
3. 目錄文字是否也要整理（填充詞、`worn normally on the face…`）？建議之後另案。
