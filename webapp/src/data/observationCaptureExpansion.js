// Approved 12-scene expansion for the integrated Prompt mode only.
// Preserve the retired standalone generator and its original option arrays.
// Scene sources are reviewed snapshots of the indicated D catalog IDs.
const freezeOptions = options => Object.freeze(options.map(option => Object.freeze(Object.fromEntries(
  Object.entries(option).map(([key, value]) => [key, Array.isArray(value) ? Object.freeze(value) : value]),
))));

export const CAPTURE_EXPANSION_SCENES = freezeOptions([
  {
    "id": "laundromat-washer",
    "zh": "洗衣店洗衣機門前",
    "en": "laundromat washer-door detail, round chrome washer door, sticker-covered machine surface, detergent residue, tiled floor, machine row cropped from one side",
    "sourceLocationId": "locations:生活感室內-indoor-lifestyle:室內-洗衣店洗衣機門前:28",
    "kind": "indoor",
    "chestEn": "a laundromat washing-machine area with chrome machine surfaces and a progress display",
    "actions": [
      "checking-phone",
      "waiting-in-place",
      "adjusting-clothing",
      "loading-laundry",
      "unloading-laundry",
      "checking-washer-progress"
    ],
    "positions": [
      "behind-architecture-edge",
      "casual-phone-angle"
    ],
    "foregrounds": [
      "soft-doorframe",
      "machine-edge",
      "none"
    ],
    "lighting": [
      "neutral-interior-light"
    ]
  },
  {
    "id": "laundromat-folding",
    "zh": "洗衣店摺衣台旁",
    "en": "laundromat folding table, scattered clothes, plastic basket, detergent bottle, tiled floor detail",
    "sourceLocationId": "locations:生活感室內-indoor-lifestyle:室內-洗衣店摺衣台旁:29",
    "kind": "indoor",
    "chestEn": "a laundromat folding area with a folding-table edge and laundry nearby",
    "actions": [
      "checking-phone",
      "waiting-in-place",
      "adjusting-clothing",
      "folding-laundry",
      "spreading-laundry",
      "placing-folded-laundry"
    ],
    "positions": [
      "behind-architecture-edge",
      "casual-phone-angle",
      "below-railing"
    ],
    "foregrounds": [
      "soft-doorframe",
      "table-edge",
      "none"
    ],
    "lighting": [
      "neutral-interior-light"
    ]
  },
  {
    "id": "office-pantry",
    "zh": "辦公室茶水間",
    "en": "Japanese office pantry corner, small sink counter, compact coffee machine, electric kettle, storage cabinets, upper wall cabinets, simple countertop, paper cups and small workplace supplies",
    "sourceLocationId": "locations:生活感室內-indoor-lifestyle:室內-辦公室茶水間:27",
    "kind": "indoor",
    "chestEn": "a Japanese office pantry corner with a coffee machine, kettle, upper cabinets and workplace supplies",
    "actions": [
      "checking-phone",
      "waiting-in-place",
      "adjusting-clothing",
      "holding-drink",
      "operating-coffee-machine",
      "pouring-water",
      "sipping-from-cup"
    ],
    "positions": [
      "behind-architecture-edge",
      "casual-phone-angle",
      "below-railing"
    ],
    "foregrounds": [
      "soft-doorframe",
      "table-edge",
      "none"
    ],
    "lighting": [
      "neutral-interior-light"
    ]
  },
  {
    "id": "library-reading-table",
    "zh": "木造圖書館閱讀桌旁",
    "en": "historic library reading table, aged wood grain tabletop, desk lamp fixture, stacked books, chair edge, nearby shelf rows, worn floor surface",
    "sourceLocationId": "locations:生活感室內-indoor-lifestyle:室內-木造圖書館閱讀桌旁:13",
    "kind": "indoor",
    "chestEn": "a historic library reading area with nearby shelf rows, stacked books and a desk lamp",
    "actions": [
      "checking-phone",
      "browsing-shelf",
      "walking-through",
      "seated-reading",
      "seated-turning-page",
      "seated-taking-notes",
      "seated-checking-phone"
    ],
    "positions": [
      "behind-architecture-edge",
      "casual-phone-angle",
      "distant-telephoto",
      "below-railing",
      "through-shelf-gap"
    ],
    "foregrounds": [
      "soft-doorframe",
      "shelf-edge",
      "table-edge",
      "none"
    ],
    "lighting": [
      "reading-lamp-light"
    ]
  },
  {
    "id": "neighborhood-vending",
    "zh": "社區自動販賣機旁",
    "en": "Japanese residential vending-machine corner, two or three machines beside a wall, utility pole fragment, overhead power lines, quiet curbside asphalt, apartment facade edge, detached house detail, compact neighborhood roadside surface",
    "sourceLocationId": "locations:生活感室內-indoor-lifestyle:戶外-社區自動販賣機旁:34",
    "kind": "outdoor",
    "chestEn": "a Japanese residential vending-machine corner beside a wall, with power lines and neighborhood facades",
    "actions": [
      "checking-phone",
      "waiting-in-place",
      "holding-drink",
      "walking-through",
      "viewing-vending-products",
      "pressing-vending-button",
      "retrieving-vending-drink"
    ],
    "positions": [
      "behind-architecture-edge",
      "casual-phone-angle",
      "distant-telephoto"
    ],
    "foregrounds": [
      "none"
    ],
    "lighting": [
      "cloudy-daylight"
    ]
  },
  {
    "id": "retro-diner",
    "zh": "復古美式 Diner",
    "en": "retro American diner booth, red leather bench seating, chrome table edge, jukebox corner, counter stools, checker or tiled floor, curved booth backrest",
    "sourceLocationId": "locations:生活感室內-indoor-lifestyle:室內-復古美式-diner:12",
    "kind": "indoor",
    "chestEn": "a retro American diner booth with red leather bench backrests, a chrome table edge and a jukebox corner",
    "actions": [
      "checking-phone",
      "waiting-in-place",
      "holding-drink",
      "seated-reading-menu",
      "seated-sipping-from-cup",
      "seated-waiting-for-meal",
      "seated-checking-phone"
    ],
    "positions": [
      "behind-architecture-edge",
      "casual-phone-angle",
      "distant-telephoto",
      "below-railing"
    ],
    "foregrounds": [
      "soft-doorframe",
      "railing-edge",
      "table-edge",
      "none"
    ],
    "lighting": [
      "diner-practical-light"
    ]
  },
  {
    "id": "platform-signboard",
    "zh": "地下月台電子看板與海報牆",
    "en": "underground subway platform signboard corner, amber LED next-train display overhead, stained white tile wall, graffiti tags, movie poster frame, fluorescent ceiling tubes, dark tunnel edge",
    "sourceLocationId": "locations:城市與社群感-urban-social-snapshots:室內-地下月台電子看板與海報牆:7",
    "kind": "indoor",
    "chestEn": "an underground subway platform with an amber LED next-train display, stained tile walls, graffiti tags, a movie poster and fluorescent ceiling tubes",
    "actions": [
      "checking-phone",
      "waiting-in-place",
      "walking-through",
      "turning-back",
      "checking-arrival-board",
      "adjusting-bag-strap"
    ],
    "positions": [
      "behind-architecture-edge",
      "casual-phone-angle",
      "distant-telephoto"
    ],
    "foregrounds": [
      "soft-doorframe",
      "passing-silhouette",
      "none"
    ],
    "lighting": [
      "neutral-interior-light"
    ]
  },
  {
    "id": "train-side-aisle",
    "zh": "電車車廂側面走道視角",
    "en": "Japanese commuter train car side aisle section, vertical grab pole near the subject, overhead hand straps, side bench seats, sliding doors, train windows, route map panels, nearby commuters as background context",
    "sourceLocationId": "locations:城市與社群感-urban-social-snapshots:室內-電車車廂側面走道視角:9",
    "kind": "indoor",
    "chestEn": "a Japanese commuter train aisle with a vertical grab pole, overhead hand straps, sliding doors, windows, route maps and nearby commuters",
    "actions": [
      "checking-phone",
      "waiting-in-place",
      "adjusting-clothing",
      "holding-train-pole",
      "holding-train-strap",
      "holding-pole-checking-phone",
      "adjusting-bag-strap"
    ],
    "positions": [
      "behind-architecture-edge",
      "casual-phone-angle"
    ],
    "foregrounds": [
      "glass-reflection",
      "passing-silhouette",
      "none"
    ],
    "lighting": [
      "carriage-overhead-light"
    ]
  },
  {
    "id": "train-bench",
    "zh": "電車車廂正面長椅視角",
    "en": "Japanese commuter train car interior, slight offset view toward a blue fabric bench seat, window and sliding door panels behind the subject, stainless steel wall surfaces, overhead hand straps, route maps, small carriage posters, passing scenery glimpsed through windows",
    "sourceLocationId": "locations:城市與社群感-urban-social-snapshots:室內-電車車廂正面長椅視角:8",
    "kind": "indoor",
    "chestEn": "a Japanese commuter train bench area with blue fabric seating, windows, sliding door panels, metal wall surfaces, hand straps, route maps and carriage posters",
    "actions": [
      "checking-phone",
      "adjusting-clothing",
      "seated-checking-phone",
      "seated-adjusting-bag",
      "seated-looking-out-window"
    ],
    "positions": [
      "behind-architecture-edge",
      "casual-phone-angle",
      "below-railing"
    ],
    "foregrounds": [
      "glass-reflection",
      "railing-edge",
      "none"
    ],
    "lighting": [
      "carriage-overhead-light"
    ]
  },
  {
    "id": "hachiko-waiting-area",
    "zh": "八公銅像旁行人區",
    "en": "Shibuya Hachiko Square pedestrian waiting area beside the small bronze Hachiko dog statue, modest stone pedestal, low queue railings, station-front plaza paving, clustered meeting crowds, Shibuya Station frontage and nearby commercial facades, realistic landmark scale",
    "sourceLocationId": "locations:城市與社群感-urban-social-snapshots:戶外-八公銅像旁行人區:12",
    "kind": "outdoor",
    "chestEn": "the Shibuya Hachiko Square meeting area with the bronze Hachiko statue, waiting crowds, station frontage and nearby commercial facades",
    "actions": [
      "checking-phone",
      "waiting-in-place",
      "holding-drink",
      "walking-through",
      "turning-back",
      "looking-for-someone",
      "checking-wristwatch",
      "adjusting-bag-strap"
    ],
    "positions": [
      "behind-architecture-edge",
      "casual-phone-angle",
      "distant-telephoto",
      "below-railing"
    ],
    "foregrounds": [
      "railing-edge",
      "passing-silhouette",
      "none"
    ],
    "lighting": [
      "cloudy-daylight",
      "dusk-practical-light"
    ]
  },
  {
    "id": "lakeside-deck",
    "zh": "湖邊木棧道",
    "en": "lakeside wooden deck edge, weathered planks, low railing section, calm water surface beside the deck, reeds or shoreline plants on one side, natural bank detail",
    "sourceLocationId": "locations:自然與戶外-nature-outdoors:戶外-湖邊木棧道:8",
    "kind": "outdoor",
    "chestEn": "a lakeside deck beside calm water, with shoreline plants and a low railing nearby",
    "actions": [
      "leaning-on-rail",
      "walking-through",
      "turning-back",
      "adjusting-hair",
      "holding-drink",
      "looking-down-over-railing",
      "pausing-to-view-lake"
    ],
    "positions": [
      "casual-phone-angle",
      "distant-telephoto",
      "below-railing"
    ],
    "foregrounds": [
      "railing-edge",
      "none"
    ],
    "lighting": [
      "cloudy-daylight"
    ]
  },
  {
    "id": "ryokan-engawa",
    "zh": "日式旅館緣側木廊",
    "en": "traditional Japanese ryokan engawa veranda, raised wooden deck edge, sliding door frames, polished timber posts, stone step, garden greenery below, asymmetric threshold composition",
    "sourceLocationId": "locations:生活感室內-indoor-lifestyle:戶外-日式旅館緣側木廊:36",
    "kind": "outdoor",
    "chestEn": "a traditional Japanese ryokan veranda with sliding door frames, timber posts and garden greenery",
    "actions": [
      "walking-through",
      "turning-back",
      "checking-phone",
      "adjusting-clothing",
      "seated-veranda-rest",
      "seated-holding-teacup",
      "seated-viewing-garden",
      "seated-checking-phone"
    ],
    "positions": [
      "behind-architecture-edge",
      "casual-phone-angle",
      "distant-telephoto"
    ],
    "foregrounds": [
      "soft-doorframe",
      "pillar-edge",
      "none"
    ],
    "lighting": [
      "cloudy-daylight",
      "veranda-daylight"
    ]
  }
]);

export const CAPTURE_EXPANSION_ACTIONS = freezeOptions([
  {
    "id": "loading-laundry",
    "zh": "彎身放入衣物",
    "en": "she bends toward an open washing machine and places a separate piece of laundry into the drum",
    "chestEn": "She bends forward toward the washing machine, concentrating on loading laundry; her hands and the drum opening are below the chest-up frame.",
    "focused": true
  },
  {
    "id": "unloading-laundry",
    "zh": "彎身取出衣物",
    "en": "she bends toward an open washing machine and lifts out a separate piece of laundry toward a laundry basket beside it",
    "chestEn": "She bends forward toward the washing machine, concentrating on unloading laundry; her hands and the basket are below the chest-up frame.",
    "focused": true
  },
  {
    "id": "checking-washer-progress",
    "zh": "查看洗衣進度",
    "en": "she leans slightly toward the washing machine to read its progress display",
    "chestEn": "She leans slightly forward, focusing on the washing machine progress display.",
    "focused": true
  },
  {
    "id": "folding-laundry",
    "zh": "在桌面摺衣服",
    "en": "she stands at the folding table and uses both hands to fold a separate piece of laundry laid on the tabletop",
    "chestEn": "She stands with her upper body inclined toward the folding table, concentrating on folding laundry with her hands below the chest-up frame.",
    "focused": true
  },
  {
    "id": "spreading-laundry",
    "zh": "拿起衣物攤平",
    "en": "she stands at the folding table and lifts a separate piece of laundry from the pile, spreading it between both hands",
    "chestEn": "She stands at the folding table with her arms reaching forward, focused on spreading a separate piece of laundry below the chest-up frame.",
    "focused": true
  },
  {
    "id": "placing-folded-laundry",
    "zh": "將衣物放入洗衣籃",
    "en": "she stands beside the folding table and lowers a folded piece of laundry into a nearby laundry basket",
    "chestEn": "She stands with her upper body slightly inclined, looking down as her hands lower folded laundry into a basket below the chest-up frame.",
    "focused": true
  },
  {
    "id": "operating-coffee-machine",
    "zh": "操作咖啡機",
    "en": "she stands at the pantry counter and presses a coffee-machine button, with a cup placed beneath its spout",
    "chestEn": "She stands at the pantry counter, looking toward the coffee machine while her hand operates a button below the chest-up frame.",
    "focused": true
  },
  {
    "id": "pouring-water",
    "zh": "拿水壺倒水",
    "en": "she stands at the pantry counter and tilts a kettle to pour water into a cup resting on the countertop",
    "chestEn": "She stands with her gaze lowered toward the pantry counter, pouring water with the kettle and cup below the chest-up frame.",
    "focused": true
  },
  {
    "id": "sipping-from-cup",
    "zh": "端杯喝一口",
    "en": "she stands during a short break and raises a cup to her lips for a small sip",
    "chestEn": "She raises a cup to her lips for a small sip, keeping her shoulders relaxed.",
    "focused": false
  },
  {
    "id": "seated-reading",
    "zh": "坐著低頭閱讀",
    "en": "she sits on a chair at the reading table and looks down at an open book resting on the tabletop",
    "chestEn": "She is seated with her head lowered toward an open book below the chest-up frame.",
    "focused": true
  },
  {
    "id": "seated-turning-page",
    "zh": "坐著翻頁",
    "en": "she sits at the reading table, holding an open book steady with one hand while turning a page with the other",
    "chestEn": "She is seated with her head lowered toward her book, turning a page with her hands below the chest-up frame.",
    "focused": true
  },
  {
    "id": "seated-taking-notes",
    "zh": "坐著做筆記",
    "en": "she sits at the reading table and writes in a notebook with a pen, with an open book beside it",
    "chestEn": "She is seated, looking down in concentration as she writes notes below the chest-up frame.",
    "focused": true
  },
  {
    "id": "viewing-vending-products",
    "zh": "查看販賣機商品",
    "en": "she stands facing the vending-machine display, looking across the different drinks",
    "chestEn": "She faces the vending-machine display, her eyes scanning the displayed drinks.",
    "focused": true
  },
  {
    "id": "pressing-vending-button",
    "zh": "按下飲料選擇鍵",
    "en": "she stands facing the vending machine and reaches out to press a drink-selection button",
    "chestEn": "She faces the vending machine with one arm reaching toward a drink-selection button below the chest-up frame.",
    "focused": true
  },
  {
    "id": "retrieving-vending-drink",
    "zh": "彎身取出飲料",
    "en": "she bends toward the vending machine and reaches into its lower collection opening to take out a drink",
    "chestEn": "She bends forward toward the vending machine, looking down as she retrieves a drink below the chest-up frame.",
    "focused": true
  },
  {
    "id": "seated-reading-menu",
    "zh": "坐著看菜單",
    "en": "she sits in the diner booth and looks down at a menu resting on the table",
    "chestEn": "She is seated in the diner booth with her gaze lowered toward a menu below the chest-up frame.",
    "focused": true
  },
  {
    "id": "seated-sipping-from-cup",
    "zh": "坐著端杯喝一口",
    "en": "she sits at the diner table and raises a cup from the tabletop to her lips for a small sip",
    "chestEn": "She is seated with relaxed shoulders, raising a cup to her lips for a small sip.",
    "focused": false
  },
  {
    "id": "seated-waiting-for-meal",
    "zh": "坐著等餐",
    "en": "she sits in the diner booth waiting for her meal, her hands resting naturally near the table edge as she looks across the interior",
    "chestEn": "She is seated with relaxed shoulders while waiting for her meal, looking across the diner interior.",
    "focused": false
  },
  {
    "id": "checking-arrival-board",
    "zh": "抬頭查看到站資訊",
    "en": "she stands in the platform waiting area and looks up at the electronic next-train display",
    "chestEn": "She tilts her head upward to read the electronic next-train display.",
    "focused": true
  },
  {
    "id": "adjusting-bag-strap",
    "zh": "調整肩上背包帶",
    "en": "she stands and uses one hand to pull her backpack shoulder strap into a comfortable position",
    "chestEn": "She uses one hand to adjust the backpack strap on her shoulder.",
    "focused": false
  },
  {
    "id": "holding-train-pole",
    "zh": "扶著立柱站立",
    "en": "she stands in the train aisle with one hand gripping a vertical grab pole, her body balanced naturally",
    "chestEn": "She stands upright with one arm extended to hold a vertical grab pole, her grip below the chest-up frame.",
    "focused": false
  },
  {
    "id": "holding-train-strap",
    "zh": "抓著吊環站立",
    "en": "she stands in the train aisle with one hand raised to hold an overhead strap, her other arm relaxed",
    "chestEn": "She stands upright with one arm raised to hold an overhead train strap.",
    "focused": false
  },
  {
    "id": "holding-pole-checking-phone",
    "zh": "扶柱低頭看手機",
    "en": "she stands in the train aisle with one hand holding a vertical grab pole and the other holding a phone that she looks down at",
    "chestEn": "She stands with her gaze lowered toward her phone, her pole grip and phone held below the chest-up frame.",
    "focused": true
  },
  {
    "id": "seated-checking-phone",
    "zh": "坐著低頭看手機",
    "en": "she sits on a seat and looks down at a phone held in front of her lap",
    "chestEn": "She is seated with her gaze lowered toward her phone, her hands and phone below the chest-up frame.",
    "focused": true
  },
  {
    "id": "seated-adjusting-bag",
    "zh": "整理膝上提包",
    "en": "she sits on the train bench and looks down as she adjusts the opening or contents of a handbag resting on her lap",
    "chestEn": "She is seated with her head lowered, arranging a handbag with her hands below the chest-up frame.",
    "focused": true
  },
  {
    "id": "seated-looking-out-window",
    "zh": "坐著側頭看窗外",
    "en": "she sits on the train bench and turns her head naturally toward the nearby window to look outside",
    "chestEn": "She is seated with her head turned toward the nearby train window, looking outside.",
    "focused": true
  },
  {
    "id": "looking-for-someone",
    "zh": "在人群中張望找人",
    "en": "she stands among the waiting people and turns her head to look for someone in the crowd",
    "chestEn": "She turns her head while scanning the waiting crowd for someone.",
    "focused": true
  },
  {
    "id": "checking-wristwatch",
    "zh": "抬腕查看時間",
    "en": "she stands and raises her wrist to check the time on her wristwatch",
    "chestEn": "She lowers her gaze toward her raised wristwatch, with her wrist below the chest-up frame.",
    "focused": true
  },
  {
    "id": "looking-down-over-railing",
    "zh": "扶欄俯看水面",
    "en": "she rests her hands on the lakeside railing and leans slightly forward to look down at the water",
    "chestEn": "She leans slightly forward and looks down toward the lake, with her hands resting on the railing below the chest-up frame.",
    "focused": true
  },
  {
    "id": "pausing-to-view-lake",
    "zh": "停步眺望湖面",
    "en": "she pauses beside the lakeside deck with her arms relaxed and looks across the distant lake",
    "chestEn": "She pauses with relaxed shoulders, looking across the distant lake.",
    "focused": true
  },
  {
    "id": "seated-veranda-rest",
    "waistEn": "she sits on the raised wooden veranda edge with an unhurried, relaxed posture",
    "zh": "坐在木廊邊休息",
    "en": "she sits on the raised wooden veranda edge with her legs hanging naturally over the lower garden side",
    "chestEn": "She is seated at the wooden veranda edge with relaxed shoulders and an unhurried posture.",
    "focused": false
  },
  {
    "id": "seated-holding-teacup",
    "zh": "坐著雙手捧杯",
    "en": "she sits on the wooden veranda and holds a ceramic teacup in both hands in front of her",
    "chestEn": "She is seated with relaxed shoulders, holding a ceramic teacup in both hands below the chest-up frame.",
    "focused": false
  },
  {
    "id": "seated-viewing-garden",
    "zh": "坐著望向庭院",
    "en": "she sits on the wooden veranda and looks naturally toward the garden",
    "chestEn": "She is seated with her head turned naturally toward the garden.",
    "focused": true
  }
]);

export const CAPTURE_EXPANSION_LIGHTING = freezeOptions([
  {
    "id": "neutral-interior-light",
    "zh": "室內日常白光",
    "en": "neutral white practical indoor lighting with ordinary ambient shadows and no studio key light"
  },
  {
    "id": "reading-lamp-light",
    "zh": "閱讀燈暖光",
    "en": "warm practical reading-lamp light falling across the reading area with soft ambient library shadows"
  },
  {
    "id": "diner-practical-light",
    "zh": "餐館暖色燈光",
    "en": "warm practical diner lighting with soft reflections on chrome surfaces and gentle shadows around the booths"
  },
  {
    "id": "carriage-overhead-light",
    "zh": "車廂頂燈",
    "en": "even overhead commuter-train lighting with natural reflections on the metal interior and subdued window light"
  },
  {
    "id": "veranda-daylight",
    "zh": "木廊簷下自然光",
    "en": "soft garden daylight reaching the shaded veranda beneath the eaves with gentle natural shadows"
  }
]);

export const CAPTURE_EXPANSION_FOREGROUNDS = freezeOptions([
  {
    "id": "table-edge",
    "zh": "桌面邊緣遮擋",
    "en": "a softly blurred table or counter edge crosses the lower foreground while leaving the subject visible"
  },
  {
    "id": "machine-edge",
    "zh": "洗衣機邊緣遮擋",
    "en": "the softly blurred edge of a nearby washing machine frames one side of the foreground"
  }
]);
