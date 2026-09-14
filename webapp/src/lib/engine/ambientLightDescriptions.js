import { LOW_CAMERA_LABELS, DOWNWARD_CAMERA_LABELS } from './zImageSceneDirection.js';

// Reviewed v1 descriptions, bound to exact catalog identities and source text.
// Shared by eligible main GPT/Z only; never mutate catalog or saved selections.
export const AMBIENT_LIGHT_DESCRIPTION_VERSION = '1.0.0';
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const AMBIENT_LIGHT_DESCRIPTIONS = freeze(Object.fromEntries([
  {
    "id": "camera:環境光條件-ambient-light-conditions:晴朗白日:1",
    "zh": "晴朗白日",
    "source": "clear daylight environment, bright daytime sky, clean distant visibility, neutral outdoor air",
    "core": "clear bright daylight with clean visibility",
    "details": [
      {
        "text": "bright daytime sky where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:藍天白雲:2",
    "zh": "藍天白雲",
    "source": "clear blue-sky daylight, saturated azure sky, brilliant white cloud shapes, open airy distance, crisp blue-and-white atmosphere",
    "core": "clear bright daylight with an airy atmosphere",
    "details": [
      {
        "text": "saturated azure sky and brilliant white clouds where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:夏日深藍積雲:3",
    "zh": "夏日深藍積雲",
    "source": "deep azure summer sky, saturated clean blue atmosphere, towering luminous white cumulus clouds, crisp cloud-edge detail, vivid blue-and-white daylight",
    "core": "bright summer daylight with a clear atmosphere",
    "details": [
      {
        "text": "deep azure sky and towering luminous white cumulus clouds where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:雨前灰黑天空:4",
    "zh": "雨前灰黑天空",
    "source": "charcoal-gray pre-rain sky, layered dark storm clouds, dense gray-black cloud mass, low cloud ceiling, preserved cloud detail before rainfall",
    "core": "dim charcoal-grey pre-rain ambience",
    "details": [
      {
        "text": "layered dark storm clouds where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:正午烈日:5",
    "zh": "正午烈日",
    "source": "harsh midday environment, overhead summer sun position, glaring bright sky, heat-baked outdoor air, high-clarity dry distance",
    "core": "harsh midday brightness with dry summer air",
    "details": [
      {
        "text": "high summer sun and glaring sky where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:陰天漫射:6",
    "zh": "陰天漫射",
    "source": "overcast daylight environment, cloud-covered sky, soft diffused air, muted distant contrast, neutral grey-white sky cover",
    "core": "overcast daylight with soft diffused ambient light and muted contrast",
    "details": [
      {
        "text": "grey-white cloud cover where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:清晨薄霧:7",
    "zh": "清晨薄霧",
    "source": "misty morning environment, pale cool sky, soft distant haze, low-contrast dawn air, visible atmospheric perspective",
    "core": "cool misty morning ambience with soft haze and low contrast",
    "details": [
      {
        "text": "pale morning sky where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:晨光日出:8",
    "zh": "晨光日出",
    "source": "sunrise environment, early golden morning sky, fresh crisp air, soft warm horizon glow, low-angle dawn brightness",
    "core": "sunrise ambience with warm low-angle dawn light and fresh morning air",
    "details": [
      {
        "text": "golden morning sky and a soft horizon glow where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:黃昏夕陽:9",
    "zh": "黃昏夕陽",
    "source": "golden sunset environment, warm orange-pink sky gradient, low sun near the horizon, distant amber evening atmosphere",
    "core": "golden sunset ambience with warm amber evening light",
    "details": [
      {
        "text": "orange-pink sky and low sun near the horizon where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:藍調傍晚:10",
    "zh": "藍調傍晚",
    "source": "blue hour environment, deep blue dusk sky, fading ambient daylight, cool evening transition, faint remaining distance light",
    "core": "blue-hour ambience with fading daylight and a cool evening tone",
    "details": [
      {
        "text": "deep blue dusk sky where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:城市夜間混合光:11",
    "zh": "城市夜間混合光",
    "source": "urban night ambience, dark blue-black sky if visible, warm-cool mixed city glow, low nocturnal visibility",
    "core": "urban night ambience with mixed warm and cool city glow",
    "details": [
      {
        "text": "dark blue-black sky where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:月光夜色:12",
    "zh": "月光夜色",
    "source": "moonlit night environment, cool silvery darkness, faint moon glow, natural blue-black night sky, low nocturnal visibility",
    "core": "moonlit night ambience with cool silvery darkness and low visibility",
    "details": [
      {
        "text": "blue-black night sky where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:城市高彩度夜色:13",
    "zh": "城市高彩度夜色",
    "source": "saturated-color urban night ambience, dark night sky, vivid colored city glow, high-chroma reflection tint, low nocturnal visibility",
    "core": "urban night ambience with vivid colored city glow and high-chroma reflections",
    "details": [
      {
        "text": "dark night sky where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:陰雨將至:14",
    "zh": "陰雨將至",
    "source": "storm-brewing humid environment, heavy dark cloud cover, charged damp air, pre-rain pressure, dense low cloud ceiling",
    "core": "dim storm-brewing ambience with humid pre-rain air",
    "details": [
      {
        "text": "heavy low cloud cover where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:雨天陰濕:15",
    "zh": "雨天陰濕",
    "source": "rainy overcast environment, grey-blue rain sky, damp air, wet surfaces, muted visibility, cold daylight atmosphere",
    "core": "rainy overcast ambience with damp air and cold muted daylight",
    "details": [
      {
        "text": "grey-blue rain sky where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:雨後反光:16",
    "zh": "雨後反光",
    "source": "post-rain environment, freshly damp surfaces, reflective stone and wall textures, leftover cloud cover, fresh humid air after rainfall",
    "core": "post-rain ambience with fresh humid air",
    "details": [
      {
        "text": "freshly damp surfaces and reflective stone and wall textures where visible",
        "kind": "surface",
        "lowText": "reflective wall textures where visible"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:雪地冷光:17",
    "zh": "雪地冷光",
    "source": "snow-bright winter environment, cold pale sky, reflective snowy distance, crisp winter air, cool ambient brightness from snow",
    "core": "cold winter ambience with cool ambient brightness from snow",
    "details": [
      {
        "text": "pale sky where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:冬季灰冷:18",
    "zh": "冬季灰冷",
    "source": "cold winter overcast environment, pale grey sky, dry freezing air, subdued daylight, low-saturation winter distance",
    "core": "cold grey winter ambience with subdued daylight and dry freezing air",
    "details": [
      {
        "text": "pale grey sky where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內窗邊日光:19",
    "zh": "室內窗邊日光",
    "source": "indoor window-daylight environment, natural window-lit room brightness, daytime exterior sky if visible",
    "core": "indoor daylight ambience with natural window-lit room brightness",
    "details": [
      {
        "text": "daytime exterior brightness where visible",
        "kind": "exterior"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內清晨冷白日光:20",
    "zh": "室內清晨冷白日光",
    "source": "indoor early-morning daylight environment, cool pale window brightness, crisp interior air, faint cool exterior brightness if visible",
    "core": "indoor early-morning ambience with cool pale daylight and crisp air",
    "details": [
      {
        "text": "faint cool exterior brightness where visible",
        "kind": "exterior"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內午後柔亮日光:21",
    "zh": "室內午後柔亮日光",
    "source": "indoor late-afternoon daylight environment, bright softened room illumination, warm-neutral daylight spread, mellow exterior brightness if visible",
    "core": "indoor late-afternoon ambience with bright softened illumination and warm-neutral daylight",
    "details": [
      {
        "text": "mellow exterior brightness where visible",
        "kind": "exterior"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內陰影日光:22",
    "zh": "室內陰影日光",
    "source": "indoor shaded daylight environment, daylight falling deeper into the room, subdued exterior brightness if visible, dim interior air",
    "core": "shaded indoor daylight with subdued room brightness",
    "details": [
      {
        "text": "daytime exterior brightness where visible",
        "kind": "exterior"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內陰雨昏暗天光:23",
    "zh": "室內陰雨昏暗天光",
    "source": "indoor rainy-day daylight environment, dim grey window brightness, subdued overcast room light, muted exterior sky if visible",
    "core": "indoor rainy-day ambience with dim grey daylight",
    "details": [
      {
        "text": "muted overcast sky where visible",
        "kind": "sky"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內黃昏微暖餘光:24",
    "zh": "室內黃昏微暖餘光",
    "source": "indoor dusk afterglow environment, faint warm residual daylight, dimming room brightness, fading exterior light if visible",
    "core": "indoor dusk ambience with faint warm residual daylight and dimming room brightness",
    "details": [
      {
        "text": "fading exterior light where visible",
        "kind": "exterior"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內暖色夜景:25",
    "zh": "室內暖色夜景",
    "source": "indoor warm night ambience, warm amber room brightness, gentle low-contrast interior glow, dark exterior beyond windows if visible",
    "core": "indoor warm night ambience with amber room brightness and a gentle low-contrast glow",
    "details": [
      {
        "text": "dark exterior where visible",
        "kind": "exterior"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內低照度暖色夜景:26",
    "zh": "室內低照度暖色夜景",
    "source": "indoor low-light warm night ambience, dim amber room brightness, soft shadowed corners, dark exterior if visible",
    "core": "indoor low-light warm night ambience with dim amber brightness and soft shadows",
    "details": [
      {
        "text": "dark exterior where visible",
        "kind": "exterior"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內社交暖色夜景:27",
    "zh": "室內社交暖色夜景",
    "source": "warm low-light social interior ambience, dim amber room brightness, dark background depth, crowded night interior visibility",
    "core": "warm low-light social ambience with dim amber room brightness and dark background depth",
    "details": []
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內極暖低照度:28",
    "zh": "室內極暖低照度",
    "source": "very warm low-light interior ambience, soft amber room darkness, gentle unstable warm tonal variation, deep shadowed corners",
    "core": "very warm low-light indoor ambience with soft amber darkness and deep shadows",
    "details": []
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內冷白環境光:29",
    "zh": "室內冷白環境光",
    "source": "indoor cool artificial ambience, cool-white ambient cast, clean neutral room brightness, dim exterior if visible",
    "core": "indoor artificial-light ambience with a cool-white cast and clean neutral room brightness",
    "details": []
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內冷白高亮日常:30",
    "zh": "室內冷白高亮日常",
    "source": "cool-white everyday interior ambience, clean high room brightness, neutral-cool ambient cast, plain daily visibility",
    "core": "everyday indoor ambience with bright cool-white illumination",
    "details": []
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內高彩度色光夜景:31",
    "zh": "室內高彩度色光夜景",
    "source": "indoor saturated-color night ambience, vivid colored ambient spill, dark exterior if visible, high-chroma low-light atmosphere",
    "core": "indoor night ambience with vivid colored ambient spill and low-light depth",
    "details": [
      {
        "text": "dark exterior where visible",
        "kind": "exterior"
      }
    ]
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內外光滲入微暗空間:32",
    "zh": "室內外光滲入微暗空間",
    "source": "dim interior spill-light environment, exterior light leaking into a mostly dark room, shadowed interior corners, strong dark-room contrast",
    "core": "dim indoor ambience with exterior light spilling into a mostly dark room",
    "details": []
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:室內深夜冷暗微光:33",
    "zh": "室內深夜冷暗微光",
    "source": "very dark late-night interior ambience, faint cool residual brightness, near-unlit room, low nocturnal visibility",
    "core": "very dark late-night indoor ambience with faint cool residual light",
    "details": []
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:高調純白攝影棚:34",
    "zh": "高調純白攝影棚",
    "source": "high-key white studio environment, ultra-clean bright commercial illumination, near-shadowless studio ambience, no background structure specified",
    "core": "high-key white illumination with bright even commercial light and very pale shadows",
    "details": []
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:柔霧美妝攝影棚:35",
    "zh": "柔霧美妝攝影棚",
    "source": "soft beauty studio environment, diffused shadowless illumination, creamy clean light quality, polished commercial portrait ambience, no background structure specified",
    "core": "soft diffused beauty lighting with creamy light quality and very gentle shadows",
    "details": []
  },
  {
    "id": "camera:環境光條件-ambient-light-conditions:舞台演出燈光:36",
    "zh": "舞台演出燈光",
    "source": "stage-inspired studio environment, controlled colored light beams, performance-like ambience, artificial light shafts without generating a stage venue",
    "core": "stage-inspired illumination with controlled colored light beams",
    "details": []
  }
].map(row => [row.id, row])));

export function resolveAmbientLightDescription(item) {
  const entry = AMBIENT_LIGHT_DESCRIPTIONS[item?.id];
  return entry && entry.zh === item.zh && entry.source === item.en ? entry : null;
}

export function renderAmbientLightDescription(entry, target = 'gpt', angle = null) {
  if (!entry) return '';
  const directional = target === 'z' || target === 'directional';
  const low = directional && LOW_CAMERA_LABELS.includes(angle?.zh);
  const downward = directional && DOWNWARD_CAMERA_LABELS.includes(angle?.zh);
  const details = entry.details.flatMap(detail => {
    if (downward && detail.kind === 'sky') return [];
    if (low && detail.kind === 'surface') return detail.lowText ? [detail.lowText] : [];
    return [detail.text];
  });
  return [entry.core, ...details].join(', ');
}
