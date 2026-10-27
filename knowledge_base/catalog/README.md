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

## A5 核准產品變更與歷史回播（2026-10-26）

三筆場景已依 [獨立規格](../../Docs/specs/scene-semantic-a5-three-locations-v1.md)修正 explicit tags：倫敦移除 subterranean；清澈海灣岩岸、草地與樹木移除 commercial。原文、ID、aliases、順序與推論相容退路不變。其他問題及 P5b 不在本批。

A～E 原始基準／manifest／generator seals 保持不變；前端歷史測試只在隔離副本用 `scripts/lib/a5HistoricalReplay.mjs` 反轉這三筆精確 tags，再以當前引擎及原始封存工具回播。新的正式行為由 `sceneSemanticA5.test.js` 驗證。不得將歷史副本當正式來源，也不得擴大反轉條件掩蓋未審查差異。

```bash
# 當前正式行為；完整 npm test 也會執行
node --test webapp/src/lib/engine/sceneSemanticA5.test.js
# 本批一次性獨立對照：固定 pre-A5 Git 引擎 + 只有三個核准標籤差異
node scripts/scene_semantic_a5_acceptance.mjs /tmp/a5-acceptance.json
# 原始 A 封存重播由上述隔離副本承接
node --test webapp/src/lib/engine/catalogBaseline.test.js webapp/src/lib/engine/catalogCoverage.test.js webapp/src/lib/engine/catalogAlignment.test.js
```

直接對修正後正式資料執行原 A capture 或 D／E 的一次性「遷移零差異」命令，會正確看見本批產品差異；不可重錄舊基準、放寬比較器或宣稱原命令仍零差異。D／E 原始來源與完整等價證據保留於固定 Git／封存；常駐 schema、ID、strict、E 1,098 還原及前端門檻照常執行。本批新證據見 [A5 報告](../../Docs/reports/scene-semantic-a5-2026-10-26/README.md)。

## A5 commercial 後續修正與分層回播（2026-10-26）

本批基準為 `22d1103e2f88984af7ed33249b08b4e2729ba466`。只移除 11 個 commercial，4 筆保留；[規格](../../Docs/specs/scene-semantic-a5-commercial-v1.md)與[逐筆依據](../../Docs/decisions/2026-10-26-a5-commercial-review.md)。使用這個完整 SHA 執行本批 registry／sync／strict 檢查；八份生成物照常受同步驗證。

當前產品驗收用 `node scripts/scene_semantic_a5_commercial_acceptance.mjs /tmp/a5-commercial.json.gz`。前批 A5 原工具改由 `node scripts/scene_semantic_a5_commercial_history.mjs /tmp/a5-previous.json` 在隔離副本重演：精確回復本批 11 個 tags，再執行未修改的原工具。A～E 測試輸入先用新 helper 回復 11 筆，再交給舊 helper 回復三筆；extra tag、缺 ID、重複 ID 或四筆保留資料變動均拒絕。不能直接把新正式資料交給前批一次性驗收後重錄其預期值。

新增回歸位於 `webapp/src/lib/engine/sceneSemanticA5Commercial.test.js`，已由原 `npm test` glob 收入，不需改 CI。CI 使用 Node 22；本機也以 Node 22 為完整前端通過依據。CRT、其他內容問題與 P5b 維持另案。

## A5 CRT outdoor 修正與第三層回播（2026-10-26）

本批基準 `321404ecd041343f4a764260ef59ffc08a74a199`。只移除 CRT 的 outdoor，沿用既有室內政策，原文／ID／其他 tags／lyingSurface 保持。正式來源為分類 JSON；同步後只有 database 同步移除一個 tag，其他七份生成物不變。[規格](../../Docs/specs/scene-semantic-a5-crt-v1.md)、[決策](../../Docs/decisions/2026-10-26-a5-crt-outdoor.md)、[驗收報告](../../Docs/reports/scene-semantic-a5-crt-2026-10-26/README.md)。

```bash
# 當前正式產品回歸；npm test 會納入
node --test webapp/src/lib/engine/sceneSemanticA5Crt.test.js webapp/src/lib/engine/sceneSemanticA5Commercial.test.js
# 獨立固定 Git 引擎 + 單一核准 tag 差異 oracle
node scripts/scene_semantic_a5_crt_acceptance.mjs /tmp/a5-crt-acceptance.json.gz
node scripts/scene_semantic_a5_crt_imports.mjs /tmp/a5-crt-imports.json.gz
# 精確還原 CRT 的隔離副本，執行前兩批原工具；正式來源不回退
node scripts/scene_semantic_a5_crt_history.mjs /tmp/a5-crt-history
# 與本批 trusted main 核對；後續交付改用當次可信 base，不能重錄 registry
python3 scripts/sync_to_json.py --check --registry-base-commit 321404ecd041343f4a764260ef59ffc08a74a199 --report-json
```

`a5CrtHistoricalReplay.mjs` 先核對 CRT 整筆資料與有序 tags，再精確回復 outdoor；拒絕額外 tag、順序、來源變動、missing／duplicate ID，保持輸入與預設快取。接原 commercial inverse，再接原三筆 inverse，可重播 A～E。前兩批原 acceptance／history／inverse 與封存不改；不能直接在修正後正式資料執行舊一次性驗收並重錄預期值。原 commercial 七項回歸由固定 Git 原檔在 current code＋pre-CRT 隔離副本執行，保留原斷言；現行 15 筆狀態由 CRT 回歸另行保護。

測試需 Node 22 與完整 Git 歷史；既有 CI 已是 Node 22／fetch-depth 0，不需改 workflow。獨立 oracle 需固定 Git object；缺歷史時明確失敗，不以當前候選自證通過。資料檢查、歷史 ID、strict、完整前端、Prompt Quality、相同 seed audit、桌手機仍為產品變更門檻。舊 Saved Cards 文字保留；瀏覽器儲存既有的 none 欄位補齊以修正前 codec 對照。其他項目及 P5b 未開始。

## A5 西門町與第四層精確回放（2026-10-26）

本批可信基準 `5110401f3eee4aaa6cc59ee9175625cc96326d9e`，只去西門町 green_space。保留 parking 原文與 outdoor／commercial，現有候選與公開行為預期不變。11 筆雙標籤只審查，全部原值保留；前三批已交付與本批待交付的狀態分開，見 [A5 總表](../../Docs/decisions/2026-10-26-a5-closure-review.md)及 [本批規格](../../Docs/specs/scene-semantic-a5-ximending-v1.md)。

```bash
export REGISTRY_BASE_COMMIT=5110401f3eee4aaa6cc59ee9175625cc96326d9e
python3 scripts/sync_to_json.py --check --report-json
node --test webapp/src/lib/engine/sceneSemanticA5Ximending.test.js webapp/src/lib/engine/sceneSemanticA5Crt.test.js webapp/src/lib/engine/sceneSemanticA5Commercial.test.js
node scripts/scene_semantic_a5_ximending_acceptance.mjs /tmp/a5-ximending.json.gz
node scripts/scene_semantic_a5_ximending_imports.mjs /tmp/a5-ximending-imports.json.gz
node scripts/scene_semantic_a5_ximending_history.mjs /tmp/a5-ximending-history
```

此為本批固定 SHA；後續新變更仍須選當次受信任的基準。`a5XimendingHistoricalReplay.mjs` 僅精確還原西門町整筆核准資料，再接原 CRT／commercial／三筆 inverse。原 CRT 九項回歸、原 commercial 七項回歸由固定 Git 原檔隔離執行，不重寫原斷言。前述三批一次性 acceptance 不應直接對新正式資料執行；請透過本節 history 指令逐層回放。新的當前產品回歸另驗全 database 與 11 筆未決原值。

Node 22／完整 Git 歷史、既有 npm test glob 與 CI 接線沿用，不需要變更 workflow。其餘 schema／ID／strict、完整前端、同 seed audit 與桌手機門檻依 root AGENTS 執行。[本批驗收報告](../../Docs/reports/scene-semantic-a5-ximending-2026-10-26/README.md)。不修改歷史基準，不進入其他內容問題或 P5b。

## A2 特殊穿搭膠帶控制語（2026-10-27）

可信基準 `3a18fc2c2529dce38782135638ffd67c38a62187`。只修改膠帶造型的兩段非視覺操作語，新增完整舊英文 alias，保留 semantic／ID／排序／中文／圖片，不補紅色。分類 schema 及 field_mapping 追加既有 alias 欄位的特殊穿搭範圍；生成 Markdown／database 由 sync 更新。runtime、renderer、存檔格式與其他資料不變。

```bash
export REGISTRY_BASE_COMMIT=3a18fc2c2529dce38782135638ffd67c38a62187
python3 scripts/sync_to_json.py --check --report-json
node --test webapp/src/lib/engine/specialTapeControlLanguage.test.js
node scripts/wardrobe_control_a2_special_tape_acceptance.mjs /tmp/a2-special-tape-acceptance
node scripts/wardrobe_control_a2_special_tape_history.mjs /tmp/a2-special-tape-history
```

新的 test-only inverse 先驗證本筆紀錄、分類順序、source／database／Markdown 狀態、兩份管理檔及兩份回放銜接檔，再在隔離副本精確回復。既有 A～E／A1／A5 與前批 A2 回放接上本層；E 僅複製 runtime 的測試副本使用同樣嚴格的單筆 database inverse，並精確還原本批回放銜接檔後再進入原快照／還原工具。舊工具及基準不重錄。history 在全新暫存輸出目錄運行原工具，保留它們的歷史路徑保護規則，再保存本批新證據。

舊無快照的渲染文字辨識限制以固定 Git 保持，不視為完整選值往返；舊原始英文 alias、JSON 及 PAGE1 完整快照另驗精確還原。[規格](../../Docs/specs/wardrobe-control-a2-special-tape-v1.md)及[驗收報告](../../Docs/reports/wardrobe-control-a2-special-tape-2026-10-27/README.md)。本機驗收與歷史回放已通過，Cooper 已授權本批限定交付；其他項目及 P5b 未開始，實際 Git／CI 結果另行回報。

## A2 runtime 配色文字（2026-10-27）

本批正式 catalog、生成 Markdown／database、ID／aliases／semantic 不變。配色 builder 與新舊文字還原採 [runtime 規格](../../Docs/specs/wardrobe-runtime-color-a2-v1.md)。以 main `bd31bd34f0bfa8986193a6048fe1a69a265e3668` 執行 sync `--check` 與歷史 ID；不重錄任何 A～E／A5／前批 A2 基準。

```bash
node --test webapp/src/lib/engine/runtimeWardrobeColor.test.js
node scripts/wardrobe_runtime_color_a2_acceptance.mjs /tmp/a2-runtime-acceptance
node scripts/wardrobe_runtime_color_a2_history.mjs /tmp/a2-runtime-history
```

歷史工具先經新的精確隔離 inverse，再執行前批膠帶原工具及完整回放鏈；現行新句型由本批回歸／固定 Git 對照另驗。已知特殊穿搭套用清色系不在本批修復。實際結果見[本批報告](../../Docs/reports/wardrobe-runtime-color-a2-2026-10-27/README.md)。
