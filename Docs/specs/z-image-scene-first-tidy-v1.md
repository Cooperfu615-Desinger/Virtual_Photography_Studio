# Z-Image 同場段落整理 v1（版本 C）

- 狀態：**已實作**（2026-10-23）。Cooper 2026-10-23 選定版本 C：場景在前的順序不變，開頭補主體，並讓每個事實只說一次。比較稿見 [versions.md](../reports/z-image-order-versions-2026-10-23/versions.md)；問題來源見 [結構檢視](../reports/prompt-structure-review-2026-10-23/review.md)。
- 範圍：一般單人與三組日本車廂的主 Z-Image 同場拍攝段落（[z-image-on-location-capture-v1](z-image-on-location-capture-v1.md)）。GPT、MJ、Nano、胸上、全身角色照、雙人、特殊主體、角色卡路徑不動。

## 1. 四項改動（只在同場段落啟用時）

| # | 改動 | 前 | 後 |
| --- | --- | --- | --- |
| E1 | 開頭補主體 | `Photorealistic editorial portrait.` | `Photorealistic editorial portrait of one young adult woman.`（僅寫實攝影預設開頭；其他影像類型開頭不變） |
| E2 | 機位標籤去重 | `…, eye-level view, rear-right three-quarter view. … Photographed from the woman's rear-right side.` | 幾何句已寫明方位時，刪掉前面的方位標籤（`eye-level view` 這類角度標籤保留） |
| E3 | 環境光句併入光線句 | 獨立一行 `She is photographed within the scene's ambient light.` | 併到光線句尾：`…shadows; she is photographed within the scene's ambient light.`（沒有光線句可併時維持獨立一行） |
| E4 | 姿勢句與側面幾何句不重複 `She stands` | `She stands in a relaxed neutral posture.` … `She stands completely sideways, facing…` | 幾何句改用既有的 `She is positioned completely sideways, facing…`（只在有姿勢句時） |

沒有新增任何視覺事實；E1 的 `one young adult woman` 只是用既有的主體描述（成年女性）說明代名詞指誰。

## 2. 沒做的

- **E5（人物與服裝排在後面）不改**：場景在前是 2026-10-01 核准的設計；版本 B（主體在前）留作實測對照，等實測結果再重新評估。
- 沒有同場段落（缺場景或缺姿勢）的路徑維持原結構與原開頭。

## 3. 驗證

- 600 組（四景別 × 150 種組合，含 8 種環繞）：選擇快照逐筆相同；GPT、MJ、Nano、胸上、全身角色照逐字相同，只有 Z-Image 改變。詞級比對：Z 少的只有方位標籤字詞（`view`、`three-quarter`、`front`、`rear-right`…）與一個 `stands`；多的只有 `of one young adult woman` 與 `is positioned`。
- 輸出快照（1642 組）：767 組改變，全部只有 Z-Image 欄位。
- strict audit 與 main 完全相同；`npm test` 1802/1802（連跑 2 次）、Prompt Quality 745/745、lint、build、sync、Python、公開資產、diff-check。
- 公開輸出契約升為 `1.63.0`：Z-Image 單人開頭接受 `Photorealistic editorial portrait of one young adult woman.`。
- 凍結基準測試用同一個測試專用開關 `setLegacyWardrobeModifierOrderForTests(true)`（現在也涵蓋 Z 同場整理），新增 promptOutputContracts 以外的 8 個檔案；不覆蓋任何基準。更新的舊斷言：Z 開頭、`She stands completely sideways` 兩處、後視圖標籤一處。
- 新測試 [zImageSceneFirstTidy.test.js](../../webapp/src/lib/engine/zImageSceneFirstTidy.test.js) 7 項（含純函式 `tidyZImageCaptureSources`）。

## 4. 已知與待辦

- Z-Image 現在開頭 `of one young adult woman` 與人物段落的 `A 20-year-old … woman` 都說到她是誰；前者只用於讓代名詞有指涉，若之後認為重複，可再改成其他寫法。
- 實際出圖驗證尚未做；Cooper 會用 A（舊）與 C（新）對照，並建議加跑 B 當主體在前的對照。
