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

function gptSection(prompt, label) {
  const sectionLabels = [
    'Image Type',
    'Subject',
    'Wardrobe',
    'Pose and Composition',
    'Scene',
    'Lighting',
    'Camera Look',
  ];
  const nextLabels = sectionLabels.filter((entry) => entry !== label).join('|');
  return prompt.grokPrompt.match(new RegExp(`${label}:\\n([\\s\\S]*?)(?=\\n\\n(?:${nextLabels}):\\n|\\n\\nmulti-cut sequence n=2$|$)`))?.[1] || '';
}

function gptCharacterProfileGroup(prompt, label) {
  const subject = gptSection(prompt, 'Subject');
  return subject.match(new RegExp(`${label}:\\n([\\s\\S]*?)(?=\\n\\n(?:Character Profile Card|Identity and body|Hair|Outfit|Accessories|Photographic direction):\\n|$)`))?.[1] || '';
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
      ['character-rika', '11_Rika', '11_Rika 角色卡'],
      ['character-48g', '48_G', '48_G 角色卡'],
      ['character-philippa', '29_Philippa', '29_Philippa 角色卡'],
      ['character-lily', '07_Lily', '07_Lily 角色卡'],
      ['character-hinata', '06_Hinata', '06_Hinata 角色卡'],
      ['character-rin', '38_Rin', '38_Rin 角色卡'],
      ['character-sakura', '12_Sakura', '12_Sakura 角色卡'],
      ['character-sui', '03_Sui', '03_Sui 角色卡'],
      ['character-yuri', '02_Yuri', '02_Yuri 角色卡'],
      ['character-hina', '37_Hina', '37_Hina 角色卡'],
    ]
  );
  assert.deepEqual(
    characterCards.map((option) => [option.zh, option.meta?.referenceImage, option.meta?.referenceImageFormat]),
    [
      ['11_Rika', 'character-cards/rika/11_Rika_00.jpeg', 'jpeg'],
      ['48_G', 'character-cards/48g/48_G_00.jpeg', 'jpeg'],
      ['29_Philippa', 'character-cards/philippa/29_Philippa_00.jpeg', 'jpeg'],
      ['07_Lily', 'character-cards/lily/07_Lily_00.jpeg', 'jpeg'],
      ['06_Hinata', 'character-cards/hinata/06_Hinata_00.png', 'png'],
      ['38_Rin', 'character-cards/rin/38_Rin_00.jpeg', 'jpeg'],
      ['12_Sakura', 'character-cards/sakura/12_Sakura_00.jpeg', 'jpeg'],
      ['03_Sui', 'character-cards/sui/03_Sui_00.jpeg', 'jpeg'],
      ['02_Yuri', 'character-cards/yuri/02_Yuri_00.jpeg', 'jpeg'],
      ['37_Hina', 'character-cards/hina/37_Hina_00.jpeg', 'jpeg'],
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
  assert.deepEqual(
    characterCards.find((option) => option.id === 'character-lily').referenceImages.map((image) => [image.type, image.publicPath]),
    [
      ['portrait-closeup', '/character-cards/lily/07_Lily_00.jpeg'],
      ['full-body', '/character-cards/lily/07_Lily_02.png'],
      ['face-turnaround', '/character-cards/lily/07_Lily_01.png'],
    ]
  );
  assert.deepEqual(
    characterCards.find((option) => option.id === 'character-yuri').referenceImages.map((image) => [image.type, image.publicPath]),
    [
      ['portrait-closeup', '/character-cards/yuri/02_Yuri_00.jpeg'],
      ['face-turnaround', '/character-cards/yuri/02_Yuri_01.png'],
      ['full-body', '/character-cards/yuri/02_Yuri_02.png'],
    ]
  );
  assert.deepEqual(
    characterCards.find((option) => option.id === 'character-sui').referenceImages.map((image) => [image.type, image.publicPath]),
    [
      ['portrait-closeup', '/character-cards/sui/03_Sui_00.jpeg'],
      ['face-turnaround', '/character-cards/sui/03_Sui_01.png'],
      ['full-body', '/character-cards/sui/03_Sui_02.png'],
      ['expression-sheet', '/character-cards/sui/03_Sui_01A.png'],
    ]
  );
  assert.deepEqual(
    characterCards.find((option) => option.id === 'character-hina').referenceImages.map((image) => [image.type, image.publicPath]),
    [
      ['portrait-scene', '/character-cards/hina/37_Hina_00.jpeg'],
      ['full-body', '/character-cards/hina/37_Hina_02.png'],
      ['face-turnaround', '/character-cards/hina/37_Hina_01.png'],
    ]
  );
});

test('character profile card replaces normal identity and wardrobe without extra reference guidance', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-48g',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-48g');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /48_G|48_G 角色卡/);
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
  assert.doesNotMatch(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /taupe-gray cropped hooded zip jacket/);
  assert.match(prompt.midjourneyPrompt, /low-rise faded blue denim mini skirt worn unbuttoned/);
  assert.match(prompt.midjourneyPrompt, /visible thin-strap black lace thong waistband/);
  assert.match(prompt.midjourneyPrompt, /black lace-up ankle boots/);
});

test('Gpt character profile card groups Rin identity hair outfit and accessories', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rin',
  });

  const subject = gptSection(prompt, 'Subject');
  const identity = gptCharacterProfileGroup(prompt, 'Identity and body');
  const hair = gptCharacterProfileGroup(prompt, 'Hair');
  const outfit = gptCharacterProfileGroup(prompt, 'Outfit');
  const accessories = gptCharacterProfileGroup(prompt, 'Accessories');
  const photographic = gptCharacterProfileGroup(prompt, 'Photographic direction');

  assert.match(subject, /Character Profile Card:\n38_Rin/i);
  assert.match(identity, /refined intellectual editorial facial features/i);
  assert.match(identity, /large slender almond warm-brown eyes/i);
  assert.match(identity, /slim refined fashion-model body proportions/i);
  assert.doesNotMatch(identity, /calm slightly sleepy gaze|calm observant expression/i);
  assert.doesNotMatch(identity, /thin rectangular brown-gold metal frame eyeglasses|stacked twin gold hoop earrings|crisp white oversized button-down shirt/i);
  assert.match(hair, /glossy natural black chin-to-nape short curly bob/i);
  assert.match(hair, /separated curved see-through bangs/i);
  assert.doesNotMatch(hair, /eyeglasses|earrings|button-down shirt/i);
  assert.match(outfit, /crisp white oversized button-down shirt/i);
  assert.match(outfit, /charcoal high-waisted tailored straight trousers/i);
  assert.match(outfit, /black leather loafers/i);
  assert.doesNotMatch(outfit, /eyeglasses|gold hoop earrings|gold necklaces/i);
  assert.match(accessories, /thin rectangular brown-gold metal frame eyeglasses/i);
  assert.match(accessories, /stacked twin gold hoop earrings on both ears/i);
  assert.match(accessories, /layered delicate gold necklaces/i);
  assert.doesNotMatch(accessories, /button-down shirt|tailored straight trousers/i);
  assert.match(photographic, /photorealistic editorial portrait/i);
  assert.equal(gptSection(prompt, 'Wardrobe'), '');
  assert.match(prompt.zImagePrompt, /signature outfit locked as/i);
  assert.match(prompt.midjourneyPrompt, /crisp white oversized button-down shirt/i);
});

test('Gpt character profile card groups 48G outfit and bag separately', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-48g',
  });

  const identity = gptCharacterProfileGroup(prompt, 'Identity and body');
  const hair = gptCharacterProfileGroup(prompt, 'Hair');
  const outfit = gptCharacterProfileGroup(prompt, 'Outfit');
  const accessories = gptCharacterProfileGroup(prompt, 'Accessories');

  assert.match(identity, /doll-like facial features/i);
  assert.match(identity, /slim petite fashion-model body proportions/i);
  assert.doesNotMatch(identity, /haircut|hooded zip jacket|shoulder bag/i);
  assert.match(hair, /glossy black shoulder-length layered lob haircut/i);
  assert.match(hair, /airy see-through bangs/i);
  assert.match(outfit, /taupe-gray cropped hooded zip jacket/i);
  assert.match(outfit, /low-rise faded blue denim mini skirt/i);
  assert.match(outfit, /black lace-up ankle boots/i);
  assert.doesNotMatch(outfit, /small off-white shoulder bag/i);
  assert.match(accessories, /small off-white shoulder bag with thin black strap/i);
});

test('Gpt character profile cards use curated identity hair outfit and accessory groups', () => {
  const cases = [
    {
      id: 'character-rika',
      card: '11_Rika',
      identityIncludes: [/large rounded gray-brown eyes/i, /tiny beauty mark near one outer cheek/i, /slim petite casual-fashion body proportions/i],
      identityExcludes: /quiet dreamy gaze|baby tee|beaded choker|keychain/i,
      hairIncludes: [/glossy natural black long wavy hair/i, /slightly uneven wispy pieces/i],
      outfitIncludes: [/cropped white short-sleeve baby tee/i, /low-rise light-wash blue jeans/i, /clean white low-top sneakers/i],
      accessoriesIncludes: [/black-and-white beaded choker necklace/i, /small silver ring keychain/i],
    },
    {
      id: 'character-philippa',
      card: '29_Philippa',
      identityIncludes: [/clear pale gray-green eyes/i, /porcelain luminous skin/i, /slender fashion-model body proportions/i],
      identityExcludes: /cool glassy gaze|refined melancholic expression|gothic lace dress/i,
      hairIncludes: [/center-parted wavy black hair/i, /silver-white dip-dye streaks/i],
      outfitIncludes: [/black high-neck gothic lace dress/i, /floor-length translucent black tulle skirt overlay/i, /black elegant dress shoes/i],
      accessoriesIncludes: [],
    },
    {
      id: 'character-sakura',
      card: '12_Sakura',
      identityIncludes: [/large vivid clear blue eyes/i, /delicate oval heart-shaped face/i, /slim petite cozy-girl body proportions/i],
      identityExcludes: /bunny-eared hood|fleece pullover hoodie|sweatpants/i,
      hairIncludes: [/warm chestnut-brown hair/i, /dusty rose-pink streaks/i],
      outfitIncludes: [/white plush bunny-eared hood/i, /oversized ivory-white fleece pullover hoodie/i, /relaxed beige oatmeal sweatpants/i],
      accessoriesIncludes: [],
    },
    {
      id: 'character-hinata',
      card: '06_Hinata',
      identityIncludes: [/large almond-shaped gray-olive brown eyes/i, /small elongated oval face/i, /tall high-fashion hourglass body proportions/i],
      identityExcludes: /calm confident street-style expression|wavy bob|cutout bodysuit/i,
      hairIncludes: [/smoky ash-gray hair/i, /chin-to-shoulder length wavy bob/i],
      outfitIncludes: [/deep cobalt blue cable-knit turtleneck cutout bodysuit sweater/i, /medium-wash skinny blue jeans/i, /black leather ankle boots/i],
      accessoriesIncludes: [/black leather belt with small silver buckle/i],
    },
    {
      id: 'character-lily',
      card: '07_Lily',
      identityIncludes: [/clear warm hazel-brown eyes/i, /delicate oval heart-shaped face/i, /slim tall fashion-model body proportions/i],
      identityExcludes: /calm seductive fashion-editorial expression|copper-auburn red hair|faux-fur/i,
      hairIncludes: [/long tousled copper-auburn red hair/i, /darker natural roots/i],
      outfitIncludes: [/black shaggy faux-fur off-shoulder mini coat/i, /minimal black inner layer/i, /black ankle-strap stiletto sandals/i],
      accessoriesIncludes: [],
    },
    {
      id: 'character-yuri',
      card: '02_Yuri',
      identityIncludes: [/clear dark brown eyes/i, /soft oval face/i, /slim petite casual-fashion body proportions/i],
      identityExcludes: /calm slightly serious gaze|eyeglasses|off-shoulder cropped/i,
      hairIncludes: [/glossy natural black long straight hair/i, /wispy see-through bangs/i],
      outfitIncludes: [/white ribbed off-shoulder cropped long-sleeve top/i, /low-rise medium-wash blue flared jeans/i, /brown low-top canvas sneakers/i],
      accessoriesIncludes: [/round translucent brown acetate eyeglasses/i, /black choker necklace/i, /stacked silver bangles and rings/i],
    },
    {
      id: 'character-sui',
      card: '03_Sui',
      identityIncludes: [/large soft downturned almond warm amber-brown eyes/i, /natural freckles across the cheeks and nose/i, /slim petite soft casual-fashion body proportions/i],
      identityExcludes: /quiet tender cozy-girl expression|melancholic pout|oversized knit cardigan/i,
      hairIncludes: [/glossy natural black long wavy hair/i, /natural tousled flyaways/i],
      outfitIncludes: [/mustard yellow oversized knit cardigan/i, /cream ribbed knit camisole/i, /high-waisted medium-dark blue straight-leg jeans/i],
      accessoriesIncludes: [/delicate gold necklace with a small red-orange oval pendant/i],
    },
    {
      id: 'character-hina',
      card: '37_Hina',
      identityIncludes: [/clear warm gray-brown eyes/i, /small oval face with gentle cheeks/i, /slim petite delicate casual body proportions/i],
      identityExcludes: /calm quiet gaze|eyeglasses|sage-mint green sleeveless/i,
      hairIncludes: [/pale silver-lilac short bob/i, /soft ash roots/i],
      outfitIncludes: [/loose sage-mint green sleeveless tunic tank top/i, /matching sage-mint green relaxed short shorts/i, /bare feet as the locked footwear state/i],
      accessoriesIncludes: [/round thin black metal eyeglasses/i],
    },
  ];

  for (const item of cases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      characterProfileId: item.id,
    });
    const subject = gptSection(prompt, 'Subject');
    const identity = gptCharacterProfileGroup(prompt, 'Identity and body');
    const hair = gptCharacterProfileGroup(prompt, 'Hair');
    const outfit = gptCharacterProfileGroup(prompt, 'Outfit');
    const accessories = gptCharacterProfileGroup(prompt, 'Accessories');

    assert.match(subject, new RegExp(`Character Profile Card:\\n${item.card}`, 'i'));
    for (const pattern of item.identityIncludes) assert.match(identity, pattern, `${item.id} identity should include ${pattern}`);
    assert.doesNotMatch(identity, item.identityExcludes, `${item.id} identity should stay separate from expression, hair, outfit, and accessories`);
    for (const pattern of item.hairIncludes) assert.match(hair, pattern, `${item.id} hair should include ${pattern}`);
    for (const pattern of item.outfitIncludes) assert.match(outfit, pattern, `${item.id} outfit should include ${pattern}`);
    if (item.accessoriesIncludes.length) {
      for (const pattern of item.accessoriesIncludes) assert.match(accessories, pattern, `${item.id} accessories should include ${pattern}`);
    } else {
      assert.equal(accessories, '', `${item.id} should not emit an empty Accessories group`);
    }
  }
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
  assert.match(promptText, /29_Philippa|29_Philippa 角色卡/);
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
  assert.doesNotMatch(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
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
  assert.match(promptText, /12_Sakura|12_Sakura 角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman with soft doll-like kawaii facial features/);
  assert.match(promptText, /large vivid clear blue eyes/);
  assert.match(promptText, /peach-pink blush/);
  assert.match(promptText, /long loose wavy warm chestnut-brown hair with dusty rose-pink streaks/);
  assert.match(promptText, /white plush bunny-eared hood/);
  assert.match(promptText, /pink inner ears/);
  assert.match(promptText, /oversized ivory-white fleece pullover hoodie/);
  assert.match(promptText, /relaxed beige oatmeal sweatpants/);
  assert.match(promptText, /clean white low-top sneakers/);
  assert.doesNotMatch(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /white plush bunny-eared hood/);
  assert.match(prompt.midjourneyPrompt, /oversized ivory-white fleece pullover hoodie/);
  assert.match(prompt.midjourneyPrompt, /relaxed beige oatmeal sweatpants/);
});

test('hinata character profile card preserves East Asian face-turnaround features ash-sage bob cutout cobalt bodysuit and hourglass styling', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-hinata',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-hinata');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /06_Hinata|06_Hinata 角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman/);
  assert.match(promptText, /mature refined East Asian fashion-model facial features/);
  assert.match(promptText, /small elongated oval face with a soft jawline and delicate pointed chin/);
  assert.match(promptText, /large almond-shaped gray-olive brown eyes with softly lifted outer corners/);
  assert.match(promptText, /clear double eyelids and shallow natural eyelid depth/);
  assert.match(promptText, /straight slim nose with a soft low-to-moderate bridge and small neat tip/);
  assert.match(promptText, /smoky ash-gray hair with muted sage-olive undertones and darker shadow roots/);
  assert.match(promptText, /chin-to-shoulder length wavy bob with an open center part/);
  assert.match(promptText, /loose tousled S-wave texture/);
  assert.match(promptText, /tall high-fashion hourglass body proportions/);
  assert.match(promptText, /long slender limbs, long legs, high waist, fuller bust, wide hips, and narrow waist/);
  assert.match(promptText, /deep cobalt blue cable-knit turtleneck cutout bodysuit sweater/);
  assert.match(promptText, /large side-waist cutout openings on the bodysuit exposing both sides of the narrow waist/);
  assert.match(promptText, /visually emphasizing the wider hips/);
  assert.match(promptText, /medium-wash skinny blue jeans/);
  assert.match(promptText, /black leather belt/);
  assert.match(promptText, /black leather ankle boots/);
  assert.doesNotMatch(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /plastic bag|shopping bag|grocery bag/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.doesNotMatch(promptText, /mixed-race|East Asian-European|Western-glamour|hazel-gray eyes/);
  assert.match(prompt.midjourneyPrompt, /mature refined East Asian fashion-model facial features/);
  assert.match(prompt.midjourneyPrompt, /large almond-shaped gray-olive brown eyes/);
  assert.match(prompt.midjourneyPrompt, /deep cobalt blue cable-knit turtleneck cutout bodysuit sweater/);
  assert.match(prompt.midjourneyPrompt, /large side-waist cutout openings/);
  assert.match(prompt.midjourneyPrompt, /medium-wash skinny blue jeans/);
  assert.match(prompt.midjourneyPrompt, /black leather ankle boots/);
});

test('rika character profile card preserves distinct black wavy hair face and low-rise denim styling', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-rika');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /11_Rika|11_Rika 角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman with soft doll-like indie-girl facial features/);
  assert.match(promptText, /softly full cheeks and a gentle rounded jaw/);
  assert.match(promptText, /large rounded gray-brown eyes with glassy catchlights and soft lower-lash detail/);
  assert.match(promptText, /tiny beauty mark near one outer cheek/);
  assert.match(promptText, /soft rose-pink lips with a cushioned slightly parted pout/);
  assert.match(promptText, /glossy natural black long wavy hair/);
  assert.match(promptText, /airy see-through bangs with slightly uneven wispy pieces/);
  assert.match(promptText, /fitted cropped white short-sleeve baby tee/);
  assert.match(promptText, /small minimalist black line-art chest graphic/);
  assert.match(promptText, /black-and-white beaded choker necklace/);
  assert.match(promptText, /slightly loose low-rise light-wash blue jeans with relaxed straight legs/);
  assert.match(promptText, /small silver ring keychain clipped to the front belt loop/);
  assert.match(promptText, /clean white low-top sneakers/);
  assert.doesNotMatch(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /arm sleeves|sleeve covers|detached sleeves/i);
  assert.doesNotMatch(promptText, /high-waisted straight-leg jeans/i);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /fitted cropped white short-sleeve baby tee/);
  assert.match(prompt.midjourneyPrompt, /slightly loose low-rise light-wash blue jeans with relaxed straight legs/);
  assert.match(prompt.midjourneyPrompt, /clean white low-top sneakers/);
});

test('rin character profile card preserves refined glasses face curly bob double-hoop earrings and white shirt formal styling', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rin',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-rin');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /38_Rin|38_Rin 角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman with refined intellectual East Asian editorial facial features/);
  assert.match(promptText, /small porcelain oval face with a narrow softly tapered jaw and delicate pointed chin/);
  assert.match(promptText, /large slender almond warm brown eyes behind glasses with a calm slightly sleepy gaze/);
  assert.match(promptText, /soft aegyo-sal lower-eye fullness and fine lower lashes/);
  assert.match(promptText, /straight delicate nose with a softly rounded glossy tip/);
  assert.match(promptText, /glossy rose-beige lips with a defined cupid bow and fuller lower lip/);
  assert.match(promptText, /glossy natural black chin-to-nape short curly bob/);
  assert.match(promptText, /airy layered S-curls with outward-flipped ends around the ears and nape/);
  assert.match(promptText, /separated curved see-through bangs forming comma-like strands over the forehead/);
  assert.match(promptText, /thin rectangular brown-gold metal frame eyeglasses/);
  assert.match(promptText, /stacked twin gold hoop earrings on both ears/);
  assert.match(promptText, /layered delicate gold necklaces/);
  assert.match(promptText, /crisp white oversized button-down shirt/);
  assert.match(promptText, /charcoal high-waisted tailored straight trousers/);
  assert.match(promptText, /black leather loafers/);
  assert.doesNotMatch(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(prompt.structured.Character.map((item) => item.en).join('\n'), /\b(?:book|notebook|tablet|paper|document)\b/i);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /refined intellectual East Asian editorial facial features/);
  assert.match(prompt.midjourneyPrompt, /large slender almond warm brown eyes/);
  assert.match(prompt.midjourneyPrompt, /thin rectangular brown-gold metal frame eyeglasses/);
  assert.match(prompt.midjourneyPrompt, /stacked twin gold hoop earrings/);
  assert.match(prompt.midjourneyPrompt, /crisp white oversized button-down shirt/);
  assert.match(prompt.midjourneyPrompt, /charcoal high-waisted tailored straight trousers/);
  assert.match(prompt.midjourneyPrompt, /black leather loafers/);
});

test('lily character profile card preserves auburn waves black faux fur and ankle strap heels', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-lily',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-lily');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /07_Lily|07_Lily 角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman with glamorous doll-like facial features/);
  assert.match(promptText, /clear warm hazel-brown eyes/);
  assert.match(promptText, /long tousled copper-auburn red hair/);
  assert.match(promptText, /darker natural roots/);
  assert.match(promptText, /airy wispy see-through bangs/);
  assert.match(promptText, /black shaggy faux-fur off-shoulder mini coat/);
  assert.match(promptText, /deep V neckline/);
  assert.match(promptText, /black ankle-strap stiletto sandals/);
  assert.doesNotMatch(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /black shaggy faux-fur off-shoulder mini coat/);
  assert.match(prompt.midjourneyPrompt, /black ankle-strap stiletto sandals/);
});

test('yuri character profile card preserves black straight hair glasses white off-shoulder top and flared denim', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-yuri',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-yuri');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /02_Yuri|02_Yuri 角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman with quiet intelligent doll-like facial features/);
  assert.match(promptText, /clear dark brown eyes behind round translucent brown acetate eyeglasses/);
  assert.match(promptText, /glossy natural black long straight hair/);
  assert.match(promptText, /wispy see-through bangs/);
  assert.match(promptText, /white ribbed off-shoulder cropped long-sleeve top/);
  assert.match(promptText, /black choker necklace with small silver charm details/);
  assert.match(promptText, /low-rise medium-wash blue flared jeans/);
  assert.match(promptText, /large oval western-style belt buckle/);
  assert.match(promptText, /brown low-top canvas sneakers with cream rubber soles/);
  assert.doesNotMatch(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /white ribbed off-shoulder cropped long-sleeve top/);
  assert.match(prompt.midjourneyPrompt, /low-rise medium-wash blue flared jeans/);
  assert.match(prompt.midjourneyPrompt, /brown low-top canvas sneakers/);
});

test('sui character profile card preserves freckled wistful face black waves mustard cardigan cream knit top jeans and brown boots', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-sui',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-sui');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /03_Sui|03_Sui 角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman with wistful delicate East Asian muse-like facial features/);
  assert.match(promptText, /small long heart-oval face with softly tapered cheeks and a narrow pointed chin/);
  assert.match(promptText, /natural freckles across the cheeks and nose/);
  assert.match(promptText, /large soft downturned almond warm amber-brown eyes/);
  assert.match(promptText, /slightly heavy upper lids, visible aegyo-sal lower-eye softness, and long fine lower lashes/);
  assert.match(promptText, /thin straight natural brows with a gentle downward softness/);
  assert.match(promptText, /slim delicate nose with a softly rounded tip/);
  assert.match(promptText, /small plush rose-coral lips with a defined cupid bow and slightly parted melancholic pout/);
  assert.match(promptText, /glossy natural black long wavy hair/);
  assert.match(promptText, /airy wispy see-through bangs/);
  assert.match(promptText, /mustard yellow oversized knit cardigan/);
  assert.match(promptText, /small white fuzzy floral embroidery/);
  assert.match(promptText, /cream ribbed knit camisole/);
  assert.match(promptText, /small red-orange oval pendant/);
  assert.match(promptText, /high-waisted medium-dark blue straight-leg jeans/);
  assert.match(promptText, /brown leather ankle boots with rounded toes/);
  assert.doesNotMatch(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /wistful delicate East Asian muse-like facial features/);
  assert.match(prompt.midjourneyPrompt, /large soft downturned almond warm amber-brown eyes/);
  assert.match(prompt.midjourneyPrompt, /mustard yellow oversized knit cardigan/);
  assert.match(prompt.midjourneyPrompt, /cream ribbed knit camisole/);
  assert.match(prompt.midjourneyPrompt, /high-waisted medium-dark blue straight-leg jeans/);
  assert.match(prompt.midjourneyPrompt, /brown leather ankle boots/);
});

test('hina character profile card preserves silver lilac bob round glasses mint sleeveless set and bare feet', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-hina',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'none');
  assert.equal(prompt.selection.characterProfileId, 'character-hina');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /37_Hina|37_Hina 角色卡/);
  assert.match(promptText, /20-year-old adult East Asian woman with soft intelligent doll-like facial features/);
  assert.match(promptText, /clear warm gray-brown eyes behind round thin black metal eyeglasses/);
  assert.match(promptText, /pale silver-lilac short bob/);
  assert.match(promptText, /wispy airy bangs/);
  assert.match(promptText, /loose sage-mint green sleeveless tunic tank top/);
  assert.match(promptText, /wide armholes with a subtle black inner layer visible at the side/);
  assert.match(promptText, /matching sage-mint green relaxed short shorts/);
  assert.match(promptText, /bare feet as the locked footwear state/);
  assert.doesNotMatch(promptText, /use the supplied character reference sheets as identity and outfit anchors/);
  assert.doesNotMatch(promptText, /unknown anomalous figure/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
  assert.match(prompt.midjourneyPrompt, /loose sage-mint green sleeveless tunic tank top/);
  assert.match(prompt.midjourneyPrompt, /matching sage-mint green relaxed short shorts/);
  assert.match(prompt.midjourneyPrompt, /bare feet/);
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

test('deprecated special actions migrate to pose composer hand actions for special subjects', () => {
  const controls = getLockControls();
  const pose = controls
    .find((control) => control.key === 'poseId')
    .options.find((option) => option.zh === '坐姿｜自然坐姿');
  const specialAction = controls
    .find((control) => control.key === 'specialActionId')
    .options.find((option) => option.zh === '抽煙');
  const poseHand = controls
    .find((control) => control.key === 'poseHandId')
    .options.find((option) => option.zh === '手持香菸');

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'sengoku-samurai',
    poseId: pose.id,
    specialActionId: specialAction.id,
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'sengoku-samurai');
  assert.equal(prompt.selection.specialActionId, '');
  assert.equal(prompt.selection.poseId, '');
  assert.equal(prompt.selection.poseHandId, poseHand.id);
  assert.match(prompt.grokPrompt, /cigarette held naturally between the fingers in one hand/);
  assert.match(prompt.zImagePrompt, /cigarette held naturally between the fingers in one hand/);
  assert.match(prompt.midjourneyPrompt, /cigarette held naturally between the fingers in one hand/);
  assert.doesNotMatch(promptText, /near the lips/);
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
  assert.match(prompt.grokPrompt, /She is sitting/);
  assert.match(prompt.grokPrompt, /edge-of-seat poised seated arrangement/);
  assert.match(prompt.grokPrompt, /seated near the front edge with clear leg line/);
  assert.match(prompt.grokPrompt, /both hands resting on thighs or nearest upper-leg surface/);
  assert.match(prompt.grokPrompt, /sitting on a scene-appropriate chair/);
  assert.match(prompt.zImagePrompt, /She is sitting/);
  assert.match(prompt.midjourneyPrompt, /sitting on a chair that naturally fits the current scene/);
  for (const text of [prompt.zImagePrompt, prompt.midjourneyPrompt]) {
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
