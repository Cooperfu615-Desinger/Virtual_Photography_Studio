// 主 MJ 短名表覆蓋率：目錄選項 ID vs MIDJOURNEY_ITEM_NAMES（唯讀）
// 用法：cd <repo>/webapp && node <scratchpad>/db-analysis/wardrobe_mj_coverage.mjs
const m = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const { MIDJOURNEY_ITEM_NAMES } = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine/midjourneyItemNames.js');
const ctls = m.getLockControls();
const allIds = new Map();
for (const c of ctls) for (const o of c.options || []) if (o.id && String(o.id).startsWith('wardrobe:')) allIds.set(o.id, { key: c.key, zh: o.zh, legacy: o.legacyIds || [] });
const cat = (id) => id.split(':')[1];
const byCat = {};
for (const [id, v] of allIds) {
  if (/:全無:/.test(id)) continue;
  const k = cat(id);
  byCat[k] = byCat[k] || { total: 0, named: 0, missing: [] };
  byCat[k].total++;
  if (MIDJOURNEY_ITEM_NAMES[id]) byCat[k].named++; else byCat[k].missing.push(v.zh);
}
const orphan = Object.keys(MIDJOURNEY_ITEM_NAMES).filter((id) => !allIds.has(id));
for (const k of Object.keys(byCat)) if (byCat[k].missing.length > 12) byCat[k].missing = [`(${byCat[k].missing.length} items)`];
console.log(JSON.stringify({ mjEntries: Object.keys(MIDJOURNEY_ITEM_NAMES).length, byCat, orphanInMjTable: orphan }, null, 1));
