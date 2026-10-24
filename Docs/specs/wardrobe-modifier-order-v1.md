# 服裝描述順序 v1：衣物名稱在前

- 狀態：**已實作**（2026-10-23）。Cooper 2026-10-23：照 [六組 Prompt 組成結構檢視](../reports/prompt-structure-review-2026-10-23/review.md) 建議，先處理第 1 項。
- 範圍：上衣與下身（含雙人各自）的單件描述順序；雙肩露出的輸出句；`pants waist` 用字。其餘衣物（連身、套裝、外套本體、鞋、配件）本來就是名稱在前，不動。

## 1. 問題

| 位置 | 舊順序 | 問題 |
| --- | --- | --- |
| 上衣 | 版型 → 穿法 → 衣物名稱 → 圖案 | 版型與穿法夾在 `She wears` 與衣物名稱之間，修飾語與衣物脫節 |
| 下身 | 褲腰 → 版型 → 衣物名稱 → 圖案 | 同上；例：`pants waist button undone…, light blue denim shorts` |
| 外套套在內搭上 | `layered over` 接在內搭第一個子句 | 因為內搭的版型排在最前，變成 `layered over tight body-skimming upper-body fit`（外套套在「版型」上） |
| 解開褲頭 | `pants waist button undone…` | 套用到短褲時詞不對 |
| 雙肩露出 | `…both shoulders fully uncovered…` | 內搭有袖時模型把 T 恤改成無袖（2026-10-22 實測 Qwen／Grok） |

## 2. 新順序

- 上衣：衣物名稱（含顏色與自身細節）→ 版型 → 穿法 → 圖案。下擺類穿法維持在圖案之後。
- 下身：衣物名稱 → 褲腰（rise）→ 版型 → 圖案。
- `layered over` 因此接到內搭的衣物名稱。
- 解開褲頭：`waist button undone and front zipper slightly lowered, relaxed loosened waistband styling, still worn securely on the hips`（拿掉 `pants`）。
- 雙肩露出輸出句：`slid down off both shoulders and hanging around both upper arms, both arms still in the sleeves`。**目錄原文（`knowledge_base`、資料庫、`engine` 的選項 `en`）刻意保持不變**，避免動到結構化資料與已保存卡片；輸出 Prompt 使用引擎常數 `OUTERWEAR_DOUBLE_SHOULDER_STYLING_TEXT`。

## 3. 影響與驗證

- 選擇快照、抽選、亂數次數不變。全身鏡頭其餘文字不變；只有「有上衣或下身版型、穿法、褲腰、圖案」的 Prompt 文字順序改變，`She wears` 現在接在衣物名稱前。
- 隨機穿搭鎖定矩陣（480 組，四個景別）：選擇快照逐筆相同；GPT、Z-Image、Nano、胸上共 700+ 筆文字改變，經子句比對全部只是順序、`layered over` 對象、`pants waist`、`She wears` 位置的改變，沒有任何子句遺失或新增。主 MJ 不變。
- 代表性輸出快照（`dump_prompt_outputs.mjs`，1642 組）：41 組改變（fixture 8、隨機 5、動作 23、全部隨機 5），其餘 1601 組逐字相同；41 組逐一以子句比對，扣除 `layered over` 對象、`pants waist`、雙肩句與 `She wears` 位置後全部相同。
- strict audit 與 main 相同（只有字數統計差 1 字）；`npm test` 1787/1787（連跑 2 次）、Prompt Quality 745/745、lint、build、sync、Python、公開資產、diff-check。
- 凍結基準（Z 同場拍攝、場景整合、GPT 可見性、相機空間、近距蟲眼、環境光、MJ 自然、Z 上身場景等 11 個測試檔）以測試專用開關 `setLegacyWardrobeModifierOrderForTests(true)` 維持舊順序與舊雙肩句，確保它們繼續保護其他每一個位元組；不覆蓋任何凍結基準。
- 回歸測試：[wardrobeModifierOrder.test.js](../../webapp/src/lib/engine/wardrobeModifierOrder.test.js)；更新的順序測試在 `engineWardrobeControls.test.js`、`enginePromptPipeline.test.js`。

## 4. 已知與待辦

- Z-Image 現有壓縮會丟掉部分版型與褲腰子句（本次沒改）；衣物名稱現在在最前面，所以被保留的是名稱，而不是版型。
- 胸上輸出的外套與內搭用句號分開（`…front.` `Tiffany aqua shirt…`），沒有 `layered over`，這是既有行為，本次不動。
- 實際出圖驗證尚未做；Cooper 會用外套雙肩露出的 V2／V3 測試版本實測。
- 其餘檢視項目：[review.md §4](../reports/prompt-structure-review-2026-10-23/review.md)。
