# 2026-10-18 落肩 T 恤英文改寫：決策紀錄

## 背景

手部實驗兩輪中，Z-Image 都把落肩 T 恤畫成露肩上衣（第二輪 4／4），原因是英文 `dropped-shoulder t-shirt, … low shoulder seam` 兩處都在描述肩線被拉低。GPT、MJ、Nano 沒有這個問題。證據見 `Docs/reports/pose-hand-experiment-2026-10-17/results.md`（主 checkout，未提交）。

## Cooper 的決定

| 項目 | 決定 |
| --- | --- |
| 落肩 T 恤英文 | 改寫，不再提肩線 |
| 寫法方向 | 第一次選「寬鬆圓領」（`oversized crew-neck t-shirt, … loose boxy fit`） |
| 與「版型」選項衝突 | 實作時發現 `oversized`／`loose boxy fit` 會和緊身、合身、短版矛盾，選 oversize 時字眼重複；Cooper 改選「拿掉寬鬆字眼，版型交給選項」 |
| MJ 比例 | 第二輪 MJ 圖實際用 9:16（Cooper 手動調整） |
| Z-Image 赤腳 | 不處理（鞋款全無時沒問題） |

## 最終寫法

| 位置 | 舊 | 新 |
| --- | --- | --- |
| 目錄共用英文 | `dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion` | `crew-neck t-shirt, washed cotton jersey, relaxed upper-body proportion` |
| 下胸線版本 | `dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam` | `crew-neck t-shirt, washed cotton jersey` |
| MJ 品名 | `dropped-shoulder t-shirt` | `crew-neck t-shirt` |

ID `wardrobe:上身-tops:落肩-t-恤:5` 與中文名稱「落肩 T 恤」不變；兩段舊英文加入 `legacyPromptAliases`，舊卡片文字仍可匯入。

## 實作時自行決定的技術細節

| 決定 | 理由 |
| --- | --- |
| 保留 MJ 詞庫的連帶效果：特殊穿搭「菱格背心黑寬短褲長襪造型」主 MJ 由 `a T-shirt` 變成 `a crew-neck T-shirt`（Cooper 2026-10-18 確認保留） | MJ 品名同時是擷取詞庫；新品名讓原文的 `white crew-neck T-shirt` 保留完整名稱，更貼近原文；只影響這一套的主 MJ |
| 中文說明 `desc`（「以低肩線、寬鬆袖根…」）未改 | 屬 UI 文案，未授權；與新英文略不一致，列為待決 |
| 凍結基準用精確反函數 `crewNeckTeeTestSupport.js`，接進 `restorePreEthnicityText` | 依專案慣例不重算雜湊 |

## 放棄的方案

| 方案 | 放棄原因 |
| --- | --- |
| 保留 `dropped-shoulder`，加 `both shoulders covered` | Cooper 選擇不提肩線 |
| `oversized crew-neck … loose boxy fit` | 與「版型」選項矛盾 |

## 驗證

- 同 seed 370 組輸出（304 組代表性與隨機＋66 組落肩 T 恤定向）：264 個欄位變動，套用反函數後逐字相同，選擇快照 0 變動。
- 新測試 `webapp/src/lib/engine/crewNeckTee.test.js`（7 項）。
- `npm test` 1651/1651（連跑 2 次）、Prompt Quality 721/721、lint、build、同 seed strict audit（問題摘要不變）、sync check、Python、公開資產、diff-check。
- 瀏覽器 1440×1000、390×900：六張卡都是新寫法、無舊字眼；Saved Cards 存入保留原 ID、還原後新寫法；五個工作區無溢出、無破圖、主控台無錯誤。

## 待決

1. 中文說明 `desc` 是否同步改寫（目前仍寫「低肩線、寬鬆袖根」）。
2. 用新寫法在 Z-Image 補測，確認不再露肩。
