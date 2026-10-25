# Catalog E：舊映射集中驗收（2026-10-25）

狀態：E 已交付 main `2bd28c5a26ddcc748ed2af7c347a3874a192a4a0`，[CI 40192867913](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40192867913) 已完成且成功。下方「沒有 E run／未提交／授權」均為搬移當時的歷史紀錄；交付核對及後續驗證護欄收尾見本文末節。原來源、fixture、測試證據與交付清單保留，不因更新本文件狀態而重算歷史雜湊。正式來源維持分類 JSON，P5b 未開始。

## 基準、範圍與結果

開始與收尾核對 HEAD／origin/main／遠端 main 均為 `5e7ed02952ceea4a2f76b81583c5f783748ff308`。D 已交付，[CI 40185121595](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40185121595) 成功；本輪沒有 E 遠端 CI run。使用既有 main checkout `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`，保留原專案及其他工作樹的 140 份未提交內容。

Cooper 已核准 22 張映射表＋2 個舊分類常數、renderer 文字留原位，並確認 Claude Code／其他工作階段暫停 E 共用範圍。先保存十份原稿與來源雜湊，再從固定 Git object 載入真正的 pre-E 引擎取得計算值；在 repo 外重演得到相同來源、fixture 及候選，才取代原 engine literal initializer。基準不是從新 JSON 或改寫後引擎倒錄。

- 新增 `knowledge_base/catalog/legacy_mappings.json`，共 334 筆來源；逐位元組同步為 `webapp/src/data/legacyMappings.json`。原 56 分類／1,050 筆資料、schema、registry、index、semantic、manifest、database 與六份 Markdown 不變。
- engine 只替換 literal 來源、加入 JSON import 及回傳副本的測試 export。5 處載入時 `.map()`、Map 建構、slugify 與所有 migration／renderer 函式逐位元組不變。髮絲 Map 仍於呼叫時計算；first-match、顯式選值優先與靜默找不到的退路保留。
- 永久 [legacyMappings.baseline.json](../../../webapp/src/lib/engine/legacyMappings.baseline.json) 封存 22 表的真實計算值、2 常數、helper 推導 aliases 及 1,098 個 normalizeLocks／舊英文解析結果。測試固定 fixture SHA，不允許靠重錄隱藏差異。
- Python 驗證固定表／欄位契約、必填／未知欄位、tuple/index、重複 JSON key；sync 先準備全部八份輸出再替換，一般 I/O 失敗回復。Node strict 使用實際 displayZh／Pose Composer 檢查 437 處參照、舊鍵重複及 ID 衝突。9 個自身舊 ID 等於自身現行 ID 合法，沒有新增例外。
- [清點表](inventory.md)列出所有名稱、原行號、計算時機、consumer；[遷移 manifest](migration-baseline.json)與[驗收結果](legacy-validation.json)提供來源／fixture 雜湊。既有 J12 兩項與兩處「雙腿屈起」首筆選擇不變。
- CI 加入 E 工具測試；既有 Python discovery 與前端 npm test 自動納入新基準。固定 Git 的一次性驗收／候選工具不接 CI 自動遷移。操作文件同步更新；姿勢去向文件只追加來源追溯，前文逐位元組保持。

## I1–I9 驗收

| 不變量 | 實際證據與結果 |
| --- | --- |
| I1–I3：ID、別名、順序、語意 | [E 比對](legacy-validation.json)：原始來源、22 張計算表、2 常數、1,098 還原、compiled entries/catalog、controls 皆零差異，engine 其餘邏輯零差異；72 份原有知識庫／前端資料檔 hash 不變。[D 語意檢查](d-semantic-validation.json)仍通過。 |
| I4：完整輸出 | [前端](frontend-tests.txt)執行 A 三套封存重播：3,251 次／2,851 不同案例零差異，含六輸出、selection、structured、摘要；[Prompt Quality](prompt-quality.txt)754/754。 |
| I5：亂數／audit | A 重播同時比對 RNG 呼叫次數；[搬移前](audit-before.txt)與[搬移後](audit-after.txt)200 筆、seed prompt-quality-baseline 逐位元組相同，0 blockers／18 既有 diagnostics。 |
| I6：舊資料還原 | E 1,098 案涵蓋每張表、單人與雙人 A/B、顯式選值、未知舊鍵、J12 與英文 aliases；既有 Saved Cards／JSON／Markdown／全身角色匯入測試全過。 |
| I7：前端 | 完整1,830/1,830、Prompt Quality754/754；[lint](lint.txt)與[build](build.txt)通過。保留既有大於500 kB chunk 警告。 |
| I8：工具／資料 | [Python](python-tests.txt)41/41、[Node工具](tool-tests.txt)21/21；[sync](sync-check.json)以 pre-E 查核1,050歷史ID及8輸出；[strict](integrity.json)0 blockers／0 stale、僅J12兩項、4類既有possible；[公開資產](public-assets.txt)207項通過。 |
| I9：瀏覽器 | 1440×1000、390×900；[舊流程](browser-regression/results.json)22項＋[全身匯入](browser-import/results.json)22項，16張畫面已檢視，五工作區、還原／重抽／重新匯入、缺來源停用狀態及下游輸出皆通過。無新頁面橫向溢出、遮擋、破圖、console/page errors；externalPosts=0。 |

畫面總覽：[五工作區](browser-regression-contact.jpg)、[匯入還原](browser-import-contact.jpg)、[手機匯入／缺來源細節](mobile-import-detail.png)。手機長頁採既有正常垂直捲動與有界輸出面板，無改版。

## 重現、保護與限制

依 [catalog 操作](../../../knowledge_base/catalog/README.md)設定 `REGISTRY_BASE_COMMIT=5e7ed02952ceea4a2f76b81583c5f783748ff308`。先 sync／check，再 Python discovery、三個工具測試、strict、前端 test／prompt-quality／lint／build、同 seed audit 與兩個 browser 腳本。Node25 本機完整 suite 使用 `NODE_OPTIONS=--test-reporter=tap npm test`，CI 保持 Node22。一次性零差異驗收：

```bash
node scripts/validate_legacy_mappings.mjs --source-sha 5e7ed02952ceea4a2f76b81583c5f783748ff308
node scripts/validate_catalog_semantics.mjs --source-sha 17074fbe3850e2e9fea300b36697643913f707a1
```

[原 A seal](a-seal.txt)與[alignment seal](a-alignment-seal.txt)均通過，A/B/C/D 歷史證據不改。[十份操作原稿](../../archive/2026-10-25-catalog-e/ARCHIVE_INDEX.md)逐位元組歸檔；[保護結果](preservation.json)核對其他140份未提交內容、非本次追蹤檔與姿勢原文。完整交付範圍與 hash 見 [allowlist.json](allowlist.json)，清單不代表已暫存或已授權提交。

工具初次整套執行因命令漏帶 REGISTRY_BASE_COMMIT 而正確拒絕；補入固定 pre-E 後全數通過，沒有放寬歷史檢查。E 驗收工具初次讀 Git 中文路徑時使用文字分行而遇到 Git quoted path，已改 NUL 分隔後通過。這兩項為本輪驗證操作／工具問題，沒有更改正式資料或預期結果。

未修正 D 已凍結的語意問題、J12、姿勢內容或狀態，也未進入 P5b。沒有付費模型生成；本次驗收證明本機資料／行為等價，不代替外部模型影像品質或尚未觸發的 E CI。未 stage／commit／push；待 Cooper 驗收與後續交付授權。

## 交付授權補註

2026-10-25：Cooper 已驗收並授權只提交／push 本批 E。提交前再次核對84份交付清單、83份雜湊與其他140份未提交內容，遠端 main 仍為 pre-E `5e7ed029`。本輪只補目前狀態、規格、操作文件與本報告的驗收授權文字，更新清單雜湊；程式、資料、基準、驗收工具、CI 與所有已保存的測試證據不改。不進入 P5b。最終提交 SHA 與 CI 結果於交付回報核對，不為把自身 SHA 寫回同一提交而追加循環提交。

## 交付結果與後續收尾核對

2026-10-25 重新讀取 GitHub main 與 workflow run：E 提交 `2bd28c5a26ddcc748ed2af7c347a3874a192a4a0` 已在遠端 main，CI 40192867913 為 completed／success，品質檢查、建置及 Pages 部署成功。84 份原交付清單與其 hash 描述 E 提交當時的檔案，不套用到後續文件修訂。

逐條核對 v1.1 後，使用者另行授權補齊正式程式引用測試匯出的禁止規則，以及獨立遷移表的 ID 衝突／所有權檢查。新增護欄與反例不改 E 的來源、引擎或封存；重新驗證 1,098 還原、全部計算表／compiled／controls／引擎邏輯仍零差異。詳見 [收尾報告](../catalog-architecture-closure-2026-10-25/README.md)。這批收尾已完成本機驗收並獲 Cooper 授權限定提交／push，實際 Git 與該提交 CI 結果另核對；Phase 4、姿勢內容／狀態及 P5b 未啟動。
