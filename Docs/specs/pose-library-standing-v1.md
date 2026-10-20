# 動作庫：站姿 v1（草案）

- 狀態：**草案**，待出圖驗收（Cooper 目視確認）。測試包：[pose-library-standing-2026-10-20](../reports/pose-library-standing-2026-10-20/README.md)。
- 上位規格：[神情姿態 v2](expression-pose-v2.md)（資料格式 §4、子句規則 §5、手部 §6、姿勢選單 §3.1）
- 參考圖：`Docs/動作庫參考/站姿/`（目前尚無；有圖後另外新增動作）

## 1. 已確定（Cooper 2026-10-20「照建議」）

| 項目 | 決定 |
| --- | --- |
| 第一批來源 | 舊自由組合的 9 個公開站姿變化改成指定動作：英文沿用已審核的描述，只切成部位子句、補成完整句；參考圖另外新增 |
| 分類 | 正面、側身、背對（含回眸）；倚靠類（靠牆、靠欄杆）第一批不做，之後比照躺姿表面由場景提供可倚靠物 |
| 手部 | 大部分手空著（`hands.mode: free`），可搭配通用 4 句手勢；少數動作才用專屬手部 |
| 機位 | 沿用一般俯仰角度與環繞角度，不另做站姿專屬機位；背對類與視線、環繞的相容沿用現有規則 |
| 驗收 | 草稿→Cooper 測圖目視確認→`accepted` 後加入「隨機」；第一批附測試 Prompt |

## 2. 改寫原則

- 句首一律 `She stands …`，核心子句（core）放姿勢本體與全身重心，下身子句（lower）放腿腳；中景與胸上只保留 core＋upper（v2 §5.2）。
- 原文只補主詞、動詞與連接詞，不新增視覺事實。例外見 2.8。
- 手部都不寫：手空著，由手勢欄決定；沒選手勢時不寫手部。
- 舊自由組合在中景、胸上另有投影句（例如自然站姿的 `a relaxed upright posture`）；新版改由子句裁切產生，胸上可能和舊投影句不同，以出圖結果判斷。

## 3. 第一批動作草稿（9 個，皆為 pending）

格式依 v2 §4。`join` 是接在前一子句後面的連接字串。

### 3.1 自然站姿（正面）｜來源 `standing-natural`

| region | join | en |
| --- | --- | --- |
| core | | `She stands in a relaxed neutral posture` |

### 3.2 單腳重心（正面）｜來源 `standing-one-leg-weight`

| region | join | en |
| --- | --- | --- |
| core | | `She stands in a relaxed posture with her weight shifted onto one leg and a natural asymmetrical balance` |

重心是全身動作，放在 core，中景也保留。

### 3.3 交叉腿站姿（正面）｜來源 `standing-crossed-legs`

| region | join | en |
| --- | --- | --- |
| core | | `She stands with one hip subtly shifted` |
| lower | `, ` | `her legs naturally crossed` |

### 3.4 側身窄站姿（側身）｜來源 `standing-narrow-side`

| region | join | en |
| --- | --- | --- |
| core | | `She stands in a narrow side-facing posture with a clean elongated body line` |
| lower | `, ` | `her feet close together` |

### 3.5 併腿微屈站姿（正面）｜來源 `standing-feet-together-soft-knees`

| region | join | en |
| --- | --- | --- |
| core | | `She stands with her hips shifted slightly to one side and her torso following a gentle lateral curve` |
| lower | `. ` | `Her feet are close together and her knees softly bent` |

### 3.6 開腿偏重心站姿（正面）｜來源 `standing-wide-weight-shift`

| region | join | en |
| --- | --- | --- |
| core | | `She stands with most of her weight settled onto one leg, her hips held at standing height` |
| lower | `. ` | `Her feet are set apart with the toes angled slightly outward, the other leg extending to the side` |

### 3.7 單腳屈膝抬腿站姿（正面）｜來源 `standing-bent-leg-lift`

| region | join | en |
| --- | --- | --- |
| core | | `She stands on one leg` |
| lower | `, ` | `the free leg lifted and bent at the knee, crossing slightly in front of the supporting leg, with the lower leg folded back and the foot raised off the ground` |

### 3.8 上身前傾探身站姿（正面）｜來源 `standing-forward-lean`（**需改寫**）

原文 `…leaning markedly forward from the hips toward the camera, bringing the face and shoulders closer to the lens…` 提到相機，違反「姿勢子句不寫臉、視線、相機」（v2 §5.3，`specifiedActionsV2Data.test.js` 有檢查）。改寫為：

| region | join | en |
| --- | --- | --- |
| core | | `She stands with her upper body leaning markedly forward from the hips` |
| upper | `, ` | `her face and shoulders brought ahead of her waist and hips` |

「朝向鏡頭」改由環繞角度（正面）表達。中文名從「向鏡頭探身站姿」改為「上身前傾探身站姿」。改寫與新名稱 Cooper 2026-10-20 確認。

### 3.9 骨盆後推曲線站姿（正面）｜來源 `standing-pelvis-back-curve`

| region | join | en |
| --- | --- | --- |
| core | | `She stands with her pelvis shifted distinctly backward, her hips projecting behind her torso and a smooth pronounced curve running through her lower back into her buttocks` |
| upper | `, ` | `her upper torso only slightly inclined forward` |

### 3.10 背對類

舊組合沒有公開的背對站姿（`standing-back-facing-turn` 已隱藏，且原文寫到相機）。等參考圖再新增。

## 4. 手勢（通用 4 句，P4 已實作）

站姿動作手空著時可搭配：雙手輕握於髖前、一手放鎖骨、撥頭髮到耳後、雙手插前口袋（需要有前口袋的褲裝）。手勢接在最後一個上身子句後，例如 `She stands in a relaxed neutral posture, both hands slipped into her front pockets.` 測試包另含 4 組手勢搭配。

## 5. 待決

1. 出圖後，哪些動作 `accepted`、哪些要改寫。
2. 背對類動作：等參考圖。
