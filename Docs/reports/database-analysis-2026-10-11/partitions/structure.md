# 資料庫結構、管線、完整性與可維護性分析

- 範圍：跨分區的資料架構健康度（不評內容品質）
- 分析日期：2026-10-11；工作區狀態：`git status` 只有 Docs/ 修改與未追蹤目錄，程式與資料都和 HEAD `0d5c990` 一致
- 方式：全程唯讀。所有數字都由實際執行的腳本算出（見 §8），沒有人工估算
- 標記：**[確定]** = 已用程式或原文證實；**[可能/待判斷]** = 有風險或屬於取捨，需要 Cooper 決定
- 查不到的項目標 `not_stated`

---

## 0. 結論摘要

整條資料管線的「輸入端」紀律很好：Markdown 轉 JSON 是確定性的，CI 有 `--check`，manifest 依名稱比對，缺漏時直接失敗。硬寫參照目前也沒有懸空。
系統性風險集中在四件事：

1. **ID 由中文標籤加列序產生**：96.5% 的條目沒有穩定鍵，改名或重排就會讓存檔失效。找不到的 ID 會被靜默改成「全無」。
2. **語意 metadata 幾乎都在程式內推論**：tags 全部從 zh、en、desc 文字推出，而 desc 在 UI 上看不到，卻會影響相容性過濾。
3. **舊資料相容的真相分散在多處**，部分查找失敗時會靜默略過。
4. **資料散落多處**：Markdown 之外還有 11 個 JS 模組、5,304 行內嵌目錄，角色卡同一份資料存在 4 個地方。

---

## 1. 量化總表（腳本實測）

| 指標 | 數值 | 來源 |
| --- | --- | --- |
| database.json 大小 | 464,756 bytes（gzip 126,506） | `wc -c`、`gzip -c` |
| 目錄條目 / 分區 / 分類 | 1,050 / 6 / 56（其中「全無」類列 43） | analyze 腳本 §1 |
| 各分區條目 | Wardrobe 539、CameraLighting 172、Locations 155、Character 139、Regional 26、Negative 19 | 同上 |
| 必備欄位覆蓋 | zh、en、desc 都是 100%；非全無列的空 en 或空 desc = 0 | 同上 |
| 選填欄位覆蓋 | meta 173（16.5%）、legacyPromptAliases 41、topUnderbust 39、**stableId 37（3.5%）**、legacyIds 36、outerwear 22、其餘 ≤ 9 | 同上 |
| 位置相依 ID | **1,013 / 1,050（96.5%）** | 同上 |
| 編譯後 controls / options / 不重複 legacyIds | 209 / 4,628 / 1,457 | `getLockControls()` |
| 執行期 tags | 785 / 1,033 個目錄選項帶 tags，共 2,291 個、192 種；**database.json 顯式 tags = 0** | 同上 |
| 執行期 meta 欄位種類 | 27 種（其中 tags、visibility、archetype 等由程式推論） | 同上 |
| 硬寫目錄 ID（正式碼） | 448 個現行 ID、1 個只存在於 legacy、**0 個懸空** | AST 掃描 webapp/src |
| 硬寫 targetZh / dressZh | 242 個，0 個懸空 | AST |
| 硬寫 `x.zh === '…'`、LABELS 陣列、`*ByZh()` | 88 個，1 個永遠不會命中（`霓虹夜色`） | AST |
| 內嵌目錄模組 | 11 檔 / 5,304 行 / 926 個匯出條目 | import 後計數 |
| engine.js | 16,711 行；頂層資料表 81 個、2,362 行（14.1%）；其中 legacy/migration 表 21 個、535 行、340 條 | AST |
| legacy/migration 命名的函式 | engine.js 27 個；savedCardsMigration.js 2 個；accessoryPolicy.js 1 個；localRepository.js 1 個 | grep |
| Pose Composer 退役負擔 | 285 條中 114 條為 deprecated 且 uiHidden（約 40%；anchor 52/80、arrangement 37/82、hand 22/72、head 3/26） | import |
| Python 資料層測試 | 2 個（test_sync_to_json.py:24、:56） | `unittest` 實跑 2 tests OK |
| 建置 chunk（dist 2026-10-11 21:00，非本次建置） | prompt-catalog 517,812 B（gzip 140,871）、prompt-engine 766,056 B（gzip 218,218），兩者都在 index.html 以 modulepreload 載入 | `dist/index.html` |

既有檢查實跑結果：

- `python3 scripts/sync_to_json.py --check` → PASS
- `python3 scripts/check_public_assets.py` → PASS（206 files、2,920,165 bytes）
- `python3 -m unittest discover -s scripts/tests` → 2 tests OK

---

## 2. 單一真相來源（SSOT）

### 2.1 各類資料的歸屬

| 資料 | 真相來源 | 是否經 sync 驗證 |
| --- | --- | --- |
| 1,050 條基礎目錄（zh/en/desc） | `knowledge_base/*.md` | 是 |
| 套裝 metadata（59） | `outfit_preset_metadata.json` | 是（名稱集合必須相等） |
| 單品 metadata（132 條目標、17 種欄位） | `item_metadata.json` | 是（目標存在、不能覆寫保留鍵） |
| 服裝參考圖（173） | `wardrobe_reference_manifest.json` | 是（名稱與實體檔案） |
| 角色卡圖片（33） | `character_reference_manifest.json` | 只由 build_image_previews / check_public_assets 使用，**不與 profile 交叉驗證**（本腳本驗證目前一致） |
| 角色卡 34（含 none）、Pose Composer 285、雙人 44、固定構圖 85 等 | 只存在於 JS 模組 | 否 |
| tags、visibility、archetype 等語意 meta | engine.js `infer*Meta` 依文字推論 | 否 |
| 舊 ID 對照與遷移 | item_metadata.json + engine.js 21 張表 + duoOptions.js + 27 個 migration 函式 | 部分 |
| MJ 短名稱 | item_metadata `mj`（6）+ midjourneyItemNames.js（286）+ midjourneyBodyDescriptions.js（6） | 否，但有測試把關 |
| 環境光描述 | ambientLightDescriptions.js（36，並逐字複製 en 為 `source`） | 否，但有測試把關 |

### 2.2 重複與分散

- **[確定] 角色卡資料分散在 4 個地方。**
  - `characterProfiles.js`：en 加 15 個 profile 欄位
  - `characterCardLab.js`：wardrobeLayers、hairTags
  - `midjourneyCardItemNames.js`
  - `character_reference_manifest.json`
  - characterCardLab.js 的 134 段 wardrobeLayers 中，122 段和 characterProfiles.js 逐字重複，其餘 12 段不一致（如 characterCardLab.js:148、:208、:218）。這 12 段是刻意改寫還是漂移，**待 Cooper 判斷**。
  - profile 的 `en` 又把 hair 和 outfit 再拼一次：33 張卡中 hair 首句 32/33、outfit 首句 33/33 出現在 en 內。
- **[確定] MJ 投影資料分在三處、兩種格式**：
  - KB JSON 的 `mj`（item_metadata.json「五官特徵」6 條）
  - JS 的 `MIDJOURNEY_ITEM_NAMES`（midjourneyItemNames.js:2）
  - JS 的 `MIDJOURNEY_BODY_DESCRIPTIONS`（midjourneyBodyDescriptions.js:3）
  - 後兩者以位置相依 ID 當 key，例如 `"wardrobe:上身-tops:襯衫:1"`。
- **[確定] 環境光描述逐字複製目錄 en。** `resolveAmbientLightDescription` 要求 id、zh、en 三者都相同，否則回傳 null（ambientLightDescriptions.js:398-401）。目前 36/36 一致，並由 ambientLightDescriptions.test.js:21-27 把關。
- **[確定] 執行期改寫分類。** `splitAccessoryCatalog` 依 zh 正規式，把頭部配件移到執行期才存在的分類，例如 `/耳機/` 會移到「耳機 (Headphones)」（accessoryPolicy.js:2、:9-10）。Markdown 上看到的分類與執行期分類不一致。

---

## 3. Schema 與 ID 策略

### 3.1 欄位與驗證

- **[確定] database.json 沒有正式 schema。**
  - sync 只檢查：分類內 zh 不重複（sync_to_json.py:109）、metadata 不能覆寫保留鍵（:247）、Character ≥ 10 條（:281）。
  - item_metadata 的值，例如 `topUnderbust`、`outerwearFit`，沒有任何型別或列舉驗證。
- 正面發現：item_metadata 的 17 種欄位**全部**會被 `buildEntries` 讀取，目前沒有被靜默丟棄的 key（本腳本 AST 白名單檢查）。
  - 但 `buildEntries` 用逐欄白名單複製（engine.js:3293-3345）。日後新增 metadata 欄位時，如果忘了改 engine.js，新欄位會被靜默忽略。本腳本的 `META_KEY_IGNORED` 檢查可以擋下這種情況。

### 3.2 ID 策略

- **[確定] ID = `${group}:${slugify(category)}:${slugify(displayZh)}:${rowIndex}`**，除非有 stableId（engine.js:3294）。
  - 中文標籤**和列序**都是 ID 的一部分。
  - 這些 ID 存進 Saved Cards 的 `selection`（cardCodec.js:105-106）和 lock 狀態，屬於相容面。
- **[確定] 改名、重排、插入都會改變 ID。**
  - 證據：engine.js:2685 `targetZh: '肩部高度鏡頭', legacy: [['肩部高度鏡頭', 2]]`，標籤沒變，只因列序變了就得補一條 legacy。
  - 撰寫指引也承認這點，並要求「優先 append」（wardrobe-section-b-authoring-guide.md:464-468）。
- **[確定] stableId 只是「凍結的舊位置 ID」，不是設計過的鍵。**
  - 例如 `wardrobe:外套開合-outerwear-opening:fully-closed:5`（item_metadata.json:841）。
  - 目前只有 37 條：體態 7、外套 22、其他 8。其餘 1,013 條在插入列時都會位移，例如在「特殊穿搭」最前面插一列會影響 90 個 ID。
- **[確定] 找不到的 ID 會被靜默改成「全無」，多選欄位則直接過濾掉。** 使用者和開發者都不會收到提示（engine.js:3882-3900，`option.zh === '全無'` 的 fallback 在 :3897）。
- **[確定] legacyId 有歧義。**
  - `duoPoseId` 的 `shoulder-lean`、`leaning-shoulders` 同時列在 `fashion-editorial-models`（duoOptions.js:61-62）和 `best-friends-selfie`（:81-82）。
  - `normalizeLocks` 取第一個命中者（engine.js:3891），結果會導向時尚雜誌。
  - 但專用遷移把 `duoInteractionId` 的同名舊值導向「好朋友之間的親密自拍」（engine.js:3519、:3522），兩條路徑結論不一致。
  - 沒有測試涵蓋這兩個舊值（grep 測試 0 筆）。**待 Cooper 判斷**正確目標。
- [可能] 跨分類同名 zh 有 17 組，主要是上身、下身、外套圖案，以及「長版襯衫」（上身 vs 外套）。依 zh 查找時若沒帶分類就會有歧義；目前硬寫查找都有帶分類，沒有懸空。
- [確定，正面] slugify 會丟字的標籤（假名、全形英數等）= 0；同一 control 內重複 ID = 0；legacyId 被現行 ID 遮蔽 = 0。

---

## 4. 參照完整性

本腳本實測，正式程式碼的結果：

| 檢查 | 結果 |
| --- | --- |
| 硬寫目錄 ID（448） | 0 個懸空 |
| targetZh / dressZh（242） | 0 個懸空 |
| MIDJOURNEY_ITEM_NAMES（286）、MIDJOURNEY_BODY_DESCRIPTIONS（6）、MIDJOURNEY_CARD_ITEM_NAMES（33） | 0 個懸空 |
| 角色卡圖、服裝參考圖（173）、item_metadata 目標（132）、outfit_preset_metadata（59） | 全部存在 |

需要注意的地方：

- **[確定] legacy 查找失敗時靜默略過。**
  - 7 個 `apply*Legacy*` 函式在找不到 targetZh 時直接 `if (!target) return;`（engine.js:3195、3207、3222、3237、3246、3263、3270）。
  - 這些表沒有 export，**沒有任何測試逐條檢查 target 是否存在**。目前 0 個懸空是本腳本首次全面確認的結果，不是持續保證。
- **[確定] 死條件。** engine.js:1976 `item.zh === '霓虹夜色'` 永遠不會成立：該條目已改名為「城市高彩度夜色」（legacy 表 engine.js:2704）。目前靠同一行的 en 關鍵字補救。
- **[確定] 死分類 fallback。**
  - `'特殊效果 (Special Effects)'`（engine.js:2599、:3418）
  - `LEGACY_ENVIRONMENT_MOOD_CATEGORY`（engine.js:1022-1023）
  - 這些分類都不在 database.json，只有自訂 library 才可能用到。
- [可能] 測試中有 6 個 ID 現行與 legacy 都找不到，例如 engineMirrorSelfieProp.test.js:114、engineOutfitPresetDressCleanup.test.js:800-826。經檢視，它們是**刻意**測試由專用 migration 函式處理的舊值。這也表示「舊 ID 能否被遷移」無法只靠 legacyIds 判斷。

---

## 5. legacy / 相容負擔分佈

| 位置 | 數量 |
| --- | --- |
| item_metadata.json | legacyIds 36、legacyPromptAliases 41、legacyLabels 6 |
| engine.js legacy/migration 資料表 | 21 張、535 行、340 條。最大兩張是 `CHARACTER_EXPRESSION_POSE_LEGACY_OPTION_MAP`（:2785，114 行）、`WARDROBE_LEGACY_OPTION_MAP`（:2995，114 行，80 條） |
| engine.js migration 函式 | 27 個；`normalizeLocks` 內依序呼叫 15 個以上（:3903-3918） |
| duoOptions.js | 6 個選項帶 legacyIds；DUO_EXPRESSION_OPTIONS 8/17 是 uiHidden |
| poseComposerOptions.js | 114/285 個 deprecated 且 uiHidden 的選項 |
| 舊分類常數 | `神情與眼神 (Expression & Gaze)`（engine.js:156）、`環境光氛 (Environment Mood)`（:1022） |

- **[確定] 相容真相跨兩種格式**（KB JSON 與 engine.js 常數），新增一筆時沒有單一入口。
- **[確定] 文件寫的常數名稱不存在。** wardrobe-section-b-authoring-guide.md:476-477 列出 `LEGACY_WARDROBE_OPTION_IDS`、`LEGACY_OUTFIT_DRESS_LOCK_MIGRATIONS`，repo 中都 grep 不到。實際名稱是 `WARDROBE_OUTFIT_TO_DRESS_LEGACY_LOCK_MIGRATIONS`（engine.js:3160）。

---

## 6. 管線與檢查

### 6.1 優點

- `--check` 是唯讀檢查，用逐字比對成品並在 CI 執行（`.github/workflows/deploy.yml:31`）。
- manifest 依名稱而非列序比對，缺漏、重複、多餘都會失敗（sync_to_json.py:158-230）。
- 公開資產有預算與 AVIF 檢查（check_public_assets.py）。

### 6.2 缺口

- **[確定] Python 資料層測試只有 2 個**，只測 manifest 依名稱比對、缺 preview 時失敗。下列都沒有測試：
  - 分類內重名
  - metadata 目標不存在
  - 保留鍵覆寫
  - `--check` 偵測過期
  - 表頭跳過邏輯
- **[確定] JS 端資料規則沒有通用測試。** 有分類專屬測試（bodyTypeCatalog、standingCatalog、kneelingCatalog、engineOuterwearCatalog、wardrobeAtomicOptions），但沒有以下通用檢查：
  - legacy 表 target 是否存在
  - legacyId 歧義
  - tags 快照
  - 角色卡多檔一致性
- 正面發現：MJ 名稱、環境光描述、角色卡 MJ 名稱都有測試確認 key 能解析：
  - midjourneyNaturalPrompt.test.js:131-138
  - ambientLightDescriptions.test.js:21-27
  - engineCharacterCardVariant.test.js:325
- [可能] MJ 名稱表的完整性沒有強制。
  - 測試只要求超過 250 條（midjourneyNaturalPrompt.test.js:131）。目前實體單品分類都是 100% 覆蓋，而特殊穿搭、套裝、圖案、版型等是刻意不收。
  - 新增單品若忘了加名稱，會退回從 en 抽取，CI 不會失敗。
- [可能] `scripts/tests/prompt_audit.test.mjs` 沒被任何 CI 步驟或 npm script 引用。`unittest discover` 只收 .py，npm test 的 glob 只涵蓋 webapp/src。
- [可能] `scripts/prompt_generator.py` 是第二套 Markdown 解析器，表頭判斷規則不同，沒有任何引用。
- [可能] Markdown 解析有潛在陷阱，目前都是 0 次發生（6 個 md 的所有表格列都恰好 4 欄）：
  - 任何含 `---` 的資料列會被整列丟棄（sync_to_json.py:52）
  - 表頭是用固定標籤清單跳過（:56-65）
  - 儲存格內的 `|` 會造成錯欄

### 6.3 新增一條資料的步驟數（依撰寫指引與 sync 的硬性要求整理）

| 類型 | 必改檔案 | 步驟 | sync 會擋 |
| --- | --- | --- | --- |
| 一般上身/下身單品 | md；視需要加 item_metadata（topUnderbust 等）、midjourneyItemNames.js（key 為位置 ID） | 約 7：append 列 → metadata → sync → MJ 名稱 → 測試 → prompt-quality / audit strict → 瀏覽器 smoke | 只擋重名 |
| 套裝 | md + outfit_preset_metadata.json + 原圖 + preview（ffmpeg） + wardrobe_reference_manifest.json | 約 9 | 缺 metadata、缺圖、缺 manifest 都會擋 |
| 角色卡 | characterProfiles.js + characterCardLab.js + midjourneyCardItemNames.js + character_reference_manifest.json + 原圖與 preview | 約 8，不經 sync | 不經 sync；有測試要求 MJ 卡名存在 |
| Pose Composer 選項 | poseComposerOptions.js（+ compatibility） | 約 4，不經 Markdown | 否 |

- **[確定] 指引的「新增選項流程」漏列多個必要步驟**（wardrobe-section-b-authoring-guide.md:483-492）：outfit_preset_metadata、參考圖、build_image_previews、manifest、MJ 名稱都沒寫。

---

## 7. 執行期

- **[確定] 打包與載入**：
  - `vite.config.js:12-14` 把 database.json **和 characterProfiles.js** 打成 `prompt-catalog`。
  - engine-architecture.md:322、:335 仍寫只有 database.json、328.58 kB，文件已過期。
- **[確定] 引擎與目錄是一開始就整包載入。** App.jsx:3 靜態 `import { normalizeLocks } from './lib/engine'`。dist/index.html 對 prompt-catalog 與 prompt-engine 都做 modulepreload，合計約 1.28 MB raw / 約 359 KB gzip，開任何工作區都要載。這是否值得優化，**待 Cooper 判斷**。
- **[確定] 預設 runtime 只編譯一次並深度凍結**（runtimeCache.js:58-75），合約見 engine-architecture.md:77-95。
- **[確定] 自訂 library overlay 在正式 UI 中走不到**：
  - usePromptWorkspace.js:28、:31 固定傳 `EMPTY_LIBRARY`。
  - `getKnowledgeBaseOptions`（engine.js:3440）沒有任何呼叫者。
  - overlay 只保留 zh/en/desc，會丟失 meta、stableId、legacyIds（engine.js:3355-3380）。
  - 目前只有測試用到 `getKnowledgeBaseSnapshot`。
- **[確定] Negative 分區（19 條）有編譯**（engine.js:3391），但沒有任何 control 或 renderer 讀取 `catalog.negative`（grep 為 0）。它是保留給未來用，還是可以退役，**待 Cooper 判斷**。

### 7.1 隱藏 schema：文字推論 tags

- **[確定] tags 全部來自文字推論。**
  - 785 個選項的 2,291 個 tags 都由 `infer*Meta` 產生（engine.js:1680-2600，約 900 行；`hasAny(` 255 次；正規式 `.test(` 66 次）。
  - 推論輸入用 `toHaystack(zh, en, desc)`（engine.js:1579，23 處呼叫）。
- **desc 不在任何 UI 元件顯示**（components、features grep 為 0）。所以「中文備註」其實是相容性過濾的隱藏輸入：改寫 en 或 desc，可能靜默改變室內/戶外、夜景等相容判斷。

---

## 8. 參照完整性與欄位覆蓋檢查腳本

- 檔案：`/private/tmp/claude-501/-Users-cooperfu-Projects-Virtual-Photography-Studio/80d8f708-6d6d-4e28-951d-26f07f8bdfff/scratchpad/db-analysis/analyze_database_catalog.mjs`
- 性質：唯讀，只 import 模組；不呼叫 generatePrompts、不寫 repo、不使用網路。
- 需求：Node 22+；需先在 webapp/ 執行過 `npm ci`（用 espree 解析 AST）。
- 用法（檔頭也有寫）：

```bash
# 文字摘要
node <scratchpad>/db-analysis/analyze_database_catalog.mjs --repo /Users/cooperfu/Projects/Virtual_Photography_Studio
# 完整 JSON 另存
node <scratchpad>/db-analysis/analyze_database_catalog.mjs --repo <repo> --json-out <scratchpad>/db-analysis/catalog_report.json
# 給 CI：有確定問題時 exit 1
node <scratchpad>/db-analysis/analyze_database_catalog.mjs --repo <repo> --strict
```

- 本次實跑：
  - 在 repo 根目錄執行 `node …/analyze_database_catalog.mjs --json-out …/catalog_report.json`，耗時約 0.7 s，exit 0
  - `--strict` 的 exit 1：因為有 1 個確定問題 `LEGACY_ID_AMBIGUOUS`
  - 執行前後 `git status --short` 都是 7 行，repo 無變更
- 輸出摘要（全文在 `catalog_report.txt`，完整 JSON 在 `catalog_report.json`）：

```
database.json: 464756 bytes, 1050 條（全無列 43）, 分區 6, 分類 56
ID: stableId 37 條, 位置相依 1013 條 (96.5%); controls=209, options=4628, distinct legacyIds=1457
  legacy 衝突=2, legacy 被現行 ID 遮蔽=0, 未完全由 controls 暴露的分類=Negative/*（0/19）
硬寫 ID: 正式碼 current=448 legacyOnly=1 dangling=0; 測試 current=41 legacyOnly=52 dangling=6
硬寫 zh: targetZh/dressZh 檢查 242 懸空 0; zh 比對 88 懸空 1; 分類 literal 401 未知 9
執行期 meta: 785/1033 目錄選項帶 tags，共 2291 個（192 種）；database.json 顯式 tags 條目 0
角色卡: 33 張, MJ 卡名 33, manifest 33, Lab wardrobeLayers 134 段（逐字重複 122）
item_metadata 欄位白名單: 17 種皆被 buildEntries 讀取（被忽略: 無）
engine.js: 16711 行, 頂層資料表 81 個 / 2362 行 (14.1%), 其中 legacy/migration 表 21 個 / 535 行 / 340 條
確定問題 1: [LEGACY_ID_AMBIGUOUS] duoPoseId: shoulder-lean / leaning-shoulders -> best-friends-selfie | fashion-editorial-models
可能問題 5: TAGS_INFERRED_FROM_TEXT, DANGLING_ID_TEST(6, 刻意舊值), DANGLING_ZH_LITERAL(霓虹夜色), UNKNOWN_CATEGORY_LITERAL(9, 舊分類/舊標籤), CARD_LAYER_DUPLICATION(12 段不一致)
```

- 已知限制：
  - 「懸空」只看現行 ID 與 legacyIds，不會模擬專用 migration 函式，所以測試中的 6 個屬於預期內。
  - 分類 literal 的「未知」包含 legacy 表裡的舊**選項標籤**（例如 `仰角 (Low Angle)`），不全是分類。
  - slugify 與 ID 公式是從 engine.js 複製的，engine 若改公式需要同步更新（檔頭有註明）。
- 驗證方式：腳本實跑，並和既有 `sync --check`、`check_public_assets`、unittest 的結果交叉比對（數字一致：1,050 條、173 張參考圖、59 套裝、metadata 欄位 219 = 各欄位計數總和）。

---

## 9. 優點（前 5 名）

1. **生成管線確定且 fail-fast**：Markdown 是單向來源，`--check` 在 CI 執行；manifest 依名稱比對，缺漏、重複、多餘都會失敗（sync_to_json.py:158-255；deploy.yml:28-34）。
2. **目前參照完整性很好**：448 個硬寫 ID、242 個 targetZh、325 個 MJ 名稱或身形 key、173 張參考圖、33 張角色卡都 0 懸空；zh、en、desc 覆蓋 100%。
3. **相容紀律成熟**：1,457 個 legacyIds 加上專用 migration，舊鎖遷移有測試（例如 engineOutfitPresetDressCleanup.test.js:796-830）。內嵌對照表也有「key 必須能解析」的測試。
4. **執行期效能有設計**：預設 runtime 只編譯一次並深度凍結，cache 合約有文件；自訂 library 刻意不快取，以免讀到舊資料。
5. **資產管線乾淨**：原圖和 AVIF preview 分離，有大小預算與 manifest 一致性檢查（206 檔、2.9 MB）。

## 10. 問題（依影響排序）

1. **[確定] ID 綁定中文標籤與列序**：96.5% 位置相依；改名或重排會讓存檔 ID 失效，未知 ID 靜默變「全無」（engine.js:3294、:3897；重排證據 engine.js:2685）。
2. **[確定] 語意 tags 是隱藏 schema**：2,291 個 tags 由文字推論，0 個顯式；UI 不顯示的 desc 也是推論輸入（engine.js:1579、:1680-2600）。
3. **[確定] 相容真相分散且失敗時靜默**：KB JSON 加 engine.js 21 張表，7 處 `if (!target) return;`（engine.js:3195-3270）沒有通用測試；duo legacyId 有歧義（duoOptions.js:61-62/81-82 vs engine.js:3519）。
4. **[確定] SSOT 分散**：11 個模組 5,304 行內嵌目錄；角色卡 4 處、122 段逐字重複；MJ 投影 3 處（midjourneyItemNames.js:2、midjourneyBodyDescriptions.js:3、item_metadata `mj`）。
5. **[確定] 文件與測試落後**：撰寫指引列出不存在的常數、漏列必要步驟（wardrobe guide:476-477、:483-492）；bundling 文件過期（engine-architecture.md:322、:335）；Python 資料層測試只有 2 個；prompt_audit.test.mjs 沒有執行入口。

另外還有：Negative 19 條、自訂 overlay、`getKnowledgeBaseOptions`、`prompt_generator.py` 都沒有使用者（死資料或死碼，待判斷）；引擎與目錄在首屏 modulepreload，約 359 KB gzip（App.jsx:3）。

## 11. 建議（影響 / 工作量）

1. **把本腳本收進 repo**，例如 `scripts/check_catalog_integrity.mjs --strict`，在 CI 和 `sync --check` 一起跑。另外 export legacy 表供 target 存在性測試使用。**影響 高 / 工作量 小**。
2. **全面補上 stableId**：把現行 1,013 個位置 ID 原樣凍結成 stableId，寫入 item_metadata 或新增 md 欄位。存檔 ID 零變動，之後就能安全重排或改名（改名時加 legacyIds）。這會碰到相容面，**需 Cooper 核可**。**影響 高 / 工作量 中**。
3. **tags 快照測試**：把每個 ID 編譯後的 tags 寫成 baseline JSON，改 en 或 desc 造成 tag 變動時測試會顯式失敗。長期再評估把關鍵 tags 移到 metadata 明列。**影響 高 / 工作量 小（快照）或 大（遷移）**。
4. **集中舊資料對照**：把 engine.js 21 張 legacy 表搬到一個資料檔，由 sync 或測試驗證 target 存在；同時修掉 duo `shoulder-lean` 歧義，正確目標需 Cooper 決定。**影響 中 / 工作量 中**。
5. **合併角色卡來源並補文件**：wardrobeLayers 改由 profile 推導或交叉驗證（檢查 12 段不一致）；更新撰寫指引的常數名稱和各類型新增 checklist（§6.3），以及 bundling 文件。**影響 中 / 工作量 小～中**。

次要建議，留給 Cooper 決定：

- 未知 ID 時在開發者 console 警告，或在 Saved Card 加提示（會改變產品行為）
- 處置死資料或死碼：Negative、overlay、prompt_generator.py、特殊效果 fallback、`霓虹夜色` 條件
- 評估讓非 PAGE1 工作區延遲載入引擎（需要瀏覽器驗收）

---

## 12. 本報告未涵蓋 / not_stated

- 舊 ID 實際在使用者 Firestore / localStorage 中的分佈：not_stated（無法唯讀取得）
- 目錄當初為何保留 Negative 分區、為何保留自訂 overlay：not_stated
- dist 是否對應目前原始碼：dist 為 2026-10-11 21:00 的既有產物，本次沒有重新建置；載入行為的原始碼證據是 App.jsx:3 與 vite.config.js:12-14
