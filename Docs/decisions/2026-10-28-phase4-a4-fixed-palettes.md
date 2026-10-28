# A4 固定配色套裝決策

基準 `37f24aa8fb87633fd87e7fff44258291f862f5c8`，A3 CI 40635766241 全數成功。[規格](../specs/phase4-a4-fixed-palettes-v1.md)。

原十二筆是完整且有辨識性的作者配色，不適合移除 burgundy／white／black／red 等詞把衣物泛化，也不應把額外主色疊到原文前面。本批保留所有原文，僅加 meta.colorMode=fixed，renderer／摘要／有效控制依同一責任處理。schema 既有 colorMode 為 string，本批不擴充 schema 欄位或發新 ID。

| 永久 ID | 名稱 | 決策 |
| --- | --- | --- |
| `wardrobe:套裝-outfit-presets:套裝-白蕾絲泡袖七分褲:39` | 白蕾絲泡袖七分褲 | 保留作者配色；不加 runtime 配色 |
| `wardrobe:套裝-outfit-presets:套裝-粉針織罩衫寬牛仔:40` | 粉針織罩衫寬牛仔 | 保留作者配色；不加 runtime 配色 |
| `wardrobe:套裝-outfit-presets:套裝-深灰短背心氣球寬褲:41` | 深灰短背心氣球寬褲 | 保留作者配色；不加 runtime 配色 |
| `wardrobe:套裝-outfit-presets:套裝-白襯衫緞面背心寬牛仔:42` | 白襯衫緞面背心寬牛仔 | 保留作者配色；不加 runtime 配色 |
| `wardrobe:套裝-outfit-presets:套裝-西裝外套蕾絲迷你洋裝:43` | 西裝外套蕾絲迷你洋裝 | 保留作者配色；不加 runtime 配色 |
| `wardrobe:套裝-outfit-presets:套裝-球衣荷葉迷你裙:44` | 球衣荷葉迷你裙 | 保留作者配色；不加 runtime 配色 |
| `wardrobe:套裝-outfit-presets:套裝-綁帶針織寬牛仔:45` | 酒紅綁帶針織寬牛仔 | 保留作者配色；不加 runtime 配色 |
| `wardrobe:套裝-outfit-presets:套裝-運動外套荷葉七分褲:46` | 運動外套荷葉七分褲 | 保留作者配色；不加 runtime 配色 |
| `wardrobe:套裝-outfit-presets:套裝-白蕾絲長罩衫牛仔褲:47` | 白蕾絲長罩衫牛仔褲 | 保留作者配色；不加 runtime 配色 |
| `wardrobe:套裝-outfit-presets:套裝-spider-man-cosplay-緊身衣:56` | Spider-Man Cosplay 緊身衣 | 保留作者配色；不加 runtime 配色 |
| `wardrobe:套裝-outfit-presets:套裝-venom-cosplay-緊身衣:57` | Venom Cosplay 緊身衣 | 保留作者配色；不加 runtime 配色 |
| `wardrobe:套裝-outfit-presets:套裝-spider-gwen-cosplay-緊身衣:58` | Spider-Gwen Cosplay 緊身衣 | 保留作者配色；不加 runtime 配色 |

十二筆 fixed 套裝在主色、對比色、舊配色、完整色系或特殊上下配色殘留時，保留原衣物顏色；latent 選值仍保存，不改抽樣次序。其他可配色套裝與角色 B 保持原責任。近景／外套仍沿原可見性規則。UI 隱藏不生效控制並在原提示樣式說明，切換可配色套裝恢復控制。

固定 Git 無額外配色為獨立文字 oracle：2,077 案例、6,232 次生成、48 次新舊抓拍／重抽與 8 次存檔往返通過。原卡公開原文／已凍結 importedPerson 不批次重寫；新生成及重新匯入採 fixed。

一個舊雙人 fixture 原要求深灰套裝套用丹寧色系，改成保留 dark gray／light gray 並禁止丹寧覆寫；另一角色銀灰金屬色系斷言保留。沒有改 A～E 或任何已封存 baseline。
