# Camera & Lighting Dictionary (攝影技術與光影變數庫辭典)

此辭典專供 AI 攝影師在整合場景時進行參數抽樣。請結合構圖、焦段、光影與底片模擬，為畫面賦予專業的攝影質感與電影氛圍。

| 維度分類 (Dimension) | 參數名稱 (Parameter) | 英文 Prompt 關鍵字 (生成用的精準詞彙) | 視覺效果與適用情境 (Visual Effect & Context) |
| :--- | :--- | :--- | :--- |
| **景別構圖 (Framing)** | 全無 | `none` | 不指定景別構圖，讓模型自行決定畫面距離與主體範圍。 |
| **景別構圖 (Framing)** | 特寫鏡頭 (Close-Up) | `close-up shot, head and shoulders framing, detailed facial features, tight subject crop` | 構圖包含頭部至肩膀，適合展現人物神情與精緻妝容，為經典近距離構圖。 |
| **景別構圖 (Framing)** | 臉部特寫 | `extreme face close-up, the entire face filling almost the whole frame, minimal space around the forehead, cheeks, and chin, full facial features clearly visible` | 整張臉幾乎塞滿畫面，額頭、下巴與左右臉只留極少空隙，適合五官辨識、妝容、神情與臉部存在感最強的拍法。 |
| **景別構圖 (Framing)** | 胸上特寫 | `tight bust-up portrait, framed from the chest upward, face and upper torso clearly visible, compact portrait composition` | 構圖從胸口以上，保留臉部、肩頸與部分上身資訊，適合兼顧表情、髮型、頸部配件與少量穿搭。 |
| **景別構圖 (Framing)** | 局部五官特寫 | `oppressive extreme close-up of partial facial features, only a tight fragment of the face visible, cropped to eyes and glasses or eyes and nose or nose and lips, intentional partial-face composition` | 只保留局部五官，像是雙眼與眼鏡、眼睛與鼻子、鼻子與嘴巴等極近距離片段，強調壓迫感、細節與刻意裁切的臉部構圖。 |
| **景別構圖 (Framing)** | 半臉傾斜特寫 | `extreme close-up of only one half of the face, strong dutch angle, intentional off-center crop, partial face filling the frame, stylized asymmetric close-up composition` | 只保留左半臉或右半臉，並帶明顯荷蘭角與偏移裁切，整體更像雜誌化、風格化且刻意不完整的高壓特寫。 |
| **景別構圖 (Framing)** | 中景鏡頭 (Medium Shot) | `medium shot, waist up framing, natural subject presence, showing some background` | 構圖從腰部以上，人物與背景取得平衡，適合展現半身穿搭與周圍環境的互動。 |
| **景別構圖 (Framing)** | 牛仔中景 (Cowboy Shot) | `cowboy shot, american shot, knee up framing, dynamic pose` | 從膝蓋上方截斷，源於西部片用來展示槍套。適合展現強勢氣場與全身大部分服裝。 |
| **景別構圖 (Framing)** | 全身鏡頭 (Full Body Shot) | `full body shot, full-length figure framing, wide framing, environmental scale, complete lower-body visibility` | 完整拍攝人物從頭到腳，強調整體穿搭比例、下半身完整可見，以及人物在廣大環境中的位置。 |
| **相機視角 (Angle)** | 全無 | `none` | 不指定俯仰角度，讓模型自行決定相機高低視角。 |
| **相機視角 (Angle)** | 平視角 (Eye-Level Angle) | `eye-level angle, objective view, neutral perspective, natural camera height` | 最自然客觀的視角，觀眾與拍攝對象處於平等地位，適合大多數日常與時裝構圖。 |
| **相機視角 (Angle)** | 仰角 (Low Angle) | `low angle, looking up from below, heroic, powerful silhouette, dominance` | 由下往上拍。能拉長人物比例（特別是腿部），賦予主體強勢、英雄般或具壓迫感的氣場。 |
| **相機視角 (Angle)** | 俯角 (High Angle) | `high angle, looking down from above, vulnerable, cute, foreshortening` | 由上往下拍。使人物顯得較小、脆弱或無辜，伴隨明顯的透視縮短效益。 |
| **相機視角 (Angle)** | 荷蘭角/傾斜 (Dutch Angle) | `dutch angle, tilted camera, crooked horizon, unsettling, cinematic tension` | 相機刻意傾斜，地平線不平。營造不安、混亂、速度感或極度戲劇化的電影張力。 |
| **拍攝方位 (Orbit Angle)** | 全無 | `none` | 不指定環繞角度，讓模型自行決定人物相對鏡頭的朝向。 |
| **拍攝方位 (Orbit Angle)** | 正面 | `front-facing camera position, straight-on subject view, symmetrical subject orientation` | 鏡頭正對人物正面，臉部與身體主要朝向鏡頭，資訊最完整。 |
| **拍攝方位 (Orbit Angle)** | 左前斜側 | `front three-quarter angle, 45-degree turn, slightly angled toward camera, dimensional subject view` | 身體略微往左轉開，但仍保留大部分正面資訊，常見於最自然的人像角度。 |
| **拍攝方位 (Orbit Angle)** | 左側 | `side profile view, 90-degree subject angle, clean facial profile, lateral composition` | 以左側臉或左側身輪廓為主，適合強調鼻樑、下顎線與側面輪廓。 |
| **拍攝方位 (Orbit Angle)** | 左後斜側 | `rear three-quarter angle, over-shoulder body orientation, partially turned away from camera` | 身體明顯朝左後方轉開，只保留少量側臉或回望可能，神秘感更強。 |
| **拍攝方位 (Orbit Angle)** | 背面 | `back view, subject facing away from camera, rear body orientation, turned back silhouette` | 以背影為主，臉部資訊大幅減少，重點轉向髮型、服裝線條與姿態。 |
| **拍攝方位 (Orbit Angle)** | 右後斜側 | `rear three-quarter angle from opposite side, body turned away, partial shoulder reveal` | 從右後方的斜側角度觀看主體，保留肩線與背部輪廓，仍偏背影導向。 |
| **拍攝方位 (Orbit Angle)** | 右側 | `right-side profile view, side-facing camera angle, crisp lateral silhouette` | 以右側臉或右側身輪廓為主，重點同樣是側面線條與輪廓感。 |
| **拍攝方位 (Orbit Angle)** | 右前斜側 | `front three-quarter angle from opposite side, softly turned toward camera, dimensional subject composition` | 身體略微往右轉開，但仍保留大部分正面資訊，適合自然且有立體感的人像構圖。 |
| **鏡頭焦段 (Focal Length)** | 全無 | `none` | 不指定鏡頭焦段，讓模型自行決定視角、透視與空間壓縮感。 |
| **鏡頭焦段 (Focal Length)** | 20mm 超廣角 | `shot on 20mm lens` | 超廣角帶來強烈透視延展與貼近感，適合建築感、場景感、動態誇張與前景衝擊明顯的畫面。 |
| **鏡頭焦段 (Focal Length)** | 24mm 廣角 | `shot on 24mm lens` | 廣角感明顯，能保留大量場景資訊，適合街拍、旅拍、時裝外景與強環境敘事的人像。 |
| **鏡頭焦段 (Focal Length)** | 28mm 廣角 | `shot on 28mm lens` | 比 24mm 更自然一些，仍保有環境參與感，適合 lifestyle、城市漫遊與日常紀實感人像。 |
| **鏡頭焦段 (Focal Length)** | 35mm 廣角 (人文視角) | `shot on 35mm lens` | 經典的人文與街拍焦段，視角適中不過度變形，能自然融合人物與環境背景。 |
| **鏡頭焦段 (Focal Length)** | 50mm 標準鏡頭 (Standard) | `shot on 50mm lens` | 最接近人類單眼視覺的透視感，不變形，背景虛化自然，適用於絕大多數日常與棚拍。 |
| **鏡頭焦段 (Focal Length)** | 85mm 中長焦 (人像鏡皇) | `shot on 85mm lens` | 完美壓縮臉部特徵使其更顯精緻，具有奶油般柔和的背景散景，是特寫人像的首選。 |
| **鏡頭焦段 (Focal Length)** | 105mm 中長焦 | `shot on 105mm lens` | 比 85mm 更有壓縮感與距離感，適合成熟、安靜、乾淨的商業人像與時裝構圖。 |
| **鏡頭焦段 (Focal Length)** | 135mm 長焦壓縮 | `shot on 135mm lens` | 長焦讓背景被拉近並壓縮，畫面更乾淨扁平，適合街頭遠距、偷拍感與高級時裝敘事。 |
| **鏡頭焦段 (Focal Length)** | 微距鏡頭 Macro | `shot on macro lens` | 適合嘴唇、眼睛、飾品、布料、指尖等局部細節，能呈現極近距離的質感描寫。 |
| **鏡頭焦段 (Focal Length)** | 魚眼鏡頭 Fisheye | `shot on fisheye lens` | 帶來強烈桶狀變形與包覆式空間感，適合街頭、Y2K、玩味、叛逆與實驗感畫面。 |
| **鏡頭焦段 (Focal Length)** | 移軸鏡頭 Tilt-Shift | `shot on tilt-shift lens` | 透過特殊焦平面與透視控制，營造模型感、冷靜觀看距離、櫥窗感或都市幾何感。 |
| **鏡頭焦段 (Focal Length)** | 變形寬銀幕鏡頭 Anamorphic | `shot on anamorphic lens` | 強烈電影語言的寬銀幕鏡頭，常帶橢圓散景與水平光斑，適合公路片、夜景、敘事感與大片氣質。 |
| **環境光氛 (Environment Mood)** | 全無 | `none` | 不指定環境光氛，讓模型自行決定天空、空氣感、時段與整體場景光氛。 |
| **環境光氛 (Environment Mood)** | 晴朗白日 | `clear daylight atmosphere, bright daytime sky, clean sunlit distance, open natural visibility` | 明亮乾淨的白天環境，若畫面有天空或遠景，應呈現清晰日間天空與高能見度空氣感。 |
| **環境光氛 (Environment Mood)** | 藍天白雲 | `clear blue sky, crisp white clouds, bright clean daylight, open airy distance, vivid daytime atmosphere` | 若畫面包含天空、窗外或遠景，應明確呈現藍天與白雲，整體空氣通透、明亮。 |
| **環境光氛 (Environment Mood)** | 正午烈日 | `harsh midday sun atmosphere, overhead summer daylight, short hard shadows, glaring bright sky, heat-baked outdoor air` | 接近正午的強烈直射日光，天空刺亮、陰影短而硬，整體帶有炎熱曝曬與高反差的戶外感。 |
| **環境光氛 (Environment Mood)** | 陰天漫射 | `overcast sky, cloud-covered daylight, soft diffused atmosphere, muted distant contrast, calm neutral air` | 雲層厚而均勻，若有天空或遠景，應偏灰白低對比，整體更柔和安靜。 |
| **環境光氛 (Environment Mood)** | 清晨薄霧 | `misty morning atmosphere, pale cool sky, soft haze in the distance, gentle low-contrast dawn air` | 帶有清晨霧感與偏冷晨光，若有遠景應略帶霧化與空氣透視。 |
| **環境光氛 (Environment Mood)** | 晨光日出 | `sunrise atmosphere, early golden morning light, fresh crisp air, soft warm horizon glow, waking-day ambience` | 剛日出的晨間氛圍，光線偏金暖但仍清新，適合安靜、明亮、帶希望感的早晨畫面。 |
| **環境光氛 (Environment Mood)** | 黃昏夕陽 | `golden sunset atmosphere, warm orange sky, low sun glow, long-shadow evening air, distant amber horizon` | 若畫面包含天空或遠景，應呈現橙金到粉暖色過渡與夕陽低角度氛圍。 |
| **環境光氛 (Environment Mood)** | 藍調傍晚 | `blue hour atmosphere, deep blue dusk sky, fading ambient daylight, cool evening transition, quiet twilight distance` | 日落後到入夜前的藍調時段，天空偏深藍，遠景仍保留些微殘光。 |
| **環境光氛 (Environment Mood)** | 夜晚街燈 | `streetlit night atmosphere, dark blue-black night sky, sodium-vapor streetlights, subtle urban glow, natural city night mood` | 一般城市夜晚環境，若有天空通常接近深藍黑色，主要由路燈與城市溢光支撐氛圍。 |
| **環境光氛 (Environment Mood)** | 月光夜色 | `moonlit night atmosphere, cool silvery darkness, quiet nocturnal air, faint moon glow, natural blue-black night mood` | 以自然月光為主的夜色氛圍，整體偏冷、安靜、銀藍色，適合戶外夜景與靜謐敘事。 |
| **環境光氛 (Environment Mood)** | 霓虹夜色 | `neon night atmosphere, dark night sky, colored city glow, vivid neon reflections, high-saturation urban nightlife mood` | 夜色基底下混入高彩度霓虹，若有遠景應帶彩色反射、招牌光暈與夜生活氣息。 |
| **環境光氛 (Environment Mood)** | 陰雨將至 | `storm-brewing atmosphere, heavy dark clouds, charged humid air, pre-rain tension, oppressive low-sky mood` | 暴雨前的烏雲壓頂與潮悶空氣，畫面帶有等待風暴來臨的壓迫感與不安定張力。 |
| **環境光氛 (Environment Mood)** | 雨天陰濕 | `rainy atmosphere, grey-blue rain sky, damp air, wet surfaces, muted visibility, cold overcast mood` | 若畫面含天空與遠景，應呈現厚重灰藍雲層、濕冷空氣與低明度場景。 |
| **環境光氛 (Environment Mood)** | 雨後反光 | `post-rain atmosphere, recently cleared wet streets, reflective surfaces, moody sky remnants, fresh damp urban air` | 雨剛停後的潮濕反光環境，若有遠景可保留殘雲、濕亮地面與更通透的空氣感。 |
| **環境光氛 (Environment Mood)** | 雪地冷光 | `snow-bright atmosphere, cold pale sky, reflective snowy distance, crisp winter air, bright cool ambient glow` | 若畫面有遠景與天空，應帶冷白冬日感與雪地反射造成的清冽亮度。 |
| **環境光氛 (Environment Mood)** | 冬季灰冷 | `cold winter overcast atmosphere, pale grey sky, dry freezing air, subdued daylight, stark seasonal stillness` | 不一定下雪，但整體帶有冬季灰冷、乾燥、沉靜而偏冷白的季節空氣感。 |
| **環境光氛 (Environment Mood)** | 室內窗邊日光 | `indoor daylight by the window, natural window-lit room, bright exterior sky visible outside if present, soft daytime interior atmosphere` | 以白天室內窗光為主；若畫面看得到窗外，外部應明確保持白天天空與日光狀態。 |
| **環境光氛 (Environment Mood)** | 室內陰影日光 | `indoor dim daylight, soft daylight falling deeper into the room, subdued exterior brightness if visible, quiet shaded interior air` | 白天室內但不在強窗邊，空間較內收；若看得到窗外，外部仍應維持日間亮度。 |
| **環境光氛 (Environment Mood)** | 室內暖光夜景 | `indoor warm night atmosphere, tungsten room light, cozy amber interior glow, dark exterior beyond windows if visible, intimate nighttime mood` | 晚上室內的人造暖光場景；若窗外可見，應為明確夜色而非白天。 |
| **環境光氛 (Environment Mood)** | 室內燭光 | `candlelit interior atmosphere, flickering warm flame glow, intimate low-light room, soft amber darkness, romantic firelit mood` | 由燭光或火光主導的室內夜景，整體更親密、古典、柔暖，適合 boudoir、復古與私密敘事。 |
| **環境光氛 (Environment Mood)** | 室內冷色人造光 | `indoor cool artificial light, fluorescent or LED interior mood, cool-white ambient cast, modern controlled space, dim exterior if visible` | 偏冷白的人造光室內空間，若有窗外通常不主導，整體更現代、理性、都市。 |
| **環境光氛 (Environment Mood)** | 室內霓虹夜色 | `indoor neon-lit atmosphere, colored LED glow, nightlife interior mood, saturated urban light spill, moody modern room ambiance` | 由室內霓虹或 LED 光源主導的夜景氛圍，適合旅館、酒吧、浴室、夜店與都會感室內畫面。 |
| **環境光氛 (Environment Mood)** | 高調純白攝影棚 | `high-key white studio atmosphere, seamless white cyc wall, shadowless commercial lighting environment, ultra-clean bright studio air` | 純白無縫背景與高調棚燈主導的商業攝影棚氛圍，整體明亮乾淨、陰影極淡或近乎消失，適合 beauty、catalog、電商、極簡時裝與乾淨人像。 |
| **環境光氛 (Environment Mood)** | 柔霧美妝攝影棚 | `soft beauty studio atmosphere, diffused shadowless lighting environment, creamy clean studio air, polished commercial portrait mood` | 以大型柔光與均勻棚燈營造的美妝棚拍氛圍，陰影極輕、膚質細膩、畫面乾淨柔順，適合特寫寫真、妝容、保養品與高級人像。 |
| **環境光氛 (Environment Mood)** | 舞台演出燈光 | `stage-lit atmosphere, theatrical venue lighting, dark surrounding space, dramatic colored beams, performance-driven visual mood` | 以舞台、演出或強人工燈具主導的環境，背景通常較暗，空間感由燈束與演出光決定。 |
| **光線表現 (Light Style)** | 全無 | `none` | 不指定光線表現，讓模型自行決定主體受光方向、質地與氣氛。 |
| **光線表現 (Light Style)** | 柔和順光 | `soft front light, even forward illumination, gentle skin rendering, low-contrast facial detail` | 正面柔光均勻照亮五官，陰影少，最適合乾淨穩定的人像。 |
| **光線表現 (Light Style)** | 均勻平光 | `flat even light, balanced full-face illumination, minimal contrast, clean descriptive exposure` | 光線平均、資訊完整、對比低，適合型錄感、敘事清楚的畫面。 |
| **光線表現 (Light Style)** | 側向柔光 | `soft side light, gentle cheek contour, natural dimensional modeling, airy portrait softness` | 由側邊柔和照亮主體，兼顧立體感與自然膚色。 |
| **光線表現 (Light Style)** | 側向硬光 | `hard side light, clear shadow edge, strong sculpted contrast, sharper facial definition` | 側光明顯、陰影邊界銳利，時裝感與戲劇感都更強。 |
| **光線表現 (Light Style)** | 側逆光 | `back-side light, diagonal rear illumination, soft rim edges, cinematic subject separation` | 從斜後方照亮人物，保留輪廓與一部分臉部細節。 |
| **光線表現 (Light Style)** | 逆光輪廓光 | `strong rim light, backlit outline, glowing hair edges, separated silhouette` | 主體邊緣被勾亮，特別適合夕陽、夜景與高氛圍畫面。 |
| **光線表現 (Light Style)** | 頂部照明 | `overhead top lighting, downward illumination, moody facial shadow, tense vertical light falloff` | 由上方壓下來的光線讓氣氛更成熟或更有壓迫感。 |
| **光線表現 (Light Style)** | 下方反射光 | `bounce up light, upward reflected fill, subtle lower-face lift, reflective underglow` | 利用地面、牆面或雪地等反射面回補下半臉陰影。 |
| **光線表現 (Light Style)** | 漫射霧光 | `diffused mist light, soft atmospheric spread, low-contrast haze, enveloping ambient glow` | 光線被霧氣、濕氣或厚雲層柔化，整體包覆感更強。 |
| **光線表現 (Light Style)** | 硬質晴光 | `hard sunlight, direct sunbeam exposure, deep shadow contrast, crisp bright highlights` | 直射日光明顯，陰影深且邊緣清楚。 |
| **光線表現 (Light Style)** | 低光高反差 | `low-key contrast light, deep shadow fields, selective highlight emphasis, cinematic darkness` | 暗部面積大、亮暗落差高，適合夜景、戲劇與低照度畫面。 |
| **光線表現 (Light Style)** | 高調亮光 | `high-key bright light, luminous exposure, airy highlights, soft low-shadow clarity` | 整體偏亮偏透，陰影很少，乾淨清爽。 |
| **光線表現 (Light Style)** | 混合色溫光 | `mixed color temperature lighting, warm and cool light interplay, layered color contrast, cinematic environmental mixing` | 冷暖光並存，特別適合都市夜景、室內夜景與敘事場面。 |
| **光線表現 (Light Style)** | 霓虹染色光 | `neon color spill, saturated colored light cast, vivid skin-edge tinting, nightlife color wash` | 霓虹色光直接染到人物與場景表面，風格化最強。 |
| **光線表現 (Light Style)** | 窗格投影光 | `window pattern light, slatted or framed daylight shadows, subtle graphic projection, interior cinematic texture` | 來自窗框、百葉或格柵投影的方向性光影，偏室內敘事感。 |
| **光線表現 (Light Style)** | 百葉窗條紋投影光 | `window-blind stripe light, slatted daylight bands across the subject, horizontal shadow lines across the face, skin, and clothing, sensual cinematic interior contrast` | 光線穿過百葉窗後形成明顯條紋，直接投射在人物臉部、身體或衣物上，帶有更強烈的私密、電影感與室內敘事張力。 |
| **光線表現 (Light Style)** | 斑駁樹影光 | `dappled light, broken sunlight through leaves, irregular moving shadow patches, lively outdoor texture` | 陽光穿過樹葉後形成不規則斑駁陰影，生活感很強。 |
| **光線表現 (Light Style)** | 潮濕反射光 | `wet reflective light, ground bounce from damp surfaces, glossy street reflections, fragmented luminous highlights` | 由濕地面與牆面反射補光，特別適合雨天與夜街。 |
| **光線表現 (Light Style)** | 局部暖光 | `local warm glow, lamp-driven warm pool of light, intimate amber highlight zone, cozy night illumination` | 由檯燈、壁燈、床頭燈等局部暖光源形成的親密光區。 |
| **底片與相機模擬 (Camera & Film Simulation)** | 全無 | `none` | 不指定成像風格，讓模型自行決定畫面質感與成像方式。 |
| **底片與相機模擬 (Camera & Film Simulation)** | 拍立得效果 (Polaroid Style) | `polaroid sx-70 style, instant film look, faded pastel colors, soft white border, lo-fi` | 帶有濃烈懷舊感，邊緣失焦、色彩偏淡偏粉（如褪色般），對比低且具有明顯的化學顯影特性。 |
| **底片與相機模擬 (Camera & Film Simulation)** | 柯達 Portra 400 底片 | `Kodak Portra 400 film simulation, warm skin tones, fine film grain, analog aesthetic` | 業界公認最完美的膚色底片。擁有溫暖的橙橘色調、細膩的顆粒感與優秀的寬容度，呈現高品質的文青底片感。 |
| **底片與相機模擬 (Camera & Film Simulation)** | 富士 Superia 400 底片 | `Fujifilm Superia 400 simulation, slightly green shadows, high contrast, everyday analog` | 偏冷色調，特別是在陰影處容易帶有微微的日系青綠色，綠色跟紅色的表現非常搶眼，適合日本街頭紀實。 |
| **底片與相機模擬 (Camera & Film Simulation)** | Leica 數位紀實感 | `Leica digital look, crisp micro-contrast, refined tonal separation, realistic skin detail, restrained color response, premium documentary rendering` | Leica 風格重點在乾淨克制的色彩、明確的微對比與高級紀實感，適合街拍、旅拍與極簡人物。 |
| **底片與相機模擬 (Camera & Film Simulation)** | 富士 Classic Chrome 電影感 | `Fujifilm Classic Chrome look, muted color palette, soft contrast, documentary mood, subdued blues and reds, editorial travel-film atmosphere` | 低飽和、偏雜誌感與紀實旅行感，適合城市、咖啡館、街拍與日常敘事人像。 |
| **底片與相機模擬 (Camera & Film Simulation)** | 富士 Provia 清透明亮感 | `Fujifilm Provia look, clean balanced color, crisp daylight rendering, transparent skin tones, bright natural contrast` | 比 Classic Chrome 更乾淨明亮，適合自然日光、生活感與清爽透明的日系數位色調。 |
| **底片與相機模擬 (Camera & Film Simulation)** | Leica Monochrom 黑白灰階 | `Leica Monochrom black and white look, rich grayscale separation, crisp detail, deep blacks, luminous highlights, timeless documentary mood` | 不只是一般黑白濾鏡，而是灰階層次細膩、黑位深、亮部乾淨的高級黑白紀實感。 |
| **底片與相機模擬 (Camera & Film Simulation)** | Contax Zeiss 復古銳利感 | `Contax Zeiss look, crisp vintage sharpness, subtle warm highlights, rich contrast, cinematic 35mm character, nostalgic premium rendering` | 帶有老鏡味的復古銳利感，不是柔糊朦朧，而是帶年代感與高級光學個性的經典電影氣質。 |
| **底片與相機模擬 (Camera & Film Simulation)** | Canon 暖膚人像感 | `Canon full-frame portrait look, warm flattering skin tones, soft highlight roll-off, smooth color rendering, commercial beauty photography feel` | Canon 典型的人像優勢是膚色討喜、亮部柔順、整體商業感穩定，適合寫真與商攝。 |
| **底片與相機模擬 (Camera & Film Simulation)** | Canon 直出生活感 | `Canon JPEG look, bright warm color balance, pleasing skin tones, soft contrast, everyday lifestyle photography mood` | 偏向 Canon 直出的舒服日常色彩，明亮、輕暖、適合居家、咖啡館與生活感畫面。 |
| **底片與相機模擬 (Camera & Film Simulation)** | Nikon 冷調寫實感 | `Nikon digital look, crisp detail rendering, cool-neutral color balance, strong clarity, realistic tonal depth, editorial precision` | 細節清楚、色調冷靜、寫實感強，適合清冷時裝、紀實街拍與較硬朗的視覺風格。 |
| **底片與相機模擬 (Camera & Film Simulation)** | Nikon 通透明亮外景感 | `Nikon landscape-oriented digital look, wide dynamic range, transparent shadows, crisp natural color, clean daylight realism` | 強調戶外自然光下的通透感與動態範圍，適合旅行、自然景與白天外景人像。 |
| **底片與相機模擬 (Camera & Film Simulation)** | Ricoh GR 街頭快照感 | `Ricoh GR street photography look, compact-camera realism, snap focus feel, contrasty urban mood, candid everyday documentary vibe` | 帶有貼身街拍機的即時感與快照感，適合城市漫遊、街頭抓拍與生活紀實氛圍。 |
| **底片與相機模擬 (Camera & Film Simulation)** | 中片幅數位單眼 (Medium Format DSLR) | `Hasselblad medium format image, extreme ultra-high resolution, medium format organic depth` | 哈蘇或飛思等數位後背相機。擁有令人髮指的細節解析度（看清每一根睫毛），以及有別於全片幅的特殊立體過渡與景深空間感。 |
| **底片與相機模擬 (Camera & Film Simulation)** | VHS 錄影帶低畫質 | `VHS camcorder glitch effect, heavily degraded image, chromatic aberration, scanlines, analog horror` | 模仿 90 年代老舊錄影帶的畫面質感，保留做低頻特殊風格用途。 |
| **光學效果 (Optical Effects)** | 全無 | `none` | 不指定光學效果，讓模型自行決定是否加入 flare、散景、柔焦、暗角等鏡頭特徵。 |
| **光學效果 (Optical Effects)** | 淺景深 | `shallow depth of field, softly blurred background, gentle subject separation, natural portrait falloff` | 保留自然人像最常見的背景柔化效果，讓主體更清楚浮出畫面。 |
| **光學效果 (Optical Effects)** | 極淺景深 | `ultra shallow depth of field, heavily blurred background, razor-thin focus plane, dramatic subject isolation` | 焦平面非常薄，前後景快速化開，適合強烈主體分離與夢幻視覺。 |
| **光學效果 (Optical Effects)** | 重散景光斑 | `heavy bokeh, large luminous blur circles, dreamy optical falloff, pronounced out-of-focus highlights` | 讓背景或前景出現明顯大光斑與夢幻散景，特別適合夜景、節慶燈光與浪漫氛圍。 |
| **光學效果 (Optical Effects)** | 前景遮擋散景 | `controlled foreground bokeh occlusion from a fixed out-of-focus object near the lens, soft edge blur framing the subject, stable layered depth, clean cinematic foreground veil` | 鏡頭前方有固定來源的失焦遮擋與散景，用更穩定的前景模糊邊緣包住主體，避免雜亂不明的遮擋形狀。 |
| **光學效果 (Optical Effects)** | 鏡頭光斑 Lens Flare | `lens flare, blooming highlights, streaking flare artifacts, cinematic backlit optics` | 逆光或強光源在鏡頭內形成 flare，能提升電影感、舞台感與光源存在感。 |
| **光學效果 (Optical Effects)** | 變形鏡頭光斑 Anamorphic Flare | `anamorphic lens flare, horizontal blue streaks, widescreen cinematic flare, optical sci-fi sheen` | 水平拉絲的變形鏡頭光斑，是科幻、公路片與大型電影感場面的經典視覺語言。 |
| **光學效果 (Optical Effects)** | 漏光效果 Light Leaks | `vintage film light leaks, red and orange light burns, accidental analog flare, serendipitous exposure bloom` | 模擬底片相機的意外漏光，畫面邊緣出現不規則暖色過曝，增添偶然性與復古味。 |
| **光學效果 (Optical Effects)** | 柔焦濾鏡 Soft Focus | `soft focus filter, diffused detail rendering, delicate glow on skin, dreamy vintage softness` | 細節略微柔化，尤其適合膚質、寫真、夢境感與復古日系柔霧氛圍。 |
| **光學效果 (Optical Effects)** | 霧化高光 Bloom | `highlight bloom, glowing bright areas, soft halation around light sources, luminous haze` | 高光邊緣產生發光暈散，適合夜景、逆光、霓虹與夢幻感畫面。 |
| **光學效果 (Optical Effects)** | 暗角 Vignette | `subtle vignette, darker frame edges, center-weighted emphasis, cinematic tonal focus` | 畫面四周略暗，能集中視線並增加電影感與復古感。 |
| **光學效果 (Optical Effects)** | 色差 Chromatic Aberration | `chromatic aberration, subtle RGB edge fringing, optical color separation, digital-imperfect lens character` | 物體邊緣出現輕微分色，適合數位實驗感、低保真、故障美學或偏前衛畫面。 |
| **光學效果 (Optical Effects)** | 邊緣模糊 | `soft edge blur, center sharpness with peripheral softness, vintage lens imperfection, dreamy frame falloff` | 中心較清楚、四周較鬆，模擬老鏡或特殊鏡頭的周邊解析下降，讓畫面更柔更有氣氛。 |
| **光學效果 (Optical Effects)** | 光學朦朧薄霧 | `optical haze, atmospheric lens mist, veiled contrast, airy cinematic softness` | 畫面像隔著一層淡霧，對比更柔和，適合清晨、夢境、回憶感與安靜敘事。 |
