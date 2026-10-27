# A2 第一批：影片 main 整合與交付驗收

日期：2026-10-27。使用者已授權先確認「APIKEY分析」提交，再限定交付 A2 第一批、確認 CI，之後接續第二批範圍分析。本紀錄為提交前驗收；實際提交 SHA、推送及對應 CI 結果以 GitHub 提交與工作流程紀錄為準。

## 基準及範圍

- 原始 Prompt oracle 保持 `4e35912f82280c058d0c86b6de3f44fcb019f9df`，原 2026-10-26 的資料差異、證據、A～E／A5／A1 歷史基準不重錄。
- 最新 main／整合保護基準為 `e9983769e326ead175b381834c6e2df4fd02e28d`。影片提交 33 檔，涵蓋獨立 DLL_VIDEO Pro、Seedance 2.5、測試與文件；沒有改到目錄、Prompt 引擎、Saved Cards codec、套件設定或 A2 文件。
- [影片 CI 40358847158](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40358847158) 的 webapp-quality、functions-quality、build、deploy 皆成功。此項核對不代表真實付費生成、扣額、成品質量或認證下載已驗收。
- 原 80 檔交付清單於本輪開始時逐檔雜湊一致。原清單另存 [original-delivery-manifest.json](original-delivery-manifest.json)；交付清單增加本輪補充證據並更新工具與文件雜湊。
- A2 正式行為仍只有 24 筆連身去除控制句、追加舊全文 aliases 及同步生成物。本輪不改影片程式、Prompt renderer、40 筆套裝、1 筆特殊穿搭或 runtime 配色句。

## 驗收工具對齊

A2 acceptance 的 before／expected engine 仍從原始 Git oracle 載入，267 份保護檔改對照已審查的影片提交。3,545 案例結果與原驗收逐項一致，僅報告新增 integrationCommit；不是重新錄製基準來接受差異。

A1／A5 隔離回放還會先精確還原影片提交的六個前端檔：App、VideoWorkspace、comfyVideoClient、videoWorkspaceController、main 及影片 CSS。每個檔案必須完整符合固定 Git 的 before 或 after，六檔必須處於同一狀態；缺檔、額外修改或混合版本會拒絕。還原只作用於一次性回放副本。正式工作區及新影片回歸仍測目前版本。

## 本輪結果

| 檢查 | 結果 |
| --- | --- |
| A2 聚焦回歸 | 5／5，含影片還原缺檔／額外修改／混合版本拒絕 |
| 固定 Git oracle | 3,545 案，0 核准外差異；選值、RNG 保持 |
| 前端完整測試 | 1,860／1,860 |
| Prompt Quality | 764／764 |
| Python／目錄工具 | 41／41、32／32 |
| sync／歷史 ID／schema／strict／資產 | 全數通過，1,050 個 ID、207 個公開資產 |
| Functions | 108／108、lint 通過 |
| 前端 lint／build | 通過；既有 500 kB chunk 提醒保持 |
| 200 / prompt-quality-baseline strict audit | 0 blocker、18 既有診斷；只排除 promptId 後與原 A2 after 完全一致 |
| A1 原工具回放 | 1,273 案，身份 99／99、PAGE2 66 組保持 |
| 四批 A5 原工具回放 | 西門町／CRT 各 3,834 案；commercial 3,804 案；首批 1,740 案，全部通過 |
| A～E 及其他歷史封存測試 | 完整前端 gate 通過，原封存檔不重錄 |
| 5175 桌手機 A2／六工作區 | 36 項、20 張畫面，0 console/page error、0 外部 POST |
| 乾淨副本的原五工作區腳本 | 5176，22 項、10 張畫面，0 error、0 外部 POST |

瀏覽器尺寸為 1440×1000、390×900。覆蓋六輸出／剪貼簿、舊收藏原文、依 ID 重生成、顏色與材質色票、舊抓拍快照重抽、新來源明確匯入、收藏重載，以及影片模型選擇後返回 Prompt 的完整狀態。六工作區桌手機皆已渲染檢查，沒有新橫向溢出、破圖或控制項遮擋。5175 為另一 session 已存在的服務，未停用；本次 5176 服務在驗收後停止。

## 隔離環境診斷

1. 第一次 Python 測試因全域 GIT_DIR 指向共享 repo，干擾測試建立自己的臨時 Git fixture；已改用驗收副本自己的 Git 設定，重跑 41／41 通過。保留失敗與重跑日誌，未修改產品程式。
2. 原 A～E 瀏覽器工具在 5175 兩次讀到空的 DLL draft。診斷確認畫面實際載入帶 `?t=` 的熱更新 runtime，該實例 ready=true、hasDraft=true；原工具固定網址的動態 import 取得另一個實例。原工具未修改，在乾淨 5176 上 22／22 通過；A2 專用工具另在 5175 完成全六工作區檢查。
3. 驗收副本由最新 main 加本批明確清單建立。所有正式執行檔與本次工作區一致；臨時診斷 harness 不交付。其他工作目錄、既有未提交檔與歷史證據另有雜湊保護結果。

[驗證差異摘要](comparison.json) · [前端 gate](frontend-results.json) · [來源與 Functions gate](catalog-functions-retry-results.json) · [A2 與歷史 gate](focused-oracle-history-results.json) · [5175 瀏覽器](browser-a2-final/results.json) · [5176 原工具](browser-workspaces-clean/results.json) · [模組診斷](browser-workspaces-diagnosis/module-state.json)

## 接續順序

先限定交付本批並確認該提交的 CI。第二批先核對 40 筆套裝的配色責任及既有 metadata，另留 1 筆特殊穿搭與 runtime 配色句；不因第一批驗收而假設套裝可以直接刪除相同字串。其他 Phase 4／P5b 不開始。

Machine-log display copies have trailing whitespace normalized for Git validation. Exact original bytes are retained as gzip files; see [log-normalization.json](log-normalization.json). No baseline, test result, prompt or source data was changed by this formatting step.
