# Z-Image 上方場景 v2：其他低機位補充實測

日期：2026-09-13

狀態：以下十二段直接取自本機 v2 runtime，尚待使用者影像實測；不是既有六組 A／B 的驗收結果。

沿用 [A／B 實測包](z-image-upper-scene-v2-test-prompts.md) 的人物、服裝、自然站姿與中景；每個場景僅替換相機高度，沒有手動潤飾其他英文。四組場景各提供膝蓋／地面／蟲眼三個高度。使用相同外部模型設定、畫幅與可用時的影像 seed 比較；引擎 seed `upper-scene-v2-test-01` 不是影像 seed。

重點觀察人物比例、景別是否穩定，新增的上方物件是否自然，以及是否為了展示物件被迫拉遠。程式核對只確認指定角度被保留、輸出符合規則；不代表模型生成透視必然正確。

## L01｜戶外：日式旅館緣側木廊＋膝蓋高度鏡頭

```text
Photorealistic editorial portrait.

The setting is traditional Japanese ryokan engawa veranda, sliding door frames, the underside of wooden eaves, exposed rafters. Waist-up portrait, knee-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## L02｜戶外：日式旅館緣側木廊＋地面高度鏡頭

```text
Photorealistic editorial portrait.

The setting is traditional Japanese ryokan engawa veranda, sliding door frames, the underside of wooden eaves, exposed rafters. Waist-up portrait, front view. The camera is positioned near floor level and tilted upward toward the woman, emphasizing the upward perspective through her waist, torso, and shoulders. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## L03｜戶外：日式旅館緣側木廊＋蟲眼視角鏡頭

```text
Photorealistic editorial portrait.

The setting is traditional Japanese ryokan engawa veranda, sliding door frames, the underside of wooden eaves, exposed rafters. Waist-up portrait, front view. The camera is positioned extremely low near the ground and tilted steeply upward toward the woman, creating strong near-far scale through the closest visible body planes. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## L04｜室內：日式和室＋膝蓋高度鏡頭

```text
Photorealistic editorial portrait.

The setting is traditional Japanese washitsu room, shoji sliding doors, a wooden lintel above the shoji doors. Waist-up portrait, knee-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## L05｜室內：日式和室＋地面高度鏡頭

```text
Photorealistic editorial portrait.

The setting is traditional Japanese washitsu room, shoji sliding doors, a wooden lintel above the shoji doors. Waist-up portrait, front view. The camera is positioned near floor level and tilted upward toward the woman, emphasizing the upward perspective through her waist, torso, and shoulders. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## L06｜室內：日式和室＋蟲眼視角鏡頭

```text
Photorealistic editorial portrait.

The setting is traditional Japanese washitsu room, shoji sliding doors, a wooden lintel above the shoji doors. Waist-up portrait, front view. The camera is positioned extremely low near the ground and tilted steeply upward toward the woman, creating strong near-far scale through the closest visible body planes. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## L07｜室內：廢棄水泥工廠破碎輸送帶區＋膝蓋高度鏡頭

```text
Photorealistic editorial portrait.

The setting is abandoned cement factory conveyor-belt corner, broken conveyor rollers, rusted steel beams overhead. Waist-up portrait, knee-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## L08｜室內：廢棄水泥工廠破碎輸送帶區＋地面高度鏡頭

```text
Photorealistic editorial portrait.

The setting is abandoned cement factory conveyor-belt corner, broken conveyor rollers, rusted steel beams overhead. Waist-up portrait, front view. The camera is positioned near floor level and tilted upward toward the woman, emphasizing the upward perspective through her waist, torso, and shoulders. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## L09｜室內：廢棄水泥工廠破碎輸送帶區＋蟲眼視角鏡頭

```text
Photorealistic editorial portrait.

The setting is abandoned cement factory conveyor-belt corner, broken conveyor rollers, rusted steel beams overhead. Waist-up portrait, front view. The camera is positioned extremely low near the ground and tilted steeply upward toward the woman, creating strong near-far scale through the closest visible body planes. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## L10｜戶外：草地與樹木＋膝蓋高度鏡頭

```text
Photorealistic editorial portrait.

The setting is small grassy park patch, scattered tree trunks at varied depths, irregular branches and foliage overhead. Waist-up portrait, knee-level view, front view. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## L11｜戶外：草地與樹木＋地面高度鏡頭

```text
Photorealistic editorial portrait.

The setting is small grassy park patch, scattered tree trunks at varied depths, irregular branches and foliage overhead. Waist-up portrait, front view. The camera is positioned near floor level and tilted upward toward the woman, emphasizing the upward perspective through her waist, torso, and shoulders. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```

## L12｜戶外：草地與樹木＋蟲眼視角鏡頭

```text
Photorealistic editorial portrait.

The setting is small grassy park patch, scattered tree trunks at varied depths, irregular branches and foliage overhead. Waist-up portrait, front view. The camera is positioned extremely low near the ground and tilted steeply upward toward the woman, creating strong near-far scale through the closest visible body planes. Photographed directly from the front. Her chest, torso, and waist face the lens in a frontal waist-up silhouette.

A 20s seductive stunning Japanese or Korean woman, full bust, narrow defined waist, young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, long soft waves with a center part, defined wave shape, clean tapered ends, lightly wind-swept movement, gentle directional flow, a few naturally loose strands, controlled overall silhouette, light blonde hair, soft golden-beige tone, realistic dyed hair texture, soft matte skin texture, refined pores, velvety smooth finish, soft natural smile, relaxed brows, gently narrowed eyes, softly parted lips, lifted cheeks.

She presents a relaxed upright posture.

She wears, white dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion, ultra-low-rise waistband sitting very low on the hips, black leather trousers, sleek fitted structure, cool fashion attitude at the lower crop edge, decorative wide leather waist belt worn loosely around hips with a structured off-center buckle.
```
