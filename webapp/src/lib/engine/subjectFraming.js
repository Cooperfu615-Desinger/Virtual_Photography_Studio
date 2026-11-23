const FULL_BODY_FRAMING_ID = 'camera:景別構圖-framing:全身鏡頭-full-body-shot:8';

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
    ],
  },
];

export function isSubjectFramingAvailable({ subjectCount, framingId, managed }) {
  return Number(subjectCount) === 1 && framingId === FULL_BODY_FRAMING_ID && !managed;
}

export function normalizeSubjectFraming(locks) {
  const selection = {};
  for (const { key, options } of SUBJECT_FRAMING_CONTROLS) {
    if (locks[key] && options.some(option => option.id === locks[key])) selection[key] = locks[key];
  }
  return selection;
}

export function subjectFramingPrompt(locks) {
  return SUBJECT_FRAMING_CONTROLS
    .map(({ key, options }) => options.find(option => option.id === locks[key])?.en)
    .filter(Boolean).join(' ');
}
