// 實跑探針（預設流程）：只鎖定套裝／連身，其餘維持 createEmptyLocks() 預設，每項 3 個 seed
// 檢查 grokPrompt / zImagePrompt / midjourneyPrompt 是否殘留控制語
// 用法：cd <repo>/webapp && node <scratchpad>/db-analysis/wardrobe_control_leak_default_probe.mjs
const m = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const controls = m.getLockControls();
const presetCtl = controls.find((c) => c.key === 'outfitPresetId');
const FIELDS = ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt'];
const RE = /controlled by|color selection|palette selection|palette-controlled|\bdominant (?:suit|coat|base|towel)[.,]/i;
const empty = m.createEmptyLocks();
let runs = 0;
const hits = {};
const itemsHit = new Set();
const examples = [];
for (const opt of presetCtl.options) {
  if (opt.id === 'random' || opt.zh === '全無') continue;
  for (const seed of ['s1', 's2', 's3']) {
    const locks = { ...empty, outfitPresetId: opt.id };
    const [p] = m.generatePrompts(1, locks, [], { seed: `${seed}-${opt.id}` });
    runs++;
    for (const f of FIELDS) {
      const t = p[f] || '';
      const mm = t.match(RE);
      if (mm) {
        hits[f] = (hits[f] || 0) + 1;
        itemsHit.add(opt.zh);
        if (examples.length < 6) examples.push({ item: opt.zh, seed, field: f, excerpt: t.slice(Math.max(0, mm.index - 90), mm.index + 50).replace(/\n/g, ' ') });
      }
    }
  }
}
console.log(JSON.stringify({ emptyLockDefaults: { subjectCount: empty.subjectCount, specialOutfitId: empty.specialOutfitId, outfitPresetPrimaryColorId: empty.outfitPresetPrimaryColorId, dressColorId: empty.dressColorId, framingId: empty.framingId }, runs, hitsByField: hits, itemsHit: itemsHit.size, examples }, null, 1));
