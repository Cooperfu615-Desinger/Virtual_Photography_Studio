import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((item) => item.key === controlKey);
  assert.ok(control, `Expected control ${controlKey}`);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

test('special subject control exposes dedicated special subject options', () => {
  const specialSubjectControl = getLockControls().find((control) => control.key === 'specialSubjectId');
  const specialSubjectOptions = specialSubjectControl.options.filter((option) => option.specialSubject);

  assert.deepEqual(
    specialSubjectOptions.map((option) => [option.id, option.zh]),
    [
      ['skeleton', '黑骷髏'],
      ['white-skeleton', '白骷髏'],
      ['sengoku-samurai', '日本戰國武士'],
      ['european-knight', '歐洲騎士'],
      ['female-android', '女性人形機器人'],
    ]
  );
});

test('character profile control exposes character profile cards separately from special subjects', () => {
  const specialSubjectControl = getLockControls().find((control) => control.key === 'specialSubjectId');
  const characterProfileControl = getLockControls().find((control) => control.key === 'characterProfileId');
  const characterCards = characterProfileControl.options.filter((option) => option.specialSubject === 'character-profile');

  assert.equal(specialSubjectControl.options.some((option) => option.specialSubject === 'character-profile'), false);
  assert.deepEqual(
    characterCards.map((option) => [option.id, option.zh, option.specialToneZh]),
    [
      ['character-48g', '48G 灰帽黑髮角色', '48G 固定角色卡'],
      ['character-philippa', 'Philippa 黑白挑染蕾絲角色', 'Philippa 哥德蕾絲角色卡'],
      ['character-sakura', 'Sakura 白兔帽粉棕髮角色', 'Sakura 白兔帽日常角色卡'],
      ['character-hinata', 'Hinata 灰綠短髮藍針織角色', 'Hinata 藍針織街拍角色卡'],
      ['character-rika', 'Rika 黑長髮白T牛仔角色', 'Rika 白T牛仔室內角色卡'],
      ['character-rin', 'Rin 黑短捲髮眼鏡襯衫角色', 'Rin 眼鏡白襯衫正裝角色卡'],
    ]
  );
  assert.deepEqual(
    characterCards.find((option) => option.id === 'character-48g').referenceImages.map((image) => [image.type, image.publicPath]),
    [
      ['face-turnaround', '/character-cards/48g/48_G_01.jpeg'],
      ['full-body', '/character-cards/48g/48_G_02.jpeg'],
      ['expression-sheet', '/character-cards/48g/48_G_03.jpeg'],
    ]
  );
  assert.deepEqual(
    characterCards.find((option) => option.id === 'character-philippa').referenceImages.map((image) => [image.type, image.publicPath]),
    [
      ['face-turnaround', '/character-cards/philippa/29_Philippa_01.png'],
      ['portrait-scene', '/character-cards/philippa/29_Philippa_00.jpeg'],
      ['full-body', '/character-cards/philippa/29_Philippa_02.jpeg'],
    ]
  );
  assert.deepEqual(
    characterCards.find((option) => option.id === 'character-sakura').referenceImages.map((image) => [image.type, image.publicPath]),
    [
      ['portrait-closeup', '/character-cards/sakura/12_Sakura_00.jpeg'],
      ['face-turnaround', '/character-cards/sakura/12_Sakura_01.png'],
      ['full-body', '/character-cards/sakura/12_Sakura_02.png'],
    ]
  );
  assert.deepEqual(
    characterCards.find((option) => option.id === 'character-hinata').referenceImages.map((image) => [image.type, image.publicPath]),
    [
      ['portrait-closeup', '/character-cards/hinata/06_Hinata_00.png'],
      ['full-body', '/character-cards/hinata/06_Hinata_03.png'],
      ['expression-sheet', '/character-cards/hinata/06_Hinata_01A.png'],
      ['face-turnaround', '/character-cards/hinata/06_Hinata_01.png'],
    ]
  );
  assert.deepEqual(
    characterCards.find((option) => option.id === 'character-rika').referenceImages.map((image) => [image.type, image.publicPath]),
    [
      ['portrait-closeup', '/character-cards/rika/11_Rika_00.jpeg'],
      ['portrait-scene', '/character-cards/rika/11_Rika_03.png'],
      ['full-body', '/character-cards/rika/11_Rika_02.png'],
      ['face-turnaround', '/character-cards/rika/11_Rika_01.png'],
    ]
  );
  assert.deepEqual(
    characterCards.find((option) => option.id === 'character-rin').referenceImages.map((image) => [image.type, image.publicPath]),
    [
      ['face-turnaround', '/character-cards/rin/38_Rin_01.png'],
      ['portrait-closeup', '/character-cards/rin/38_Rin_00.jpeg'],
      ['full-body', '/character-cards/rin/38_Rin_02.png'],
    ]
  );
});

test('character profile card replaces normal identity and wardrobe while preserving reference guidance', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-48g',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-48g');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /48G 灰帽黑髮角色|48G 固定角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman with doll-like facial features/);
  assert.doesNotMatch(promptText, /fixed original adult female character profile based on the supplied character reference sheets/);
  assert.match(promptText, /glossy black shoulder-length layered lob haircut with airy see-through bangs/);
  assert.match(promptText, /soft smoky eye makeup/);
  assert.match(promptText, /taupe-gray cropped hooded zip jacket worn open with the hood usually worn up/);
  assert.match(promptText, /black lace bralette neckline/);
  assert.match(promptText, /low-rise faded blue denim mini skirt worn unbuttoned/);
  assert.match(promptText, /zipper slightly pulled down/);
  assert.match(promptText, /visible thin-strap black lace thong waistband/);
  assert.match(promptText, /small off-white shoulder bag with thin black strap/);
  assert.match(promptText, /black lace-up ankle boots with glossy rounded toes/);
  assert.match(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /taupe-gray cropped hooded zip jacket/);
  assert.match(prompt.midjourneyPrompt, /low-rise faded blue denim mini skirt worn unbuttoned/);
  assert.match(prompt.midjourneyPrompt, /visible thin-strap black lace thong waistband/);
  assert.match(prompt.midjourneyPrompt, /black lace-up ankle boots/);
});

test('character profile card still composes with expression and pose composer', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-48g',
    expressionId: optionId('expressionId', '直視鏡頭｜平靜淡然'),
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '單腳重心'),
    poseHandId: optionId('poseHandId', '雙手在身前交握'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    poseAnchorId: optionId('poseAnchorId', '全無'),
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-48g');
  assert.equal(prompt.selection.poseBaseId, optionId('poseBaseId', '站姿'));
  assert.match(promptText, /calm neutral expression|relaxed half-lidded ease/);
  assert.match(promptText, /She is standing/);
  assert.match(promptText, /one-leg weight shift/);
  assert.match(promptText, /both hands clasped loosely in front of the body/);
});

test('philippa character profile card preserves gothic lace identity and wardrobe', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-philippa',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-philippa');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /Philippa 黑白挑染蕾絲角色|Philippa 哥德蕾絲角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman with pale gothic beauty/);
  assert.match(promptText, /clear pale gray-green eyes with a cool glassy gaze/);
  assert.match(promptText, /long center-parted wavy black hair with clean black bangs/);
  assert.match(promptText, /solid black front face-framing strands/);
  assert.match(promptText, /silver-white dip-dye streaks concentrated only through the rear and lower trailing hair sections near the back hair tips/);
  assert.match(promptText, /front bangs and front hair remain black without light streaks/);
  assert.match(promptText, /black high-neck gothic lace dress/);
  assert.match(promptText, /sheer mesh long sleeves/);
  assert.match(promptText, /black floral lace sleeve appliques/);
  assert.match(promptText, /floor-length translucent black tulle skirt overlay/);
  assert.match(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /black high-neck gothic lace dress/);
  assert.match(prompt.midjourneyPrompt, /sheer mesh long sleeves/);
  assert.match(prompt.midjourneyPrompt, /floor-length translucent black tulle skirt overlay/);
});

test('sakura character profile card preserves blue eyes bunny hood and soft lounge outfit', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-sakura',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-sakura');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /Sakura 白兔帽粉棕髮角色|Sakura 白兔帽日常角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman with soft doll-like kawaii facial features/);
  assert.match(promptText, /large vivid clear blue eyes/);
  assert.match(promptText, /peach-pink blush/);
  assert.match(promptText, /long loose wavy warm chestnut-brown hair with dusty rose-pink streaks/);
  assert.match(promptText, /white plush bunny-eared hood/);
  assert.match(promptText, /pink inner ears/);
  assert.match(promptText, /oversized ivory-white fleece pullover hoodie/);
  assert.match(promptText, /relaxed beige oatmeal sweatpants/);
  assert.match(promptText, /clean white low-top sneakers/);
  assert.match(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /white plush bunny-eared hood/);
  assert.match(prompt.midjourneyPrompt, /oversized ivory-white fleece pullover hoodie/);
  assert.match(prompt.midjourneyPrompt, /relaxed beige oatmeal sweatpants/);
});

test('hinata character profile card preserves ash-gray bob and cobalt knit street outfit without plastic bag', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-hinata',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-hinata');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /Hinata 灰綠短髮藍針織角色|Hinata 藍針織街拍角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman with refined mature-pretty facial features/);
  assert.match(promptText, /clear hazel-gray eyes/);
  assert.match(promptText, /smoky ash-gray hair with muted sage-green undertones/);
  assert.match(promptText, /short wavy shoulder-grazing bob/);
  assert.match(promptText, /deep cobalt blue cable-knit turtleneck bodysuit sweater/);
  assert.match(promptText, /high-cut hip openings exposing both side waist and upper hip/);
  assert.match(promptText, /medium-wash skinny blue jeans/);
  assert.match(promptText, /black leather belt/);
  assert.match(promptText, /black leather ankle boots/);
  assert.match(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /plastic bag|shopping bag|grocery bag/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /deep cobalt blue cable-knit turtleneck bodysuit sweater/);
  assert.match(prompt.midjourneyPrompt, /medium-wash skinny blue jeans/);
  assert.match(prompt.midjourneyPrompt, /black leather ankle boots/);
});

test('rika character profile card preserves black wavy hair white tee and light denim styling', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-rika');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /Rika 黑長髮白T牛仔角色|Rika 白T牛仔室內角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman with soft doll-like indie-girl facial features/);
  assert.match(promptText, /large clear gray-brown eyes/);
  assert.match(promptText, /glossy natural black long wavy hair/);
  assert.match(promptText, /straight airy see-through bangs/);
  assert.match(promptText, /fitted cropped white short-sleeve baby tee/);
  assert.match(promptText, /small minimalist black line-art chest graphic/);
  assert.match(promptText, /black fitted long arm sleeves/);
  assert.match(promptText, /black-and-white beaded choker necklace/);
  assert.match(promptText, /light-wash high-waisted straight-leg jeans/);
  assert.match(promptText, /small silver ring keychain clipped to the front belt loop/);
  assert.match(promptText, /clean white low-top sneakers/);
  assert.match(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /fitted cropped white short-sleeve baby tee/);
  assert.match(prompt.midjourneyPrompt, /light-wash high-waisted straight-leg jeans/);
  assert.match(prompt.midjourneyPrompt, /clean white low-top sneakers/);
});

test('rin character profile card preserves black curly bob glasses and white shirt formal styling', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rin',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-rin');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /Rin 黑短捲髮眼鏡襯衫角色|Rin 眼鏡白襯衫正裝角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman with elegant intelligent doll-like facial features/);
  assert.match(promptText, /clear warm brown eyes/);
  assert.match(promptText, /glossy natural black short curly bob/);
  assert.match(promptText, /soft parted see-through bangs/);
  assert.match(promptText, /thin rectangular brown-gold metal frame eyeglasses/);
  assert.match(promptText, /small gold hoop earrings/);
  assert.match(promptText, /layered delicate gold necklaces/);
  assert.match(promptText, /crisp white oversized button-down shirt/);
  assert.match(promptText, /charcoal high-waisted tailored straight trousers/);
  assert.match(promptText, /black leather loafers/);
  assert.match(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /book|notebook|tablet|paper|document/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /crisp white oversized button-down shirt/);
  assert.match(prompt.midjourneyPrompt, /charcoal high-waisted tailored straight trousers/);
  assert.match(prompt.midjourneyPrompt, /black leather loafers/);
});

test('white skeleton uses skeleton generation path and ivory bone language', () => {
  const locks = {
    ...createEmptyLocks(),
    specialSubjectId: 'white-skeleton',
  };

  const [prompt] = generatePrompts(1, locks);
  const promptText = [
    prompt.midjourneyPrompt,
    prompt.grokPrompt,
    prompt.zImagePrompt,
    prompt.summary,
  ].join('\n');

  assert.equal(prompt.selection.subjectCount, '1');
  assert.equal(prompt.selection.specialSubjectId, 'white-skeleton');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /白骷髏|warm ivory bone tone|aged off-white bone surface|米白骨色/);
  assert.match(promptText, /unknown anomalous figure appearing naturally inside a real contemporary environment/);
  assert.match(promptText, /realistic scale, contact shadows, ambient light, and ordinary surroundings/);
  assert.doesNotMatch(promptText, /dark blue-black bone tone/);
});

test('historical warrior special subjects disable wardrobe and preserve expression and pose only', () => {
  const locks = {
    ...createEmptyLocks(),
    specialSubjectId: 'sengoku-samurai',
  };

  const [prompt] = generatePrompts(1, locks);
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'sengoku-samurai');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /日本戰國武士/);
  assert.match(promptText, /female Japanese Sengoku-era samurai/);
  assert.match(promptText, /feminine bust-waist-hip silhouette/);
  assert.match(promptText, /live-action photographic realism|practical physical construction|documentary-real material detail/);
  assert.match(promptText, /present-day world|real contemporary environment/);
  assert.match(promptText, /戰國女武士甲冑/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:|not anime|not cosplay|battlefield presence/);
});

test('sengoku samurai reads as a polished noble-house warrior instead of a weathered ronin', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'sengoku-samurai',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.match(promptText, /noble aristocratic house|well-groomed noble bearing|clean polished layered lamellar armor/);
  assert.match(promptText, /pristine silk lacing|meticulously maintained materials|documentary-real armor detail/);
  assert.doesNotMatch(promptText, /weathered fabric ties|worn lacquer|ronin|fallen warrior|mud-stained|battle-worn/);
});

test('sengoku samurai includes a model-decided helmet placement and vivid armor main color', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'sengoku-samurai',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.match(promptText, /kabuto helmet/);
  assert.match(promptText, /worn on the head or held in one hand/);
  assert.match(promptText, /let the image model decide/);
  assert.match(promptText, /one model-decided vivid main armor color/);
  assert.match(promptText, /brilliant red|royal blue|pure white|emerald green|glossy reflective lacquer black/);
});

test('european knight special subject is female with feminine armor shaping', () => {
  const locks = {
    ...createEmptyLocks(),
    specialSubjectId: 'european-knight',
  };

  const [prompt] = generatePrompts(1, locks);
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'european-knight');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /歐洲騎士/);
  assert.match(promptText, /female medieval European knight/);
  assert.match(promptText, /feminine bust-waist-hip silhouette/);
  assert.match(promptText, /live-action photographic realism|practical physical construction|documentary-real material detail/);
  assert.match(promptText, /present-day world|real contemporary environment/);
  assert.match(promptText, /中世紀女騎士板甲/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:|not fantasy armor|not cosplay|chivalric presence/);
});

test('female android reads as a near-human android and keeps hair controls', () => {
  const controls = getLockControls();
  const hairstyleId = controls
    .find((control) => control.key === 'hairstyleId')
    .options.find((option) => option.zh === '直髮：中分').id;
  const hairColorId = controls
    .find((control) => control.key === 'hairColorId')
    .options.find((option) => option.zh === '自然黑').id;
  const locks = {
    ...createEmptyLocks(),
    specialSubjectId: 'female-android',
    hairstyleId,
    hairColorId,
  };

  const [prompt] = generatePrompts(1, locks);
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'female-android');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /女性人形機器人|near-human female android|realistic robotics and synthetic material construction/);
  assert.match(promptText, /subtle facial panel lines|black precision mechanical joint structures/);
  assert.match(promptText, /unknown anomalous figure appearing naturally inside a real contemporary environment/);
  assert.match(promptText, /直髮：中分|long straight hair with a center part|自然黑|natural black hair/);
  assert.doesNotMatch(promptText, /pure white mechanical bodysuit|full enclosed helmet|no visible face required|not a helmeted robot|not cartoon|not toy-like/);
});

test('black skeleton keeps dark tone and uses physical photographic presence', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'skeleton',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'skeleton');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /黑骷髏|deep blue-black bone tone|深藍黑骨色/);
  assert.match(promptText, /full-body unknown skeletal figure|physical photographic presence/);
  assert.match(promptText, /unknown anomalous figure appearing naturally inside a real contemporary environment/);
  assert.doesNotMatch(promptText, /warm ivory bone tone/);
});

test('expression and pose remain available with special subjects', () => {
  const expression = getLockControls()
    .find((control) => control.key === 'expressionId')
    .options.find((option) => option.zh === '直視鏡頭｜平靜淡然');
  const pose = getLockControls()
    .find((control) => control.key === 'poseId')
    .options.find((option) => option.zh === '站姿｜單腳重心');

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'european-knight',
    expressionId: expression.id,
    poseId: pose.id,
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'european-knight');
  assert.equal(prompt.selection.expressionId, expression.id);
  assert.equal(prompt.selection.poseId, pose.id);
  assert.match(promptText, /calm neutral expression|relaxed half-lidded ease/);
  assert.match(promptText, /weight-on-one-leg standing pose|relaxed asymmetrical stance|one-leg weight shift|relaxed asymmetrical body balance/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
});

test('non-social special actions apply to special subjects in every output and replace normal body pose', () => {
  const controls = getLockControls();
  const pose = controls
    .find((control) => control.key === 'poseId')
    .options.find((option) => option.zh === '坐姿｜自然坐姿');
  const specialAction = controls
    .find((control) => control.key === 'specialActionId')
    .options.find((option) => option.zh === '抽煙');

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'sengoku-samurai',
    poseId: pose.id,
    specialActionId: specialAction.id,
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'sengoku-samurai');
  assert.equal(prompt.selection.specialActionId, specialAction.id);
  assert.equal(prompt.selection.poseId, '');
  assert.match(prompt.grokPrompt, /holding a cigarette between the fingers near the lips/);
  assert.match(prompt.zImagePrompt, /holding a cigarette between the fingers near the lips/);
  assert.match(prompt.midjourneyPrompt, /holding a cigarette between the fingers near the lips/);
  assert.doesNotMatch(promptText, /natural seated posture/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
});

test('selfie hand pose composer applies to special subjects', () => {
  const controls = getLockControls();
  const poseBase = controls
    .find((control) => control.key === 'poseBaseId')
    .options.find((option) => option.zh === '站姿');
  const arrangement = controls
    .find((control) => control.key === 'poseArrangementId')
    .options.find((option) => option.zh === '單腳重心');
  const poseHand = controls
    .find((control) => control.key === 'poseHandId')
    .options.find((option) => option.zh === '男友/閨蜜自拍');

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'european-knight',
    poseBaseId: poseBase.id,
    poseArrangementId: arrangement.id,
    poseHandId: poseHand.id,
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'european-knight');
  assert.equal(prompt.selection.poseBaseId, poseBase.id);
  assert.equal(prompt.selection.poseArrangementId, arrangement.id);
  assert.equal(prompt.selection.poseHandId, poseHand.id);
  assert.match(promptText, /close-companion social snapshot feeling/);
  assert.match(promptText, /weight-on-one-leg standing pose|relaxed asymmetrical stance|one-leg weight shift|relaxed asymmetrical body balance/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
});

test('pose composer applies to special subjects in every output and takes priority', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'sengoku-samurai',
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
    specialActionId: optionId('specialActionId', '塗口紅'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: optionId('poseArrangementId', '椅緣端坐'),
    poseHandId: optionId('poseHandId', '雙手放在大腿上'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    poseAnchorId: optionId('poseAnchorId', '坐在椅子上'),
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'sengoku-samurai');
  assert.equal(prompt.selection.poseId, '');
  assert.equal(prompt.selection.specialActionId, '');
  assert.equal(prompt.selection.poseBaseId, optionId('poseBaseId', '坐姿'));
  assert.equal(prompt.selection.poseArrangementId, optionId('poseArrangementId', '椅緣端坐'));
  assert.equal(prompt.selection.poseHandId, optionId('poseHandId', '雙手放在大腿上'));
  assert.equal(prompt.selection.poseHeadId, optionId('poseHeadId', '頭部自然朝向鏡頭'));
  assert.equal(prompt.selection.poseAnchorId, optionId('poseAnchorId', '坐在椅子上'));
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(text, /She is sitting/);
    assert.match(text, /edge-of-seat poised seated arrangement/);
    assert.match(text, /seated near the front edge with clear leg line/);
    assert.match(text, /both hands resting on the thighs or nearest upper-leg surface/);
    assert.match(text, /chair that naturally fits the current scene/);
  }
  assert.match(promptText, /日本戰國武士|female Japanese Sengoku-era samurai/);
  assert.doesNotMatch(promptText, /loosely crossed arms/);
  assert.doesNotMatch(promptText, /applying lipstick/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
});

test('legacy skeleton subject count locks migrate into the special subject control', () => {
  const normalized = normalizeLocks({
    ...createEmptyLocks(),
    subjectCount: 'white-skeleton',
  });

  assert.equal(normalized.subjectCount, '1');
  assert.equal(normalized.specialSubjectId, 'white-skeleton');
});

test('legacy character card locks migrate into the character profile control', () => {
  const normalizedFromSubjectCount = normalizeLocks({
    ...createEmptyLocks(),
    subjectCount: 'character-48g',
  });
  const normalizedFromSpecialSubject = normalizeLocks({
    ...createEmptyLocks(),
    specialSubjectId: 'character-philippa',
  });

  assert.equal(normalizedFromSubjectCount.subjectCount, '1');
  assert.equal(normalizedFromSubjectCount.specialSubjectId, 'none');
  assert.equal(normalizedFromSubjectCount.characterProfileId, 'character-48g');
  assert.equal(normalizedFromSpecialSubject.subjectCount, '1');
  assert.equal(normalizedFromSpecialSubject.specialSubjectId, 'none');
  assert.equal(normalizedFromSpecialSubject.characterProfileId, 'character-philippa');
});
