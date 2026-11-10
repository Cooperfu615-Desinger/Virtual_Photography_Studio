import { createHash } from 'node:crypto';
import { getLockControls } from '../engine.js';
import { seatFixture, seatFramings } from './indoorSeatFixtures.js';

const controls = getLockControls();
const options = key => controls.find(control => control.key === key).options;
const id = (key, name) => {
  const value = options(key).find(item => item.zh === name);
  if (!value) throw new Error('Unknown skirt baseline option ' + key + '/' + name);
  return value.id;
};
const innerNames = ['比基尼下身', '蕾絲丁字褲', '棉質低腰三角褲', '窄前片細繩蕾絲丁字褲', '窄前片細繩比基尼下身'];
const pantsNames = ['工裝長褲', '直筒牛仔褲', '運動棉褲'];
const rises = ['ultra-low-rise', 'unbuttoned-slightly-unzipped', 'lowered-to-thighs'];
const base = { topId: id('topId', '落肩 T 恤') };

/** Current-main snapshots of public text, selection, structured sources and RNG. */
export function skirtProtectedRows() {
  const rows = {};
  const record = (key, framing, values) => {
    const { prompt, cards, draws } = seatFixture('室內：日本學校教室', '自然坐姿', framing, { ...base, ...values });
    const { id: runtimeId, date, ...stable } = prompt;
    if (!runtimeId || !date || cards.length !== 7) throw new Error('Invalid skirt protected fixture ' + key);
    rows[key] = createHash('sha256').update(JSON.stringify({ stable, cards, draws })).digest('hex');
  };
  for (const pants of pantsNames) for (const rise of rises) for (const inner of ['', ...innerNames]) for (const framing of seatFramings) {
    record(['pants', pants, rise, inner || 'none', framing].join('/'), framing, {
      pantsId: id('pantsId', pants), bottomRiseId: rise,
      ...(inner ? { bottomUnderlayerId: id('pantsId', inner), bottomUnderlayerColorId: 'black' } : {}),
    });
  }
  for (const skirt of options('skirtId').filter(item => item.zh !== '全無')) for (const framing of seatFramings) {
    record(['ordinary-skirt', skirt.id, framing].join('/'), framing, { skirtId: skirt.id, bottomRiseId: 'mid-rise' });
  }
  for (const gestureId of ['gesture-lift-hem-both', 'gesture-hold-hem-teeth']) for (const framing of seatFramings) {
    record(['upper-layer', gestureId, framing].join('/'), framing, {
      pantsId: id('pantsId', '工裝長褲'), gestureId,
      topUnderlayerId: id('topId', '蕾絲胸罩'), topUnderlayerColorId: 'white',
      bottomRiseId: 'ultra-low-rise', bottomUnderlayerId: id('pantsId', '比基尼下身'), bottomUnderlayerColorId: 'black',
    });
  }
  return rows;
}
