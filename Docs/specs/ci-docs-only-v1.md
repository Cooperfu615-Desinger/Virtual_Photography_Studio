# 純文件 CI 分流 v1

日期：2026-11-23。開發基準：`17397e7749ae20c504c6ac8793df19575b46ec2e`。

使用者核准第一階段純文件 CI 分流、必要檢查、結果摘要與部署保護；完成本機驗證後，已於 2026-11-23 授權只提交並推送本批，再確認 CI 與部署結果。第 7 節保留提交前的本機驗證快照；遠端結果於交付時另行核對。局部 Prompt 文案選測、每日完整測試、測試案例刪減與產品修改不在本批。

## 1. 分流原則

[workflow](../../.github/workflows/deploy.yml) 每次 push、pull request 或手動執行都啟動 `scope`，先跑分類器專項，再檢查提交內容；不使用 `paths-ignore` 或 commit message 跳過整個 workflow。

只有以下條件全部成立，才採 `docs` 路徑：

1. 事件為 push 或 pull request，比較基準完整、可讀且是候選提交的祖先。
2. 本次差異非空，且全為 [ciDocsPolicy.json](../../scripts/lib/ciDocsPolicy.json) 列出的普通 Markdown 檔案新增／修改。刪除、改名、symlink、執行權限變動與未知檔案走 `full`。
3. 最新 GitHub Pages 部署狀態為 success；對應的是本 repository、main、正式 workflow 的成功 push／手動 run，且部署 SHA 相同。
4. 對應 run 的 frontend、Functions、build 與 deploy 工作及指定必要步驟確實 success，不能以 skipped 代替完整測試證據。
5. 成功部署版本是候選提交的祖先，從該版本至候選的**全部累積差異**也都符合純文件條件。
6. 文件必要檢查全部通過。

`docs` 跳過 frontend／Functions 產品測試、build 與 deploy；網站維持已驗證的相同產品版本。主線上一筆尚未完成、失敗或遺漏的產品修改，不能被下一筆文件 push 的小範圍差異掩蓋。

最新部署不存在、尚在進行、失敗、API 無權限、資料截斷、缺 Git 歷史或證據不完整時，只能回到 `full` 或阻擋，不會把未知當成無產品差異。手動 `workflow_dispatch` 固定 `full`。PR 無論哪條路徑都不部署。

## 2. 首批明確清單

首批七個文件為根 `AGENTS.md`／`README.md`、`Docs/current_project_state.md`、`Docs/session_onboarding.md`、`Docs/conversation_handoff.md`、局部 Prompt 文案驗證規格及本規格。未列入的文件仍走完整驗證；擴充清單需先檢查是否被程式或測試消費。

這不是對所有 `.md` 的豁免。`knowledge_base` 生成 Markdown、`Docs/reports` 封存資料、場景表格與測試 Prompt 文件都不在清單內。包括下列實際測試輸入：

- `z-image-on-location-v1-test-prompts.md`、`z-image-upper-scene-v2-test-prompts.md`。
- 室內倚靠、室內／戶外跪姿、戶外倚靠等 `*-scenes-v*.md` 對照表。

分類器、清單、workflow、測試、程式、catalog、依賴或其他未知檔案有任何變動，均走完整路徑。本批首次交付自身包含 CI 程式變更，因此也會完整測試及部署一次。

## 3. 必要檢查與執行入口

[ci_docs.py](../../scripts/ci_docs.py) 只讀取 Git object 中指定版本的檔案，不採用工作區未提交內容，不修改來源或自動修補格式。

| 檢查 | 規則 |
| --- | --- |
| 比較範圍 | push 使用完整 before／候選；PR 使用事件 base／實際 checkout 的 merge 候選；另查成功部署祖先至候選的累積差異。多提交 push 不只比較 HEAD 的第一個 parent。 |
| 文件內容 | UTF-8 普通文字、無 NUL、檔尾換行、無尾端空白、Markdown code fence 成對。 |
| 文件連結 | 檢查受影響白名單文件內 inline／reference 連結的 repository 路徑；支援 URL 編碼與中文。缺檔、越出 repository、symlink 或未定義 reference 阻擋。code fence 內範例不當成真實連結。 |
| 連結限制 | 不連線檢查外部網站，不核對 heading anchors，也不把未追蹤檔案當有效連結目標。 |
| 差異格式 | 對完整 base／head diff 執行 `git diff --check`。 |
| 歷史證據 | 只接受最新 Pages 部署及同 SHA 成功完整 run；API 或比較證據不足走完整路徑。 |
| 原有產品門檻 | `full` 保留原 Python、sync、資產、catalog、frontend／Functions test 與 lint、build、bundle 檢查。沒有局部 Prompt CI 選測。 |

Catalog 的 `catalog_ci_history.py` 及 registry 歷史選擇規則保持原樣；選測比較基準與 catalog 歷史基準各自履行原責任。

本機專項入口：

```sh
python3 -m unittest discover -s scripts/tests -p test_ci_docs.py -v
```

測試包含真實臨時 Git fixture、API 故障注入與 CLI 輸出檢查；fixture 提交只存在於系統暫存目錄。原專案不因此 stage、commit、切換分支或重置。

## 4. 排隊與部署保護

workflow 同一 ref 使用 `cancel-in-progress: false` 與 `queue: max`。新文件推送不取消正在執行或排隊中的產品工作。文件可能需要等待前一筆完整流程，預估文件檢查時間不包含這段排隊。

GitHub 的 queue 上限及服務可用性仍是平台限制；即使前序工作遭人工取消或失敗，累積差異檢查也不會直接跳過其產品內容。排隊不保證依 Git commit 順序完成，因此部署前另行讀取最新 main：

- 候選仍在 main 歷史上，且後續只有符合清單的文件差異：允許部署相同產品。
- main 已有更新產品修改、歷史分歧或無法讀取 main：阻擋舊部署並使該 run 失敗，保留原因；由較新 run 驗證與部署，不宣稱舊 run 已部署成功。

檢查不修改遠端 ref，也不建立或取消其他 workflow。正式 Pages artifact 仍由同一 run 的 build 上傳、deploy 使用。實際部署前的短暫新推送仍由後續排隊 run 處理。

排隊規格依 [GitHub concurrency 文件](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)。本機 actionlint 1.7.12 尚未識別 `queue` 欄位；驗證時單獨依官方規格核對 `queue: max` 與 `cancel-in-progress: false`，再用去除該單一欄位的暫存副本檢查其他語法。正式 workflow 保留原欄位，不以全域忽略規則掩蓋其他錯誤；GitHub 端驗收仍待推送後確認。

## 5. 結果摘要與失敗行為

`scope` 摘要列出路徑、base／head、已部署 SHA、路徑選擇原因與已檢查文件。`ci-result` 使用 `always()` 彙整各工作，規則如下：

- `scope` 失敗、取消、缺輸出或未知路徑：整體失敗。
- `docs`：四個產品工作必須為預期的 skipped，摘要明示沒有執行產品測試或部署。
- `full` push／手動：四個產品工作必須 success；PR 則要求兩個品質工作 success、build／deploy skipped，PR build 仍在 frontend 品質工作內執行。
- 非預期 skipped、failure、cancelled 或缺失工作不會被誤判為成功。

本批不新增遠端 branch protection，也不變更必需檢查設定。若未來啟用必需檢查，應採用始終產生結果的彙整工作；不可把可被整份跳過的 workflow 當唯一門檻。

## 6. 驗證與效能界線

驗證重點包含純文件、未知 Markdown、生成資料、測試文件、混合修改、別名／權限／刪除、連續文件提交、前序產品尚未部署、API 錯誤、失敗／跳過品質工作、非祖先歷史、過期部署與結果彙整。

保留現有所有產品測試及斷言。文件快路徑是基於產品與已成功部署版本一致的證據，不宣稱這次重新跑過完整套件。局部 Prompt 文案仍依 [本機規格](local-prompt-copy-validation-v1.md)處理，推送後仍走完整 CI；每日完整測試尚未實作。

先前完整 CI 基準為 13 分 23 秒，其中前端測試 11 分 18 秒。文件快路徑原估約 30～90 秒，不含排隊；本批尚未在 GitHub 實測，不能以本機單元測試耗時代替遠端效能成果。

## 7. 本批本機驗證紀錄

2026-11-23，HEAD 與遠端 main 均為 `17397e7749ae20c504c6ac8793df19575b46ec2e`。本批未 stage、commit、push、啟動或取消遠端工作，也未部署。既有 106 個未提交檔案逐一比對雜湊無變動。

| 驗證 | 結果與實際耗時 |
| --- | --- |
| 新增分流專項 | `python3 -m unittest discover -s scripts/tests -p test_ci_docs.py -v`：28／28，最後重跑 29.792 秒。 |
| 全部 Python 工具測試 | `python3 -m unittest discover -s scripts/tests`：88／88，51.096 秒，包含新增專項。最後將未知檔案的各子案例隔離後，再跑上述 28 項專項。 |
| 完整前端 | Node 22.22.3、`CI=true`，執行 package 中相同 runner 與全部 test globs：2,465／2,465，310.313 秒（約 5 分 10 秒），無 skipped。 |
| Functions | Node 24.22.3：156／156，1.239 秒；lint 通過。 |
| Catalog 工具 | 33／33，11.625 秒；沿用已審閱 parent `a01ce5d3f5c39806f93855a46ed470284e820871` 作為 `REGISTRY_BASE_COMMIT`。 |
| 其他產品門檻 | sync 唯讀 `--check --report-json`、catalog strict integrity、207 個 public assets、前端 lint／build、正式 bundle 初始化均通過；build 5.25 秒，保留既有 bundle 大小警告。 |
| Workflow | 原有 18 個 run 命令完整保留；actionlint 的 `queue` 支援限制與補充語法檢查依第 4 節。 |
| 真實部署證據 | 唯讀取得 deployment `7993224875`、run `45132606563`，成功核對本次基準 SHA 與完整產品工作；沒有用模擬資料冒充遠端成功。 |

本機 `webapp` 目錄的預設 Node 為 25，最初完整執行出現 4 個測試報表格式斷言失敗。切換為明確的 CI Node 22 執行路徑及 `CI=true` 後，相關 25 項與完整 2,465 項皆通過；未修改原測試斷言或使用者環境設定。Catalog 工具第一次缺少程序環境中的歷史基準，補上正確環境後通過。

本次沒有產品畫面改動，因此未啟動本機網站或重新做桌手機 UI 驗收。新 workflow 的 GitHub 執行、排隊及實際快路徑耗時尚未驗收，需在後續獲准推送後確認；目前結果只涵蓋本機驗證與既有遠端證據讀取。

## 8. 遠端完整交付驗證（2026-11-23）

本節承接以上提交前快照。實作提交 `8496e4665af4efd982adcca14342107465df1958` 已推送 main，[正式 CI run 45185511460](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/45185511460) 六個工作全部 success，摘要為 `Route: full`／`CI result: passed`。GitHub 已接受 `queue: max` 設定；沒有啟動額外手動流程或取消其他工作。

| 遠端檢查 | 結果 |
| --- | --- |
| 分流專項 | 28／28，1.017 秒；正確判定本批 CI 程式修改必須完整驗證。 |
| Python／Catalog | 88／88、33／33；sync、strict integrity、資產檢查全部成功。 |
| 完整前端 | 2,465／2,465，無 skipped，測試 runner 483.109 秒（約 8 分 3 秒）；lint 成功。 |
| Functions | 156／156，測試 runner 1.368 秒；lint 成功。 |
| Build／部署 | build、bundle 初始化、過期版本防護及 Pages 部署成功。Deployment `8000449102` 的 SHA 與上述提交一致。 |
| 整體耗時 | workflow 從 13:35:56 UTC 至 13:47:35 UTC，共 699 秒（11 分 39 秒）；不以各工作耗時加總代替總時間。 |

此文件紀錄另以純文件提交交付，用來實際確認 `docs` 路徑：核對上述成功部署後，產品測試、build、deploy 應全部為預期 skipped，`scope` 與 `ci-result` 應成功。該筆文件提交的實際結果與耗時以對應 Actions 及最終交付回報為準，不將預期結果記作已通過。

本輪沒有刻意製造正式部署失敗或連續推送來測試排隊順序；未部署差異、失敗／未知證據及過期版本仍由專項故障測試覆蓋。局部 Prompt 選測、每日完整測試及手部動作未實作。
