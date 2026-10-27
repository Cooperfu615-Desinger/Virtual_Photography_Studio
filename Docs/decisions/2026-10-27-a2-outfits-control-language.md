# A2 第二批套裝控制語：逐筆配色責任

基準 `048a2348869c9348d18f4e0b71d4ceed92c69232`。40 筆逐一核對正式 JSON、原 shared builder 與配色 helper。這是控制語來源搬移；保留原有 colorMode／colorTargets／lockedOptional 及材質分支，不修正其歷史政策。

19 筆結構化路徑的原文綁定保留精確 target 與原順序；通用 21 筆不新增目標。primaryMaterial 欄標示原控制句是否會先被舊 strip 移除；它只保留原執行順序。

| ID／名稱 | 路徑 | 主色對應 | 對比色對應 | 固定色責任 | 材質色票下略過的舊綁定 |
| --- | --- | --- | --- | --- | --- |
| `wardrobe:套裝-outfit-presets:套裝-鏈條緞面內衣:1`<br>鏈條緞面內衣套裝 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-春日巴黎亞麻長褲:3`<br>春日巴黎亞麻長褲套裝 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-長版襯衫百褶長裙:4`<br>長版襯衫百褶長裙套裝 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-西裝長褲:5`<br>西裝長褲套裝 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-秘書短裙:6`<br>秘書短裙套裝 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-空服員制服:7`<br>空服員制服套裝 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-護士制服:8`<br>護士制服套裝 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-醫生診療袍:9`<br>醫生診療袍套裝 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-維多利亞古典:11`<br>維多利亞古典套裝 | primary_contrast | dominant fabric color | 既有 colorTargets fallback：lace, collar, corset_lines, ruffle_accents | 無 | dominant fabric color |
| `wardrobe:套裝-outfit-presets:套裝-蘿莉塔:12`<br>蘿莉塔套裝 | primary_contrast | dominant fabric color | 既有 colorTargets fallback：frills, bows, hem_trim | 無 | dominant fabric color |
| `wardrobe:套裝-outfit-presets:套裝-內衣寫真:13`<br>內衣寫真套裝 | primary_contrast | lingerie base | lace panels ribbons and trim | 無 | 無 |
| `wardrobe:套裝-outfit-presets:套裝-泳裝度假:14`<br>泳裝度假套裝 | primary_contrast | dominant swim fabric color | 既有 colorTargets fallback：tie_details, trim, cover_up_layer | 無 | dominant swim fabric color |
| `wardrobe:套裝-outfit-presets:套裝-素色緞面旗袍:15`<br>素色緞面旗袍套裝 | primary | dominant satin color | 既有 colorTargets fallback： | 無 | dominant satin color |
| `wardrobe:套裝-outfit-presets:套裝-精緻刺繡旗袍:16`<br>精緻刺繡旗袍套裝 | primary_contrast | dominant base color | 既有 colorTargets fallback：embroidery | 無 | 無 |
| `wardrobe:套裝-outfit-presets:套裝-經典和服:17`<br>經典和服套裝 | primary_contrast | dominant textile color | 既有 colorTargets fallback：obi_sash, collar_layers | 無 | dominant textile color |
| `wardrobe:套裝-outfit-presets:套裝-輕盈浴衣:18`<br>輕盈浴衣套裝 | primary_contrast | dominant textile color | 既有 colorTargets fallback：obi_sash | 無 | dominant textile color |
| `wardrobe:套裝-outfit-presets:套裝-兔女郎:19`<br>兔女郎套裝 | primary_contrast_locked | main fabric color | contrast details | optional_classic_white_cuff_collar_scheme | main fabric color |
| `wardrobe:套裝-outfit-presets:套裝-女僕:20`<br>女僕套裝 | primary_contrast_locked | main fabric color | apron and ruffle contrast | optional_classic_white_apron_scheme | main fabric color |
| `wardrobe:套裝-outfit-presets:套裝-女僕風荷葉比基尼:21`<br>女僕風荷葉比基尼套裝 | primary_contrast | main fabric color | ruffle contrast | 無 | main fabric color |
| `wardrobe:套裝-outfit-presets:套裝-短袖女高生水手服:22`<br>短袖女高生水手服 | primary_contrast_locked | dominant uniform color | 既有 colorTargets fallback：scarf, sailor_trim_lines | optional_fixed_school_trim_colors | dominant uniform color |
| `wardrobe:套裝-outfit-presets:套裝-長袖女高生水手服:23`<br>長袖女高生水手服 | primary_contrast_locked | dominant uniform color | 既有 colorTargets fallback：scarf, sailor_trim_lines | optional_fixed_school_trim_colors | dominant uniform color |
| `wardrobe:套裝-outfit-presets:套裝-玫瑰哥德蘿莉塔洋裝:24`<br>玫瑰哥德蘿莉塔洋裝套裝 | primary_contrast_locked | main fabric color | contrast trim | decorative_metal_ring, optional_preserved_rose_print_palette | main fabric color |
| `wardrobe:套裝-outfit-presets:套裝-哥德休閒針織荷葉短裙:25`<br>哥德休閒針織荷葉短裙套裝 | primary_contrast | main fabric color | contrast panels | 無 | main fabric color |
| `wardrobe:套裝-outfit-presets:套裝-豹紋蕾絲抹胸喇叭牛仔:26`<br>豹紋蕾絲抹胸喇叭牛仔 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-網紗掛脖背心牛仔迷你裙:27`<br>網紗掛脖背心牛仔迷你裙 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-天使翅膀三角比基尼:28`<br>天使翅膀三角比基尼 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-透視背心漆皮短褲長靴:29`<br>透視背心漆皮短褲長靴 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-馬甲吊帶喇叭褲:30`<br>馬甲吊帶喇叭褲 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-豹紋荷葉吊帶漆皮短褲:31`<br>豹紋荷葉吊帶漆皮短褲 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-金屬三角比基尼:33`<br>金屬三角比基尼 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-單肩短上衣印花圍裙短裙:34`<br>單肩短上衣印花圍裙短裙 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-垂墜背心腰鏈短裙:35`<br>垂墜背心腰鏈短裙 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-皮革掛脖背心短褲長靴:36`<br>皮革掛脖背心短褲長靴 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-斑馬紋馬甲短褲長靴:37`<br>斑馬紋馬甲短褲長靴 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-短版運動t熱褲:38`<br>短版運動T熱褲套裝 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-浴巾裹身:48`<br>浴巾裹身 | generic | 既有通用主色／雙色路徑，不新增部位 | 雙色時原 secondary garment color；單獨對比色維持原行為 | 無 | 原通用材質規則 |
| `wardrobe:套裝-outfit-presets:套裝-粉紅哥德兔耳吊帶束身:51`<br>粉紅哥德兔耳吊帶束身 | primary_contrast_locked | main fabric color | lace ribbons garter straps and trims；cross decorations | cross_appliques, metal_cross_pendant, leather_choker_hardware | 無 |
| `wardrobe:套裝-outfit-presets:套裝-米白緞面蕾絲馬甲短裙:52`<br>米白緞面蕾絲馬甲短裙 | primary_contrast | satin base | lace cord eyelet and bow details | 無 | 無 |
| `wardrobe:套裝-outfit-presets:套裝-哥德圖示包臀迷你裙:53`<br>白色哥德圖示包臀迷你裙 | primary_contrast | dress base | lace trims and gothic hand-drawn graphics | 無 | 無 |
| `wardrobe:套裝-outfit-presets:套裝-網狀蕾絲馬甲短裙長靴:54`<br>網狀蕾絲馬甲短裙長靴 | primary | all fabric garments and boots | 既有 colorTargets fallback： | grommets, chain_charms, dangling_metal_hardware, delicate_metal_necklace, metal_earrings（此模式原本不啟動；保持） | 無 |

## 保留的差異與追溯

- 每筆完整 before／after、generated before／after、移除子句與綁定值保存於 `scripts/lib/a2OutfitControlReview.json`；可對固定 Git 逐欄驗證，所有 alias 只尾端追加。
- 六筆固定色模式的 optional/fixed 輸出保持，沒有新增「無色時固定為某色」的推論。網狀蕾絲套裝的 inactive locked metadata 原樣保留。
- 粉紅哥德兔耳的十字裝飾對比色與金屬固定色範圍有既存重疊，本次以原實際輸出為相容性依據；新 helper 不合併、不重新分配、不擴寫。
- 短版運動T套裝是通用路徑，原 `contrast trim controlled by contrast palette` 殘留清除；既有雙色表示與衣領、袖邊、短褲滾邊的視覺來源保留，不額外啟用新的 trim 專用配色能力。
- 21 筆來源中即使舊 renderer 已遮掉控制語，仍清除正式來源並保留原文 alias；部分由舊 regex 留下的無意義片語亦隨來源清除，不更改 regex。
- 特殊穿搭、完整造型 runtime 指示、其他 Phase 4 與 P5b 另案。

[規格](../specs/wardrobe-control-a2-outfits-v1.md) · [驗收報告](../reports/wardrobe-control-a2-outfits-2026-10-27/README.md)

## 驗收中確認的相容性限制

- 40 筆公開衣物來源沒有新增或重新指定固定色；19 筆結構化綁定共 29 項，保留原目標字句、次序與已選色票的輸出方式。材質路徑原 regex 留下的無意義片段隨整句控制語移除。
- 舊 Markdown 的 21 筆套裝 ID 辨識改善與 8 筆既有 red 誤推測轉移，詳見規格的「舊 Markdown」段及精確 fixture。原公開文字未改寫；JSON 完整選值與舊快照另做精確驗收。這項限制保留為後續獨立決策，未修改解析器。
- 新歷史回放層先驗證 40 筆來源／生成資料／Markdown 與完整程式雜湊，再於隔離副本還原；A2 第一批歷史 helper 只增加接線，原 A2／A1／四批 A5 驗收工具與 A～E、A5、A1、A2 第一批報告不重錄。
