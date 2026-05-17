# PAGE3 World Street Scene Design

## Purpose

PAGE3 will be refocused into a world street-scene photography builder. The first implementation phase is PAGE3-only: it will not change PAGE1 portrait generation, wardrobe/location compatibility, or person-scene prompt behavior.

The goal is to generate realistic city, street, landmark, and high-view scene prompts that feel like work from a photographer traveling through major cities. The system should support both documentary street fragments and recognizable travel/cityscape photographs, while preserving the existing indoor scene direction for later reuse.

## Phase 1 Scope

In scope:

- Rebuild PAGE3 around global street-scene photography.
- Add scene intent modes for street-only, cityscape, and high-view/aerial outputs.
- Add camera system, focal length/viewpoint, imaging style, and ambient light controls.
- Create a first world street-scene dataset covering 10 cities with 5 location anchors per city.
- Generate PAGE3 outputs from structured location data rather than one flat location sentence.
- Keep outputs useful for realistic image generation, not just descriptive cataloging.

Out of scope for phase 1:

- PAGE1 portrait prompt changes.
- PAGE1 character or wardrobe interaction with locations.
- Person-in-scene modes such as portrait street snap or subject-small-in-landscape.
- Random-lock behavior changes outside PAGE3.
- Firebase, Favorites, or import/export changes unless required by existing PAGE3 saved-card behavior.

## PAGE3 Positioning

PAGE3 becomes a dedicated "world street-scene photography workbench." It should create prompts for scenes where the city, street, landmark, architecture, or public environment is the subject.

The primary outputs remain:

- `Scene Anchor`: short structured location anchor.
- `Scene Prompt`: main direct-use prompt.
- `Cinematic Prompt`: stronger film-still version with richer atmosphere and composition.
- `World Prompt`: broader city-world / environment-study version, still grounded in real places.

## Scene Modes

PAGE3 phase 1 should support these scene modes:

| Mode | Purpose | Prompt Behavior |
| :--- | :--- | :--- |
| 街拍：單純場景 | Documentary street scene without a deliberate human subject. | Emphasize street fragments, storefronts, traffic, pedestrians as incidental life, signs, surfaces, and urban texture. |
| 空景城市攝影 | Cleaner city / landmark / architecture / travel scene. | Emphasize recognizable place, coherent composition, architecture, streetscape, and travel-photography realism. |
| 空拍 / 高視角地景 | Drone-like or elevated view. | Emphasize spatial layout, bridges, roads, waterways, rooftops, skyline relationships, and high-view geography. |

Important distinction:

- `街拍：單純場景` can include incidental people, cars, scooters, signs, shopfront clutter, and street life.
- `空景城市攝影` should feel more composed and cleaner, like city travel/editorial photography.
- `空拍 / 高視角地景` should not fake impossible drone access when a grounded high viewpoint is more realistic; it can use bridge, rooftop, observation deck, hillside, or drone-like language depending on the location.

## Photography Controls

PAGE3 should add controls that affect the photographic reading of the scene:

### Camera System

Suggested first options:

- Leica M street rangefinder
- Ricoh GR compact street camera
- Fujifilm X100 series
- Sony full-frame mirrorless
- Canon / Nikon DSLR editorial camera
- Medium-format digital camera
- Drone camera
- Smartphone documentary camera

### Focal Length / Viewpoint

Suggested first options:

- 24mm wide street view
- 28mm documentary street view
- 35mm classic street photography
- 50mm natural perspective
- 85mm compressed street detail
- 135mm telephoto compression
- Elevated wide city view
- Drone-like overhead view

### Imaging Style

Suggested first options:

- realistic documentary street photography
- travel editorial photography
- Japanese photobook street realism
- cinematic city still
- high-resolution commercial cityscape
- snapshot flash street photography
- color negative film grain
- clean digital realism

### Ambient Light Mood

Suggested first options:

- overcast daylight
- clear morning daylight
- harsh midday sun
- golden hour side light
- blue hour city glow
- humid night reflections
- neon mixed light
- rainy street reflections
- soft winter daylight
- hazy summer heat

These controls should be PAGE3-specific in phase 1. Existing PAGE1 lighting controls should not be reworked yet.

## Location Data Model

Each world location should be stored as structured data, not only as a single prompt string.

Proposed shape:

```js
{
  city: "Osaka",
  country: "Japan",
  district: "Dotonbori / Namba",
  locationName: "Ebisubashi Bridge over Dotonbori Canal",
  labelZh: "大阪｜道頓堀戎橋河道",
  landmarkCues: [
    "Dotonbori canal",
    "Ebisubashi Bridge railing",
    "Glico running man billboard",
    "giant crab restaurant sign",
    "dense layered restaurant signboards"
  ],
  streetPositions: [
    "crowded pedestrian bridge",
    "wet canal-side pavement",
    "layered restaurant storefronts and signboards"
  ],
  cityscapePositions: [
    "view from Ebisubashi Bridge facing the canal",
    "canal-side promenade with bridge and billboards"
  ],
  aerialPositions: [
    "elevated view over Dotonbori canal and its bridges"
  ],
  realismGuards: [
    "avoid generic cyberpunk alley",
    "keep the canal and bridge relationship clear",
    "avoid random invented skyline"
  ]
}
```

The implementation can start with this structure either as a new PAGE3 data module or as metadata layered on top of the current location database. The key requirement is that prompt builders can choose different location fragments depending on scene mode.

## Realism Strategy

To make places feel more real, prompts should prefer:

- Specific geographic anchors: bridge, station exit, square, canal, boulevard, temple gate, market street, pier, hillside viewpoint.
- Visual landmark cues: recognizable sign shapes, street furniture, building materials, transit details, railings, pavement, storefront density.
- Spatial relationships: canal below bridge, tower in the distance, square behind arcade, skyline beyond harbor, crosswalk in foreground.
- Photographer position: from bridge railing, at storefront edge, from sidewalk corner, from observation deck, from canal-side walkway.
- Realism guards: avoid generic cyberpunk neon alley, avoid invented skyline, avoid tourist-poster overcleaning, avoid unreadable fake signage dominating the image.

Prompts should avoid demanding exact text reproduction on signs. Image models often hallucinate lettering. Use shape and placement cues instead, such as `running man billboard`, `giant crab restaurant sign`, or `dense restaurant signboards`.

## Initial City Pack

Phase 1 uses 10 globally recognizable street-photography cities, 5 anchors each.

### Taipei

- 台北｜西門町紅樓與徒步街區
- 台北｜信義區台北 101 街角
- 台北｜迪化街老街騎樓與紅磚店屋
- 台北｜華山文創園區紅磚倉庫
- 台北｜象山高視角城市夜景

### Tokyo

- 東京｜澀谷 Scramble Crossing
- 東京｜新宿歌舞伎町招牌街
- 東京｜表參道精品街與玻璃立面
- 東京｜下北澤巷弄古著店街
- 東京｜東京鐵塔周邊街角 / 增上寺視角

### Osaka

- 大阪｜道頓堀戎橋河道
- 大阪｜新世界通天閣商店街
- 大阪｜心齋橋筋商店街
- 大阪｜梅田高架橋下街景
- 大阪｜大阪城公園與城郭遠景

### Seoul

- 首爾｜弘大街頭與青年文化商圈
- 首爾｜聖水洞工業咖啡街區
- 首爾｜明洞霓虹商業街
- 首爾｜北村韓屋村石牆巷
- 首爾｜漢江橋邊 / 城市河岸大景

### Hong Kong

- 香港｜中環石板街與舊式招牌
- 香港｜旺角霓虹街道與密集招牌
- 香港｜廟街夜市與路邊餐桌
- 香港｜銅鑼灣電車街景
- 香港｜維多利亞港 / 天星碼頭大景

### Paris

- 巴黎｜艾菲爾鐵塔 Trocadéro 台階
- 巴黎｜瑪黑區石牆街角與精品門面
- 巴黎｜塞納河岸與橋欄杆
- 巴黎｜孚日廣場拱廊
- 巴黎｜蒙馬特石階與街角咖啡館

### London

- 倫敦｜Soho 酒吧街與招牌門面
- 倫敦｜Shoreditch 紅磚塗鴉街
- 倫敦｜Camden 龐克街角
- 倫敦｜Westminster / Big Ben 河岸大景
- 倫敦｜Notting Hill 彩色排屋街

### New York

- 紐約｜Times Square 霓虹廣場
- 紐約｜SoHo 鑄鐵建築與精品櫥窗
- 紐約｜Brooklyn Bridge 橋上 / 橋下視角
- 紐約｜Chinatown 店招與窄街
- 紐約｜DUMBO 曼哈頓橋街景

### Rome

- 羅馬｜西班牙階梯
- 羅馬｜特雷維噴泉周邊街角
- 羅馬｜Trastevere 石板巷弄
- 羅馬｜競技場外圍石牆大景
- 羅馬｜老城咖啡館外桌與暖色牆面

### Los Angeles

- 洛杉磯｜Hollywood Boulevard 招牌街
- 洛杉磯｜Sunset Boulevard 棕櫚與看板
- 洛杉磯｜Venice Beach 海岸步道
- 洛杉磯｜Downtown LA 高樓街角
- 洛杉磯｜Griffith Observatory 城市大景

## Prompt Assembly

PAGE3 prompt assembly should follow this order:

1. Scene mode intent.
2. City / country / district / anchor.
3. Landmark cues and spatial relationships.
4. Mode-specific camera position.
5. Camera system and focal/viewpoint.
6. Imaging style.
7. Ambient light mood.
8. Realism guards.

Example, street-only scene:

```text
documentary street photograph of Dotonbori canal in Osaka, crowded Ebisubashi Bridge and canal-side pavement, layered restaurant storefronts and dense signboards, Glico running man billboard and giant crab restaurant sign as recognizable visual cues, wet pavement reflections, shot on a Ricoh GR with a 28mm documentary street view, color negative film grain, humid night reflections, realistic Osaka Namba entertainment-district geography, avoid generic cyberpunk alley, avoid random invented skyline
```

Example, cityscape:

```text
realistic travel editorial photograph of Dotonbori canal in Osaka from Ebisubashi Bridge, canal water running below the bridge railing, Glico running man billboard visible above the south side of the canal, giant restaurant signs and dense Namba facades around the waterway, Sony full-frame mirrorless camera, 35mm natural perspective, clean digital realism, blue hour city glow, keep the bridge-canal-signboard relationship clear
```

Example, elevated/aerial:

```text
drone-like elevated cityscape over Dotonbori canal in Osaka, Ebisubashi Bridge crossing the canal, dense restaurant signboards packed along both sides of the waterway, Namba entertainment district surrounding the canal, wide elevated city view, high-resolution commercial cityscape, blue hour city glow, realistic urban geography, avoid generic skyline replacement
```

## UI Direction

PAGE3 controls should be grouped into a small number of clear panels:

- `Scene Intent`: scene mode.
- `World Location`: city and location anchor.
- `Camera`: camera system and focal/viewpoint.
- `Look`: imaging style and ambient light mood.
- `Outputs`: Scene Anchor, Scene Prompt, Cinematic Prompt, World Prompt.

The first implementation should prioritize reliable prompt output over visual complexity. The UI can remain close to the existing PAGE3 layout if the control grouping is clear.

## Validation Plan

Validation should include:

- `python3 scripts/sync_to_json.py` if location data touches the knowledge base.
- `npm run lint`.
- `npm run build`.
- Manual prompt review for at least:
  - Osaka Dotonbori street-only scene.
  - Tokyo Shibuya cityscape.
  - Hong Kong Victoria Harbour high-view scene.
  - Paris Trocadéro cityscape.
  - Los Angeles Griffith Observatory high-view scene.
- Confirm each mode changes the prompt meaning clearly.
- Confirm PAGE1 output remains unchanged in phase 1.

## Open Follow-Up

Before implementation, the final plan should decide whether the new PAGE3 world-scene data lives in:

- a new dedicated JS data module for structured scene anchors, or
- `knowledge_base` plus sync-generated JSON metadata.

For phase 1, a dedicated PAGE3 data module is likely cleaner because the structure is richer than the current flat Markdown table format.
