import { upperSceneFixture, UPPER_SCENE_ANGLES } from './zImageUpperSceneFixtures.js';
import { UPPER_SCENE_EXTENSION_REGRESSION } from './zImageUpperSceneExtensionFixtures.js';
import { SCENE_INTEGRATED_ASSEMBLY_FIXTURES } from './sceneIntegratedAssemblyFixtures.js';

// Independent review oracle: label, old compressed source, approved low source.
export const SCENE_DETAIL_PRIORITY_CASES = [
  ['室內：倫敦老咖啡館角落', 'old London cafe corner, dark wood table, fogged window glass', 'old London cafe corner, fogged window glass, pendant lamp fixture'],
  ['室內：辦公室茶水間', 'Japanese office pantry corner, small sink counter, compact coffee machine', 'Japanese office pantry corner, compact coffee machine, upper wall cabinets'],
  ['室內：宮廷音樂廳 / 歌劇院', 'opulent opera house interior, chandelier fixtures, velvet seat rows cropped from one side', 'opulent opera house interior, chandelier fixtures, ornate balcony rail'],
  ['室內：廢棄手術室', 'abandoned operating room, broken surgical table, metal tray stand', 'abandoned operating room, peeling tiled walls, ceiling rail'],
  ['室內：九龍城寨內部狹窄走道', 'Kowloon Walled City interior passage, narrow wall-to-wall corridor, water-stained concrete walls', 'Kowloon Walled City interior passage, narrow wall-to-wall corridor, overhead pipes'],
  ['室內：電車車廂正面長椅視角', 'Japanese commuter train car interior, slight offset view toward a blue fabric bench seat, window and sliding door panels behind the subject', 'Japanese commuter train car interior, slight offset view toward a blue fabric bench seat, overhead hand straps'],
  ['室內：電車車廂坐滿與站滿乘客', 'crowded Japanese commuter train car, seated passengers on bench seats, standing commuters around vertical grab poles', 'crowded Japanese commuter train car, seated passengers on bench seats, standing commuters around vertical grab poles, overhead hand straps in use'],
];

// Second review batch: existing catalog clauses selected for the low-camera
// opening. These are intentionally independent from the historical seven-case
// baseline so the earlier frozen hashes remain an immutable regression oracle.
export const SCENE_DETAIL_PRIORITY_REMAINING_CASES = [
  ['室內：CRT 電視牆攝影棚', 'studio set with assorted CRT televisions and vintage computer monitors in an irregular high-low cluster, retro cathode-ray displays with varied gaps and heights, glowing screens with analog static', 'studio set with assorted CRT televisions and vintage computer monitors in an irregular high-low cluster, retro cathode-ray displays with varied gaps and heights'],
  ['室內：白色書櫃落地窗臥室', 'vintage white bookcase bedroom corner, tall white bookshelf filled with books, large window edge', 'vintage white bookcase bedroom corner, tall white bookshelf filled with books, large window edge'],
  ['戶外：日本住宅陽台曬衣架旁', 'Japanese apartment balcony with laundry rack, freshly washed clothes hanging to dry, metal railing', 'Japanese apartment balcony with laundry rack, neighboring apartment facades'],
  ['戶外：社區自動販賣機旁', 'Japanese residential vending-machine corner, two or three machines beside a wall, utility pole fragment', 'Japanese residential vending-machine corner, overhead power lines, apartment facade edge'],
  ['戶外：辦公大樓人行道（上班途中）', 'Japanese business-district office sidewalk, glass-and-steel office tower frontage', 'Japanese business-district office sidewalk, glass-and-steel office tower frontage'],
  ['室內：地下狂歡俱樂部 / 金庫', 'underground rave bunker room, laser fixtures mounted on metal truss, smoke machine as a visible device', 'underground rave bunker room, laser fixtures mounted on metal truss'],
  ['戶外：高樓建築骨架施工鷹架旁', 'construction scaffolding side area, steel pipes, dusty tarp', 'construction scaffolding side area, steel pipes, unfinished concrete column'],
  ['戶外：高樓建築骨架開放樓層邊緣', 'open high-rise floor edge, exposed beams', 'open high-rise floor edge, exposed beams'],
  ['室內：地下月台電子看板與海報牆', 'underground subway platform signboard corner, amber LED next-train display overhead, stained white tile wall', 'underground subway platform signboard corner, amber LED next-train display overhead, fluorescent ceiling tubes'],
  ['戶外：澀谷站前廣場人潮邊緣', 'Shibuya Station front plaza edge near Hachiko Square, dense realistic foot traffic', 'Shibuya Station front plaza edge near Hachiko Square, station-front commercial facade layers'],
  ['戶外：八公銅像旁行人區', 'Shibuya Hachiko Square pedestrian waiting area beside the small bronze Hachiko dog statue, low queue railings', 'Shibuya Hachiko Square pedestrian waiting area beside the small bronze Hachiko dog statue, Shibuya Station frontage and nearby commercial facades'],
  ['戶外：澀谷站前大型看板下穿越口', 'Shibuya station-side crossing entrance beneath oversized commercial billboards, bold crosswalk stripes at the intersection edge, waiting pedestrian clusters', 'Shibuya station-side crossing entrance beneath oversized commercial billboards, tower facades packed with signage'],
  ['戶外：目黑川旁的櫻花隧道', 'Meguro River bridge viewpoint, bridge railing in the foreground, river channel offset along one side', 'Meguro River bridge viewpoint, one riverside cherry blossom canopy'],
  ['戶外：大阪道頓堀心齋橋河道', 'Dotonbori Shinsaibashi riverside edge in Osaka, iconic billboard signage, Shinsaibashi bridge railing in the foreground', 'Dotonbori Shinsaibashi riverside edge in Osaka, iconic billboard signage, dense commercial facade layers'],
  ['戶外：九龍城寨雜貨店門口', 'Kowloon Walled City grocery storefront, narrow shop entrance, stacked goods', 'Kowloon Walled City grocery storefront, hanging signs'],
  ['戶外：九龍城寨電器行外牆與管線', 'Kowloon Walled City appliance shop wall, exposed conduits, old electrical boxes', 'Kowloon Walled City appliance shop wall, hanging shop signs, exposed conduits'],
  ['戶外：孚日廣場拱廊下', 'Place des Vosges arcade side bay, brick arch segment', 'Place des Vosges arcade side bay, brick arch segment'],
  ['戶外：孚日廣場草地邊與紅磚立面', 'Place des Vosges lawn edge, red-brick facade section', 'Place des Vosges lawn edge, red-brick facade section, shuttered windows'],
  ['戶外：曼哈頓街角玻璃反射牆面', 'Manhattan corner glass facade, reflective storefront wall, taxi shapes reflected in glass', 'Manhattan corner glass facade, tower reflections layered behind'],
  ['戶外：首爾聖水洞街區', 'Seoul Seongsu-dong urban corner, industrial cafe frontage, muted concrete textures', 'Seoul Seongsu-dong urban corner, metal-framed window, small signboard'],
  ['戶外：首爾弘大街頭', 'Seoul Hongdae youth-culture storefront edge, colorful signboards, layered shopfronts', 'Seoul Hongdae youth-culture storefront edge, colorful signboards, layered shopfronts'],
  ['戶外：台北西門町街頭', 'Taipei Ximending street corner, dense commercial signboards, humid-looking storefront reflections', 'Taipei Ximending street corner, dense commercial signboards, arcade edge'],
  ['戶外：洛杉磯日落大道街景', 'Los Angeles Sunset Boulevard sidewalk edge, palm tree trunk segment, large billboard structure', 'Los Angeles Sunset Boulevard sidewalk edge, large billboard structure'],
  ['戶外：新宿歌舞伎町招牌下', 'Shinjuku Kabukicho Ichibangai entrance beneath the iconic red illuminated street-spanning arch sign, steel arch supports, dense nightlife storefronts and layered signboards', 'Shinjuku Kabukicho Ichibangai entrance beneath the iconic red illuminated street-spanning arch sign, steel arch supports, dense nightlife storefronts and layered signboards'],
  ['戶外：新宿歌舞伎町濕地反光角落', 'Kabukicho street corner, wall edge', 'Kabukicho street corner, layered signboards'],
  ['戶外：蘇荷區酒吧門口', 'Soho pub entrance, doorway frame, wall texture', 'Soho pub entrance, pub sign bracket, window trim'],
  ['戶外：蘇荷區招牌下', 'Soho signboard corner, neon sign structure, wall edge', 'Soho signboard corner, neon sign structure, sign bracket detail'],
  ['戶外：Camden 龐克街角', 'Camden punk street corner, red-brick storefront edge, band posters', 'Camden punk street corner, shop sign fragments'],
  ['戶外：倫敦排屋街道', 'London townhouse frontage edge, Victorian terrace facade section, black iron railings', 'London townhouse frontage edge, Victorian terrace facade section'],
  ['室內：法租界咖啡館靠窗座位', 'French Concession cafe window seat, large floor-to-ceiling window, park trees outside', 'French Concession cafe window seat, large floor-to-ceiling window'],
  ['戶外：城市遊艇碼頭欄杆旁', 'urban yacht marina promenade, slim stainless-steel pedestrian handrail with round tubular rails', 'urban yacht marina promenade, moored sailboats and yacht masts'],
  ['戶外：奧地利 Hallstatt 湖畔山村觀景欄杆', 'Hallstatt lakeside village overlook, metal railing foreground, Hallstatter See water edge', 'Hallstatt lakeside village overlook, church spire and steep mountain backdrop'],
  ['戶外：高樓頂樓城市天際線', 'high-rise rooftop edge, rooftop guardrail and concrete parapet, modern city skyline in the distance', 'high-rise rooftop edge, modern city skyline in the distance'],
  ['戶外：飯店度假村泳池露台', 'hotel resort poolside terrace', 'hotel resort poolside terrace, balcony facade'],
  ['戶外：高級飯店陽台城市河景', 'luxury hotel balcony river-view terrace, glass railing, balcony ledge', 'luxury hotel balcony river-view terrace, high-rise facade edge'],
  ['戶外：清澈海灣岩岸', 'clear turquoise cove shoreline, pale rocky coast, shallow transparent seawater', 'clear turquoise cove shoreline, cliff wall edge'],
  ['戶外：岩洞感海灣淺灘', 'rocky seaside cove with cave-like cliff openings, shallow crystalline water, irregular stone shoreline', 'rocky seaside cove with cave-like cliff openings, recessed rock wall'],
  ['戶外：向日葵花田', 'sunflower field edge, dense sunflower stems, large yellow flower heads', 'sunflower field edge, large yellow flower heads'],
].map(Object.freeze);
export const SCENE_DETAIL_CONTROL_LABELS = ['室內：鏡面地板攝影棚', '室內：英式溫室 conservatory', '室內：電車車廂側面走道視角'];
export const SCENE_DETAIL_PRIORITY_REMAINING_MATRIX = SCENE_DETAIL_PRIORITY_REMAINING_CASES.flatMap(([label]) => UPPER_SCENE_ANGLES.flatMap(angle =>
  ['半臉傾斜特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)'].map(frame => upperSceneFixture(label, angle, frame))));
// Half-face framing can coerce an incompatible low camera to eye level before
// rendering.  Keep this integration matrix to the three crop groups that
// actually retain the requested low-camera selection; the independent helper
// test above still covers all low labels and fail-closed behavior.
export const SCENE_DETAIL_PRIORITY_REMAINING_LOW_MATRIX = SCENE_DETAIL_PRIORITY_REMAINING_CASES.flatMap(([label]) => UPPER_SCENE_ANGLES.slice(0, 4).flatMap(angle =>
  ['中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)'].map(frame => upperSceneFixture(label, angle, frame))));
const labels = [...SCENE_DETAIL_PRIORITY_CASES.map(([label]) => label), ...SCENE_DETAIL_CONTROL_LABELS];
export const SCENE_DETAIL_PRIORITY_MATRIX = labels.flatMap(label => UPPER_SCENE_ANGLES.flatMap(angle =>
  ['半臉傾斜特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)'].map(frame => upperSceneFixture(label, angle, frame))));
export const SCENE_DETAIL_PRIORITY_REGRESSION = [
  ...SCENE_DETAIL_PRIORITY_MATRIX,
  ...SCENE_INTEGRATED_ASSEMBLY_FIXTURES.filter(f => f.excluded).flatMap(f => labels.map(label => ({
    ...f, id: `priority/${f.id}/${label}`, locks: { ...f.locks, locationId: { byZh: label }, angleId: { byZh: '腰部高度鏡頭' } },
  }))),
  ...UPPER_SCENE_EXTENSION_REGRESSION,
];
