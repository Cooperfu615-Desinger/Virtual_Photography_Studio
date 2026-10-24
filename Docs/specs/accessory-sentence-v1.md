# 配件合成一句 v1

- 狀態：**已實作**（2026-10-23）。Cooper 2026-10-23：照 [結構檢視 §5–§6](../reports/prompt-structure-review-2026-10-23/review.md) 的建議（C1–C10），六組都要調整、MJ 本身沒問題不動、不要因為組裝出現重複或類似的句子。
- 範圍：一般單人（非特殊主體、非角色卡）的頭部、臉部、頸部配件。雙人、特殊主體、角色卡路徑維持原寫法。

## 1. 新結構

| 輸出 | 寫法 |
| --- | --- |
| 主 GPT、胸上、全身角色照 | Subject 段：`The subject is … woman. She wears <配件>.`，緊接身份句之後；GPT 完整保留所選英文，只重組與刪除完全相同的片語 |
| 主 Z-Image | 人物段落最後一句：`She wears <配件>.`（體態、臉、髮、表情的逗號鏈照舊，不再被配件夾斷） |
| 主 Nano | 人物段落內一句 `She wears <配件>.`，取代「`woman with …` 加 `She wears <帽子>`」兩處 |
| 主 MJ | 不變 |

- 配件順序：頭部配件（帽子）→ 眼鏡 → 耳環 → 耳機 → 面罩 → 鼻釘 → 唇環 → 頸部配件。
- 項目之間用分號（各項目自帶逗號，用分號才分得清邊界），最後一項前加 `and`。
- 眼鏡「名稱在前、顏色與配戴在後」：`bold thick-frame glasses, black frame, worn normally on the face…`（原為 `black frame, bold thick-frame glasses`）。
- 帽子成為同一句的一項，不再是 GPT 的無主語單獨片語、Z 夾在體態數字之後、Nano 的第二個 `She wears`。
- Z 與 Nano 另外：刪除填充子句（`subtle … accent／styling／detail`、`understated … styling`）、刪除預設配戴方式 `worn normally on the face, lenses aligned over the eyes`；使用者選了其他配戴方式（例如戴在頭頂）時保留。GPT 不刪（完整保留所選英文，核准取捨）。
- Nano 的表情句：`Her expression is X expression, …` 改成 `She has a X expression, …`，去掉重複的 expression；沒有 expression 字樣的值維持 `Her expression is …`。
- 臉部特寫（face detail）仍不寫帽子（原本就如此）；臉與頸部配件仍寫。

## 2. 官方規範對照

見 [review.md §6](../reports/prompt-structure-review-2026-10-23/review.md)：C1、C2、C4 與 Z 稽核 §4.2／§4.5、Nano F3 方向一致；C3、C5、C7、C10 為專案自訂；C8（GPT 不刪冗詞）為核准取捨。

## 3. 驗證

- 480 組隨機鎖定矩陣（四個景別、配件鍵 60% 機率鎖定）：選擇快照逐筆相同；主 MJ 逐字相同。
- 輸出快照（1642 組）：主 MJ、選擇快照、生成摘要皆不變；GPT、Z、胸上、全身角色照各 993 組、Nano 1399 組改變。
- 詞級比對：GPT 與胸上**沒有任何單字遺失或新增**（扣除 `with／and／She／wears` 連接語）；Z 只少了填充詞（`subtle`、`accent`、`styling`、`understated`…）；Nano 另少了預設配戴方式與重複的 `expression`。
- strict audit 與 main 相同（只有字數平均差 0.5 字：GPT 與胸上多一個 `She wears`、Z 因刪填充詞變短）。
- `npm test` 1793/1793（連跑 2 次）、Prompt Quality 745/745、lint、build、sync、Python、公開資產、diff-check。
- 凍結基準測試用同一個測試專用開關 `setLegacyWardrobeModifierOrderForTests(true)`（現在涵蓋服裝順序、雙肩句與配件結構），新增 `nanoBananaPrompt.test.js`、`shirtBlackBottom.test.js`；不覆蓋任何基準。
- 新測試：[accessorySentence.test.js](../../webapp/src/lib/engine/accessorySentence.test.js) 6 項。更新的舊斷言：眼鏡、配件綁定、完整保留、全身角色照與 Z 服裝句（`She wears` 取最後一個，因為配件句在前）。

## 4. 已知與待辦

- **C6（腰帶、肚臍環併進服裝句）沒有做**：GPT 的 Wardrobe 段本來就是每件衣物各成一句（`Cyan western boots, …. Decorative slim leather waist belt, …`），Z 與 Nano 已用逗號併進同一個 `She wears` 句。把 GPT 改成逗號串接屬 GPT 整段排版變更，風險大，需要你決定。
- Subject 段與 Wardrobe 段各有一個 `She wears …`（GPT、Z、Nano）。分屬不同段落或段落，但句型相同；若要避免，可把配件句的開頭換成別的連接語（壓縮指南允許的連接語只有 `with`、`and`、`She wears`，需先擴充規範）。
- **既有的重複來源**：套裝內建的配件與隨機配件重複，例如套裝已有 `lace ribbon choker`、`punk gothic waist belt`，隨機頸部或腰部配件又抽到同一件。1500 組樣本中 9 組（0.6%）出現，改動前後相同；`enginePromptDeduplication.test.js` 偶爾因此失敗。建議之後加一條「隨機配件不重複套裝已含物件」的規則。
- 頭戴式耳機與帽子衝突時省略耳機（既有行為，不動）。
