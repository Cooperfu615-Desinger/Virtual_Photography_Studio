# 五官全無時預設日本族裔 v1

- 狀態：已實作（2026-10-17，分支 `claude/ethnicity-default-japanese`）
- 決策：[2026-10-17 預設日本族裔](../decisions/2026-10-17-default-japanese-ethnicity.md)
- 取代：[官方規範修正 v1](prompt-official-fixes-v1.md) §5 中「五官選『全無』時不指定族裔」這一條。其餘 2026-10-14 規則（主體句不寫族裔、五官承接族裔）不變。

## 1. 為什麼

2026-10-17 手部實驗中，五官全無的圖族裔不一致：GPT 條件 A0 畫成西方臉、條件 A 畫成東亞臉，Z-Image 14 張多為西方臉（[實驗結果 §3](../reports/pose-hand-experiment-2026-10-17/results.md)）。Cooper 決定全無改為預設日本。

## 2. 規則

適用範圍：**一般主體**，也就是不是角色卡、不是專屬特殊主體（骷髏、武士、騎士、人形機器人等）、沒有自訂身份 prompt、也不是附圖參考人物預覽。

| 情況 | 輸出 |
| --- | --- |
| 單人，五官全無 | 主體句的 `adult woman` 改為 `adult Japanese woman` |
| 雙人，兩人五官都全無 | 共用句的 `adult women` 改為 `adult Japanese women` |
| 雙人，只有一人全無 | 共用句不變；全無的那一位加上 `Japanese facial features` |
| 有選五官（含混血立體臉） | 不變，族裔由五官本身承接 |
| 角色卡、特殊主體、自訂身份、附圖參考預覽 | 不變 |

各輸出的實際句子（單人）：

| 輸出 | 句子 |
| --- | --- |
| GPT／Nano／胸上／全身角色照 | `The subject is one 20-year-old adult Japanese woman.` |
| Z-Image | `A 20-year-old seductive stunning adult Japanese woman.` |
| 主 MJ | `A 20-year-old adult Japanese woman.` |

雙人只有一人全無時，該位置的寫法：GPT `Woman 2:` 區塊的 `Has Japanese facial features, …`；Z-Image `Woman 2 has …, Japanese facial features`；MJ 與 Nano `The second woman has Japanese facial features, …`。

## 3. 實作與相容

- 規則集中在 `webapp/src/lib/engine/defaultEthnicity.js`：`resolveDefaultEthnicity` 判斷狀態，`applyDefaultEthnicity` 改主體句，`applyDefaultEthnicityToCharacter` 產生只供渲染用的角色清單。
- **只在渲染時套用。** 選擇快照、`structured.Character`、摘要、Saved Cards 都保留原本的「全無」，不寫入合成的五官項目。舊卡片還原後會依新規則重新渲染。
- 文字匯入：`one 20-year-old adult Japanese woman`、`two 20-year-old adult Japanese women` 已加入人數選項的 `legacyPromptAliases`，人數仍可辨識；`Japanese facial features` 不會被誤判為日系清透臉或甜美可愛臉（有測試）。
- 沒有新增隨機抽選，同 seed 的選擇結果不變。

## 4. 驗證

- 新測試 `webapp/src/lib/engine/defaultEthnicity.test.js`（9 項）：判斷規則、單人六輸出、有選五官／混血／角色卡／特殊主體／自訂身份不變、雙人兩種情況、儲存資料不變、文字匯入、附圖參考預覽、反函數精確度。
- 既有凍結基準：測試用反函數 `defaultEthnicityTestSupport.js` 的 `restorePreDefaultEthnicityText` 只移除本次插入的文字，已接進 `restorePreEthnicityText`，凍結雜湊一律不重算。
- 全輸出比對（同 seed）：304 組中 170 組、1,014 個欄位有變動，套用反函數後與修改前逐字相同；另外 72 組「雙人一人全無」× 4 輸出共 288 個欄位，反函數還原後也與未修改的引擎逐字相同。Nano 臉部 fixture 中一側全無的 13 組，正規化文字還原後也逐字相同。
- 閘門（2026-10-18）：`npm test` 1653/1653（連跑 2 次）、`npm run test:prompt-quality` 721/721、lint、build、同 seed 200 筆 strict audit（exit 0，問題摘要與修改前相同，只有長度統計因多一個字而微增）、`sync_to_json.py --check`、Python 2/2、公開資產檢查、`git diff --check` 全數通過。
- 瀏覽器（1440×1000、390×900）：單人全無六張卡都出現日本預設、選五官後消失；雙人兩人全無、一人全無皆正確；Saved Cards 存入後選擇仍是全無、沒有合成項目，套用還原後重新渲染正確；五個工作區無水平溢出、無破圖、主控台無錯誤。

### 測試撰寫注意

五官沒鎖定、又沒固定 seed 的測試，可能抽到全無而出現日本預設。斷言主體句時用 `expectedSubjectText(prompt, …)`，不要寫死舊句。以 `indexOf(主體句) < indexOf(…)` 比較順序時，必須先確認主體句存在，否則找不到時的 `-1` 會讓斷言默默成立。

## 5. 重做方式

要調整預設族裔或句子時：
1. 改 `defaultEthnicity.js` 的 `DEFAULT_ETHNICITY`／`DEFAULT_ROLE_FACE_TEXT`。
2. 同步更新 `defaultEthnicityTestSupport.js` 的反函數與 `DEFAULT_ETHNICITY_ADDED_ALIASES`，以及人數選項的 `legacyPromptAliases`。
3. 跑 `node --test src/lib/engine/defaultEthnicity.test.js`、`npm test`、`npm run test:prompt-quality`、同 seed strict audit。
