# 手部寫法實驗（神情姿態 v2 定案前關卡）

- 日期：2026-10-17
- 目的：比較三種手部寫法在四個模型上的「自然度、多樣性、出錯率」，並檢查新句型（先寫姿勢、再用 `with` 帶出手部）是否比目前的拼接句自然。結果決定 [神情姿態 v2](../../specs/expression-pose-v2.md) 的手部模式與句型。
- 測試 prompt：[prompts.md](prompts.md)，由 `tools/build_pack.mjs` 從實際引擎輸出產生，在 `webapp/` 目錄以 `node <路徑>/build_pack.mjs` 執行。

## 共同設定

自然站姿、全身、平視、正面、莫蘭迪灰背景、柔霧美妝攝影棚、柔和微笑、落肩 T 恤＋直筒牛仔褲；其餘欄位全無。除了姿勢句之外，所有條件的其他文字逐字相同，比較時只有手部寫法一個變因。

## 條件

| 代號 | 姿勢句 |
| --- | --- |
| A0 | 目前引擎原樣：`She has one hand on the waist or hip line with the other hand relaxed along the body or nearby support surface, and presents a relaxed neutral standing posture.` |
| A | 新句型＋固定手勢：`She presents a relaxed neutral standing posture, with one hand resting on her waist and the other hand relaxed at her side.` |
| B | 新句型＋交給模型：`…, with her hands posed naturally in a relaxed, unforced way of her own choosing.` |
| C1–C4 | 新句型＋程式抽選：撥頭髮到耳後、雙手輕握於髖前、一手放鎖骨、雙拇指勾牛仔褲前口袋 |

## 執行方式

| 模型 | 每個條件的張數 | 備註 |
| --- | --- | --- |
| GPT Image | 4 張 | 沒有 seed，分 4 次生成 |
| Z-Image Turbo（Comfy Cloud） | 4 張 | seed 固定為 1、2、3、4，各條件使用同一組 seed |
| Midjourney | 4 張（一組四宮格） | 尾綴照 prompt 原樣 |
| Nano Banana 2.1 | 4 張 | 沒有 seed，分 4 次生成 |

總量約 4 模型 × 7 條件 × 4 張 = 112 張。若要節省額度，可先只跑 A0、A、B、C1 四個條件（64 張）。

## 評分表（每個條件 × 模型填一列）

| 模型 | 條件 | 手部自然（0–2） | 姿勢符合描述（0–2） | 手部畸形或多指（張數） | 4 張中手勢相異的數量（B 專用） | 備註 |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

評分說明：
- **手部自然**：0 僵硬或怪異、1 可接受、2 自然。
- **姿勢符合描述**：0 不符、1 部分符合、2 符合。
- **手勢相異數量**：只對 B 計算，4 張中有幾種明顯不同的手勢，用來判斷「交給模型」是否真的會變化。

## 判讀規則（定案用）

1. 若 **A 的分數不低於 A0**，新句型成立，所有姿勢改用「先姿勢、後 `with` 手部」。
2. 若 **B 在某模型的手勢相異數 ≥ 3 且手部自然 ≥ 1**，該模型預設使用「交給模型」；否則預設使用「程式抽選」。
3. **C1–C4 中出錯率高的手勢**（畸形或多指 ≥ 2 張）不放進通用手勢池。
