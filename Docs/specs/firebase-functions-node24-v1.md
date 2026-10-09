# Firebase Functions：Node.js 24 升級 v1

日期：2026-10-09。狀態：本機設定與驗證完成；使用者已授權本批 commit／push，Git 交付狀態以遠端核對為準，尚未重新部署。

## 目標與範圍

Functions 從 Node.js 20 改用 24，避免 2026-10-30 之後無法以 Node 20 部署。修改 `functions/package.json` 的 `engines.node`、`functions/package-lock.json` 根套件的相同欄位，以及 `.github/workflows/deploy.yml` 的 `functions-quality` Node 版本。三者均為 `24`，前端 quality／build 的 Node 22 不變。

不更動 Functions source、Comfy 模板、共用 provider 契約、Prompt、UI、storage、Secret、allowlist、地區或資源設定。鎖定依賴仍為 `firebase-functions 7.2.5`、`firebase-admin 13.10.0`；所有依賴的版本、下載來源及 integrity 不變。

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

設定修改不會更新已部署服務。後續另獲部署授權後，需讓同一個 `default` codebase 的七個 Functions 全數離開 Node 20；只部署 Comfy 三項會留下其他四項。可分為以下兩批，保留既有名稱與 Secret 綁定：

1. DLL 現用：`comfyCloudSubmit`、`comfyCloudStatus`、`comfyCloudQuota`、`magnificDownloadImage`。下載 proxy 仍被 DLL 使用，不能因 legacy 名稱而略過。
2. 隱藏生圖：`magnificGenerate`、`magnificGenerateClassic`、`bytePlusGenerate`。保持隱藏，不刪除或重新開放 UI。

四個 legacy Functions 上次未隨 Krea 部署更新；這次重新部署會載入目前來源及先前核准的共用張數上限 2。部署紀錄需列出此範圍，不只記錄 Node 版本。

部署後逐一確認 `buildConfig.runtime=nodejs24`、ACTIVE、最新 revision 全量流量及 Secret／環境設定沿用。先檢查匿名拒絕與無效 payload；經授權的額度／既有任務查詢及既有圖片下載可驗證連線，不用有效生成請求作為 runtime smoke。真實付費生成、扣額與圖片品質驗收仍與 runtime 升級分開記錄。
