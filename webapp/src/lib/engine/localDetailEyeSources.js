// Reviewed eye-only evidence. Exact source matching intentionally rejects
// edited/custom descriptions until their occlusion semantics are reviewed.
const headSources = {
  '黑色口罩': 'black disposable pleated face mask, covering the nose and mouth, fitted ear loops, lower face concealed',
  '防毒面具（3M 6200）': 'grey 3M 6200 reusable half-face respirator, snug nose-and-mouth seal, twin side filter cartridges, adjustable head straps',
  '耳罩式耳機（戴在頭上）': 'black Marshall Major V on-ear headphones worn on the head, compact black earcups, slim structured headband',
  '耳罩式耳機（掛在脖子上）': 'black Marshall Major V on-ear headphones resting around the neck, compact black earcups, slim structured headband visible at the collar',
  '有線耳機': 'wired earphones with visible cable, lightweight in-ear audio accessory',
};
const hairSource = 'slicked-back short hair, hair combed away from the forehead, sharp compact fashion silhouette';
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
const ref = (key, excerpt) => ({ key, excerpt });
const barrier = (id) => ({ id, regions: {}, details: [] });
const open = (key, excerpt) => ({ id: key, regions: Object.fromEntries(
  ['eyes', 'brows', 'periocularSkin'].map((region) => [region, { state: 'exposed', ref: ref(key, excerpt) }])) });
const present = (item) => Boolean(item && item.zh !== '全無' && item.id !== 'none'
  && typeof item.en === 'string' && item.en.trim() && item.en !== 'none');

export function reviewedEyeLayers(character, wardrobe) {
  const layers = [];
  const head = wardrobe.headAccessory;
  if (present(head)) layers.push(head.en === headSources[head.zh]
    ? open('wardrobe.headAccessory', head.en) : barrier('unreviewed-head-accessory'));
  if (present(character.hairstyle)) {
    const hair = character.hairstyle;
    const styling = character.hairStylingState;
    if (hair.zh === '帥氣濕亮油頭' && hair.en === hairSource
      && (!present(styling) || styling.en === stylingSources[styling.zh])) {
      layers.push(open('character.hairstyle', 'hair combed away from the forehead'));
      if (present(styling)) layers.push(open('character.hairStylingState', styling.en));
    } else layers.push(barrier('unreviewed-hair-occlusion'));
  }
  const eyewear = wardrobe.eyewear;
  if (present(eyewear)) {
    if (eyewear.zh === '眼布' && eyewear.en === coveringSource) {
      // This item explicitly owns placement over both eyes, not an ordinary
      // pair of glasses that can be pushed onto the head. Brows remain unknown.
      const excerpt = 'black elastic stretch-fabric eye covering fitted directly over both eyes';
      layers.push({ id: 'wardrobe.eyewear', regions: {
        eyes: { state: 'covered', ref: ref('wardrobe.eyewear', excerpt) },
      }, details: [{ group: 'eyeCovering', region: 'eyes', ref: ref('wardrobe.eyewear', excerpt) }] });
    } else if (eyewear.zh !== '眼布' && wardrobe.eyewearPlacement?.zh === '戴在頭頂'
      && wardrobe.eyewearPlacement.en === 'resting on top of the head, pushed into the hair, eyes unobstructed') {
      layers.push(open('wardrobe.eyewearPlacement', 'eyes unobstructed'));
    } else layers.push(barrier('unreviewed-eyewear'));
  }
  return layers;
}

export function reviewedEyeExpression(expression) {
  const excerpt = eyeExpressions[expression?.zh];
  return excerpt && expression.en?.includes(excerpt)
    ? [{ group: 'eyeExpression', region: 'eyes', ref: ref('character.expression', excerpt) }] : [];
}
