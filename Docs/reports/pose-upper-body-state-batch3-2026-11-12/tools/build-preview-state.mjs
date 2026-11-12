// Rebuild only the opt-in synthetic browser fixtures, never real Saved Cards.
import { readFileSync, writeFileSync } from 'node:fs';
import { upperBodyStateLocks, upperBodyStateOption, runUpperBodyStateCase } from '../../../../webapp/src/lib/engine/specifiedActionUpperBodyStateFixtures.js';
import { serializeFavoritePrompt } from '../../../../webapp/src/features/saved-cards/cardCodec.js';
import indoor from '../../../../webapp/src/lib/engine/indoorKneelScenes.json' with { type: 'json' };
import outdoor from '../../../../webapp/src/lib/engine/outdoorKneelScenes.json' with { type: 'json' };

const find = (map, text) => {
  const id = Object.keys(map).find(key => key.includes(text));
  if (!id) throw new Error('Missing synthetic scene ' + text);
  return id;
};
const targets = [
  ['specified-kneeling-seiza', '跪坐', find(indoor, '日本學校教室'), 'floor'],
  ['specified-kneeling-wide', '分腿跪坐', find(indoor, '復古美式-diner'), 'sofa'],
  ['specified-kneeling-forward-lean', '前傾跪姿', find(indoor, '木造圖書館閱讀桌旁'), 'reading-table'],
  ['specified-kneeling-upright-poised', '直立端正跪姿', find(outdoor, '建材堆放角落'), 'board'],
  ['specified-kneeling-side-sit', '側坐跪姿', find(indoor, '生活感日式榻榻米'), 'tatami'],
  ['specified-kneeling-one-knee-forward', '單膝前跨跪姿', find(outdoor, '沙灘海岸線'), 'sand'],
];
const protectedActions = [
  ['specified-sitting-legs-extended', '雙腿自然伸展'],
  ['specified-squatting-natural', '自然蹲姿'],
  ['specified-lying-left-side-forearm', '側躺・單前臂撐起上身'],
];
const cards = [];
for (const [id, label, locationId, indoorKneelId] of [...targets, ...protectedActions]) {
  for (const [crop, framing] of [['medium', '中景鏡頭 (Medium Shot)'], ['chest', '胸上特寫']]) {
    const index = cards.length;
    const locks = upperBodyStateLocks({ specifiedActionId: id,
      framingId: upperBodyStateOption('framingId', framing),
      locationId: locationId || upperBodyStateOption('locationId', '戶外：森林步道'),
      ...(indoorKneelId ? { indoorKneelId } : {}),
    });
    const { prompt, cards: outputs } = runUpperBodyStateCase({ key: 'preview/' + index, seed: 'b3-preview/' + index, locks });
    if (outputs.length !== 7) throw new Error('Missing public output');
    if (indoorKneelId && prompt.selection.indoorKneelId !== indoorKneelId) throw new Error('Invalid synthetic surface ' + label);
    cards.push(serializeFavoritePrompt({ ...prompt, id: 'b3-' + index,
      date: new Date(Date.UTC(2026, 10, 12, 4, index)).toISOString(),
      summary: 'B3 QA ' + label + ' ' + crop,
    }));
  }
}
const initial = upperBodyStateLocks({ specifiedActionId: targets[0][0],
  framingId: upperBodyStateOption('framingId', '中景鏡頭 (Medium Shot)'),
  locationId: targets[0][2], indoorKneelId: targets[0][3] });
const previous = JSON.parse(readFileSync(new URL('../../pose-upper-body-state-batch2-2026-11-12/tools/preview-state.json', import.meta.url), 'utf8'));
writeFileSync(new URL('./preview-state.json', import.meta.url), JSON.stringify({
  'vps.locks': JSON.stringify(initial), 'vps.pageMode': 'page1',
  'vps.page3Profile': previous['vps.page3Profile'], 'vps.favorites': JSON.stringify(cards),
}, null, 2) + '\n');
process.stdout.write(JSON.stringify({ cards: cards.length, targetCards: targets.length * 2,
  protectedCards: protectedActions.length * 2, initial: targets[0][1], support: targets[0][3] }) + '\n');
