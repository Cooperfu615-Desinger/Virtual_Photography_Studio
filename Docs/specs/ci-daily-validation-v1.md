# 第三階段：每日完整驗證 v1

日期：2026-11-24。實作基準：main `f3cb6b1971cf69b646342777097f32e74b88f579`。

使用者核准每天台北時間 04:17 檢查，僅在新產品版本尚未完整驗證時執行，包含失敗通知與部署隔離。首次交付包含 CI 程式，依推送規則完整驗證。本文描述待提交實作；未推送前排程不會在 GitHub 啟用。

## 入口與時間

- [daily-validation.yml](../../.github/workflows/daily-validation.yml)：`17 20 * * *` UTC，等於次日 04:17 Asia/Taipei；另有只驗證的手動入口，限 main。
- [ci_daily.py](../../scripts/ci_daily.py)：只讀 Git 物件與 Actions API。候選固定為事件的 `GITHUB_SHA`，所有工作 checkout 同一版本。新推送不改寫執行中的候選；摘要另查最新 main，若已更新明示結果不涵蓋新版本。
- 每日排程是平台的預定觸發時間，不是準點保證。GitHub 高負載可能延遲或略過；公開 repository 60 天無活動可能停用。保留手動補跑，沒有另建外部排程或監控服務。

## 判定及證據

| 狀況 | 行為 |
| --- | --- |
| 同版本已完整通過 | skip，引用確切成功 run／SHA。 |
| 較早完整通過版本是祖先，累積差異只有既有白名單普通文件新增／修改 | 完成文件格式、連結與 diff 檢查後沿用。刪除、改名、symlink、權限或未知檔案不豁免。 |
| 新產品／資料／測試／依賴／CI 規則，只有 docs／copy 綠燈或無證據 | full；不按日期過期而重跑相同已驗證內容。 |
| 等價版本工作尚未完成 | 每 30 秒重新查證，最多等待 30 分鐘；不是宣稱已通過。已確認只跑 copy 的工作不保留完整驗證名額。 |
| 前序成功且滿足全部完整步驟 | skip。 |
| 前序失敗／取消 | full；本次驗證仍失敗時保留失敗，下次每日檢查可重跑，不在單次流程中自動無限重試。 |
| 前序超過等待上限 | deferred；完整工作不啟動，結果摘要為失敗／未驗證，可收到原生失敗通知，原工作不被取消。 |
| API／證據不足 | 保守 full；候選、文件或必要歷史不可讀時阻擋。未知不能轉成 skip。 |

證據只接受同 repository／head repository、main、指定 workflow／事件、已完成成功 run，逐項核對唯一工作、必要步驟及 success 狀態。讀取指定 run attempt 的全部 jobs，完成後再查 attempt 未變；缺失／非預期 skipped 均不接受。兩個 workflow 各查最多 300 筆近期 run，逐頁讀取；視窗內找不到有效證據就 full。只有完整證據才可沿用，daily 的「檢查後跳過」即使綠燈，也不能變成新的完整證據。

較新的失敗／取消或進行中等價工作，不能被較舊成功蓋掉。同一 run 重試按開始時間處理，不只按 run ID。沒有使用快取命中、檔名、測試數量固定值或自行提交的「成功 JSON」作為充分證據。

## 完整門檻與當前文案

保留推送 full 的 Python／catalog sync、registry history、schema／strict integrity／E 工具、資產預算、全部前端 test／lint、Functions test／lint、Firebase 建置參數檢查、build 及 bundle 初始化。Node 版本分別沿用 22／24。既有 118 個 Prompt 品質測試檔都在完整入口內，不重跑同一子集；未新增全域 audit 或瀏覽器／付費生圖門檻。

[workflow 契約測試](../../scripts/tests/test_ci_daily.py)比對每日與推送的必要 step 名稱、命令、環境、Node 版本與工作目錄。只容許原 full／copy 選擇條件、PR build 與部署專用步驟的明確差異；新增推送檢查而漏同步每日流程會失敗。

[catalog_ci_history.py](../../scripts/catalog_ci_history.py)對 schedule 明確選擇候選的實際第一 parent 與候選 SHA，等同既有手動規則；不接受 self、空值或初始 bootstrap 捷徑。原 push／PR 選法不變。

[validate_current_copy.py](../../scripts/validate_current_copy.py)是推送 full 與每日 full 的附加檢查。空 ledger 只確認無修訂；有修訂時保留全部原歷史測試，同時使用候選版本的同一 runtime 建立兩份隔離快照：一份精確還原已審核文案，另一份保留現行來源。逐筆核對完整 Git 基準、append-only ledger、profile、source hash、inverse 與生成物，再沿用既有公開輸出／selection／RNG／Saved Cards／DLL 探針比較。只接受目前單一單品試點；擴充需另審。非文案 runtime 更新不會被還原，兩側都測當前 runtime。八份契約檔已在完整套件內，不另外重跑。

舊推送 full 缺少此新增步驟時，僅在該版本 ledger 完全空白才可採信；有 copy 修訂的 full 必須有當前來源檢查。原 case、斷言、seed、seal 均不重錄或刪減。

## 部署隔離

- 每日 workflow 只有 `contents: read`／`actions: read`，沒有 Pages、id-token、deployments 寫入、environment、Pages artifact 或 deploy action。
- 每日使用獨立 concurrency group、`cancel-in-progress: false`、`queue: max`；不取消／佔用產品部署群組，但 GitHub runner 配額仍共用。
- 建置只供驗證，不發布、不回退、不呼叫生圖服務。summary 始終明示 deployment none。
- [既有部署流程](../../.github/workflows/deploy.yml)只增加 full 的當前文案驗證，原 docs／copy／full 分流、Pages 最新成功證據、30 筆完整祖先回查、部署前 main 檢查及手動部署入口保持。
- 每日成功不寫入 deployment，也不作為推送分類器的 Pages 成功替代品。不改 branch protection，不新增自動發布封鎖。每日若揭露已部署問題，保留告警供人工處理。

## 摘要、進度及通知

plan 摘要記錄候選、原因、引用證據與等待 run；等待每 30 秒顯示進度。完整套件沿用原大型矩陣進度，當前文案探針每 50 案顯示一次。job／step 開始及結束由 Actions 原生日誌記錄。

`full-evidence` 只在全部完整品質／建置成功後產生；`daily-result` 使用 always 彙整，full 要求所有必要工作成功，skip 要求明確證據及產品工作預期 skipped。deferred、失敗、取消、缺失或摘要 API 無法讀取都不會認證成功。摘要含 job／step wall time、候選是否仍為最新、失敗步驟及 run 連結；原始測試數量與 runner 時間留在 Test 日誌，不混用為 workflow 耗時。

失敗發出 Actions error annotation 並讓 workflow 失敗，使用 GitHub 原生通知，不寄自訂郵件／Slack、不建立 issue。收件人須開啟 Actions Email／Web 通知，可設為僅失敗；排程通知帳號受建立／修改 cron／重新啟用影響。無法由 repository 檔案保證使用者個人通知設定；推送後必須驗收實際收件。人工取消不保證觸發「僅失敗」通知，亦不留下完整成功證據。

## 驗收與效能

本機測試涵蓋同 SHA／文件等價、copy／docs／check-only 偽綠燈、未驗證累積產品差異、缺步驟、失敗／取消、API／分頁、rerun 競態、歷史祖先、等待上限、當前文案單次／連續修訂／故障、權限／排程／命令一致性與部署隔離。實際完整前端、Functions、Python、catalog、lint/build/bundle/資產另行驗證，不以模擬 API 取代遠端結果。

本機驗收報告見[第三階段驗證紀錄](../reports/ci-daily-validation-phase3-2026-11-24.md)。遠端每日觸發、通知收件、skip/full 耗時與無部署紀錄仍須後續授權推送才可確認。第一版無需重驗的目標 30～90 秒、完整約 10～15 分鐘僅估計，不保證時間上限。

平台參考：[schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)、[通知](https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs)、[concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)。
