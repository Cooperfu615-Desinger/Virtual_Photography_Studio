# D 原樣凍結的語意問題（2026-10-25）

基準：`17074fbe3850e2e9fea300b36697643913f707a1`。依 [v1.1 §6.1.4](../../specs/catalog-data-architecture-v1.md#614-已知錯誤標籤原樣凍結)保留現行結果；本文件不是 strict 允許清單，也不授權修正或 P5b。狀態一律為「D 原值保留，待後續獨立語意審查」。

重新清點方法：取固定 pre-D 引擎及 database，僅在記憶體將 Locations 的 small 換成 compact，再經同一引擎編譯，確認失去 commercial 的恰為 17 筆。這證明 substring 觸發，不代表所有商業場景都不該有 commercial。倫敦原文 drainage pipes 命中 drainage，得到 subterranean。

影響驗證：一般單人、全身景別，各有效室內／戶外屬性下，分別只在副本移除該標籤，再比較環境光與主體光候選 ID。以下「前→移除後」是隔離診斷，不是本次產品變更；相同數量也核對有序 ID。完整參數與名單見 [量測 JSON](../catalog-architecture-d-2026-10-25/known-issues.json)。

| 既有 ID | 問題欄位／值 | 候選池影響（前→移除後） |
| --- | --- | --- |
| `locations:生活感室內-indoor-lifestyle:室內-臥室窗邊:6` | `meta.semantic.tags` 中 `commercial` | indoor：環境光 16→16；主體光 23→23，有序 ID 無差異 |
| `locations:生活感室內-indoor-lifestyle:室內-更衣室-試衣間:10` | `meta.semantic.tags` 中 `commercial` | indoor：環境光 16→16；主體光 23→23，有序 ID 無差異 |
| `locations:生活感室內-indoor-lifestyle:室內-英式小旅館房間:18` | `meta.semantic.tags` 中 `commercial` | indoor：環境光 16→16；主體光 23→23，有序 ID 無差異 |
| `locations:生活感室內-indoor-lifestyle:室內-傳統酒吧二樓包廂:19` | `meta.semantic.tags` 中 `commercial` | indoor：環境光 16→16；主體光 23→23，有序 ID 無差異 |
| `locations:生活感室內-indoor-lifestyle:室內-黑膠唱片聆聽角:21` | `meta.semantic.tags` 中 `commercial` | indoor：環境光 16→16；主體光 23→23，有序 ID 無差異 |
| `locations:生活感室內-indoor-lifestyle:室內-女高生房間:24` | `meta.semantic.tags` 中 `commercial` | indoor：環境光 16→16；主體光 23→23，有序 ID 無差異 |
| `locations:生活感室內-indoor-lifestyle:室內-狹小都會旅館房間:38` | `meta.semantic.tags` 中 `commercial` | indoor：環境光 16→16；主體光 23→23，有序 ID 無差異 |
| `locations:地下與廢墟風格-abandoned-underground:室內-廢棄校舍保健室:13` | `meta.semantic.tags` 中 `commercial` | indoor：環境光 16→16；主體光 23→23，有序 ID 無差異 |
| `locations:城市與社群感-urban-social-snapshots:室內-無人月台長椅區:4` | `meta.semantic.tags` 中 `commercial` | indoor：環境光 16→16；主體光 23→23，有序 ID 無差異 |
| `locations:城市與社群感-urban-social-snapshots:室內-電車車廂正面長椅視角:8` | `meta.semantic.tags` 中 `commercial` | indoor：環境光 16→16；主體光 23→23，有序 ID 無差異 |
| `locations:城市與社群感-urban-social-snapshots:室內-電車車廂坐滿與站滿乘客:10` | `meta.semantic.tags` 中 `commercial` | indoor：環境光 16→16；主體光 23→23，有序 ID 無差異 |
| `locations:城市與社群感-urban-social-snapshots:戶外-八公銅像旁行人區:12` | `meta.semantic.tags` 中 `commercial` | outdoor：環境光 19→19；主體光 23→23，有序 ID 無差異 |
| `locations:城市與社群感-urban-social-snapshots:戶外-目黑川旁的櫻花隧道:14` | `meta.semantic.tags` 中 `commercial` | outdoor：環境光 19→19；主體光 23→23，有序 ID 無差異 |
| `locations:城市與社群感-urban-social-snapshots:戶外-新宿歌舞伎町販賣機旁:31` | `meta.semantic.tags` 中 `commercial` | outdoor：環境光 19→19；主體光 23→23，有序 ID 無差異 |
| `locations:城市與社群感-urban-social-snapshots:戶外-倫敦排屋街道:41` | `meta.semantic.tags` 中 `subterranean` | outdoor：環境光 5→19；主體光 23→23，候選 ID 有差異 |
| `locations:自然與戶外-nature-outdoors:戶外-清澈海灣岩岸:1` | `meta.semantic.tags` 中 `commercial` | outdoor：環境光 19→17；主體光 23→23，候選 ID 有差異 |
| `locations:自然與戶外-nature-outdoors:戶外-草地與樹木:3` | `meta.semantic.tags` 中 `commercial` | outdoor：環境光 19→17；主體光 23→23，候選 ID 有差異 |
| `locations:其他專屬場景-other-dedicated-scenes:其他-生活感日式榻榻米房間:2` | `meta.semantic.tags` 中 `commercial` | indoor：環境光 16→16；主體光 23→23，有序 ID 無差異 |

倫敦的現行環境光只保留全無、清晨薄霧、雨天陰濕、雨後反光、雪地冷光；移除 subterranean 的隔離副本為 19 項。清澈海灣岩岸／草地與樹木移除 commercial 後由 19 減為 17 項；其餘上述測量沒有有序候選差異。未對所有鎖值、景別、模式和 prompt 組合窮舉，不能由單一候選池無差異推定全面無影響。

後續每筆修正的驗收條件：另立核准規格，判斷實際場景語意與應保留的標籤；固定 ID、原文、種子與鎖值，列出候選池／解析選值／全部公開輸出／Saved Cards 還原差異，新增專用 fixture，再跑資料完整性、prompt-quality、前端全套及桌手機驗收。不得改寫 A、B、C 或 D 遷移基準來消除產品變更差異。
