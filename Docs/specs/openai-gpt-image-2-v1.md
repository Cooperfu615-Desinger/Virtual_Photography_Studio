# GPT Image 2 文字生圖

> 2026-10-31 現行狀態：使用者確認 DLL 日常使用大致正常，決定更新紀錄、不因舊文件缺少逐項證據而全面重新驗收。交付核對與少數未確認事項見[使用狀態紀錄](../decisions/2026-10-31-dll-usage-status.md)。以下正文保留當時的實作／驗收狀態；「未部署」「未實測」「待驗收」等歷史文字不作目前自動待辦。此回饋不等於每個模型、尺寸、費用或異常情境均已逐項通過，既有驗收限制保持。

2026-10-30，本機實作；未部署或執行真實生成。

- 選擇 OpenAI GPT Image 2；預設中畫質、1K、1 張，提供低／中／高及 1／2 張，比例與尺寸由後端固定映射。
- 不提供 Seed、LoRA、參考圖編輯或額度查詢；額度連結前往 OpenAI 账務。成果與任務存在既有瀏覽器儲存空間，畫質保存在新 OpenAI 任務快照；舊任務維持原格式。
- 使用 Firebase 登入、允許清單與 `OPENAI_API_KEY` Secret。`openAIImageGenerate` 對每張圖先以登入 UID 與 request ID 佔位，重複請求不再送出；生成逾時或結果不明時需使用者核對用量後手動決定，不自動重送。OpenAI 同步生圖未實作遠端結果查詢；失去回應可能無法取回圖片。
- 前端依序請求，每張完成並保存後才提交下一張。OpenAI 返回 Base64 PNG；扣額、模型權限、實際圖片、下載與連線中斷行為仍待部署及授權真實驗收。
- 1K 尺寸：1:1 1024×1024、4:3 1152×864、3:4 864×1152、16:9 1360×768、9:16 768×1360、4:5 1024×1280。2K：1:1 1920×1920、4:3 2048×1536、3:4 1536×2048、16:9 2048×1152、9:16 1152×2048、4:5 1632×2048。長寬受 16 像素限制，部分比例為近似值。
- 參考：[GPT Image 2](https://developers.openai.com/api/docs/models/gpt-image-2)、[圖片生成 API](https://developers.openai.com/api/reference/resources/images/methods/generate)、[API 額度](https://developers.openai.com/api/docs/guides/chatgpt-api-credits)。

## 本機驗證

- Functions 測試 111／111 與 lint 通過（本機 Node 25）；新增 request、尺寸、Base64 與斷線後重複請求測試。執行環境設定為 Node 24，尚待正式部署驗證。
- 前端 Node 22 完整測試 2040／2040、lint、build 通過；新增 4 項順序、儲存失敗、中斷及畫質快照測試另行通過。首次用系統 Node 25 執行前端測試遇到 TAP 訊息格式斷言失敗，切換為 Node 22 後通過。Build 有既有大 chunk 提示。
- 開發預覽模擬模式：桌面 1440×1000、手機 390×900 檢查模型、畫質、張數、生成狀態與成果；畫質快照與顯示、快速面板、Seed 隱藏通過；桌手機檢查無文件水平溢出，console error 0。模擬圖片並非 OpenAI 圖片，也不代表真實服務、扣額或下載驗收。
- 桌面與手機另逐一檢查 Prompt 工作台、角色建模、場景建模、Saved Cards、DLL_PIC Pro、DLL_VIDEO Pro 的載入與文件溢出；未操作或改寫真實收藏。
