# 目錄資料架構 v1：穩定 ID、正式 schema、語意資料化

- 狀態：已核准，待實作。Cooper 於 2026-10-13 確認四項前提；本文已經過 fresh-context 反向重述審查並修訂。
- 範圍：只含 Phase 1 到 Phase 3。三個階段都**不改變任何公開 Prompt、UI 顯示或存檔格式**。
- 依據：[資料庫完整分析報告](../reports/database-analysis-2026-10-11/README.md) §4 B 類、§5 Phase 0/2
- 決策紀錄：[2026-10-13 目錄資料架構決策](../decisions/2026-10-13-catalog-data-architecture.md)
- 參照版本：本文的行號與數字取自 `codex/specified-actions-v1` @ `e86703e`（211 個 controls、4,637 個 options）。撰寫時這個分支尚未合併；`main` @ `60b6489` 的對應數字是 209 與 4,628，`engine.js` 行號約差 5 行。
- 實作基準：**以開始 1a 時的 `main` 為準**，實際數字以 1a 產生的快照為準。本文的數字只供參考；行號有落差時，以函式或常數名稱定位。
- 開始條件：`codex/specified-actions-v1` 也會修改 `engine.js`。建議等它合併進 `main` 之後再開始 1a；若要提前開始，必須先向 Cooper 確認如何處理兩條分支的重疊。

---

## 1. 背景

目錄資料的設計已使用約一年，資料格式沒有跟上需求成長，目前有三個結構問題。

1. **ID 不穩定。** database.json 的 1,050 條中，有 1,013 條（96.5%）的 ID 由「分類＋中文名＋列序」組成（`engine.js:3301`）。改名、插入、重排都會讓 Saved Cards 與 lock 裡存的 ID 失效；失效的 ID 會靜默退回「全無」（`engine.js:3905`）。
2. **schema 分散。** 一條資料的完整定義分散在 4 處，三種合併方式不同，也沒有正式 schema：
   - Markdown 四欄表格
   - `item_metadata.json`
   - `outfit_preset_metadata.json`
   - engine 的欄位白名單（`engine.js:3301-3350`）
3. **語意靠推論。** 相容 tags 主要由 `infer*Meta` 從 zh、en、desc 文字推論（`engine.js:1585-1587`、`:1680-2600`）。唯一的例外是 6 條 Light Style 有顯式的 `subjectLight.tags`（`engine.js:3333`、`:3350`）。因此改一句 desc，就可能靜默改變相容矩陣。

## 2. 目標與非目標

### 2.1 目標

- 每一條目錄資料都有明確、永久的 ID，與名稱、列序無關。
- 每條資料的欄位集中在同一筆紀錄，並有正式 schema 驗證。
- 相容 tags 等推論語意改為明列在資料中。
- 舊資料對照集中在單一資料檔，並驗證每個目標都存在。
- 建立快照與完整性檢查，讓之後任何資料變更對 ID 與語意的影響都看得見。

### 2.2 非目標

- 不改公開 Prompt 文字、UI 顯示與按鈕、storage key、Saved Cards 與 import/restore 格式。
- **不修正已知資料錯誤**（tag 誤判、控制語外洩、相容規則漏洞，即報告 §4 A 類）。這三個階段一律**原樣凍結**，交給 Phase 4 另立規格處理。
- 不搬遷 JS 內嵌目錄，包括角色卡、Pose Composer、雙人、固定構圖與各輸出 overlay，只把它們納入驗證。
- 不處理 Negative 分區的去留、死分支、隨機權重。Negative 仍會納入 ID 凍結與快照。

## 3. 驗收不變量

每個子步驟完成時，以下 9 項必須全部成立，任何一項不成立就算失敗。

| # | 不變量 | 驗證方式 |
| --- | --- | --- |
| I1 | 每個 control 的選項 ID 陣列（含順序）與快照相同 | 控制項快照（§4.1），鍵為 `controlKey` |
| I2 | 每個 control 選項的 legacyIds 與快照相同；目錄層每條的 ID 與 legacyIds 也與快照相同，包含不在任何 control 裡的 Negative 19 條 | 控制項快照＋目錄快照（§4.1） |
| I3 | 每個 control 選項與目錄條目編譯後的 `meta` 逐鍵相同，包括鍵的順序與 tags 順序 | 語意快照（§4.1） |
| I4 | 代表性 fixtures 的所有輸出逐字相同 | `npm run test:prompt-quality` |
| I5 | 同 seed audit 的輸出前後一致 | 從 repo 根目錄執行 `node scripts/validate_prompt_logic.mjs 200 prompt-quality-baseline --strict`，把變更前後的 stdout 存到 repo 外再 diff |
| I6 | Saved Cards 還原、舊 lock 遷移、匯入匯出相容 | `npm test` 既有相關測試全部通過 |
| I7 | 前端完整檢查通過 | 在 `webapp/` 執行 `npm test`、`npm run lint`、`npm run build`。已知的不穩定測試 `engineOutfitPresetDressCleanup.test.js:627`（見 `current_project_state.md:43`）如果失敗，必須證明它在變更前的 HEAD 用同一個 seed 也會失敗，並在報告中附上證據；不能證明的話，就視為本次造成的失敗 |
| I8 | 資料層檢查通過 | `python3 scripts/sync_to_json.py --check`、`python3 -m unittest discover -s scripts/tests`、`python3 scripts/check_public_assets.py`；從 1b 起再加上 `node scripts/check_catalog_integrity.mjs --strict`（1a 時這支腳本還不存在，不適用） |
| I9 | 瀏覽器實際操作正常 | 依 `Docs/specs/frontend-visual-validation.md`，在 1440×1000 與 390×900 檢查**全部六個工作區**：Prompt Control Deck（PAGE1）、Character Card Lab、Action Pose Lab、World Street Scene Builder、Observation Capture Lab、Saved Cards。必須實際操作 PAGE1 生成，以及 Saved Cards 的儲存與還原 |

快照只能用 `scripts/update_catalog_snapshots.mjs` 改寫。任何快照 diff 都要在交付報告中逐條說明原因；本規格三個階段的預期快照 diff 是**零**。

---

## 4. Phase 1：安全網與 ID 凍結

### 4.1 1a：快照

#### 4.1.1 授權的 engine 修改（測試專用匯出）

在 `engine.js` 新增一個 export：`getCompiledCatalogForTesting(sourceDatabase?)`。

- 不帶參數時，用預設的 `database.json` 編譯。
- 帶參數時，用傳入的 database 物件編譯，形狀與 `database.json` 相同。這個用法只給 `suggest_catalog_semantics.mjs` 這類工具使用。
- 兩種用法都不寫入、也不污染預設 runtime 快取。

回傳兩份資料：

| 欄位 | 內容 | 用途 |
| --- | --- | --- |
| `entries` | **`buildEntries` 剛輸出時**的結果，以 `group` → `category` → 陣列組織，陣列索引與 database.json 相同。每條含 `id`、`legacyIds`（只有 buildEntries 產生的部分）、`inferredMeta`（`infer*Meta` 對該條的原始回傳值）、`meta` | 1c 遷移、3a 寫入 semantic、目錄層快照 |
| `catalog` | `buildCatalog` 後處理完成的最終 catalog，包含 `splitAccessoryCatalog` 拆出的合成分類（`engine.js:3403`），以及 legacy 表追加的 legacyIds（`:3400-3407`） | 參考比對 |

實作要求：

- `entries` 必須在 `buildEntries` 回傳後、任何後處理之前，取一份 `structuredClone`。
  - 後處理會把頭部配件的 5 條移到合成分類（`accessoryPolicy.js:13-22`），也會在原物件上追加 legacyIds。所以不能從最終 catalog 回推。
- `inferredMeta` 由 `buildEntries` 在呼叫 `infer*Meta` 時順手保存，不另外重算。
  - 原因：`infer*Meta` 接收的是正規化後的物件，zh 已經過 `formatWardrobeOptionDisplayName`（`engine.js:2614`）轉換。外部腳本無法重現這個輸入。
- 這個 export 只供測試與 `scripts/` 使用，正式程式碼不得 import。完整性檢查要掃描並禁止正式程式碼 import 它。
- 正式路徑不呼叫這個 export，所以不影響任何既有行為。保存 `inferredMeta` 只在這個 export 的編譯路徑中進行。

#### 4.1.2 快照檔與測試

| 檔案 | 內容 |
| --- | --- |
| `webapp/src/lib/engine/catalogSnapshot.controls.json` | 以 `controlKey` 為鍵。每個 control 記錄選項陣列，每個選項含 `id`、`legacyIds` |
| `webapp/src/lib/engine/catalogSnapshot.catalog.json` | 以 `group` → `category` → 陣列記錄目錄層每條的 `id`、`legacyIds`（含 Negative） |
| `webapp/src/lib/engine/catalogSnapshot.meta.json` | 控制項層以 `controlKey + "::" + id` 為鍵，目錄層以 `group::category::id` 為鍵，記錄編譯後完整 `meta` |
| `webapp/src/lib/engine/catalogSnapshot.test.js` | 重新編譯後與三份快照比對；不相同時列出差異的鍵與欄位 |
| `scripts/update_catalog_snapshots.mjs` | 唯一允許改寫快照的指令，執行後印出差異摘要 |

規則：

- 不可只用選項 ID 當鍵。`none`、`random`、`3:4`、`lying-side` 等 ID 同時出現在多個 control，且它們的 meta 或 legacyIds 各不相同。
- 序列化時保留原始鍵順序與陣列順序，不做排序。I3 要求順序也必須相同。
- 快照測試要被 `npm test` 的 glob（`src/lib/engine/*.test.js`）收入，不放進 `test:prompt-quality`。

### 4.2 1b：完整性檢查進 CI

#### 4.2.1 腳本

- 把 `Docs/reports/database-analysis-2026-10-11/tools/analyze_database_catalog.mjs` 整理成 `scripts/check_catalog_integrity.mjs`：
  - 保留既有的 `--repo` 參數與自動定位 repo 根目錄的邏輯（工具第 46-58 行）。
  - 保留 `--strict` 與 `--json-out` 兩個參數。
  - 加入嚴重度分級與允許清單（§4.2.2）。
- 執行需求：Node 22 以上，並已在 `webapp/` 執行過 `npm ci`（需要 espree）。

#### 4.2.2 嚴重度與允許清單

- 每個檢查結果分兩級：
  - `confirmed`：確定問題。
  - `possible`：可能問題。
- `--strict` 的判定規則：
  - 有 `confirmed` 且不在允許清單內 → exit 1。
  - `possible` 只輸出報告，不影響 exit code。
- 允許清單 `scripts/catalog_integrity_allowlist.json` 以「問題代碼＋項目鍵」為比對單位，每項必填 `reason` 與 `decisionRef`。如果清單中的某項，在本次執行已不再出現，`--strict` 同樣 exit 1，視為「清單過期」。
- 初始允許清單只有一項：`LEGACY_ID_AMBIGUOUS` + `duoPoseId:shoulder-lean`、`duoPoseId:leaning-shoulders`，`decisionRef` 為報告 J12。
  - `CARD_LAYER_DUPLICATION`（12 段不一致）屬於 `possible`，不必列入允許清單。

#### 4.2.3 CI 位置

放在 `.github/workflows/deploy.yml` 的 webapp 品質 job，排在 `npm ci` 之後、`npm test` 之前。新增一個步驟，從 repo 根目錄執行：

```bash
node scripts/check_catalog_integrity.mjs --strict
```

**不可**放在 Python 資料檢查那一段，因為那一段在 Setup Node 之前執行。

#### 4.2.4 後續階段必須同步更新

1c、3a、3b 都會改動此腳本依賴的來源，例如：

- 1c 刪除 `item_metadata.json`。
- 3a 讓 tags 變成顯式資料。
- 3b 把 targetZh 改成 id。

這三個子步驟都必須在同一次交付中更新本腳本與允許清單，並通過 `--strict`。

### 4.3 1c：格式遷移與 ID 凍結

#### 4.3.1 新的資料來源結構

```
knowledge_base/catalog/
  index.json                  # 分區、分類順序；各分類檔路徑；各 Markdown 總覽的表頭與前言
  id_registry.json            # 只增不減的 ID 登記簿（§4.4）
  Wardrobe/<分類slug>.json
  CameraLighting/<分類slug>.json
  Locations/<分類slug>.json
  Character/<分類slug>.json
  Regional/<分類slug>.json
  Negative/<分類slug>.json
```

- 分類檔名使用 engine 現行的 `slugify(category)`，例如 `上身-tops.json`。
- `index.json` 決定分區與分類的順序，等於現行 `database.json` 的物件鍵順序。

#### 4.3.2 紀錄格式

每個分類檔的格式如下：

```json
{
  "section": "Wardrobe",
  "category": "上身 (Tops)",
  "entries": [
    {
      "id": "wardrobe:上身-tops:襯衫:1",
      "legacyIds": ["…"],
      "zh": "襯衫",
      "en": "…",
      "desc": "…",
      "topUnderbust": { "…": "…" },
      "meta": { "…": "…" }
    }
  ]
}
```

- 紀錄的欄位來源有兩個，且合併後的位置必須與現在相同：
  - 現行 Markdown 的 zh、en、desc。
  - `item_metadata.json` 與 `outfit_preset_metadata.json` 合併進來的欄位：`item_metadata.json` 的欄位放在頂層，`outfit_preset_metadata.json` 的欄位放在 `meta`。
  - 例外：`item_metadata.json` 原有的 `stableId` 與 `legacyIds` **不搬原樣**，改由紀錄的 `id` 與凍結後的 `legacyIds` 取代（§4.3.3）。
- 紀錄**不包含** manifest 衍生的鍵：`meta.referenceImageId`、`meta.referenceImage`、`meta.referenceImageFormat`。這三個鍵仍由 sync 在輸出時從 `wardrobe_reference_manifest.json` 合併（`sync_to_json.py:222-227`）。
- **Regional 分區**的紀錄要拆開存放：`inspiration`（來源專用欄位，不輸出）與 `desc`（只放本文）。sync 輸出時用 `inspiration | desc` 組回，結果必須與現行相同（`sync_to_json.py:74-75`）。現有 26 條都恰好含一個 ` | ` 分隔符。
- 假值必須保留，不能被當成空值移除，例如 `outerwearFastenerRequirement: ""`、`randomEligible: false`（`engine.js:3345-3346`）。
- 欄位的鍵順序必須與現行 `database.json` 相同。
- `entries` 陣列的順序決定 UI 的顯示順序，**不再影響 ID**。

#### 4.3.3 凍結內容

一次性遷移腳本 `scripts/migrations/migrate_catalog_to_json.mjs` 使用 `getCompiledCatalogForTesting().entries`，依 `group`、`category`、陣列索引，把 database.json 的每一條對應到 buildEntries 的輸出。兩邊在這個階段尚未經過後處理，索引一一對應；腳本要逐條斷言兩邊的 `en` 相同，作為對應正確的檢查。對應完成後寫入兩個欄位：

1. **`id`**：等於 buildEntries 產生的主 ID（`engine.js:3301` 的結果）。原本已有 stableId 的 37 條沿用原值。
2. **`legacyIds`**：等於 **`entries` 中該條的 legacyIds**，也就是只包含 buildEntries 產生的部分：
   - 原有的顯式 legacyIds
   - 依列序自動產生的 rawZh 別名（`engine.js:3296`）
   - 環境光的舊分類別名（`engine.js:3297`）

`buildCatalog` 在 buildEntries 之後由 legacy 表追加的 ID（`engine.js:3400-3407`）**不寫入紀錄**。這部分留在 legacy 表，3b 會集中管理。

`entries` 本來就不含這些追加的 ID，所以紀錄不會形成雙重來源。遷移腳本必須斷言：寫入的每個 legacyIds 陣列，都等於 `entries` 中對應條目的陣列，順序也相同。

遷移完成後，把所有凍結的主 ID 寫入 `id_registry.json`，標記為 `frozen`。

#### 4.3.4 sync 與 engine 的修改

**`sync_to_json.py`：**

- 改為讀取 `knowledge_base/catalog/**/*.json`。
- 輸出的 `database.json` 每條帶 `stableId`（等於 `id`）與 `legacyIds`；其餘欄位的內容與鍵順序維持不變。
- 保留「同分類 zh 唯一」檢查（`sync_to_json.py:109-117`），因為 manifest 是依名稱合併的。
- 保留 manifest 的合併與驗證邏輯。
- 新增驗證：zh、en、desc 不得含 `|` 或換行，以保護 Markdown 總覽與舊解析器。
- 新增驗證：`id`、`zh`、`en`、`desc` 不得為空字串。這項在 1c 由 sync 自己檢查；2a 建立 schema 後改由 schema 負責。

**engine `buildEntries`：**

- 條目**同時有 `stableId` 與 `legacyIds` 陣列**時，不再依列序產生 rawZh 別名與環境光別名，直接使用資料中的 `legacyIds`。
- 其他條目維持現行行為。
  - 例如 `bodyTypeLegacyFixtures.json` 的 8 條，只有 stableId、沒有 legacyIds，這類測試 fixture 的行為不變。

**物件型自訂 library：**

- `getKnowledgeBaseSnapshot()`（`engine.js:3456`）回傳的條目，在 1c 後會帶 `stableId` 與 `legacyIds`。
- 唯一會產生重複 ID 的測試是 `engineSubjectKeyLightCompatibility.test.js:62-66`：它以 `structuredClone` 複製「機頂直閃」，改 zh 後 push 回同一分類。
  - 本步驟要調整這支測試：**只對新複製出來的那一條**刪除 `stableId` 與 `legacyIds`。斷言的意圖不變。
- 以下兩支測試**不調整**：
  - `shibuyaCrowdScene.test.js:80-86` 只修改既有條目的 `en`，沒有複製。
  - `sceneIntegratedAssemblyTestSupport.js:19-22` 把整份 snapshot 當成 library，沒有複製。刪除 stableId 反而會讓 15 條 ID 改變。
- 實作時要用 grep 找出所有「複製目錄條目後加入 library」的測試，套用同樣的處理，並把清單寫進交付報告。
- 完整性檢查新增一項 `confirmed` 檢查：同一 control 內的 ID 必須唯一。

**退役的檔案：**

- `item_metadata.json`、`outfit_preset_metadata.json` 的內容併入紀錄後刪除。
- 6 份 Markdown 改為自動產生的唯讀總覽，見 §4.3.5。
- `scripts/tests/test_sync_to_json.py` 改為測試新的讀取與合併流程，現有 2 個測試的意圖要保留。

#### 4.3.5 唯讀 Markdown 總覽

- `sync_to_json.py` 依紀錄重新產生 `knowledge_base/*.md`，檔名、表格欄位與現在相同，所以 40 份既有文件的路徑引用不會失效。
- 遷移時，把每份 Markdown 的標題、前言、表頭行、分隔行**逐字擷取**進 `index.json`，產生時原樣輸出。這樣 `scripts/prompt_generator.py` 跳過表頭的規則（依賴 `| :---`、`| 維度分類`、`| 攝影風格` 等字面前綴）仍然成立。
- 產生表格列的規則：
  - 欄位順序、反引號包法與現行相同。
  - 不輸出空白格。§4.3.4 的空值驗證保證必填欄位不會是空的。
  - Regional 依 `inspiration` 與 `desc` 拆成兩欄。
- 每份總覽在標題下方加一行固定警語：

  > AUTO-GENERATED from `knowledge_base/catalog/`. Do not edit. Run `python3 scripts/sync_to_json.py`.

- `--check` 同時驗證 `database.json` 與 6 份總覽都和來源一致。

#### 4.3.6 遷移驗收

1. **database.json**：新舊兩邊的每條都先剝除 `stableId` 與 `legacyIds`（舊版原本有 37 條 stableId、36 條 legacyIds），用保留鍵順序的 `JSON.stringify(…, null, 2)` 序列化後，位元組必須相同。
2. **Markdown**：用現行 `parse_markdown_table` 分別解析新產生的總覽與舊 Markdown，結果必須相同。用 `prompt_generator.py` 的解析函式比對，結果也必須相同。
3. I1–I9 全部通過，三份快照零 diff。

#### 4.3.7 凍結期與前置檢查

開始 1c 之前：

- `git status` 中，`knowledge_base/`、`webapp/src/data/`、`webapp/src/lib/engine.js`、`webapp/src/lib/engine/`、`scripts/` 都不得有未提交修改。如果有，停止並回報，不得覆蓋。
- 用 AGENTS.md 的 Session Synchronization 機制通知進行中的 session：1c 完成並提交前，不新增或修改目錄資料，也不改 `engine.js`。

1c 提交後解除凍結。

### 4.4 1d：ID 規則

**`id_registry.json` 是只增不減的登記簿**，記錄每個發出過的主 ID 與狀態：

| 狀態 | 意義 |
| --- | --- |
| `frozen` | 1c 凍結的舊格式 ID |
| `active` | 1d 之後新增、符合新格式的 ID |
| `retired` | 已刪除；必須附 `reason` 與 `replacedBy`（若有） |

新條目 ID 的格式為 `<group>:<分類slug>:<英文短名>`：

- `<group>` 是以下其中之一：`wardrobe`、`camera`、`locations`、`character`、`regional`、`negative`。
- `<英文短名>` 是小寫英文 kebab-case，**不含列序**。
- 範例：`wardrobe:上身-tops:cropped-knit-cardigan`

`sync_to_json.py` 驗證以下規則：

1. 每條都有 `id`，且全域唯一。
2. 紀錄中的每個 `id` 都必須已在登記簿中，狀態為 `frozen` 或 `active`。新增條目要同時新增登記。
3. 登記為 `active` 的 ID 必須符合新格式；`frozen` 不受此限。
4. 改名時只改 `zh`、`en`、`desc`，**不改 `id`**。
5. 刪除條目時，登記簿要把該 ID 改為 `retired`。若要讓舊存檔導向替代條目，就把舊 ID 加入替代條目的 `legacyIds`。
   - 替代條目必須在**同一分類**，因為舊 ID 只會在同一 control 內解析（`engine.js:3897-3901`）。
6. 任何 `legacyIds` 都不得與同分類內其他條目的 `id` 或 `legacyIds` 重複。
7. 登記簿中的 ID 不得刪除，也不得改給其他條目使用。
8. **反向檢查**：登記為 `frozen` 或 `active` 的每個 ID，都必須存在於某一條紀錄的 `id`。直接刪除紀錄、卻沒有把登記改成 `retired`，就會失敗。

1d 必須附 Python 單元測試，涵蓋以上 8 條規則的通過與失敗案例。

---

## 5. Phase 2：正式 schema

### 5.1 2a：目錄紀錄 schema

新增 `knowledge_base/catalog/schema.json`，結構如下：

```json
{
  "common": { "required": ["id", "zh", "en", "desc"], "properties": { "…": {} } },
  "sections": {
    "Wardrobe": {
      "properties": { "…": {} },
      "categories": { "上身 (Tops)": { "properties": { "topUnderbust": {} } } }
    }
  }
}
```

- **欄位合併**：每條紀錄允許的欄位，是 `common`、所屬 `section`、所屬 `category` 三層的 `properties` 合併結果。每一層的欄位定義使用 JSON Schema 子集。
- **最小驗證器**：`sync_to_json.py` 內建一個最小驗證器，只支援 `type`、`enum`、`required`、`properties`、`items`、`additionalProperties`、`pattern`、`minLength`。不新增 Python 依賴。
- **未知欄位**：遇到未知欄位直接報錯。
- **必填與空值**：必填字串不得為空字串；但是 schema 明確允許的假值必須保留，例如 `outerwearFastenerRequirement: ""`。
- **與 engine 白名單一致**：先對 schema 的頂層欄位做兩步轉換：
  1. 移除 sync 專用欄位。目前只有 `inspiration`。
  2. 把 `id` 換成 sync 實際輸出的 `stableId`。

  轉換後的欄位集合，必須等於 engine `buildEntries` 的讀取白名單（`engine.js:3301-3350`）。sync 專用欄位的清單寫在 `schema.json` 的 `syncOnly` 陣列中。完整性檢查會比對兩者，避免新欄位被 engine 靜默丟棄。
- **錯誤訊息**：要包含檔案、條目 `id`、欄位路徑、預期值、實際值。
- **測試**：附 Python 單元測試，涵蓋驗證器支援的每個關鍵字，以及三層合併的情境。

### 5.2 2b：內嵌目錄納入檢查（只驗證，不搬家）

`check_catalog_integrity.mjs` 增加以下檢查：

| 模組 | 檢查 |
| --- | --- |
| `webapp/src/lib/engine/characterProfiles.js` | 必填結構化欄位存在且非空；`distinctiveFeatures` 正好 4 項；`legacyIdentityAndBody` 非空 |
| `webapp/src/lib/engine/characterProfiles.js`、`webapp/src/lib/characterCardLab.js`、`webapp/src/lib/engine/midjourneyCardItemNames.js`、`knowledge_base/character_reference_manifest.json`、`webapp/src/lib/engine.js` 的 `CHARACTER_PROFILE_CONTROL_ORDER`（`:342`） | 五方的角色卡 ID 集合一致。排序表缺項的卡片會被靜默過濾（`engine.js:380`） |
| `webapp/src/lib/engine/poseComposerOptions.js`、`duoOptions.js`、`fixedCompositionOptions.js` | ID 唯一；`hiddenForBases` 等 meta 引用的值存在；legacyIds 沒有歧義 |
| `webapp/src/lib/engine/` 下的 overlay：`ambientLightDescriptions.js`、`zImageSceneDetailPriority.js`、`midjourneyItemNames.js` 等 | key 存在於目錄。有「原文 pin」的 overlay，pin 必須等於目錄目前的原文。「原文 pin」是指 overlay 除了 ID 之外，另外存了目錄條目的 zh、en 等原文（例如 `ambientLightDescriptions.js` 的 `source`），用來在原文改動時阻擋 overlay 繼續套用 |

已知不一致的處理依 §4.2.2 的嚴重度規則。

### 5.3 2c：文件與工作流程更新

修改 `Docs/` 下既有檔案之前，先建立 `.bak` 副本。需要更新的文件：

- `AGENTS.md`：
  - Validation Matrix 的「Knowledge-base Markdown or manifests」列，改為以 `knowledge_base/catalog/*.json` 為來源。
  - 加入 ID 規則、`id_registry.json`、「Markdown 總覽是自動產生的」等提醒。
- `README.md:74`、`Docs/THE_ARCHITECT.md:16`、`Docs/outfit_preset_schema_migration.md`：目前仍指示修改 Markdown，改為新流程。
- A、B、C、D 四份撰寫指引：
  - 「新增選項流程」改為 JSON 紀錄流程。
  - 補上 ID 規則、schema、快照更新流程。
  - 移除「只能 append」的限制。
- `Docs/current_project_state.md`：更新「Key Files」的資料來源路徑，並新增一條本規格的狀態紀錄。
- `Docs/specs/engine-architecture.md`：更新資料流說明。
- `AGENTS.md` 與 `Docs/specs/frontend-visual-validation.md:15`：目前寫「five」個工作區，改為實際的六個，名稱與 I9 列出的一致。

---

## 6. Phase 3：語意資料化與舊資料集中

### 6.1 3a：推論 meta 寫入資料

#### 6.1.1 一次性寫入

一次性腳本 `scripts/migrations/materialize_catalog_semantics.mjs` 讀取 `getCompiledCatalogForTesting().entries` 中每條的 `inferredMeta`，也就是 buildEntries 實際呼叫 `infer*Meta` 得到的回傳值，然後**原樣**寫入紀錄的 `meta.semantic`。腳本不自行重算推論。

寫入的是推論函式輸出的整個物件：

- 包含 tags，以及 family、visibility、archetype 等推論出的鍵。
- 保留原本的鍵順序與 tags 順序。
- **不包含** source meta 的 tags 與 `subjectLight.tags`。這兩者仍是獨立來源，由 `buildEntries` 照現行邏輯合併。

#### 6.1.2 engine `buildEntries` 的修改

條目有 `meta.semantic` 時：

- 以 `meta.semantic` **取代** `inferredMeta` 原本的位置，不再呼叫 `infer*Meta`。
- 從 sourceMeta 中**剝除** `semantic` 鍵後再展開，讓編譯後的 meta 不出現 `semantic` 鍵。
- 覆蓋順序維持為：semantic（原 inferred）→ sourceMeta → 各個顯式欄位 → `tags`。
- `tags` 合併式改為 `withTags([...semantic.tags, ...sourceTags, ...subjectLightTags])`，順序與現行相同。

沒有 `meta.semantic` 的條目，維持推論。目前只會出現在物件型或陣列型的自訂 library。

#### 6.1.3 schema 與驗收

- schema 改為要求所有目錄紀錄都有 `meta.semantic`，並以 `enum` 列出各分區允許的 tag 值。
- 驗收條件：I3 零 diff。

#### 6.1.4 已知錯誤標籤原樣凍結

例如以下標籤，這次不修正：

- `戶外：倫敦排屋街道` 的 `subterranean`
- 被 `small`→`mall` 誤標的 17 個 `commercial`

這些錯誤要逐條列入 `Docs/reports/database-analysis-2026-10-11/frozen-known-issues.md`，交給 Phase 4。

#### 6.1.5 保留推論函式

- `infer*Meta` 函式保留，作為自訂 library 的退路，也作為 Phase 4 的比對基準。
- 新增條目時，必須手動明確填寫 `meta.semantic`。
- 另提供常駐腳本 `scripts/suggest_catalog_semantics.mjs <id>`，只輸出推論建議值，不會寫入檔案。它的做法是：在記憶體中複製一份 database，把該條的 semantic 拿掉，傳給 `getCompiledCatalogForTesting(modifiedDatabase)` 編譯，再讀出該條的 `inferredMeta`。

### 6.2 3b：舊資料對照集中

**本步驟只搬家並加上驗證。不改變資料的值，也不改變比對邏輯。** 把目標從 zh 改成 id 會改變比對邏輯，不在本規格範圍內。

#### 6.2.1 3b-0：清點，交付前先停下確認

1. 列出 `engine.js` 中所有符合下列條件的頂層常數：
   - 名稱含 `LEGACY` 或 `MIGRATION`。
   - **純資料**：只由字串、數字、布林、陣列、物件字面值組成，或由字面值經 `.map()` 等計算產生。
   - **不限行數**：審查發現 `POSE_COMPOSER_ARRANGEMENT_TO_ANCHOR_MIGRATIONS`（`:2997`）、`LEGACY_HAIR_STYLING_STATE_MIGRATIONS`（`:3491`）只有 3-4 行，先前以「至少 5 行」篩選時被漏掉。
   - 函式或函式陣列不列入，例如 `AI_LEGACY_SINGLE_RENDERER_HELPERS`（`:15784`）是 renderer 函式陣列，不是資料。
2. 每張表要記錄：
   - 名稱、行號
   - 每個欄位的 `fieldKind`（見 §6.2.2）
   - 是否有載入時才計算的部分（例如 `:2915-2918`、`:3171` 之後用 `.map()` 搭配 slugify 算出 legacyId）
   - 使用它的 migration 函式
3. 把清點表寫進交付報告，**停下來等 Cooper 確認後**才進行 6.2.3 的搬遷。

#### 6.2.2 欄位類型與驗證

每張表的每個欄位都必須宣告一種 `fieldKind`。全部由 `check_catalog_integrity.mjs` 驗證；Node 可以同時載入目錄與 JS 內嵌模組。

| fieldKind | 意義 | 驗證 |
| --- | --- | --- |
| `catalog-zh` | 值是某個目錄分類中條目的 zh，例如 `targetZh`、`dressZh`，以及 `CAMERA_PROFILE_RENDERING_MIGRATIONS` 指向「底片與相機模擬」條目的值（`:2725`） | 表要宣告 `category`；值必須是該分類現存條目的 zh（以 buildEntries 的 displayZh 為準） |
| `embedded-ref` | 值指向 JS 內嵌目錄的 zh 或 id，例如 `handZh`、`propZh`、`arrangementZh`、`headZh`、`anchorZh`、`baseZh` 指向 Pose Composer | 表要宣告來源模組與比對欄位；值必須存在於該模組 |
| `attribute` | 值是有限列舉的屬性值，例如 `stateZh`、`frameZh`、`colorZh`、`placementZh`、`openingZh` | 逐表定義合法值集合，來源可以是目錄某分類的 zh，或明列清單 |
| `legacy-key` | 舊值本身，例如舊 ID、舊標籤、`label` | 同一張表內不得重複；由它推出的舊 ID 不得等於**其他條目**的現行 ID。等於目標條目自己的現行 ID 是合法的，例如 `engine.js:2725` 的 `['復古微對比銳利感', 8]` |

如果清點時遇到無法歸入以上四類的欄位，就新增類型並在清點表中說明，不得硬塞進既有類型。

#### 6.2.3 搬遷

- 把清點確認後的表，以**來源形式**寫入 `knowledge_base/catalog/legacy_mappings.json`：
  - 每張表宣告 `fields`（欄位名 → fieldKind、category 或來源模組）。
  - 只存放字面值資料，不存放 `.map()` 計算後的結果。
- `sync_to_json.py` 把這個檔案原樣輸出到 `webapp/src/data/legacyMappings.json`。
- engine 改從這個檔案讀取來源資料。**載入時的衍生計算（`.map()`、slugify）保留在 engine**，計算方式不變。
- 所有 migration 函式的比對邏輯完全不變，包括：
  - `item.zh === targetZh` 這類比對（`:3201` 等處）
  - 找不到時靜默 `return`（`engine.js:3202-3277`）

  改由 §6.2.2 的驗證保證目標一定存在。
- `shoulder-lean`、`leaning-shoulders` 維持現行的「取第一個命中」行為，等待 J12 決定。
- 驗收：
  - I1–I9 全部通過，既有舊 lock 遷移測試全部通過。
  - 搬遷**之前**，先把每張表在 engine 內嵌版本的計算結果（含 `.map()` 衍生值）序列化成 fixture，存到 `webapp/src/lib/engine/legacyMappings.baseline.json`。
  - 新增一個測試：比對「從資料檔載入並經 engine 計算後」的每張表，必須與這份 fixture 逐項相同。
  - 這份 fixture 與測試在刪除內嵌版本後仍要保留，作為永久的等價基準。

---

## 7. 交付方式

| 順序 | 子步驟 | 主要產出 | engine 修改 |
| --- | --- | --- | --- |
| 1 | 1a 快照 | 三份快照、快照測試、更新指令 | 新增 `getCompiledCatalogForTesting()`，只供測試；在 buildEntries 階段取得 `entries` 與 `inferredMeta` |
| 2 | 1b 完整性檢查進 CI | `check_catalog_integrity.mjs`、允許清單、CI 步驟 | 否 |
| 3 | 1c 格式遷移與 ID 凍結 | `knowledge_base/catalog/`、新版 sync、Markdown 總覽、複製條目類測試的調整 | `buildEntries` 改為：同時有 stableId 與 legacyIds 時，不產生別名 |
| 4 | 1d ID 規則 | `id_registry.json` 驗證、`retired` 流程、Python 測試 | 否 |
| 5 | 2a schema | `schema.json`、最小驗證器、Python 測試 | 否 |
| 6 | 2b 內嵌目錄檢查 | 完整性檢查擴充 | 否 |
| 7 | 2c 文件更新 | AGENTS.md、README、四份撰寫指引等 | 否 |
| 8 | 3a 語意資料化 | `meta.semantic`、凍結問題清單 | `buildEntries` 改讀 semantic |
| 9 | 3b 舊資料集中 | 3b-0 清點表（停下確認）→ `legacy_mappings.json`、`legacyMappings.json`、等價測試 | legacy 表改從資料檔讀取來源資料；衍生計算與比對邏輯不變 |

- **執行順序**：依上表順序執行。每個子步驟獨立實作、獨立驗收，交付報告要列出 I1–I9 的結果與快照 diff。
- **提交**：每個子步驟完成後，向 Cooper 回報並**停下等待**。只有 Cooper 明確指示才 commit；下一個子步驟必須在前一個子步驟已提交之後才開始。不得 push 或 deploy。
- **其他 session 有新提交時**：如果子步驟之間有其他 session 提交，先更新到最新 HEAD，再用 `update_catalog_snapshots.mjs` 重新產生基準快照並檢查 diff。確認 diff 只來自對方的變更後，才繼續下一步。
- **一次性腳本**：`scripts/migrations/` 下的遷移腳本執行完畢後保留在 repo，作為稽核紀錄，不接進 CI 或 npm scripts。每支腳本開頭都要註明「一次性，已於 <commit> 套用，請勿重跑」。
- **回退**：每個子步驟一個 commit，可以單獨 revert。但 1c 之後的子步驟都依賴 1c，回退 1c 時必須一併回退後續子步驟。

## 8. 風險與對策

| 風險 | 對策 |
| --- | --- |
| 1c 的 diff 很大，難以人工審閱 | 以機器比對驗收：§4.3.6 位元組比對，加上 I1–I3 零 diff。人工只審新增的程式碼 |
| 其他 session 在凍結期修改資料或 engine | 執行 §4.3.7 前置檢查並發出通知。發現衝突時停止並回報，不自行合併 |
| 漏掉某種舊 ID 形式，造成舊存檔失效 | I2 比對完整 legacyIds；I6 跑 Saved Cards 還原測試；I9 實際還原至少一張舊存檔 |
| 自訂 library 複製條目，造成 ID 重複 | §4.3.4 調整測試資料；完整性檢查新增「同 control 內 ID 唯一」 |
| Codex 依舊習慣直接改 Markdown | 總覽開頭有警語；`--check` 會讓 CI 失敗；2c 同步更新 AGENTS.md 與撰寫指引 |
| 快照淪為「改了就更新」 | 只能用專用指令更新；交付報告必須逐條說明 diff；本規格三個階段的預期 diff 為零 |

## 9. 待決事項（不阻擋本規格）

| 編號 | 事項 | 目前處置 |
| --- | --- | --- |
| J12 | 雙人 `shoulder-lean`、`leaning-shoulders` 舊值的正確去向 | 維持現行行為，列入允許清單 |
| B3 | 角色卡 cardLab 與 profile 之間 12 段不一致 | 列為 `possible`，只報告 |
| Phase 4 | 修正報告 §4 A 類問題：控制語、錯誤標籤、相容漏洞、固定色套裝、角色卡成年身份 | 另立規格，逐項核准 |
