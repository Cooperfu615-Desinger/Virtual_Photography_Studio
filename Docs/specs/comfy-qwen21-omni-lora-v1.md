# DLL：Qwen Image 2.1 Omni LoRA

本文件記錄 2026-11-02 的本機實作與驗證；提交、發布與部署狀態以實際交付紀錄為準。

## 範圍與契約

- 在 Qwen Image 2.1 現有進階設定與快速生圖面板增加 Omni LoRA 選項；預設不套用，與既有 v1.3b 互斥。Omni 強度預設 1、範圍 0–1、間距 0.05；兩種 LoRA 分別儲存強度。保留 Qwen 主模型、舊變體識別、任務快照及歷史還原。
- 新增固定 variant `qwenImage21OmniLora`，僅在伺服端將既有 Qwen 圖形中的擴散模型接至 `LoraLoaderModelOnly` 再接快取。固定檔名 `chatrlabs__Qwen-Image-21-Uncensored-Omni-LoRA-v01__chatrlabs-omni-lora-v0.1-bf16.safetensors`；不接受前端任意檔名或工作流。採樣、Prompt、尺寸、比例及逐張生成維持現狀。
- 草稿、待生成任務、歷史、續查及額度估算以 modelKey 和強度區分。既有 v1.3b 存儲鍵保持不變，Omni 使用獨立鍵。
- 保留 C2 歷史回放原始及既有哈希，另外允許本次變更的兩份 DLL 原始碼精確哈希；僅於隔離副本還原歷史版本，未知輸入仍拒絕。

## 先前雲端觀察與限制

- 使用者在 Comfy Cloud 匯入公開 Omni 權重，測試副本以相同 Prompt、seed 246810、1024 × 1024、25 steps、Euler、CFG 1，各提交一張強度 0 與 1，兩次皆完成且畫面可見差異。該觀察不證明所有 LoRA 權重均已完整匹配，也不代表 DLL API 已實測；其他 prompt、解析度、帳戶權限及費用仍待各自驗證。
- 作者釋出的權重為 Diffusers／PEFT，採 Qwen Research License；模型卡將其使用限定為非商業研究及評估，另行授權除外。
