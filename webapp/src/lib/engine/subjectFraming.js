const FULL_BODY_FRAMING_ID = 'camera:景別構圖-framing:全身鏡頭-full-body-shot:8';

const CROPPED_FRAMING = {
  'camera:景別構圖-framing:中景鏡頭-medium-shot:6': 'at the waist',
  'camera:景別構圖-framing:牛仔中景-cowboy-shot:7': 'just above her knees',
};

const CROPPED_SIZES = {
  small: 'Her visible figure, from the top of her head to the crop, occupies about one-third of the image height.',
  tiny: 'Her visible figure, from the top of her head to the crop, occupies about one-fifth of the image height.',
};

const CROPPED_POSITIONS = {
  center: 'Center her horizontally in the frame.',
  left: 'Place her in the left third of the frame, leaving open space on the right.',
  right: 'Place her in the right third of the frame, leaving open space on the left.',
  low: 'Place her low in the frame, centered horizontally, with open space above her.',
  bottom: 'Place her at the very bottom of the frame, centered horizontally, with ample open space above her.',
  'left-low': 'Place her in the lower left, with open space above and to the right.',
  'right-low': 'Place her in the lower right, with open space above and to the left.',
};

export const SUBJECT_FRAMING_CONTROLS = [
  {
    key: 'subjectSizeId',
    label: '人物大小',
    suppressDefaultRandomOption: true,
    options: [
      { id: '', zh: '預設', en: '' },
      { id: 'small', zh: '小（約畫面高度 1/3）', en: 'Her complete figure, from head to footwear, occupies about one-third of the image height.' },
      { id: 'tiny', zh: '極小（約畫面高度 1/5）', en: 'Her complete figure, from head to footwear, occupies about one-fifth of the image height.' },
      { id: 'micro', zh: '微小（約畫面高度 1/10）', en: 'Her complete figure, from head to footwear, occupies only about one-tenth of the image height.' },
    ],
  },
  {
    key: 'subjectPlacementId',
    label: '畫面中位置',
    suppressDefaultRandomOption: true,
    options: [
      { id: '', zh: '不指定', en: '' },
      { id: 'center', zh: '置中', en: 'Center her horizontally and vertically within the frame.' },
      { id: 'left', zh: '靠左', en: 'Place the center of her figure in the left third of the frame, with open space on the right.' },
      { id: 'right', zh: '靠右', en: 'Place the center of her figure in the right third of the frame, with open space on the left.' },
      { id: 'low', zh: '靠下', en: 'Center her left to right, with the bottom of her complete figure near the 90% mark measured from the top, leaving open space above her.' },
      { id: 'bottom', zh: '貼底', en: 'Center her left to right and place her as low in the frame as possible, with her complete figure visible and its lowest point near the 98% mark measured from the top. Leave only a sliver of space below her and ample open space above her.' },
      { id: 'left-low', zh: '左下', en: '' },
      { id: 'right-low', zh: '右下', en: '' },
    ],
  },
];

export function isSubjectFramingAvailable({ subjectCount, framingId, managed }) {
  return Number(subjectCount) === 1 && !managed && (
    framingId === FULL_BODY_FRAMING_ID || Object.hasOwn(CROPPED_FRAMING, framingId)
  );
}

export function subjectFramingControlsFor(framingId) {
  const [size, placement] = SUBJECT_FRAMING_CONTROLS;
  if (!Object.hasOwn(CROPPED_FRAMING, framingId)) {
    return [size, { ...placement, options: placement.options.filter(option => !option.id.endsWith('-low')) }];
  }
  const crop = `The bottom edge crops her ${CROPPED_FRAMING[framingId]}.`;
  return [
    {
      ...size,
      options: size.options.filter(option => !option.id || Object.hasOwn(CROPPED_SIZES, option.id))
        .map(option => ({ ...option, en: CROPPED_SIZES[option.id] || '' })),
    },
    {
      ...placement,
      options: placement.options.map(option => ({
        ...option,
        en: option.id ? `${CROPPED_POSITIONS[option.id]} ${crop}` : '',
      })),
    },
  ];
}

export function normalizeSubjectFraming(locks) {
  const selection = {};
  for (const { key, options } of SUBJECT_FRAMING_CONTROLS) {
    if (locks[key] && options.some(option => option.id === locks[key])) selection[key] = locks[key];
  }
  return selection;
}

export function subjectFramingPrompt(locks) {
  const selected = subjectFramingControlsFor(locks.framingId)
    .map(({ key, options }) => options.find(option => option.id === locks[key])?.en);
  if (Object.hasOwn(CROPPED_FRAMING, locks.framingId)) {
    const [size, position] = selected;
    if (!size && !position) return '';
    return [position || `The bottom edge crops her ${CROPPED_FRAMING[locks.framingId]}.`, size].filter(Boolean).join(' ');
  }
  return selected.filter(Boolean).join(' ');
}
