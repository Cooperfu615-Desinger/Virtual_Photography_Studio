# DLL：Z-Image-Turbo Radiance LoRA v2.0

## 範圍與行為

- 在 Z-Image-Turbo BF16 的快速面板及 DLL_PIC Pro 進階設定增加 Radiance LoRA；預設不套用。Asian Mix LoKr 與 Radiance 擇一，切換時分別保存強度，不堆疊權重。INT8 與其他模型行為不變。
- Radiance 強度預設 1，範圍 0–1、步進 0.05；快速設定使用獨立 key `dll_pic_pro_z_radiance_strength`，沿用原 Asian Mix key。空值及不合法數值不可提交。
- 增加固定 variant `zImageTurboRadiance`，由既有 BF16 工作流派生，在 UNET 和 AuraFlow 之間新增 `LoraLoaderModelOnly`。不改採樣、Prompt、解析度、張數或歷史資料。任務快照、歷史還原與額度估算使用各自 variant 和強度。
- 固定 Cloud 檔名 `AIImageStudio__RadianceChromeVoluptuous_z_image_turbo_v20__RadianceChromeVoluptuous_z-image_turbo_v2.0.safetensors`；客戶端不可指定任意模型檔名或圖形。
- C2 歷史測試的隔離回放只增加本次前端兩檔的精確 hash，保留既有基準並繼續拒絕未知來源。

## Cloud 測試證據與限制

2026-11-02 已將 [作者 v2.0](https://huggingface.co/AIImageStudio/RadianceChromeVoluptuous_z_image_turbo_v2.0) 匯入使用者 Comfy Cloud，使用 Z-Image-Turbo BF16、同一成人著衣人像 Prompt、seed 42、1024×1024、8 steps、CFG 1、res_multistep/simple，各生成一張不套用及強度 1；兩張成功且畫面有差異。GUI 測試使用空白 negative prompt，而 DLL 以 conditioning 歸零，因此不視為逐位元相同；作者建議的採樣組合也不同。本測試不證明所有權重匹配、任何尺寸或 DLL API 與扣額、下載皆已實測。

## 驗證邊界

局部測試覆蓋固定模型、強度上下界、錯誤值在 claim 前拒絕、工作流其他節點保持不變、額度依變體與強度分桶、快照與兩張依序提交。新增版本正式可用需要另行經使用者授權提交、推送及部署 `comfyCloudSubmit`、`comfyCloudWorkspaceSubmit`、`comfyCloudStatus` 和 `comfyCloudQuota`；真實 DLL 生成仍需獨立驗收。
