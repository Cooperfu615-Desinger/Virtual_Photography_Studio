# DLL：MOSS-Image SFT INT8 與可選 LoRA v1

> 2026-10-31 現行狀態：使用者確認 DLL 日常使用大致正常，決定更新紀錄、不因舊文件缺少逐項證據而全面重新驗收。交付核對與少數未確認事項見[使用狀態紀錄](../decisions/2026-10-31-dll-usage-status.md)。以下正文保留當時的實作／驗收狀態；「未部署」「未實測」「待驗收」等歷史文字不作目前自動待辦。此回饋不等於每個模型、尺寸、費用或異常情境均已逐項通過，既有驗收限制保持。

日期：2026-10-20。使用者確認本機整合並授權 commit／push、合併 main 發布正式 DLL，以及部署四項 Functions；不含新的付費生成。

## 介面與操作

- 快速面板與 DLL 完整版共用單一模型選項 `Comfy Cloud · MOSS-Image SFT INT8`，選定後顯示「套用 MOSS LoRA」核取方塊；首次選模型預設關閉，勾選後強度固定 0.7。
- 1K、六種現有比例（1:1、4:3、3:4、16:9、9:16、4:5）、16 像素對齊。初版沿用已測試的約 1MP，不提供 2K；其他模型的尺寸規則不變。
- 預設 1 張、可選 1／2 張。先取得並保存第一張圖片，再送第二張；完整版指定 Seed 時第二張為 Seed + 1。切換 LoRA 可保留比例、Seed 與張數；切換其他模型沿用既有重設行為。
- 草稿、快速面板開啟完整版、待生成、歷史沿用設定／Seed 都保存真正的模型版本。原任務不因之後切換開關而改動。
- 不新增工作流、LoRA 檔案或強度編輯器；沿用既有版面、斷點及核取控制項，沒有整體視覺重設。

## 固定工作流與來源

來源為本對話中已在 Comfy Cloud 成功執行並匯出的 `moss_lora_seed42_strength07.api.json`；Cloud 基底與 LoRA 0.7 分別顯示 12.59／7.75 秒完成。這是 GUI 著衣人像相容性驗證，不代表 DLL API、精確扣額或原圖下載已驗收。

- 基底：`moss_image_sft_int8_convrot.safetensors`。
- 文字編碼：`qwen3.5_9b_w4a8_gptq.safetensors`，`type=moss_image`。
- VAE：`flux2-vae_small.safetensors`。
- 30 steps、CFG 3、Euler／simple、denoise 1；SLG 關閉、無自動擴寫。
- DLL Prompt 直接寫入 `18:4` 的 `CLIPTextEncode`，不加作者觸發詞、不改寫來源。
- 負面詞沿用已測試範本：`nsfw, worst quality, bad anatomy, watermark, jpeg artifact`。因此本批不宣稱已驗證作者所有內容用途。
- LoRA 版本僅在 UNET 與 KSampler 間加入 `LoraLoaderModelOnly`，固定檔名 `Nailai__moss-image-comfy-lora__moss_image_axiomofmind_comfy_native_naming.safetensors`、強度 0.7，不修改 CLIP。
- 保留九個必要基底節點；LoRA 版本共十個。移除已關閉的 SLG、擴寫、switch 與 UI 解析度選擇器；尺寸由現有後端 builder 注入。每個 job 固定 batch 1，只接收 `9` SaveImage 最終圖片。

LoRA 由 [axiomofmind 作者模型庫](https://huggingface.co/axiomofmind/Moss-image-nsfw-uncensored-lora/blob/main/README.md) 派生，原授權 Apache-2.0。原檔 SHA-256 `d62ce599744d3e3f07f55a1f539052a99acc38d34bf35c13518aa949fc856afa`；相容副本 SHA-256 `11d376a93d6e61b1bf5f052afe7da34ec6dbd387642fb5599bb833752a64686a`。轉換僅將 `transformer.` 前綴改為 `diffusion_model.` 並加入來源 metadata；504 個 tensor 的形狀及數值 payload 均未改動。模型權重及 HF token 不放入 Git。

作者的「Uncensored」是社群 LoRA 的訓練用途與命名，不是 MOSS 官方新基底或 Cloud 審核開關。作者頁面有用途、觸發詞與建議設定說明，不代表解除託管平台限制。產品開關只決定是否載入這份權重。

## 相容與額度

- 後端固定 key：`mossImageSftInt8`／`mossImageSftInt8Lora`；前端對應 `comfyMossImageSftInt8`／`comfyMossImageSftInt8Lora`。
- LoRA 版本不單獨出現在模型下拉清單；只對此固定 hidden variant 保留設定還原，不放寬其他 legacy hidden 規則。選單以基底 key 呈現，請求與歷史仍使用實際 variant。
- 沿用現有 modelKey 快照、pending、Firestore claim 與 status；不新增 browser-storage key、資料庫 schema 或 client 任意 graph／權重 override。
- 額度快取、候選樣本及固定 workflow 比較均依 modelKey 自動隔離。兩個版本不互借樣本，至少三筆同版本／解析度／比例的成功單張樣本才估算張數。
- 舊後端不認識新 key，會在 claim／付費提交前拒絕，不能靜默改跑基底或其他模型。

## 發布與實際驗收邊界

本批需同步部署 `comfyCloudSubmit`、`comfyCloudWorkspaceSubmit`、`comfyCloudStatus`、`comfyCloudQuota` 四項 Functions，已完成，實際結果見下節；既有放大／取消、影片與下載服務不需變更。保留 Node 24、allowlist 與 `COMFY_CLOUD_API_KEY`，無新增 Secret。

HF token 供 [Cloud 匯入私人模型](https://docs.comfy.org/cloud/import-models) 使用，DLL 不收集或轉傳該 token。正式 API key 必須能讀取同一 [Cloud 工作區](https://docs.comfy.org/cloud/workspace) 的私人 LoRA；GUI 成功不代表 API 私人模型可見性已通過。部署後再各驗收基底／LoRA 的 API 出圖、選項快照、額度與圖片下載；不得將本機模擬當成付費驗收。

## 本批驗證

- Node22 前端完整 **1735/1735**、lint、build 通過；Node24 Functions **98/98**、lint 通過。新增測試包含固定模板、Seed／尺寸拒絕、LoRA 對應、hidden variant 還原、兩張序列先保存、任務／草稿快照、quota 樣本與快取隔離、相同 request ID 不重送、無 credential forwarding。原九份工作流 byte equality 與 SHA 相同。
- 1440×1000／390×900，檢查目前五個導覽工作區（Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、Saved Cards）；動作姿勢已由較新的主線退休，未重新加入。三個現用快速面板及完整版的 LoRA 開關均可操作，模型切換會正確顯示／隱藏開關，1K 與 1／2 張選項符合契約。
- 本機 `?dllAcceptance=1` 獨立資料庫驗證：基底一張、LoRA 兩張、排入後切換開關不變更原任務、Seed 42／43、歷史沿用、第二張 Seed 沿用、草稿 reload、快速入口保護現有草稿並可明確帶入、模擬中斷後手動查詢恢復。新增三筆模擬任務保留供驗收；畫面範例是本機 fixture，不是 MOSS 真實出圖。既有 11 張 Saved Cards 只讀。
- 一般模式額度顯示「請先登入」，刷新停用；沒有提交生成。隔離工作目錄沒有複製原 `.env.local`，尚未驗證此工作目錄的真實 Firebase 登入。
- 最後無 console warning/error、破圖或 document 橫向溢出；桌面 client/scroll width 同為1425、手機同為375（設定 viewport 為1440／390，扣除 scrollbar）。開關沿用原生 checkbox，跨滿現有格線，沒有新斷點；以限定 type selector 避免完整版的一般輸入框規則拉寬核取方塊。
- Build 保留現有大型 chunk 與動靜態混用 import 提示。首輪 build 因隔離目錄的 sandbox 寫入限制失敗，授權範圍內重跑後成功，非程式錯誤。未改 Prompt renderer，因此未執行無關 strict audit／資料同步。
- 證據：[桌面](../reports/comfy-moss-lora-2026-10-20/desktop-final.png)、[手機](../reports/comfy-moss-lora-2026-10-20/mobile.png)、[快速面板手機](../reports/comfy-moss-lora-2026-10-20/quick-mobile.png)、[模擬中斷](../reports/comfy-moss-lora-2026-10-20/interrupted.png)、[檢查紀錄](../reports/comfy-moss-lora-2026-10-20/visual-qa.json)。

## Git 與正式部署紀錄（2026-10-20）

- 使用者明確授權提交、推送、合併 main 與發布正式 DLL。功能提交 `295c46d3a9d97e3215a5a08f9de09da25041b019` 已推送 `origin/codex/moss-optional-lora`；遠端 `main` 由 `1b8f31a85cd130cc167a0e6b26c113beaf2b4444` 一般快轉至同一提交，無 force push。原 main 工作目錄與其未追蹤參考資料未改動，未推送其他 remote。
- [Actions 39376331565](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/39376331565) 的 functions-quality、webapp-quality、build、deploy 全部成功，Pages 於 2026-10-20 13:46:15（台北，05:46:15Z）完成。
- [正式 DLL](https://cooperfu615-desinger.github.io/Virtual_Photography_Studio/) HTTP 200；實際載入的 `index-U9JVd6_I.js` SHA-256 為 `e2a61d17a64da0c204e852ee0442f7853342afd66248052b669f65a24267b828`，包含基底與 LoRA key；`DllPicProPanel-AJNEJ69T.js` SHA-256 為 `b6638ae70e71b7c0749bdf8c584cae746cafe426e0ea24c7d4722ea20b8e5248`，包含核取控制項與強度 0.7。
- 正式頁面快速面板已實際選取 MOSS：初次 LoRA 關閉；勾選後顯示 `mossImageSftInt8Lora / 1K` 與強度 0.7。未登入時額度提示登入、刷新停用，檢查未提交生成；console warning/error 為零。結束前還原 LoRA 關閉及原 Gemini 選項。證據：[正式頁面](../reports/comfy-moss-lora-2026-10-20/live-release.png)。
- Firebase CLI 僅部署 `virtualphotographystudio/us-central1` 的 Submit／WorkspaceSubmit／Status／Quota 四項服務，四者部署成功後為 ACTIVE、Node.js 24、Gen2；來源 hash 均由原值更新為 `f2da04e9a794ae3e76990b13538c17060d7ca5ac`。未新增 Function、Secret 或發布 rules／indexes。
- 四者資源設定、應用環境值與 `COMFY_CLOUD_API_KEY` v1 綁定不變；CLI 為 WorkspaceSubmit 新增框架標記 `FUNCTION_SIGNATURE_TYPE=http`。另外七項服務的完整 CLI metadata 比較不變：BytePlus、ImageWorkspace、Video、VideoDownload、MagnificDownloadImage、MagnificGenerate、MagnificGenerateClassic。可檢查 [部署比對摘要](../reports/comfy-moss-lora-2026-10-20/functions-deployment.json)。
- 部署後逐一匿名 JSON POST 均回 401／UNAUTHENTICATED，來源保護在 Secret 與 provider 呼叫之前；正式 Pages origin 的 OPTIONS 均回 204 且 CORS origin 正確。沒有送出付費生成或建立使用者任務。可檢查 [保護與 CORS 結果](../reports/comfy-moss-lora-2026-10-20/functions-smoke.json)。
- Firebase CLI 提示 firebase-functions 套件可升級，本批依範圍未升級。發布與服務健康檢查已完成；真實登入、API 私人 LoRA 可見性、基底／LoRA 出圖、精確扣額及原圖下載仍是獨立待驗收項目。
