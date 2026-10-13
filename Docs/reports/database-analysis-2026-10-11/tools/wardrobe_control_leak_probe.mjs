// 實跑探針：全部套裝／連身在「無指定色」與「指定主色」下，六組公開輸出是否殘留控制語或截斷殘片
// 用法：cd <repo>/webapp && node <scratchpad>/db-analysis/wardrobe_control_leak_probe.mjs
// 只呼叫引擎純函式，不寫入 repo。
const m = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const controls = m.getLockControls();
const ctl = (k) => controls.find((c) => c.key === k);
const presetCtl = ctl('outfitPresetId');
const framing = ctl('framingId').options.find((o) => /全身/.test(o.zh));
const none = (k) => ctl(k).options.find((o) => o.zh === '全無' || o.id === 'none')?.id;
const color = ctl('outfitPresetPrimaryColorId').options.find((o) => o.id === 'light-blue');
const OUTPUT_FIELDS = ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt'];
const LEAK = [
  { name: 'controlled_by', re: /controlled by/i },
  { name: 'color_selection', re: /color selection|palette selection|palette-controlled/i },
  { name: 'dangling_dominant', re: /\bdominant (suit|coat|base|towel|satin|swim fabric|metallic fabric|fabric|uniform|textile|leather)\s*[.,]/i },
];
const rows = [];
let runs = 0;
for (const opt of presetCtl.options) {
  if (opt.id === 'random' || opt.zh === '全無') continue;
  for (const col of [{ id: 'none' }, color]) {
    const locks = {
      ...m.createEmptyLocks(),
      subjectCount: 'single',
      outfitPresetId: opt.id,
      specialOutfitId: none('specialOutfitId'),
      framingId: framing.id,
      outfitPresetPrimaryColorId: col.id,
      outfitPresetContrastColorId: 'none',
      dressColorId: col.id,
    };
    const [p] = m.generatePrompts(1, locks, [], { seed: `leak-${opt.id}` });
    runs++;
    for (const f of OUTPUT_FIELDS) {
      const text = p[f] || '';
      for (const l of LEAK) {
        const mm = text.match(l.re);
        if (mm) {
          const i = mm.index;
          rows.push({ item: opt.zh, color: col.id, field: f, leak: l.name, excerpt: text.slice(Math.max(0, i - 80), i + 60).replace(/\n/g, ' ') });
        }
      }
    }
  }
}
const byLeak = {};
rows.forEach((r) => { byLeak[r.leak] = (byLeak[r.leak] || 0) + 1; });
const items = [...new Set(rows.map((r) => r.item))];
console.log(JSON.stringify({ runs, framing: framing.zh, hits: rows.length, byLeak, affectedItems: items, rows }, null, 1));
