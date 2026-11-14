# Z-Image Turbo NSFW v2 BF16 正式版兩張生圖驗收

日期：2026-11-14（Asia/Taipei）。使用者授權 Comfy Cloud 額度測試；本紀錄整理已完成的生成與使用者下載確認，不追加付費請求。

## 版本與範圍

- 正式版：[DLL_PIC Pro](https://cooperfu615-desinger.github.io/Virtual_Photography_Studio/)。
- 受測版本：`8f5d261099c37d0478ab9e85bc15fe177b3d989a`。
- 前輪已確認 GitHub Actions run `43571405233` 的 functions-quality、webapp-quality、build、deploy 成功；四個相關 Functions 已部署。此處記錄正式版付費操作，不把本機模擬或先前獨立 API 測試當作本次證據。
- 模型：`Comfy Cloud · Z-Image Turbo NSFW v2 BF16`，9:16、1K、2 張，指定 Seed 20261114；沿既有工作流 8 steps、CFG 1、res_multistep/simple、shift 3，無 LoRA／自動擴寫。
- 正式版成果時間：2026/11/14 下午 4:07:26。僅點擊一次生成圖像，由 DLL 依序處理兩張。

## 操作與結果

| 項目 | 結果與證據來源 |
| --- | --- |
| 舊任務處理 | 使用者授權並確認結束 10/30 OpenAI 舊測試任務 DIAG20261030F2 的追蹤；保留歷史為「未完成」，沒有重新提交該任務。 |
| 逐張生成 | 瀏覽器先顯示第一張取回、載入與尺寸，再顯示「第 2 張排隊中」，最後為已完成；符合取回第一張後才提交第二張。 |
| 第一張 | 792 × 1408，Seed 20261114；預覽正常。 |
| 第二張 | 792 × 1408，Seed 20261115；預覽正常，可用上一張／下一張切換，頁碼 1 / 2、2 / 2。 |
| 歷史保存 | 重新載入正式版後，兩張成果、Seed 與生成設定仍可讀取；歷史顯示已完成，沒有執行中任務。此為同一瀏覽器保存，不代表跨裝置同步。 |
| 下載 | 自動操作曾點擊下載，但未取得可驗證的下載檔案；後續媒體下載被內建瀏覽器對本機暫存網址的安全政策阻擋。使用者隨後明確確認「兩張都可以正常下載」，因此下載項目依使用者實測列為通過；未宣稱自動化驗證檔案雜湊。 |
| 錯誤檢查 | 完成與重載後查詢瀏覽器 console error，未取得錯誤紀錄；本次未出現「無效的 Comfy Cloud 任務網址」。 |

## 額度與限制

- 畫面剩餘額度由 698 更新為 694 Credits。
- 這是介面取整後的餘額差，沒有取得本次兩筆精確帳務明細，不能解讀為精確扣除 4 Credits；也不能排除同期其他使用。
- 本次沒有精確記錄每張生成耗時或 Cloud job ID，不補造數值。
- 使用完整著衣的成年人物肖像測試；僅驗證本次兩張與流程，不代表所有尺寸、內容或模型品質均已驗收。

## 測試 Prompt

```text
Photorealistic editorial portrait of a 30-year-old East Asian woman, fully clothed in a cream knit sweater and dark trousers, standing by a large cafe window. Waist-up composition, eye-level camera, looking at the camera with a relaxed natural expression. Natural skin texture, clear facial features, softly lit eyes, realistic hands resting on a wooden table. Soft daylight, warm neutral interior, subtle background blur. No text or watermark.
```

## 畫面證據

[重新載入後第二張成果與歷史](production-two-images.jpg)。截圖保留第二張預覽、2 / 2 頁碼、已完成歷史與無執行中任務。

本次交付僅新增驗收文件與截圖，並在模型規格加入後續驗收連結；不修改執行程式、不重新部署 Functions。
