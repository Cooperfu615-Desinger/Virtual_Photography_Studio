// 讀取引擎執行期推論的 wardrobe meta.family / tags 分佈（唯讀）
// 用法：cd <repo>/webapp && node <scratchpad>/db-analysis/wardrobe_runtime_family.mjs
const m = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const keys = ['specialOutfitId','outfitPresetId','topId','pantsId','skirtId','outerwearId','shoesId','legwearId'];
const ctls = m.getLockControls().filter((c) => keys.includes(c.key));
const fam = {}; const tags = {}; const samples = {};
for (const c of ctls) {
  fam[c.key] = {};
  for (const o of c.options) {
    if (!o.meta || o.id === 'random' || o.zh === '全無') continue;
    const f = o.meta.family || '(none)';
    fam[c.key][f] = (fam[c.key][f] || 0) + 1;
    (o.meta.tags || []).forEach((t) => { tags[t] = (tags[t] || 0) + 1; });
    if (['swimwear','lingerie','bdsm','schoolgirl','bohemian','military'].includes(f)) (samples[f] = samples[f] || []).push(`${c.key}:${o.zh}`);
  }
}
console.log(JSON.stringify({ fam, tags, samples }, null, 1));
