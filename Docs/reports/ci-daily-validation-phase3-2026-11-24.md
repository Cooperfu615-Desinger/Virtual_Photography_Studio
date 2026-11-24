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
