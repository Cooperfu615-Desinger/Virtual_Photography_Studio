# A5 commercial 逐筆決策（2026-10-26）

使用者已核准「11 移除、4 保留」，CRT 另批。基準 main `22d1103e2f88984af7ed33249b08b4e2729ba466`；本紀錄是正式語意審查，不把歷史 substring 命中等同誤標。

判準與驗收見[規格](../specs/scene-semantic-a5-commercial-v1.md)。每個 ID、原文、before／after 有序 tags 另存於[固定案例](../../scripts/lib/a5CommercialReview.json)，供專用回歸與獨立 Git 對照；不得自動從當前資料重錄以消除差異。

## 其他：生活感日式榻榻米房間

- 永久 ID：`locations:其他專屬場景-other-dedicated-scenes:其他-生活感日式榻榻米房間:2`
- 決策：移除 commercial。家居榻榻米與 personal items，沒有商業場所來源。
- 正式來源：[其他專屬場景-other-dedicated-scenes.json](../../knowledge_base/catalog/Locations/其他專屬場景-other-dedicated-scenes.json)
- 英文來源：lived-in Japanese tatami ground plane, woven mat texture filling the floor, shoji screen edge, low domestic detail, small personal items near a corner, tatami seam geometry
- 中文依據：生活感日式榻榻米基底，重點是榻榻米編織紋理、障子或紙門邊緣、低矮生活細節、角落小物與榻榻米接縫。
- 有序 tags：`other_scene, indoor, commercial` → `other_scene, indoor`

## 室內：廢棄校舍保健室

- 永久 ID：`locations:地下與廢墟風格-abandoned-underground:室內-廢棄校舍保健室:13`
- 決策：移除 commercial。廢棄學校醫務設施，保留 ruin 與 institutional。
- 正式來源：[地下與廢墟風格-abandoned-underground.json](../../knowledge_base/catalog/Locations/地下與廢墟風格-abandoned-underground.json)
- 英文來源：abandoned school infirmary room, medicine box, privacy curtain, white metal cabinet, old examination bed, small sink, chipped floor tiles, side shelf
- 中文依據：廢棄校舍保健室，重點是藥箱、隔簾、白色金屬櫃、舊診療床、小水槽、剝落地磚與側邊架。
- 有序 tags：`ruin, indoor, commercial, institutional` → `ruin, indoor, institutional`

## 室內：無人月台長椅區

- 永久 ID：`locations:城市與社群感-urban-social-snapshots:室內-無人月台長椅區:4`
- 決策：移除 commercial。交通設施、座椅與站牌不是商業空間。
- 正式來源：[城市與社群感-urban-social-snapshots.json](../../knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json)
- 英文來源：subway bench zone, worn plastic seating, tiled wall panels, platform edge markings, metal column edge, small sign plate, underground transit wall surface
- 中文依據：月台長椅區與月台邊線，重點是磨損塑膠椅、磁磚牆板、月台標線、金屬柱邊與小型指示牌。
- 有序 tags：`urban, indoor, commercial, transit` → `urban, indoor, transit`

## 室內：電車車廂正面長椅視角

- 永久 ID：`locations:城市與社群感-urban-social-snapshots:室內-電車車廂正面長椅視角:8`
- 決策：移除 commercial。車廂海報是交通空間附屬細節；其他標籤維持。
- 正式來源：[城市與社群感-urban-social-snapshots.json](../../knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json)
- 英文來源：Japanese commuter train car interior, slight offset view toward a blue fabric bench seat, window and sliding door panels behind the subject, stainless steel wall surfaces, overhead hand straps, route maps, small carriage posters, passing scenery glimpsed through windows
- 中文依據：指定為車廂內長椅視角，但以略偏側角度避免過度置中；背景包含車窗、滑門、金屬牆面、吊環、路線圖、車廂海報與窗外掠過景色。
- 有序 tags：`urban, indoor, commercial, transit, institutional` → `urban, indoor, transit, institutional`

## 室內：電車車廂坐滿與站滿乘客

- 永久 ID：`locations:城市與社群感-urban-social-snapshots:室內-電車車廂坐滿與站滿乘客:10`
- 決策：移除 commercial。車廂廣告不改變公共運輸空間主體語意。
- 正式來源：[城市與社群感-urban-social-snapshots.json](../../knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json)
- 英文來源：crowded Japanese commuter train car, seated passengers on bench seats, standing commuters around vertical grab poles, overhead hand straps in use, sliding doors and train windows behind layered bodies, route map panels, small carriage ads, compressed public-transit density
- 中文依據：擁擠日本通勤車廂，長椅坐滿、走道站滿，重點是吊環、扶手柱、滑門、車窗、路線圖、車廂廣告與層層人物密度。
- 有序 tags：`urban, indoor, commercial, transit` → `urban, indoor, transit`

## 戶外：八公銅像旁行人區

- 永久 ID：`locations:城市與社群感-urban-social-snapshots:戶外-八公銅像旁行人區:12`
- 決策：保留 commercial。原文明確 nearby commercial facades。
- 正式來源：[城市與社群感-urban-social-snapshots.json](../../knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json)
- 英文來源：Shibuya Hachiko Square pedestrian waiting area beside the small bronze Hachiko dog statue, modest stone pedestal, low queue railings, station-front plaza paving, clustered meeting crowds, Shibuya Station frontage and nearby commercial facades, realistic landmark scale
- 中文依據：澀谷站前忠犬八公銅像周邊等候區，重點是小型青銅八公雕像、石座、低矮欄杆、站前鋪面、等候人潮與商業立面。
- 有序 tags：`urban, outdoor, commercial, transit` → `urban, outdoor, commercial, transit`

## 戶外：目黑川旁的櫻花隧道

- 永久 ID：`locations:城市與社群感-urban-social-snapshots:戶外-目黑川旁的櫻花隧道:14`
- 決策：移除 commercial。河道、櫻花與城市建築沒有商業立面的來源依據；保留 urban、waterfront。
- 正式來源：[城市與社群感-urban-social-snapshots.json](../../knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json)
- 英文來源：Meguro River bridge viewpoint, bridge railing in the foreground, river channel offset along one side, one riverside cherry blossom canopy, layered Tokyo buildings behind the riverbank, pale pink petals as small physical details, asymmetric riverside composition
- 中文依據：構圖以橋上視角為核心，前景先看到橋面或欄杆，河道偏向畫面一側，櫻花集中在單側河岸與城市建築之間，形成不對稱沿河場景。
- 有序 tags：`urban, outdoor, commercial, waterfront` → `urban, outdoor, waterfront`

## 戶外：新宿歌舞伎町販賣機旁

- 永久 ID：`locations:城市與社群感-urban-social-snapshots:戶外-新宿歌舞伎町販賣機旁:31`
- 決策：保留 commercial。販賣機與 product display windows 為直接商品展示／零售語意。
- 正式來源：[城市與社群感-urban-social-snapshots.json](../../knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json)
- 英文來源：Shinjuku vending machine corner, metallic vending-machine surfaces, wall edge, pavement texture, small product display windows, curbside standing space
- 中文依據：販賣機、牆面與地面材質構成局部都市場景，重點是金屬機身、商品窗、牆邊、鋪面與路邊站位。
- 有序 tags：`urban, outdoor, commercial` → `urban, outdoor, commercial`

## 室內：臥室窗邊

- 永久 ID：`locations:生活感室內-indoor-lifestyle:室內-臥室窗邊:6`
- 決策：移除 commercial。床鋪、窗簾與床邊檯面為住宅空間。
- 正式來源：[生活感室內-indoor-lifestyle.json](../../knowledge_base/catalog/Locations/生活感室內-indoor-lifestyle.json)
- 英文來源：bedroom window area, curtain panels, linen bedding near the window, pillow edges, small bedside surface, window frame, fabric textures around an offset corner of the room
- 中文依據：臥室窗邊區域，重點是窗框、窗簾、床品、枕頭邊緣、床邊小平面與布料材質，形成偏角的生活室內空間。
- 有序 tags：`indoor, residential, commercial` → `indoor, residential`

## 室內：更衣室 / 試衣間

- 永久 ID：`locations:生活感室內-indoor-lifestyle:室內-更衣室-試衣間:10`
- 決策：保留 commercial。明確 retail changing area，屬零售店試衣間。
- 正式來源：[生活感室內-indoor-lifestyle.json](../../knowledge_base/catalog/Locations/生活感室內-indoor-lifestyle.json)
- 英文來源：fitting room interior, mirror edge, curtain panels, wall hook, narrow bench or small stool, compact retail changing area with close wall surfaces
- 中文依據：零售店試衣間的緊湊空間，重點是鏡邊、布簾、掛鉤、窄凳與近距離牆面。
- 有序 tags：`indoor, commercial` → `indoor, commercial`

## 室內：英式小旅館房間

- 永久 ID：`locations:生活感室內-indoor-lifestyle:室內-英式小旅館房間:18`
- 決策：移除 commercial。客房語意由 hospitality 表達；保留 heritage，與精品飯店客房分類一致。
- 正式來源：[生活感室內-indoor-lifestyle.json](../../knowledge_base/catalog/Locations/生活感室內-indoor-lifestyle.json)
- 英文來源：small British inn room, floral bedding, narrow sash window, cream walls, aged wooden furniture, bedside table, compact guest-room corner
- 中文依據：英式小旅館房間角落，重點是碎花床品、窄直拉窗、奶油色牆面、舊木家具與床邊桌。
- 有序 tags：`indoor, hospitality, commercial, heritage` → `indoor, hospitality, heritage`

## 室內：傳統酒吧二樓包廂

- 永久 ID：`locations:生活感室內-indoor-lifestyle:室內-傳統酒吧二樓包廂:19`
- 決策：保留 commercial。British pub upstairs booth 明確為酒吧營業空間。
- 正式來源：[生活感室內-indoor-lifestyle.json](../../knowledge_base/catalog/Locations/生活感室內-indoor-lifestyle.json)
- 英文來源：traditional British pub upstairs booth, dark wood paneling, red-brown leather bench seating, small table, framed vintage prints, low lamp fixtures as visible objects
- 中文依據：英國老式酒吧二樓包廂，重點是暗木牆板、紅棕皮革長椅、小桌、復古框畫與低矮燈具物件。
- 有序 tags：`indoor, commercial` → `indoor, commercial`

## 室內：黑膠唱片聆聽角

- 永久 ID：`locations:生活感室內-indoor-lifestyle:室內-黑膠唱片聆聽角:21`
- 決策：移除 commercial。唱盤、音響與家具沒有商店或販售的來源依據。
- 正式來源：[生活感室內-indoor-lifestyle.json](../../knowledge_base/catalog/Locations/生活感室內-indoor-lifestyle.json)
- 英文來源：British record listening corner, turntable setup, stacked vinyl sleeves, bookshelf speakers, aged wood cabinet, lamp fixture as a visible object, small side table
- 中文依據：黑膠唱片聆聽角，重點是唱盤、唱片封套、書架喇叭、舊木櫃、燈具物件與小邊桌。
- 有序 tags：`indoor, commercial` → `indoor`

## 室內：女高生房間

- 永久 ID：`locations:生活感室內-indoor-lifestyle:室內-女高生房間:24`
- 決策：移除 commercial。私人臥室與個人物品；其他標籤不在本批審查範圍。
- 正式來源：[生活感室內-indoor-lifestyle.json](../../knowledge_base/catalog/Locations/生活感室內-indoor-lifestyle.json)
- 英文來源：Japanese student bedroom corner, compact single bed, study desk, curtains, soft everyday clutter, school bag or small personal items, private lived-in room details
- 中文依據：偏真實日本學生房間，不走動漫誇張感，重點是單人床、書桌、窗簾、書包或小物與生活雜物。
- 有序 tags：`indoor, residential, commercial, institutional` → `indoor, residential, institutional`

## 室內：狹小都會旅館房間

- 永久 ID：`locations:生活感室內-indoor-lifestyle:室內-狹小都會旅館房間:38`
- 決策：移除 commercial。描述旅宿客房，保留 hospitality；非零售／商業立面。
- 正式來源：[生活感室內-indoor-lifestyle.json](../../knowledge_base/catalog/Locations/生活感室內-indoor-lifestyle.json)
- 英文來源：small urban hotel room, compact bedding, practical lamp fixtures, narrow bedside table, close wall surfaces, luggage corner, enclosed room layout
- 中文依據：狹小都會旅館房間，重點是緊湊床鋪、實用燈具、窄床頭桌、近距離牆面、行李角落與封閉房間佈局。
- 有序 tags：`indoor, hospitality, commercial` → `indoor, hospitality`

## CRT 與歷史追溯

CRT 的 VCR decks → deck → outdoor 已確認為錯誤推論，但本批保持原 tags，另立光線、服裝、支撐物驗收再處理。前批三場景 A5 已在 22d1103e 提交；其規格、驗收工具與歷史證據保持。D 凍結表的原值／數值不回寫；本批狀態以本規格與報告為準。
