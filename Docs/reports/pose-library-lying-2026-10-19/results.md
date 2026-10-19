# 躺姿第一批：結果

- 日期：2026-10-19
- 圖片：`Docs/參考/` 22 張
  - Z-Image：6 組各 1 張（`Z_{組}.png`）
  - GPT Image：用 G／Z／M／N 四種版本的 Prompt 各跑 4.1、4.2 四組，共 16 張（`G_{組}_{版本}.png`）
  - 沒有 Midjourney、Nano Banana 的原生輸出；4.3 沒有 GPT 圖
- 評分：fresh-context 評審逐張評分（含手腳放大），主對話以每組拼圖對照，判斷一致。Cooper 目視：方向沒問題、品質穩定。

## 1. 彙整

| 動作 | 張數 | 幾何平均 | 機位平均 | 畸形 |
| --- | --- | --- | --- | --- |
| 4.1 側躺・臉靠枕頭 | 10 | 1.9 | 1.5 | 0 |
| 4.2 趴躺・腳踝交叉翹起 | 10 | 1.8 | 1.5 | 0 |
| 4.3 趴躺・單腿屈起 | 2（只有 Z） | 0.0 | 2.0 | 0 |

| 模型 | 張數 | 幾何 | 機位 |
| --- | --- | --- | --- |
| GPT Image | 16 | 1.94 | 1.69 |
| Z-Image | 6 | 1.0（4.1＝1.5、4.2＝1.5、4.3＝0） | 1.17 |

GPT 吃四種版本的 Prompt，差異很小（幾何 1.75–2.0）。

## 2. 發現

1. **4.1、4.2 在 GPT 與 Z-Image 都達到「幾何 ≥ 1.5、畸形 ≤ 1」**；Z-Image 剛好壓線。
2. **4.3 在 Z-Image 失敗（0／2）**：兩張都畫成仰躺或側靠、一膝立起。可能是 `upper body raised` 加 `lower leg nearly upright` 被讀成仰式立膝。需要改寫。
3. **機位**
   - 俯拍最穩（1.83）。
   - 從頭頂方向拍趴躺：GPT 4／4 成功（臉在前景、身體往後延伸到交叉的腳）；Z-Image 0／1，退回側面高角度。
   - 斜俯：GPT 有 3／4 張畫成「頭前方 3/4 高角度」，和頭頂構圖幾乎一樣，`beside her` 沒有生效。
   - 平視：兩張畫成高角度，兩張都用 Z 版 Prompt（Z-Image 本身與 GPT 吃 Z 版），原因未驗證。
4. **Z-Image 其他問題**：6 張中 5 張把腳切出畫面；4.1 有兩張出現「胸朝鏡頭、骨盆翻向後」的過度扭轉。
5. **與動作無關**：GPT 有兩張把 crew-neck 畫成深 V 圓領；GPT 的 4.1 俯拍牛仔布出現壓花。

## 3. 驗收狀態

原 [README](README.md) 規則需要四個模型中至少三個通過；本輪只有兩個模型的實際輸出。

**Cooper 2026-10-19 決定（方案丙）：驗收改為 Cooper 目視確認，評分作為參考；先完成整個機制與功能，再回頭修正 Prompt。**

| 動作 | 狀態 |
| --- | --- |
| 4.1 側躺・臉靠枕頭 | `accepted`（Cooper 目視） |
| 4.2 趴躺・腳踝交叉翹起 | `accepted`（Cooper 目視） |
| 4.3 趴躺・單腿屈起 | `pending`：Z-Image 畫成仰躺，待改寫重測 |

## 4. 之後回頭修正的項目

1. 4.3 改寫：`She lies face down on her stomach with her upper body raised, propped on her forearms with her hands resting on the surface in front of her. One leg stretches straight back along the surface while the other knee stays on the surface and bends so that its lower leg points up toward the ceiling behind her`
2. 斜俯機位改寫：`shot from her side at a high angle, the camera level with her waist and looking down across her body`
3. 躺姿全身加完整入鏡：`her whole body from head to feet within the frame`（Z-Image 6 張中 5 張切腳）
4. Z-Image 的「從頭頂方向」機位沒生效；平視被畫成高角度的原因未查。

## 5. 信心限制

每個條件只有 1 張圖；Z-Image 每個動作 2 張；4.3 沒有 GPT 樣本；MJ、Nano 沒有原生輸出。以上平均只能當方向參考。
