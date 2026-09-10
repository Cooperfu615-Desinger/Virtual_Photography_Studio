const freezeOptions = (options) => Object.freeze(options.map((option) => Object.freeze(option)));

export const OBSERVATION_CAPTURE_SCENES = freezeOptions([
  {
    id: 'cafe-corner',
    zh: '咖啡廳角落',
    en: 'a real public cafe corner with small tables, chairs, a counter edge, and ordinary customers moving naturally in the background',
    kind: 'indoor',
  },
  {
    id: 'shopping-mall',
    zh: '購物中心走道',
    en: 'a public shopping-mall walkway with storefronts, polished floor reflections, and everyday foot traffic',
    kind: 'indoor',
  },
  {
    id: 'convenience-store',
    zh: '便利商店門口',
    en: 'the public entrance of a convenience store with fluorescent interior light, glass doors, product shelves, and passing customers',
    kind: 'indoor',
  },
  {
    id: 'bookstore-aisle',
    zh: '書店走道',
    en: 'a public bookstore aisle with tall shelves, narrow walking space, stacked books, and quiet everyday movement',
    kind: 'indoor',
  },
  {
    id: 'train-station',
    zh: '車站大廳',
    en: 'a public train-station concourse with ticket machines, structural columns, directional signs, and commuters in the distance',
    kind: 'indoor',
  },
  {
    id: 'street-corner',
    zh: '城市街角',
    en: 'a public city street corner with storefronts, curb edges, passing bicycles, and layered urban background detail',
    kind: 'outdoor',
  },
  {
    id: 'park-path',
    zh: '公園步道',
    en: 'a public park path with trees, benches, a paved walkway, and ordinary visitors in the middle distance',
    kind: 'outdoor',
  },
  {
    id: 'commercial-street',
    zh: '夜間商業街',
    en: 'a public commercial street at dusk with practical shop lights, signs, wet pavement, and people moving through the scene',
    kind: 'outdoor',
  },
]);

export const OBSERVATION_CAPTURE_POSITIONS = freezeOptions([
  {
    id: 'behind-architecture-edge',
    zh: '從建築邊緣後方觀察',
    en: 'the camera observes from just behind the edge of nearby architecture',
    kinds: ['indoor', 'outdoor'],
  },
  {
    id: 'through-shelf-gap',
    zh: '從貨架間隙觀察',
    en: 'the camera observes through a narrow gap between nearby shelves or display objects',
    kinds: ['indoor'],
  },
  {
    id: 'through-storefront-glass',
    zh: '隔著玻璃觀察',
    en: 'the camera observes through storefront or cafe glass with layered reflections between the lens and subject',
    kinds: ['indoor', 'outdoor'],
  },
  {
    id: 'distant-telephoto',
    zh: '遠距離長焦觀察',
    en: 'the camera works from a respectful distance, compressing the space with a long telephoto view',
    kinds: ['indoor', 'outdoor'],
  },
  {
    id: 'casual-phone-angle',
    zh: '手機隨手角度',
    en: 'the camera is held casually at an off-center phone-snapshot angle rather than a formal portrait position',
    kinds: ['indoor', 'outdoor'],
  },
  {
    id: 'below-railing',
    zh: '從欄杆或桌面下方觀察',
    en: 'the camera sits low behind a railing, bench, or table edge, creating a grounded hidden-observation angle',
    kinds: ['outdoor', 'indoor'],
  },
]);

export const OBSERVATION_CAPTURE_FOREGROUNDS = freezeOptions([
  {
    id: 'soft-doorframe',
    zh: '門框或牆角遮擋',
    en: 'a softly blurred doorframe or wall edge covers part of one side of the foreground while leaving a clear opening toward her',
    kinds: ['indoor'],
  },
  {
    id: 'shelf-edge',
    zh: '貨架邊緣遮擋',
    en: 'a nearby shelf edge and a few out-of-focus objects cover part of the lower foreground',
    kinds: ['indoor'],
  },
  {
    id: 'pillar-edge',
    zh: '柱子邊緣遮擋',
    en: 'a nearby pillar softly blocks part of the frame, with the subject visible through an irregular opening',
    kinds: ['indoor', 'outdoor'],
  },
  {
    id: 'glass-reflection',
    zh: '玻璃反射前景',
    en: 'transparent glass reflections and faint ghosted highlights cross the frame without hiding her face',
    kinds: ['indoor', 'outdoor'],
  },
  {
    id: 'railing-edge',
    zh: '欄杆或座椅邊緣遮擋',
    en: 'a railing or bench edge crosses the near foreground and creates an imperfect partial frame',
    kinds: ['outdoor', 'indoor'],
  },
  {
    id: 'passing-silhouette',
    zh: '路人前景掠過',
    en: 'a softly blurred passing silhouette brushes the edge of the frame while the subject remains recognizable',
    kinds: ['indoor', 'outdoor'],
  },
]);

export const OBSERVATION_CAPTURE_LENSES = freezeOptions([
  {
    id: 'phone-wide',
    zh: '手機廣角快照',
    en: 'a 28mm-equivalent smartphone lens with casual handheld immediacy and slight computational-phone perspective',
  },
  {
    id: 'human-scale-35mm',
    zh: '35mm 人文視角',
    en: 'a 35mm lens with a human-scale street perspective and believable subject-to-environment depth',
  },
  {
    id: 'short-telephoto-85mm',
    zh: '85mm 中長焦',
    en: 'an 85mm short telephoto lens with gentle background compression and a discreet working distance',
  },
  {
    id: 'long-telephoto-135mm',
    zh: '135mm 長焦',
    en: 'a 135mm long telephoto lens with strong spatial compression and a narrow observational field of view',
  },
]);

export const OBSERVATION_CAPTURE_ACTIONS = freezeOptions([
  {
    id: 'checking-phone',
    zh: '低頭查看手機',
    en: 'she is checking her phone while waiting, caught in the middle of an ordinary moment rather than posing',
  },
  {
    id: 'adjusting-hair',
    zh: '自然整理頭髮',
    en: 'she is casually adjusting her hair as she moves, with an unfinished everyday grooming gesture',
  },
  {
    id: 'holding-drink',
    zh: '拿著飲料休息',
    en: 'she is holding a takeaway drink during a brief pause, relaxed and only loosely aware of her surroundings',
  },
  {
    id: 'browsing-shelf',
    zh: '瀏覽貨架或書架',
    en: 'she is browsing a shelf and reaching toward one item, focused on the small task in front of her',
  },
  {
    id: 'waiting-in-place',
    zh: '在原地等待',
    en: 'she is waiting in place with an unplanned posture, shifting her weight naturally between her feet',
  },
  {
    id: 'walking-through',
    zh: '走過畫面',
    en: 'she is walking through the space with a small amount of natural movement in her hair and clothing',
  },
  {
    id: 'adjusting-clothing',
    zh: '整理衣服',
    en: 'she is briefly adjusting the hem or sleeve of her clothing while continuing with her day',
  },
  {
    id: 'leaning-on-rail',
    zh: '靠在欄杆旁',
    en: 'she is leaning casually against a railing and looking away from the camera',
  },
  {
    id: 'turning-back',
    zh: '走動中回頭',
    en: 'she is turning back while moving through the scene, as if responding to something outside the frame',
  },
]);

export const OBSERVATION_CAPTURE_DISCOVERY_STATES = freezeOptions([
  {
    id: 'unaware',
    zh: '沒有察覺鏡頭',
    en: 'she remains unaware of the camera, absorbed in the small action',
  },
  {
    id: 'brief-side-glance',
    zh: '短暫側眼注意',
    en: 'she briefly notices the camera with a restrained side glance while keeping the moment natural',
  },
  {
    id: 'quietly-aware',
    zh: '察覺但保持自然',
    en: 'she pauses with a subtle aware expression, acknowledging the camera without an exaggerated reaction',
  },
]);

export const OBSERVATION_CAPTURE_LIGHTING = freezeOptions([
  {
    id: 'cloudy-daylight',
    zh: '陰天柔光',
    en: 'soft overcast daylight with gentle direction and no studio key light',
    kinds: ['outdoor'],
  },
  {
    id: 'cool-mall-light',
    zh: '商場冷白光',
    en: 'cool white practical lighting from the public interior with natural mixed reflections',
    kinds: ['indoor'],
  },
  {
    id: 'warm-cafe-light',
    zh: '咖啡廳暖光',
    en: 'warm ambient cafe light with soft window spill and ordinary interior shadows',
    kinds: ['indoor'],
  },
  {
    id: 'fluorescent-store-light',
    zh: '便利商店螢光燈',
    en: 'flat fluorescent convenience-store light with cool highlights and realistic mixed exposure',
    kinds: ['indoor'],
  },
  {
    id: 'dusk-practical-light',
    zh: '黃昏街燈',
    en: 'soft dusk light mixed with practical storefront and street lighting',
    kinds: ['outdoor'],
  },
  {
    id: 'park-filtered-light',
    zh: '樹蔭自然光',
    en: 'natural daylight filtered through nearby trees with broken soft shadow patches',
    kinds: ['outdoor'],
  },
]);

export const OBSERVATION_CAPTURE_TEXTURES = freezeOptions([
  {
    id: 'phone-processing',
    zh: '手機運算直出',
    en: 'subtle smartphone computational processing, automatic exposure balance, and restrained JPEG sharpening',
  },
  {
    id: 'compact-camera-grain',
    zh: '小型相機顆粒',
    en: 'light compact-camera grain, natural tonal variation, and a slightly imperfect documentary surface',
  },
  {
    id: 'minor-motion-blur',
    zh: '輕微動態模糊',
    en: 'a small amount of natural motion blur in moving hair or clothing while the face remains recognizable',
  },
  {
    id: 'focus-imperfection',
    zh: '輕微失焦瑕疵',
    en: 'a slight focus imperfection and ordinary handheld exposure variation rather than polished studio sharpness',
  },
  {
    id: 'reflection-interference',
    zh: '反射干擾質感',
    en: 'subtle reflection interference and translucent highlight ghosts from the nearby glass or polished surfaces',
  },
]);

export const OBSERVATION_CAPTURE_OPTION_GROUPS = Object.freeze({
  scenes: OBSERVATION_CAPTURE_SCENES,
  positions: OBSERVATION_CAPTURE_POSITIONS,
  foregrounds: OBSERVATION_CAPTURE_FOREGROUNDS,
  lenses: OBSERVATION_CAPTURE_LENSES,
  actions: OBSERVATION_CAPTURE_ACTIONS,
  discoveryStates: OBSERVATION_CAPTURE_DISCOVERY_STATES,
  lighting: OBSERVATION_CAPTURE_LIGHTING,
  textures: OBSERVATION_CAPTURE_TEXTURES,
});
