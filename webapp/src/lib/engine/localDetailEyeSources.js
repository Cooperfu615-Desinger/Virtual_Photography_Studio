import { eyeHairSources, eyeFaceSources, eyeGlassesSources, eyeFrameColors, eyeHairColors } from './localDetailEyeCatalog.js';

// Reviewed eye-only evidence. Exact source matching intentionally rejects
// edited/custom descriptions until their occlusion semantics are reviewed.
const headSources = {
  '黑色口罩': 'black disposable pleated face mask, covering the nose and mouth, fitted ear loops, lower face concealed',
  '防毒面具（3M 6200）': 'grey 3M 6200 reusable half-face respirator, snug nose-and-mouth seal, twin side filter cartridges, adjustable head straps',
  '耳罩式耳機（戴在頭上）': 'black Marshall Major V on-ear headphones worn on the head, compact black earcups, slim structured headband',
  '耳罩式耳機（掛在脖子上）': 'black Marshall Major V on-ear headphones resting around the neck, compact black earcups, slim structured headband visible at the collar',
  '有線耳機': 'wired earphones with visible cable, lightweight in-ear audio accessory',
};
const stylingSources = {
  柔順自然: 'sleek close-to-head roots, restrained volume, compact hair silhouette, fine aligned strands, smooth uniform texture with a soft natural sheen, clean tapered ends, neatly framing the face',
  濕髮分束: 'sleek wet finish, defined damp sections, neat separated strands, controlled close-to-head shape',
};
const coveringSource = 'black elastic stretch-fabric eye covering fitted directly over both eyes, smooth flat surface, hair fully visible and hairstyle preserved, nose and mouth uncovered';
const eyeExpressions = {
  柔和微笑: 'gently narrowed eyes', 平靜淡然: 'softly open eyelids',
  無辜清透: 'softly open eyes', 俏皮忍笑: 'gently narrowed eyes',
  若有所思: 'softened eyelids', 內斂克制: 'relaxed eyelids',
  溫柔含蓄: 'softly open eyelids', 沉浸平靜: 'softly lowered eyelids',
  自然喜悅: 'eyes gently narrowed by the smile', 內斂悲傷: 'softened eyelids',
  克制憤怒: 'focused narrowed eyes', 輕微驚訝: 'slightly widened eyes',
  緊張不安: 'eyes slightly widened with alert tension',
};
const browExpressions = {
  柔和微笑: 'relaxed brows', 平靜淡然: 'relaxed brows', 無辜清透: 'relaxed brows',
  俏皮忍笑: 'relaxed brows', 若有所思: 'slightly drawn inner brows', 內斂克制: 'neutral brows',
  溫柔含蓄: 'relaxed brows', 沉浸平靜: 'relaxed brows', 撒嬌生氣: 'lightly furrowed brows',
  內斂悲傷: 'inner brows slightly raised', 克制憤怒: 'brows drawn together and lowered',
  輕微驚訝: 'raised brows', 緊張不安: 'brows subtly drawn together',
};
const ref = (key, excerpt) => ({ key, excerpt });
const barrier = (id) => ({ id, regions: {}, details: [] });
const open = (key, excerpt) => ({ id: key, regions: Object.fromEntries(
  ['eyes', 'brows', 'periocularSkin'].map((region) => [region, { state: 'exposed', ref: ref(key, excerpt) }])) });
const present = (item) => Boolean(item && item.zh !== '全無' && item.id !== 'none'
  && typeof item.en === 'string' && item.en.trim() && item.en !== 'none');
const detail = (group, region, key, excerpt) => ({ group, region, ref: ref(key, excerpt) });

function hairLayer(character) {
  const hair = character.hairstyle;
  if (!present(hair)) return null;
  const rule = eyeHairSources[hair.zh];
  const styling = character.hairStylingState;
  if (!rule || hair.en !== rule[0] || (present(styling) && styling.en !== stylingSources[styling.zh])) {
    return barrier('unreviewed-hair-occlusion');
  }
  const layer = open('character.hairstyle', hair.en);
  if (!rule[1]) return layer;
  // Near-eye hair has a known local identity, not a guaranteed exact length
  // or amount of visible skin. Keep the source without forcing eyes/brows out.
  layer.regions = {};
  layer.details = [detail('localHairOcclusion', 'periocularSkin', 'character.hairstyle', rule[1])];
  if (present(styling)) layer.details.push(detail('localHairOcclusion', 'periocularSkin',
    'character.hairStylingState', styling.zh === '濕髮分束' ? 'sleek wet finish' : 'fine aligned strands'));
  const color = eyeHairColors[character.hairColor?.zh];
  if (color && character.hairColor.en?.includes(color)) layer.details.push(
    detail('localHairOcclusion', 'periocularSkin', 'character.hairColor', color));
  return layer;
}

export function reviewedEyeLayers(character, wardrobe) {
  const layers = [];
  const head = wardrobe.headAccessory;
  if (present(head)) layers.push(head.en === headSources[head.zh]
    ? open('wardrobe.headAccessory', head.en) : barrier('unreviewed-head-accessory'));
  const eyewear = wardrobe.eyewear;
  if (present(eyewear)) {
    if (eyewear.zh === '眼布' && eyewear.en === coveringSource) {
      // This item explicitly owns placement over both eyes, not an ordinary
      // pair of glasses that can be pushed onto the head. Brows remain unknown.
      const color = wardrobe.eyewearColor;
      const colored = present(color) && color.en === eyeFrameColors[color.zh];
      if (present(color) && !colored) return [...layers, barrier('unreviewed-eye-cover-color')];
      const excerpt = `${colored ? '' : 'black '}elastic stretch-fabric eye covering fitted directly over both eyes`;
      const fragment = detail('eyeCovering', 'eyes', 'wardrobe.eyewear', excerpt);
      if (colored) {
        fragment.colorRef = ref('wardrobe.eyewearColor', color.en.replace(/ frame$/, ''));
      }
      layers.push({ id: 'wardrobe.eyewear', regions: {
        eyes: { state: 'covered', ref: ref('wardrobe.eyewear', excerpt) },
      }, details: [fragment] });
    } else if (eyewear.en === eyeGlassesSources[eyewear.zh] && wardrobe.eyewearPlacement?.zh === '戴在頭頂'
      && wardrobe.eyewearPlacement.en === 'resting on top of the head, pushed into the hair, eyes unobstructed') {
      layers.push(open('wardrobe.eyewearPlacement', 'eyes unobstructed'));
    } else if (eyewear.en === eyeGlassesSources[eyewear.zh]
      && (!present(wardrobe.eyewearPlacement)
        || wardrobe.eyewearPlacement.en === 'worn normally on the face, lenses aligned over the eyes')) {
      const color = wardrobe.eyewearColor;
      if (present(color) && color.en !== eyeFrameColors[color.zh]) return [...layers, barrier('unreviewed-frame-color')];
      // No clear-lens assertion from frame type or frame color. The immediate
      // surrounding hair remains independently readable; eyes/brows do not.
      const layer = { id: 'wardrobe.eyewear', regions: {
        periocularSkin: { state: 'exposed', ref: ref('wardrobe.eyewear', eyewear.en) },
      }, details: [detail('eyewearAtEyes', 'eyes', 'wardrobe.eyewear', eyewear.en)] };
      if (present(color)) layer.details.push(detail('eyewearAtEyes', 'eyes', 'wardrobe.eyewearColor', color.en));
      layers.push(layer);
    } else layers.push(barrier('unreviewed-eyewear'));
  }
  const hair = hairLayer(character);
  if (hair) layers.push(hair);
  if (present(character.hairstyle) && present(character.hairStylingState)
    && character.hairStylingState.en === stylingSources[character.hairStylingState.zh]) {
    layers.push(open('character.hairStylingState', character.hairStylingState.en));
  }
  return layers;
}

export function reviewedEyeExpression(expression) {
  return [['eyes', eyeExpressions], ['brows', browExpressions]].flatMap(([region, map]) => {
    const excerpt = map[expression?.zh];
    return excerpt && expression.en?.includes(excerpt)
      ? [detail('eyeExpression', region, 'character.expression', excerpt)] : [];
  });
}

export function reviewedEyeIdentity(face, sources) {
  const rule = eyeFaceSources[face?.zh];
  if (rule && face.mj?.face === rule[0]) {
    const key = 'character.facialFeatures.mj.face';
    sources[key] = { en: face.mj.face };
    return { layer: { id: key, regions: {
      eyes: { state: 'exposed', ref: ref(key, rule[1]) },
      brows: { state: 'exposed', ref: ref(key, rule[2]) },
      periocularSkin: { state: 'exposed', ref: ref(key, rule[1]) },
    } }, details: [detail('eyeIdentity', 'eyes', key, rule[1]), detail('browIdentity', 'brows', key, rule[2])] };
  }
  // Legacy/raw snapshots without structural metadata keep the previous four
  // source anchors. Stale metadata is not permission to switch identities.
  if (face?.mj?.face) return null;
  const legacy = { 韓系偶像臉: 'clear bright eyes', 日系清透臉: 'clean gentle eyes',
    甜美可愛臉: 'bright friendly eyes', 混血立體臉: 'deep-set eyes' }[face?.zh];
  if (!legacy || !face.en?.includes(legacy)) return null;
  const key = 'character.facialFeatures';
  return { layer: { id: key, regions: { eyes: { state: 'exposed', ref: ref(key, legacy) } } },
    details: [detail('eyeIdentity', 'eyes', key, legacy)] };
}
