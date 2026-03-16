# Camera & Lighting Dictionary (攝影技術與光影變數庫辭典)

此辭典專供 AI 攝影師在整合場景時進行參數抽樣。請結合構圖、焦段、光影與底片模擬，為畫面賦予專業的攝影質感與電影氛圍。

| 維度分類 (Dimension) | 參數名稱 (Parameter) | 英文 Prompt 關鍵字 (生成用的精準詞彙) | 視覺效果與適用情境 (Visual Effect & Context) |
| :--- | :--- | :--- | :--- |
| **景別構圖 (Framing)** | 全無 | `none` | 不指定景別構圖，讓模型自行決定畫面距離與主體範圍。 |
| **景別構圖 (Framing)** | 特寫鏡頭 (Close-Up) | `close-up shot, head and shoulders framing, detailed facial features, tight subject crop` | 構圖包含頭部至肩膀，適合展現人物神情與精緻妝容，為經典近距離構圖。 |
| **景別構圖 (Framing)** | 中景鏡頭 (Medium Shot) | `medium shot, waist up framing, natural subject presence, showing some background` | 構圖從腰部以上，人物與背景取得平衡，適合展現半身穿搭與周圍環境的互動。 |
| **景別構圖 (Framing)** | 牛仔中景 (Cowboy Shot) | `cowboy shot, american shot, knee up framing, dynamic pose` | 從膝蓋上方截斷，源於西部片用來展示槍套。適合展現強勢氣場與全身大部分服裝。 |
| **景別構圖 (Framing)** | 全身鏡頭 (Full Body Shot) | `full body shot, full-length figure framing, wide framing, environmental scale` | 完整拍攝人物從頭到腳，強調整體穿搭比例與人物在廣大環境中的位置。 |
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
| **鏡頭焦段 (Focal Length)** | 35mm 廣角 (人文視角) | `shot on 35mm lens, documentary style, slight background blur, natural field of view` | 經典的人文與街拍焦段，視角適中不過度變形，能自然融合人物與環境背景。 |
| **鏡頭焦段 (Focal Length)** | 50mm 標準鏡頭 (Standard) | `shot on 50mm lens, human eye perspective, natural figure rendering, zero distortion` | 最接近人類單眼視覺的透視感，不變形，背景虛化自然，適用於絕大多數日常與棚拍。 |
| **鏡頭焦段 (Focal Length)** | 85mm 中長焦 (人像鏡皇) | `shot on 85mm lens, shallow depth of field, creamy bokeh, precise facial rendering` | 完美壓縮臉部特徵使其更顯精緻，具有奶油般柔和的背景散景，是特寫人像的首選。 |
| **光線類型 (Lighting Type)** | 全無 | `none` | 不指定光線類型，讓模型自行決定主要光感與氛圍。 |
| **光線類型 (Lighting Type)** | 夕陽暖光 (Warm Sunset Light) | `warm sunset light, golden evening glow, long shadows, soft orange sunlight` | 夕陽前後的暖色光線，氛圍浪漫柔和，最適合戶外人像與寫真。 |
| **光線類型 (Lighting Type)** | 清晨薄霧光 | `early morning light, soft mist in the air, pale ambient glow, gentle low-contrast atmosphere` | 清晨空氣中帶有薄霧感，整體光線柔和偏冷，適合安靜、清新與帶一點潮濕感的戶外場景。 |
| **光線類型 (Lighting Type)** | 夜幕藍調 (Blue Twilight Light) | `blue twilight light, deep evening blue ambience, cool dusk atmosphere, melancholic mood` | 太陽剛落下後的深藍光線，畫面冷靜、安靜，和白天藍天完全不同。 |
| **光線類型 (Lighting Type)** | 藍天白雲日光 (Blue Sky Daylight) | `clear blue sky daylight, crisp white clouds, bright clean sunlight, open airy atmosphere` | 非黃昏也非陰天，而是藍天很藍、白雲很白的乾淨日光感，適合明亮外景。 |
| **光線類型 (Lighting Type)** | 小雨濕潤天光 | `light rain, fine drizzle in the air, grey-blue ambient cast, damp surfaces, soft muted atmosphere` | 飄著細小雨絲，整體空氣帶灰藍色調與柔濕感，適合城市、街拍與安靜敘事型場景。 |
| **光線類型 (Lighting Type)** | 大雨壓迫天光 | `heavy rain, dense rainfall, grey storm light, soaked surfaces, cold blue-grey atmosphere` | 明顯的大雨持續落下，整體光感偏灰藍且壓低，適合強烈情緒、壓迫感與戲劇化外景。 |
| **光線類型 (Lighting Type)** | 逆光的高曝光柔光 | `bright airy backlight, soft high-key exposure, gentle facial fill light, luminous rim light` | 逆光下整體曝光偏亮，髮絲邊緣有發光感，同時臉部仍保有柔和細節與空氣感。 |
| **光線類型 (Lighting Type)** | 側光的高曝光柔光 | `soft side light, bright high-key exposure, gentle facial contour, airy luminous skin tones` | 由側邊柔和照亮人物，帶一點立體感，但整體仍是透亮、乾淨、偏高曝光的人像光感。 |
| **光線類型 (Lighting Type)** | 正光的高曝光柔光 | `soft frontal light, bright high-key exposure, even facial illumination, clean luminous image quality` | 正面柔光均勻照亮五官，陰影很少，畫面乾淨明亮，適合清透寫真與 beauty 感人像。 |
| **光線類型 (Lighting Type)** | 陰天漫射柔光 (Overcast Soft Light) | `overcast soft light, cloudy day, even diffused lighting, no harsh shadows` | 雲層像巨大的柔光罩，光線極度均勻，沒有強烈陰影，適合展現最真實的膚色與服裝細節。 |
| **光線類型 (Lighting Type)** | 直射硬光/烈日 (Harsh Sunlight) | `harsh direct sunlight, midday sun, deep black shadows, high contrast, stark` | 正午或無雲的強烈直射光，產生濃黑銳利的邊緣陰影，帶有強烈對比與夏日炎熱感。 |
| **光線類型 (Lighting Type)** | 電影霓虹混光 (Neon Mixed Lighting) | `neon mixed lighting, cyberpunk city lights, teal and orange, bi-color illumination` | 利用城市霓虹燈或雙色補光燈，通常為紅藍或青橙對比，營造賽博龐克與王家衛浪漫感。 |
| **光線類型 (Lighting Type)** | 深夜微弱環境光 | `deep night ambient light, faint streetlight spill, weak building glow, dim urban atmosphere, extremely low-key visibility` | 沒有明確主光源，只有路燈、建築物與環境殘留的微弱光線，適合深夜街頭、空曠都市與低能見度場景。 |
| **光線類型 (Lighting Type)** | 棚內商業平光 (High Key Studio) | `high key studio lighting, bright softbox, white infinity cove, perfectly exposed` | 攝影棚內極度明亮、幾乎無陰影的佈光。畫面乾淨無瑕，常用於時尚、化妝品或型錄攝影。 |
| **光線類型 (Lighting Type)** | 暗調戲劇光 (Low Key Chiaroscuro) | `low key lighting, chiaroscuro, cinematic shadows, mostly dark background, mysterious` | 畫面大部分區域為暗部交響，僅有少量光線勾勒主體立體感。充滿戲劇張力與古典油畫感。 |
| **光線方向與質感 (Light Direction & Quality)** | 全無 | `none` | 不指定光線方向，讓模型自行決定光從哪個方向進入畫面。 |
| **光線方向與質感 (Light Direction & Quality)** | 倫勃朗光/三角光 (Rembrandt Lighting) | `Rembrandt lighting, soft directional side light, sculpted cheek shadow, painterly cinematic contrast, moody elegance` | 經典人像打光法。以柔和側光塑造臉部立體感與古典明暗層次，但不強調任何幾何形狀或圖案。 |
| **光線方向與質感 (Light Direction & Quality)** | 蝴蝶光/派拉蒙光 (Butterfly Lighting) | `butterfly lighting, centered beauty light, softly sculpted cheekbones, glamorous beauty lighting, clean facial highlights` | 光源從鏡頭前上方照射，重點是讓顴骨、鼻樑與臉部中央更乾淨立體，適合 beauty 與時裝人像。 |
| **光線方向與質感 (Light Direction & Quality)** | 輪廓光/背光 (Rim Light / Backlight) | `strong rim light, backlit, glowing edges, separated from background, halo effect` | 光源從主體正後方照射，在頭髮與肩膀邊緣勾勒出一道高光輪廓，能讓人物從深色背景中脫穎而出。 |
| **光線方向與質感 (Light Direction & Quality)** | 側光/陰陽光 (Split Lighting) | `split lighting, strong side light, one side of the face softly shadowed, clean facial contrast, cinematic lighting` | 光源從人物側邊照射，讓臉部明暗對比清楚，但仍保留自然膚色與真實五官，不會像舞台彩妝或半臉塗色。 |
| **光線方向與質感 (Light Direction & Quality)** | 窗縫光/百葉窗光 (Window / Blind Slits Light) | `directional window light, soft shadow bands, subtle noir mood, cinematic indoor contrast` | 偏向從窗邊進來的方向性光線，帶有輕微的層次陰影與室內電影感，但不追求臉上出現誇張條紋或幾何圖案。 |
| **光線方向與質感 (Light Direction & Quality)** | 頂光 (Top Lighting) | `overhead top lighting, deep-set facial shadows, moody cinematic contrast, tense cinematic atmosphere` | 光源從上方向下壓，讓眼窩與臉部下緣出現較深陰影，營造緊張、壓迫、帶點危險感的電影氣氛。 |
| **光線方向與質感 (Light Direction & Quality)** | 正面柔光 / 平順正面光 (Soft Frontal Light) | `soft frontal light, even forward-facing illumination, clean skin rendering, gentle beauty balance, minimal shadow transition` | 以柔和正面光均勻照亮五官，陰影很少，畫面乾淨透亮，適合清透寫真、商業人像與自然 beauty 感。 |
| **光線方向與質感 (Light Direction & Quality)** | 45 度側前柔光 (Loop Lighting) | `loop lighting, 45-degree front-side light, soft nose shadow loop, natural facial contour, elegant portrait modeling` | 光源位於人物前側約 45 度，會形成小而自然的鼻影，臉部立體感比正面柔光更強，但仍保有高頻實用的人像自然感。 |
| **光線方向與質感 (Light Direction & Quality)** | 貝殼光 / 上下夾光 (Clamshell Lighting) | `clamshell lighting, beauty light from above and below, smooth under-eye fill, polished skin glow, refined editorial beauty portrait` | 上方主光搭配下方補光，讓臉部陰影更少、膚質更平滑，特別適合妝容、時裝 close-up 與精修感人像。 |
| **光線方向與質感 (Light Direction & Quality)** | 側逆光 / 斜後方輪廓光 (Three-quarter Backlight) | `three-quarter backlight, diagonal rear light, glowing hair edges, soft shoulder rim, cinematic subject separation` | 光線從人物斜後方進入，既保留輪廓光，也比純背光更容易看見臉部細節，適合戶外黃昏、街頭夜景與空氣感寫真。 |
| **光線方向與質感 (Light Direction & Quality)** | 漫射窗邊側光 (Soft Window Side Light) | `soft window side light, diffused daylight from the side, gentle cheek contour, natural indoor portrait glow, quiet editorial softness` | 從窗邊進來的柔和側光，不帶百葉窗條紋感，常見於寫真、生活感與文藝人像，氣質比電影感窗縫光更自然。 |
| **光線方向與質感 (Light Direction & Quality)** | 剪影背光 (Silhouette Backlight) | `silhouette backlight, strong backlit outline, darkened facial detail, graphic subject contour, dramatic negative-space mood` | 光源從主體後方強力照射，人物整體壓暗只保留輪廓，適合海邊、窗前、街頭落日與高情緒對比畫面。 |
| **光線方向與質感 (Light Direction & Quality)** | 地面反射補光 / 下方回光 (Bounce / Upfill) | `bounce fill light, soft upward reflected light, lifted lower-face shadows, subtle under-chin glow, natural reflective fill` | 利用地面、牆面或反光板把光線回打到下半臉，能減輕鼻下與下巴陰影，適合戶外寫真、商業人像與高級自然光。 |
| **光線方向與質感 (Light Direction & Quality)** | 實景燈源側光 (Practical Motivated Side Light) | `practical motivated side light, lamp-lit side illumination, believable room light source, cinematic interior mood, warm directional glow` | 像檯燈、壁燈、霓虹招牌或店內燈具自然照到人物側臉，強調「畫面內有光源理由」的電影感，適合夜景與室內敘事人像。 |
| **光線方向與質感 (Light Direction & Quality)** | 斑駁樹影光 (Dappled Light) | `dappled light, broken sunlight through leaves, irregular shadow patches, lively outdoor texture, organic summer portrait mood` | 陽光穿過樹葉或遮擋物後形成不規則斑駁光影，畫面會帶有自然節奏與夏日流動感，適合草地、公園與戶外寫真。 |
| **光線方向與質感 (Light Direction & Quality)** | 霧中體積光 / 光束感 (Volumetric Light) | `volumetric light, visible light rays through haze, atmospheric beam glow, cinematic depth, mist-filled spatial separation` | 光線在霧氣、煙塵或濕氣中形成可見光束，空間層次會明顯增加，適合森林、廢墟、教堂感或強氛圍電影畫面。 |
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
| **特殊效果 (Special Effects)** | 漏光效果 (Light Leaks) | `vintage film light leaks, red and orange light burns, lens flare, serendipitous analog flaw` | 模擬舊底片相機機身漏光。畫面邊緣出現隨機、不規則的紅色或橙橘色光暈過曝，增添了真實且隨機的復古韻味。 |
| **特殊效果 (Special Effects)** | 鏡頭光斑 (Lens Flare) | `anamorphic lens flare, horizontal blue streaks, blooming highlights, cinematic light artifacts` | 尤其是模仿變形鏡頭 (Anamorphic) 產生的水平藍色拉絲光斑。是科幻電影或公路大片標誌性的光源特效。 |
| **特殊效果 (Special Effects)** | 散景/光斑大虛化 (Heavy Bokeh) | `out of focus foreground bokeh, hexagonal light orbs, dreamy shallow depth, optical blur` | 不僅背景虛化，更在鏡頭近處加入了被過度虛化的前景色塊或閃亮的光斑圓圈，營造出窺視與極端夢幻的感覺。 |
