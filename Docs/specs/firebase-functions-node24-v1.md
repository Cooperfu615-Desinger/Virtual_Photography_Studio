# Firebase Functions：Node.js 24 升級 v1

日期：2026-10-09。狀態：已 commit／push `c552423bf574a180fc834597fdc06250eebabb05`；使用者另行授權後，七個 Functions 的 Node 24 正式部署與匿名啟動驗證完成。登入後外部服務與付費生成仍待驗收。

## 目標與範圍

Functions 從 Node.js 20 改用 24，避免 2026-10-30 之後無法以 Node 20 部署。修改 `functions/package.json` 的 `engines.node`、`functions/package-lock.json` 根套件的相同欄位，以及 `.github/workflows/deploy.yml` 的 `functions-quality` Node 版本。三者均為 `24`，前端 quality／build 的 Node 22 不變。

本次設定差異不更動 Functions source、Comfy 模板、共用 provider 契約、Prompt、UI、storage、Secret、allowlist、地區或 source 中的資源宣告。正式部署會將較舊的雲端設定同步至目前 source，實際差異見末段部署紀錄。鎖定依賴仍為 `firebase-functions 7.2.5`、`firebase-admin 13.10.0`；所有依賴的版本、下載來源及 integrity 不變。

## 支援與設定依據

- [Google Cloud runtime 支援時程](https://docs.cloud.google.com/functions/docs/runtime-support#node.js) 於 2026-10-09 核對：Node 24 為正式支援的 Run functions runtime，棄用日 2028-04-30、停止日 2028-10-31；Node 20 停止日 2026-10-30。Node 24 限 Gen2／Run functions，本專案七個 exports 皆為 Gen2。
- [Firebase runtime 設定](https://firebase.google.com/docs/functions/manage-functions#set_nodejs_version) 的版本清單尚未列 24；另以 Google 支援時程與本機 Firebase CLI 15.17.0 的 supported runtime 清單核對 `nodejs24` 為 GA。CLI parser 接受 `engines.node="24"`，不需升級 global CLI。
- `firebase.json` 沒有 runtime 覆蓋，故採 `functions/package.json`。日後若新增 `functions.runtime`，它會優先於 package，必須保持一致；本次不新增第二份 runtime 設定。
- 本機預設 Node 為 22.22.3，Functions 安裝／測試／lint 明確使用 bundled Node 24.19.0：`/Users/cooperfu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin`。日後 Functions discovery／部署也須確認 `node --version` 為 24，避免只在設定中宣告 24 卻用舊版載入 source。

## 本機驗證（2026-10-09）

- Node 24.19.0 執行 `npm ci --engine-strict --no-audit --no-fund` 成功，安裝 337 packages。依賴 engine 相容，未找到 native addon；既有 `node-domexception`／`uuid` 棄用提示保留，不在本次升級依賴。
- Functions `npm test` 72/72、`npm run lint` 通過。涵蓋 Comfy Submit／Status／Quota、Partner Node、Krea、逐張／追蹤契約、圖片下載、登入及隱藏 legacy provider 路徑。
- Node 24 下七個 callable exports 全數載入；逐一呼叫匿名請求均回 `unauthenticated`。以封鎖的 fetch 記錄確認供應商呼叫數為 0，不讀真實 Secret、不寫 Firestore、不提交付費生圖。
- Node 24 下前端 `providerContract`、`comfyCloudProxyClient`、`comfyModelExpansion`、`comfyQuotaDisplay`、`dllPicProClient`、`dllPicGenerationPresentation`、`imageDownload` 七個測試檔案 55/55。前端沿用 Node 22.22.3 的 lint／build 通過；既有 Vite 大型 chunk 提示保留。
- 精確比較設定與鎖定檔，只有三處 Node 版本值改變。既有 Krea 部署文件修改及未追蹤參考資料保留；文件本機連結與 `git diff --check` 通過。
- 本次不改 frontend 執行環境、共享契約或使用者可見行為，因此採相關 client／shared tests 加前端 lint／build，未重跑完整 Prompt suite 或 UI 瀏覽器流程。前批完整測試的既有服裝隨機 fixture 例外見 [目前狀態](../current_project_state.md)，未在本次修正。

本機證據：`/tmp/vps-node24-functions-tests.log`、`/tmp/vps-node24-functions-lint.log`、`/tmp/vps-node24-client-tests.log`、`/tmp/vps-node24-webapp-lint.log`、`/tmp/vps-node24-webapp-build.log`。本機 macOS 驗證不代替正式 Linux runtime 的 TLS／DNS、Admin／Firestore、供應商連線驗收。

## 正式部署與驗收邊界

設定修改本身不會更新已部署服務。完整遷移需讓同一個 `default` codebase 的七個 Functions 全數離開 Node 20；只部署 Comfy 三項會留下其他四項。本批已另獲授權並部署以下全部七項，保留既有名稱與 Secret 綁定；未來仍可分兩批執行：

1. DLL 現用：`comfyCloudSubmit`、`comfyCloudStatus`、`comfyCloudQuota`、`magnificDownloadImage`。下載 proxy 仍被 DLL 使用，不能因 legacy 名稱而略過。
2. 隱藏生圖：`magnificGenerate`、`magnificGenerateClassic`、`bytePlusGenerate`。保持隱藏，不刪除或重新開放 UI。

四個 legacy Functions 上次未隨 Krea 部署更新；這次重新部署會載入目前來源及先前核准的共用張數上限 2。部署紀錄需列出此範圍，不只記錄 Node 版本。

部署後逐一確認 `buildConfig.runtime=nodejs24`、ACTIVE、最新 revision 全量流量及 Secret／環境設定沿用。先檢查匿名拒絕與無效 payload；經授權的額度／既有任務查詢及既有圖片下載可驗證連線，不用有效生成請求作為 runtime smoke。真實付費生成、扣額與圖片品質驗收仍與 runtime 升級分開記錄。

## 正式部署紀錄（2026-10-09）

以下保留當時部署紀錄。來源 `c552423bf574a180fc834597fdc06250eebabb05`，交付當時 `main`／`origin/main`／GitHub 遠端一致、部署前 tracked 工作區乾淨。使用 Node 24.19.0 與 Firebase CLI 15.17.0，明確指定七個名稱及 `virtualphotographystudio`，部署 CLI exit 0，七項 Successful update；2026-10-09 09:10（台北）完成。

| Function | 部署後 revision | 雲端 runtime／狀態／流量 |
| --- | --- | --- |
| `comfyCloudSubmit` | `comfycloudsubmit-00008-xel` | Node 24／ACTIVE／最新 revision 全量 |
| `comfyCloudStatus` | `comfycloudstatus-00009-vat` | Node 24／ACTIVE／最新 revision 全量 |
| `comfyCloudQuota` | `comfycloudquota-00004-bof` | Node 24／ACTIVE／最新 revision 全量 |
| `magnificDownloadImage` | `magnificdownloadimage-00004-lej` | Node 24／ACTIVE／最新 revision 全量 |
| `magnificGenerate` | `magnificgenerate-00003-jof` | Node 24／ACTIVE／最新 revision 全量 |
| `magnificGenerateClassic` | `magnificgenerateclassic-00004-guy` | Node 24／ACTIVE／最新 revision 全量 |
| `bytePlusGenerate` | `byteplusgenerate-00002-bep` | Node 24／ACTIVE／最新 revision 全量 |

- 三個 Comfy 共用 build `e1cb1b97-0d50-4c55-9204-736f02855c99`，其他四項共用 `8790cee6-2551-4a6b-b3e9-5b5924bf5815`；七項均為 Gen2／us-central1，新 build／revision／code hash 已更新，專案 Function 清單仍為同七項。
- Secret 名稱／專案／版本完全沿用：三個 Comfy 為 `COMFY_CLOUD_API_KEY` v1，Magnific 兩個生圖服務為 `MAGNIFIC_API_KEY` v1，BytePlus 為 `BYTEPLUS_ARK_API_KEY` v1，下載 proxy 沒有 Secret 綁定。未存取金鑰值、部署 rules／indexes 或新增 source 修改。
- 部署前後嚴格比較發現三項舊雲端上限同步至已提交 source 的 `maxInstances: 2`：`magnificGenerate`／`magnificGenerateClassic` 20→2、`bytePlusGenerate` 未明設→2。BytePlus 另新增公開的 `FUNCTION_SIGNATURE_TYPE=http` HTTP 框架標記；只記錄此 metadata 差異，不推斷由哪個 CLI／Cloud 分支注入。所有既有環境值、其他資源欄位、地區、URI、service account 及 Secret 綁定相同，沒有未解釋差異。三個隱藏生圖服務也同步目前 source 與先前核准的共享張數上限 2。
- 七個正式 callable 使用無登入的 `{"data":{}}`，均回 HTTP 401／UNAUTHENTICATED、本專案中文登入提示，以及正式 Origin 的 CORS。這證明最新 Node 24 容器可載入 source／模板並執行登入 guard／錯誤回傳；請求在供應商、Firestore、圖片下載與 Secret `.value()` 之前拒絕。沒有查詢真實額度、提交付費工作、下載圖片或寫 Firestore；平台 Secret 注入不代表金鑰或供應商連線已驗收。
- [Node 24 Actions 37867954155](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/37867954155) 於 2026-10-17 重查已全部成功（Functions／frontend quality、build、deploy），head SHA 與上述來源一致，Pages deploy job 於 2026-10-09 09:24:44（台北）完成。另重查 [Krea 前批 37749256835](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/37749256835) 全部工作成功，Pages 於 2026-10-08 16:41:46（台北）完成發布，更新前次尚在執行的快照。
- 證據：`/tmp/vps-node24-functions-deploy.log`、`/tmp/vps-node24-cloud-{before,after}.jsonl`、`/tmp/vps-node24-functions-{before,after}.json`、`/tmp/vps-node24-deployment-verification.json`、`/tmp/vps-node24-deployment-smoke.json`。部署後文件紀錄於 2026-10-17 整理交付；原未追蹤參考資料保留。CLI 仍提示 firebase-functions 有新版，本批依賴未升級。

Node 20 的七項部署期限問題已處理。登入／allowlist 正常路徑、Firestore IAM／交易、真實 quota／status／圖片下載、供應商 TLS／DNS 與付費生成品質仍需另外驗收；匿名啟動 smoke 不代替上述結果。

## 紀錄核對（2026-10-17）

- Git 可核對 `c552423` 的 runtime／CI 設定修改與 `162cd4f` 的 Krea 實作；上述兩筆 Actions 的 head SHA 與來源一致，四個 jobs 均成功。Pages 與 Functions 部署是不同流程，不能互相代替證據。
- 以 `firebase functions:list --project virtualphotographystudio --json` 唯讀查詢：目前恰為上述七項 Functions，均為 `nodejs24`、`gcfv2`、`ACTIVE`、`us-central1`，`maxInstances` 均為 2。
- 清單未提供 revision／流量／build ID；上方 revision、Secret 版本、環境比較及匿名 POST 結果保留為當時部署紀錄，未重新驗證。歷史 `/tmp` 驗證檔本次已無法取得，不作為目前仍可讀取的附件。
- 這次只整理文件，未重新部署、讀取 Secret 值、呼叫生成或查詢付費額度；登入後供應商連線、下載、扣額與生成品質仍待獨立驗收。
