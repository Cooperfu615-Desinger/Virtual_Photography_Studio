# DLL：FLUX 3 Image Klein Base INT8 v1

日期：2026-10-19。使用者核准實作與發布；功能提交 `2323bf8c0d6ebab8813511e098bd9566658ad208` 已推送 origin/main，三個 Functions 已部署。未實際付費生成。

## 模型與工作流

來源為使用者匯出的 `/Users/cooperfu/Downloads/image_flux3_klein_t2i.json`（原檔保留）。DLL 名稱 `Comfy Cloud · FLUX 3 Image Klein Base INT8`，前端 key `comfyFlux3KleinBaseInt8`，後端 key `flux3KleinBaseInt8`。沿用共享 contract、自動選單與既有 Comfy submit/status/download 路徑。

- 固定 `flux3-image-klein-base-int8-convrot.safetensors`、`qwen3vl_4b_int8_convrot.safetensors`、`flux2-vae.safetensors`。UNET 名稱於 2026-10-24 依 Cloud 模型庫修正，見下方紀錄。
- Base INT8，50 steps、CFG 3.5、Euler／simple、denoise 1；不是 Distilled。
- DLL prompt 直接寫入 `18:4` CLIPTextEncode。移除 TextGenerate、upsampler 模型／system prompt、switch、文字 preview 與未連入生成路徑的 bounding-box 分支，保留九個必要節點。負面 prompt 為空，無 LoRA。
- `18:6` batch_size=1，`18:7` 每次注入 seed，僅接收 `9` SaveImage 最終圖片。來源中的個人 prompt 不納入模板。
- 預設 1 張、可選 1／2；沿用 [逐張生成規格](comfy-krea-sequential-generation-v1.md)，第一張完成並取得最終圖片才送第二張，不新增重試或改動追蹤契約。
- 支援 1K／2K 與六種既有比例。此模型使用 16 像素 grid，維持精確比例及約 1／4 MP；原三個本機 diffusion 模型仍使用 8 像素 grid，參數不變。
- 剩餘額度／刷新沿用既有途徑；預估張數至少三筆同模型、尺寸、比例、模板與採樣設定的成功單張樣本，不借用 Z-Image 成本。費率沿用現行估算契約，非實際帳單保證。

## 介面與驗證

- 新模型由共享 contract 出現在四個 DLL 面板。長選項文字暴露了動作／場景面板的 min-content 撐寬問題；使用隔離 HEAD 頁比對後，僅對 DLL panel/grid/field 限制最小寬度，沒有變更既有斷點或整體配置。收合選單沿用原生文字截短，展開可辨識完整名稱。
- Functions：86/86、lint 通過。新增四項測試涵蓋原始模型檔、直接 prompt、50/3.5、圖路徑、十二組尺寸、既有模型尺寸不變、單 job 一張及額度模板隔離。
- 前端：完整 1660/1660、lint、build 通過；模型選單／代理映射回歸包含新 key，既有逐張成功與失敗保留測試通過。Build 既有大型 chunk 提示保留。CSS 修正後重跑 lint/build 通過。
- Browser：`http://127.0.0.1:5175/Virtual_Photography_Studio/`，1440×1000／390×900。五個主要工作區完成載入與視覺檢查；四個 DLL 面板可選新模型，PAGE1 檢查 1／2 張、1K／2K、切換模型回一張、空預覽、短暫 loading、未登入錯誤、額度未登入禁用及鍵盤焦點。最終無水平溢出、破圖或 console warning/error。
- 截圖：[桌面](../reports/flux3-klein-2026-10-19/desktop.png)、[手機](../reports/flux3-klein-2026-10-19/mobile.png)。未登入狀態不提交付費工作；Cloud 真實成功、扣額、下載與品質仍待部署後驗收，不能以本機檢查替代。

## 發布邊界

使用者已於 2026-10-19 授權 commit／push，以及部署 `comfyCloudSubmit`、`comfyCloudStatus`、`comfyCloudQuota`。這三項共用模型定義，需同步發布；不需新增 Secret、Functions 或升級 runtime。下載代理與影片 Functions 本批不變。


## 部署紀錄（2026-10-19）

- 功能提交 `2323bf8c0d6ebab8813511e098bd9566658ad208` 已推送 origin/main。Firebase CLI 部署 exit 0，三項 Successful update，專案 `virtualphotographystudio`、區域 `us-central1`。
- `comfyCloudSubmit`、`comfyCloudStatus`、`comfyCloudQuota` 部署後均為 ACTIVE／Node.js 24；三者 code hash 相較部署前已更新，Secret 設定保持一致。其餘六個 Functions 的 CLI metadata 與部署前完全相同。
- 未變更 runtime、依賴、Secret、Firestore rules 或 indexes。CLI 有 firebase-functions 可更新提示，本次保留已驗證版本。
- [GitHub Actions 39182091109](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/39182091109) 為功能提交觸發；紀錄當下 Functions quality 已通過，frontend quality 仍執行中，尚不能宣稱 Pages 發布完成。
- 真實 FLUX 生成、扣額、圖片下載與品質仍待另行驗收，本次沒有提交付費工作。

## Cloud 模型檔名修正（2026-10-24，本機完成／尚未部署）

- 使用者回報 `UNETLoader` 的 `unet_name` 發生 `value_not_in_list`。於已登入的 Comfy Cloud 模型庫搜尋 `flux3`，確認 Diffusion Models 下的 Base INT8 檔案為 `flux3-image-klein-base-int8-convrot.safetensors`；[模型資訊截圖](../reports/flux3-filename-2026-10-24/cloud-model.png)。舊工作流使用 `flux3_image_klein_base_int8_convrot.safetensors`。
- [BFL 官方改名紀錄 #27](https://huggingface.co/black-forest-labs/flux-3-image-klein-comfy/discussions/27) 及 [工作流更新 #31](https://huggingface.co/black-forest-labs/flux-3-image-klein-comfy/discussions/31) 支持連字號命名。官方 repository 保留某些底線別名，不代表 Cloud 模型清單同時提供；本次以帳號實際可見清單為準。
- 在乾淨 main 快轉至 `e700e9b` 後，只修改模板節點 `18:1` 的模型檔名；50 steps／CFG3.5／Euler／simple、編碼器／VAE、直接 Prompt、單 job 一張、尺寸、公開模型 keys 與 UI 皆不變。
- 先更新回歸斷言，確認舊模板失敗，再修正模板。Functions 106/106、Functions lint、前端模型映射／代理／共享契約／client 聚焦 45/45、diff-check 通過。額度測試確認新模板接受自身樣本，排除不同採樣設定及舊檔名樣本，不改寫歷史任務。
- 此為後端模板修正，沒有前端程式／UI 或共享請求契約變更；未重跑前端全套或瀏覽器版面驗收。Cloud 瀏覽器只讀取模型清單，未提交生成，未以此宣稱真實出圖、扣額或下載成功。
- 尚未 commit／push／部署。正式 DLL 生效需發布共用此模型定義的 `comfyCloudSubmit`、`comfyCloudWorkspaceSubmit`、`comfyCloudStatus`、`comfyCloudQuota` 四項 Functions；無需新增 Secret 或修改其他服務。

## 檔名修正正式部署（2026-10-24）

- 使用者另行授權「先 commit/push 到 main，再部署這四個 Firebase Functions」。修正提交 `66a47cef3bac968d427993919c9effc674c263a0` 已推送 origin/main。
- Firebase CLI 回報四項 Successful update 及 Deploy complete。台北 12:41 核對 Submit／WorkspaceSubmit／Status／Quota 全部 ACTIVE／Node24／us-central1，hash 均為 `2fc61486e7348616163d48621167dcfd28742316`。
- 部署前後僅 source、hash、labels 改變；Secret 綁定、應用環境及資源設定維持一致，其餘七項 Functions metadata 完全相同。[部署與健康檢查紀錄](../reports/flux3-filename-2026-10-24/deployment.json)。
- 四項匿名 POST 均回401／UNAUTHENTICATED，正式站 Origin 的 OPTIONS 均回204且 CORS 正確，共8項通過。未提交付費生成；實際模型生成、扣額與下載並非本次端點檢查的驗收結果。
- 本次為後端工作流修正，不需前端更新即可供正式 DLL 新生成請求使用。main 推送仍觸發既有 Pages CI；修正 [Actions 40063227474](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40063227474) 的 Functions quality 已通過，前端檢查於紀錄時尚在執行，完整 Pages 狀態以最新 Actions 為準。
