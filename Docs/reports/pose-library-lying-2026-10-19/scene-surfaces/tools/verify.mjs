import fs from 'node:fs';
// 用法：node tools/verify.mjs（在 scene-surfaces/ 執行）：每個可躺場景的 surfaceEn 必須逐字出現在場景英文中
const P = new URL('../', import.meta.url).pathname;
const locs = JSON.parse(fs.readFileSync(P + 'locations.json', 'utf8'));
const out = JSON.parse(fs.readFileSync(P + 'surfaces.json', 'utf8'));
const errs = [];
if (out.length !== locs.length) errs.push(`length ${out.length} != ${locs.length}`);
const types = new Set(['bed','floor','tatami','sofa','rug','grass','sand','ground','other']);
const keys = ['id','zh','lyingAllowed','surfaceType','surfaceEn','sourceSnippet','confidence','needsReview','note'];
let pass = 0, fail = 0;
const tc = {};
out.forEach((o, i) => {
  if (o.id !== locs[i].id) errs.push(`order mismatch at ${i}`);
  for (const k of keys) if (!(k in o)) errs.push(`${i} missing ${k}`);
  if (!['high','medium','low'].includes(o.confidence)) errs.push(`${i} bad confidence`);
  if (!o.note) errs.push(`${i} empty note`);
  if (o.lyingAllowed) {
    if (!types.has(o.surfaceType)) errs.push(`${i} bad type`);
    tc[o.surfaceType] = (tc[o.surfaceType] || 0) + 1;
    const en = locs[i].en.toLowerCase();
    if (o.surfaceEn && en.includes(o.surfaceEn.toLowerCase())
        && o.sourceSnippet && en.includes(o.sourceSnippet.replace(/^…|…$/g, '').toLowerCase())
        && o.sourceSnippet.toLowerCase().includes(o.surfaceEn.toLowerCase())) pass++;
    else { fail++; errs.push(`${i} substring FAIL: ${o.surfaceEn}`); }
  } else if (o.surfaceType || o.surfaceEn) errs.push(`${i} false but has surface`);
});
const c = (f) => out.filter(f).length;
console.log({ total: out.length, pass, fail,
  okHigh: c(o => o.lyingAllowed && !o.needsReview),
  review: c(o => o.needsReview), reviewTrue: c(o => o.needsReview && o.lyingAllowed),
  notAllowed: c(o => !o.lyingAllowed && !o.needsReview), types: tc, errors: errs });
