# Z-Image 既有場景細節優先規則 v2

日期：2026-09-14；狀態追蹤更新：2026-09-18。已接入 runtime 並完成本地回歸與瀏覽器驗證；合併審查與 Git 交付狀態見 `Docs/current_project_state.md` 及 Git log。

## 1. 目的與適用範圍

本規格收斂 B 區首批十組之外的其餘 38 個既有場景來源，讓低機位 Z-Image 開頭保留與該場景身份最有辨識度的短細節。加上 [v1 首批十組](z-image-existing-scene-detail-priority-v1.md) 後，`zImageSceneDetailPriority.js` 共維護 45 個明確的 location ID（7 組歷史修改加本批 38 組）；首批的 3 組不變對照只留在 fixtures，作為控制組而不占 runtime map。

只適用於 PAGE1 一般單人主 `zImagePrompt` 的 scene-integrated assembly，且只在有效的腰部、膝蓋、地面、蟲眼低機位選擇中套用。場景身份先於細節；每個替換都綁定現有 location ID，不由 renderer 從自然語言猜測物件。

下列路徑維持原行為：GPT、MJ、AI／衍生輸出、雙人、固定構圖、專用角色、角色卡／身份匯入、仰躺 surface-led、自訂或未知場景、非低機位，以及所有 UI、摘要、選取／儲存／匯入契約。半臉傾斜特寫在共用投影後可能把低機位降為肩部／平視；因此整合矩陣不把它當成實際保留低機位，但 helper 仍須對所有低機位標籤維持可測試、可回退。

## 2. 統一資料流

沿用既有順序：

`resolved location source → camera-height floor／sky projection → scene detail priority → approved upper-scene source → scene opening`

- 低機位輸出最多使用該場景的核准短片語；已存在的片語不可重複。
- 這是同一 location 的有限優先選用，不是把完整 Markdown 長句回補，也不新增場景物件到 catalog。
- 未命中 ID、空值、未知英文或自訂文字時 fail closed，原文照舊輸出。
- 不新增光源、時間、天氣、鏡頭、姿勢、人物比例或「完整背景入鏡」要求。
- 場景開頭只出現一次身份／細節片語；其餘段落與非 Z 輸出 byte-for-byte 保持原規則。

## 3. 本批 38 組核准優先文字

下表的「低機位開頭」是 identity 後實際使用的完整英文開頭；中文名稱與 ID 仍以 `locations_and_sets.md`／`database.json` 為準。

| 中文場景 | 低機位開頭 |
| --- | --- |
| 室內：CRT 電視牆攝影棚 | `studio set with assorted CRT televisions and vintage computer monitors in an irregular high-low cluster, retro cathode-ray displays with varied gaps and heights` |
| 室內：白色書櫃落地窗臥室 | `vintage white bookcase bedroom corner, tall white bookshelf filled with books, large window edge` |
| 戶外：日本住宅陽台曬衣架旁 | `Japanese apartment balcony with laundry rack, neighboring apartment facades` |
| 戶外：社區自動販賣機旁 | `Japanese residential vending-machine corner, overhead power lines, apartment facade edge` |
| 戶外：辦公大樓人行道（上班途中） | `Japanese business-district office sidewalk, glass-and-steel office tower frontage` |
| 室內：地下狂歡俱樂部／金庫 | `underground rave bunker room, laser fixtures mounted on metal truss` |
| 戶外：高樓建築骨架施工鷹架旁 | `construction scaffolding side area, steel pipes, unfinished concrete column` |
| 戶外：高樓建築骨架開放樓層邊緣 | `open high-rise floor edge, exposed beams` |
| 室內：地下月台電子看板與海報牆 | `underground subway platform signboard corner, amber LED next-train display overhead, fluorescent ceiling tubes` |
| 戶外：澀谷站前廣場人潮邊緣 | `Shibuya Station front plaza edge near Hachiko Square, station-front commercial facade layers` |
| 戶外：八公銅像旁行人區 | `Shibuya Hachiko Square pedestrian waiting area beside the small bronze Hachiko dog statue, Shibuya Station frontage and nearby commercial facades` |
| 戶外：澀谷站前大型看板下穿越口 | `Shibuya station-side crossing entrance beneath oversized commercial billboards, tower facades packed with signage` |
| 戶外：目黑川旁的櫻花隧道 | `Meguro River bridge viewpoint, one riverside cherry blossom canopy` |
| 戶外：大阪道頓堀心齋橋河道 | `Dotonbori Shinsaibashi riverside edge in Osaka, iconic billboard signage, dense commercial facade layers` |
| 戶外：九龍城寨雜貨店門口 | `Kowloon Walled City grocery storefront, hanging signs` |
| 戶外：九龍城寨電器行外牆與管線 | `Kowloon Walled City appliance shop wall, hanging shop signs, exposed conduits` |
| 戶外：孚日廣場拱廊下 | `Place des Vosges arcade side bay, brick arch segment` |
| 戶外：孚日廣場草地邊與紅磚立面 | `Place des Vosges lawn edge, red-brick facade section, shuttered windows` |
| 戶外：曼哈頓街角玻璃反射牆面 | `Manhattan corner glass facade, tower reflections layered behind` |
| 戶外：首爾聖水洞街區 | `Seoul Seongsu-dong urban corner, metal-framed window, small signboard` |
| 戶外：首爾弘大街頭 | `Seoul Hongdae youth-culture storefront edge, colorful signboards, layered shopfronts` |
| 戶外：台北西門町街頭 | `Taipei Ximending street corner, dense commercial signboards, arcade edge` |
| 戶外：洛杉磯日落大道街景 | `Los Angeles Sunset Boulevard sidewalk edge, large billboard structure` |
| 戶外：新宿歌舞伎町招牌下 | `Shinjuku Kabukicho Ichibangai entrance beneath the iconic red illuminated street-spanning arch sign, steel arch supports, dense nightlife storefronts and layered signboards` |
| 戶外：新宿歌舞伎町濕地反光角落 | `Kabukicho street corner, layered signboards` |
| 戶外：蘇荷區酒吧門口 | `Soho pub entrance, pub sign bracket, window trim` |
| 戶外：蘇荷區招牌下 | `Soho signboard corner, neon sign structure, sign bracket detail` |
| 戶外：Camden 龐克街角 | `Camden punk street corner, shop sign fragments` |
| 戶外：倫敦排屋街道 | `London townhouse frontage edge, Victorian terrace facade section` |
| 室內：法租界咖啡館靠窗座位 | `French Concession cafe window seat, large floor-to-ceiling window` |
| 戶外：城市遊艇碼頭欄杆旁 | `urban yacht marina promenade, moored sailboats and yacht masts` |
| 戶外：奧地利 Hallstatt 湖畔山村觀景欄杆 | `Hallstatt lakeside village overlook, church spire and steep mountain backdrop` |
| 戶外：高樓頂樓城市天際線 | `high-rise rooftop edge, modern city skyline in the distance` |
| 戶外：飯店度假村泳池露台 | `hotel resort poolside terrace, balcony facade` |
| 戶外：高級飯店陽台城市河景 | `luxury hotel balcony river-view terrace, high-rise facade edge` |
| 戶外：清澈海灣岩岸 | `clear turquoise cove shoreline, cliff wall edge` |
| 戶外：岩洞感海灣淺灘 | `rocky seaside cove with cave-like cliff openings, recessed rock wall` |
| 戶外：向日葵花田 | `sunflower field edge, large yellow flower heads` |

## 4. 驗證與回溯

- `SCENE_DETAIL_PRIORITY_REMAINING_CASES` 固定 38 筆 `[label, before, after]`，`SCENE_DETAIL_PRIORITY_REMAINING_LOW_MATRIX` 固定 456 筆實際低機位整合案例；所有來源片語必須能在相同 location 的 catalog 英文找到。
- 歷史七組與三組對照維持原 oracle；舊 1,430 筆基準以測試相容層還原新版主體光線／場景細節後比對，不改寫基準檔。
- 原始批次局部 prompt／scene 回歸 137/137；2026-09-18 合併審查通過 `npm test` 963/963、`npm run test:prompt-quality` 275/275、lint/build、`git diff --check`、資料同步／Python／public-asset 檢查與 strict same-seed audit（200，零 blocking、23 diagnostic-only）。瀏覽器在 1440x1000 與 390x900 檢查五個目前啟用的工作區，無 console error 或 document-level horizontal overflow。外部模型成像品質與部署另行驗證。
