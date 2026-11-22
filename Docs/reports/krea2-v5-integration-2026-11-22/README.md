# Krea 2 NSFW V5 LoRA DLL 整合驗收

日期：2026-11-22。基底：main `a93bb20ef025a74596ad89961678419cad133cd0`。

## 範圍

原生 Krea 2 Turbo 的預設關閉開關、首次強度 1.0、0–1／0.05 調整、歷史保存與沿用。未 commit、push 或部署；未額外呼叫付費生成。既有 current_project_state／session_onboarding 修改及其他未追蹤研究檔案保留。

## 瀏覽器

Chrome，本機 `http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`，隔離模擬資料。

- 1440 × 1000：原生模型預設關閉；勾選顯示 1.0；1.1 時生成按鈕停用；0.35 可用。關閉後摘要回到原生且不顯示強度。Medium Turbo 不顯示此開關。
- 模擬使用 `A blue ceramic cup in soft daylight.`、9:16、1K、2 張、Seed 42、強度 0.35；經排隊／完成狀態取得兩張範例圖，切換第二張顯示 Seed 43。歷史實際設定顯示強度 0.35。
- 重新載入並沿用設定，還原原生下拉選項、LoRA 已套用 0.35、Prompt、2 張與 Seed 42。
- 390 × 900：強度控制可操作（調整 0.4）、成果頁沿用可回到設定。工作台快速面板亦可開關並記住調整後強度。
- 六個工作區於上述兩個尺寸完成導航／畫面 smoke；無意外水平頁面溢出，未見新增 console error。未改動共享 CSS 或導覽。
- [桌面畫面](desktop.jpg)、[窄版畫面](mobile.jpg)。畫面圖片是既有模擬 fixture，**不是本次 Prompt 的真實生成效果**。

## 自動檢查

- 專項測試 10/10 通過（工作流、強度驗證、雙張序列、快照、額度樣本隔離、歷史反向投影）。
- Functions 全套 156/156 通過；lint 通過。
- 前端 lint／build 通過；build 保留既有大型 chunk 提醒。
- 前端全套 2457 項：2453 通過，4 項因 Node 25 預設報表格式不同失敗；將涉及的兩個檔案使用 CI 同版 Node 22.23.3 補驗，25/25 通過。四個失敗均已由補驗覆蓋，沒有未解決的產品行為失敗；未宣稱單次全套全綠。
- `git diff --check` 通過；文件連結與截圖路徑確認存在。

首次前端全套執行把 TAP reporter 放入 `NODE_OPTIONS`，歷史子程序再次指定 reporter，導致 47 項皆以 `ERR_INVALID_ARG_VALUE` 在測試啟動前失敗（其餘 2410 通過）。移除該環境變數，改將 reporter 放在頂層測試參數後重跑；未修改產品碼來繞過失敗。

前端全套使用與 `npm test` 相同的 runner／檔案集合，限制並行數為 4：

```sh
env -u NODE_OPTIONS node ../scripts/run_webapp_tests.mjs --test-reporter=tap --test-concurrency=4 src/lib/*.test.js src/lib/engine/*.test.js src/features/*/*.test.js
```

Node 22 補驗檔案：`src/features/qa/webappTestRunner.test.js`、`src/lib/engine/indoorSeatMutation.test.js`。四個失敗分別為 runner 的成功／失敗結果解析、歷史 fixture reuse 報表解析，以及 seat mutation 的控制組與 restore-drops-seat 報表解析；測試預期 TAP 的 `# pass`／`# tests`，Node 25 子程序輸出為 `ℹ pass`／`ℹ tests`。

## 本次檔案

- `functions/shared/imageProviderContract.json`：LoRA 模型、比例、張數、強度契約。
- `functions/src/comfyModels.js`：固定 LoRA 工作流分支。
- `webapp/src/lib/dllPicProClient.js`：開關／強度／儲存識別，沿用既有面板與歷史流程。
- `webapp/src/lib/dllPicGenerationPresentation.js`：套用版說明。
- `functions/test/comfyKreaV5Lora.test.js`、`webapp/src/lib/kreaV5Lora.test.js`：專項測試。
- `scripts/lib/kreaV5Replay.json`、`scripts/lib/kreaV5Replay.mjs`、`webapp/src/lib/kreaV5Replay.test.js`：本次精確反向投影。
- `scripts/lib/c2WaistHistoryContext.mjs`、`webapp/src/lib/h3ImageSizesReplay.test.js`、`webapp/src/lib/seedream55Replay.test.js`：串接歷史投影。
- `Docs/specs/comfy-krea2-v5-lora-v1.md` 及本報告／兩張截圖：規格與驗收證據。
