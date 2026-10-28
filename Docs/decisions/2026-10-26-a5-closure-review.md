# Phase 4 A5 狀態總表與剩餘雙標籤審查

## 2026-10-28 更新：A5 本機已完整結案

原 31 筆唯一場景目前為 **27 筆修正、4 筆核准保留、0 筆待決**。西門町已交付 `ffb2e91e`（CI 40294656608 成功）；最新十一筆依 [空間規格](../specs/phase4-a5-scene-position-v1.md) 處理，逐筆原件與差異見 [review](../reports/phase4-completion-2026-10-28/a5/review.json)。九筆去 indoor、兩筆去 outdoor；騎樓／緣側保留戶外與原遮蔽描述，其他標籤及支撐不變。四筆 commercial 保留理由維持。

下列 2026-10-26 清單及「待決／本機未交付」文字是當時歷史快照，最新狀態以上段為準；不再構成等待核准門檻。Phase 4 已整體授權，後續 A6、A7 依序進行，P5b 仍暫緩。

## 2026-10-26 歷史審查紀錄

核對日期：2026-10-26。可信任 main：`5110401f3eee4aaa6cc59ee9175625cc96326d9e`。此頁是 A5 當前狀態入口；各批規格／報告的「授權交付」「另批」保留為當時歷史，不作目前未交付的判斷。

## 結案口徑

原先完成的 19 筆審查含 15 筆修正、4 筆保留；那是前三批核准範圍，並非原分析報告全部 A5。原 [scene-lighting 報告 C1](../reports/database-analysis-2026-10-11/partitions/scene-lighting.md) 還列出西門町 parking→park 與室內外雙標籤。原報告的舊行號、數字與原 D 凍結值均保留作歷史，最新清單以本頁與固定 Git 原件為準。

本次列管共 **31 筆唯一場景：15 筆已交付修正、4 筆核准保留、1 筆西門町本機修正、11 筆雙標籤待決**。本批完成後可結束已授權的明確誤標修正與狀態整理；11 筆需下一批決策，不能把整個 A5 標成全部關閉。只審閱這些條目，不代表全目錄沒有其他內容問題。

## 已交付批次與證據

| 批次 | 決策 | main 提交 | 對應 CI |
| --- | --- | --- | --- |
| 三筆語意修正 | 倫敦去 subterranean；海灣／草地去 commercial | `22d1103e2f88984af7ed33249b08b4e2729ba466` | [40259955650：success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40259955650) |
| commercial 後續 | 11 筆去 commercial，4 筆保留 | `321404ecd041343f4a764260ef59ffc08a74a199` | [40265867218：success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40265867218) |
| CRT | 只去 outdoor，沿用現有室內政策 | `5110401f3eee4aaa6cc59ee9175625cc96326d9e` | [40275779631：success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40275779631) |
| 本批西門町 | 只去 green_space | 本機實作；尚未提交／推送 | 尚無本批 CI；前批成功不代替本批 |

三個已交付 SHA 均為本次基準的祖先；CI 在本次重新讀取，status=completed、conclusion=success、head_sha 與表列一致。本批 local 驗收與使用者確認另見 [報告](../reports/scene-semantic-a5-ximending-2026-10-26/README.md)。架構驗證護欄 `a9dd3616` 的 [CI 40209186796](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40209186796) 亦已成功，Phase 4 已開始，P5b 暫緩。

## 明確誤標與保留資料的逐筆狀態

前 19 筆的完整理由／原值與回歸依據，分別保存在 [三筆規格](../specs/scene-semantic-a5-three-locations-v1.md)、[commercial 決策](2026-10-26-a5-commercial-review.md)、[CRT 決策](2026-10-26-a5-crt-outdoor.md)。原件不重寫。

| 永久 ID | 本批結束後狀態 | 決策與來源 |
| --- | --- | --- |
| `locations:城市與社群感-urban-social-snapshots:戶外-倫敦排屋街道:41` | 已交付修正 | 只去 subterranean；22d1103e。倫敦成因為中文「地下室」命中「地下」。 |
| `locations:自然與戶外-nature-outdoors:戶外-清澈海灣岩岸:1` | 已交付修正 | 只去 commercial；22d1103e。small 被子字串 mall 誤判為商業場所。 |
| `locations:自然與戶外-nature-outdoors:戶外-草地與樹木:3` | 已交付修正 | 只去 commercial；22d1103e。small 被子字串 mall 誤判為商業場所。 |
| `locations:其他專屬場景-other-dedicated-scenes:其他-生活感日式榻榻米房間:2` | 已交付修正 | 去 commercial；321404ec。家居榻榻米與 personal items，沒有商業場所來源。 |
| `locations:地下與廢墟風格-abandoned-underground:室內-廢棄校舍保健室:13` | 已交付修正 | 去 commercial；321404ec。廢棄學校醫務設施，保留 ruin 與 institutional。 |
| `locations:城市與社群感-urban-social-snapshots:室內-無人月台長椅區:4` | 已交付修正 | 去 commercial；321404ec。交通設施、座椅與站牌不是商業空間。 |
| `locations:城市與社群感-urban-social-snapshots:室內-電車車廂正面長椅視角:8` | 已交付修正 | 去 commercial；321404ec。車廂海報是交通空間附屬細節；其他標籤維持。 |
| `locations:城市與社群感-urban-social-snapshots:室內-電車車廂坐滿與站滿乘客:10` | 已交付修正 | 去 commercial；321404ec。車廂廣告不改變公共運輸空間主體語意。 |
| `locations:城市與社群感-urban-social-snapshots:戶外-八公銅像旁行人區:12` | 核准保留 | 保留 commercial；321404ec。原文明確 nearby commercial facades。 |
| `locations:城市與社群感-urban-social-snapshots:戶外-目黑川旁的櫻花隧道:14` | 已交付修正 | 去 commercial；321404ec。河道、櫻花與城市建築沒有商業立面的來源依據；保留 urban、waterfront。 |
| `locations:城市與社群感-urban-social-snapshots:戶外-新宿歌舞伎町販賣機旁:31` | 核准保留 | 保留 commercial；321404ec。販賣機與 product display windows 為直接商品展示／零售語意。 |
| `locations:生活感室內-indoor-lifestyle:室內-臥室窗邊:6` | 已交付修正 | 去 commercial；321404ec。床鋪、窗簾與床邊檯面為住宅空間。 |
| `locations:生活感室內-indoor-lifestyle:室內-更衣室-試衣間:10` | 核准保留 | 保留 commercial；321404ec。明確 retail changing area，屬零售店試衣間。 |
| `locations:生活感室內-indoor-lifestyle:室內-英式小旅館房間:18` | 已交付修正 | 去 commercial；321404ec。客房語意由 hospitality 表達；保留 heritage，與精品飯店客房分類一致。 |
| `locations:生活感室內-indoor-lifestyle:室內-傳統酒吧二樓包廂:19` | 核准保留 | 保留 commercial；321404ec。British pub upstairs booth 明確為酒吧營業空間。 |
| `locations:生活感室內-indoor-lifestyle:室內-黑膠唱片聆聽角:21` | 已交付修正 | 去 commercial；321404ec。唱盤、音響與家具沒有商店或販售的來源依據。 |
| `locations:生活感室內-indoor-lifestyle:室內-女高生房間:24` | 已交付修正 | 去 commercial；321404ec。私人臥室與個人物品；其他標籤不在本批審查範圍。 |
| `locations:生活感室內-indoor-lifestyle:室內-狹小都會旅館房間:38` | 已交付修正 | 去 commercial；321404ec。描述旅宿客房，保留 hospitality；非零售／商業立面。 |
| `locations:攝影棚與背景-studio-sets:室內-crt-電視牆攝影棚:13` | 已交付修正 | 只去 outdoor；5110401f。VCR decks 命中 deck。 |
| `locations:城市與社群感-urban-social-snapshots:戶外-台北西門町街頭:28` | 本機驗收通過，待使用者確認／交付 | 只去 green_space；parking 命中 park，原文無公園。 |

## 11 筆雙標籤：只審查，不改值

來源以固定 main 的 [review fixture](../../scripts/lib/a5XimendingReview.json) 封存每筆完整紀錄、ID、有序 aliases、zh／en／desc、tags 與 lyingSurface（若有）；回歸逐筆對照可信 Git 原件與當前正式來源。下表是**建議而非核准修改**，每筆狀態一律「待決，保留原值」。9 筆名稱為戶外、2 筆名稱為室內；原報告的 3 筆室內中，CRT 已在上一批處理。

| 永久 ID／來源檔 | 目前有序 tags | 來源判讀及下一批建議 | 狀態 |
| --- | --- | --- | --- |
| `locations:地下與廢墟風格-abandoned-underground:室內-廢棄商場空置美食街角落:19`<br>[來源](../../knowledge_base/catalog/Locations/地下與廢墟風格-abandoned-underground.json) | `ruin, indoor, outdoor, commercial` | 英文為 food-court corner、空櫃台、地磚與攤位，中文明確室內。建議評估移除 outdoor，保留 ruin／commercial；不能把既有 explicit 值當內容真實性的證據。 | 待決，原值不變 |
| `locations:城市與社群感-urban-social-snapshots:戶外-興記煲仔飯店門口騎樓區:18`<br>[來源](../../knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json) | `urban, hospitality, indoor, outdoor, commercial` | storefront arcade／入口門檻，是半開放騎樓；名稱雖為戶外，場地有遮蔽。建議先定義拍攝位置與遮蔽的分工，再決定 indoor；hospitality 的文字命中不等於旅館。此批不改這些 tags。 | 待決，原值不變 |
| `locations:城市與社群感-urban-social-snapshots:室內-法租界咖啡館靠窗座位:44`<br>[來源](../../knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json) | `urban, indoor, outdoor, commercial, green_space` | 主體在 cafe window seat；sidewalk／park trees 明確是窗外背景。建議評估移除 outdoor，將主體所在位置與窗外元素區分；green_space 是否代表可見背景另需界定，不能順手刪。 | 待決，原值不變 |
| `locations:城市與社群感-urban-social-snapshots:戶外-羅馬老城咖啡館外桌旁:49`<br>[來源](../../knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json) | `urban, indoor, outdoor, commercial, heritage` | outdoor chairs、terrace、鵝卵石路面明確室外，cafe／seating 不代表室內。建議評估移除 indoor，保留 commercial／heritage。 | 待決，原值不變 |
| `locations:城市與社群感-urban-social-snapshots:戶外-飯店度假村泳池露台:55`<br>[來源](../../knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json) | `urban, hospitality, indoor, outdoor, waterfront` | poolside terrace／戶外池畔，飯店用途不等於室內。建議評估移除 indoor；保留 hospitality／waterfront 與 wet stone deck。 | 待決，原值不變 |
| `locations:城市與社群感-urban-social-snapshots:戶外-高級飯店陽台城市河景:56`<br>[來源](../../knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json) | `urban, hospitality, indoor, outdoor, waterfront` | balcony river-view terrace，人物位於陽台。建議評估移除 indoor，保留 hospitality／waterfront；遠景與建築立面不是室內證據。 | 待決，原值不變 |
| `locations:生活感室內-indoor-lifestyle:戶外-日本住宅陽台曬衣架旁:32`<br>[來源](../../knowledge_base/catalog/Locations/生活感室內-indoor-lifestyle.json) | `indoor, residential, outdoor` | apartment balcony／veranda／欄杆與曬衣架，主體在住宅陽台。建議評估移除 indoor，保留 residential；分類名稱不決定人物實際位置。 | 待決，原值不變 |
| `locations:生活感室內-indoor-lifestyle:戶外-日本住宅外樓梯間:33`<br>[來源](../../knowledge_base/catalog/Locations/生活感室內-indoor-lifestyle.json) | `indoor, residential, outdoor` | exterior metal stairway／open-grate steps，明確外掛樓梯。建議評估移除 indoor，保留 residential。 | 待決，原值不變 |
| `locations:生活感室內-indoor-lifestyle:戶外-社區自動販賣機旁:34`<br>[來源](../../knowledge_base/catalog/Locations/生活感室內-indoor-lifestyle.json) | `indoor, residential, outdoor` | curbside asphalt／overhead power lines／roadside surface，明確道路旁。建議評估移除 indoor，保留 residential，不藉此追加 commercial。 | 待決，原值不變 |
| `locations:生活感室內-indoor-lifestyle:戶外-辦公大樓人行道-上班途中:35`<br>[來源](../../knowledge_base/catalog/Locations/生活感室內-indoor-lifestyle.json) | `indoor, outdoor` | office sidewalk／curbside／building entrance edge，主體在人行道。建議評估移除 indoor，不因辦公樓立面判為室內。 | 待決，原值不變 |
| `locations:生活感室內-indoor-lifestyle:戶外-日式旅館緣側木廊:36`<br>[來源](../../knowledge_base/catalog/Locations/生活感室內-indoor-lifestyle.json) | `indoor, hospitality, outdoor, heritage, green_space` | engawa veranda／拉門框／門檻與庭院，是室內外交界。建議與騎樓合批定義邊界空間，暫不決定單刪 indoor 或維持雙標籤；保留 lyingSurface 與其他語意。 | 待決，原值不變 |

## 後續順序與驗收邊界

1. 先驗收本批西門町與狀態整理；確認公開行為、原 19 筆決策、11 筆待決值、歷史基準及其他未提交工作皆保持。獲另行授權才提交／推送並查本批 CI。
2. 雙標籤後續可先分析 7 筆明確戶外（陽台、外樓梯、販賣機、人行道、羅馬外桌、泳池露台、飯店陽台）與 2 筆明確室內（美食街、窗邊咖啡館）；清楚列出 tag 直接消費者、光線／隨機服裝／外套／支撐候選與 RNG 差異，再核准實作。不以名稱前綴的 UI 結果推論所有內部規則無影響。
3. 騎樓與緣側另定義「主體位置、遮蔽程度、可見背景」的標籤責任，再決定雙標籤是否保留。此批未建立新 schema 或新產品政策。
4. 每個核准批次保護相同 ID／aliases／原文、明確手動鎖值與舊卡；建立修改前基準、固定 seed 完整輸出對照及精確歷史回放，跑 root AGENTS 完整門檻。既有候選池排除與明確保存鎖值必須分開判定。

A1–A4／A6／A7、J12、B3 與 P5b 不在此次收尾授權內。
