# 動作庫：站姿 v1（草案）

- 狀態：**已實作**（2026-10-20）。第一批 9 個 accepted、第二批 11 個 pending；出圖實測延後到神情姿態改版完成後統一進行（§9）。測試包：[pose-library-standing-2026-10-20](../reports/pose-library-standing-2026-10-20/README.md)（第一批 `prompts.md`、第二批 `prompts-batch2.md`）。
- 上位規格：[神情姿態 v2](expression-pose-v2.md)（資料格式 §4、子句規則 §5、手部 §6、姿勢選單 §3.1）
- 參考圖：`Docs/站姿/`（Cooper 2026-10-20 放入；整理成動作見 §6）

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
3. 第二批 §6 的英文與新手勢 §7 的英文。

## 6. 第二批：參考圖動作（11 個，皆為 pending）

依 `Docs/站姿/` 的參考圖（Cooper 2026-10-20 放入）。決定（Cooper「照建議」）：手部照參考圖寫進動作（`hands.mode: fixed`），做法同坐姿、跪姿的參考圖動作；道具（包、瓶子）不寫；倚靠類與奔跑另列 §8。插口袋的動作需要穿搭有前口袋，隨機時比照「雙手插前口袋」手勢，只在確定有褲裝時抽到，手動選照樣寫（實作時新增動作層的穿搭條件）。

| 編號 | 中文名 | 參考圖 | 手部 |
| --- | --- | --- | --- |
| 6.1 | 雙手背後・單膝內扣 | `010c1243…jpg` | 固定 |
| 6.2 | 一手扶頭・跨步 | `1d7b9d04…jpg` | 固定 |
| 6.3 | 一手扶頭・一手插口袋 | `3e884f39…jpg` | 固定，需口袋 |
| 6.4 | 上身前傾・雙手插口袋・一腳前踏 | `5ba40b62…jpg` | 固定，需口袋 |
| 6.5 | 單腳站・側後抬腿・雙拳胸前 | `824cc953…jpg` | 固定 |
| 6.6 | 單腳站・前踢抬腿・一手舉高 | `c4ca8021…jpg` | 固定（瓶子不寫） |
| 6.7 | 雙手抱頭後・併腿內扣 | `cd7fb254…jpg` | 固定 |
| 6.8 | 單臂上舉・一手扶臂伸展 | `f512ed9b…jpg` | 固定 |
| 6.9 | 外八開腿・一手放胸前 | `images.jpeg` | 固定 |
| 6.10 | 單腳站・一手比耶・一手叉腰 | `v2-60d44e90…jpg` | 固定 |
| 6.11 | 雙手向上張開 | `v2-c5761de2…jpg` | 固定 |

### 6.1 雙手背後・單膝內扣

| region | join | en |
| --- | --- | --- |
| core | | `She stands with her weight on one straight leg` |
| upper | `, ` | `both hands clasped behind her back` |
| lower | `. ` | `Her other knee bends softly inward, its foot resting lightly beside the supporting foot` |

### 6.2 一手扶頭・跨步

| region | join | en |
| --- | --- | --- |
| core | | `She stands in a posed mid-stride` |
| upper | `, ` | `one hand resting on top of her head and the other arm hanging loosely at her side` |
| lower | `. ` | `Her front foot steps forward with the heel on the ground and the toes lifted, the back leg straight` |

### 6.3 一手扶頭・一手插口袋

| region | join | en |
| --- | --- | --- |
| core | | `She stands with her feet slightly apart` |
| upper | `, ` | `one hand raised to the side of her head and the other hand tucked into her front pocket` |
| lower | `. ` | `Her knees turn slightly inward` |

### 6.4 上身前傾・雙手插口袋・一腳前踏

| region | join | en |
| --- | --- | --- |
| core | | `She stands with her upper body leaning forward from the hips` |
| upper | `, ` | `both hands tucked into her front pockets` |
| lower | `. ` | `One foot steps forward ahead of the other, the back heel slightly lifted` |

### 6.5 單腳站・側後抬腿・雙拳胸前

| region | join | en |
| --- | --- | --- |
| core | | `She stands on one leg in a playful pose` |
| upper | `, ` | `both hands curled into loose fists in front of her chest` |
| lower | `. ` | `Her other leg kicks out to the side with the knee bent and the foot raised well off the ground` |

### 6.6 單腳站・前踢抬腿・一手舉高

| region | join | en |
| --- | --- | --- |
| core | | `She stands on one leg in a playful pose` |
| upper | `, ` | `one hand raised beside her head with the index finger pointing up and the other arm swinging back` |
| lower | `. ` | `Her other leg kicks forward and up, the foot raised to hip height` |

### 6.7 雙手抱頭後・併腿內扣

| region | join | en |
| --- | --- | --- |
| core | | `She stands with her feet close together` |
| upper | `, ` | `both hands raised to the back of her head, her elbows spread out to the sides` |
| lower | `. ` | `Her knees turn slightly inward` |

### 6.8 單臂上舉・一手扶臂伸展

| region | join | en |
| --- | --- | --- |
| core | | `She stands with her feet planted shoulder-width apart` |
| upper | `, ` | `one arm stretched straight overhead and the other arm bent with its hand holding the raised arm near the elbow` |

### 6.9 外八開腿・一手放胸前

| region | join | en |
| --- | --- | --- |
| core | | `She stands with her feet set wide apart and her toes turned outward` |
| upper | `, ` | `one hand resting on her chest and the other arm hanging straight at her side` |

### 6.10 單腳站・一手比耶・一手叉腰

| region | join | en |
| --- | --- | --- |
| core | | `She stands on one leg` |
| upper | `, ` | `one arm raised straight overhead making a V sign and the other hand resting on her waist` |
| lower | `. ` | `Her other leg bends at the knee, lifted in front of the supporting leg with the foot tucked back` |

### 6.11 雙手向上張開

| region | join | en |
| --- | --- | --- |
| core | | `She stands with her legs straight and one knee softly bent` |
| upper | `, ` | `both arms raised overhead and spread wide in a V, palms open` |

## 7. 新增通用手勢（4 句，草稿）

給手空著的站姿（第一批 3.1–3.9）搭配，範圍同既有通用 4 句（`scope: general`）。實作後通用手勢共 8 句。

| 手勢 | 英文草稿 |
| --- | --- |
| 一手扶頭 | `one hand resting on top of her head` |
| 雙手抱頭後 | `both hands raised to the back of her head, elbows spread out` |
| 雙手背後 | `both hands clasped behind her back` |
| 雙臂上舉 | `both arms raised overhead` |

## 8. 暫不做成動作的參考圖

| 參考圖 | 內容 | 去處 |
| --- | --- | --- |
| `01b5dc61…jpg` | 側靠牆，雙手插外套口袋，腳踝交叉 | 倚靠類（場景提供牆面後） |
| `8492c9cc…jpg` | 背靠牆，雙手插口袋，雙腿打開 | 倚靠類 |
| `HTM0NdPbwAAtv4F.jpeg` | 奔跑中 | 不屬站姿，留給之後的動態類 |

## 9. 實作紀錄（2026-10-20）

**決定**（Cooper「照建議」）：出圖實測延後到神情姿態改版完成後統一進行。理由：第一批 3.1、3.2 的 Nano Banana 2.1 實測（`Docs/站姿/3.1_*`、`3.2_*`，四種 Prompt 都在 Nano 上跑）結果可接受，3.1 與 3.2 差異小，屬預期（兩者是最細微的姿勢）。在統一實測前：

- 第一批 9 個標 `accepted`，加入「隨機」：英文來自舊自由組合、已在正式版用過，風險低。
- 第二批 11 個標 `pending`：可手動選，不進「隨機」。
- 新 4 句手勢可手動選，不進手勢「隨機」（`meta.randomEligible: false`）。

**程式**
- `webapp/src/lib/engine/specifiedActions.js`：新增 20 個 `specified-standing-*`（family `standing`、baseId `standing`），附在清單最後，既有順序不變；第一批 `hands.mode: free`，第二批 `fixed`。插口袋的 6.3、6.4 帶 `meta.requiresWardrobeRole: 'pants'`，隨機池一律排除（隨機穿搭在抽動作時尚未解析，無法確認有口袋；兩者目前也是 pending）。
- `webapp/src/lib/engine/gazeGesture.js`：通用手勢由 4 句增為 8 句；手勢隨機排除 `randomEligible: false`。
- 隨機池由 9 個增為 18 個；選擇器顯示「選擇 34 組指定動作」。
- 回歸測試：`gazeGesture.test.js` 新增站姿 3 項；更新動作數量（34）、隨機池（18）、手勢數量（17）。
- 新增 `scripts/dump_prompt_outputs.mjs`：固定 seed 的輸出快照與比對工具（取代過去只放在暫存區的腳本）。

**驗證**（與 main @ 6004401 比對）
- 代表性 104、預設隨機 200、既有動作×景別 308：逐字相同（含快照與摘要）。
- 全部隨機 150 組：140 組改變，全部是抽到不同的動作（89 組抽到第一批站姿並附隨機手勢）；抽到的手勢只有雙手輕握於髖前、一手放鎖骨、撥頭髮到耳後，新 4 句與需要褲裝的口袋手勢沒有被抽到；pending 動作沒有被抽到。
- 同 seed strict audit 與 main 相同；`npm test` 1747/1747（連跑 2 次；加介面文字測試後 1748/1748）、Prompt Quality 745/745、lint、build、sync、Python、公開資產、diff-check。
- 瀏覽器 1440×1000／390×900：選擇器 34 組、站姿分類列出 21 個；自然站姿出現手勢欄（8 句）、選「雙手背後」後 5 個輸出寫入；第二批「單腳站・側後抬腿・雙拳胸前」不出現手勢欄、5 個輸出寫入；五個工作區無溢出、無破圖、無主控台錯誤。

**介面文字（Cooper 2026-10-20「照建議」）**
- 選擇器的 pending 動作加「未驗收」小標（黃色提示色）。
- 「隨機」說明改為「每次生成時，從已驗收的指定動作中隨機抽一個；躺姿只在鎖定的場景可以躺時才會抽到，未驗收的動作不會抽到。」（原文「躺姿待場景表面完成後加入」在 P3 後已過時；`poseMenuV2.test.js` 有回歸測試）。
- 分類「站立動態」改名為「站姿」。
- 驗證：Prompt 輸出與改前逐字相同；瀏覽器 1440×1000／390×900 站姿分類 21 個、11 個「未驗收」小標都在卡片內、無溢出、無主控台錯誤。
