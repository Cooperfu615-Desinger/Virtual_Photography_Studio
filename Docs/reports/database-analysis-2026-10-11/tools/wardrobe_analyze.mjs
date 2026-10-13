// Wardrobe 分區唯讀分析腳本
// 用法：cd <repo>/webapp && node <scratchpad>/db-analysis/wardrobe_analyze.mjs > <scratchpad>/db-analysis/wardrobe_metrics.json
// 只讀取 repo 檔案，不寫入 repo。
import fs from 'node:fs';
import path from 'node:path';

const REPO = '/Users/cooperfu/Projects/Virtual_Photography_Studio';
const OUT = process.argv[2] || null;
const md = fs.readFileSync(path.join(REPO, 'knowledge_base/wardrobe_and_styling.md'), 'utf8').split('\n');
const db = JSON.parse(fs.readFileSync(path.join(REPO, 'webapp/src/data/database.json'), 'utf8'));
const itemMeta = JSON.parse(fs.readFileSync(path.join(REPO, 'knowledge_base/item_metadata.json'), 'utf8'));
const presetMeta = JSON.parse(fs.readFileSync(path.join(REPO, 'knowledge_base/outfit_preset_metadata.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'knowledge_base/wardrobe_reference_manifest.json'), 'utf8'));
const mjSrc = fs.readFileSync(path.join(REPO, 'webapp/src/lib/engine/midjourneyItemNames.js'), 'utf8');
const W = db.Wardrobe;

const result = {};

// ---------- Markdown line numbers ----------
const lineOf = {}; // `${cat}||${zh}` -> line
md.forEach((line, i) => {
  if (!line.startsWith('|')) return;
  const parts = line.split('|').slice(1, -1).map((p) => p.trim());
  if (parts.length < 4) return;
  const cat = parts[0].replace(/\*/g, '').trim();
  const zh = parts[1].replace(/[`*]/g, '').replace(/\s+/g, ' ').trim();
  lineOf[`${cat}||${zh}`] = i + 1;
});
const L = (cat, zh) => lineOf[`${cat}||${zh}`] || null;

// ---------- helpers ----------
const words = (s) => (s.match(/[A-Za-z0-9][A-Za-z0-9'’\-\/&.]*/g) || []).filter((w) => w !== '.');
const isNone = (it) => it.zh === '全無' || it.en.trim().toLowerCase() === 'none';
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// ---------- 1. counts ----------
const cats = Object.keys(W);
result.counts = cats.map((c) => ({
  cat: c,
  total: W[c].length,
  hasNone: W[c].some(isNone),
  nonNone: W[c].filter((x) => !isNone(x)).length,
}));
result.totalItems = cats.reduce((a, c) => a + W[c].length, 0);
result.totalNonNone = result.counts.reduce((a, c) => a + c.nonNone, 0);

// ---------- 2. length vs guide ----------
const GUIDE = {
  '特殊穿搭 (Special Outfits)': [35, 85],
  '套裝 (Outfit Presets)': [12, 32],
  '連身 (Dresses)': [12, 32],
  '上身 (Tops)': [6, 20],
  '褲裝 (Pants)': [6, 20],
  '裙裝 (Skirts)': [6, 20],
  '外套 (Outerwear)': [6, 20],
  '鞋款 (Shoes)': [5, 18],
  '襪類 (Legwear)': [4, 16],
  '頭部配件 (Head Accessories)': [4, 16],
  '眼鏡 (Eyewear)': [4, 16],
  '耳環 (Earrings)': [4, 16],
  '頸部 (Neck Accessories)': [4, 16],
  '鼻部穿孔 (Nose Piercings)': [4, 16],
  '唇部穿孔 (Lip Piercings)': [4, 16],
  '腰部配件 (Waist Accessories)': [6, 16],
  '外套版型 (Outerwear Fit)': [4, 14],
  '外套開合 (Outerwear Opening)': [4, 14],
  '外套穿法 (Outerwear Styling)': [4, 14],
};
const lenRows = [];
const outliers = [];
for (const c of cats) {
  const items = W[c].filter((x) => !isNone(x));
  const wc = items.map((x) => words(x.en).length);
  const g = GUIDE[c];
  let over = 0;
  let under = 0;
  items.forEach((x, i) => {
    const n = wc[i];
    if (g && n > g[1]) {
      over++;
      outliers.push({ cat: c, zh: x.zh, words: n, guide: g, kind: 'over', line: L(c, x.zh) });
    }
    if (g && n < g[0]) {
      under++;
      outliers.push({ cat: c, zh: x.zh, words: n, guide: g, kind: 'under', line: L(c, x.zh) });
    }
  });
  const minI = wc.indexOf(Math.min(...wc));
  const maxI = wc.indexOf(Math.max(...wc));
  lenRows.push({
    cat: c,
    n: items.length,
    min: wc.length ? Math.min(...wc) : null,
    minItem: items[minI]?.zh,
    median: median(wc),
    max: wc.length ? Math.max(...wc) : null,
    maxItem: items[maxI]?.zh,
    guide: g ? `${g[0]}-${g[1]}` : 'not_stated',
    over,
    under,
    overPct: g ? pct(over, items.length) : null,
  });
}
result.length = lenRows;
const allWc = cats.flatMap((c) => W[c].filter((x) => !isNone(x)).map((x) => words(x.en).length));
result.lengthOverall = { n: allWc.length, min: Math.min(...allWc), median: median(allWc), max: Math.max(...allWc), sum: allWc.reduce((a, b) => a + b, 0) };
result.lengthOutliersTop = outliers.filter((o) => o.kind === 'over').sort((a, b) => (b.words - b.guide[1]) - (a.words - a.guide[1])).slice(0, 25);
result.lengthUnder = outliers.filter((o) => o.kind === 'under');
result.lengthOverTotal = outliers.filter((o) => o.kind === 'over').length;
result.lengthGuidedTotal = cats.filter((c) => GUIDE[c]).reduce((a, c) => a + W[c].filter((x) => !isNone(x)).length, 0);

// ---------- 3. lexical scans ----------
const LEX = {
  internalControl: /\b(guard|fallback|controlled by|color selection|selection|selected|runtime|lock(?:ed)?|integrity|override|placeholder|by default|default)\b/i,
  negative: /\b(not|no|without|avoid|never|don't|non)\b/i,
  scene: /\b(street|room|studio|beach|hotel|school|office|downtown|club|party|city|bedroom|runway|stage|festival|campus|resort|pool|poolside|café|cafe)\b/i,
  lighting: /\b(sunset|sunlight|softbox|backlit|backlight|neon light|golden hour|rim light|moonlight|spotlight|blue sky)\b/i,
  photography: /\b(35mm|film grain|cinematic|close-up|closeup|bokeh|lens|camera|photo|photograph|shot|editorial|lookbook|campaign|magazine|portrait)\b/i,
  person: /\b(beautiful|pretty|gorgeous|seductive|sexy|alluring|cute|young|idol|slim body|curvy|skin|cleavage|curves|gaze|flattering|sensual|provocative|flirty|innocent|girl|woman|women|body)\b/i,
  subjective: /\b(elegant|chic|sophisticated|luxurious|refined|timeless|effortless|perfect|stunning|classy|charming|graceful|feminine|playful|romantic|edgy|cool|trendy|fashionable|stylish|iconic|glamorous|attitude|vibe|energy|aesthetic|mood|confident|polished|delicate|dreamy|sweet|bold)\b/i,
  hexColor: /#[0-9a-f]{3,6}\b|rgb\(/i,
  color: /\b(black|white|red|blue|navy|pink|green|yellow|gr[ae]y|brown|beige|ivory|cream|burgundy|gold|golden|silver|purple|lavender|khaki|camel|tan|nude|olive|charcoal|champagne|rose|pastel|orange|teal|turquoise|mint|wine|maroon|crimson|scarlet|cobalt|indigo|monochrome)\b/i,
};
const GENERAL_GARMENT = new Set(['套裝 (Outfit Presets)', '連身 (Dresses)', '上身 (Tops)', '褲裝 (Pants)', '裙裝 (Skirts)', '外套 (Outerwear)', '鞋款 (Shoes)', '襪類 (Legwear)']);
const lexHits = {};
for (const [k, re] of Object.entries(LEX)) {
  const reG = new RegExp(re.source, 'gi');
  const rows = [];
  for (const c of cats) {
    for (const x of W[c]) {
      if (isNone(x)) continue;
      const m = x.en.match(reG);
      if (m) rows.push({ cat: c, zh: x.zh, hits: [...new Set(m.map((s) => s.toLowerCase()))], line: L(c, x.zh) });
    }
  }
  const byCat = {};
  rows.forEach((r) => { byCat[r.cat] = (byCat[r.cat] || 0) + 1; });
  const termFreq = {};
  rows.forEach((r) => r.hits.forEach((h) => { termFreq[h] = (termFreq[h] || 0) + 1; }));
  lexHits[k] = { items: rows.length, byCat, termFreq, sample: rows.slice(0, 400) };
}
// color words restricted to general garment categories
const colorGeneral = lexHits.color.sample.filter((r) => GENERAL_GARMENT.has(r.cat));
lexHits.colorInGeneralGarments = {
  items: colorGeneral.length,
  ofTotal: cats.filter((c) => GENERAL_GARMENT.has(c)).reduce((a, c) => a + W[c].filter((x) => !isNone(x)).length, 0),
  byCat: colorGeneral.reduce((a, r) => { a[r.cat] = (a[r.cat] || 0) + 1; return a; }, {}),
  sample: colorGeneral,
};
result.lexical = lexHits;

// special outfit prefix
result.specialPrefix = W['特殊穿搭 (Special Outfits)'].filter((x) => !isNone(x) && !x.en.startsWith('complete outfit:')).map((x) => ({ zh: x.zh, line: L('特殊穿搭 (Special Outfits)', x.zh), head: x.en.slice(0, 40) }));
// leakage of "complete outfit:" into non-special
result.completeOutfitOutsideSpecial = cats.filter((c) => c !== '特殊穿搭 (Special Outfits)').flatMap((c) => W[c].filter((x) => /complete outfit/i.test(x.en)).map((x) => ({ cat: c, zh: x.zh, line: L(c, x.zh) })));

// ---------- 4. format checks ----------
const fmt = { trailingPeriod: 0, noTrailingPeriod: 0, startsUpper: 0, doubleSpace: [], spaceBeforeComma: [], doubleComma: [], nonAscii: [], cjkInEn: [], repeatedWord: [], endsComma: [], descHasLatinOnly: [], descEmpty: [], descShort: [], enEqualsZh: [], semicolon: 0 };
const enRaw = [];
for (const c of cats) for (const x of W[c]) {
  if (isNone(x)) continue;
  const e = x.en;
  enRaw.push(e);
  if (/\.\s*$/.test(e)) fmt.trailingPeriod++; else fmt.noTrailingPeriod++;
  if (/^[A-Z]/.test(e)) fmt.startsUpper++;
  if (/;/.test(e)) fmt.semicolon++;
  const ref = { cat: c, zh: x.zh, line: L(c, x.zh) };
  if (/ {2,}/.test(e)) fmt.doubleSpace.push(ref);
  if (/ ,/.test(e)) fmt.spaceBeforeComma.push(ref);
  if (/,,/.test(e)) fmt.doubleComma.push(ref);
  if (/,\s*$/.test(e)) fmt.endsComma.push(ref);
  const na = e.match(/[^\x00-\x7F]/g);
  if (na) fmt.nonAscii.push({ ...ref, chars: [...new Set(na)].join('') });
  if (/[一-鿿]/.test(e)) fmt.cjkInEn.push(ref);
  const rw = e.match(/\b(\w+)\s+\1\b/i);
  if (rw) fmt.repeatedWord.push({ ...ref, w: rw[0] });
  if (!x.desc || !x.desc.trim()) fmt.descEmpty.push(ref);
  else if (x.desc.length < 12) fmt.descShort.push({ ...ref, desc: x.desc });
  if (x.desc && !/[一-鿿]/.test(x.desc)) fmt.descHasLatinOnly.push(ref);
}
// zh naming patterns
const zhChars = {};
for (const c of cats) for (const x of W[c]) {
  for (const ch of ['鍊', '鏈', '釦', '扣', 'T恤', 'T 恤', '帽T', '帽t', '帽 T']) {
    if (x.zh.includes(ch)) { zhChars[ch] = zhChars[ch] || []; zhChars[ch].push(`${c}/${x.zh}`); }
  }
}
fmt.zhVariantChars = zhChars;
// zh contains english/space/punct styles
fmt.zhWithLatin = cats.flatMap((c) => W[c].filter((x) => /[A-Za-z]/.test(x.zh)).map((x) => `${c}/${x.zh}`));
fmt.zhWithFullwidthBar = cats.flatMap((c) => W[c].filter((x) => /｜|\|/.test(x.zh)).map((x) => `${c}/${x.zh}`));
result.format = fmt;

// ---------- 5. duplicates ----------
const STOP = new Set('a an the and or with of in on at to for by from as its it is are be into over under that this which while one two'.split(' '));
const toks = (s) => new Set(words(s.toLowerCase()).map((w) => w.replace(/[.,]$/, '')).filter((w) => !STOP.has(w) && w.length > 1));
const jacc = (a, b) => { let i = 0; a.forEach((x) => { if (b.has(x)) i++; }); return i / (a.size + b.size - i || 1); };
const flat = [];
for (const c of cats) W[c].forEach((x) => { if (!isNone(x)) flat.push({ cat: c, zh: x.zh, en: x.en, t: toks(x.en), line: L(c, x.zh) }); });
const pairs = [];
for (let i = 0; i < flat.length; i++) for (let j = i + 1; j < flat.length; j++) {
  const a = flat[i]; const b = flat[j];
  if (a.t.size < 3 || b.t.size < 3) continue;
  const s = jacc(a.t, b.t);
  if (s >= 0.5) pairs.push({ s: Math.round(s * 100) / 100, a: `${a.cat}/${a.zh}`, aLine: a.line, b: `${b.cat}/${b.zh}`, bLine: b.line, sameCat: a.cat === b.cat });
}
pairs.sort((x, y) => y.s - x.s);
result.nearDup = { thresholdJaccard: 0.5, count: pairs.length, sameCat: pairs.filter((p) => p.sameCat).length, pairs: pairs.slice(0, 60) };
// exact duplicates
const enMap = {};
flat.forEach((f) => { const k = f.en.trim().toLowerCase(); (enMap[k] = enMap[k] || []).push(`${f.cat}/${f.zh}`); });
result.exactEnDup = Object.entries(enMap).filter(([, v]) => v.length > 1).map(([k, v]) => ({ en: k.slice(0, 80), where: v }));
const zhMap = {};
for (const c of cats) W[c].forEach((x) => { if (!isNone(x)) (zhMap[x.zh] = zhMap[x.zh] || []).push(c); });
result.zhAcrossCats = Object.entries(zhMap).filter(([, v]) => v.length > 1).map(([zh, v]) => ({ zh, cats: v }));

// concept scatter
const CONCEPTS = {
  sailor: /\bsailor\b|水手/i,
  kimono_yukata: /kimono|yukata|和服|浴衣/i,
  cheongsam: /cheongsam|qipao|旗袍/i,
  bikini_swim: /bikini|swim|泳/i,
  lingerie_bra: /lingerie|\bbra\b|內衣|胸罩|bralette/i,
  corset_bustier: /corset|bustier|馬甲|束腰|束胸/i,
  latex: /latex|乳膠/i,
  maid: /\bmaid\b|女僕/i,
  bunny: /bunny|兔女郎|兔耳/i,
  garter: /garter|吊帶襪|吊襪/i,
  denim: /denim|jeans|牛仔/i,
  leather: /leather|皮革/i,
  blazer_suit: /blazer|suit jacket|西裝/i,
  hoodie: /hoodie|帽t|帽T/i,
  pasties: /pasties|胸貼/i,
};
const scatter = {};
for (const [k, re] of Object.entries(CONCEPTS)) {
  const byCat = {};
  for (const c of cats) for (const x of W[c]) {
    if (isNone(x)) continue;
    if (re.test(x.zh) || re.test(x.en)) byCat[c] = (byCat[c] || 0) + 1;
  }
  scatter[k] = { nCats: Object.keys(byCat).length, byCat };
}
result.conceptScatter = scatter;

// ---------- 6. zh -> en term consistency ----------
const TERM = [
  ['蕾絲', /lace/i], ['皮革', /leather/i], ['牛仔', /denim|jean/i], ['緞面', /satin/i], ['絲質', /silk/i], ['絲綢', /silk/i],
  ['針織', /knit/i], ['網紗', /mesh|tulle|net/i], ['透紗', /sheer|translucent|tulle|chiffon|organza|mesh/i], ['透膚', /sheer|translucent|see-through|mesh/i],
  ['亮片', /sequin|paillette/i], ['絲絨', /velvet/i], ['乳膠', /latex/i], ['百褶', /pleat/i], ['荷葉', /ruffle|flounce/i],
  ['高腰', /high-waist|high-rise|high waist|high rise/i], ['低腰', /low-rise|low-waist|low rise|low waist/i],
  ['格紋', /plaid|check|tartan|gingham|houndstooth/i], ['條紋', /stripe/i], ['豹紋', /leopard/i], ['波點', /polka|dot/i],
  ['細肩帶', /spaghetti|thin strap|camisole|slip/i], ['平口', /strapless|tube|bandeau/i], ['一字領', /off-shoulder|off the shoulder|bardot/i],
  ['掛脖', /halter/i], ['高領', /turtleneck|high-neck|high neck|mock[- ]neck|high collar|stand collar|high-collar/i],
  ['和服', /kimono/i], ['浴衣', /yukata/i], ['旗袍', /cheongsam|qipao/i], ['比基尼', /bikini/i], ['馬甲', /corset|bustier|vest|waistcoat|cincher/i],
  ['吊帶襪', /garter|suspender/i], ['漁網', /fishnet/i], ['涼鞋', /sandal/i], ['高跟', /heel|stiletto|pump/i], ['球鞋', /sneaker|trainer/i],
  ['樂福', /loafer/i], ['瑪莉珍', /mary jane/i], ['西裝', /suit|blazer|tailored/i], ['工裝', /cargo|utility|workwear|work/i],
  ['刺繡', /embroider/i], ['雪紡', /chiffon/i], ['亞麻', /linen/i], ['棉質', /cotton/i], ['羊毛', /wool/i], ['皮草', /fur/i],
  ['羽絨', /down|puffer/i], ['迷彩', /camo/i], ['碎花', /floral|flower|ditsy/i], ['花卉', /floral|flower|botanical/i],
  ['珍珠', /pearl/i], ['短版', /crop|short|mini|bolero/i], ['長版', /long|maxi|longline/i], ['靴', /boot/i], ['鏈', /chain/i], ['鍊', /chain|necklace|lariat|pendant/i],
  ['金色', /gold/i], ['銀色', /silver/i], ['黑色', /black/i], ['白色', /white|ivory/i], ['紅色', /red/i], ['粉', /pink|rose|blush/i],
];
const termMismatch = [];
for (const c of cats) for (const x of W[c]) {
  if (isNone(x)) continue;
  for (const [zh, re] of TERM) {
    if (x.zh.includes(zh) && !re.test(x.en)) termMismatch.push({ cat: c, zh: x.zh, term: zh, line: L(c, x.zh) });
  }
}
result.zhEnTermMismatch = termMismatch;
// zh name not reflected in desc (name keyword) - desc vs en term check
const descMismatch = [];
for (const c of cats) for (const x of W[c]) {
  if (isNone(x)) continue;
  for (const [zh, re] of TERM) {
    // en strongly says term but desc and zh both lack it
    if (['金色', '銀色', '黑色', '白色', '紅色', '粉', '短版', '長版', '鏈', '鍊', '靴', '高跟'].includes(zh)) continue;
    if (re.test(x.en) && !x.zh.includes(zh) && !x.desc.includes(zh)) {
      // only report material-type terms that appear as hard nouns
    }
  }
}

// ---------- 7. metadata coverage ----------
const metaCov = {};
for (const c of cats) {
  const f = {};
  for (const x of W[c]) for (const k of Object.keys(x)) if (!['zh', 'en', 'desc'].includes(k)) f[k] = (f[k] || 0) + 1;
  metaCov[c] = f;
}
result.fieldCoverage = metaCov;
const wim = itemMeta.Wardrobe || {};
result.itemMetadataWardrobe = Object.fromEntries(Object.entries(wim).map(([c, items]) => {
  const keys = {};
  Object.values(items).forEach((v) => Object.keys(v).forEach((k) => { keys[k] = (keys[k] || 0) + 1; }));
  return [c, { items: Object.keys(items).length, keys }];
}));
result.itemMetadataTopLevelDbs = Object.keys(itemMeta);
// legacy burden
let legacyIds = 0; let aliases = 0; let aliasChars = 0; let legacyLabels = 0; let enChars = 0;
for (const c of cats) for (const x of W[c]) {
  enChars += x.en.length;
  legacyIds += (x.legacyIds || []).length;
  legacyLabels += (x.legacyLabels || []).length;
  const al = x.legacyPromptAliases || [];
  aliases += al.length;
  aliasChars += al.reduce((a, s) => a + (typeof s === 'string' ? s.length : JSON.stringify(s).length), 0);
}
const wimStr = JSON.stringify(wim);
const legacyInMeta = JSON.stringify(Object.values(wim).flatMap((items) => Object.values(items).map((v) => ({ a: v.legacyPromptAliases, i: v.legacyIds, l: v.legacyLabels }))));
result.legacy = { legacyIds, legacyLabels, legacyPromptAliases: aliases, aliasChars, enChars, aliasToEnRatio: Math.round((aliasChars / enChars) * 1000) / 10, itemMetaWardrobeBytes: wimStr.length, legacyBytesInItemMeta: legacyInMeta.length };
// item with most aliases
const aliasTop = [];
for (const c of cats) for (const x of W[c]) if (x.legacyPromptAliases) aliasTop.push({ cat: c, zh: x.zh, n: x.legacyPromptAliases.length });
result.legacy.aliasTop = aliasTop.sort((a, b) => b.n - a.n).slice(0, 8);

// stableId vs computed id anomalies
result.stableIds = [];
for (const c of cats) W[c].forEach((x, i) => { if (x.stableId) result.stableIds.push({ cat: c, zh: x.zh, stableId: x.stableId, index: i }); });

// manifest
const man = manifest.categories;
result.manifest = Object.fromEntries(Object.entries(man).map(([c, v]) => {
  const names = new Set(v.items.map((e) => e.name));
  const dbNames = new Set(W[c].filter((x) => !isNone(x)).map((x) => x.zh));
  const missing = [...dbNames].filter((n) => !names.has(n));
  const orphan = [...names].filter((n) => !dbNames.has(n));
  // check files
  const srcDir = path.join(REPO, 'source-assets/wardrobe', v.directory);
  const prevDir = path.join(REPO, 'webapp/public/reference/wardrobe', v.directory);
  const missSrc = v.items.filter((e) => !fs.existsSync(path.join(srcDir, e.source))).length;
  const missPrev = v.items.filter((e) => !fs.existsSync(path.join(prevDir, e.preview))).length;
  // filename vs name drift: share of name chars in filename stem
  const drift = v.items.map((e) => {
    const stem = e.source.replace(/^\d+_/, '').replace(/\.[a-z]+$/i, '');
    const nameChars = new Set([...e.name]);
    const common = [...stem].filter((ch) => nameChars.has(ch)).length;
    return { id: e.id, name: e.name, source: e.source, ratio: Math.round((common / [...stem].length) * 100) / 100 };
  }).filter((d) => d.ratio < 0.6);
  return [c, { manifestItems: v.items.length, dbNonNone: dbNames.size, missingInManifest: missing, orphanInManifest: orphan, missingSourceFiles: missSrc, missingPreviewFiles: missPrev, filenameDriftLow: drift }];
}));
result.categoriesWithoutReferenceImages = cats.filter((c) => !man[c]);

// preset metadata
const pm = Object.entries(presetMeta);
result.presetMeta = {
  entries: pm.length,
  empty: pm.filter(([, v]) => Object.keys(v).length === 0).length,
  withSeries: pm.filter(([, v]) => v.series).length,
  embeddedOuterwear: pm.filter(([, v]) => v.embeddedOuterwear).map(([k]) => k),
  colorModes: pm.reduce((a, [, v]) => { if (v.colorMode) a[v.colorMode] = (a[v.colorMode] || 0) + 1; return a; }, {}),
};
// presets whose en mentions outerwear keywords but not flagged embeddedOuterwear (diagnostic only)
const OUTER_RE = /\b(blazer|jacket|coat|cardigan|robe|cape|haori|shawl|bolero|gilet|lab coat|trench)\b/i;
result.presetOuterwearKeywordNotFlagged = W['套裝 (Outfit Presets)'].filter((x) => OUTER_RE.test(x.en) && !(presetMeta[x.zh] || {}).embeddedOuterwear).map((x) => ({ zh: x.zh, kw: x.en.match(OUTER_RE)[0], line: L('套裝 (Outfit Presets)', x.zh) }));

// ---------- 8. MJ short-name table coverage ----------
const mjKeys = [...mjSrc.matchAll(/"(wardrobe:[^"]+)":\s*"([^"]*)"/g)].map((m) => ({ id: m[1], name: m[2] }));
result.mjTable = { entries: mjKeys.length };
const mjColor = mjKeys.filter((k) => LEX.color.test(k.name));
result.mjTable.namesWithColor = mjColor;
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'mj_keys.json'), JSON.stringify(mjKeys, null, 1));

// ---------- 9. heuristic style distribution ----------
const STYLE = {
  lingerie_boudoir: /lingerie|\bbra\b|bralette|thong|g-string|garter|babydoll|negligee|pasties|sleepwear|teddy|boudoir|panties|briefs/i,
  fetish_latex_bondage: /latex|bondage|bdsm|harness|vinyl|pvc|o-ring|collar with/i,
  swimwear: /bikini|swim|one-piece swimsuit|monokini/i,
  uniform_cosplay: /uniform|nurse|\bmaid\b|sailor|police|flight attendant|stewardess|bunny|cheerleader|school|waitress|doctor|secretary|cosplay|idol stage|racing|qipao waitress/i,
  traditional_asian: /kimono|yukata|cheongsam|qipao|hanbok|hanfu|ao dai|haori|obi/i,
  formal_office: /blazer|suit|tailored|pencil skirt|trousers|gown|evening|office|formal/i,
  street_casual: /t-shirt|\btee\b|hoodie|jeans|denim|sneaker|streetwear|cargo|oversized|sweatshirt|casual/i,
  sport_athleisure: /sport|athletic|jersey|track|yoga|tennis|running|gym|bike shorts|leggings|athleisure/i,
  gothic_punk_lolita: /gothic|goth\b|lolita|punk|victorian|studded|grunge|rock/i,
  y2k_vintage: /y2k|vintage|retro|70s|80s|90s|1970|1980|1990/i,
};
const EXPOSURE = {
  high: /bikini|thong|g-string|pasties|lingerie|\bbra\b|bralette|latex|see-through|fishnet|garter|bondage|harness|micro|nipple|bare|naked|nude|lace cups|briefs|panties|sheer/i,
  medium: /crop|cropped|\bmini\b|micro|low-rise|backless|open-back|off-shoulder|strapless|halter|deep-v|deep v|plunging|slit|bodycon|corset|bustier|camisole|spaghetti|tube top|cut-out|cutout|short shorts|hot pants/i,
};
const SEASON = {
  cold: /wool|knit|coat|puffer|down jacket|fur|fleece|turtleneck|cable|tweed|cashmere|thermal|parka|scarf|mohair|shearling|quilted|beanie|knee-high boots|over-the-knee boots/i,
  warm: /linen|bikini|swim|sandal|shorts|tank|camisole|sleeveless|straw|chiffon|flip-flop|slide|cropped|crop|halter|strapless|tube/i,
};
const GARMENT_CATS = ['特殊穿搭 (Special Outfits)', '套裝 (Outfit Presets)', '連身 (Dresses)', '上身 (Tops)', '褲裝 (Pants)', '裙裝 (Skirts)', '外套 (Outerwear)', '鞋款 (Shoes)', '襪類 (Legwear)'];
const dist = {};
const distTotals = {};
for (const c of GARMENT_CATS) {
  const items = W[c].filter((x) => !isNone(x));
  const row = { n: items.length, style: {}, exposure: { high: 0, medium: 0, low: 0 }, season: { cold: 0, warm: 0, both: 0, neutral: 0 }, styleNone: 0 };
  for (const x of items) {
    const h = `${x.zh} ${x.en}`;
    let any = false;
    for (const [k, re] of Object.entries(STYLE)) if (re.test(h)) { row.style[k] = (row.style[k] || 0) + 1; distTotals[k] = (distTotals[k] || 0) + 1; any = true; }
    if (!any) row.styleNone++;
    if (EXPOSURE.high.test(h)) row.exposure.high++; else if (EXPOSURE.medium.test(h)) row.exposure.medium++; else row.exposure.low++;
    const co = SEASON.cold.test(h); const wa = SEASON.warm.test(h);
    if (co && wa) row.season.both++; else if (co) row.season.cold++; else if (wa) row.season.warm++; else row.season.neutral++;
  }
  dist[c] = row;
}
result.heuristicDistribution = { note: '關鍵字啟發式，可多標籤；非資料內建欄位', byCat: dist, styleTotals: distTotals };
// region signal
const REGION = {
  japanese: /japanese|harajuku|kimono|yukata|sailor|jk|gyaru|日系|和風/i,
  korean: /korean|k-pop|kpop|hanbok|韓系/i,
  chinese: /chinese|cheongsam|qipao|hanfu|旗袍|中式/i,
  western_named: /parisian|french|american|western|british|victorian|y2k|cowboy|western/i,
};
const reg = {};
for (const c of GARMENT_CATS) for (const x of W[c]) {
  if (isNone(x)) continue;
  const h = `${x.zh} ${x.en} ${x.desc}`;
  for (const [k, re] of Object.entries(REGION)) if (re.test(h)) reg[k] = (reg[k] || 0) + 1;
}
result.regionSignal = reg;

// special outfit internal style tone words (first segment after complete outfit:)
const soHeads = W['特殊穿搭 (Special Outfits)'].filter((x) => !isNone(x)).map((x) => (x.en.replace('complete outfit:', '').split('.')[0] || '').trim());
const headTok = {};
soHeads.forEach((h) => words(h.toLowerCase()).forEach((w) => { if (!STOP.has(w)) headTok[w] = (headTok[w] || 0) + 1; }));
result.specialHeadTerms = Object.entries(headTok).sort((a, b) => b[1] - a[1]).slice(0, 30);
// special outfit tail cliche ("coordinated ... styling")
const tail = W['特殊穿搭 (Special Outfits)'].filter((x) => !isNone(x)).map((x) => x.en);
result.specialTail = {
  coordinated: tail.filter((e) => /coordinated[^.]*styling\.?\s*$/i.test(e)).length,
  editorial: tail.filter((e) => /editorial/i.test(e)).length,
  n: tail.length,
};

const out = JSON.stringify(result, null, 1);
if (OUT) fs.writeFileSync(OUT, out); else process.stdout.write(out);
