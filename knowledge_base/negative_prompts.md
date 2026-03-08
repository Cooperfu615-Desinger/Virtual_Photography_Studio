# Negative Prompts Dictionary (負面提示詞防護辭典)

此辭典專供 AI 攝影師在遞交最終生圖指令時，依據場景與人物特性**強制加入**的反向提示詞。用途在於防止 AI 生成模型產生肢體變異、畫質崩壞或風格偏移。

| 維度分類 (Dimension) | 參數名稱 (Parameter) | 英文 Negative Prompt 關鍵字 (避免生成的精準詞彙) | 防護目標與適用情境 (Protection Target & Context) |
| :--- | :--- | :--- | :--- |
| **通用人體防護** | 基礎肢體崩壞防護 | `deformed, bad anatomy, disfigured, poorly drawn face, mutation, mutated, ugly, disgusting` | 最基礎且必備的防護牆。防止 AI 隨機生成嚴重扭曲的人體結構或面部器官。 |
| **通用人體防護** | 手部與手指變異防護 | `bad hands, missing fingers, extra digit, fewer digits, poorly drawn hands, twisted fingers, fused fingers` | 針對 AI 最弱的「手部細節」加強防護，避免出現六根手指、手指融合或不合邏輯的折疊。 |
| **通用人體防護** | 腿部與關節防護 | `missing legs, extra legs, bad feet, twisted legs, broken bone, unnatural posture, disconnected limbs` | 避免站姿或坐姿時，腿部憑空消失、多出一條腿，或是關節朝反方向彎折。 |
| **通用人體防護** | 頸部與頭部防護 | `long neck, detached head, weird jaw, out of frame head, multiple heads, elongated face` | 避免頭部與身體脫節、脖子異常拉長如蛇，或是同一個畫面上出現多顆頭顱。 |
| **通用人體防護** | 五官細節防護 | `cross-eyed, asymmetric eyes, weird eyes, missing nose, bad teeth, malformed lips, unrealistic facial proportions` | 強制五官對稱，避免鬥雞眼、大小眼，或是張嘴時出現恐怖的牙齒結構。 |
| **畫質與渲染防護** | 低畫質與模糊防護 | `worst quality, low quality, normal quality, lowres, blurry, out of focus, jpeg artifacts, pixelated` | 強制模型提升輸出解析度與清晰度，避免出現像素化、邊緣模糊或壓縮產生的鋸齒亮斑。 |
| **畫質與渲染防護** | 浮水印與文字防護 | `watermark, text, signature, logo, username, typography, letters, stamped` | 避免 AI 模仿圖庫網站（如 Getty Images）而在畫面中隨機生成無意義的浮水印、簽名或亂碼文字。 |
| **畫質與渲染防護** | 邊框與裁切防護 | `cropped, out of frame, cut off, border, frame, white margins` | 確保人物或主體不會被不自然的裁切在畫布邊緣，同時避免生成相框狀的邊框（除非刻意要求拍立得）。 |
| **風格與寫實度防護** | 3D / CG 渲染防護 | `3D render, CGI, octane render, unreal engine, plastic skin, smooth skin, doll, toy, artificial` | 為了維持「寫實攝影」的質感，必須剔除任何帶有塑膠感、假人感或 3D 動畫引擎渲染效果的特徵。 |
| **風格與寫實度防護** | 2D / 插畫風格防護 | `illustration, painting, drawing, sketch, anime, cartoon, monochrome painting, vector art, flat color` | 防止生圖變成二次元動漫、手繪素描或油畫，維護真實物理世界的光影與三維立體感。 |
| **風格與寫實度防護** | 過度修圖防護 | `oversaturated, overly bright, bleached, artificial lighting, overly smooth face, heavy makeup filter` | 避免畫面呈現出如「美圖秀秀」般極端不自然的美顏濾鏡感、死白膚色或刺眼的過高飽和度。 |
| **場景與物理防護** | 漂浮與反重力防護 | `floating objects, defying gravity, floating limbs, flying, unconnected items, messy physics` | 確保畫面中（特別是室內場景）的物件符合重力邏輯，避免杯子、椅子等物品懸浮在半空中。 |
| **場景與物理防護** | 背景干擾物防護 | `messy background, cluttered space, distracting background elements, messy room, trash` | 適用於需要凸顯人物的棚拍或商業攝影，強制清除背景中多餘的雜物與干擾視線的髒亂。 |
| **場景與物理防護** | 錯誤透視防護 | `bad perspective, warped architecture, distorted buildings, twisted walls, physically impossible architecture` | 特別針對都市街景或室內空間，防止建築物、牆壁與背景街道出現扭曲變形，如全面啟動般的空間坍塌。 |
| **服裝與材質防護** | 服裝穿模防護 | `clothing clipping through skin, missing clothes, floating clothes, inconsistent fashion, merging fabrics` | 避免皮膚與衣物邊緣融合、衣服懸空，或是上衣跟下裝的材質不可理喻地縫合在一起。 |
| **特定主題防護 (依需求加入)** | 自然派防護 (剔除不自然元素) | `artificial light, studio light, flash, posed, fake, unnatural colors, synthetic nature` | 當「AI 攝影師」選擇了自然或戶外主題時加入。避免自然環境中出現明顯的棚內反光板或人造光的斧鑿痕跡。 |
| **特定主題防護 (依需求加入)** | 黑暗恐怖防護 (維持唯美) | `horror, scary, gore, blood, creepy, zombie, grotesque, macabre, disturbing` | 除非主題為 BDSM 或廢墟，否則即使在暗調光影下，也必須加入此組以防止畫面過度恐怖或出現血腥驚悚元素。 |
| **特定主題防護 (依需求加入)** | 過度暴露防護 (維持時尚) | `nsfw, explicit, nude, naked, highly revealing, pornographic, lewd` | 確保大尺度內衣或泳裝攝影僅停留在「性感與時尚」的邊界，防止生成被審查的成人限制級畫面。 |
| **特定主題防護 (依需求加入)** | 現代物品防護 (針對復古主題) | `modern technology, smartphone, modern cars, led lights, contemporary clothing, digital screen` | 拍攝維多利亞、巴洛克或古典主題時必加。防止畫面上出現手機、現代汽車或電子螢幕這類破壞時代感的物品。 |
