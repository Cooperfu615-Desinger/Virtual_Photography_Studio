# D 原樣凍結的語意問題（2026-10-25）

基準：`17074fbe3850e2e9fea300b36697643913f707a1`。依 [v1.1 §6.1.4](../../specs/catalog-data-architecture-v1.md#614-已知錯誤標籤原樣凍結)保留現行結果；本文件不是 strict 允許清單，也不授權修正或 P5b。下表保留 D 當時的狀態：「D 原值保留，待後續獨立語意審查」。後續進度見本頁更新註記，不回寫 D 量測數值。

重新清點方法：取固定 pre-D 引擎及 database，僅在記憶體將 Locations 的 small 換成 compact，再經同一引擎編譯，確認失去 commercial 的恰為 17 筆。這證明 substring 觸發，不代表所有商業場景都不該有 commercial。倫敦原始中文 desc 的「地下室窗格」命中 `地下`，得到 `subterranean`；固定 pre-D 與本批基準的英文都沒有 `drainage pipes`。

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

D 凍結當時，倫敦的環境光只保留全無、清晨薄霧、雨天陰濕、雨後反光、雪地冷光；移除 subterranean 的隔離副本為 19 項。清澈海灣岩岸／草地與樹木移除 commercial 後由 19 減為 17 項；其餘上述測量沒有有序候選差異。未對所有鎖值、景別、模式和 prompt 組合窮舉，不能由單一候選池無差異推定全面無影響。

後續每筆修正的驗收條件：另立核准規格，判斷實際場景語意與應保留的標籤；固定 ID、原文、種子與鎖值，列出候選池／解析選值／全部公開輸出／Saved Cards 還原差異，新增專用 fixture，再跑資料完整性、prompt-quality、前端全套及桌手機驗收。不得改寫 A、B、C 或 D 遷移基準來消除產品變更差異。

## 2026-10-26 成因勘誤與 A5 限定修正

先前本頁將倫敦成因寫為 `drainage pipes`，為文件錯誤。重新核對固定 pre-D `17074fbe3850e2e9fea300b36697643913f707a1` 及 pre-A5 `a9dd3616bc6596cdb199420f3189a420c6f1ed17`：英文均為 `London townhouse frontage edge, Victorian terrace facade section, black iron railings, stone steps, pavement edge, basement window grille, doorway threshold`；中文均含「地下室窗格」。以保留推論的相容路徑在記憶體移除「地下室」後，`subterranean` 消失；這是立面細節被誤當作地下場景。D 的 [known-issues.json](../catalog-architecture-d-2026-10-25/known-issues.json) 是不可改寫的歷史證據，其中舊成因文字請以本註記勘誤，數值與候選名單仍保留。

Cooper 本次只授權修正倫敦排屋、清澈海灣岩岸與草地樹木三筆 explicit semantic。依 [三場景規格](../../specs/scene-semantic-a5-three-locations-v1.md)執行；不修改推論函式或其他 15 筆 commercial，也不擴及 CRT／P5b。當前實作與驗收狀態見 [A5 報告](../scene-semantic-a5-2026-10-26/README.md)，不以本頁歷史表格判定三筆仍待實作。

## 2026-10-26 後續 commercial 審查（本機完成、未提交）

以已交付三場景修正的 main `22d1103e` 為新基準，Cooper 核准 15 筆中 11 移除、4 保留。保留者為零售試衣間、酒吧包廂、八公商業立面與販賣機；small 命中原因不能代替實際語意判定。15 筆永久 ID、原文、判準與有序 before／after 見[逐筆決策](../../decisions/2026-10-26-a5-commercial-review.md)及[規格](../../specs/scene-semantic-a5-commercial-v1.md)。

本機 12,540 組候選與 3,804 組生成對照通過，公開輸出／selection／RNG 不變，只有核准 metadata 改變；[完整驗收](../scene-semantic-a5-commercial-2026-10-26/README.md)。上方 D 原值與量測數值保持歷史用途，不作當前待修清單。CRT outdoor 錯標另批，本批不變；A6 與 P5b 未啟動。
