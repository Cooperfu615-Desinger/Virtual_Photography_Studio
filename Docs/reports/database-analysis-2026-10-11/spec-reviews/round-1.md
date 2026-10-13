# 規格審查：Docs/specs/catalog-data-architecture-v1.md

- 審查方式：只讀。先讀規格反向重述，再對照程式碼。另以 `git archive HEAD`（60b6489）解到 scratchpad 的唯讀副本，和目前的工作樹（有其他 session 未提交的修改）分別實跑 `getLockControls()`。
- 審查時 repo 狀態：`webapp/src/lib/engine.js` 等檔有未提交修改；規格、決策紀錄、分析報告與分析工具都是未追蹤檔（`??`）。
- 結論：反向重述和規格意圖一致（目標、階段、不變量都讀得懂）。但有約 10 處規格寫法照做會失敗，或和程式碼不符，交給 Codex 前需要先修。

---

## 一、反向重述（只根據規格）

**總目標**：把目錄資料（knowledge_base 6 份 Markdown + 2 份 metadata JSON → database.json）改成「每分類一個 JSON 檔」作為唯一來源。每條紀錄有永久 ID，欄位集中在同一筆，並由正式 schema 驗證。原本由 engine 從文字推論出的語意 tags 改為寫進資料。三個 Phase 全程不能改變任何公開 Prompt、UI 或存檔格式。已知的資料錯誤原樣凍結，留給 Phase 4。

**不變量 I1–I9**：每個子步驟都要確認以下各項：
- 編譯後各 control 的選項 ID 集合與順序不變（I1）
- 每個選項的 legacyIds 集合不變（I2）
- 每個選項的 meta 不變（I3）
- 代表性 fixtures 的輸出逐字相同（I4）
- 同 seed 200 組 strict audit 的結果相同（I5）
- 存檔、遷移、匯入匯出相容（I6）
- 前端 test、lint、build 通過（I7）
- 資料層三項檢查通過（I8）
- 桌機與手機瀏覽器實測通過（I9）

**Phase 1**
- **1a**：
  - 新增兩份快照：一份記錄每個 control 的選項 ID 陣列與每個 ID 的 legacyIds，一份記錄每個 ID 的完整 meta。
  - 新增快照測試（用 `getLockControls()` 重新編譯後逐鍵比對，納入 `npm test`），以及唯一能改寫快照的指令 `scripts/update_catalog_snapshots.mjs`。
  - 序列化時固定鍵順序，tags 先排序。
  - 1a 必須最先完成並 commit，作為比對基準。
- **1b**：
  - 把分析工具整理成 `scripts/check_catalog_integrity.mjs`：自動定位 repo，保留 `--strict` 與 `--json-out`。
  - 檢查項目：懸空的 ID、zh、MJ 名稱、overlay key；legacyId 歧義；metadata 白名單；manifest 對應；角色卡多檔一致。
  - 新增 `scripts/catalog_integrity_allowlist.json`，收錄 J12 與 B3 兩項已知問題。清單過期也要報錯。
  - 在 CI 的資料檢查段加入 `--strict`。
- **1c**：
  - 建立 `knowledge_base/catalog/`：`index.json` 定義分區與分類順序，每個分類一個 `<slug>.json`。
  - 用一次性腳本 `migrate_catalog_to_json.mjs` 寫入每條的 `id`（等於現行編譯主 ID，37 條沿用 stableId）和完整的 legacyIds（顯式 legacyIds、rawZh 列序別名、環境光舊分類別名）。
  - 修改 sync：
    - 改讀 JSON。
    - 輸出的 database.json 每條帶 `stableId` 與 `legacyIds`。
    - manifest 合併邏輯不變。
    - 重新產生 6 份唯讀 Markdown 總覽，`--check` 連同總覽一起驗證。
  - engine `buildEntries`：有 stableId 的條目不再依列序自動產生別名，直接使用資料中的 legacyIds。這是 1c 唯一允許的 engine 修改。
  - 刪除 `item_metadata.json` 與 `outfit_preset_metadata.json`。
  - 驗收：去掉 stableId 與 legacyIds 後，新舊 database.json deep-equal；新舊 Markdown 解析結果相同；I1–I9 通過。
  - 1c 期間凍結其他 session 的目錄資料修改。
- **1d**：
  - 新 ID 的格式為 `<group>:<slug>:<english-kebab>`，不含列序。
  - sync 驗證以下規則：
    - ID 必填且唯一。
    - 新 ID 必須符合格式；快照中已存在的舊 ID 不受此限。
    - 改名時不改 ID。
    - 刪除條目時，ID 要併入其他條目的 legacyIds，或列入 `retired_ids.json`。
    - ID 永不重用。

**Phase 2**
- **2a**：
  - 新增 `catalog/schema.json`（JSON Schema 子集）：必填 id、zh、en、desc；每個分區與分類的允許欄位；`additionalProperties: false`。
  - sync 內建最小驗證器，不新增 Python 依賴。
  - schema 的頂層欄位要等於 buildEntries 白名單，並由完整性檢查比對。
  - 錯誤訊息包含檔案、id、欄位路徑、預期值與實際值。
- **2b**：完整性檢查加入 JS 內嵌目錄（角色卡、Pose Composer、雙人、固定構圖、overlay），只驗證不搬家。
- **2c**：更新 AGENTS.md、四份撰寫指引、current_project_state、engine-architecture；改 `Docs/` 下的檔案前先建 .bak。

**Phase 3**
- **3a**：
  - 用一次性腳本把 infer*Meta 的結果寫入 `meta.semantic`。
  - buildEntries 遇到有 semantic 的條目直接使用，否則照舊推論（只剩自訂 library 會走推論）。
  - schema 改為要求 semantic 必填，並列舉允許的 tag 值。
  - 錯誤標籤原樣凍結，並列入 frozen-known-issues.md。
  - `--suggest` 只提供推論建議值，不自動寫入。
- **3b**：
  - 把 21 張 legacy 表搬到 `legacy_mappings.json`，`targetZh` 改成目標 id。
  - sync 驗證每個目標都存在。
  - migration 函式邏輯不變，只改從資料檔讀表；J12 維持取第一個命中。

**交付**：
- 9 個子步驟依序進行，各自獨立驗收、獨立 commit；沒有 Cooper 指示不 commit。
- 中途有其他 session 的提交時，先重跑 1a 比對再繼續。
- 1c 之後若要回退，必須連同後續子步驟一起 revert。

---

## 二、已查證為正確的主張

| 規格行 | 主張 | 證據 |
| --- | --- | --- |
| 15 | 1,050 條中有 1,013 條依列序產生 ID，37 條有 stableId | database.json 實算：1050 條、stableId 37 條（另有 36 條帶 legacyIds） |
| 15 | 失配時回退成「全無」 | `engine.js:3897-3908`（工作樹） |
| 42 | 209 個 controls、4,628 個 options | 在 HEAD 60b6489 副本實跑結果相符（工作樹是 211／4637，見 E10） |
| 99 | 6 個分區、56 個分類 | database.json 實算 56。slugify 後各分區內沒有撞名 |
| 17 | 2,291 個 tags | 分析工具實跑：785/1033 個選項帶 tags，共 2291 個 |
| 66 | `getLockControls` 存在並已匯出 | `engine.js:4033` |
| 71 | 新測試會被 `npm test` 收到，不會進 prompt-quality | `webapp/package.json` 的 test glob 含 `src/lib/engine/*.test.js`；test:prompt-quality 是明列清單 |
| 46 | I5 指令從 repo 根目錄執行可行 | `scripts/validate_prompt_logic.mjs:1-15` 以相對 import 載入，輸出到 stdout |
| 141-142 | rawZh 別名與環境光別名 | `engine.js:3296-3299`、`3317-3321` |
| 227 | `CHARACTER_PROFILE_CONTROL_ORDER` 存在並用於過濾 | `engine.js:342`、`380` |
| 87 | `shoulder-lean`、`leaning-shoulders` 有歧義 | 分析工具實跑的確定問題 LEGACY_ID_AMBIGUOUS |
| 270 | 21 張表、535 行、340 條 | 分析工具實跑輸出 |
| 272 | 找不到目標時靜默 return | `engine.js:3202`、`3214`、`3229`、`3244`、`3253`、`3270`、`3277` |

---

## 三、問題清單（依嚴重度）

### 錯誤（規格與程式不符，或照做會破壞不變量）

**E1｜§4.2 第 89 行｜CI 步驟位置會讓檢查失敗**
- 規格要求把 `check_catalog_integrity.mjs` 放進「與 `sync_to_json.py --check` 同一段」。但那一段（`.github/workflows/deploy.yml:27-34`）在 Setup Node（`:36-41`）和 `npm ci`（`:43-45`）之前執行。
- 分析工具需要 Node 22 以上（因為 engine.js 用 import attributes），也需要 `webapp/node_modules` 的 espree（`analyze_database_catalog.mjs:27`、`:65-66`）。放在那一段會用到 runner 預設的 Node，而且找不到 espree。
- 修正：步驟應放在 `npm ci` 之後，例如 webapp-quality job 的 Test 前後。

**E2｜§4.1 第 64-65 行、I2/I3 第 43-44 行｜快照以「選項 ID」為鍵會互相覆蓋**
- 在 HEAD 實跑，同一個 ID 出現在多個 control，而且 meta 或 legacyIds 不同：
  - `none`：78 個 control，meta 有 2 種
  - `random`：20 個 control，meta 有 3 種
  - `3:4`：aspectRatio 的 legacyIds 是 `["2:3"]`，mjAspectRatio 沒有 legacyIds
  - `lying-side`、`lying-prone`、`selfie-mirror-phone-visible`：meta 各有 2 種
- 修正：兩份快照都要以 `controlKey + id` 為鍵，否則 I2、I3 會漏檢或誤報。

**E3｜§4.1 第 66 行、§4.3.2 第 136 行、§7 第 283/285 行｜Negative 的 19 條不在任何 control 裡**
- 實跑 HEAD：database.json 1050 條中，1031 條找得到對應的 control 選項。Negative 6 個分類共 19 條不在任何 lock control 裡，engine 也沒有讀 `catalog.negative`（grep 無結果）。
- 因此用 `getLockControls()` 做的快照保護不到這 19 條的 ID、legacyIds 與 meta。遷移腳本也無法從「engine 編譯結果」取得它們的 ID。
- engine 沒有匯出編譯後的 catalog（匯出清單見 `engine.js:3447-3459`、`4033`），也沒有匯出 infer*Meta（`:1686-2596` 都沒有 export）。
- 1a、1c、3a 都需要新增 engine 匯出，但規格寫 1a「不動 engine」、1c「buildEntries 是唯一允許的修改」，兩者衝突。
- 修正：明確授權新增一個測試與腳本專用的 catalog／infer 匯出，並把它列入 §7 的「是否動到 engine」欄。

**E4｜§4.3.3 第 154 行、§6.1 第 255 行｜「只有自訂 library 沒有 stableId 或 semantic」這個說法不成立**
- `getKnowledgeBaseSnapshot()`（`engine.js:3456-3459`）會回傳 mergedDatabase。1c 之後裡面每條都帶 stableId 和 legacyIds，3a 之後還會帶 meta.semantic。這份 snapshot 被當成物件型自訂 library 使用（`mergeCustomLibrary`，`:3363-3365`）。受影響的地方：
  - `engineSubjectKeyLightCompatibility.test.js:62-66`：複製「機頂直閃」改 zh 後 push。現在這條沒有 stableId，複本會得到新的列序 ID；1c 之後複本會沿用同一個 stableId，Light Style control 出現重複 ID，斷言可能變成空轉。
  - `shibuyaCrowdScene.test.js:80-86`：改 `en` 後重新編譯。3a 之後不會再依新文字推論（這個案例我實測 tags 相同，目前不會失敗）。
  - `sceneIntegratedAssemblyTestSupport.js:19-22`：PRE_HOURGLASS 基準。
- 修正：規格應說明 snapshot 型 library 的行為，並決定這些測試是否要調整。

**E5｜§6.1 第 253-254 行｜meta.semantic 會漏進編譯後的 meta**
- buildEntries 的 meta 是 `{...inferredMeta, ...sourceMeta, …欄位, tags}`（`engine.js:3337-3351`）。semantic 放在 `item.meta` 裡，會跟著 `...sourceMeta` 展開，編譯後的 meta 多出 `semantic` 鍵，I3 必定失敗。
- 規格沒有要求剝除 semantic，也沒有規定 semantic 要取代 inferredMeta 的位置，以維持 inferred < source < 欄位 的覆蓋順序和 tags 合併順序。

**E6｜§4.4 第 200、202、203 行｜用快照判斷新舊 ID 會被繞過**
- 快照可以用 `update_catalog_snapshots.mjs` 更新（第 67 行）。更新之後，任何不合格的新 ID 都會變成「快照中已存在」，從此不受格式檢查。
- 已刪除的 ID 也會從快照消失，第 4、5 條（刪除必須登記、ID 永不重用）就無從比對。
- 修正：需要一份只增不減的登記檔，例如 1c 產生的 `frozen_ids.json`，加上所有發過的 ID。

**E7｜§4.3.1 第 131 行 與 §4.3.4 第 151、162 行｜manifest 合併的欄位在兩處規定互相矛盾**
- 「紀錄形狀等於目前 database.json」會把 sync 從 manifest 合併進來的 `meta.referenceImageId`、`referenceImage`、`referenceImageFormat`（`sync_to_json.py:222-227`，套裝、特殊穿搭、連身共 173 條帶 meta）也寫進紀錄。
- 但同時又規定 manifest 維持獨立、合併邏輯不變。結果是雙重來源，schema 也必須允許這些鍵。
- 修正：規格應明說紀錄不含 manifest 衍生的鍵。

**E8｜§6.2 第 270-272 行｜不是每張 legacy 表都是「targetZh 指向目錄」**
- 有些表用的欄位是 `stateZh`、`frameZh`、`colorZh`、`placementZh`、`anchorZh`、`baseZh`（`engine.js:2997-3000`、`3491-3493`、`3733-3738`）。
- 有些表的目標是相機 profile 或 Pose Composer 的 JS 內嵌 ID：`CAMERA_PROFILE_RENDERING_MIGRATIONS` 在 `:2740`，`LEGACY_POSE_HAND_TO_PROP_ID` 在 `:2957`，`POSE_COMPOSER_ARRANGEMENT_TO_ANCHOR_MIGRATIONS` 在 `:2997`。Python 的 sync 看不到這些 ID，無法驗證。
- 修正：這類驗證應放在 `check_catalog_integrity.mjs`，並逐表定義欄位如何轉換。

**E9｜I9 第 50 行｜工作區數量和其他文件不一致**
- 規格寫「六個工作區」。AGENTS.md 和 `Docs/specs/frontend-visual-validation.md:15-21` 都寫 five，並列出 5 個；`current_project_state.md:13`、`:21` 卻寫「六現用工作區」。
- 修正：規格應直接列出要檢查的工作區名稱。

**E10｜第 7 行、第 42 行、§4.3.7 第 188 行｜基準版本不一致，而且工作樹不乾淨**
- 209／4628 是 HEAD 60b6489 的數字。工作樹實跑是 211／4637，因為其他 session 的 specified-actions 修改尚未提交。
- 規格引用的行號（3291、3905、3202-3277）對應的卻是工作樹；HEAD 的 buildEntries 在 3286，noneOption 在 3899。
- 如果 1a 在目前這個髒工作樹產生快照再 commit，快照會和 commit 中的 engine 不一致，CI 會失敗。
- §4.3.7 的前置檢查只看 knowledge_base、database.json、sync，沒有看 engine.js。但 1c 要改的 engine.js 目前正是 `M` 狀態，和 AGENTS.md「保護他人未提交修改」直接衝突。

**E11（低）｜第 17 行｜「資料裡沒有任何顯式 tag」不完全正確**
- 6 條 Light Style 有顯式的 `subjectLight.tags`，會合併進 meta.tags（`engine.js:3333`、`3350`）。
- 3a 必須維持這段合併，不能把它當成推論結果寫進 semantic。

### 遺漏

**O1｜§4.2 與 1c、3a、3b｜完整性檢查和允許清單沒有跟著各階段更新**
- 1b 的檢查依賴的幾個來源會在後續階段消失或改變：
  - 「item_metadata 欄位白名單」檢查依賴 `item_metadata.json`，1c 刪除。
  - 「database.json 顯式 tags」（TAGS_INFERRED_FROM_TEXT）在 3a 之後會消失。
  - 「targetZh 懸空」檢查依賴 targetZh，3b 會改成 id。
- 規格沒有要求在 1c、3a、3b 同步修改完整性檢查與允許清單。配合「清單過期就報錯」的規則，這些階段會直接讓 CI 失敗。

**O2｜第 86-91 行｜允許清單的語意沒有定義**
- 分析工具的 `--strict` 只對「確定問題」以 exit code 1 結束（工具第 25 行）。CARD_LAYER_DUPLICATION 屬於「可能問題」（工具第 500 行）。
- 目前實跑還有其他可能問題：TAGS_INFERRED_FROM_TEXT、DANGLING_ID_TEST（6 個）、DANGLING_ZH_LITERAL（1 個）、UNKNOWN_CATEGORY_LITERAL（9 個）。
- 規格說「清單以外的問題一律讓 CI 失敗」，沒有講清楚是否包含「可能問題」；也沒有定義清單比對的粒度是問題代碼還是個別項目，而「清單過期」的判斷需要這個粒度。

**O3｜§4.3.2 第 139-142 行｜「完整的 legacyIds」範圍不清楚**
- 規格只列了三個來源，但 buildCatalog 在 buildEntries 之後還會用 legacy 表加入 ID（`engine.js:3400-3407`）。
- 需要說明凍結的是「control 上最終的 legacyIds」還是「只有 buildEntries 產生的部分」，也要說明遷移腳本怎麼把 database 條目對到編譯後的選項。實測 1031 條各對應 1、3 或 6 個 control，legacyIds 都一致，所以兩種做法都可行，但必須擇一寫明，這也會影響 3b 那些表是否還有作用。

**O4｜§5.3｜文件與測試更新範圍不完整**
- 2c 沒有列入幾份仍會叫人改 Markdown 的文件：`README.md:74`、`Docs/THE_ARCHITECT.md:16`、`Docs/outfit_preset_schema_migration.md`。
- 也沒有要求更新 `scripts/tests/test_sync_to_json.py`，這份測試直接測 merge 函式。新的 schema 驗證器和 1d 的 ID 規則也沒有規定要附 Python 單元測試。

**O5｜§4.3.5 第 171-173 行｜Markdown 總覽的回寫規則沒有定義**
- Regional 26 條的 desc 全是「inspiration | desc」合併後的字串（`sync_to_json.py:74-75`）。重新產生 Markdown 時要拆回兩欄，規格沒有寫拆法。
- `prompt_generator.py:24-25` 會丟掉空白欄位，並靠字面前綴（`| :---`、`| 維度分類`、`| 攝影風格`）跳過表頭。產生器必須保留完全相同的表頭和分隔列，也不能輸出空白格。
- 日後 JSON 文字如果含有 `|` 或換行，需要跳脫規則。
- 各檔的標題與說明文字要從哪裡來，也沒有定義。

**O6｜§4.3.6 第 182 行｜deep-equal 的比對規則有漏洞**
- 37 條原本就有 stableId，36 條原本就有 legacyIds，所以兩邊都要先剝除這兩個鍵再比，規格只說剝除「新增的」。
- deep-equal 不比較鍵的順序，但 meta 的鍵順序會影響編譯後 meta 的順序。建議改用 canonical 序列化後的位元組比對。

**O7｜§4.3.1、§5.1｜假值欄位沒有被提醒要保留**
- `outerwearFastenerRequirement: ""` 靠 `!== undefined` 保留（`engine.js:3346`）。`randomEligible: false` 只在有 outerwearStyling 時複製（`:3345`）。
- 遷移腳本或 schema 不能把空字串或 false 當成空值移除。

**O8｜§4.3.3｜同分類 zh 唯一的檢查沒有交代**
- 「同分類 zh 唯一」（`sync_to_json.py:109-117`）必須保留，因為 manifest 是依名稱合併的。規格沒有提。

**O9｜§4.4 第 202 行｜併入 legacyIds 的範圍不清楚**
- 舊 ID 只會在同一個 control 的選項裡解析（`engine.js:3897-3901`）。所以「加入某個現存條目的 legacyIds」必須限定同分類或同 control。
- 也應規定 legacyIds 不得和同一 control 內的任何現行 ID 或其他 legacyIds 衝突。

**O10｜整體｜交接所需檔案尚未進版控**
- 規格、決策紀錄、分析報告和 1b 依賴的分析工具都是未追蹤檔。交給 Codex 前要先提交，否則對方的 checkout 裡沒有這些檔案。

### 模糊

**A1｜第 73、294、296 行｜commit 流程互相卡住**
- 1a 必須先 commit 才能繼續，但規格又規定沒有 Cooper 指示不能 commit。需要寫明「每個子步驟完成後停下來等 Cooper 批准 commit」的流程。

**A2｜§5.1 第 211-217 行｜schema 寫法不夠明確**
- 列出的關鍵字裡沒有 if/then、oneOf、$ref，無法表達「每個分類允許不同欄位」。需要定義 schema.json 怎麼從分類對應到子 schema。
- 「schema 頂層欄位等於白名單」不清楚指單一分類還是所有分類的聯集。紀錄用的是 `id`，database.json 和白名單用的是 `stableId`，兩者的對應也要寫明。
- 部分白名單欄位有條件：`subjectLight` 只在 Light Style 生效（`engine.js:3330-3332`），`randomEligible` 只和 outerwearStyling 一起出現。

**A3｜§6.1 第 252 行｜semantic 的內容沒有定義清楚**
- 需要說明 semantic.tags 只放推論出的 tags（不含 source 與 subjectLight 的 tags），以及存檔時要保留原始順序還是排序。

**A4｜§5.2 表格｜模組路徑與檢查定義不清**
- 模組沒有寫完整路徑。例如 `characterCardLab.js` 位於 `webapp/src/lib/`，不在 `engine/`。
- 「原文 pin」沒有定義。
- `legacyIdentityAndBody` 本來就由 identityAndBody 衍生（`characterProfiles.js:1056`），檢查兩者相等是同義反覆；`characterCardLab.test.js:106` 也已經測過。

**A5｜第 77-78 行、第 273 行｜部分前提與現況不符或無法查證**
- 分析工具已經有 `--repo` 和 `findRepoRoot`（工具第 46-58 行），沒有寫死的路徑。真正要處理的是 Node 22 和 espree 依賴。
- 「27 個 migration 函式」無法查證：我用 apply*/migrate*/normalizeLegacy* 等命名模式 grep 只找到 21 個。規格沒有說明計數方法。

**A6｜第 136、251 行｜一次性腳本的去留沒有說明**
- 沒有寫明一次性腳本完成後要留在 repo 還是刪除。

**A7｜I7 第 48 行｜已知的不穩定測試可能擋住驗收**
- `current_project_state.md:43` 記錄 `engineOutfitPresetDressCleanup.test.js:627` 是隨機不穩定的測試。「全部通過」可能被它擋住，需要寫明處理方式。

### 建議（非必要）

- **S1**：快照另外涵蓋編譯後的 catalog 條目（含 Negative），並記錄每條對應到哪些 control。
- **S2**：`sceneIntegratedAssemblyBaseline.json:8` 記錄了 database.json 的 SHA-256，但沒有任何程式讀取或斷言這個 hash（grep `sourceHashes` 只出現在該 JSON），1c 之後會變成過期資訊，可以在交付報告中註明。
- **S3**：規格內的 engine 行號改成函式名稱。行號已和 HEAD 差約 5 行，例如第 17 行的 `:1579` 現在落在 withTags 裡。
- **S4**：tags 在 engine 中沒有看到依賴順序的用法（grep `tags[0]`、`tags.find`、`tags.join` 等都沒有結果），快照把 tags 排序的風險低。但 I4、I5 仍然是唯一能捕捉 tags 順序變化的檢查。
