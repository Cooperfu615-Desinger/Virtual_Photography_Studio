// 實跑探針：固定色套裝（資料內寫死顏色、無 colorMode）在指定套裝主色時的輸出
// 用法：cd <repo>/webapp && node <scratchpad>/db-analysis/wardrobe_preset_color_probe.mjs
// 只呼叫引擎純函式，不寫入 repo。
const m = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const controls = m.getLockControls();
const presetCtl = controls.find((c) => c.key === 'outfitPresetId');
const colorCtl = controls.find((c) => c.key === 'outfitPresetPrimaryColorId');
const pick = (zhPart) => presetCtl.options.find((o) => o.zh.includes(zhPart));
const color = colorCtl.options.find((o) => o.id === 'white') ? colorCtl.options.find((o) => /blue|藍/.test(o.id + o.zh)) : colorCtl.options[3];
const cases = ['綁帶針織寬牛仔', 'Spider-Man Cosplay', '套裝：西裝長褲'];
const out = [];
for (const zh of cases) {
  const preset = pick(zh);
  for (const col of [null, color]) {
    const locks = { ...m.createEmptyLocks(), subjectCount: 'single', outfitPresetId: preset.id, specialOutfitId: controls.find((c) => c.key === 'specialOutfitId').options.find((o) => o.zh === '全無').id };
    if (col) { locks.outfitPresetPrimaryColorId = col.id; }
    const [p] = m.generatePrompts(1, locks, [], { seed: 'wardrobe-probe-1' });
    const gpt = p.grokPrompt || '';
    const idx = gpt.search(/burgundy|spider|tailored|suit/i);
    out.push({ preset: preset.zh, color: col ? `${col.id}=${col.zh}` : 'none', gptExcerpt: idx >= 0 ? gpt.slice(Math.max(0, idx - 120), idx + 520) : gpt.slice(0, 400) });
  }
}
console.log(JSON.stringify({ colorUsed: color && `${color.id}=${color.zh}`, out }, null, 1));
