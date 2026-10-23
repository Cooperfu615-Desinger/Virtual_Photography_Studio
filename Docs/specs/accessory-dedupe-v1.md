# 隨機配件去重 v1

- 狀態：**已實作**（2026-10-23）。Cooper 2026-10-23：照建議，先處理「隨機配件不重複套裝已含物件」。這是「不要因為組裝出現重複或類似句子」原則的第一個實作。

## 1. 問題

套裝或已選衣物本來就包含某個配件（例如套裝 `網狀蕾絲馬甲短裙長靴` 內建 `lace ribbon choker`、`punk gothic waist belt`；休閒套裝已有 `black chunky Mary Jane shoes`），隨機配件又抽到同一個物件，輸出就寫了兩次。1500 組樣本中 9 組（0.6%）出現，也是 `enginePromptDeduplication.test.js` 偶爾失敗的原因。

## 2. 規則

- 只作用於**隨機抽選**（未鎖定）的頭部配件、耳環、頸部配件、腰部配件、襪類、鞋款。
- 以配件名稱（第一個子句，去掉結尾的 `detail／accent／styling`，至少兩個單字，例如 `lace ribbon choker`）比對已放入的所有衣物與配件文字；已經出現就從其餘候選重抽，沒有其餘候選就不放。
- **只在重複發生時多抽一次亂數**；其他情況的抽選結果與亂數串完全不變。
- 使用者鎖定的配件一律保留，即使套裝已含同一物件（不替使用者做決定）。
- 比對用英文名稱，不新增任何視覺內容。

## 3. 驗證

- 1500 組套裝樣本：choker／belt 重複 9 → 0（GPT、Z-Image 都是）。
- 2500 組隨機穿搭，檢查輸出中完全相同的 3 字以上子句：重複的組數 6 → 5；剩下的見 §4。
- 3000 組隨機（全身、中景各 1500）：8 組（0.27%）改變，全部落在配件或鞋款類別（連動的顏色是亂數位移的結果），其餘逐字相同。
- 輸出快照（1642 組）：42 組改變，全部在「隨機 200 組」，且它們共用一條亂數串，第一個重複事件（`rnd:158`，舊輸出同時有 `black chunky Mary Jane shoes` 與 `Neon red mary jane shoes`）之後的樣本因亂數位移而變，其他群組逐字相同。
- strict audit 與 main 相同；`npm test` 1795/1795（連跑 2 次）、Prompt Quality 745/745、lint、build、sync、Python、公開資產、diff-check。
- 新測試 [accessoryDedupe.test.js](../../webapp/src/lib/engine/accessoryDedupe.test.js)：600 個 seed 的套裝樣本不重複；鎖定的配件仍被保留。測試在改動前的 main 上失敗，改動後通過。

## 4. 已知與待辦（同一原則下仍存在的重複）

| 項目 | 例子 | 頻率（2500 組） | 建議 |
| --- | --- | --- | --- |
| 兩件衣物都帶完整的顏色／材質描述 | `finished in mirror-chrome silver with a highly polished scene-reflective surface and crisp environment reflections`（上衣與下身各寫一次） | 3 組 | 顏色組句規則：同一段服裝句內相同的顏色描述只寫一次，或第二件改成「同樣的…」 |
| 兩件衣物帶相同的圖案描述 | `wide stripe bands`、`and clearly separated random colors` | 2 組 | 同上 |

兩者頻率很低（約 0.2%），機制不同（顏色組句，不是抽選），需要另案決定寫法（會動到顏色描述的文字結構）。
