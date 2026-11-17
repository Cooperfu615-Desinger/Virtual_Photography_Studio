# 第一階段測試效率與第二階段室內坐姿試點驗證

日期：2026-11-17。工作目錄：`/Users/cooperfu/Projects/Virtual_Photography_Studio`。
分支：`main`。開工時已 fetch 核對本機與遠端同為 `2b43c52f8315232b316cc5fc99383ed10e6a64b5`。

本報告記錄提交前的本機驗證；使用者隨後已授權限定本批 commit／push 及 CI／部署查核。下方「未提交／未部署」描述保留當時量測狀態，後續交付結果以對應提交的 GitHub Actions 為準。

## 已實作範圍

- 四份歷史測試共用同次執行的一份 1,686 列 pre-Lawson 快照，各自執行原有斷言。
- 三份跪姿／戶外倚靠測試透過聚合入口執行原檔案；相同輸入只生成一次，保留每一項原斷言。整個聚合組實際 42,950 次 fixture 呼叫，30,870 次生成、12,080 次重用；壓縮暫存峰值 96,073,547 bytes（約 91.6 MiB），結束時保留項目為零。
- 新增真實進度：完成案例數、階段耗時、程序 RSS、生成／重用數。外層 runner 即時輸出，原生 TAP 與失敗退出碼保留。
- 室內坐姿試點與舊矩陣並行：84 場景 × 15 坐姿的 1,260 組獨立規則；16 組關係 × 十景別的 160 組七輸出關係；床邊／床上存檔、還原及重新生成。

完整規則：[test-execution-efficiency-v2.md](../../specs/test-execution-efficiency-v2.md)。

## 覆蓋與歷史保護

- 原 2,320 個測試名稱及其出現次數全部保留；最終 2,337 個通過，新增 17 個，零失敗、零略過。
- 此次有調整的六份原測試，110 個 `assert` 呼叫以語法樹擷取比對，內容與順序完全一致。其他原測試沒有修改。
- 18,480 組室內坐姿、14,310 組倚靠／戶外坐姿、17,220 組跪姿保護及 24,684 組支撐案例照常執行。
- 原 baseline JSON、舊 inverse manifest、原 fixture 清單未改寫。這次新 inverse 只接受精確 SHA256，還原本次測試工具變更後，才進入原歷史鏈。逆向檢查與原丹寧／影片歷史檢查均通過。
- 完整測試命令未改；Prompt Quality 原 116 份檔案全部保留，只新增試點為 117 份。CI workflow、門檻、既有 GPT scene／camera／worm-eye 聚合機制不變。

「測試項目」包含大量內部迴圈；2,337 不是全部 Prompt 組合列數。

## 同條件完整測試量測

macOS，測試程序 Node `v22.22.3`，原完整 `npm test`，均加 `--test-concurrency=4`。使用 `/usr/bin/time -l`；修改前後分開執行，量測期間未並行跑另一個完整 gate、lint 或 build。測試 shell 固定 Node 22 路徑。

| 指標 | 修改前 | 最終修改後 | 差異 |
| --- | ---: | ---: | ---: |
| 通過測試 | 2,320 | 2,337 | 原案例全部保留，新增 17 |
| 實際耗時 | 355.23 秒 | 295.49 秒 | 減少 59.74 秒，16.8% |
| user + system CPU 時間 | 1,411.39 秒 | 1,267.48 秒 | 減少約 10.2% |
| maximum resident set size | 1,632.3 MiB | 1,779.7 MiB | 增加 147.4 MiB，9.0% |

時間有改善；本輪記憶體指標沒有下降。RSS 採 macOS `time -l` 原始統計，不是整棵程序樹同時用量的加總；不能用約 92 MiB 的壓縮快取大小代替此項量測，也未根據單次峰值歸因到某個套件。

先行修改後一輪為 302.92 秒、1,860.25 MiB、2,336 個通過；補上 undefined／null／省略值的共用鍵區分及其回歸後，才得到上表最終結果。兩次都顯示時間減少，但不宣稱多輪統計顯著性或 CI 必定有同樣幅度。修改前另有一輪 2,320 項通過、341.07 秒，因系統統計權限未取得 RSS，不納入主要比較。

## 其他驗證

| 驗證 | 結果 |
| --- | --- |
| 新增工具與試點 focused tests | 17／17 通過 |
| 受影響六份原歷史測試檔 | 14／14 通過，約 134.17 秒；與完整 gate 負載不同，不作效能對照 |
| 原 runner、共用工具與既有歷史逆向 focused checks | 30／30 通過；新增邊界檢查另於最終 focused 與完整 gate 通過 |
| 最終精確逆向與案例選取檢查 | 3／3 通過 |
| `npm test -- --test-concurrency=4` | 2,337／2,337 通過 |
| `npm run test:prompt-quality -- --test-concurrency=4` | 960／960 通過，204.57 秒 |
| `npm run lint` | 通過 |
| `npm run build` | 通過，Vite 建置 2.88 秒；保留既有大於 500 kB 的分包提醒 |
| `git diff --check` | 通過 |

此次只修改測試工具及規則檢查，正式 Prompt、資料庫、UI、storage 與 DLL 行為不變。沒有重啟本機預覽、瀏覽器驗收或付費生成，也沒有提交、推送、CI 執行或部署。

## 修改檔案

- 執行與共用：`scripts/run_webapp_tests.mjs`、`scripts/lib/testRunContext.mjs`、`scripts/lib/preLawsonTestSnapshot.mjs`、`scripts/test-groups/seatingMatrices.mjs`。
- 共用 fixture／進度：`webapp/src/lib/engine/seatFixtureReuseTestSupport.js`、`testMatrixProgress.js`、`indoorSeatFixtures.js`、`indoorKneelFixtures.js`、`outdoorSeatFixtures.js`、`outdoorLeanFixtures.js`；同目錄 `specifiedActionUpperBodyStateBatch3.test.js` 只加入進度。
- 原快照消費者：同目錄 `indoorLeanBaseline.test.js`、`outdoorSeatBaseline.test.js`、`outdoorLeanBaseline.test.js`、`indoorKneelBaseline.test.js`，只更換重複生成的前置／清理，原斷言保留。
- 新試點與工具測試：`webapp/src/lib/engine/indoorSeatRulePilot.test.js`、`webapp/src/features/qa/testEfficiencySupport.test.js`、`testEfficiencyRunner.test.js`；`webapp/package.json` 只追加試點到 Prompt Quality。
- 歷史相容：`scripts/lib/testEfficiencyHistoricalReplay.mjs`、`testEfficiencyHistory.json`、`videoReferenceReplay.mjs`，以及 `webapp/src/lib/engine/denimOveralls.test.js` 的前置來源還原。
- 規格與本報告：`Docs/specs/test-execution-efficiency-v2.md`、本目錄 `README.md` 與 `metrics.json`。

原先 109 個未提交檔案均以 SHA256 核對保持原樣，包含既有 current-state／onboarding 文件及研究檔案。未 stage 任何檔案。

## 證據

- [結構化量測與案例保留紀錄](metrics.json)：前後時間／RSS、所有新增測試名稱、原斷言保留數量、gate 檔案聯集。
- 本機原始紀錄：`/tmp/vps-test-efficiency-v2/` 內的 `full-before-measured.log/.time`、`full-final.log/.time`、`quality.log/.time`、`focused-final.log`、`focused-matrices.log`、`lint-final.log`、`build.log`。這些是本機暫存證據，不是已發佈的 CI artifact。
