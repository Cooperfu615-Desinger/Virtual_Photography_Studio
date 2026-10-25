# Catalog JSON 正式來源、明確語意與舊映射（C／D／E）

2026-10-25：由 main `64870460e8a153a07baf953df0d6cf784ce2aca4` 切換。正式目錄為 `index.json` 指定順序的 56 份分類 JSON，共 1,050 筆。`schema.json`、`field_mapping.json`、`id_registry.json`、`legacy_mappings.json` 是管理文件，不是分類。manifest 繼續負責參考圖；不把圖片衍生鍵寫回來源。

## 編輯與驗證

1. 由 `index.json` 找到分類檔，修改 `entries`；既有 `id`、`legacyIds` 及陣列順序保留。顯示與抽樣順序仍是行為，不因 ID 穩定就任意重排。
2. 新增只使用 `<group>:<分類slug>:<英文-kebab-case>`，同步在登記簿追加 `active` 與初始 group/category、決策來源。不得另發 `frozen`、重用舊 ID、刪除歷史或退役既有條目。C 本身沒有新增或退役項目。
3. 新增、移動列時同步維護 index 的 Markdown layout ID 位置；每類順序須等於 entries，每 ID 恰好一次。layout 的 cells 只保存結構欄，英文／名稱／描述由紀錄產生；標題、前言、表頭與分隔行保留原文。
4. schema 驗證所有來源及巢狀欄位；`id/zh/en/desc` 非空，表格文字不得含 `|` 或換行。Regional 的 `inspiration` 與 `desc` 分別填寫，生成時以 ` | ` 組回。允許的 false、0、空字串依 schema 原樣保留。
5. 更新欄位責任清單的實際 source/generated/runtime 分工及分類範圍。`outerwear`、`topUnderbust`、`subjectLight` 仍保留來源頂層，engine 依現有順序投影至 meta。`lyingSurface`、`mj` 及 manifest 圖片映射保留；D 已啟用 `meta.semantic`，保存整個推論底層物件；不是最終合併 meta。新增條目必填並人工審閱；修改 zh／en／desc 時須明列語意是否改變及原因。各分區 tag enum、null／空陣列與有序值依 schema 驗證。Negative 保存 conflictTags／useTags，不添加 tags。
6. 修改前選定已審查的完整 Git SHA，不能從候選 JSON 取得基準。A–E 已交付；以下日常驗證以已交付 E `2bd28c5a` 為本次收尾的可信任基準。後續選用當次已審查、早於候選的可信任提交；不能回到 pre-C bootstrap。

```bash
export REGISTRY_BASE_COMMIT=2bd28c5a26ddcc748ed2af7c347a3874a192a4a0
python3 scripts/sync_to_json.py
python3 scripts/sync_to_json.py --check --report-json
python3 -m unittest discover -s scripts/tests
python3 scripts/check_public_assets.py
node scripts/check_catalog_integrity.mjs --strict
node --test scripts/tests/catalog-integrity.test.mjs scripts/tests/catalog-semantics.test.mjs scripts/tests/catalog-legacy.test.mjs
```

`--registry-base-commit FULL_SHA` 可代替環境變數。一般歷史驗證從該 Git object 讀 registry，報告 SHA-256；缺物件、缺 registry、非祖先或自我基準均失敗。初次 C 只能緊接固定 pre-C，使用封存 A inventory 的固定 SHA 與受信任 B 保留的 A snapshot 核對。候選提交須由 CI 指定；本機 HEAD 前進後不容許重用 bootstrap。PR 使用事件 base/head，push 使用 before/current，手動 CI 使用 HEAD^/HEAD；checkout 取得完整歷史。

同步先驗證全部來源、registry、manifest、總覽映射及 legacy source 結構，再準備八份輸出，最後替換。一般 I/O 失敗會回復已替換檔；`--check` 僅讀不寫，逐位元組檢查 database、六份 Markdown 與 legacyMappings.json。這不是跨八檔的斷電交易；程序／電源中斷後需重新 sync/check，不能提交部分輸出。

六份 `knowledge_base/*.md` 是唯讀總覽，`webapp/src/data/database.json` 是編譯產物；不要手改。舊 `item_metadata.json`、`outfit_preset_metadata.json` 已合併到分類紀錄並移除，可從 pre-C Git 取得原文。B 的一次性 rehearsal 工具在已切換 checkout 直接拒絕；如需重演，以固定 pre-C 的乾淨外部 checkout 執行原工具，不回退正式 reader。

## 完整驗收與基準保護

依 root AGENTS 跑前端 test、prompt-quality、lint、build、相同 seed/count audit、A 三套完整重播與 seal、五工作區桌手機還原／匯入。C／D／E 不重錄 A。未來核准產品變更應另建有來源與理由的新 revision，不能為通過遷移而改既有快照。J12 兩個精確歷史例外保留；其他 blocker 或過期例外都失敗。

正式五工作區為 Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、Saved Cards；動作姿勢與觀察式抓拍為 Prompt 整合模式。外部生成不屬 C 驗收。

[規格](../../Docs/specs/catalog-data-architecture-v1.md) · [C 報告](../../Docs/reports/catalog-architecture-c-2026-10-25/README.md) · [切換前操作文件](../../Docs/archive/2026-10-25-catalog-c/ARCHIVE_INDEX.md)

## D 明確語意與唯讀建議

D 基準為 `17074fbe3850e2e9fea300b36697643913f707a1`；凍結期間原樣搬移 1,050 筆實際 inferredMeta。正式 library 有 semantic 就不再依文字推論，連空物件也優先；不合法的 semantic 型別會拒絕。只有缺少 semantic 的自訂／歷史 library 保留 infer*Meta。測試 `getCompiledCatalogForTesting().entries.inferredMeta` 沿用欄位名，D 後表示有效語意底層。最終 meta 不包含 semantic 容器，覆寫與 tags 有序去重規則依規格 §6.1。

```bash
node scripts/suggest_catalog_semantics.mjs '完整的既有目錄 ID'
# D 的一次性零差異驗收；日後核准語意變更不能以重錄基準通過此檢查
node scripts/validate_catalog_semantics.mjs --source-sha 17074fbe3850e2e9fea300b36697643913f707a1
```

建議工具只複製記憶體資料、移除目標條目的 semantic，經實際推論取得差異；不寫檔、不改預設快取，也不自動接受推論建議。標籤順序與物件鍵順序仍需保持。[已凍結問題](../../Docs/reports/database-analysis-2026-10-11/frozen-known-issues.md)不得在遷移中順便修正。

一次性搬移工具 `scripts/migrations/materialize_catalog_semantics.mjs --source-sha FULL_SHA --output NEW_EXTERNAL_DIRECTORY` 僅接受上述固定 pre-D SHA，從該 Git object 載入原引擎。來源分類檔須逐位元組吻合基準；先驗證全部候選與 schema，再發布到全新 repo 外目錄。禁止覆寫目標、semantic 或來源；本 checkout 已切換，重跑會拒絕。需要重演時，在隔離的 pre-D checkout 套入本批工具與 D schema 後執行，勿回退正式資料。此工具與固定基準驗收不接 CI 自動遷移；CI 持續執行 schema／歷史 ID／映射／工具及前端測試。

完整證據見 [D 報告](../../Docs/reports/catalog-architecture-d-2026-10-25/README.md)，原稿見 [D 前歸檔](../../Docs/archive/2026-10-25-catalog-d/ARCHIVE_INDEX.md)。此為 D 階段歷史；E 現況見下節，P5b 未開始。

## E 舊映射集中

E 搬移的歷史基準為 D 已交付 `5e7ed02952ceea4a2f76b81583c5f783748ff308`；當時 Cooper 確認 E 範圍及共用凍結，僅該工作修改。E 現已由 `2bd28c5a` 交付，CI 40192867913 成功。22 表／334 筆與兩個舊分類常數只搬來源形式；JSON 不含 `.map()` 產生的 legacyId(s)，Map 保留有序 pairs。五個 `.map()` 與 Map 建構仍在 engine 載入時執行；髮絲狀態函式內的 Map 也維持呼叫時計算。

`legacy_mappings.json` 的 envelope 為 version、constants、tables。各表有 shape、fields、source；欄位依固定的 `scripts/lib/legacyMappingContract.json` 宣告 fieldKind。除 catalog-zh、embedded-ref、attribute、legacy-key，增加 catalog-category／legacy-category；歷史 tuple 的非負整數索引由 pair／pairs format 檢查。舊分類可已退役，不要求它存在於現行分類。legacy-key 唯一性以同表、分類與欄位為範圍，tuple 含原索引；不能只以中文標籤判定重複。自己舊 ID 等於自己現行 ID 合法，等於其他現行條目則阻擋。`prompts[]` 保留歷史英文，不改寫為中文名或 ID。

同步先完成所有結構與歷史 ID 檢查再發布八份輸出；管理檔不混入 index 分類列舉。strict 另用實際 buildEntries displayZh／JS Pose Composer 目錄檢查全部目標，檢查失敗不得提交。對 JSON 來源的修改必須連同生成物驗證，不能靠修改 fields 降級目標檢查。

```bash
# 固定 pre-E 零差異驗收；不接 CI 自動重錄
node scripts/validate_legacy_mappings.mjs --source-sha 5e7ed02952ceea4a2f76b81583c5f783748ff308
# 永久前端基準與 E 工具測試，亦由完整 npm test / CI 執行
node --test webapp/src/lib/engine/legacyMappings.test.js scripts/tests/catalog-legacy.test.mjs
```

一次性 `scripts/migrations/materialize_legacy_mappings.mjs --source-sha FULL_SHA --output NEW_EXTERNAL_DIRECTORY` 只接受固定 pre-E，從 Git object 執行原引擎建立候選與原始計算基準；engine 必須仍逐位元組等於 pre-E。拒絕內部／既有目標、錯誤 SHA、已搬移或期間有變動的 engine。現行 checkout 重跑會拒絕；重演需隔離 pre-E checkout 加入 E 工具，不能回退正式 engine。這個工具不接 CI 自動遷移。

永久 fixture 包含 22 表計算結果、2 常數、實際 helper 推導的 aliases，以及 1,098 個完整 normalizeLocks／舊英文解析結果雜湊；單人、雙人 A/B、顯式選值、未知舊鍵與 first-match 均納入。來源與 compiled/controls 的整體零差異則由一次性驗收及既有 A 封存保護。J12 兩項及「雙腿屈起」兩處既有首筆選擇保留，無新豁免。renderer 的 LEGACY_OUTERWEAR_DOUBLE_SHOULDER_STYLING_TEXT、函式陣列與其他模組不搬；P5b 未開始。

詳見 [E 報告](../../Docs/reports/catalog-architecture-e-2026-10-25/README.md)與 [E 前原稿歸檔](../../Docs/archive/2026-10-25-catalog-e/ARCHIVE_INDEX.md)。E 已提交／推送，對應 [CI 40192867913](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40192867913) 成功。固定 pre-E／pre-D SHA 保留作歷史等價驗收，不能換成新 HEAD。P5b 仍未開始。

## 驗證護欄收尾

`check_catalog_integrity.mjs --strict` 現在同時禁止正式程式使用兩個測試專用匯出，並列出 22 表的 ID／文字檢查方式。正式程式使用 named public imports；不要 namespace／wildcard／dynamic import 整個 engine，也不要透過測試檔轉接。測試檔只允許 `.test.*`／`.spec.*`；一般 helper／fixture 檔仍接受掃描，解析失敗阻擋。

獨立遷移按真正輸入 control 查 ID，涵蓋單人及雙人 A/B；原有合法跨欄位配對由不可重錄的 pre-E 映射與 A control 封存共同保護。新的衝突不能藉由修改同批來源或放寬 allowlist 解決。既有 9 個自身 option alias 與 27 個含角色欄位的歷史配對保持；兩張 Prompt aliases 是文字比對，沒有 ID 推導。

僅工具／文件變更時，執行三份工具測試、Python／同步／strict 與受影響的封存回歸；是否擴至前端／瀏覽器依 root AGENTS。本次另跑完整前端、lint/build、E 零差異與相同 seed audit，正式資料／引擎未變，所以未重跑瀏覽器或外部出圖。[本機收尾證據](../../Docs/reports/catalog-architecture-closure-2026-10-25/README.md)已完成本機驗收並獲授權限定提交／push；實際交付結果另核對，不將 E 已成功的 CI 當作收尾 CI。
