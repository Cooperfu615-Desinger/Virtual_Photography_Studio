# 規格複審：catalog-data-architecture-v1.md（修訂版）

- 審查範圍：修訂後的規格全文，共 443 行。
- 對照基準：HEAD `e86703e`，`engine.js` 已無未提交修改。
- 審查方式：只讀。實跑的項目如下：
  - `getLockControls()` 計數，以及同一 control 內 ID 是否重複。
  - 規格引用的 `engine.js` 行號逐一 grep。
  - 用 espree 列出分析工具所謂的「21 張 legacy/migration 表」。
  - I5 指令連跑兩次，比對 stdout。
  - 以 database.json 計算 37 個 stableId 與依列序計算的 ID 的差異。
- 總評：第一輪大部分問題已解決。仍有 4 項需要修正後才能交付：
  - §4.3.3 遷移對應方式
  - §4.3.4 測試資料調整的方法
  - §6.2 的「21 張表」與 targetKind 分類
  - 1d 登記簿缺少反向檢查

---

## 一、已確認正確的修訂

| 項目 | 證據 |
| --- | --- |
| 基準 211 個 controls、4,637 個 options | HEAD 實跑相符 |
| 規格引用的行號 3291、3296-3299、3345-3346、3400-3407、3456、3897-3905、2740、2957、2997、3491、3733、342、380 | grep 結果全部一致 |
| 7 處 `if (!target) return;` | `engine.js` 3202、3214、3229、3244、3253、3270、3277 |
| CI 位置：`npm ci` 之後、`npm test` 之前 | `deploy.yml:36-49`，該 job 使用 Node 22 |
| I5 的做法 | 從 repo 根目錄連跑兩次，stdout 位元組相同，exit 0。輸出不含時間戳 |
| §6.1.2 的 tags 合併式 | 與現行 `engine.js:3350` 相同；覆蓋順序 inferred → source → 欄位 → tags 也與 `:3337-3351` 一致 |
| Regional 拆欄 | 26 條 desc 都恰好含 1 個 ` \| ` |
| Markdown 格式可以重建 | 6 份檔案的表格列都是 6 段（4 欄）；只有第 1 欄用粗體、第 3 欄用反引號，其餘欄位沒有 `*` 或反引號 |
| 非 Regional 的 zh、en、desc 都不含 `\|` | 實測 |
| 六個工作區 | `App.jsx:65-90` 確實有 6 個工作區，含 Observation Capture Lab |
| 同一 control 內 ID 唯一 | 實跑，目前沒有重複 |
| `--strict` 允許清單只需 J12 一項 | 實跑結果：`confirmed` 只有 LEGACY_ID_AMBIGUOUS |

---

## 二、第一輪問題逐條狀態

| 編號 | 狀態 | 說明 |
| --- | --- | --- |
| E1 CI 位置 | 已解決 | L110-118 |
| E2 快照的鍵 | 已解決 | L77-85，改用 controlKey 與 group::category 為鍵 |
| E3 Negative 與 export | **部分解決** | 已新增 export（L64-71），但用它做遷移時，對應方式有新錯誤，見 N1、N2 |
| E4 snapshot 型 library | **部分解決** | 已承認問題（L209-217），但給的調整方法對其中一個檔案是錯的，見 N3 |
| E5 semantic 漏出 | 已解決 | L359-362 |
| E6 快照可被繞過 | **部分解決** | 已改用 id_registry，但缺少反向檢查，見 N5 |
| E7 manifest 鍵 | 已解決 | L174 |
| E8 legacy 表的分類 | **部分解決** | 已有 targetKind 分類（L389-399），但「21 張表」的界定與分類有誤，見 N4 |
| E9 工作區數量 | 已解決 | L54 列出 6 個工作區，與 `App.jsx` 相符。但 AGENTS.md 與 frontend-visual-validation.md:15 仍寫 five，建議 2c 一併修正 |
| E10 基準與凍結範圍 | 已解決 | L7、L249 |
| E11 subjectLight.tags | 已解決 | L21 |
| O1 完整性檢查跟著各階段更新 | 已解決 | L120-128 |
| O2 允許清單語意 | 已解決 | L100-108 |
| O3 legacyIds 範圍 | 規則已明定（L185-190） | 但用指定的 export 無法取出這個範圍，見 N2 |
| O4 文件與測試範圍 | 已解決 | L223、L281、L309、L331 |
| O5 Markdown 重建 | 大致解決 | L175、L202、L228-232。新增的 `inspiration` 欄位和 2a 規則矛盾，見 N6 |
| O6 位元組比對 | 已解決 | L241 |
| O7 假值保留 | 已解決 | L176、L306 |
| O8 zh 唯一 | 已解決 | L200 |
| O9 legacyIds 只在同分類解析 | 已解決 | L277-278 |
| O10 規格等檔案未進版控 | **未解決** | `git status` 中，規格、`Docs/decisions/`、`Docs/reports/` 都還是 `??`。1b 依賴 `Docs/reports/.../analyze_database_catalog.mjs` |
| A1 commit 流程 | 已解決 | L422 |
| A2 schema 分層 | 大致解決 | L289-309。白名單「等於」的比對規則仍有矛盾，見 N6 |
| A3 semantic 內容 | 已解決 | L349-353 |
| A4 模組路徑、pin、同義反覆檢查 | **未解決（輕微）** | L317-320 仍沒有完整路徑（`characterCardLab.js` 在 `webapp/src/lib/`）；「原文 pin」仍未定義；`identityAndBody === legacyIdentityAndBody` 仍是同義反覆（`characterProfiles.js:1056`） |
| A5 寫死路徑、27 個函式 | **未解決（輕微）** | L94 仍要求「移除寫死的路徑」，但工具已有 `--repo` 和 `findRepoRoot`（工具第 46-58 行）。L400 的「27 個 migration 函式」仍沒有計數方法 |
| A6 一次性腳本的去留 | **未解決（輕微）** | L182、L347 沒有說明完成後要保留還是刪除 |
| A7 不穩定測試 | **未解決（輕微）** | I7 要求全部通過，但沒提 `engineOutfitPresetDressCleanup.test.js:627` 這個已知的隨機失敗（`current_project_state.md:43`） |
| S3 行號 | 仍有一處錯 | L21 的 `engine.js:1579` 落在 withTags 內部（1575-1583），hasAny 在 1587 |

---

## 三、修訂後新增或殘留的問題

### N1｜錯誤｜L182｜按「category＋陣列索引」對應，在頭部配件會錯位

- 依 L68，`getCompiledCatalogForTesting()` 回傳的是 runtime 編譯後的 catalog，也就是經過 `buildCatalog` 後處理的結果。
- 其中 `splitAccessoryCatalog`（`accessoryPolicy.js:13-22`，由 `engine.js:3403` 呼叫）會把 `頭部配件 (Head Accessories)` 的第 1-5 條（耳機 3 條、口罩、防毒面具）移到合成分類 `耳機 (Headphones)`、`口鼻遮擋 (Face Coverings)`，並在這兩個分類開頭各插入一條 `wardrobe:<slot>:none`。
- 結果是 database.json 的頭部配件有 19 條，編譯後只剩 14 條，從索引 1 開始全部錯位。
- 修正：遷移應改為依 `id` 或 `stableId` 對應，或讓 export 另外提供 buildEntries 階段、尚未後處理的輸出。

### N2｜錯誤｜L185-190 與 L68｜指定的 export 取不出「只有 buildEntries 產生的 legacyIds」

- export 回傳的條目，legacyIds 已經被 `apply*LegacyOptionIds` 追加過 legacy 表的 ID（`engine.js:3400-3407`，寫法是 `Array.from(new Set([...existing, ...table]))`）。
- 規格要求這部分「不寫入紀錄」，但沒有說要怎麼剝除。只看最終陣列無法可靠切分：去重之後，前後兩段的界線不固定。
- 如果誤把 legacy 表的 ID 一起寫進紀錄，I2 仍會通過（Set 內容相同），所以這個錯誤不會被偵測到。但 3b 之後會形成雙重來源。
- 修正：export 應同時提供 buildEntries 的原始輸出。

### N3｜錯誤｜L211-216｜「刪 stableId、清空 legacyIds」不能套用在 PRE_HOURGLASS

- `sceneIntegratedAssemblyTestSupport.js:19-22` 是整份 snapshot 拿來當 library，沒有複製條目，也不會產生重複 ID。
- 如果照規格把 stableId 全部刪掉，原本就帶 stableId 的 37 條中，有 15 條會變回依列序計算的不同 ID。實算例子：
  - `wardrobe:外套-outerwear:龐克皮衣:3` 會變成 `…:龐克風皮衣:3`
  - `wardrobe:外套開合-outerwear-opening:fully-closed:5` 會變成 `…:全扣上-全拉上:5`
- 結果歷史基準的 selection 與 hash 會失效。
- `shibuyaCrowdScene.test.js:80-86` 只改 `en`，也沒有複製條目，同樣不需要調整。
- 真正需要處理的只有 `engineSubjectKeyLightCompatibility.test.js:62-66` 新 push 的那個複本。修正：規格應改為「只清除新複製出來的條目上的 stableId 與 legacyIds」。

### N4｜錯誤｜L387、L394-395、L399｜「21 張表」的界定和 targetKind 都對不上

用 espree 依分析工具的規則（名稱含 LEGACY 或 MIGRATION，且至少 5 行）列出 21 張表後，發現：

1. **其中一張不是資料表。** `AI_LEGACY_SINGLE_RENDERER_HELPERS`（`engine.js:15784`）是 renderer 函式陣列，不能寫成 JSON，也不屬於任何 targetKind。
2. **規格舉的例子不在這 21 張裡。** `POSE_COMPOSER_ARRANGEMENT_TO_ANCHOR_MIGRATIONS`（`:2997`，4 行）和 `LEGACY_HAIR_STYLING_STATE_MIGRATIONS`（`:3491`，3 行）都因為不足 5 行而沒被計入。「21 張」的範圍需要重新定義。
3. **有一張分錯類。** `CAMERA_PROFILE_RENDERING_MIGRATIONS` 的值是目錄條目的 zh。例如 `復古微對比銳利感` 是「底片與相機模擬」的一條，見 `engine.js:2725` 與 database.json。它應屬於 catalog-entry，不是 embedded-id。
4. **有欄位沒有被任何 targetKind 涵蓋。** `handZh`、`propZh`、`arrangementZh`、`headZh`（`:2907-2919`、`:2931`、`:2967`）、`openingZh`（`:3770`）、`label`（`:2921`）都沒列。而列在 catalog-attribute 下的 `anchorZh`、`baseZh` 指的其實是 Pose Composer 這類 JS 內嵌目錄，不是 catalog。
5. **「targetZh 轉成 id」和「函式邏輯不變」互相矛盾。** 現行函式是用 `item.zh === targetZh` 比對（`:3201` 等處）。資料改成 id 之後，比對邏輯一定得改。
6. **多張表在載入時才算出內容。** `.map()` 會用 slugify 算出 legacyId（`:2915-2918`、`:3171` 之後）。JSON 只能存放來源資料，衍生的計算必須留在 engine。規格應寫明這一點。

### N5｜遺漏｜L270-279｜登記簿缺少反向檢查

- 規則 2 只檢查「紀錄 → 登記簿」。如果直接刪掉一條紀錄，但沒有把登記改成 `retired`，登記簿上仍是 `frozen` 或 `active`，沒有任何規則會失敗。第一輪的 E6 因此仍有缺口。
- 修正：新增一條規則，「每個 `frozen` 或 `active` 的 ID 都必須存在於某一條紀錄」，並加入 1d 的 Python 測試。

### N6｜矛盾｜L175 與 L307、L173｜schema 欄位要「等於」engine 白名單會互相衝突

- Regional 新增的 `inspiration` 欄位只給 sync 使用，engine `buildEntries` 不讀，不在白名單內。
- 紀錄用 `id`，engine 讀的是 `stableId`。
- `item_metadata.json` 本身含 `stableId`、`legacyIds`，L173 說「欄位放頂層」，照字面會把 `stableId` 原樣搬進紀錄，和 `id` 重複。
- 修正：L307 應改為「schema 欄位減去 sync 專用欄位（`inspiration`），並經過 `id`→`stableId` 對應後，等於白名單」。L173 應註明 stableId、legacyIds 改由 `id` 和凍結後的 `legacyIds` 取代。

### N7｜模糊｜L347｜3a 重算推論時，要傳入什麼資料沒有定義

- `infer*Meta(category, normalized)` 接收的是 normalized 物件：zh 是經 `formatWardrobeOptionDisplayName` 轉換後的顯示名，en 和 desc 經過 stripMarkdown，另外還帶 mj 等欄位（`engine.js:3294-3324`）。
- `formatWardrobeOptionDisplayName`（`:2614`）沒有匯出。腳本如果直接傳原始 zh，套裝、連身的 tags 可能不同。I3 會擋下這種錯，但實作者會卡關。
- 修正：建議 export 直接提供每條的 `inferredMeta`。

### N8｜輕微｜L231 與 L289｜1c 引用了 2a 才會建立的 schema

- 1c 的 Markdown 產生規則寫「schema 已規定必填欄位不得為空」，但 schema 在第 5 步（2a）才建立。1c 需要自己檢查空值。

### N9｜輕微｜L53 I8｜1a 時腳本還不存在

- I8 要求跑 `check_catalog_integrity.mjs --strict`，但這支腳本在 1b 才建立。1a 無法滿足 I8，需要寫明 1a 不適用這一項。

### N10｜建議｜L206｜用 stableId 判斷是否停止產生別名，會影響測試 fixture

- 判斷條件會作用在所有帶 stableId 的來源，包括測試 fixture。`bodyTypeLegacyFixtures.json` 的 8 條有 stableId、沒有 legacyIds。1c 之後這些條目的 rawZh 別名會消失。
- 目前這些別名都等於條目自己的 ID，實際沒有影響。但較穩的做法是以「有 `legacyIds` 陣列」或明確的凍結標記作為條件。
