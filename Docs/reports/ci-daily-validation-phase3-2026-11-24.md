# 第三階段每日完整驗證：本機驗收

日期：2026-11-24。基準 `f3cb6b1971cf69b646342777097f32e74b88f579`，本機／遠端 main 已唯讀核對相同。使用者只授權實作與驗證，未授權 commit／push；沒有啟動遠端 workflow 或修改通知設定。

規格：[每日完整驗證 v1](../specs/ci-daily-validation-v1.md)。每天 04:17 Asia/Taipei（20:17 UTC），只在缺少可靠完整驗證證據時執行；與產品部署分開。GitHub 排程、Email／Web 收件、正式 skip/full 耗時與沒有新增部署紀錄，仍待獲准推送後驗收。

## 本機結果

測試使用 Node 22.22.3／Functions Node 24.22.3，CI=true。多項命令曾並行，以下是各命令實際 wall time，不能相加成整體耗時或當作 GitHub runner 預測。

| 驗證 | 結果 | 命令 wall time |
| --- | --- | --- |
| 每日分流最新專項 | 30／30，含完整證據、文件等價、copy/docs 偽綠燈、API／分頁／rerun、等待、摘要／故障通知、權限／排程／workflow 一致性與 CLI | 67.972 秒 |
| 最後證據身分補強 | 4／4；run ID／attempt 競態故障與既有 full／daily／CLI 正常路徑 | 4.021 秒 |
| 當前文案 inverse 專項 | 7／7；連續修訂、當前 runtime、不明來源、破壞歷史鏈與未知 ledger | unittest runner 12.678 秒 |
| 全部 Python 工具 | 141／141；之後新增一項 CLI 案例與最後判定補強，由上述最新 30 項重驗 | 270.734 秒（runner 270.183 秒） |
| 完整前端 | 2,470／2,470，零 failure／cancelled／skip | 395.473 秒（約 6 分 35 秒；runner 394.662 秒） |
| Functions | 156／156，零 failure／skip | 2.417 秒（runner 1.668 秒） |
| Catalog 工具 | 33／33 | 19.939 秒 |
| catalog sync 唯讀 check／report | 1,057 筆、八份生成物、受信任歷史基準 `782a4516dcb813c55e35c8e76f99d6a640a09122` | 2.129 秒 |
| Catalog strict integrity | 通過，保留既有診斷 | 5.961 秒 |
| 前端／Functions lint | 均通過 | 37.015／3.709 秒 |
| build／bundle | 通過；33 個角色初始化，無反向 engine 相依 | 14.290／0.077 秒 |
| 公開資產 | 207 檔、3,201,415 bytes，通過 | 0.477 秒 |
| 空 ledger 當前來源檢查 | 通過，無需建立文案探針快照 | 0.504 秒 |
| 實際文案試點 | 621 組前後對照，99 組核准差異、522 組不變 | 56.220 秒（探針入口 55.422 秒） |

完整前端保留原案例、斷言與 seed，不改測試名稱篩選、數量或歷史 seal。`test:prompt-quality` 現有 118 個檔案均在完整入口內，不另重跑同一子集。本批未修改產品 UI／資料／renderer，未啟動網站、做桌手機畫面檢查或付費生圖。

實際文案試點使用先前隔離 Git fixture `507686a560367402d350f92b77d579bf19a095d8`（只在暫存資料中調整直筒牛仔褲英文並追加原完整英文 alias），由新檢查工具在同一 runtime 的兩份快照執行。沒有把試點文案寫入正式工作區，亦未變動該 fixture。

## 實際既有遠端證據與平台語法

唯讀取得 [run 45309659339](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/45309659339) 的最新完整工作／步驟，交由新 full-success 判定器檢查，接受為有效既有完整證據。這不是新每日 workflow 已執行的證明。

actionlint 1.7.12 仍不識別已由第一階段 GitHub 驗收的 `queue: max`。正式兩份 workflow 保留此設定；僅在暫存 lint 副本移除同一行，其他語法檢查均通過。沒有加入全域忽略規則。排程使用既有標準 UTC cron，04:17 台北換算已由契約測試固定。

原生通知是 workflow 失敗狀態與 error annotation；本機故障注入確認不會錯報綠燈。通知是否實際送達取決於 GitHub 帳號設定及排程 actor，未推送前無法聲稱已驗收收件。

## 保存與限制

原有 106 個未提交路徑以 SHA-256 保護，包含 `Docs/current_project_state.md` 與 `Docs/session_onboarding.md`；本批不修改這兩份共用文件。原測試來源不編輯。完成時另核對檔案清單、index、HEAD 與原內容雜湊。

最終核對：原 106 路徑雜湊完全一致，HEAD 仍為開工基準，index 為空。新增／修改限本批 11 檔，`webapp/src`、`functions`、catalog 與既有測試檔均無新差異；文件相對連結與差異格式檢查通過。本機不 commit／push。

既有 build 的大於 500 kB chunk 提醒，以及 catalog 的舊分類／角色圖層重複診斷保留；沒有為減少警告而擴大修改範圍。

本機完整驗證、排程正式觸發、通知收件、遠端 CI／部署是不同驗收項目。本批只完成授權的本機實作與檢查，等待使用者確認。

本批 11 檔：`.github/workflows/daily-validation.yml`、`.github/workflows/deploy.yml`、`AGENTS.md`、`scripts/ci_daily.py`、`scripts/ci_docs.py`、`scripts/catalog_ci_history.py`、`scripts/validate_current_copy.py`、`scripts/tests/test_ci_daily.py`、`scripts/tests/test_current_copy.py`、`Docs/specs/ci-daily-validation-v1.md`、本報告。原有未提交路徑不在交付範圍內。

## 授權交付後驗證與佇列補強

使用者後續已授權只提交本批、推送及確認 CI／部署／每日設定。首次提交 `cbee7499671997390d2ecc7dc5538de3b1b88082` 的 [run 45321271118](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/45321271118) 全部成功：前端 2,470／2,470、runner 554.436 秒，Python 142／142、catalog 33／33、Functions 156／156，workflow 共 783 秒。Pages deployment `8018055786` 為 success、同 SHA，正式每日 workflow 狀態 active。

以只驗證的手動入口啟動 [run 45321586363](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/45321586363)，實際等待同版本完整 CI 後採 `skip`／`verified_full_result`，引用上述成功 run；產品測試、build、full-evidence 全部為預期 skipped。此輪含等待共 667 秒，不能當作無需等待時的快路徑耗時。沒有新增部署，最新 Pages 紀錄仍為上述產品部署。

交付檢查另以隔離案例重現「同一每日串行群組後方 queued run 被當成等待對象」的互等風險。修正為不等待同群組其他 pending daily run；保留其排隊，仍會等待產品 CI，不取消工作。新增一項回歸測試，所有原斷言保留；最新每日專項 31／31 通過，命令 47.105 秒（runner 46.692 秒）。此修正限本批判定工具、測試、規格與報告，最終提交的遠端驗證另於交付回覆確認。

佇列修正 `adae68dcd3d8b1fad735efb672d2531693e4bae4` 的 [CI 45323009045](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/45323009045) 全數通過，workflow 778 秒，前端 2,470／2,470、576.439 秒，Python 143／143、catalog 33／33、Functions 156／156。Pages `8018323973` 為同 SHA 的 success，正式站 HTTP 200。連續啟動每日 [45324576910](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/45324576910) 與 [45324607544](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/45324607544)，兩輪皆引用該完整成功證據並跳過產品工作；首輪 68 秒，次輪含排隊 132 秒，沒有互等。

實際摘要顯示 GitHub 對 skipped 工作偶有結束早於開始的時間戳（−1 秒）；補強顯示為 `—`，並涵蓋空步驟、未開始與有效時間。先以新案例重現，再修正純摘要呈現；不改 full／skip 判定、失敗認證或部署。每日專項 32／32 通過（runner 48.243 秒），實際首輪 API jobs 回放亦通過。最終遠端結果另於交付回覆確認。
