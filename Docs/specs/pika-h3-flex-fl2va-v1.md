# Pika H3 Flex FL2VA 單首圖影片

沿用 DLL_VIDEO Pro 圖片準備、Firebase 認證、Cloud v2 作業防重送、結果追蹤、播放及分段下載。預設仍為 Wan；Pika 固定已驗證的 5 秒、來源圖片尺寸、原生音訊。工作流按 32 像素對齊尺寸；5 秒設定在測試中產出 5.167 秒，不裁剪。較大首圖可能增加耗時及費用。

工作流源自 Comfy Cloud 匯出的 API JSON，保留 MiniMax H3 FL2VA INT8、Pika FL2VA BF16 LoRA 強度 1、LCM、六步 sigma 及音訊解碼；使用者動作與運鏡直接拼接，僅接首圖。輸出節點改為既有影片處理使用的 3。一次 API 實測 768×1360 首圖、768×1344 輸出成功，帳戶餘額差 17.323 Credits，並非逐筆費用或可靠費率。保留剩餘額度及刷新，費用與可生成數顯示暫無法估算。

正式使用前需另行部署 comfyCloudVideo；部署後 DLL 真實登入、生成、播放與下載需另行驗收。
