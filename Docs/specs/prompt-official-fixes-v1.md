# 官方規範修正 v1

- 狀態：第 1–5 組已完成並驗證（分支 `claude/prompt-official-fixes`，基於 `main` @ `468edac`）
- 依據：[七種 Prompt 輸出 × 官方規範檢視報告](../reports/prompt-official-review-2026-10-13/README.md)
- Cooper 核准（2026-10-14）：
  1. 修正文法與標點，招牌文字加引號。
  2. MJ 依景別自動帶入比例。
  3. 完全移除 MJ 胸上特寫。
  4. 全身角色照帶回體態（素色背景、中性表情維持現況，不新增）。
  5. 主體句移除族裔，改為「20 歲成年女性」；族裔改由五官特徵承接。五官選「全無」時不指定族裔；甜美可愛、冷感高級、成熟性感各自指定日系或韓系。角色卡的成年身份句這次不動。
  6. Z-Image 長度：Comfy Cloud 的 ComfyUI 不截斷（原始碼 tokenizer 上限 99,999,999），不處理。
- 決策紀錄：[2026-10-14 官方規範修正](../decisions/2026-10-14-prompt-official-fixes.md)

每一組都依 AGENTS.md 執行：先存全輸出基準（代表性 fixtures＋200 組固定 seed 隨機組合，共 304 筆），修改後逐字比對，證明差異只出現在預期位置；凍結基準採「精確反向函式」或「由舊值轉換」更新，不直接用新輸出覆蓋。

---

## 1. 文法與標點（已完成）

### 範圍

新增 `webapp/src/lib/engine/publicPromptPolish.js` 的 `polishPublicPromptText()`，在 `buildPrompts` 出口套用到所有公開輸出。只做四件事：

| 規則 | 前 | 後 |
| --- | --- | --- |
| 句號接逗號 | `where visible., soft` | `where visible, soft` |
| 穿搭開頭多餘逗號 | `She wears, black t-shirt` | `She wears black t-shirt` |
| 比例句後的景別大寫 | `aspect ratio, Chest-up portrait` | `aspect ratio, chest-up portrait` |
| 句首小寫 | `line. dark blue jeans` | `line. Dark blue jeans` |

句首大寫的例外：`adidas`（品牌小寫）、`f/`（光圈）、`iphone`。只增減標點與大小寫，不增刪任何視覺內容；函式具冪等性。

不做的事：補冠詞（`wears white top` → `wears a white top`）需要處理單複數與不可數名詞，風險高，這次不做。

### 驗證

- 304 筆全輸出中有 1,344 個欄位變動；轉小寫並套同一規則後，與修改前**完全相同**（0 個內容差異）。
- `.,` 有 817 處，全部出在 Nano Banana（串接函式把已帶句號的片段用逗號接起）。
- 凍結基準：文字基準 6 個由 `polishPublicPromptText(舊值)` 轉換；雜湊基準 21 處共 4,077 組，每組先證明只差標點大小寫再重算；6 個測試輔助反向函式改為辨識句首大寫；76 條斷言改寫。
- 一支沒有固定 seed 的測試（`engineOutfitPresetDressCleanup.test.js:831`）在本分支 10 次失敗 3 次、未修改的 `main` 20 次 0 次：原因是隨機外套句後的穿搭句首被正確大寫，斷言寫死小寫。已改為接受句首大寫。
- 已知不穩定測試 `enginePromptPipeline.test.js:934`（雙人，沒有固定 seed）在未修改的 `main` 上 20 次失敗 4 次，與本次無關，未修改。

## 1b. 招牌文字加引號（已完成）

- 澀谷站前廣場：`carrying TSUTAYA and STARBUCKS signage` → `carrying "TSUTAYA" and "STARBUCKS" signage`。改在 canonical Markdown，並同步 Z-Image 場景 overlay 的原文 pin。
- 相容：剛被取代的未加引號原文，加入 `LOCATION_LEGACY_PROMPT_ALIASES`，舊 Saved Cards 文字仍可匯入。
- 驗證：只有澀谷 fixture 的 6 個輸出變動，差異恰為加引號；凍結測試以精確反向函式 `restoreUnquotedShibuyaSignage`（還原引號並移除新增的那一筆別名）比對，舊雜湊完全一致。
- 不改：套裝「亮面膠帶束帶」上的 `CAUTION` 是印刷字而非招牌，且 `engine.js` 有 3 處正規式綁定原文，列為可選後續。

## 2. MJ 依景別自動帶入比例（已完成）

### 規則

只有在 F 區「MJ 參數設定」的比例為「跟隨 PAGE1」**且** PAGE1 沒有比例時才生效；F 區明確設定的比例、PAGE1 的比例都優先於景別比例。

| 景別區塊 | 景別 | `--ar` |
| --- | --- | --- |
| faceDetail／headShoulders | 局部五官、臉部、半臉傾斜、全臉傾斜、特寫鏡頭 | 4:5 |
| chestUp | 胸上特寫、頭部主導近景 | 4:5 |
| mediumWaist | 中景鏡頭 | 3:4 |
| cowboyKnee | 牛仔中景 | 2:3 |
| fullBody | 全身鏡頭 | 2:3 |
| unconstrained | 景別全無 | 2:3 |
| fixedComposition | 固定構圖組 | 不帶入，沿用各組既有規則 |

實作：`midjourneyParameterTail.js` 的 `MIDJOURNEY_FRAMING_ASPECT_RATIO`、`midjourneyFramingAspectRatio()`；`buildPrompts` 傳入 `framingAspectRatio`。F 區參數說明文字同步補上這條規則。

### 相容

文字匯入（Saved Cards／Markdown）原本會把 MJ 尾綴的 `--ar` 同時寫回 PAGE1 比例與 F 區。現在若匯入的 `--ar` 等於「解析出的景別所對應的自動比例」，視為自動帶入：PAGE1 不設比例、F 區維持「跟隨 PAGE1」，重新生成的輸出相同。其他比例照舊還原。（`cardCodec.js`）

PR #3 review 修正：日本電車車廂 3 組固定構圖允許變換景別（`allowsFramingVariation`），生成時依景別帶入比例。`framingAspectRatioForSelection()` 改用與生成相同的判斷：只有不允許變換景別的固定構圖組才不帶入；即時調整 F 區後，車廂的 `--ar` 也會保留。車廂 prompt 從文字匯入時景別無法還原（既有限制），這時匯入的 `--ar` 只還原為 F 區的 MJ 比例，不寫入 PAGE1，避免 Nano 等輸出因 PAGE1 憑空多出比例而改變。

即時調整：在畫面上改動 F 區參數時（`midjourneyParameterState.js` 的 `attachMidjourneySettingsToPrompt`），會用 `framingAspectRatioForSelection()` 從 selection 重算景別比例，避免一改 stylize 等參數，自動帶入的 `--ar` 就消失。Saved Cards 匯入與即時調整共用這個函式。

### 驗證

- 294 份主 MJ 補上 `--ar`（2:3 有 129、4:5 有 107、3:4 有 58），其他輸出 0 變動；未補的 10 份全是固定構圖與車站組。
- 新測試 `midjourneyFramingAspectRatio.test.js`（7 項）：各景別比例、F 區優先、PAGE1 優先、固定構圖不帶入、匯入時自動比例回到「跟隨 PAGE1」、明確 16:9 仍還原、即時改 F 區參數後仍保留景別比例。
- 凍結雜湊以精確反向函式 `stripFramingDerivedMidjourneyRatio` 比對（只在「跟隨 PAGE1 且 PAGE1 無比例」時移除 `--ar`），舊雜湊完全一致。

## 3. 全身角色照帶回體態（已完成）

- 例外規則與位置見 [GPT 獨立體態省略 v1](gpt-standalone-body-omission-v1.md) 的「全身角色照例外」。
- 契約：`STANDALONE_BODY_TYPE_CONTRACT` 文字同步更新，版本 `2.1.0` → `2.2.0`。
- 驗證：只有全身角色照變動（206 份），全部是在 Subject 段插入體態來源。
- 測試：新增 `fullBodyCharacterBodyTestSupport.js`。其中 `assertFullBodyCharacterBody` 驗證體態恰好出現一次且位置正確；`assertFullBodyCharacterHasNoBody` 驗證「全無」與角色卡時不出現體態；`stripFullBodyCharacterBodySource` 是精確反向函式，用來比對凍結雜湊。MJ 自然精簡、Nano 382 組與 facial 1078 組的舊雜湊全部吻合，沒有重算任何雜湊。

## 4. 移除 MJ 胸上特寫（已完成）

### 移除範圍

| 位置 | 處理 |
| --- | --- |
| `engine.js` | 不再建立 MJ 胸上的 prompt model、不再渲染、不放入 `extraPrompts`；刪除它專用的 `renderMidjourneyFixedFramingPrompt` |
| `page1PromptOutputs.js` | 輸出卡片與 DLL 來源清單移除 |
| `midjourneyParameterState.js` | F 區即時更新只改主 MJ 尾綴 |
| `MidjourneyParameterControls.jsx` | F 區說明文字移除 MJ 胸上的部分 |
| `promptOutputContracts.js`、`midjourneyParameterContract.js`、`midjourneyDescriptionContract.js` | 移除它的輸出契約、受影響輸出清單，以及只作用於它的 `topSurfaceDesign` 規則 |
| `fixedFramingDerivedPrompt.js`、`fixedFramingDerivedPromptContract.js` | 移除 preset 與 4:5 比例設定 |
| `scripts/validate_prompt_logic.mjs` 及其測試 | audit 不再檢查這個輸出 |

### 相容

- 既有 Saved Cards 存的 MJ 胸上文字**保留不刪**，只是畫面不再顯示這一欄。
- 舊版精簡 AI 渲染器 `renderAiPrompt` 的最後一個呼叫者就是 MJ 胸上。整串清掉屬於大型重構，依 AGENTS.md 不與這次合併；目前以註明原因的 lint 例外保留，列為後續清理。

### 驗證

- 全輸出比對：唯一差異是這一欄消失（301 份），其他輸出逐字不變。
- 測試：新增 `mjChestUpRemoval.test.js`（4 項：契約已不存在、各模式與 40 個隨機 seed 都不產生、PAGE1 卡片與 DLL 來源不列出且舊資料保留、F 區即時更新只改主 MJ）。改用移除前的引擎跑，這 4 項全部失敗，證明確實有驗到移除。刪除 3 個主題就是 MJ 胸上的測試。
- 凍結基準：逐欄位基準 14 個 JSON 只刪除該欄；整體雜湊 7 個測試檔用移除前的程式碼快照實際重算舊值，1,208 組新舊對應全部證明「只少了 MJ 胸上那一筆」。

## 第 1–4 組整體驗收（2026-10-14）

| 項目 | 結果 |
| --- | --- |
| `npm test` | 1562/1562（另以完整快照連跑 2 次、未固定 seed 的 32 個測試檔各 10 次，除已知不穩定測試外無偶發失敗） |
| `npm run test:prompt-quality` | 698/698 |
| `npm run lint`、`npm run build` | 通過（build 僅既有的大型 chunk 提示） |
| 同 seed strict audit（200, `prompt-quality-baseline`） | exit 0，摘要與修改前相同 |
| `sync_to_json.py --check`、Python 單元測試、`check_public_assets.py`、`git diff --check` | 全部通過 |
| 全輸出總比對（最初基準 → 目前，304 筆） | 所有差異都能由第 1–4 組變更解釋，無法解釋的差異為 0 |

瀏覽器驗收（本機 `127.0.0.1:5176`，worktree 的開發伺服器）：

- 桌機 1440×1000：PAGE1 隨機生成後，輸出卡片與 DLL 來源都沒有 MJ 胸上，頁面上找不到「MJ 胸上」文字；牛仔中景的主 MJ 尾綴為 `--ar 2:3`；輸出中沒有 `.,`；F 區說明文字已更新。
- 即時把 F 區 stylize 從 25 改成 30：尾綴變成 `--s 30`，`--ar 2:3` 保留。
- Saved Cards：加入最愛 → 卡片只有 6 種輸出、沒有 MJ 胸上 → 套用回 PAGE1 → 景別還原、主 MJ 仍為 `--ar 2:3`。
- 六個工作區（Prompt Control Deck、Character Card Lab、Action Pose Lab、World Street Scene Builder、Observation Capture Lab、Saved Cards）在桌機與手機 390×900 都正常載入，頁寬等於視窗寬、沒有破圖。
- 兩種尺寸的主控台都沒有錯誤。

## 5. 族裔改由五官特徵承接（已完成）

Cooper 於 2026-10-14 確認文案。

### 主體句

| 輸出 | 舊 | 新 |
| --- | --- | --- |
| GPT／Nano／胸上／全身角色照（單人） | `one 20-year-old Japanese or Korean female portrait subject` | `one 20-year-old adult woman` |
| 同上（雙人） | `two 20-year-old Japanese or Korean female portrait subjects` | `two 20-year-old adult women` |
| Z（單人） | `A 20s seductive stunning Japanese or Korean woman` | `A 20-year-old seductive stunning adult woman` |
| Z（雙人） | `Two stunning seductive 20-year-old Japanese or Korean women` | `Two stunning seductive 20-year-old adult women` |
| 主 MJ（單人） | `A Japanese woman in her twenties` | `A 20-year-old adult woman` |
| 主 MJ（雙人） | `Two 20-year-old Japanese or Korean women` | `Two 20-year-old adult women` |
| 雙人開場句（6 種畫風） | `two stunning seductive 20-year-old Japanese or Korean women` | `two stunning seductive 20-year-old adult women` |

角色卡（`East Asian`）依 Cooper 決定不動；已無呼叫者的舊 AI 渲染器常數一併改寫，不影響任何輸出。

### 五官特徵

依 [撰寫指引 A 的「五官族裔」](character-section-a-authoring-guide.md)：韓系偶像臉、冷感高級臉、成熟性感臉 → Korean；日系清透臉、甜美可愛臉 → Japanese；混血立體臉不變；全無不指定。改動位置：共用 `en`（甜美、冷感、成熟 3 條）、`mj.face`（5 條）、Nano 五官描述（5 條）。

**表格之外的補充：** Nano 會用 `nanoBananaFacialFeatures.js` 的幾何描述取代五官原文，而這些描述原本都沒有族裔。為了落實「族裔由五官承接」，Nano 的 5 條描述依同一套分配補上族裔；否則主體句拿掉族裔後，Nano 會完全沒有族裔線索。

### 相容

- 主體句舊英文加入 `SUBJECT_COUNT_OPTIONS` 的 `legacyPromptAliases`，舊卡片的人數（尤其雙人）仍能正確辨識。
- 甜美、冷感、成熟 3 條的舊英文加入 `item_metadata.json` 的 `legacyPromptAliases`。

### 驗證

- 304 筆全輸出中有 1,806 個欄位變動；以精確反向對照全部還原成修改前輸出（0 個意外差異），且已沒有任何輸出含 `Japanese or Korean`。
- 新測試 `ethnicityFacialFeatures.test.js`（5 項）：五官全無時任何輸出都不帶族裔；5 種五官在 6 種輸出都帶指定族裔、且不帶另一個；混血不帶日／韓；雙人句正確；舊主體句與舊五官英文可匯入。族裔檢查只比對「族裔字樣後接 face／woman」，避免把 `Japanese portrait color grade` 這類調色風格誤判為人物族裔。
- 凍結基準：新增 `ethnicityRevisionTestSupport.js` 的精確反向函式（含單元測試 6 項），涵蓋 24 個檔案，沒有重算任何雜湊；64 條直接斷言改為新寫法。
- 副作用：冷感、成熟的推論 `archetype` 變成 `korean`，經查對抽選與輸出零影響（見決策紀錄）。
- 第 1–5 組最終總比對：最初基準 → 目前共 1,814 個欄位變動，全部可由五組核准變更解釋，無法解釋的差異為 0。
