# DLL：FLUX 3 Image Klein Base INT8 v1

日期：2026-10-19。使用者核准實作與發布；功能提交 `2323bf8c0d6ebab8813511e098bd9566658ad208` 已推送 origin/main，三個 Functions 已部署。未實際付費生成。

## 模型與工作流

來源為使用者匯出的 `/Users/cooperfu/Downloads/image_flux3_klein_t2i.json`（原檔保留）。DLL 名稱 `Comfy Cloud · FLUX 3 Image Klein Base INT8`，前端 key `comfyFlux3KleinBaseInt8`，後端 key `flux3KleinBaseInt8`。沿用共享 contract、自動選單與既有 Comfy submit/status/download 路徑。

- 固定 `flux3_image_klein_base_int8_convrot.safetensors`、`qwen3vl_4b_int8_convrot.safetensors`、`flux2-vae.safetensors`。
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
