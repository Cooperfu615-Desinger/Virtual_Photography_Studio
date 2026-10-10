# 完整測試執行效率與 CI 查核 v1

日期：2026-10-10

起點：`main / 6583272ecde759008a4973b5b9b369a3b0bd1413`。

## 核准範圍與完成條件

使用者核准先處理歷史測試資料的重複初始化、重疊矩陣的重複生成，保留現有完整驗證與產品功能；另查明截圖中失敗及取消的 Actions。

本批不修改 renderer、Prompt 來源、fixture 清單、歷史 baseline、原三個矩陣測試、UI、storage、Saved Cards 或 CI 品質門檻。一般可編輯 custom library 保持每次重新編譯。沒有依檔案變更跳過測試，也沒有加入跨次執行的已生成結果快取。

成功條件：固定輸入的六輸出、selection、RNG 與輸入雜湊一致；所有原測試仍被選取與執行；完整 frontend／Prompt Quality、lint、build 通過；保留失敗退出碼；記錄同環境效率比較。

## 重複初始化

`sceneIntegratedAssemblyTestSupport.js` 在建立完整歷史體態資料後明確呼叫 `prepareImmutableRuntimeLibrary()`。此 API 先驗證整棵 plain-data tree，再深度凍結並註冊。

`runtimeCache.js` 每個 resolver 各自用 WeakMap 重用明確註冊的資料 identity。資料不可再修改，新 revision 必須建立新物件。一般 custom array／object、只凍結 root 或未註冊的 frozen tree 仍每次編譯；預設空 array 路徑不變。拒絕 accessor／function／symbol／Map／Set／Date 等可變或非純資料，編譯錯誤不進入快取。

這讓歷史 fixture 的生成及 body normalization 共用同一份編譯目錄與 controls，而非每次重建。

## 重疊矩陣

原有完整矩陣：

| 矩陣 | 完整案例數 |
| --- | ---: |
| GPT Scene／Lighting visibility | 5,614 |
| GPT camera spatial | 6,320 |
| close worm eye | 6,370 |
| 合計檢查列數 | 18,304 |

camera 已包含全部 visibility fixture，worm 又包含全部 camera fixture，共有 6,370 個不同 fixture 物件。

`run_webapp_tests.mjs` 僅在三個檔案同時入選時改用一個聚合入口，其他測試維持獨立 native process。聚合入口匯入原三個檔案，保留各自所有 assertion；只將相同 fixture 的實際生成重用，矩陣生成次數減少 11,934 次（65.2%）。

memo 只存在於本次聚合程序，fixture identity 加上完整輸入 fingerprint 作為有效條件。seed、nested locks 改變會重新生成，回傳 clone 防止某個 assertion 修改其他矩陣的結果，失敗不快取。單獨執行原測試檔仍正常生成與驗證。測試的 runtime IDs／timestamps 不作為效率等價比對依據。

新增測試確認完整測試檔聯集、Prompt Quality 聯集、原順序、focused scope、原生參數、失敗退出碼、快取失效與結果隔離。原三個矩陣測試與 baseline JSON 不改寫。

## 固定樣本效率比較

同一台本機、Node `v22.22.3`、相同 80 組 fixture／seed，計時包含生成與歷史投影，不含模組載入：

| 項目 | 耗時 |
| --- | ---: |
| 修改前，每次歷史目錄重新初始化 | 5,378.12 ms |
| 修改後，明確註冊的 immutable runtime | 831.81 ms |
| 同程序 memo 已生成案例重用 | 10.54 ms |

80 組結果以逐位元資料比較確認六組輸出、selection、randomDraws 與 inputHash 完全一致，SHA256：`3ac5be3728fd6f49f71c62a9a16ac3485b4b493b27ed9beb5d6a73dc7eb83d35`。

暫存證據：`/tmp/vps-historical-perf-before-node22.json`、`/tmp/vps-historical-perf-after-node22.json`。這是固定樣本的本機量測，不是尚未執行的新 GitHub workflow 耗時保證。

## 本機完整驗證

環境：macOS、Node `v22.22.3`，與目前 CI 相同的 Node major。完整命令由子程序執行並確認退出碼，計時使用單調時鐘。

| 驗證 | 結果 |
| --- | --- |
| runtime cache／memo／runner focused tests | 26／26 通過，退出碼 0 |
| `npm test` | 1,422／1,422 通過，退出碼 0；最終一輪 88.39 秒 |
| `npm run test:prompt-quality` | 593／593 通過，退出碼 0；最終一輪 83.17 秒 |
| `npm run lint` | 通過 |
| `npm run build` | 通過；保留既有的 500 kB chunk 體積提醒 |
| 修改前後同 seed strict audit | 200 組、seed `prompt-quality-baseline`，完整稽核文字逐位元一致；阻擋項目 0 |
| `git diff --check` | 通過 |

完整矩陣的實際 memo 統計為 6,373 次生成、12,058 次命中。這包含矩陣以外的原功能測試及新增生命週期確認；固定三組矩陣本身仍保留全部 18,304 列與 6,370 個唯一 fixture。聚合入口在所有原 suite 註冊完畢後由 root `before` 啟用 memo，全部測試完成後才由 root `after` 檢查生成／命中數並清理；另有真正啟動 runner 的回歸測試確認此生命週期。

strict audit 的既有診斷共 22 項（19 項服裝／場景組合、3 項近似重複），與 HEAD 完全相同，沒有為了改善診斷數量修改產品規則。

本批沒有 UI 或使用者可見行為變更，沒有新增瀏覽器驗收項目。原三個矩陣測試、fixture／baseline、正式 renderer 與 CI workflow 的 diff 均為空；原完整測試清單、Prompt Quality 清單及 CI 的資料／Functions／build／deploy 門檻保留。

暫存完整證據：`/tmp/vps-test-efficiency-focused-final.log`、`/tmp/vps-test-efficiency-full-verified.log`、`/tmp/vps-test-efficiency-quality-verified.log`、`/tmp/vps-test-efficiency-verified-metrics.json`、`/tmp/vps-test-efficiency-lint-final.log`、`/tmp/vps-test-efficiency-build.log`、`/tmp/vps-test-efficiency-audit-before.log`、`/tmp/vps-test-efficiency-audit.log`。

以上為提交前的本機驗證紀錄。本機完整 suite 的耗時不是 GitHub runner 的耗時對照；使用者已於 2026-10-10 授權提交、推送並查核該次 Actions，GitHub 的實際耗時須由推送後對應同一 commit 的流程確認。

## GitHub 異常查核

唯讀查核最近 100 次同一 workflow（#855–954）：90 成功、9 失敗、1 取消；最近 40 次（#915–954）只有 #951 失敗與 #953 取消。9 次失敗都在前端測試；Functions 檢查成功，後續 build／deploy 因門檻未通過而跳過。

### 使用者截圖

- [#951 / bdcb530](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/37897010037)：`zippered latex mini dress uses the shared dress color and single-dress wardrobe flow` 未固定景別與 RNG，抽到頭部主導近景，卻要求完整裙身拉鏈來源；1,379／1,380 通過。`546d6e6` 已固定全身、腰配件全無與 seed `latex-fixture-1`，保留原斷言。[#954](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/38039235094) 同名案例 `ok 981`，1,397／1,397 通過。
- [#953 / 546d6e6](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/38038648552)：GitHub annotation 明確指出同 concurrency group 有更新的等待請求，#954 推送後取消 #953。這符合 `deploy.yml` 的 `cancel-in-progress: true`，不是 assertion failure。新流程包含前一提交且已通過、建置及部署。

### 較舊失敗

| Run | 原因 | 已確認後續處理 |
| --- | --- | --- |
| [#907](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/36301429725) | 長版襯衫測試未固定外套版型，隨機版型改變來源 | `29f92c0` 固定全無版型與 seed；#954 同名測試通過 |
| [#878](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/35064726640) | 浴室鏡面來源改寫造成 15 項歷史 hash／snapshot 及 GPT 三段格式失敗 | `3211bde` 修復格式及精確歷史投影；#954 對應測試通過 |
| [#876](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/35040433594)、[#864](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/34798175929) | expression 測試對全 Prompt 禁 gaze，誤抓其他欄位 | `1c1fdb7` 改為檢查 expression source；#954 同名測試通過 |
| [#868](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/34818235192) | 蟲眼測試隨機裁切，仍要求舊鏡頭句 | `74de3a8` 固定六組裁切／姿勢與 seed，保留各自正確文案斷言；#954 通過 |
| [#866](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/34810259038)、[#862](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/34792487555) | 鹽灘低機位依法省略地面，舊測試仍要求地面 | `74de3a8` 固定基本場景測試並增加高度矩陣；#954 通過 |
| [#861](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/34762722083) | 全文禁 gaze 及高機位天空可見性期望錯誤 | #954 兩個同名測試皆通過；未將 lighting 修正歸到未經確認的單一 commit |

目前不需再修改這些已修正的測試或取消規則；本批僅優化執行效率。上述查核不是宣稱所有未固定的隨機測試都已穩定化。
