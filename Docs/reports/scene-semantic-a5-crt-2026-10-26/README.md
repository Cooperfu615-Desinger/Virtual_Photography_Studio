# A5 CRT outdoor 修正驗收（2026-10-26）

狀態：Cooper 已確認本機實作與完整驗收通過，授權只提交／push 本批資料、文件、回歸案例、歷史回放與驗收工具；實際 Git 及該提交 CI 結果另行核對。只處理已核准 CRT outdoor 誤標，其他項目及 P5b 未開始。

## 基準、範圍與結果

基準為 `321404ecd041343f4a764260ef59ffc08a74a199`；開始及收尾皆核對 GitHub main，與本機 main／origin/main 相同。沿用現有 main 工作目錄 `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`。原專案路徑及其他工作目錄保持原狀。

只從 `locations:攝影棚與背景-studio-sets:室內-crt-電視牆攝影棚:13` 移除一個 outdoor：正式分類 JSON 與生成 database 各刪一行。VCR decks 原文、ID／有序 aliases、列序、其他 tags、藍灰地板 lyingSurface、其他七份生成物、推論退路、renderer、CI 設定均不變。[規格](../../specs/scene-semantic-a5-crt-v1.md)、[決策與歷史成因](../../decisions/2026-10-26-a5-crt-outdoor.md)、[固定來源資料](../../../scripts/lib/a5CrtReview.json)。

沿用既有室內政策：一般全身、環境光全無／隨機時，環境光含全無維持 19 項，主體光 22→23，恢復窗格投影光；其他景別依原規則可恢復百葉窗條紋投影光，暗光／棚光排除仍有效。隨機泳裝／波希米亞及自動外套可改變，六輸出與全身角色照依同一 resolved state 產生；手動比基尼及其他有效鎖值保持。舊一般姿勢支撐池 77→73，移除四項戶外表面；仰躺表面主導的 80 項與正式風格池保持。未恢復退場的 Pose Composer UI。

## 驗收證據

| 驗收 | 結果與證據 |
| --- | --- |
| 獨立 Git oracle | [3,834 案例／836 候選池](acceptance.json.gz)，0 mismatch；154 個其他場景選項、12 舊收藏、24 transition、5 既有匯入來源通過 |
| 有意的連帶變化 | 868 案例公開輸出、871 案例 selection、492 案例 RNG 有差異；每筆等同固定 Git 引擎僅移除 outdoor 的獨立結果，不能宣稱全部零差異 |
| CRT 全身角色匯入 | [2 個固定案例](crt-imports.json.gz)：手動泳裝及隨機穿搭；各 3 次抓拍重抽、明確重新匯入、JSON／Markdown 還原，0 mismatch |
| 專用回歸 | [10／10](logs/focused-final.txt)：9 項新 CRT 回歸＋原 commercial 七項測試的隔離執行入口；[修改前 9 項失敗](logs/focused-before.txt.gz)符合預期 |
| 前端全套 | Node 22.22.3，[1,847／1,847](logs/frontend.txt)，0 fail／skip；原 commercial 七項另在子程序實際執行，不藉改預期值取消舊斷言 |
| Prompt Quality | [754／754](logs/prompt-quality.txt) |
| 資料／ID／完整性 | [1,050 筆、1,050 歷史 ID、8 生成物](logs/sync.txt)；[strict](logs/strict.txt) 只有原 J12 兩項允許，0 blockers／0 stale |
| 工具 | [Python 41／41](logs/python.txt)、[catalog 32／32](logs/catalog-tools.txt) |
| lint／build／資產 | [lint](logs/lint.txt.gz)、[build](logs/build.txt.gz)、[公開資產](logs/assets.txt)通過；build 僅既有 >500 kB chunk 警告 |
| 同種子 audit | [前後比較](audit-comparison.json)：200／prompt-quality-baseline，只排除 findings[*].promptId，完全相同；0 blockers／18 既有診斷 |
| 歷史重播 | [commercial 3,804 案例／12,540 池](history/commercial.json.gz)、[首批 A5 1,740 案例](history/first-a5.json)；原工具未改，0 mismatch |
| 桌手機 | [既有流程 22 項](browser-general/results.json)＋[CRT 24 項](browser-targeted/results.json)；1440×1000／390×900、14 張截圖已檢視，0 console/page error／外部 POST，無破圖或頁面橫向溢出 |
| 保護核對 | [357 歷史檔案、20 個其他工作目錄／140 份未提交檔案](protection.json) SHA 保持，13 份已追蹤修改均屬本批 allowlist，其他 1,863 份 tracked 不變，index 空白 |

機器可讀總表：[validation.json](validation.json)。逐檔交付範圍：[change-inventory.json](change-inventory.json)；證據雜湊：[evidence-sha256.json](evidence-sha256.json)；[收尾檢查](final-verification.json)。

## 瀏覽器與收藏

五個現行頁面為 Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、Saved Cards；神情姿態／自然站姿在 Prompt 工作台 B 區驗證。桌手機皆檢查 CRT 全身、牛仔中景與胸上特寫：選窗光、切暗環境光清除不相容鎖值、保留手動泳裝、生成六輸出、存卡／重載／套用；另驗隨機穿搭與自動外套。既有流程涵蓋角色及場景匯入、抓拍、舊卡／Markdown ZIP、六輸出複製與 DLL 草稿傳遞。CRT 專用全身抓拍的解析狀態由另兩個獨立 oracle 案例驗證。

舊收藏在 App 載入後原有的 none 欄位補齊保持；比對的是修正前 codec serialize／deserialize round-trip，而非錯誤要求儲存原始 JSON 永遠逐位元組不變。原六輸出文字與 ID 保留，套用重生成才依現行室內政策。詳見 [人工畫面檢視](browser-review.json)。未呼叫任何付費／外部出圖。

## 歷史回播方法

新增 `a5CrtHistoricalReplay.mjs` 只在臨時副本核對並回復 CRT 的整筆來源及有序 tags，接原 commercial 11 筆 inverse，再接原三筆 inverse。缺 ID、重複 ID、額外／重排 tag、原文／alias 改變會拒絕。正式資料和預設快取不回退；A～E、前兩批 A5 原始報告、基準及 acceptance／history／inverse 原位保持。

6 份歷史前端測試只改入口指向 CRT 層。commercial 原七項測試由固定 Git `321404ec` 原檔在 current code＋pre-CRT 隔離根目錄執行；保留舊 CRT 不變斷言。當前 15 筆 commercial 決策與整庫唯一差異由新回歸直接保護。現行 CI 已使用完整 Git 歷史及 Node 22，原 npm test glob 會納入，無需更動 CI。

## 可重跑命令

以下在工作目錄根執行，使用 Node 22；輸出請放新的暫存位置，勿覆寫本次及歷史封存。

```bash
node --test webapp/src/lib/engine/sceneSemanticA5Crt.test.js webapp/src/lib/engine/sceneSemanticA5Commercial.test.js
node scripts/scene_semantic_a5_crt_acceptance.mjs /tmp/a5-crt-acceptance.json.gz
node scripts/scene_semantic_a5_crt_imports.mjs /tmp/a5-crt-imports.json.gz
node scripts/scene_semantic_a5_crt_history.mjs /tmp/a5-crt-history
python3 scripts/sync_to_json.py --check --registry-base-commit 321404ecd041343f4a764260ef59ffc08a74a199 --report-json
python3 -m unittest discover -s scripts/tests
node --test scripts/tests/catalog-integrity.test.mjs scripts/tests/catalog-semantics.test.mjs scripts/tests/catalog-legacy.test.mjs
node scripts/check_catalog_integrity.mjs --strict
python3 scripts/check_public_assets.py
npm --prefix webapp test
npm --prefix webapp run test:prompt-quality
npm --prefix webapp run lint
npm --prefix webapp run build
npm --prefix webapp run audit:prompts:strict
```

瀏覽器工具沿用 `http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`，需本機服務及可用 Playwright。使用 `PLAYWRIGHT_MODULE` 指向現有安裝，執行 `node scripts/catalog_baseline_browser.mjs URL NEW_OUTPUT_DIRECTORY` 與 `node scripts/scene_semantic_a5_crt_browser.mjs NEW_OUTPUT_DIRECTORY`。各自建立隔離 browser context／storage，不操作使用者真實收藏。驗收完成後已停止本次啟動的服務，確認 5175 無監聽程序。

## 驗收過程診斷與限制

本次新增測試工具曾遇到子程序繼承 NODE_TEST_CONTEXT、Node process lint import、瀏覽器收藏 seeding 時機及既有儲存欄位補齊四類測試設定問題；已修正工具並重跑相應門檻。保留 [runner 診斷](logs/focused-runner-diagnostic.txt.gz)、[lint 診斷](logs/lint-diagnostic.txt.gz)、[seeding 診斷](logs/browser-seeding-diagnostic.txt)、[normalization 診斷](logs/browser-normalization-diagnostic.txt)。未為通過測試更動產品程式。完整前端後的純 process import 補齊另經 focused 10／10、lint 通過；browser 工具最後一次修正後 24／24 通過。

本機驗收時未執行遠端 CI 或外部模型出圖；後續 Cooper 已授權限定提交／推送並確認該提交 CI。此報告保留本機驗收證據，Git 交付結果另行核對。既有 J12、audit 18 項診斷及 build chunk 警告保留，不擴大修正。舊缺 semantic 自訂資料仍可能由 deck 推論得到 outdoor；這是本次明確保留的相容退路，正式 CRT 已使用修正後的 explicit semantic。其他項目與 P5b 未開始。

提交前完整暫存檢查發現五份原始日誌的行尾空白／末尾空行；本批將它們無損 gzip 保存，解壓後逐位元組與原始日誌一致，未重跑或改寫驗收結果。原雜湊與壓縮檔對照記錄於 change-inventory.json 的 losslessLogPackaging；程式、正式資料與所有歷史基準未變。
