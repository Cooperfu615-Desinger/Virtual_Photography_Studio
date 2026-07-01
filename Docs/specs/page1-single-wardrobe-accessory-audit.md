# PAGE1 單件服飾與配件資料庫 QA 審核

審核日期：2026-07-01
審核角色：QA / 文案一致性檢查
最高現況依據：`Docs/current_project_state.md`
本次不直接修改 pipeline，也不直接改動 wardrobe source data；此文件只列出問題與建議修正文案。

## 審核範圍

- `knowledge_base/wardrobe_and_styling.md`：單件服飾與配件資料庫描述，重點掃描 `Tops`、`Pants`、`Skirts`、`Legwear`、`Outerwear`、`Shoes`、`Head Accessories`、`Eyewear`、`Earrings`、`Neck Accessories`。
- `webapp/src/lib/engine.js`：`topFit`、`topStyling`、`bottomFit`、`bottomRise`、`outerwearFit`、`outerwearOpening`、`outerwearStyling`、legwear / long-bottom / outerwear layering guards。
- 參考規則：`Docs/specs/wardrobe-section-b-authoring-guide.md` 的 Section B 原則，尤其是「一個欄位只負責一件事」、「單件 prompt 不預設情境/攝影/人像」、「配色由 color lock 控制」、「fit/styling/rise 是 modifier，不應寫死在單品」。

## 總結

整體資料庫已比早期版本乾淨許多，大部分單件 prompt 都能維持「服裝結構、材質、輪廓」的責任邊界。主要隱藏問題不是資料不能用，而是部分條目為了穩定生成，把穿法、內外層可見性、固定顏色、情境 mood、或避免語句直接寫進單件描述；這會在 PAGE1 組合式穿搭中和 color / fit / styling / rise / layering controls 互相搶控制權。

最高優先問題集中在：

1. 單件上身寫死內衣肩帶、顏色或穿法。
2. 下身/裙裝把腰線、情境、配件或完整穿搭語氣寫進單件。
3. 外套 opening / styling / layering guards 使用過強的「完整、只、不要、可見」語氣。
4. 商品型鞋款、耳機與固定色細節需要明確標成 signature exception，否則會和配色控制衝突。
5. `丹寧吊帶長褲 / 短褲` 實質是 one-piece/bib garment，放在 Pants 會和 Top 欄位產生穿法衝突。

## 高優先問題與建議修正文案

| ID | 來源 | 問題 | 風險 | 建議英文 prompt |
| --- | --- | --- | --- | --- |
| T-01 | `wardrobe_and_styling.md:163` 一字領上衣 | `visible white bra straps` 寫死白色內衣肩帶，且把內層/配件可見性放進上身單品。 | 會覆蓋上身配色，也可能在未選內衣/肩帶時生成額外內層。 | `off-shoulder top, soft neckline silhouette, open collarbone line, refined neckline detail` |
| T-02 | `wardrobe_and_styling.md:162` 平口上衣 | `strapless tube top` 同時允許 `halter-bandeau structure`，無肩帶與掛脖結構語意互斥。 | 模型可能同時生成平口與掛脖帶。 | `strapless tube top, clean upper edge, smooth stretch fabric, compact bandeau structure` |
| T-03 | `wardrobe_and_styling.md:177` 蕾絲胸罩 | `delicate straps or strapless structure` 同一選項包含有肩帶/無肩帶兩種結構。 | 和外套/細肩帶 layering guard 互相干擾。 | `lace bra top, delicate strap construction, floral lace, scalloped trim, refined lingerie detailing` |
| T-04 | `wardrobe_and_styling.md:172` 素色緞面旗袍上衣 | `untucked hem worn loose over the waistline` 把 topStyling 寫死在單品。 | 和「紮入下身 / 半紮」控制矛盾。 | `satin cheongsam-style top, elegant mandarin collar, fitted upper-body silhouette, frog-button detail, smooth lustrous fabric, hip-grazing hem` |
| T-05 | `wardrobe_and_styling.md:173` 精緻刺繡旗袍上衣 | 同 T-04，另有 `refined Chinese-inspired detail` 尚可，但不應綁定衣襬放出。 | 和 topStyling / waistline controls 搶權。 | `embroidered cheongsam-style top, elegant mandarin collar, fitted upper-body silhouette, frog-button detail, intricate floral embroidery, hip-grazing hem` |
| T-06 | `wardrobe_and_styling.md:176` 比基尼上身 | `clean beachwear styling` 是情境/造型語氣，不是單件結構。 | 在非海邊場景會污染 scene mood。 | `triangle bikini top, slim halter strings, minimal sliding triangle cups, smooth stretch swim fabric` |
| T-07 | `wardrobe_and_styling.md:178` 運動型內衣 | `Calvin Klein-inspired` 是品牌參考，`activewear styling` 是造型語氣。 | 泛用資料庫會產生品牌/風格污染。 | `sports bra top, clean elastic underband, smooth technical jersey, minimal athletic seaming` |
| T-08 | `wardrobe_and_styling.md:180` 波西米亞風上衣 | `loose untucked hem` 寫死穿法。 | 和 topStyling 的 tucked / half-tucked 矛盾。 | `bohemian draped blouse, crinkled gauze or washed rayon, deep relaxed neckline, layered sleeves, folk-woven trim` |
| B-01 | `wardrobe_and_styling.md:227` 低腰牛仔褲 | `exposed waist styling` 把上身露腰效果寫進下身。 | 和長版上衣、自然放出、低腰相容性 guard 矛盾。 | `low-rise jeans, waistband sitting on the hips, casual denim silhouette, clean denim structure` |
| B-02 | `wardrobe_and_styling.md:232` 蕾絲內褲 | `delicate intimate styling` 與中文描述偏向情境化。 | 下身單品可能主導整體寫真語氣。 | `low-rise lace underwear bottoms, delicate lace texture, close-fitting hip line, compact lower-body structure` |
| B-03 | `wardrobe_and_styling.md:233` 蕾絲丁字褲 | `exposed buttock curve` 是可見性/身體曲線控制，超出單品責任。 | 可能和 framing、pose、上身/外套優先順序衝突。 | `seamless lace thong bottoms, ultra-thin side straps, low-rise V-front, minimal back panel` |
| B-04 | `wardrobe_and_styling.md:248` 比基尼下身 | `clean beachwear silhouette` 帶場景語氣。 | 會把 swimwear 推向海邊情境。 | `low-rise side-tie bikini bottoms, string-tied hips, minimal swimwear coverage, clean swim-bottom silhouette` |
| B-05 | `wardrobe_and_styling.md:249` 波西米亞風長褲 | `earthy layered tones` 與 `resort mood` 寫死色系與情境。 | 和 bottomColor / scene selection 衝突。 | `bohemian draped trousers, loose soft volume, washed rayon or crinkled cotton fabric, gathered relaxed waist, folk-pattern panels` |
| B-06 | `wardrobe_and_styling.md:250` 丹寧吊帶長褲 | 吊帶褲實質包含上身 bib/strap，不是純 bottom。 | 若同時選 Top，容易出現上衣和吊帶上身互相穿插。 | 短期文案：`full-length denim overalls, bib-front utility construction, shoulder straps, relaxed wide-leg denim silhouette`。長期建議移到 `Dresses / Outfit Presets / One-piece Garments`。 |
| B-07 | `wardrobe_and_styling.md:251` 丹寧吊帶短褲 | 同 B-06，且 `summer mood` 是情境語氣。 | 和 Top、場景、季節語氣衝突。 | 短期文案：`denim short overalls, bib-front utility construction, shoulder straps, compact short-bottom silhouette`。長期建議移到 one-piece 類別。 |
| S-01 | `wardrobe_and_styling.md:260` 龐克格紋百褶裙 | `black belt with silver buckle hardware` 寫死配色，且皮帶/鏈條較像配件。 | 和 bottomColor、accessory controls 衝突。 | `punk tartan pleated skirt, plaid pleats, belt-loop hardware, safety-pin and chain-inspired trim` |
| S-02 | `wardrobe_and_styling.md:279` 波西米亞風長裙 | `earth-tone fabric` 與 `resort elegance` 寫死色系與情境。 | 和 skirt color、scene mood 衝突。 | `bohemian layered maxi skirt, soft tiered panels, washed crinkled fabric, folk-pattern borders, relaxed gathered movement` |
| S-03 | `wardrobe_and_styling.md:277` 蘿莉塔鐘形澎裙 | `petticoat underneath` 直接生成隱藏內層。 | 若外層/裙長/透膚控制不同，可能變成可見內襯衝突。 | `Lolita bell-shaped skirt, petticoat-supported volume, ruffled tiers, structured bell silhouette` |
| L-01 | `wardrobe_and_styling.md:300` 膝上蕾絲吊帶襪 | `visible garter straps` 要求吊帶可見。 | 和長褲/長裙的 legwear secondary guard 矛盾。 | `thigh-high sheer garter stockings, lace top band, delicate garter-strap detail when naturally visible` |
| O-01 | `wardrobe_and_styling.md:332` 外套敞開穿 | `inner layer visible through the full front opening` 過度要求內層可見。 | 和 no top、close-up crop、外套作主體時衝突。 | `outerwear worn open at the front, front panels parted naturally` |
| O-02 | `wardrobe_and_styling.md:336` 外套正常穿著 | `over the top`、`shoulder line fully covered` 太絕對。 | 會壓掉一字領、細肩帶、透明外套、短袖披衣等合理可見性。 | `outerwear worn normally on both shoulders in a standard outer-layer position` |
| O-03 | `wardrobe_and_styling.md:337` 外套滑落肩部 | `intentionally`、`one or both shoulders`、`intact outer layer` 語氣重。 | 容易和外套 opening、pose、內搭肩帶交錯。 | `outerwear slipped below the shoulder line, sleeves loosely on the arms, jacket body still readable as an outer layer` |
| SH-01 | `wardrobe_and_styling.md:347` 赤腳 | `visible toes` 是 framing/visibility 控制，不是鞋款本體。 | 在非全身構圖或腳部不可見時會拉扯 framing。 | `bare feet, natural barefoot state` |
| A-01 | `wardrobe_and_styling.md:376` 耳罩式耳機（掛在脖子上） | 放在 Head Accessories，但實際位置是 neck/collar。 | 和 Neck Accessories、choker、scarf、outerwear collar 競爭位置。 | `Marshall Major V on-ear headphones resting around the neck, compact earcups, slim structured headband at the collar`；長期建議拆成 accessory + placement control。 |
| A-02 | `wardrobe_and_styling.md:408` 皮質扣環頸鏈 | `not a wide belt-like collar` 是負向防呆語。 | 負向語句可能污染 final prompt，也和文件規則「避免 over-control」不一致。 | `thin leather buckle choker detail, narrow slim leather strap around the neck, subtle edgy neck accent` |

## 中低優先與可接受例外

| 類別 | 發現 | 建議 |
| --- | --- | --- |
| 商品型鞋款 | `ADIZERO EVO SL JS4506`、`Samba OG`、`Dr. Martens`、`Nike P-6000`、`Onitsuka Tiger Mexico 66` 都使用品牌/型號。Dr. Martens 的 `yellow welt stitching` 是固定色。 | 若保留商品型資料，建議在資料註記或 authoring guide 裡標成 `signature product exception`。若要完全泛用化，改成 `running shoes with speed-runner shape`、`low-profile terrace sneakers`、`chunky lace-up leather shoes with signature welt stitching`。 |
| 耳機 | `black Marshall Major V` 寫死品牌與黑色。 | 若這是指定商品，標成 signature exception；若要泛用，改成 `compact on-ear headphones, slim structured headband`，顏色交由 accessory color 控制。 |
| 眼鏡配色 / 金色項鍊 | `black frame`、`white frame`、`gold chain` 等固定色由選項名稱本身決定。 | 可接受，不算衝突。只要未來新增 accessory color control，需避免雙重上色。 |
| 透膚材質 | `semi-sheer`、`sheer lace`、`translucent gauze` 出現在透膚上衣、透膚裙、薄紗外套。 | 可接受，因為材質本身就是品類特徵；但不要再同時加 `opaque` 或強制可見內層。 |
| `全無` 選項 | 多數 `全無` 英文 prompt 含 `no ... styling`，例如 no top、no pants、no outerwear。 | engine 目前會透過 `isNoneLikeItem` 抑制，實際 prompt 通常不輸出；若日後資料被外部工具直接使用，建議全部改空字串。 |
| Surface Design 固定色 | `黑白`、`紅黑` 圖案選項本身有固定色。 | 若 label 已明確寫黑白/紅黑，固定色可接受；若和 garment color lock 同時使用，建議把圖案視為 `pattern palette override`，避免主布配色被污染。 |

## Fit / Styling / Rise / Layering Controls 審核

### 目前可保留的控制

- `bottomRise` 的 `扣子解開拉鏈微開` 目前有 `getApplicableBottomRise()` guard，只套用在 Pants，不會直接套到 Skirts。這是正確保護。
- `topFit` / `bottomFit` 多數文案是結構 modifier，沒有明顯情境污染。
- legwear + long bottom guard 已經知道長褲/長裙下襪類應是次要可見，方向正確。

### 建議降低控制語氣的文案

| 來源 | 現有語氣問題 | 建議改寫方向 |
| --- | --- | --- |
| `engine.js:7913` low-rise + untucked top | `fully covering`、`no accidental midriff exposure` 太絕對，可能壓掉低腰美學。 | `top hem overlaps the low-rise waistband unless a cropped top is selected` |
| `engine.js:7917` low-rise + tucked top | `properly tucked`、`not cropped` 偏規訓。 | `top hem tucks into the low-rise waistband with a natural low-rise proportion` |
| `engine.js:7920` low-rise default | `abdomen covered`、`not cropped into...` 太強。 | `top length meets or slightly overlaps the low-rise waistband` |
| `engine.js:7998` long top + shorts | `shorts only peek out`、`do not tuck` 是硬限制。 | `long top falls over the waistband, with shorts partly visible below the hem` |
| `engine.js:8002` outerwear over top/dress | `complete outer layer`、`properly worn`、`inner garment remains visible only...` 太強。 | `outerwear remains a coherent outer layer; inner garment appears at natural openings` |
| `engine.js:8006` strappy dress under outerwear | `do not turn...` 是負向防呆。 | `thin straps read as the inner dress; outerwear keeps its own shoulder construction` |
| `engine.js:8010` strappy top under outerwear | `keep ... complete and structurally clean` 可更短。 | `thin straps read as the inner top; outerwear keeps a separate shoulder structure` |
| `engine.js:8014` legwear under long bottom | `do not force full socks...` 是負向控制。 | `legwear stays secondary, appearing near hems or openings when naturally visible` |
| `engine.js:8018` long bottom + shoes | `without distorting` 是負向，但風險較低。 | `long bottom keeps its natural drape while footwear remains normally readable` |

## 建議修文原則

1. 單件只描述本體：品類、剪裁、材質、輪廓、必要結構。
2. 顏色交由 color lock，除非選項名稱本身就是固定色或 signature product。
3. 穿法交由 styling controls；不要在上身單品寫 `tucked`、`untucked`、`worn loose over the waistband`。
4. 腰線交由 rise controls；不要在下身單品額外要求 `exposed waist styling`。
5. 可見性只在必要 guard 使用，並盡量用正向描述，不用 `do not`、`no accidental`、`only`、`fully`。
6. 配件保持低干擾，但不要用負向防呆句；用更精確的正向尺寸/位置描述取代。
7. 實質 one-piece 的項目不要放在 pure bottom；若短期不能移類別，至少文件註記「不可與 Top 任意疊加」。

## 建議後續執行順序

1. 先修 T-01、T-04、T-05、B-01、B-06、B-07、L-01、O-01、O-02、O-03，這些最容易造成實際穿搭矛盾。
2. 第二批處理品牌/固定色例外：鞋款、Marshall 耳機、紅黑/黑白圖案。
3. 第三批再微調 engine guard 的語氣，優先把負向句改為短的正向 guard。
4. 若改動 `knowledge_base/wardrobe_and_styling.md`，再跑 `python3 scripts/sync_to_json.py`，並補 PAGE1 prompt snapshot / engine tests，確認 Gpt / Grok-Z / AI 三段輸出沒有回歸。
