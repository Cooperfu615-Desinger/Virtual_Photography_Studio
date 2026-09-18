import { LOW_CAMERA_LABELS } from './zImageSceneDirection.js';

// Approved selection exception for reviewed existing catalog sources, not new
// scenery. The caller owns ordinary-single-main eligibility. Shared projection,
// other renderers and the eighteen authored upper-scene additions stay intact.
export const Z_IMAGE_SCENE_DETAIL_PRIORITY_VERSION = '1.1.0';
const record = (identity, previous, preferred) => Object.freeze({
  identity, previous: Object.freeze(previous),
  preferred: Object.freeze(preferred.map(clause => Object.freeze(
    typeof clause === 'string' ? { source: clause, text: clause } : clause))),
});
export const Z_IMAGE_SCENE_DETAIL_PRIORITIES = Object.freeze({
  'locations:生活感室內-indoor-lifestyle:室內-倫敦老咖啡館角落:17': record(
    'old London cafe corner', ['dark wood table', 'fogged window glass'],
    ['fogged window glass', { source: 'pendant lamp fixture as a visible object', text: 'pendant lamp fixture' }]),
  'locations:生活感室內-indoor-lifestyle:室內-辦公室茶水間:27': record(
    'Japanese office pantry corner', ['small sink counter', 'compact coffee machine'],
    ['compact coffee machine', 'upper wall cabinets']),
  'locations:生活感室內-indoor-lifestyle:室內-宮廷音樂廳-歌劇院:37': record(
    'opulent opera house interior', ['chandelier fixtures', 'velvet seat rows cropped from one side'],
    ['chandelier fixtures', 'ornate balcony rail']),
  'locations:地下與廢墟風格-abandoned-underground:室內-廢棄手術室:7': record(
    'abandoned operating room', ['broken surgical table', 'metal tray stand'],
    ['peeling tiled walls', 'ceiling rail']),
  'locations:城市與社群感-urban-social-snapshots:室內-九龍城寨內部狹窄走道:0': record(
    'Kowloon Walled City interior passage', ['narrow wall-to-wall corridor', 'water-stained concrete walls'],
    ['narrow wall-to-wall corridor', 'overhead pipes']),
  'locations:城市與社群感-urban-social-snapshots:室內-電車車廂正面長椅視角:8': record(
    'Japanese commuter train car interior', ['slight offset view toward a blue fabric bench seat', 'window and sliding door panels behind the subject'],
    ['slight offset view toward a blue fabric bench seat', 'overhead hand straps']),
  'locations:城市與社群感-urban-social-snapshots:室內-電車車廂坐滿與站滿乘客:10': record(
    'crowded Japanese commuter train car', ['seated passengers on bench seats', 'standing commuters around vertical grab poles'],
    ['seated passengers on bench seats', 'standing commuters around vertical grab poles', 'overhead hand straps in use']),
  'locations:攝影棚與背景-studio-sets:室內-crt-電視牆攝影棚:13': record(
    'studio set with assorted CRT televisions and vintage computer monitors in an irregular high-low cluster',
    ['retro cathode-ray displays with varied gaps and heights', 'glowing screens with analog static'],
    ['retro cathode-ray displays with varied gaps and heights']),
  'locations:生活感室內-indoor-lifestyle:室內-白色書櫃落地窗臥室:7': record(
    'vintage white bookcase bedroom corner', ['tall white bookshelf filled with books', 'large window edge'],
    ['tall white bookshelf filled with books', 'large window edge']),
  'locations:生活感室內-indoor-lifestyle:戶外-日本住宅陽台曬衣架旁:32': record(
    'Japanese apartment balcony with laundry rack', ['freshly washed clothes hanging to dry', 'metal railing'],
    ['neighboring apartment facades']),
  'locations:生活感室內-indoor-lifestyle:戶外-社區自動販賣機旁:34': record(
    'Japanese residential vending-machine corner', ['two or three machines beside a wall', 'utility pole fragment'],
    ['overhead power lines', 'apartment facade edge']),
  'locations:生活感室內-indoor-lifestyle:戶外-辦公大樓人行道-上班途中:35': record(
    'Japanese business-district office sidewalk', ['glass-and-steel office tower frontage'],
    ['glass-and-steel office tower frontage']),
  'locations:地下與廢墟風格-abandoned-underground:室內-地下狂歡俱樂部-金庫:15': record(
    'underground rave bunker room', ['laser fixtures mounted on metal truss', 'smoke machine as a visible device'],
    ['laser fixtures mounted on metal truss']),
  'locations:地下與廢墟風格-abandoned-underground:戶外-高樓建築骨架施工鷹架旁:24': record(
    'construction scaffolding side area', ['steel pipes', 'dusty tarp'],
    ['steel pipes', 'unfinished concrete column']),
  'locations:地下與廢墟風格-abandoned-underground:戶外-高樓建築骨架開放樓層邊緣:25': record(
    'open high-rise floor edge', ['exposed beams'], ['exposed beams']),
  'locations:城市與社群感-urban-social-snapshots:室內-地下月台電子看板與海報牆:7': record(
    'underground subway platform signboard corner', ['amber LED next-train display overhead', 'stained white tile wall'],
    ['amber LED next-train display overhead', 'fluorescent ceiling tubes']),
  'locations:城市與社群感-urban-social-snapshots:戶外-澀谷站前廣場人潮邊緣:11': record(
    'Shibuya Station front plaza edge near Hachiko Square', ['dense realistic foot traffic'],
    ['station-front commercial facade layers']),
  'locations:城市與社群感-urban-social-snapshots:戶外-八公銅像旁行人區:12': record(
    'Shibuya Hachiko Square pedestrian waiting area beside the small bronze Hachiko dog statue', ['low queue railings'],
    ['Shibuya Station frontage and nearby commercial facades']),
  'locations:城市與社群感-urban-social-snapshots:戶外-澀谷站前大型看板下穿越口:13': record(
    'Shibuya station-side crossing entrance beneath oversized commercial billboards', ['bold crosswalk stripes at the intersection edge', 'waiting pedestrian clusters'],
    ['tower facades packed with signage']),
  'locations:城市與社群感-urban-social-snapshots:戶外-目黑川旁的櫻花隧道:14': record(
    'Meguro River bridge viewpoint', ['bridge railing in the foreground', 'river channel offset along one side'],
    ['one riverside cherry blossom canopy']),
  'locations:城市與社群感-urban-social-snapshots:戶外-大阪道頓堀心齋橋河道:15': record(
    'Dotonbori Shinsaibashi riverside edge in Osaka', ['iconic billboard signage', 'Shinsaibashi bridge railing in the foreground'],
    ['iconic billboard signage', 'dense commercial facade layers']),
  'locations:城市與社群感-urban-social-snapshots:戶外-九龍城寨雜貨店門口:16': record(
    'Kowloon Walled City grocery storefront', ['narrow shop entrance', 'stacked goods'], ['hanging signs']),
  'locations:城市與社群感-urban-social-snapshots:戶外-九龍城寨電器行外牆與管線:17': record(
    'Kowloon Walled City appliance shop wall', ['exposed conduits', 'old electrical boxes'],
    ['hanging shop signs', 'exposed conduits']),
  'locations:城市與社群感-urban-social-snapshots:戶外-孚日廣場拱廊下:20': record(
    'Place des Vosges arcade side bay', ['brick arch segment'], ['brick arch segment']),
  'locations:城市與社群感-urban-social-snapshots:戶外-孚日廣場草地邊與紅磚立面:21': record(
    'Place des Vosges lawn edge', ['red-brick facade section'],
    ['red-brick facade section', 'shuttered windows']),
  'locations:城市與社群感-urban-social-snapshots:戶外-曼哈頓街角玻璃反射牆面:24': record(
    'Manhattan corner glass facade', ['reflective storefront wall', 'taxi shapes reflected in glass'],
    ['tower reflections layered behind']),
  'locations:城市與社群感-urban-social-snapshots:戶外-首爾聖水洞街區:26': record(
    'Seoul Seongsu-dong urban corner', ['industrial cafe frontage', 'muted concrete textures'],
    ['metal-framed window', 'small signboard']),
  'locations:城市與社群感-urban-social-snapshots:戶外-首爾弘大街頭:27': record(
    'Seoul Hongdae youth-culture storefront edge', ['colorful signboards', 'layered shopfronts'],
    ['colorful signboards', 'layered shopfronts']),
  'locations:城市與社群感-urban-social-snapshots:戶外-台北西門町街頭:28': record(
    'Taipei Ximending street corner', ['dense commercial signboards', 'humid-looking storefront reflections'],
    ['dense commercial signboards', 'arcade edge']),
  'locations:城市與社群感-urban-social-snapshots:戶外-洛杉磯日落大道街景:29': record(
    'Los Angeles Sunset Boulevard sidewalk edge', ['palm tree trunk segment', 'large billboard structure'],
    ['large billboard structure']),
  'locations:城市與社群感-urban-social-snapshots:戶外-新宿歌舞伎町招牌下:30': record(
    'Shinjuku Kabukicho Ichibangai entrance beneath the iconic red illuminated street-spanning arch sign',
    ['steel arch supports', 'dense nightlife storefronts and layered signboards'],
    ['steel arch supports', 'dense nightlife storefronts and layered signboards']),
  'locations:城市與社群感-urban-social-snapshots:戶外-新宿歌舞伎町濕地反光角落:33': record(
    'Kabukicho street corner', ['wall edge'], ['layered signboards']),
  'locations:城市與社群感-urban-social-snapshots:戶外-蘇荷區酒吧門口:34': record(
    'Soho pub entrance', ['doorway frame', 'wall texture'], ['pub sign bracket', 'window trim']),
  'locations:城市與社群感-urban-social-snapshots:戶外-蘇荷區招牌下:36': record(
    'Soho signboard corner', ['neon sign structure', 'wall edge'], ['neon sign structure', 'sign bracket detail']),
  'locations:城市與社群感-urban-social-snapshots:戶外-camden-龐克街角:40': record(
    'Camden punk street corner', ['red-brick storefront edge', 'band posters'], ['shop sign fragments']),
  'locations:城市與社群感-urban-social-snapshots:戶外-倫敦排屋街道:41': record(
    'London townhouse frontage edge', ['Victorian terrace facade section', 'black iron railings'],
    ['Victorian terrace facade section']),
  'locations:城市與社群感-urban-social-snapshots:室內-法租界咖啡館靠窗座位:44': record(
    'French Concession cafe window seat', ['large floor-to-ceiling window', 'park trees outside'],
    ['large floor-to-ceiling window']),
  'locations:城市與社群感-urban-social-snapshots:戶外-城市遊艇碼頭欄杆旁:52': record(
    'urban yacht marina promenade', ['slim stainless-steel pedestrian handrail with round tubular rails'],
    ['moored sailboats and yacht masts']),
  'locations:城市與社群感-urban-social-snapshots:戶外-奧地利-hallstatt-湖畔山村觀景欄杆:53': record(
    'Hallstatt lakeside village overlook', ['metal railing foreground', 'Hallstatter See water edge'],
    ['church spire and steep mountain backdrop']),
  'locations:城市與社群感-urban-social-snapshots:戶外-高樓頂樓城市天際線:54': record(
    'high-rise rooftop edge', ['rooftop guardrail and concrete parapet', 'modern city skyline in the distance'],
    ['modern city skyline in the distance']),
  'locations:城市與社群感-urban-social-snapshots:戶外-飯店度假村泳池露台:55': record(
    'hotel resort poolside terrace', [], ['balcony facade']),
  'locations:城市與社群感-urban-social-snapshots:戶外-高級飯店陽台城市河景:56': record(
    'luxury hotel balcony river-view terrace', ['glass railing', 'balcony ledge'], ['high-rise facade edge']),
  'locations:自然與戶外-nature-outdoors:戶外-清澈海灣岩岸:1': record(
    'clear turquoise cove shoreline', ['pale rocky coast', 'shallow transparent seawater'], ['cliff wall edge']),
  'locations:自然與戶外-nature-outdoors:戶外-岩洞感海灣淺灘:2': record(
    'rocky seaside cove with cave-like cliff openings', ['shallow crystalline water', 'irregular stone shoreline'],
    ['recessed rock wall']),
  'locations:自然與戶外-nature-outdoors:戶外-向日葵花田:5': record(
    'sunflower field edge', ['dense sunflower stems', 'large yellow flower heads'], ['large yellow flower heads']),
});

export function selectZImageSceneDetails(value, location, angle) {
  const source = String(value || '');
  const rule = Z_IMAGE_SCENE_DETAIL_PRIORITIES[location?.id];
  if (!rule || !source || !LOW_CAMERA_LABELS.includes(angle?.zh)) return source;
  const split = text => text.split(/\s*,\s*/).map(part => part.trim());
  const catalog = split(String(location.en || ''));
  const current = split(source);
  const prefix = [rule.identity, ...rule.previous];
  // Fail closed on catalog drift, missing approved fragments, overridden scene
  // identity or a changed projection. Never resurrect an empty scene or infer
  // a replacement from an unknown/imported source.
  if (catalog[0] !== rule.identity || !prefix.every((part, i) => current[i] === part)
    || !rule.preferred.every(part => catalog.includes(part.source))) return source;
  const preferred = rule.preferred.map(part => part.text);
  const selected = new Set([rule.identity, ...preferred]);
  // Preserve surviving trailing conditions, but do not duplicate selected text.
  const tail = current.slice(prefix.length).filter(part => !selected.has(part));
  return [rule.identity, ...preferred, ...tail].join(', ');
}
