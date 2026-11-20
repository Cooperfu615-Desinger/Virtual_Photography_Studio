# Seedream 5.5 本機整合驗證

開始 2026-11-20，完成 2026-11-21（台北）。基準 main `960c45c1041bd7075e060d5c05d299cbe0738ccf`。

## 範圍

獨立 Seedream 5.5 選項；保留 5.0 Pro。詳見 [規格](../../specs/comfy-seedream55-v1.md)。預設 2K／1 張／隨機 Seed／自動背景／無浮水印；支援官方預設尺寸、自訂尺寸、背景、浮水印、最多十張有序參考圖、1 或 2 張逐張生成及動態費用估算。

## 檢查結果

- Functions：151/151，lint 通過。
- 前端完整測試：2410 項，2409 通過、1 失敗，452.86 秒（Node 22.22.3、concurrency=6）。唯一失敗：`webappTestRunner.test.js` 的 grouped-original-suites 子程序檢查；該檢查有 15 秒上限，本輪約 15.15 秒退出。不能將整輪描述為全綠。
- 未改動測試執行器或基準；單獨重跑同一檔案 10/10 通過，該子程序檢查約 5.03 秒。結果與高並行時的資源／時間壓力一致，但未以另一輪完整測試進一步證明原因。
- 前端 lint、build、`git diff --check` 通過；build 保留既有大型 chunk 提示。
- Seedream 5.5 與 proxy/replay 聚焦測試 24/24 通過；包含兩張的設定傳遞、參考圖順序、擁有者檢查、尺寸驗證、費用與精確歷史逆轉。

## 瀏覽器

本機 `http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`，隔離模擬儲存；不提交供應商、不扣額。

- 1440×1000、390×1000，六個工作區無 document 橫向溢出，無 console/page errors。
- 5.5 自訂錯誤尺寸禁止生成；有效尺寸可操作。
- 透明背景、浮水印、參考圖新增／前移／移除、草稿重新整理恢復。
- 兩張模擬成果切換預覽、各自下載、重整後選取歷史並取回兩張。
- [機器檢查結果](browser-results.json)、[桌面設定](desktop-settings.png)、[桌面歷史](desktop-history.png)、[手機歷史](mobile-history.png)。設定截圖為全頁擷取，浮動操作列位置反映拍攝時捲動位置；成果圖是既有模擬素材，非本次付費模型輸出。

## 未交付範圍

尚未 commit/push 或部署。前次直接 Cloud 單張 2048×2048 測試成功不等同 DLL 正式驗收。透明背景、多參考圖實際品質與 DLL 部署後扣額尚待驗收；本次沒有額外付費呼叫。原有其他 dirty/untracked 工作未納入修改。
