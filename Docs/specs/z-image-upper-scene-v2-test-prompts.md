# Z-Image 第二版：低機位上方場景 A／B 實測包

日期：2026-09-13

狀態：**使用者已完成六組腰部高度＋中景實測，前四組採 B、後兩組維持 A／現狀。** 前四組已依 [首批規格](z-image-upper-scene-v2.md) 接入本機 runtime；本文件保留原 A／B 文字作比較，資料庫未修改。

## 測試目的與來源

- A：目前 `fa22169` 第一版引擎實際產出的 Z-Image Prompt。
- B：保留 A 的全部文字，只在開頭的場景句加入本批候選片語。
- 前四組測試新增來源；第五組測試選用原來源中的桅杆片語；第六組不改字，作為隨機差異對照。
- 候選詳見 [第二版完整清單](z-image-upper-scene-v2-proposal.md)；基線詳見 [第一版規則](z-image-scene-direction-v1.md)。
- 本文件不是正式 renderer 規格；第五組尤其涉及既有壓縮之後是否選回短來源，須依實測再決定，不能視為已批准無條件補回所有被裁切內容。

## 固定設定

- 單人／寫實攝影；性感曲線身形、冷感高級臉、柔霧細緻肌。
- 柔波中分、微風吹拂、淺金髮、柔和微笑。
- 自然站姿；手部、頭部、接觸／支撐皆全無。
- 白色落肩 T 恤／緊身、黑色皮革長褲／超低腰、寬版皮革腰帶。
- 中景（腰部以上）、腰部高度鏡頭、正面。
- 環境光、人物照明、攝影風格與成像模擬皆全無；不在公開 Prompt 寫出「全無」。
- 赤腳是固定選擇之一，但依中景裁切不輸出。既有服裝句法保留原樣，避免同時修改服裝成為干擾因素。
- 引擎組裝 seed：`upper-scene-v2-test-01`，六組相同。這不是影像生成模型的 seed。

## 建議實測方式

1. 每一組 A／B 在同一模型、同一版本、相同畫幅與生成設定下比較；建議統一使用直幅 4:5，作為外部生成設定，不額外改 Prompt。
2. 若介面可設定影像 seed，A／B 使用相同 seed；若不能，建議每版各生成 2–3 張，避免只比較單張偶然結果。
3. 先比較人物比例、景別與空間融合，再看新增細節是否自然出現。沒有每張出現全部屋簷或樑架不一定是失敗，不要求完整展示上方構造。
4. 觀察是否出現反效果：人物縮小、畫面被迫拉遠、天空與地板同時被強制展示、背景像獨立布景、肢體比例失真。
5. 第一輪僅測腰部高度；通過後再測膝蓋／地面／蟲眼高度，不能由本批推論所有低機位已通過。

## V2-1｜戶外：日式旅館緣側木廊

差異：`the underside of wooden eaves, exposed rafters`

觀察重點：木廊與人物是否仍自然融合；屋簷木椽只是局部線索，沒有迫使鏡頭拉遠。

### A｜目前第一版

```text
Photorealistic editorial portrait.

The setting is traditional Japanese ryokan engawa veranda, sliding door frames. Waist-up portrait, waist-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

### B｜第二版測試候選

```text
Photorealistic editorial portrait.

The setting is traditional Japanese ryokan engawa veranda, sliding door frames, the underside of wooden eaves, exposed rafters. Waist-up portrait, waist-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## V2-2｜室內：日式和室

差異：`a wooden lintel above the shoji doors`

觀察重點：門上緣是否豐富空間，而不是變成完整房間展示。

### A｜目前第一版

```text
Photorealistic editorial portrait.

The setting is traditional Japanese washitsu room, shoji sliding doors. Waist-up portrait, waist-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

### B｜第二版測試候選

```text
Photorealistic editorial portrait.

The setting is traditional Japanese washitsu room, shoji sliding doors, a wooden lintel above the shoji doors. Waist-up portrait, waist-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## V2-3｜室內：廢棄水泥工廠破碎輸送帶區

差異：`rusted steel beams overhead`

觀察重點：鋼樑是否保持在場景上方，沒有引出地板全景或拉長人物。

### A｜目前第一版

```text
Photorealistic editorial portrait.

The setting is abandoned cement factory conveyor-belt corner, broken conveyor rollers. Waist-up portrait, waist-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

### B｜第二版測試候選

```text
Photorealistic editorial portrait.

The setting is abandoned cement factory conveyor-belt corner, broken conveyor rollers, rusted steel beams overhead. Waist-up portrait, waist-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## V2-4｜戶外：草地與樹木

差異：`irregular branches and foliage overhead`

觀察重點：枝葉是否補足上方層次，沒有把人物縮小成公園遠景。

### A｜目前第一版

```text
Photorealistic editorial portrait.

The setting is small grassy park patch, scattered tree trunks at varied depths. Waist-up portrait, waist-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

### B｜第二版測試候選

```text
Photorealistic editorial portrait.

The setting is small grassy park patch, scattered tree trunks at varied depths, irregular branches and foliage overhead. Waist-up portrait, waist-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## V2-5｜戶外：城市遊艇碼頭欄杆旁

差異：`yacht masts`

觀察重點：桅杆是否提供碼頭辨識度；不要求完整船身、水面或把桅杆寫成頭頂物件。

### A｜目前第一版

```text
Photorealistic editorial portrait.

The setting is urban yacht marina promenade, slim stainless-steel pedestrian handrail with round tubular rails. Waist-up portrait, waist-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

### B｜第二版測試候選

```text
Photorealistic editorial portrait.

The setting is urban yacht marina promenade, slim stainless-steel pedestrian handrail with round tubular rails, yacht masts. Waist-up portrait, waist-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## V2-6｜戶外：新宿歌舞伎町招牌下

差異：無；A／B 完全相同。

觀察重點：文字完全不變；比較結果只用於了解模型隨機差異，不能當成第二版改善證據。

### A｜目前第一版

```text
Photorealistic editorial portrait.

The setting is Shinjuku Kabukicho Ichibangai entrance beneath the iconic red illuminated street-spanning arch sign, steel arch supports, dense nightlife storefronts and layered signboards. Waist-up portrait, waist-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

### B｜不變對照

```text
Photorealistic editorial portrait.

The setting is Shinjuku Kabukicho Ichibangai entrance beneath the iconic red illuminated street-spanning arch sign, steel arch supports, dense nightlife storefronts and layered signboards. Waist-up portrait, waist-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## 結果記錄（使用者回報）

使用者本輪回報：V2-1～4 選 B；V2-5／6 A 與 B 差不多，都可接受。六組人物比例、景別、場景融合、上方細節均無問題。未提供模型版本、影像 seed 或逐張評分；下表僅記錄整組回報，不推定未知測試參數。正式採用前四組 B，後兩組維持 A／現狀，見 [首批實作規格](z-image-upper-scene-v2.md)。本文件 A／B 原文字保留作歷史比較，不因 runtime 已升版改寫。

| 案例 | 模型／版本／影像 seed | 人物比例與景別 | 場景融合 | 上方細節與反效果 | 結論 |
| --- | --- | --- | --- | --- | --- |
| V2-1 | 未提供 | 回報無問題 | 回報無問題 | 回報無問題 | 採 B |
| V2-2 | 未提供 | 回報無問題 | 回報無問題 | 回報無問題 | 採 B |
| V2-3 | 未提供 | 回報無問題 | 回報無問題 | 回報無問題 | 採 B |
| V2-4 | 未提供 | 回報無問題 | 回報無問題 | 回報無問題 | 採 B |
| V2-5 | 未提供 | 回報無問題 | 回報無問題 | 回報無問題 | A／B 相近，維持 A |
| V2-6 | 未提供 | 回報無問題 | 回報無問題 | 回報無問題 | 維持現狀 |

## 本批技術核對與邊界

- 六組 A 取自現有引擎；B 與 A 在場景第一句以外逐字相同。
- 前五組每組只增加表列片語；第六組 A／B 完全相同。
- 文件中的 Prompt 可直接複製測試，不需模型解讀「selected」等介面選項名稱。
- 本實測包最初整理時僅產生文件素材；當時未變更 runtime、UI、資料庫或儲存／匯入格式。後續首批 Z-Image runtime 實作與驗證另記於首批規格。
- 文字差異驗證不等於影像品質驗證；本包的使用者影像驗收僅涵蓋腰部高度＋中景，其他低機位仍待實測。
