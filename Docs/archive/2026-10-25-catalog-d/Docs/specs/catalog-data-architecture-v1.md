# 目錄資料架構 v1：穩定 ID、正式 schema、語意資料化

- 文件修訂：**v1.1，2026-10-24**；保留既有檔名，供原連結繼續使用。
- 狀態：A／B 已驗收交付；Cooper 已確認凍結並授權 C。2026-10-25 以最新 main `64870460e8a153a07baf953df0d6cf784ce2aca4` 完成 C 本機切換及 I1–I9 驗收，正式來源為分類 JSON。Cooper 已確認驗收通過並授權僅提交／推送本批 C；實際交付與 CI 結果另行核對。D、E、P5b 未開始。見 §13、§13.1。
- 範圍：保留原 Phase 1–3 的工作內容，執行順序改為 §7 的 A–E 階段；所有遷移均不改公開 Prompt、UI 顯示、隨機選取行為或使用者存檔格式。已知內容問題另立 Phase 4。
- 依據：[資料庫完整分析報告](../reports/database-analysis-2026-10-11/README.md) 與 [2026-10-13 決策](../decisions/2026-10-13-catalog-data-architecture.md)。原決策保留為歷史紀錄；執行細節以本修訂為準。
- 原 A 基準版本：`0746b280cc9f5c00daec7dadc73329779ac658e9`。2026-10-24 後續授權對齊的本機與 GitHub `main` 為 `2f56438804e751de4556060b293231966d6ea3b3`；原基準永久保留，新版本另建 manifest。基礎目錄為 6 分區、56 分類、1,050 條，37 條有 `stableId`；執行期為 219 個 controls、4,771 個 options。這些是基準觀察值，不是永久限制。
- 實作基準：開始 A 時重新核對最新 `main`、遠端 SHA、工作樹與相關 diff，記錄明確的 `baselineCommit`。原 `e86703e` 指定動作已納入 main，不再以等待該分支合併為前置條件。原 A 使用 `0746b28`，本輪新增 `2f56438` 的獨立對齊紀錄；詳見 §11。
- 工作目錄：目前 main 位於 `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`。依 root AGENTS 直接在現有 main 開發，不另建功能分支；開始前仍須重新確認路徑與分支，保護原專案目錄及其他 session 的工作。
- 下文保留的舊程式行號僅供歷史追查，實作一律依函式／常數名稱定位；不得將舊資料數字、測試數量或舊驗收結果當成新版已通過的證據。

### 本次對齊的現況與邊界

- C 已啟用分類 JSON＋index＋id_registry＋manifest，經 schema／歷史 ID 驗證後產生 `database.json` 與六份唯讀 Markdown。舊 metadata 已完整併入分類紀錄；A 快照與輸出基準不變。B 的 Markdown／隔離演練敘述保留為切換前歷史。
- 新增 `lyingSurface` 來源欄位，目前 47 條場景具有此資料；新版指定動作、站／蹲／坐／跪／躺姿、頭部／視線與觀察式抓拍均須納入基準。
- Z-Image 已有 2026-10-23 的[同場段落版本 C](z-image-scene-first-tidy-v1.md)：人物開頭、方位去重、環境光句合併及側面幾何改寫都屬既有行為，不得用舊版快照還原。
- 現行五個主工作區是 Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、Saved Cards。動作與觀察式抓拍在主工作台內驗證，舊資料仍保留相容性。
- 四主輸出為 Gpt／Z-Image／Midjourney／Nano Banana，另有 GPT 胸上與全身角色照；依當前輸出契約保留各模式的有效／不適用狀態。歷史 MJ 胸上只做舊卡還原與序列化驗證，不恢復生成入口。

---

## 1. 背景

目錄資料的設計已使用約一年，資料格式沒有跟上需求成長，目前有三個結構問題。

1. **ID 不穩定。** database.json 的 1,050 條中，有 1,013 條（96.5%）的 ID 由「分類＋中文名＋列序」組成（`engine.js:3301`）。改名、插入、重排都會讓 Saved Cards 與 lock 裡存的 ID 失效；失效的 ID 會靜默退回「全無」（`engine.js:3905`）。
2. **schema 分散。** 一條資料的完整定義分散在 4 處，三種合併方式不同，也沒有正式 schema：
   - Markdown 四欄表格
   - `item_metadata.json`
   - `outfit_preset_metadata.json`
   - engine 的條件式欄位讀取與映射（`buildEntries`；不是獨立的正式 schema）
3. **語意靠推論。** 相容 tags 主要由 `infer*Meta` 從 zh、en、desc 文字推論（`engine.js:1585-1587`、`:1680-2600`）。已有 6 條 Light Style 使用顯式的 `subjectLight.tags`，但多數語意仍依賴推論（`engine.js:3333`、`:3350`）。因此改一句 desc，就可能靜默改變相容矩陣。

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

以下是不改行為的實作驗收契約。每個執行階段交付時須列出 I1–I9 證據；尚未建立的工具明列不適用與其開始生效階段，不可視為已通過。最初的 v1.1 文件修訂僅做連結／路徑、內容一致性與 diff 檢查；後續 A 授權與驗收見 §11。

| # | 不變量 | 驗證方式 |
| --- | --- | --- |
| I1 | 每個 control 的選項 ID 陣列（含順序）與快照相同 | 控制項快照（§4.1），鍵為 `controlKey` |
| I2 | 每個 control 選項的 legacyIds 與快照相同；目錄層每條的 ID 與 legacyIds 也與快照相同，包含不在任何 control 裡的 Negative 19 條 | 控制項快照＋目錄快照（§4.1） |
| I3 | 每個 control 選項與目錄條目編譯後的 `meta` 逐鍵相同，包括鍵的順序與 tags 順序 | 語意快照（§4.1） |
| I4 | 全部固定驗收案例的有效輸出、選擇與摘要不變，案例集合完整 | §3.1 的不可變基準與完整差異比對；另跑 `npm run test:prompt-quality`，後者不代替跨版本逐字比較 |
| I5 | 同 seed 抽選結果與亂數呼叫次數不變，audit 無新增診斷／阻擋 | 根目錄執行 `node scripts/validate_prompt_logic.mjs 200 prompt-quality-baseline --strict` 並比對報告；§3.1 另保存同一 audit 情境的完整輸出、selection 與亂數計數，不能以統計相同代替內容相同 |
| I6 | Saved Cards 還原、舊 lock 遷移、匯入匯出相容 | 既有測試＋§3.2 固定舊 payload／Markdown／JSON round-trip 案例；不得重寫歷史 Prompt 或使用者資料 |
| I7 | 前端完整檢查通過 | `webapp/` 執行 `npm test`、`npm run lint`、`npm run build`。失敗須以變更前 `baselineCommit`、相同環境與 seed 證明是否既有；不沿用舊文件指稱的 flaky 豁免，不修改無關程式 |
| I8 | 資料層與歷史 ID 保護通過 | sync `--check`、Python unit tests、公開資產檢查；B 起加完整性 strict 與 schema 測試；C 起加 §4.4 的歷史登記簿比較，不能只查目前檔案自洽 |
| I9 | 瀏覽器實際操作與下游正常 | 依 frontend visual validation，1440×1000／390×900 檢查現行五工作區及 §3.2 路徑；使用隔離收藏／草稿與模擬生成，不提交付費請求，不改使用者實際收藏 |

目錄快照只能用A 建立的 `scripts/update_catalog_snapshots.mjs` 產生。A 完成後封存基準；遷移不得重新錄製預期值來消除差異。所有階段的編譯後目錄、完整輸出與行為基準預期差異為零；來源檔格式與新增明確 ID／semantic 的差異則依 §4.3.6、§6.1 單獨驗證。

### 3.1 完整輸出基準與比較工具（A 階段建立）

1. **先修工具，再封存舊行為。** 可沿用 `scripts/dump_prompt_outputs.mjs` 的取樣與輸出資料，但須先修正比較模式只看交集、`UNRESOLVED` 可通過與固定 exit 0 的缺口。工具變更先在未改引擎行為的版本驗證，再記錄基準 commit；不能用遷移後 renderer 補錄舊預期值。
2. 保存 baseline manifest：完整 `baselineCommit`、Node／套件鎖版本、生成器與 fixtures 雜湊、案例 ID 清單、原始 locks、每案 seed、模式、預期有效輸出欄位，以及基準檔 SHA-256。產生器與案例集合在比較兩端使用同一份；固定原始輸入，不能兩端各自解析改名後標籤或產生不同的全部隨機規則。
3. 每案保存全部公開主／衍生 Prompt、resolved selection、summaryFields、結構化還原資料與亂數呼叫次數；對不適用輸出記錄明確狀態。保留字串的標點、空白、換行與陣列順序，不做語意正規化來掩蓋差異。
4. 只排除經清點的執行期 ID、時間戳等非決定性欄位；排除清單以精確欄位路徑保存並審查，禁止遞迴刪除所有名為 `id` 的鍵。同版本同輸入重跑須相同，否則先處理測試基準的非決定性。
5. 比較時，缺檔、解析錯誤、重複案例 ID、未解析 fixture、案例新增／缺少、有效欄位缺少／新增、任何受保護值差異，都必須非零退出。報告列案例 ID、欄位路徑及前後差異，不能只印摘要後回傳成功。
6. 案例包含所有當前 representative fixtures、同一 audit 場景清單的 `200 / prompt-quality-baseline` 樣本，以及固定輸入的全部隨機、指定動作、§3.2 矩陣。每組的案例數由 manifest 固定，不以總樣本數宣稱所有模式均覆蓋。
7. 工具自身須有通過／失敗驗證：只改標點、調換同長文字、刪除一個案例、雙端均未解析、改 selection、改亂數次數、缺少一種輸出，均須被攔下。只改已核准排除欄位則通過。
8. 基準產物須隨 A 交付保存於版本控制的測試資料位置，manifest 指向產生該證據的完整 commit；中間報告可存 repo 外，但不能只留下暫存目錄路徑作長期證據。新增／調整基準須有獨立審查與原因，不得與遷移差異混在一起。

Prompt Quality 證明契約與片語要求，audit 證明診斷結果，完整基準證明列明案例的逐字與狀態相等；三者皆保留，且有限案例不宣稱涵蓋全部排列組合。

### 3.2 當前案例與還原矩陣

| 面向 | 必須涵蓋 |
| --- | --- |
| 人物／模式 | 一般單人、雙人、角色卡／匯入身份、特殊主體、固定構圖及三種車廂、觀察式抓拍（角色卡與全身角色匯入）；各路徑採自己的有效輸出契約 |
| 動作／鏡位 | 指定動作各群組、頭部／視線、站／蹲／坐／跪／側躺／俯臥／仰躺、躺姿表面、手動座位、自拍道具、主要景別與方向；保留退役 Pose Composer 輸入的既有解析 |
| 資料保護 | 六種 Body Type 與全無、套裝固定黑色下身、外套開合／穿法、配件、`lyingSurface`、環境光／人物光、Z 版本 C、精確畫面文字 |
| 選值與隨機 | 全無／固定／隨機／任意、全部隨機與局部重抽、互斥選項、可選光線集合；保留選項順序及亂數消耗 |
| 使用者資料 | 固定舊 raw ID／legacy ID payload、新舊 JSON 與 Markdown 匯入、收藏保存／reload／還原／重新生成；歷史 Prompt 文字及已退役衍生輸出不得被改寫 |
| 下游 | 角色／場景套用至 PAGE1、六種現行輸出預覽／複製、附加文字與明確帶入 DLL 的最終文字、DLL 隔離草稿恢復；不改生成供應商或發送真實請求 |

基礎目錄的每個既有 ID／別名都須在目錄與最終 control 層驗證擁有者、解析結果及順序；沒有 control 的 Negative 仍由目錄快照覆蓋。抽樣舊收藏不能代替逐 ID 檢查；也不能把暫時未在 UI 顯示的舊選項當成可刪資料。

---

## 4. Phase 1：安全網與 ID 凍結

### 4.1 1a：快照（A）

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

### 4.2 1b：完整性檢查進 CI（B）

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
- 2026-10-24 唯讀複核仍只有一種 confirmed 代碼，初始允許清單拆成兩筆項目鍵：`LEGACY_ID_AMBIGUOUS` + `duoPoseId:shoulder-lean`、`duoPoseId:leaning-shoulders`，`decisionRef` 為報告 J12。B 開始時重新核對，不自動把新問題加入允許清單。
  - `CARD_LAYER_DUPLICATION`（12 段不一致）屬於 `possible`，不必列入允許清單。

#### 4.2.3 CI 位置

放在 `.github/workflows/deploy.yml` 的 webapp 品質 job，排在 `npm ci` 之後、`npm test` 之前。新增一個步驟，從 repo 根目錄執行：

```bash
node scripts/check_catalog_integrity.mjs --strict
```

**不可**放在 Python 資料檢查那一段，因為那一段在 Setup Node 之前執行。

#### 4.2.4 後續階段必須同步更新

1c、3a、3b 都會改動此腳本依賴的來源，例如：

- 1c 刪除已併入紀錄的 `item_metadata.json`，並切換讀取來源。
- 3a 讓 tags 變成顯式資料。
- 3b 搬移 legacy 表的來源檔路徑；targetZh 值與既有比對邏輯完全不變。

這三個子步驟都必須在同一次交付中更新本腳本與允許清單，並通過 `--strict`。

### 4.3 1c：格式遷移與 ID 凍結（C）

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
- `entries` 陣列的順序不再決定 ID，但仍可能影響 UI、候選池與同 seed 抽樣。此次保持全部順序不變；日後重排須另驗證，不因 ID 固定而視為無行為影響。

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

- 依 `knowledge_base/catalog/index.json` 的明確清單與順序讀取分類 JSON，不把 schema、登記簿或 legacy 表當成分類。拒絕重複、缺少、多餘分類檔及超出目錄的路徑；不得依檔案系統列舉順序改變抽樣池。
- 輸出的 `database.json` 每條帶 `stableId`（等於 `id`）與 `legacyIds`；其餘欄位的內容與鍵順序維持不變。
- 保留「同分類 zh 唯一」檢查（`sync_to_json.py:109-117`），因為 manifest 是依名稱合併的。
- 保留 manifest 的合併與驗證邏輯。
- 新增驗證：zh、en、desc 不得含 `|` 或換行，以保護 Markdown 總覽與舊解析器。
- 新增驗證：`id`、`zh`、`en`、`desc` 不得為空字串。B／2a 先完成 schema 驗證器，C／1c 切換來源時即強制套用，不保留無 schema 的正式過渡期。

**engine `buildEntries`：**

- 條目**同時有 `stableId` 與 `legacyIds` 陣列**時，不再依列序產生 rawZh 別名與環境光別名，直接使用資料中的 `legacyIds`。
- 其他條目維持現行行為。
  - 例如 `bodyTypeLegacyFixtures.json` 的 8 條，只有 stableId、沒有 legacyIds，這類測試 fixture 的行為不變。

**物件型自訂 library：**

- `getKnowledgeBaseSnapshot()`（`engine.js:3456`）回傳的條目，在 1c 後會帶 `stableId` 與 `legacyIds`。
- 已知例子是 `engineSubjectKeyLightCompatibility.test.js`：它以 `structuredClone` 複製「機頂直閃」，改 zh 後 push 回同一分類；此例不是完整清單，需依當前 main 重新搜尋。
  - 本步驟要調整這支測試：**只對新複製出來的那一條**刪除 `stableId` 與 `legacyIds`。斷言的意圖不變。
- 以下兩支測試**不調整**：
  - `shibuyaCrowdScene.test.js:80-86` 只修改既有條目的 `en`，沒有複製。
  - `sceneIntegratedAssemblyTestSupport.js:19-22` 把整份 snapshot 當成 library，沒有複製。刪除 stableId 反而會讓 15 條 ID 改變。
- 實作時要用 grep 找出所有「複製目錄條目後加入 library」的測試，套用同樣的處理，並把清單寫進交付報告。
- 完整性檢查新增一項 `confirmed` 檢查：同一 control 內的 ID 必須唯一。

**退役的檔案：**

- `item_metadata.json`、`outfit_preset_metadata.json` 的內容併入紀錄後刪除。
- 6 份 Markdown 改為自動產生的唯讀總覽，見 §4.3.5。
- `scripts/tests/test_sync_to_json.py` 改為測試新的讀取與合併流程，保留當前同步測試的意圖，數量以實作基準為準。

#### 4.3.5 唯讀 Markdown 總覽

- `sync_to_json.py` 依紀錄重新產生 `knowledge_base/*.md`，檔名、表格欄位與現在相同，以保留既有文件路徑引用；C 開始前重新清點實際引用。
- 遷移時，把每份 Markdown 的標題、前言、表頭行、分隔行**逐字擷取**進 `index.json`，產生時原樣輸出。這樣 `scripts/prompt_generator.py` 跳過表頭的規則（依賴 `| :---`、`| 維度分類`、`| 攝影風格` 等字面前綴）仍然成立。
- 產生表格列的規則：
  - 欄位順序、反引號包法與現行相同。
  - 不輸出空白格。§4.3.4 的空值驗證保證必填欄位不會是空的。
  - Regional 依 `inspiration` 與 `desc` 拆成兩欄。
- 每份總覽在標題下方加一行固定警語：

  > AUTO-GENERATED from `knowledge_base/catalog/`. Do not edit. Run `python3 scripts/sync_to_json.py`.

- `--check` 同時驗證 `database.json` 與 6 份總覽都和來源一致。

#### 4.3.6 遷移驗收

1. **database.json**：新舊兩邊的每條都先剝除 `stableId` 與 `legacyIds`（明確 ID／別名數量以 A 清點結果為準），用保留鍵順序的 `JSON.stringify(…, null, 2)` 序列化後，位元組必須相同。
2. **Markdown**：用現行 `parse_markdown_table` 分別解析新產生的總覽與舊 Markdown，結果必須相同。用 `prompt_generator.py` 的解析函式比對，結果也必須相同。
3. I1–I9 全部通過，目錄／控制項／語意快照及完整輸出基準零 diff；ID／別名另逐條驗證，不能因第 1 項剝除欄位而漏檢。
4. C 切換前，B 已完成 schema、登記簿驗證器及產生器的測試，但正式來源仍是 Markdown。C 同批啟用分類 JSON、ID 登記、schema strict、產生物一致性與 §5.3 操作文件；不得提交一個新來源尚無驗證或文件仍指向舊來源的中間狀態。
5. `--check` 只讀、正常 sync 先完整驗證再產生所有輸出；驗證失敗不得留下部分新檔。執行前後檢查非允許清單檔案與使用者資料不變。

#### 4.3.7 凍結期與前置檢查

開始 C／1c 之前：

- `git status` 中，`knowledge_base/`、`webapp/src/data/`、`webapp/src/lib/engine.js`、`webapp/src/lib/engine/`、`scripts/` 都不得有未提交修改。如果有，停止並回報，不得覆蓋。
- 確認其他 session 沒有修改同批來源、engine、fixtures 與操作文件；由使用者或已獲明確授權的協調者傳達 Session Synchronization 與凍結範圍。此規格不自行授權跨 chat 傳訊。C 完成、驗收並提交前，不平行修改這些路徑；有重疊即停下確認，不覆蓋他人工作。

C 完整切換交付驗收並獲授權提交後解除凍結；若使用者尚未授權提交，保持交付邊界並回報，不能自行提交解鎖。

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

登記簿每筆至少保存 `id`、不可變的初始來源分區／分類、建立基準或決策來源，以及 `status`；退役另記 `reason`、決策、`replacedBy`（沒有則為 null）與還原政策。這些是維護資料，不進入使用者存檔；初始來源分類不是禁止既有跨分類 migration 的限制。

`sync_to_json.py` 與完整性檢查共同驗證：

1. 每條目都有全域唯一 `id`，且登記狀態是 `frozen` 或 `active`；反向驗證每個這類登記都有對應條目。
2. 初次遷移僅將 A 封存的既有主 ID 標記 `frozen`；之後新增只能登記為 `active`，符合 `<group>:<分類slug>:<英文短名>`。分類前綴在發號時固定，不能因重新命名分類重發既有 ID。
3. 名稱、描述與語意可依後續授權更新，但不能重發／變更 ID 或拿已發 ID 代表另一個項目。檢查器比較 ID 與不可變來源欄位；同一 ID 的語意是否被改作他用仍須差異審查，不能宣稱程式可自動判定。
4. 合法狀態轉換只有保持原狀、`frozen → retired`、`active → retired`；`retired` 不得復活。禁止 `frozen ↔ active`。此次 A–E 不退役、不刪除任何既有條目。
5. 來源內別名不得指向不同條目；允許同一條目的主 ID 也存在於自己的 legacyIds（現有合法行為）。在**後處理完成的每個 control**再檢查主 ID／legacyIds 衝突，不只檢查單一分類。J12 兩項保留舊命中順序並使用精確允許清單。
6. `replacedBy` 必須指向存在且可還原的有效條目；禁止自指、循環、懸空及指向另一個 retired ID。多次替代時更新為最終有效目標，保留原退役紀錄與審查證據。
7. 替代是否有效由實際 control 解析與既有 migration 決定，不能只用「同分類」推定。跨分類只能沿用已存在的 migration；新增跨分類行為另立規格。每個替代案例須固定舊 payload、還原結果與重新生成結果。
8. **沒有替代項不等於可丟棄歷史資料。** 預設保留原條目作還原用途；如欲從有效目錄移除，須先另立退役規格，明定舊卡保存、缺失選值呈現及恢復流程。本次不新增 runtime fallback，也不以靜默變全無視為相容。

#### 4.4.1 歷史比較：防止條目與登記一起被刪

- 初次登記必須對照 A 的封存 ID 清單，逐項驗證完整集合；不能以同批新資料反推「歷史」。
- 後續每次驗證都指定不可變 `registryBaseCommit`：必須是候選變更之前已審查／提交的版本。在 CI 使用受信任的事件基準或明確固定提交，在本機指定該提交；不得使用工作樹當基準或以待驗證版本自己當基準。
- 從該 Git object 讀取歷史登記，檢查所有舊 ID 仍存在、不可變欄位未改、狀態轉換合法；再檢查當前登記與分類資料雙向一致。基準 commit 不存在／不是可接受祖先／缺少應存在的登記時，非零退出，不退回只查當前檔案。
- CI 需取得該基準 object；目前 workflow 的預設 checkout 深度不能假定足夠。初次尚無登記簿的引入批次只能使用 A 的封存清單及 manifest 所記的基準，例外須明確且不可延續到後續批次。
- 基準提交與基準檔 SHA 隨報告列出；更新基準是一個經審查的版本變更，不得修改候選檔內的基準指標來繞過檢查。

#### 4.4.2 驗證器交付時點與測試

B 先用 fixtures 完成登記簿驗證器與 schema；C 產生實際登記簿並啟用強制檢查。測試包含上述通過／失敗情境，尤其是「同時刪條目與登記」「刪除 retired 歷史」「重用 ID」「跨分類但同 control 的別名衝突」「主 ID 作自己的別名」「替代循環／懸空」「不可取得歷史基準」。不得只測當前兩份 JSON 是否互相一致。

---

## 5. Phase 2：正式 schema

### 5.1 2a：目錄紀錄 schema（B 建立，C 啟用）

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

- **欄位合併**：依 common → section → category 組成完整 properties；required 採去重聯集。同名欄位定義相同可共用，不同即報錯，不暗中覆寫；如需不同定義，先修 schema 結構。巢狀物件、陣列 items 遞迴驗證，additionalProperties 在完整欄位合併後判定。這是本專案的 schema 包裝格式，不宣稱整份檔案可直接交給任意 JSON Schema 工具。
- **最小驗證器**：`sync_to_json.py` 內建一個最小驗證器，只支援 `type`、`enum`、`required`、`properties`、`items`、`additionalProperties`、`pattern`、`minLength`。不新增 Python 依賴。
- **未知欄位與關鍵字**：資料的未知欄位及 schema 中不支援的關鍵字都報錯，不能靜默忽略。空值、boolean false、數字 0 與空字串依各欄位明確規則驗證，不能用 truthiness 過濾。
- **必填與空值**：必填字串不得為空字串；但是 schema 明確允許的假值必須保留，例如 `outerwearFastenerRequirement: ""`。
- **來源到 runtime 的映射**：建立版本控制的欄位責任清單，列出來源路徑、生成路徑、runtime 路徑、適用分類、條件與假值政策。至少區分：`id → stableId → id`、`inspiration` 僅組回 Regional desc、直接保留的 `mj`／`lyingSurface`、移入 `meta` 的 `outerwear`／`topUnderbust`／`subjectLight`、manifest 衍生圖片鍵，以及 D 才加入的 `meta.semantic`。
- `lyingSurface` 的 47 筆來源與 runtime 值須完整比較；未來數量由實作基準清點，不寫死為固定門檻。對所有目前欄位與巢狀內容建立映射，未知或未消費欄位不能自行刪除，須先報告處置。
- 完整性檢查除了來源欄位集合，還須驗證實際編譯結果、覆蓋順序與保留值。現行 `buildEntries` 是條件式讀取，單純比較頂層名稱集合不足以證明資料無遺失；不為此進行廣泛 engine 重構。
- **錯誤訊息**：要包含檔案、條目 `id`、欄位路徑、預期值、實際值。
- **測試**：附 Python 單元測試，涵蓋驗證器支援的每個關鍵字，以及三層合併的情境。

### 5.2 2b：內嵌目錄納入檢查（只驗證，不搬家）

`check_catalog_integrity.mjs` 增加以下檢查：

| 模組 | 檢查 |
| --- | --- |
| `webapp/src/lib/engine/characterProfiles.js` | 必填結構化欄位存在且非空；`distinctiveFeatures` 正好 4 項；`legacyIdentityAndBody` 非空 |
| `webapp/src/lib/engine/characterProfiles.js`、`webapp/src/lib/characterCardLab.js`、`webapp/src/lib/engine/midjourneyCardItemNames.js`、`knowledge_base/character_reference_manifest.json`、`webapp/src/lib/engine.js` 的 `CHARACTER_PROFILE_CONTROL_ORDER`（`:342`） | 五方的角色卡 ID 集合一致。排序表缺項的卡片會被靜默過濾（`engine.js:380`） |
| `webapp/src/lib/engine/poseComposerOptions.js`、`specifiedActions.js`、`duoOptions.js`、`fixedCompositionOptions.js` 及其來源資料 | 依命名空間／實際 control 驗證 ID 與別名；子句、頭部／視線、表面、姿勢群組與其他 meta 引用存在；保留 J12 的已知例外與舊順序 |
| `webapp/src/lib/engine/` 下的 overlay：`ambientLightDescriptions.js`、`zImageSceneDetailPriority.js`、`midjourneyItemNames.js` 等 | key 存在於目錄。有「原文 pin」的 overlay，pin 必須等於目錄目前的原文。「原文 pin」是指 overlay 除了 ID 之外，另外存了目錄條目的 zh、en 等原文（例如 `ambientLightDescriptions.js` 的 `source`），用來在原文改動時阻擋 overlay 繼續套用 |

已知不一致的處理依 §4.2.2 的嚴重度規則。

### 5.3 2c：文件與工作流程更新（與 C／1c 同批切換）

修改既有文件前保留原文備份；若 `.bak` 已存在，不覆蓋，另用可辨識日期／版本的備份名。本次 v1.1 只修改本規格並保存原版備份。以下是未來 C 必須與來源切換一起交付的文件，不是本次已完成項目：

- `AGENTS.md`：
  - Validation Matrix 的「Knowledge-base Markdown or manifests」列，改為以 `knowledge_base/catalog/*.json` 為來源。
  - 加入 ID 規則、`id_registry.json`、「Markdown 總覽是自動產生的」等提醒。
- `README.md:74`、`Docs/THE_ARCHITECT.md:16`、`Docs/outfit_preset_schema_migration.md`：目前仍指示修改 Markdown，改為新流程。
- A、B、C、D 四份撰寫指引：
  - 「新增選項流程」改為 JSON 紀錄流程。
  - 補上 ID 規則、schema、快照更新流程。
  - 說明 ID 已與列序解耦，但顯示／抽樣順序仍屬行為；此次不重排，日後調序另驗證，不能把穩定 ID 誤當任意重排授權。
- `Docs/current_project_state.md`：更新「Key Files」的資料來源路徑，並新增一條本規格的狀態紀錄。
- `Docs/specs/engine-architecture.md`：更新資料流說明。
- `AGENTS.md` 與 `Docs/specs/frontend-visual-validation.md`：統一列出 §3.2 所述五個現行工作區與整合模式，移除把動作／抓拍當成獨立主導覽的舊敘述；實作時再次核對 App 入口。

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
- `tags` 合併維持 semantic tags → sourceTags → subjectLightTags，沿用 withTags 的順序與去重行為；semantic 未提供 tags 時視為空陣列，不能假定每個 infer 回傳物件都有 tags。

完成 D 後，正式基礎目錄必須有 `meta.semantic`；未帶 semantic 的自訂 library 與歷史 fixtures 維持原推論路徑。帶著 semantic 的物件型 library 採顯式資料優先；欲評估推論時只在副本移除 semantic。測試與診斷工具不得改動預設 runtime 快取。

#### 6.1.3 schema 與驗收

- schema 改為要求所有目錄紀錄都有 `meta.semantic`，並以 `enum` 列出各分區允許的 tag 值。
- 驗收條件：I3 零 diff。

#### 6.1.4 已知錯誤標籤原樣凍結

例如以下標籤，這次不修正：

- `戶外：倫敦排屋街道` 的 `subterranean`
- 被 `small`→`mall` 誤標的 17 個 `commercial`

這些歷史例子須先對照 D 的基準重新確認，不能把已修復問題重新寫回。仍存在者逐條列入待建立的 `Docs/reports/database-analysis-2026-10-11/frozen-known-issues.md`，保存項目 ID、錯誤欄位／值、實際影響、基準 commit、決策引用、後續處理狀態與驗收條件。倫敦排屋的 subterranean 已於本次核對確認仍存在；歷史 17 個 commercial 的數字不能代替重新清點。

「已知問題紀錄」不等於新增 strict 允許清單；只有相應檢查實際會阻擋且獲核准的項目，才可用代碼＋項目鍵加入允許清單。語意修改須檢查候選池與輸出差異；不在本次遷移修正。

#### 6.1.5 保留推論函式

- `infer*Meta` 函式保留，作為自訂 library 的退路，也作為 Phase 4 的比對基準。
- 新增條目時，必須明確填寫並審閱 `meta.semantic`；更改 zh／en／desc 時須列出 semantic 是否需變動及原因，避免原推論錯誤或過期語意永久保留。
- 另提供常駐腳本 `scripts/suggest_catalog_semantics.mjs <id>`，只輸出現行顯式語意與推論建議的差異，不寫檔、不自動覆蓋人工決策。它在記憶體複製 database、移除該條 semantic，經測試專用 export 取得 inferredMeta；不得重算或污染正式快取。

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

## 7. 交付方式與實際執行順序

原 1a–3b 代號保留作條文索引，**不再代表依章節先後執行**；以下 A–E 是唯一執行順序。原文件修訂不啟動 A；2026-10-24 的後續指示已單獨授權 A，尚未授權 B。

| 階段 | 原步驟對照 | 交付與邊界 |
| --- | --- | --- |
| A：基準 | 1a＋§3.1／3.2 | 核對 main，完成測試專用 export、三份目錄快照、完整輸出比較工具與封存 manifest；不改正式資料格式或 renderer 行為 |
| B：切換準備 | 1b＋2a＋2b＋1d 驗證器 | 完整性檢查進 CI，完成 schema、欄位映射、歷史 ID 驗證與 migration／產生器的測試；以 fixtures 或 repo 外暫存資料演練，正式 sync 仍讀 Markdown |
| C：完整來源切換 | 1c＋1d 實際登記＋2c | 一起交付分類 JSON、固定 ID／別名、登記簿、正式讀取切換、schema／歷史檢查啟用、自動 Markdown、舊 metadata 退役及操作文件；不得留下半套正式來源 |
| D：語意資料化 | 3a | 從真實編譯點搬入 semantic，保持最終 meta／候選池／輸出，保存已知問題與唯讀建議工具 |
| E：舊映射集中 | 3b | 先清點並等 Cooper 確認，再只搬表；不改 targetZh、不改匹配或載入時計算，保留等價基準 |

- **第一個完整產品交付目標是 C。** D、E 後續分別授權與驗收；完成 C 不得宣稱整份 v1.1 已實作。
- **驗收與提交**：各階段交付 I1–I9 的適用證據、檔案允許清單與風險。僅準備文件的批次做文件檢查；程式／資料批次依 root AGENTS 完成相應檢查。未完成的檢查須明列，不能視為通過。
- **授權**：各階段完成後回報，只有 Cooper 明確指示才 stage／commit；下一階段須在前一階段已提交且獲授權後開始。push／deploy 另須明確授權，main 的本機修改或 commit 不等於部署授權。
- **直接 main**：依當前 root AGENTS 使用現有 main 工作目錄，不自行建立功能分支、不切換或清理原專案目錄。開始前再次確認分支、HEAD 與重疊檔案。
- **其他 session 前進 main 時**：先確認差異與任務邊界，停止依舊基準執行後續遷移。舊 baseline 永久保留；經審查另建新 manifest，記錄新舊 commit、對方已核准變更與基準差異，再重新執行受影響驗證。禁止在包含未驗收遷移的工作樹直接重錄 baseline。
- **一次性腳本**：保留於 `scripts/migrations/`，使用來源 SHA／預期格式與目標存在檢查阻止誤重跑；不接 CI 自動遷移。註明執行紀錄與所屬交付提交的查核位置，不以必須把自身最終 commit hash 寫回同一提交的方式造成循環。
- **回退**：A、B 可獨立審查；C 是來源、驗證與文件一致的回退單位，D、E 依賴 C。回退 C 前先處理後續依賴與新增資料，須另獲授權，不能覆寫使用者已保存內容。

## 8. 風險與對策

| 風險 | 對策 |
| --- | --- |
| 1c 的 diff 很大，難以人工審閱 | 以機器比對驗收：§4.3.6 位元組比對，加上 I1–I3 零 diff。人工只審新增的程式碼 |
| 其他 session 在凍結期修改資料或 engine | 執行 §4.3.7 前置檢查並發出通知。發現衝突時停止並回報，不自行合併 |
| 漏掉某種舊 ID 形式，造成舊存檔失效 | I2 比對完整 legacyIds；I6 跑 Saved Cards 還原測試；I9 實際還原至少一張舊存檔 |
| 自訂 library 複製條目，造成 ID 重複 | §4.3.4 調整測試資料；完整性檢查新增「同 control 內 ID 唯一」 |
| 維護者仍修改 Markdown | 總覽標示生成來源；C 同批更新 AGENTS 與撰寫指引；`--check` 阻擋漂移 |
| 快照淪為「改了就更新」 | manifest 綁定基準 commit／工具／案例雜湊，舊基準不可覆蓋；完整比較失敗即阻擋，不以新預期消除遷移差異 |
| 條目與登記同時刪除 | §4.4 歷史 Git object 比較與雙向查核，缺基準即失敗 |
| 正式來源切換途中失去驗證或指引 | B 先完成護欄，C 同批切換來源／驗證／文件，驗證失敗不得留下部分產出 |

## 9. 待決事項（不阻擋本規格）

| 編號 | 事項 | 目前處置 |
| --- | --- | --- |
| J12 | 雙人 `shoulder-lean`、`leaning-shoulders` 舊值的正確去向 | 維持現行行為，列入允許清單 |
| B3 | 角色卡 cardLab 與 profile 之間 12 段不一致 | 列為 `possible`，只報告 |
| Phase 4 | 修正報告 §4 A 類問題：控制語、錯誤標籤、相容漏洞、固定色套裝、角色卡成年身份 | 另立規格，逐項核准 |


## 10. v1.1 文件修訂紀錄與完成狀態

- 2026-10-24：對齊 main `0746b280cc9f5c00daec7dadc73329779ac658e9`，補上完整輸出基準、歷史 ID 保護、schema／欄位映射與 A–E 執行順序；保留 2026-10-13 決策與原文備份。
- v1.1 文件修訂當時只修改本規格與其原文備份，未實作 A–E。後續 A 授權及交付記錄另列 §11；JSON 遷移、schema 與登記簿仍未實作。
- 文件驗證範圍：既有連結／路徑、待建立產物標示、條文與階段依賴一致性、Git diff／空白檢查。未執行 code suites、browser QA、外部生成或部署；不能把本次文件驗證當成未來 I1–I9 的實作通過證據。


## 11. A 階段本機完成（2026-10-24）

- Cooper 後續明確授權執行 A，止於基準與驗收工具，禁止 B、commit 與 push。
- 已完成測試專用 export、三份目錄快照、核心 2,540 案及有效躺姿補充 141 案、不可覆蓋的輸出封存與 SHA-256 manifest、逐 ID／alias 解析、存檔往返與失敗退出測試。補充另重播同一 200 audit 樣本。
- 完整測試 1,810/1,810、Prompt Quality 745/745、lint／build、資料檢查與同 seed audit 通過；Node25 的既有 reporter 相容問題已在原始 main 重現並以 TAP 執行設定驗證，不改無關程式。
- 詳見 [A 交付報告與 I1–I9 證據](../reports/catalog-architecture-a-2026-10-24/README.md)、[基準操作說明](../../webapp/src/lib/engine/catalogBaseline/README.md)。
- A 仍為本機未提交交付；B–E 不因本狀態而獲授權。封存基準不得因後續遷移失敗而重新錄製。

### 11.1 A 對齊最新 main（2026-10-24）

- Cooper 已驗收原 A，另明確授權同步 main、保留舊基準、合併文件及補全身角色匯入案例；仍不授權 stage／commit／push／B。
- 對齊來源 `2f56438804e751de4556060b293231966d6ea3b3` 包含觀察式抓拍全身角色匯入 PR #15 與姿勢舊資料去向文件。`engine.js` 的 A 測試專用匯出乾淨合併；current state 保留兩邊新增段落。沒有把姿勢盤點文件當成 E 階段實作授權。
- 舊基準、核心／躺姿補充 manifest、三份目錄快照全部原位保留，SHA-256 不變。獨立 revision 位於 `webapp/src/lib/engine/catalogBaseline/revisions/2f56438/`，記錄舊／新 commit、上游變更、舊檔雜湊及零差異比較。不得改舊 manifest 的 baselineCommit 冒充新基準。
- 新增 170 固定案例（120 場景／景別、40 流程、5 休眠角色卡、5 回一般模式）、5 組人物來源／匯入 API 流程與 10 份 JSON／Markdown 收藏；另重播同一 200 audit。累計 2,851 個不同案例，三組完整重播共 3,251 筆。
- 新流程須保持完整人物、穿搭、配色、full-body reference、原始隨機／全無選值，驗證重抽、候選更新不自行換人、明確重匯入、角色卡切換、JSON 重載、Markdown 還原與無效來源拒絕。來源建立本身也比較完整輸出、快照及 RNG；不能只測已產生的 importedPerson payload。
- 追加驗收指令：`node scripts/catalog_alignment_baseline.mjs verify`、`node scripts/catalog_alignment_baseline.mjs check`、`node --test webapp/src/lib/engine/catalogAlignment.test.js`。原基準／快照測試仍必須執行；完整測試會自動包含新測試。
- 實際驗證與 I1–I9 證據見 [A 對齊報告](../reports/catalog-architecture-a-alignment-2026-10-24/README.md)。原報告保留為舊來源的驗收歷史，不用本輪結果改寫。

### 11.2 A 對齊驗收與 Git 交付授權（2026-10-24）

Cooper 已確認 §11.1 的對齊驗收通過，授權只提交並 push 本次 A 的文件、原／新基準及驗收工具；包含原 A 測試專用 catalog 匯出與比較器修正。提交範圍見 [交付允許清單](../reports/catalog-architecture-a-alignment-2026-10-24/delivery-allowlist.json)。本輪不進入 B；原專案及其他 worktree 的未追蹤資料／備份保留。前述「未提交／未授權 Git」文字為當時驗收歷史，最新授權以本節為準。既有 main push workflow 的結果需另外核對，不將 Git 推送等同全部 CI／發布完成。


## 12. B 切換準備交付（2026-10-25）

Cooper 明確授權依 v1.1 完成 B 的完整性檢查、schema、歷史 ID 驗證與隔離演練，正式來源保持 Markdown，保留其他未提交內容，不 commit／push，不進入 C／P5b。來源與完成時的 GitHub main 均為 `548a5c402b025e243bda16c873527dca6c95b75d`。

- 已交付 §4.2、§5.1、§5.2 與 §4.4 的 B 驗證器／fixtures；完整性 strict 與 repo 外演練加入 CI 工作流程，尚未推送或取得新 CI 結果。
- 6 分區／56 分類、1,050 筆 schema；22 頂層與 67 含巢狀路徑映射；五方角色 ID 各 33 筆；47 筆 lyingSurface 實際值全比較。僅 J12 兩個精確例外，0 未豁免 confirmed、0 stale；possible 保持診斷。
- 初始 frozen 集合以原 A Git object 及封存快照交叉核對；後續歷史比較以暫存 Git fixtures 驗證。正式 registry 尚未建立，C 才啟用歷史強制門檻。退休圖結構驗證不等於實際還原驗收；預設禁止退役，沒有新增 fallback。
- 隔離演練生成 56 分類／1,050 frozen IDs，database 位元組（剝除兩個 ID 欄位後）、完整 compiled／controls 及 12 組 Markdown parser round-trip 零差異；正式來源、runtime 與 A 原／新基準未改。
- I1–I9 全部適用檢查本機通過，詳細數字、命令、限制、16 張瀏覽器截圖、其他未提交檔案保護與檔案允許清單見 [B 驗收報告](../reports/catalog-architecture-b-2026-10-25/README.md)。操作見 [catalog README](../../knowledge_base/catalog/README.md)。本節記錄本機驗收，不代替使用者驗收或遠端 CI。


### 12.1 B 驗收與 Git 交付授權（2026-10-25）

Cooper 已確認 B 驗收通過，明確授權僅提交並 push 本次 B 的文件、schema、驗收工具與 CI 設定，之後確認該提交的 CI。範圍以 [52 份檔案允許清單](../reports/catalog-architecture-b-2026-10-25/delivery-allowlist.json) 為準；正式來源仍為 Markdown，其他未提交內容保留，不進入 C 或 P5b。§12 及驗收報告的未提交文字保留為本機驗收時點的歷史；此授權不代表 push 或遠端 CI 已完成，實際結果須另行查核。

## 13. C JSON 正式來源切換（2026-10-25）

- 使用者確認其他 session 暫停共用範圍修改後，核對本機／遠端 main `64870460e8a153a07baf953df0d6cf784ce2aca4` 並開始 C。依 §4.3／4.4／5.3 完成分類 JSON、正式 reader、歷史 registry、七份生成物檢查、CI 接線與操作文件，同時保留14份原稿與其他140份未提交內容。
- 1,050 筆、56 分類；內容與鍵順序、ID／別名、compiled entries/catalog／controls 全部零差異，兩種 Markdown parser 共12組一致。I1–I9 本機通過：前端1823、quality754、Python33、工具10；三套 A 重播3251次／2851個不同案例；同 seed200 audit 0 blockers／18既有診斷，strict 僅 J12 精確兩項；桌手機44項、16張畫面檢視通過。
- 正式歷史基準從 CLI／環境與受信任 CI 事件取得；初次只准固定 pre-C 的直接引入，使用固定 SHA 的 A inventory 與 Git 中的 A snapshot。一般批次不得缺歷史回退。CI 須提供 candidate，工作樹本機在 C 提交後必須換成已有 registry 的已審查基準。
- 同步先驗證／render 全部輸出，再準備暫存與替換；一般 I/O 失敗回復原檔，`--check` 只讀。不是跨檔斷電交易；中斷後須重跑 sync/check。單筆語意挪用仍靠人工審查，非 registry 可自動證明。
- 詳細檔案、指令、SHA 與驗收見 [C 報告](../reports/catalog-architecture-c-2026-10-25/README.md)、[操作流程](../../knowledge_base/catalog/README.md)。本節記錄本機完成，不代替 Cooper 驗收或遠端 CI；未 stage／commit／push。D、E、P5b 未開始，凍結不自行解除。

### 13.1 C 驗收與 Git 交付授權（2026-10-25）

Cooper 已確認 C 階段驗收通過，明確授權只提交並 push 本次 C 的資料、程式、文件、驗收工具與 CI 設定，保留其他未提交內容，完成後確認對應提交的 CI。上節保留本機驗收當時的狀態；此次授權不代表 Git／CI 已成功。僅依 C 交付清單提交，不進入 D、E 或 P5b。
