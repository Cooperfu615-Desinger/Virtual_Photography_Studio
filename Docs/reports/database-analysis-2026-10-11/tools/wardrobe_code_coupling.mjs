// 量測 Wardrobe 資料與程式碼的耦合（唯讀）
// 用法：node wardrobe_code_coupling.mjs
import fs from 'node:fs';
import path from 'node:path';

const REPO = '/Users/cooperfu/Projects/Virtual_Photography_Studio';
const LIB = path.join(REPO, 'webapp/src');
const db = JSON.parse(fs.readFileSync(path.join(REPO, 'webapp/src/data/database.json'), 'utf8'));
const W = db.Wardrobe;

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs)$/.test(f.name) && !/\.test\.|TestSupport|Fixtures?\.js$/.test(f.name) && !p.includes('/data/')) out.push(p);
  }
  return out;
}
const files = walk(LIB);
const src = Object.fromEntries(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));

// 1. 中文單品名稱以字串常數出現在非測試程式碼
const hard = [];
for (const [cat, items] of Object.entries(W)) {
  for (const it of items) {
    if (it.zh === '全無' || it.zh.length < 2) continue;
    const quoted = [`'${it.zh}'`, `"${it.zh}"`, `\`${it.zh}\``];
    let n = 0; const where = new Set();
    for (const [f, s] of Object.entries(src)) {
      for (const q of quoted) {
        const c = s.split(q).length - 1;
        if (c) { n += c; where.add(path.relative(REPO, f)); }
      }
    }
    if (n) hard.push({ cat, zh: it.zh, n, where: [...where] });
  }
}
const byCat = {};
hard.forEach((h) => { byCat[h.cat] = (byCat[h.cat] || 0) + 1; });
const totalItems = Object.values(W).reduce((a, v) => a + v.filter((x) => x.zh !== '全無').length, 0);

// 2. 以英文片語 regex 改寫目錄文字（engine.js）
const engine = src[path.join(LIB, 'lib/engine.js')];
const replaceLines = engine.split('\n').filter((l) => l.includes('.replace(/'));
const garmentRe = /\b(dress|skirt|jacket|denim|lace|shirt|pants|shorts|boots|outerwear|silhouette|fabric|satin|latex|corset|bikini|sneakers?|cardigan|blazer|necklace|choker|belt|garter|stockings?|hem|top|bra)\b/i;
const garmentReplace = replaceLines.filter((l) => garmentRe.test(l.replace(/\.replace\(/g, '')));
const controlReplace = replaceLines.filter((l) => /controlled by|color selection|contrast palette/i.test(l));

// 3. 依 stableId 字串硬寫的 ID（wardrobe:...）
const idLits = {};
for (const [f, s] of Object.entries(src)) {
  const m = s.match(/['"`]wardrobe:[^'"`]+['"`]/g) || [];
  if (m.length) idLits[path.relative(REPO, f)] = m.length;
}

console.log(JSON.stringify({
  scannedFiles: files.length,
  hardcodedZhItems: hard.length,
  totalNonNoneItems: totalItems,
  hardcodedByCat: byCat,
  topHardcoded: hard.sort((a, b) => b.n - a.n).slice(0, 25),
  engineReplaceLines: replaceLines.length,
  engineGarmentPhraseReplaceLines: garmentReplace.length,
  engineControlPhraseReplaceLines: controlReplace.length,
  wardrobeIdLiteralsByFile: idLits,
}, null, 1));
