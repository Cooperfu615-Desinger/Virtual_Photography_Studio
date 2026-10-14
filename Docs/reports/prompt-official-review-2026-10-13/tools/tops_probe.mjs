const E = await import(process.cwd() + '/src/lib/engine.js');
const { getLockControls, createEmptyLocks, createSeededRandom, generatePrompts } = E;
const controls = getLockControls(); const arr = Array.isArray(controls) ? controls : Object.values(controls);
const byKey = Object.fromEntries(arr.map(c => [c.key, c]));
const find = (key, zh) => { const o = byKey[key].options.find(o => o.zh === zh || o.zh.includes(zh)); if (!o) throw new Error(key + ' ' + zh); return o.id; };
const framingKey = arr.find(c => /framing/i.test(c.key) && !/A|B$/.test(c.key))?.key;
const cases = [
  { name: 'A 襯衫+黑色+細直條紋+合身+紮入+直筒牛仔褲', set: { topId: ['topId','襯衫'], topColorId: ['topColorId','黑色'], topPatternId: ['topPatternId','細直條紋'], topFitId: ['topFitId','合身'], topStylingId: ['topStylingId','紮入下身'], pantsId: ['pantsId','直筒牛仔褲'] } },
  { name: 'B 落肩T恤（無配色無版型）+直筒牛仔褲', set: { topId: ['topId','落肩 T 恤'], pantsId: ['pantsId','直筒牛仔褲'] } },
  { name: 'C 短版蕾絲背心+白色', set: { topId: ['topId','短版蕾絲背心'], topColorId: ['topColorId','白色'], pantsId: ['pantsId','直筒牛仔褲'] } },
  { name: 'D 絲質細肩帶上衣+緊身（版型與單品描述是否衝突）', set: { topId: ['topId','絲質細肩帶上衣'], topFitId: ['topFitId','緊身'], pantsId: ['pantsId','直筒牛仔褲'] } },
];
console.log('framingKey', framingKey, byKey[framingKey]?.options.map(o=>o.zh).join('/'));
for (const c of cases) {
  const locks = createEmptyLocks();
  for (const [k, [ck, zh]] of Object.entries(c.set)) locks[k] = find(ck, zh);
  if (framingKey) { const fb = byKey[framingKey].options.find(o => /全身/.test(o.zh)); if (fb) locks[framingKey] = fb.id; }
  for (const k of ['specialOutfitId','outfitPresetId','dressId','outerwearId','characterProfileId','specialSubjectId']) if (byKey[k]) { const none = byKey[k].options.find(o => o.zh === '全無' || /none/.test(o.id)); if (none) locks[k] = none.id; }
  const res = generatePrompts(1, locks, [], { random: createSeededRandom('tops-probe') });
  const p = Array.isArray(res) ? res[0] : res;
  const g = p.grokPrompt || ''; const z = p.zImagePrompt || ''; const m = p.midjourneyPrompt || '';
  const wardrobe = g.split(/\n(?=[A-Z][A-Za-z ]+:?\n)|\n\n/).filter(s => /Wardrobe|wears|shirt|t-shirt|camisole|lace|jeans/i.test(s)).join('\n…\n');
  console.log('\n==== ' + c.name);
  console.log('--- GPT wardrobe 段:\n' + wardrobe.slice(0, 1500));
  const zs = z.split(/(?<=\.)\s+/).filter(s => /shirt|t-shirt|camisole|jeans|top/i.test(s));
  console.log('--- Z 相關句:\n' + zs.join('\n'));
  const ms = m.split(/(?<=\.)\s+/).filter(s => /shirt|t-shirt|camisole|jeans|top/i.test(s));
  console.log('--- MJ 相關句:\n' + ms.join('\n'));
}
