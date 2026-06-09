import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

const locationOptions = () => getLockControls().find((control) => control.key === 'locationId').options;
const framingOptions = () => getLockControls().find((control) => control.key === 'framingId').options;

function optionByLabel(label) {
  const option = locationOptions().find((item) => item.zh === label);
  assert.ok(option, `Missing location option: ${label}`);
  return option;
}

function optionId(label) {
  return optionByLabel(label).id;
}

function framingId(label) {
  const option = framingOptions().find((item) => item.zh === label);
  assert.ok(option, `Missing framing option: ${label}`);
  return option.id;
}

const wordCount = (text) => text.split(/\s+/).filter(Boolean).length;

test('scene base keeps indoor outdoor and other location options intact', () => {
  const labels = locationOptions().map((option) => option.zh);

  assert.equal(labels.length, 148);
  assert.ok(labels.includes('室內：純潔白幕'));
  assert.ok(labels.includes('戶外：目黑川旁的櫻花隧道'));
  assert.ok(labels.includes('戶外：奧地利 Hallstatt 湖畔山村觀景欄杆'));
  assert.ok(labels.includes('戶外：白色鹽湖乾裂荒漠'));
  assert.ok(labels.includes('戶外：飯店度假村泳池露台'));
  assert.ok(labels.includes('戶外：日式旅館緣側木廊'));
  assert.ok(labels.includes('戶外：高級飯店陽台城市河景'));
  assert.ok(labels.includes('其他：白色床鋪'));
});

test('solid-color studio bases stay concise while blocking visible studio equipment', () => {
  const solidStudioLabels = [
    '室內：純潔白幕',
    '室內：深邃黑幕',
    '室內：莫蘭迪灰背景',
    '室內：純藍背景',
    '室內：純橘背景',
    '室內：純紅背景',
    '室內：純黃背景',
    '室內：純紫背景',
    '室內：純綠背景',
    '室內：鮮豔撞色背景',
    '室內：漸層打光背景',
  ];

  for (const label of solidStudioLabels) {
    const option = optionByLabel(label);
    assert.ok(wordCount(option.en) <= 55, `${label} should stay compact`);
    assert.match(option.en, /horizonless seamless/i);
    assert.match(option.en, /contact shadow/i);
    assert.match(option.en, /no paper roll/i);
    assert.match(option.en, /no backdrop stand/i);
    assert.match(option.en, /no light stands/i);
    assert.match(option.en, /no studio equipment/i);
  }
});

test('outdoor scene bases avoid symmetric avenue and centered corridor wording', () => {
  const riskyOutdoorPattern = /symmetrical|both sides|central road|avenue|tree-lined|lined with|perfect flat wall|rows broken/i;
  const outdoorOptions = locationOptions().filter((option) => option.zh.startsWith('戶外：'));

  for (const option of outdoorOptions) {
    assert.doesNotMatch(option.en, riskyOutdoorPattern, `${option.zh} should avoid symmetry-prone wording`);
  }

  const meguro = optionByLabel('戶外：目黑川旁的櫻花隧道');
  assert.match(meguro.en, /asymmetric riverside composition/);
  assert.doesNotMatch(meguro.en, /avoid symmetrical|central road/i);

  const hallstatt = optionByLabel('戶外：奧地利 Hallstatt 湖畔山村觀景欄杆');
  assert.match(hallstatt.en, /metal railing foreground/);
  assert.match(hallstatt.en, /church spire/);
  assert.match(hallstatt.en, /steep mountain backdrop/);
  assert.match(hallstatt.en, /asymmetric travel-portrait composition/);

  const saltFlat = optionByLabel('戶外：白色鹽湖乾裂荒漠');
  assert.match(saltFlat.en, /white salt flat playa edge/);
  assert.match(saltFlat.en, /cracked salt crust ground/);
  assert.match(saltFlat.en, /pale polygon surface texture/);
  assert.match(saltFlat.en, /distant low mountain range/);

  const resortPool = optionByLabel('戶外：飯店度假村泳池露台');
  assert.ok(wordCount(resortPool.en) <= 28);
  assert.ok(resortPool.meta.tags.includes('outdoor'));
  assert.ok(resortPool.meta.tags.includes('waterfront'));
  assert.ok(resortPool.meta.tags.includes('hospitality'));
  assert.ok(!resortPool.meta.tags.includes('natural'));
  assert.match(resortPool.en, /hotel resort poolside terrace/);
  assert.match(resortPool.en, /wet stone deck/);
  assert.match(resortPool.en, /asymmetric poolside composition/);

  const ryokanEngawa = optionByLabel('戶外：日式旅館緣側木廊');
  assert.ok(wordCount(ryokanEngawa.en) <= 28);
  assert.ok(ryokanEngawa.meta.tags.includes('outdoor'));
  assert.ok(ryokanEngawa.meta.tags.includes('hospitality'));
  assert.ok(ryokanEngawa.meta.tags.includes('heritage'));
  assert.ok(ryokanEngawa.meta.tags.includes('green_space'));
  assert.match(ryokanEngawa.en, /traditional Japanese ryokan engawa veranda/i);
  assert.match(ryokanEngawa.en, /raised wooden deck edge/i);
  assert.match(ryokanEngawa.en, /asymmetric threshold composition/i);

  const luxuryHotelBalcony = optionByLabel('戶外：高級飯店陽台城市河景');
  assert.ok(wordCount(luxuryHotelBalcony.en) <= 28);
  assert.ok(luxuryHotelBalcony.meta.tags.includes('outdoor'));
  assert.ok(luxuryHotelBalcony.meta.tags.includes('waterfront'));
  assert.ok(luxuryHotelBalcony.meta.tags.includes('hospitality'));
  assert.ok(luxuryHotelBalcony.meta.tags.includes('urban'));
  assert.ok(!luxuryHotelBalcony.meta.tags.includes('natural'));
  assert.match(luxuryHotelBalcony.en, /luxury hotel balcony river-view terrace/i);
  assert.match(luxuryHotelBalcony.en, /glass railing/);
  assert.match(luxuryHotelBalcony.en, /dense skyline towers/);
});

test('other dedicated scenes read as close scene bases instead of full environments', () => {
  const otherOptions = locationOptions().filter((option) => option.zh.startsWith('其他：'));

  assert.equal(otherOptions.length, 5);
  for (const option of otherOptions) {
    assert.ok(wordCount(option.en) <= 30, `${option.zh} should stay compact`);
    assert.match(option.en, /ground plane|surface|scene base/i);
  }
});

test('generated prompts use stabilized scene base wording', () => {
  const [studioPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framingId('全身鏡頭 (Full Body Shot)'),
    locationId: optionId('室內：純藍背景'),
  });
  const [meguroPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framingId('全身鏡頭 (Full Body Shot)'),
    locationId: optionId('戶外：目黑川旁的櫻花隧道'),
  });
  const [hallstattPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framingId('全身鏡頭 (Full Body Shot)'),
    locationId: optionId('戶外：奧地利 Hallstatt 湖畔山村觀景欄杆'),
  });
  const [saltFlatPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framingId('全身鏡頭 (Full Body Shot)'),
    locationId: optionId('戶外：白色鹽湖乾裂荒漠'),
  });
  const [resortPoolPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framingId('全身鏡頭 (Full Body Shot)'),
    locationId: optionId('戶外：飯店度假村泳池露台'),
  });
  const [ryokanEngawaPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framingId('全身鏡頭 (Full Body Shot)'),
    locationId: optionId('戶外：日式旅館緣側木廊'),
  });
  const [luxuryHotelBalconyPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framingId('全身鏡頭 (Full Body Shot)'),
    locationId: optionId('戶外：高級飯店陽台城市河景'),
  });

  assert.match(studioPrompt.grokPrompt, /continuous vivid blue ground-and-background plane/);
  assert.match(studioPrompt.zImagePrompt, /no backdrop stand/);
  assert.match(meguroPrompt.grokPrompt, /asymmetric riverside composition/);
  assert.doesNotMatch(meguroPrompt.zImagePrompt, /avoid symmetrical|central road/i);
  assert.match(hallstattPrompt.grokPrompt, /Hallstatt lakeside village overlook/);
  assert.match(hallstattPrompt.zImagePrompt, /church spire and steep mountain backdrop/);
  assert.match(saltFlatPrompt.grokPrompt, /white salt flat playa edge/);
  assert.match(saltFlatPrompt.zImagePrompt, /cracked salt crust ground/);
  assert.match(resortPoolPrompt.grokPrompt, /hotel resort poolside terrace/);
  assert.match(resortPoolPrompt.zImagePrompt, /lounge chair corner/);
  assert.match(ryokanEngawaPrompt.grokPrompt, /traditional Japanese ryokan engawa veranda/i);
  assert.match(ryokanEngawaPrompt.zImagePrompt, /sliding door frames/i);
  assert.match(luxuryHotelBalconyPrompt.grokPrompt, /luxury hotel balcony river-view terrace/i);
  assert.match(luxuryHotelBalconyPrompt.zImagePrompt, /broad river below/i);
});
