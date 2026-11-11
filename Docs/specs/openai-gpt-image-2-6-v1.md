# DLL：GPT Image 2.6 Flare／Sunburst

## 功能範圍

- OpenAI 新建任務提供 Flare 與 Sunburst；預設以 Flare 接續舊模型選擇。舊任務保留 `openaiImage2` 與原本的 GPT Image 2 請求行為；歷史顯示不改寫。新任務不直接暴露舊版本選項。
- 靜態輸出可選 PNG、JPEG、WebP 或 SVG；文字生圖另可選 GIF。畫質提供自動、低、中、高、超高及最高；複雜度低／中／高預設高。背景自動／不透明／透明，審核自動／低；JPEG／WebP 可調 0–100 壓縮品質。
- 保留 1K／2K，另提供自動及自訂尺寸；自訂邊長為 16 的倍數、不超過 3840、長短邊不超過 3:1、總像素 655360–8294400，屬保守限制；固定比例的來源不能選自動、自訂尺寸或 GIF。GIF 預設 `size=auto`，另可選方形 512×512、橫式 768×432、直式 432×768。獨立 `gifSize` 隨任務保存、沿用並送至 API，舊任務缺省為 auto。
- GIF 尺寸採低解析度預設組合。官方尚未公開模型別總像素預算，前後端驗證尺寸白名單與影格數，API 最終決定組合是否可用；不硬編造總像素門檻或自動重試。張數 1／2／4，2 張逐張、4 張單次 n=4，實際權限及組合仍待付費驗證。
- GIF 預設 9 影格、每格 200 ms，目前保守支援 2–16 影格及 20–2000 ms，因官方參考頁與指南數值不同。GIF 可能需帳號預覽權限；不使用串流、遮罩或壓縮。
- SVG 使用服務的預設繪製模型，單次請求 `n=1`；下載保留 SVG 格式。為避免動態內容或外部資源，僅預覽與保存可解析且通過靜態安全檢查的 SVG；不支援的 SVG 會提示失敗。SVG、GIF 不送至既有放大與影片入口。
- 圖片編輯接受單張參考圖及可選遮罩或標記 PNG，遮罩與標記擇一。參考圖可選 PNG／JPEG／WebP，轉換後每檔限 2 MB；最大 4096 邊、16M 像素。遮罩／標記須透明 PNG 且與參考圖同尺寸。編輯僅支援 PNG／JPEG／WebP 輸出。參考圖與設定保存在本機任務快照供還原；正式呼叫時才傳送到 OpenAI。
- Flare／Sunburst 預設 1 張，選 4 張時以同一 Prompt 單次提交 n=4，一筆任務保存所有回傳圖，可逐張預覽與下載。SVG 僅提供 1／2 張。
- 1／2 張仍依序單張提交、保存後才送下一張。保留每張請求 ID 佔位、失去回應不自動重送，以及錯誤分類不記錄 Prompt、圖片或金鑰。任務紀錄與沿用設定保存所選模型、畫質、複雜度、格式與相關參數。

## 驗證範圍與待確認事項

- 官方 [2.6 提示指南](https://developers.openai.com/api/docs/guides/image-prompting#gpt-image-2.6-guide)、[生圖參考](https://developers.openai.com/api/reference/resources/images/methods/generate)、[編輯參考](https://developers.openai.com/api/reference/resources/images/methods/edit)與 [GIF 指南](https://developers.openai.com/api/docs/guides/image-generation#generate-animated-gif-output) 在 GIF 影格與編輯支援上仍有不一致；本機採保守交集。
- 模擬圖與自動測試不證明真實模型權限、任何預覽格式、扣額、圖像品質或實際下載成功；未部署，也未呼叫付費 API。使用者授權後，另在正式後端與網站逐項實測。
