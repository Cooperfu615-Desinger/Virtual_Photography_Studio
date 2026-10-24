# 目錄資料架構 v1.1：A 階段交付報告

日期：2026-10-24。狀態：A 本機實作與驗證完成，待使用者審閱；沒有 stage、commit、push 或 deploy。B–E 尚未開始。

## 結果與來源

A 建立遷移前的安全網，沒有切換 Markdown 正式來源、修改資料內容、凍結新 stableId、建立 schema／登記簿或改寫 renderer。

- 工作目錄：`/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`，分支 `main`。
- 開始時本機與遠端 main：`0746b280cc9f5c00daec7dadc73329779ac658e9`。
- 交付前再次核對本機與遠端 main，完整 SHA 未前進。原專案目錄另有觀察式抓拍相關未提交工作；本批未修改或整理該目錄。
- 保留先前未提交的 v1.1 修訂與 `catalog-data-architecture-v1.md.bak-20261024-v1`。原專案目錄、其他分支與使用者資料不動。
- 核心基準先在未修改的 engine/data 上錄製兩遍並確認相同，再加入測試專用匯出。補充案例從上述 Git commit 匯出的原始來源錄製；每個原始 runtime/data 檔均以 Git blob hash 核對。不是以修改後引擎補寫舊預期。
- 使用者要求暫不提交，因此 `baselineCommit` 指原始 runtime/data commit；新工具版本由 manifest SHA-256 識別。此報告不聲稱已有 A 交付 commit。

## 交付內容

| 範圍 | 內容 |
| --- | --- |
| engine 測試入口 | `getCompiledCatalogForTesting(sourceDatabase?)`；獨立編譯、不使用／污染預設快取。先複製 buildEntries 輸出及原始 inferredMeta，再做別名與配件後處理。正式編譯不保存 inferredMeta |
| 三份快照 | controls：219 controls／4,771 options；catalog：1,050 來源條目、後處理後 1,052 條，包含 19 條 Negative；meta：完整鍵序與 tags 順序。兩條差額是配件拆分新增的合成全無項目 |
| ID 相容 | 逐一保存 4,771 個 option ID 與 3,253 個 alias occurrence 的有序擁有者／normalizeLocks 結果；既有雙人歧義別名維持原有首個匹配行為 |
| 輸出基準 | 核心 2,540 案；另 141 個有效躺姿案例，補充檔重播同一 200 audit 案。共 2,681 個不同案例／2,881 筆重播紀錄 |
| 比較工具 | 缺檔、解析錯誤、未解析／重複／缺少／新增案例、有效輸出缺少／新增、任意受保護內容差異均非零退出，提供案例 ID 與欄位路徑 |
| 下游基準 | Saved Cards raw／v2／v3 JSON、當前／歷史 Markdown、reload／restore／重新生成、退役 MJ 胸上內容保留；預覽／附加／DLL sources 逐字比對 |
| 瀏覽器工具 | 新隔離 context、載入完成檢查、五工作區桌手機 smoke、六輸出剪貼簿／DLL 草稿，外部 POST 封鎖 |

核心案例分組：104 representative fixtures、200 audit、1,188 指定動作×景別×seed、150 全部隨機、1 全無、614 單一維度選項、49 觀察式抓拍、6 局部隨機、2 雙人歷史別名、141 舊躺姿欄位／表面、2 精確文字、33 角色套用、50 場景套用。

補充 141 案刻意使用現行 `poseOrientationId` 並斷言有效結果；原核心的舊 `poseArrangementId` 案例保留作相容性測試。舊欄位值不等於當前姿勢真正生效，因此兩組不可互相代替。

機器摘要：[validation.json](validation.json)；完整測試紀錄：[frontend-tests.txt](frontend-tests.txt)；原始 main 的 Node25 reporter 重現：[original-main-node25-runner.txt](original-main-node25-runner.txt)。

## I1–I9 驗收

| 不變量 | 結果／證據 |
| --- | --- |
| I1 | 控制項 ID 與順序快照零差異 |
| I2 | 控制項／最終目錄 alias 快照零差異；Negative 與逐 ID 解析均受保護 |
| I3 | 全 compiled meta 逐鍵及順序零差異；快照工具拒絕重複鍵，不靜默覆蓋 |
| I4 | 核心與補充基準重播零差異；Prompt Quality **745/745** |
| I5 | 各案 RNG 計數相同；seed `prompt-quality-baseline`／200 strict audit 前後一致，**0 blockers／18 diagnostics**。獨立 CLI 報告只排除 `findings[*].promptId` 的時間成分；封存 audit 使用穩定案例 ID |
| I6 | 固定舊／新 JSON、Markdown、retired extra prompt、存檔還原／重新生成基準相同；瀏覽器舊卡與 Markdown ZIP 匯入通過 |
| I7 | 完整 **1,810/1,810**、lint、build 通過。Node25 預設 reporter 的兩項既有失敗已在原始 main 重現；指定 TAP 後通過，未改無關測試。Build 有非阻擋的大 chunk 提示 |
| I8 | sync `--check` 通過；Python **2/2**；公開資產 **207 檔**通過。B 的完整性 strict／schema 與 C 的歷史 ID 登記簿驗證本階段不適用，並未宣稱已建立 |
| I9 | 見下方瀏覽器證據；不使用實際收藏，不呼叫生成供應商 |

工具反向測試涵蓋只改標點、同長字串、案例刪除／新增、重複 ID、雙端同為未解析、selection／structured ID 改變、RNG 次數改變、缺輸出、缺檔／壞 JSON；只變更已核准的頂層 `prompt.id`／`prompt.date` 通過。所有測試加入原 npm test glob；不新增 CI 步驟（B 範圍）。

## 瀏覽器證據

- URL：`http://127.0.0.1:5176/Virtual_Photography_Studio/?dllAcceptance=1`。5175 已由原專案工作目錄的服務占用，沒有停止或替換它；5176 明確來自本批 main。
- 1440×1000／390×900；現行五工作區為 Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、Saved Cards。觀察式抓拍在 Prompt 工作台中驗證。
- 自動檢查 **22 項**：空收藏、舊卡載入／還原／重新生成、角色套用、抓拍、場景套用、新收藏、Markdown ZIP 匯入新增一張卡、桌手機六輸出逐字剪貼簿、DLL 明確帶入與 draft reload、五工作區導覽。
- 12 次六輸出複製比對及 12 次 DLL source 逐字比對；沒有外部 POST、console error 或 page error；無 document 橫向溢出或破圖。
- 截圖必須在工作區載入完成後檢視；早期工具定位／載入等待不足的嘗試未作通過證據。最終結果與十張截圖已逐張檢視，保存於 [browser/results.json](browser/results.json)；角色縮圖經實際捲動載入後檢查。

## 檔案與重跑方式

- [基準操作說明](../../../webapp/src/lib/engine/catalogBaseline/README.md)
- [核心 manifest](../../../webapp/src/lib/engine/catalogBaseline/manifest.json)
- [有效躺姿補充 manifest](../../../webapp/src/lib/engine/catalogBaseline/coverage-manifest.json)
- engine 唯一正式檔案變更：`webapp/src/lib/engine.js`，只加入測試擷取路徑。
- 新增工具：`scripts/catalog_baseline.mjs`、`catalog_coverage_baseline.mjs`、`catalog_baseline_browser.mjs`、`update_catalog_snapshots.mjs`、`scripts/lib/catalogBaseline.mjs`、`catalogCorpus.mjs`。舊 `dump_prompt_outputs.mjs` 補上失敗判定。
- 新增四個測試、三份快照及 `webapp/src/lib/engine/catalogBaseline/` 封存資料。更新本報告、current state 與 v1.1 狀態。

從根目錄可執行 `node scripts/catalog_baseline.mjs check`、`node scripts/catalog_coverage_baseline.mjs check`；完整驗證見基準操作說明。三份快照只能由 `update_catalog_snapshots.mjs` 寫入；遷移期間禁止更新預期值消除差異。

## 邊界

有限案例不保證涵蓋全部排列組合，也不代表外部模型出圖品質驗收。沒有實作 B 的完整性 CI、schema、歷史 ID 驗證器，沒有進入 C 的 JSON 來源切換或 stableId 遷移。使用者尚未授權提交或下一階段；後續須依 v1.1 的階段門檻處理。
