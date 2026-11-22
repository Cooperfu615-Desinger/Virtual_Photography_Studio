# 原生 Krea 2 Turbo：Krea 2 NSFW V5 LoRA

日期：2026-11-22。狀態：本機實作；尚未發布。

## 使用行為

- 模型選擇維持「Comfy Cloud · Krea 2 Turbo（原生）」，新增「套用 Krea 2 NSFW V5 LoRA」勾選開關；初始不套用。
- 首次啟用強度預設 1.0；範圍 0–1、間隔 0.05，沿用既有滑桿及數值輸入。使用者調整後記住該 LoRA 的強度；歷史沿用優先還原當次強度。
- 完整版放在進階設定；工作台快速面板沿用既有 LoRA 控制。
- 原生與套用版各使用獨立模型識別，套用版不重複列入模型下拉選單。僅支援原生 Krea 2 Turbo，不套用至 Krea 2 Medium／Medium Turbo／Large 合作夥伴節點。
- 保持 1K、既有六種比例、預設 1 張及可選 2 張；兩張依序取得圖片後再提交下一張。
- 保留 DLL Prompt 原文、關閉擴寫，不自動附加觸發詞。既有模型及其他 LoRA 不改動。

## 工作流與保存

基底 `functions/src/comfyWorkflows/krea2TurboNative.json` 不變；後端深拷貝建立 `krea2TurboNativeV5Lora`，新增節點 40 `LoraLoaderModelOnly`，串接 UNET `30:10` 至 sampler `30:3`。

固定使用已匯入並驗證的 `f23gg__Krea-2-NSFW-V5__Verite_realism.safetensors`。維持 8 steps、CFG 1、Euler／simple、denoise 1。關閉時使用原生工作流，不載入 LoRA。

前端識別 `comfyKrea2TurboNativeV5Lora`；強度儲存鍵 `dll_pic_pro_krea_v5_strength`。歷史快照保存模型識別與 `loraStrength`；沿用設定還原開關、強度、Prompt、比例、張數及 Seed。關閉版本的快照不攜帶強度。費用樣本按基底／LoRA／強度隔離，並核對上游工作流。

## 來源與驗證

- [作者模型](https://huggingface.co/f23gg/Krea-2-NSFW-V5)
- [獨立 Cloud A/B 測試](../reports/krea2-v5-lora-2026-11-22/README.md)：在 DLL 整合前完成的實際提交、圖片取回及扣額紀錄。
- [本次整合驗收](../reports/krea2-v5-integration-2026-11-22/README.md)：本機模擬，不代替正式版付費驗收。
- `kreaV5Replay` 僅對本次 DLL client 修改建立精確反向投影，與 H3／Seedream 的既有投影串接；不修改舊歷史封存資料。

發布需另行授權 commit/push 與部署 `comfyCloudSubmit`、`comfyCloudWorkspaceSubmit`、`comfyCloudStatus`、`comfyCloudQuota`；部署後才能在正式版使用新模型識別。
