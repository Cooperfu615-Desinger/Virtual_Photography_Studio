# H3 Image 官方核心工作流對齊

日期：2026-11-21。使用者要求替換現有模型選項，並另行確認「保留 DLL Prompt 原文，擴寫關閉」。

## 修改

- `functions/src/comfyWorkflows/minimaxH3Image.json`：NVFP4 AWQ 文字編碼器改官方範本的 INT8 convrot；舊 LCM 自訂採樣鏈改 KSampler / Euler / simple / 6 steps / CFG 1 / denoise 1。8 節點，主模型、VAE、4 MP 方形與 SaveImage node 34 保持。
- `functions/src/comfyModels.js`：seed 改送 node 39 的 seed；modelKey 不變。
- `functions/test/comfyMinimaxH3Image.test.js` 與歷史 fixture：精確檢查採樣連線、Prompt 原文、尺寸、Seed，以及舊 LCM 工作流不能匹配新估價樣本、舊輸出節點可解析。
- 本次對齊官方核心生成路徑，非把官方所有互動選項搬入 DLL。維持無參考圖、無擴寫、預設 1 張、可選 2 張逐張生成。

## 官方來源差異

[目前文生圖範本](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/image_minimax_h3_image_t2i.json)的外層 subgraph switch 實際為 true；[教學](https://docs.comfy.org/tutorials/image/minimax/minimax-h3-image)卻描述預設關閉。已向使用者確認，依其明確選擇不啟用擴寫，不用教學敘述掩蓋 JSON 差異。

## 驗證

- 先更新回歸斷言並確認舊程式失敗，再改工作流。
- Functions 全測試 152/152，lint 通過。
- 前端相關 H3、provider contract、Cloud proxy、quota display 測試 26/26；lint、build、diff-check 通過。未改前端來源或共享模型契約，本輪沒有重跑整套 Prompt 引擎測試；保留既有 build 大型 chunk 提示。
- 1440×1000、390×1000 的本機隔離 acceptance 模式：六工作區導航無 document 溢出、無 console/page errors；H3 預設一張／4 MP、兩張模擬生成、各自下載、草稿與歷史重新載入正常。
- [瀏覽器結果](browser-results.json)、[桌面](desktop-history.png)、[手機](mobile-history.png)。圖像為既有模擬 fixture，不代表更新後模型畫質。

## 未完成的外部驗收

沒有 commit/push、部署或付費生成。新版在 Cloud 的實際 INT8 載入、出圖品質、耗時與扣額尚未驗收；舊 LCM 的出圖結果不能代替。需部署 comfyCloudSubmit、comfyCloudWorkspaceSubmit、comfyCloudStatus、comfyCloudQuota 後另行驗收。舊完整工作流與新版不同，額度估算會等待相符樣本，不能沿用先前 LCM 每張費用。
