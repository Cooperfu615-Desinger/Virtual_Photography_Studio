import { createHash } from 'node:crypto';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { buildPage1GenerationPromptCards } from '../page1PromptOutputs.js';

const controls = getLockControls();
const option = (key, zh) => {
  const item = controls.find(control => control.key === key)?.options.find(entry => entry.zh === zh);
  if (!item) throw new Error('Unknown fixture option: ' + key + ' / ' + zh);
  return item.id;
};

export const seatCases = [
  ['classroom', '室內：日本學校教室', '自然坐姿'],
  ['bedroom', '室內：精品飯店房間', '盤腿坐姿'],
  ['washitsu', '室內：日式和室', '微微前傾'],
  ['ground-no-floor', '其他：白色床鋪', '折腿低坐・雙掌後撐'],
  ['outdoor', '戶外：金色海灘與浪線', '單腿屈起・單掌後撐'],
];
export function seatFixture(location, action, framing, overrides = {}) {
  const locks = createEmptyLocks();
  for (const control of controls) {
    const none = control.options.find(item => item.zh === '全無' || item.zh === '無額外表情');
    if (none) locks[control.key] = none.id;
  }
  Object.assign(locks, { subjectCount: '1', locationId: option('locationId', location),
    specifiedActionId: option('specifiedActionId', action), framingId: framing, ...overrides });
  const seeded = createSeededRandom('indoor-seating-v1-' + framing);
  let draws = 0;
  const [prompt] = generatePrompts(1, locks, [], {random: () => { draws++; return seeded(); }});
  return { prompt, draws, cards: buildPage1GenerationPromptCards(prompt), locks };
}
export const seatFramings = controls.find(c => c.key === 'framingId').options
  .filter(item => item.en && item.en !== 'none' && item.id !== 'random').map(item => item.id);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function seatBaselineRows() {
  return Object.fromEntries(seatCases.flatMap(([name, location, action]) => seatFramings.map(framing => {
    const { prompt, draws, cards } = seatFixture(location, action, framing);
    if (cards.length !== 7) throw new Error('Expected seven actual outputs');
    return [name + '/' + framing, { draws, selection: hash(prompt.selection), structured: hash(prompt.structured),
      outputs: Object.fromEntries(cards.map(({id, value}) => [id, hash(value)])) }];
  })));
}
