# 動作庫：蹲姿 v1

- 狀態：**已實作**（2026-10-21，§6）。來源沿用現行蹲姿目錄 v2（[squatting-catalog-v2.md](squatting-catalog-v2.md)）與蹲姿手部 v2（[squatting-hands-v2.md](squatting-hands-v2.md)），兩者 2026-10-17 已由 Cooper 確認。
- 上位規格：[神情姿態 v2](expression-pose-v2.md)；站姿做法見 [pose-library-standing-v1.md](pose-library-standing-v1.md)。
- Cooper 2026-10-21：現有蹲姿是調整過的版本，直接沿用；請檢查寫法有沒有可以優化的地方。

## 1. 結構建議

| 現行（舊自由組合） | 新版 | 理由 |
| --- | --- | --- |
| 4 組公開蹲姿（姿勢基底＋肢體變化） | 4 個指定動作，`accepted`，加入「隨機」，手空著（`hands.mode: free`） | 已確認的版本，比照站姿第一批 |
| 7 組蹲姿專屬手部（手部動作，只在蹲姿出現） | 7 句**蹲姿專屬手勢**（`scope: squatting`），在手勢欄出現，比照躺姿的方向專屬手勢 | 手部本來就和身體分開、可自由搭配（v2 文件：四組蹲姿皆可組合） |
| 通用手勢 8 句 | 蹲姿**不**套用 | 通用手勢是為站姿寫的（插口袋、雙手背後、雙臂上舉在蹲姿下不自然） |
| 退役的 10 組蹲姿、1 組碰嘴角手部 | 不轉成動作 | 已退出公開與隨機 |

裁切沿用已核准的規則：自然、收攏、前傾在中景與胸上只保留上身片段（不寫蹲、膝、臀、腳跟）；寬膝在中景與胸上省略；手勢在中景用已核准的上身片段、胸上省略。

## 2. 4 個動作（英文沿用，只補成完整句、切子句）

句首用 `She holds a … low squat`，保留原本的形容詞（relaxed、compact、forward-leaning、wide-knee）。`upperBodyEn` 是中景與胸上用的句子，來自已核准的投影片段。

### 2.1 自然蹲姿（`squatting-natural`）

| region | join | en |
| --- | --- | --- |
| core | | `She holds a relaxed low squat with comfortably bent knees, her hips lowered near her heels and clear of the ground` |
| lower | `, ` | `her feet comfortably spaced and her heels resting down or lightly lifted for balance` |
| upper | `. ` | `Her torso inclines gently forward with relaxed shoulders` |

中景／胸上：`Her upper body leans gently forward with relaxed shoulders.`

### 2.2 收攏低蹲姿（`squatting-side`）

| region | join | en |
| --- | --- | --- |
| core | | `She holds a compact low squat with her knees and feet close together, her thighs folded close to her calves and her hips sunk near her heels, clear of the ground` |
| lower | `, ` | `her heels resting down or lightly lifted for balance` |
| upper | `. ` | `Her torso inclines gently toward her thighs with relaxed shoulders` |

中景／胸上：`Her upper body is softly gathered with a gentle forward lean and relaxed shoulders.`

### 2.3 身體前傾蹲姿（`squatting-forward-lean`）

| region | join | en |
| --- | --- | --- |
| core | | `She holds a relaxed forward-leaning low squat with her knees comfortably apart, her hips lowered near her heels and clear of the ground` |
| lower | `, ` | `her heels resting down or lightly lifted for balance` |
| upper | `. ` | `Her torso inclines gently from the hips toward her thighs, her shoulders and neck relaxed` |

中景／胸上：`Her upper body leans gently forward from the hips with relaxed shoulders and neck.`

### 2.4 寬膝低蹲姿（`squatting-gangster-wide-knee`）

| region | join | en |
| --- | --- | --- |
| core | | `She holds a relaxed wide-knee low squat with her knees opened outward and her hips sunk low between her legs, clear of the ground` |
| lower | `, ` | `her feet moderately apart with the toes turned outward in line with the knees and her heels resting down or lightly lifted for balance` |
| upper | `. ` | `Her torso inclines gently forward` |

中景／胸上：照現行省略（見 §4 O6）。

## 3. 7 句蹲姿專屬手勢（現行英文）

| 手勢 | 全身英文（現行） | 中景片段（現行） |
| --- | --- | --- |
| 雙肘靠膝自然垂手 | both elbows or proximal forearms resting lightly on the same-side thighs near the knees, forearms falling naturally forward and downward beyond the knees, with loose wrists, relaxed fingers and lowered shoulders | both forearms angled naturally downward with relaxed hands and lowered shoulders |
| 雙手沿腿側自然下垂 | both arms hanging naturally along the outer sides of the legs with softly bent elbows, hands relaxed beside the lower shins or outer ankles, loose wrists and fingers, and lowered shoulders | both arms relaxed along the sides of the body with softly bent elbows and lowered shoulders |
| 單手托腮一手自然垂落 | one elbow resting lightly on the same-side thigh near the knee with the raised palm gently cradling the cheek, the other elbow or proximal forearm resting near the opposite knee with that forearm falling forward and downward, its wrist and fingers relaxed, and both shoulders lowered | one raised palm gently cradling the cheek, the other forearm angled downward with a relaxed hand, and both shoulders lowered |
| 雙手托腮 | both elbows resting lightly on the same-side thighs near the knees, forearms raised with both palms gently cradling the cheeks, fingers relaxed along the cheeks and jaw, and shoulders naturally lowered | both palms gently cradling the cheeks with fingers relaxed along the cheeks and jaw and shoulders naturally lowered |
| 單手在臉旁比 V | one elbow resting lightly on the same-side thigh near the knee with the raised hand forming a relaxed V sign beside the cheek and clear of the eyes, the other elbow or proximal forearm resting near the opposite knee with that forearm falling forward and downward, its wrist and fingers relaxed, and both shoulders lowered | one raised hand forming a relaxed V sign beside the cheek and clear of the eyes, the other forearm angled downward with a relaxed hand, and both shoulders lowered |
| 雙臂搭膝外展垂手 | both arms spreading naturally to the sides with softly bent elbows, each distal forearm near the wrist resting lightly across the same-side knee, hands hanging beyond the outer knee edges with loose wrists and fingers, and shoulders relaxed | both arms spreading naturally to the sides with softly bent elbows, loose wrists and fingers, and shoulders relaxed |
| 雙肘靠膝中央垂手 | both elbows or proximal forearms resting lightly on the same-side thighs near the knees, forearms slanting inward and downward between the knees, hands hanging loosely near each other at the center in front of the body with fingers pointing down, and shoulders relaxed | both forearms slanting inward and downward, hands relaxed near each other in front of the body, and shoulders relaxed |

## 4. 寫法優化建議

| # | 問題 | 建議 | 影響 |
| --- | --- | --- | --- |
| O1 | 現行是名詞片語（`relaxed low squat with …`），不符合指定動作的完整句格式 | 補成 `She holds a … low squat …`，切 core／lower／upper（§2） | **必要**；不新增視覺事實 |
| O2 | 身體（`relaxed shoulders`）和手勢（`lowered shoulders`、`shoulders relaxed`）都寫肩膀，組合後同一段出現兩次肩膀描述 | 刪除手勢與中景片段裡的肩膀描述，肩膀由身體負責 | 建議；7 句手勢全句＋7 句中景片段都有 |
| O3 | 解剖用語 `proximal forearms`（4 句：雙肘靠膝自然垂手、單手托腮一手自然垂落、單手在臉旁比 V、雙肘靠膝中央垂手）、`distal forearm near the wrist`（1 句：雙臂搭膝外展垂手），模型較難理解 | `elbows or proximal forearms` → `elbows`；`each distal forearm near the wrist` → `each forearm near the wrist` | 建議；5 句 |
| O4 | `same-side`（同側）在 6 句出現（雙手沿腿側自然下垂以外的全部），偏書面且重複 | `the same-side thighs near the knees` → `her thighs near the knees`；`the same-side knee` → `the knee on that side` | 建議；6 句 |
| O5 | 4 個動作都寫 `heels resting down or lightly lifted for balance`，「或」讓模型自己選 | **保留**：腳跟可落地或輕抬是 2026-10-17 的決定 | 不改 |
| O6 | 寬膝在中景與胸上照現行省略；但指定動作在中景一律輸出上身句，沒有「省略」的選項 | 二選一：(a) 寬膝中景／胸上改寫 `Her upper body leans gently forward.`（新增一句，事實來自全身句）；(b) 程式支援動作在中景省略，維持現行 | 需決定 |
| O7 | 自然蹲姿與身體前傾蹲姿的文字差異小（膝距、前傾方向） | **保留**：2026-10-17 已拒絕誇大前傾版本 | 不改 |

套用 O2–O4 後的手勢範例（雙肘靠膝自然垂手）：
`both elbows resting lightly on her thighs near the knees, forearms falling naturally forward and downward beyond the knees, with loose wrists and relaxed fingers`（英文字數 31 → 25，事實不變）

## 5. 待決（Cooper）

1. §1 結構：4 個動作＋7 句蹲姿專屬手勢，蹲姿不套用通用手勢。
2. §4 O2、O3、O4 是否採用。
3. §4 O6 選 (a) 或 (b)。
4. 驗收：比照站姿第一批，視為 `accepted` 直接加入「隨機」，實測延後到改版完成後統一進行。

## 6. 決定與實作紀錄（2026-10-21）

**決定**（Cooper「照建議，O6 選 (b)」）：§1 結構照建議；採用 O2、O3、O4；O6 選 (b)，程式支援動作在中景與胸上省略；4 個動作視為 `accepted` 加入「隨機」，出圖實測延後到改版完成後統一進行。

**程式**
- `specifiedActions.js`：新增 `specified-squatting-natural／compact／forward-lean／wide-knee`（family `squatting`、手空著）。中景與胸上使用 §2 的上身句；寬膝帶 `meta.upperBodyOmitted`，中景與胸上不寫動作句（視線、手勢照常）。
- `gazeGesture.js`：7 句 `gesture-squat-*`（`scope: squatting`），套用 O2–O4；每句帶已核准的中景片段（刪除肩膀描述），胸上省略。蹲姿只配這 7 句，站姿等仍用通用手勢。托腮兩句與比 V 標 `requiresFaceVisibility`，背面機位時手勢隨機不抽。`actionTextWithGesture` 支援手勢的中景片段、胸上省略與動作省略上身句；既有手勢與動作的輸出不變。
- 選擇器新增「蹲姿」分類（放在「站姿」後）；手勢欄在保留的手勢不適用目前姿勢時，顯示「目前的姿勢不適用這個手勢，暫不寫入；換回適用的姿勢後恢復。」（比照視線欄）。
- 隨機池 18 → 22；手勢選項 17 → 24。舊自由組合的蹲姿與蹲姿手部（P5b 延後）不動。

**驗證**（與 main @ 24b419b 比對，`scripts/dump_prompt_outputs.mjs`）
- 代表性、預設隨機、既有動作×景別：逐字相同。
- 全部隨機 150 組：134 組改變，全部是抽到不同動作（37 組抽到蹲姿）；7 句蹲姿手勢都被抽到過，臉部手勢 10 組都不在背面機位。
- 同 seed strict audit 與 main 相同；`npm test` 1752/1752（連跑 2 次）、Prompt Quality 745/745、lint、build、sync、Python、公開資產、diff-check。
- 瀏覽器 1440×1000／390×900：選擇器 38 組、蹲姿分類 4 個；自然蹲姿＋雙臂搭膝外展垂手寫入 4 個主輸出、胸上省略；不適用的保留手勢顯示提示；五個工作區無溢出、無破圖、無主控台錯誤。
- 回歸測試：`gazeGesture.test.js` 新增蹲姿 4 項（手勢範圍與用字、裁切、寬膝省略、背面不抽臉部手勢）。

