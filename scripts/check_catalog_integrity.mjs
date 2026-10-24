#!/usr/bin/env node
/*
 * check_catalog_integrity.mjs — Virtual Photography Studio 目錄資料「參照完整性 + 欄位覆蓋率」唯讀檢查
 *
 * 用途
 *   以唯讀方式掃描 knowledge_base/ 的 manifest/metadata、webapp/src/data/database.json、
 *   engine.js 編譯後的 lock controls，以及程式內嵌的目錄模組，輸出：
 *     1. database.json 分區/分類條目數、欄位覆蓋率、空值、全無列
 *     2. ID 策略統計（stableId 覆蓋、位置相依 ID、slug 會吃掉字元的標籤）
 *     3. legacyIds 衝突（同一舊 ID 指向多個選項、舊 ID 與其他選項現行 ID 相撞）
 *     4. 程式中硬寫的目錄 ID 字串（wardrobe:/camera:/character:/locations:/regional:/negative:）是否懸空
 *     5. 程式中硬寫的 zh 標籤（targetZh / dressZh / x.zh === '...' / *LABELS 陣列 / getControlOptionByZh）是否懸空
 *     6. 程式中硬寫的分類名稱 '中文 (English)' 是否存在於 database.json
 *     7. 內嵌對照表：MIDJOURNEY_ITEM_NAMES、MIDJOURNEY_BODY_DESCRIPTIONS、AMBIENT_LIGHT_DESCRIPTIONS、
 *        MIDJOURNEY_CARD_ITEM_NAMES 與目錄/角色卡的一致性
 *     8. manifest（wardrobe/character reference）與實體檔案、item_metadata 目標條目是否存在
 *     9. 程式內嵌目錄模組的條目數與行數盤點
 *
 * 用法（在 repo 根目錄或任何位置皆可）
 *   node scripts/check_catalog_integrity.mjs [--repo <repo 根目錄>] [--json] [--json-out <檔案>] [--strict]
 *
 *   --repo      repo 根目錄；省略時由目前工作目錄往上尋找含 knowledge_base/ 與 webapp/ 的目錄
 *   --json      stdout 只輸出完整 JSON（預設輸出文字摘要）
 *   --json-out  另將完整 JSON 寫到指定路徑（唯一的寫入行為，僅在明確指定時發生；不會寫入 repo，除非你指定 repo 內路徑）
 *   --strict    若有未豁免 confirmed 或過期允許清單 以 exit code 1 結束，作為 CI 門檻
 *
 * 需求：Node 22+（engine.js 使用 import attributes 載入 JSON）；需先在 webapp/ 執行過 npm ci（使用 espree 解析 AST）。
 * 安全性：只讀檔、只 import 模組；不呼叫 generatePrompts、不寫 repo、不使用網路。
 */

import { controlIssues, applyAllowlist, extendedChecks } from './lib/catalogIntegrity.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// ---------- CLI ----------
const argv = process.argv.slice(2);
const argValue = (name) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
};
const wantJson = argv.includes('--json');
const strict = argv.includes('--strict');
for (let i = 0; i < argv.length; i++) {
  if (['--repo', '--json-out', '--allowlist'].includes(argv[i])) { if (!argv[++i] || argv[i].startsWith('--')) throw new Error('Missing CLI argument value'); }
  else if (!['--strict', '--json'].includes(argv[i])) throw new Error(`Unknown argument ${argv[i]}`);
}
const jsonOut = argValue('--json-out');

function findRepoRoot(start) {
  let current = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(current, 'knowledge_base')) && fs.existsSync(path.join(current, 'webapp'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const REPO = argValue('--repo') ? path.resolve(argValue('--repo')) : findRepoRoot(process.cwd());
if (!REPO || !fs.existsSync(path.join(REPO, 'webapp', 'src', 'data', 'database.json'))) {
  console.error('找不到 repo 根目錄；請用 --repo 指定 Virtual_Photography_Studio 路徑');
  process.exit(2);
}
const P = (...parts) => path.join(REPO, ...parts);
const rel = (file) => path.relative(REPO, file);
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const importRepo = (...parts) => import(pathToFileURL(P(...parts)).href);
const requireFromWebapp = createRequire(P('webapp', 'package.json'));
const espree = requireFromWebapp('espree');

// ---------- engine-compatible helpers (copied from engine.js; keep in sync) ----------
const stripMarkdown = (text = '') => String(text).replace(/[`*]/g, '').replace(/\s+/g, ' ').trim();
const slugify = (text = '') => stripMarkdown(text).toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-').replace(/^-+|-+$/g, '');
const GROUP_PREFIX = { Regional: 'regional', Wardrobe: 'wardrobe', CameraLighting: 'camera', Locations: 'locations', Character: 'character', Negative: 'negative' };
const NONE_LABELS = new Set(['全無', '無額外表情']);
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);

const report = {
  generatedAt: new Date().toISOString(),
  repo: REPO,
  confirmedIssues: [],
  possibleIssues: [],
  sections: {},
};
const confirmed = (code, message, evidence = []) => {
  for (const item of evidence.length ? evidence : [message]) report.confirmedIssues.push({ code, itemKey: String(item), message, evidence: [item] });
};
const possible = (code, message, evidence = []) => report.possibleIssues.push({ code, message, evidence });

// ---------- 1. database.json 結構與欄位覆蓋 ----------
const databasePath = P('webapp', 'src', 'data', 'database.json');
const database = readJson(databasePath);
const fieldCounts = {};
const groups = {};
const zhByCategory = new Map(); // `${group}|${category}` -> Set(zh)
const allRawZh = new Set();
const enIndex = new Map();
let totalItems = 0;
let noneRows = 0;
let emptyEnNonNone = 0;
let emptyDescNonNone = 0;
const slugLossLabels = [];
const crossCategoryZh = new Map();

for (const [group, categories] of Object.entries(database)) {
  groups[group] = { categories: {}, items: 0 };
  for (const [category, items] of Object.entries(categories)) {
    groups[group].categories[category] = items.length;
    groups[group].items += items.length;
    const zhSet = new Set();
    items.forEach((item, index) => {
      totalItems += 1;
      for (const key of Object.keys(item)) fieldCounts[key] = (fieldCounts[key] || 0) + 1;
      const zh = stripMarkdown(item.zh);
      zhSet.add(zh);
      allRawZh.add(zh);
      if (!crossCategoryZh.has(zh)) crossCategoryZh.set(zh, []);
      crossCategoryZh.get(zh).push(`${group}/${category}`);
      const isNone = NONE_LABELS.has(zh);
      if (isNone) noneRows += 1;
      if (!isNone && !stripMarkdown(item.en)) emptyEnNonNone += 1;
      if (!isNone && !stripMarkdown(item.desc)) emptyDescNonNone += 1;
      const en = stripMarkdown(item.en);
      if (en && !isNone) {
        if (!enIndex.has(en)) enIndex.set(en, []);
        enIndex.get(en).push(`${group}/${category}/${zh}#${index}`);
      }
      const dropped = zh.replace(/[a-zA-Z0-9一-鿿]/g, '').match(/\p{L}/gu);
      if (dropped) slugLossLabels.push({ where: `${group}/${category}`, zh, droppedLetters: [...new Set(dropped)].join('') });
    });
    zhByCategory.set(`${group}|${category}`, zhSet);
  }
}
const duplicateEn = [...enIndex.entries()].filter(([, refs]) => refs.length > 1).map(([en, refs]) => ({ en: en.slice(0, 80), refs }));
const crossDupZh = [...crossCategoryZh.entries()].filter(([zh, refs]) => refs.length > 1 && !NONE_LABELS.has(zh)).map(([zh, refs]) => ({ zh, refs }));

report.sections.catalog = {
  databaseBytes: fs.statSync(databasePath).size,
  totalItems,
  noneRows,
  groups,
  fieldCoverage: Object.fromEntries(Object.entries(fieldCounts).sort((a, b) => b[1] - a[1]).map(([key, count]) => [key, { count, percent: pct(count, totalItems) }])),
  emptyEnNonNone,
  emptyDescNonNone,
  duplicateEnTexts: duplicateEn,
  crossCategoryDuplicateZh: crossDupZh,
  slugLossLabels,
};
if (emptyEnNonNone) possible('EMPTY_EN', `${emptyEnNonNone} 條非「全無」條目 en 為空`);
if (duplicateEn.length) possible('DUPLICATE_EN', `${duplicateEn.length} 組不同條目共用完全相同的 en 文字`, duplicateEn.map((d) => d.refs.join(' = ')));
if (slugLossLabels.length) possible('SLUG_DROPS_LETTERS', `${slugLossLabels.length} 個 zh 標籤含 slugify 會丟棄的文字（假名/全形英數等），ID 只靠 index 區分`, slugLossLabels.map((s) => `${s.where}: ${s.zh} (丟棄 ${s.droppedLetters})`));

// ---------- 2. 編譯後 controls 與 ID 策略 ----------
const engine = await importRepo('webapp', 'src', 'lib', 'engine.js');
const controls = engine.getLockControls();
const compiledIds = new Map(); // id -> [{control, zh}]
const legacyIdOwners = new Map(); // legacyId -> Set(`${control}|${optionId}`)
const compiledZh = new Set();
let compiledOptionCount = 0;
for (const control of controls) {
  for (const option of control.options || []) {
    compiledOptionCount += 1;
    if (!compiledIds.has(option.id)) compiledIds.set(option.id, []);
    compiledIds.get(option.id).push({ control: control.key, zh: option.zh });
    if (option.zh) compiledZh.add(stripMarkdown(option.zh));
    for (const legacyId of option.legacyIds || []) {
      if (!legacyIdOwners.has(legacyId)) legacyIdOwners.set(legacyId, new Set());
      legacyIdOwners.get(legacyId).add(`${control.key}|${option.id}`);
    }
  }
}
// 同一 control 內重複的現行 ID
const duplicateIdsInControl = [];
for (const control of controls) {
  const seen = new Set();
  for (const option of control.options || []) {
    if (seen.has(option.id)) duplicateIdsInControl.push(`${control.key}: ${option.id}`);
    seen.add(option.id);
  }
}
if (duplicateIdsInControl.length) confirmed('DUPLICATE_ID_IN_CONTROL', `${duplicateIdsInControl.length} 個選項 ID 在同一 control 內重複`, duplicateIdsInControl);

// 執行期推論的 meta（tags 等）：database.json 幾乎不帶 tags，標籤由 engine.js infer*Meta 依 zh/en 關鍵字推論
{
  const catalogOptions = new Map();
  for (const control of controls) for (const option of control.options || []) {
    if (/^(wardrobe|camera|character|locations|regional):/.test(option.id)) catalogOptions.set(option.id, option);
  }
  const tagSet = new Set();
  const metaKeys = new Set();
  let withTags = 0;
  let tagCount = 0;
  for (const option of catalogOptions.values()) {
    const tags = option.meta?.tags || [];
    if (tags.length) withTags += 1;
    tagCount += tags.length;
    tags.forEach((t) => tagSet.add(t));
    Object.keys(option.meta || {}).forEach((k) => metaKeys.add(k));
  }
  const dbItemsWithExplicitTags = Object.values(database).flatMap((c) => Object.values(c).flat()).filter((i) => Array.isArray(i.meta?.tags) && i.meta.tags.length).length;
  report.sections.runtimeMeta = {
    catalogOptionsInControls: catalogOptions.size,
    optionsWithTags: withTags,
    totalTags: tagCount,
    distinctTags: tagSet.size,
    distinctRuntimeMetaKeys: [...metaKeys].sort(),
    dbItemsWithExplicitTags,
  };
  if (dbItemsWithExplicitTags === 0 && withTags > 0) possible('TAGS_INFERRED_FROM_TEXT', `${withTags} 個目錄選項的 ${tagCount} 個 tags（${tagSet.size} 種）全部由 engine.js 依 zh/en 文字推論；database.json 沒有任何顯式 tags，改寫 en 可能靜默改變相容性過濾`);
}

// 同一 control 內：一個 legacyId 對到多個選項 / legacyId 等於另一選項現行 ID
const legacyConflicts = [];
const legacyShadows = [];
for (const control of controls) {
  const options = control.options || [];
  const currentIds = new Set(options.map((o) => o.id));
  const owners = new Map();
  for (const option of options) {
    for (const legacyId of option.legacyIds || []) {
      if (legacyId === option.id) continue;
      if (!owners.has(legacyId)) owners.set(legacyId, new Set());
      owners.get(legacyId).add(option.id);
      if (currentIds.has(legacyId)) legacyShadows.push({ control: control.key, legacyId, owner: option.id });
    }
  }
  for (const [legacyId, ownerSet] of owners) {
    if (ownerSet.size > 1) legacyConflicts.push({ control: control.key, legacyId, owners: [...ownerSet] });
  }
}
const uniqueLegacyConflicts = [...new Map(legacyConflicts.map((c) => [`${c.control}|${c.legacyId}|${[...c.owners].sort().join(',')}`, c])).values()];
const uniqueLegacyShadows = [...new Map(legacyShadows.map((c) => [`${c.legacyId}|${c.owner}`, c])).values()];
// Per-control token diagnostics are emitted by controlIssues below.
if (uniqueLegacyShadows.length) possible('LEGACY_ID_SHADOWED', `${uniqueLegacyShadows.length} 個 legacyId 與其他選項的現行 ID 相同（現行 ID 優先，legacy 永不生效）`, uniqueLegacyShadows.map((c) => `${c.control}: ${c.legacyId} (owner ${c.owner})`));

// DB 條目對應到 controls 的可達性與 ID 來源
const categoryHasControl = new Map();
let stableIdItems = 0;
let positionalIdItems = 0;
const unreachable = [];
for (const [group, categories] of Object.entries(database)) {
  const prefix = GROUP_PREFIX[group];
  for (const [category, items] of Object.entries(categories)) {
    let reached = 0;
    items.forEach((item, index) => {
      if (item.stableId) stableIdItems += 1; else positionalIdItems += 1;
      const predicted = item.stableId || `${prefix}:${slugify(category)}:${slugify(stripMarkdown(item.zh) || item.en || String(index))}:${index}`;
      let found = compiledIds.has(predicted);
      if (!found && !item.stableId) {
        const head = `${prefix}:${slugify(category)}:`;
        const tail = `:${index}`;
        found = [...compiledIds.keys()].some((id) => id.startsWith(head) && id.endsWith(tail));
      }
      if (found) reached += 1;
    });
    categoryHasControl.set(`${group}|${category}`, { items: items.length, reachedByControls: reached });
    if (reached < items.length) unreachable.push({ category: `${group}/${category}`, items: items.length, reachedByControls: reached });
  }
}
report.sections.ids = {
  compiledControls: controls.length,
  compiledOptions: compiledOptionCount,
  compiledUniqueIds: compiledIds.size,
  catalogItemsWithStableId: stableIdItems,
  catalogItemsWithPositionalId: positionalIdItems,
  positionalIdPercent: pct(positionalIdItems, totalItems),
  idFormula: '`${group}:${slugify(category)}:${slugify(displayZh)}:${rowIndex}` unless stableId',
  categoriesNotFullyReachableByControls: unreachable,
  legacyIdTotalDistinct: legacyIdOwners.size,
  legacyConflicts: uniqueLegacyConflicts,
  legacyShadows: uniqueLegacyShadows,
};

// ---------- 3. AST 掃描：硬寫 ID / zh / 分類 ----------
function walk(node, visit, parent = null) {
  if (!node || typeof node.type !== 'string') return;
  visit(node, parent);
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'loc' || key === 'range') continue;
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => c && typeof c.type === 'string' && walk(c, visit, node));
    else if (child && typeof child.type === 'string') walk(child, visit, node);
  }
}
function parseFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  return espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module', loc: true, ecmaFeatures: { jsx: true } });
}
function listJs(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listJs(full));
    else if (/\.(m?js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}
const stringValue = (node) => {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return null;
};
const propName = (node) => (node?.type === 'Identifier' ? node.name : stringValue(node));

const srcFiles = listJs(P('webapp', 'src'));
const isTest = (file) => /\.test\.|TestSupport|Fixtures?\.js$|Baseline/.test(path.basename(file));
const ID_RE = /^(wardrobe|camera|character|locations|regional|negative):[^\s]+:\d+$/;
const dbCategories = new Set(Object.values(database).flatMap((c) => Object.keys(c)));
const { ACCESSORY_CATEGORIES } = await importRepo('webapp', 'src', 'lib', 'engine', 'accessoryPolicy.js');
const runtimeCategories = new Set(Object.values(ACCESSORY_CATEGORIES || {}));
const knownZh = new Set([...allRawZh, ...compiledZh]);
const idRefs = { source: { current: 0, legacyOnly: 0, dangling: [] }, test: { current: 0, legacyOnly: 0, dangling: [] } };
const zhRefs = { checked: 0, dangling: [] };
const categoryRefs = { checked: 0, unknown: [] };
const targetZhRefs = { checked: 0, dangling: [] };
const seenIdLiteral = { source: new Set(), test: new Set() };

for (const file of srcFiles) {
  let ast;
  try { ast = parseFile(file); } catch (error) { confirmed('PARSE_FAIL', `無法解析 ${rel(file)}: ${error.message}`); continue; }
  const bucket = isTest(file) ? 'test' : 'source';
  // top-level const string map for resolving `category: SOME_CONST`
  const constStrings = new Map();
  for (const stmt of ast.body) {
    const decl = stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : stmt;
    if (decl?.type === 'VariableDeclaration') for (const d of decl.declarations) {
      const value = stringValue(d.init);
      if (d.id.type === 'Identifier' && value !== null) constStrings.set(d.id.name, value);
    }
  }
  const resolveString = (node) => stringValue(node) ?? (node?.type === 'Identifier' ? constStrings.get(node.name) ?? null : null);
  const where = (node) => `${rel(file)}:${node.loc.start.line}`;

  walk(ast, (node, parent) => {
    // 3a. 硬寫目錄 ID
    const value = stringValue(node);
    if (value !== null && ID_RE.test(value)) {
      const key = `${value}@${where(node)}`;
      if (!seenIdLiteral[bucket].has(key)) {
        seenIdLiteral[bucket].add(key);
        const base = value.replace(/:[ab]$/, '');
        if (compiledIds.has(base)) idRefs[bucket].current += 1;
        else if (legacyIdOwners.has(base)) idRefs[bucket].legacyOnly += 1;
        else idRefs[bucket].dangling.push({ id: value, at: where(node) });
      }
    }
    if (bucket === 'test') return;
    // 3b. 分類名稱 literal：'中文 (English)'
    if (value !== null && /[一-鿿]/.test(value) && /^[^()]{1,24} \([A-Z][A-Za-z0-9 &/,'.-]+\)$/.test(value)) {
      categoryRefs.checked += 1;
      if (!dbCategories.has(value) && !compiledZh.has(value) && !runtimeCategories.has(value)) categoryRefs.unknown.push({ category: value, at: where(node) });
    }
    // 3c. targetZh / dressZh（含 category 時做分類內比對）
    if (node.type === 'ObjectExpression') {
      const props = new Map(node.properties.filter((p) => p.type === 'Property').map((p) => [propName(p.key), p.value]));
      for (const key of ['targetZh', 'dressZh']) {
        if (!props.has(key)) continue;
        const zh = resolveString(props.get(key));
        if (zh === null) continue;
        targetZhRefs.checked += 1;
        const category = props.has('category') ? resolveString(props.get('category')) : null;
        let ok = knownZh.has(zh);
        if (ok && category) {
          const inCategory = [...zhByCategory.entries()].some(([k, set]) => k.endsWith(`|${category}`) && set.has(zh));
          ok = inCategory || compiledZh.has(zh);
        }
        if (!ok) targetZhRefs.dangling.push({ key, zh, category, at: where(props.get(key)) });
      }
    }
    // 3d. x.zh === '...' / x.zh !== '...'
    if (node.type === 'BinaryExpression' && ['===', '!=='].includes(node.operator)) {
      const sides = [[node.left, node.right], [node.right, node.left]];
      for (const [member, lit] of sides) {
        const zh = stringValue(lit);
        if (zh === null || member?.type !== 'MemberExpression' || propName(member.property) !== 'zh') continue;
        zhRefs.checked += 1;
        if (!knownZh.has(zh)) zhRefs.dangling.push({ zh, at: where(lit) });
      }
    }
    // 3e. getControlOptionByZh(..., 'zh') / setControlOptionByZhIfInactive(..., 'zh')
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && /ByZh/.test(node.callee.name)) {
      const zh = stringValue(node.arguments[node.arguments.length - 1]);
      if (zh !== null) {
        zhRefs.checked += 1;
        if (!knownZh.has(zh)) zhRefs.dangling.push({ zh, at: where(node), via: node.callee.name });
      }
    }
    // 3f. 名稱含 LABELS / _ZH 的常數陣列（new Set([...]) / Object.freeze([...]) / [...]）
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && /LABELS|_ZH/.test(node.id.name)) {
      let arrayNode = node.init;
      while (arrayNode && arrayNode.type !== 'ArrayExpression') {
        if (arrayNode.type === 'NewExpression' || arrayNode.type === 'CallExpression') arrayNode = arrayNode.arguments[0];
        else break;
      }
      if (arrayNode?.type === 'ArrayExpression') for (const element of arrayNode.elements) {
        const zh = stringValue(element);
        if (zh === null || !/[一-鿿]/.test(zh)) continue;
        zhRefs.checked += 1;
        if (!knownZh.has(zh)) zhRefs.dangling.push({ zh, at: where(element), via: node.id.name });
      }
    }
  });
}
report.sections.hardcodedReferences = { idLiterals: idRefs, zhComparisons: zhRefs, targetZh: targetZhRefs, categoryLiterals: categoryRefs };
if (idRefs.source.dangling.length) confirmed('DANGLING_ID_SOURCE', `正式程式碼中 ${idRefs.source.dangling.length} 個硬寫目錄 ID 在現行 ID 與 legacyIds 皆找不到`, idRefs.source.dangling.map((d) => `${d.at} ${d.id}`));
if (idRefs.test.dangling.length) possible('DANGLING_ID_TEST', `測試/fixture 中 ${idRefs.test.dangling.length} 個硬寫目錄 ID 找不到（可能是刻意的舊資料案例）`, idRefs.test.dangling.map((d) => `${d.at} ${d.id}`));
if (targetZhRefs.dangling.length) confirmed('DANGLING_TARGET_ZH', `${targetZhRefs.dangling.length} 個 targetZh/dressZh 指向不存在的條目（apply* 函式遇到會靜默 return）`, targetZhRefs.dangling.map((d) => `${d.at} [${d.category ?? '-'}] ${d.zh}`));
if (zhRefs.dangling.length) possible('DANGLING_ZH_LITERAL', `${zhRefs.dangling.length} 個 zh 比對字串在目錄/controls 找不到（可能比對的是內嵌目錄或已退役條目，需人工確認）`, zhRefs.dangling.map((d) => `${d.at} ${d.zh}${d.via ? ` (${d.via})` : ''}`));
if (categoryRefs.unknown.length) possible('UNKNOWN_CATEGORY_LITERAL', `${categoryRefs.unknown.length} 個硬寫分類名稱不在 database.json（多為舊分類名，用於 legacy/fallback）`, categoryRefs.unknown.map((d) => `${d.at} ${d.category}`));

// ---------- 4. 內嵌對照表一致性 ----------
const embeddedChecks = {};
{
  const { MIDJOURNEY_ITEM_NAMES } = await importRepo('webapp', 'src', 'lib', 'engine', 'midjourneyItemNames.js');
  const keys = Object.keys(MIDJOURNEY_ITEM_NAMES);
  const dangling = keys.filter((k) => !compiledIds.has(k));
  const wardrobeOptionIds = new Set([...compiledIds.keys()].filter((id) => id.startsWith('wardrobe:') && !/:全無:\d+$/.test(id)));
  const covered = [...wardrobeOptionIds].filter((id) => MIDJOURNEY_ITEM_NAMES[id]);
  const byCategory = {};
  for (const id of wardrobeOptionIds) {
    const cat = id.split(':')[1];
    byCategory[cat] ||= { covered: 0, total: 0 };
    byCategory[cat].total += 1;
    if (MIDJOURNEY_ITEM_NAMES[id]) byCategory[cat].covered += 1;
  }
  embeddedChecks.midjourneyItemNames = { entries: keys.length, dangling, compiledWardrobeOptionsNonNone: wardrobeOptionIds.size, coveredWardrobeOptions: covered.length, coveragePercent: pct(covered.length, wardrobeOptionIds.size), byCategory };
  if (dangling.length) confirmed('MJ_NAME_DANGLING', `MIDJOURNEY_ITEM_NAMES 有 ${dangling.length} 個 key 不是現行選項 ID（名稱不會被使用）`, dangling);
}
{
  const { MIDJOURNEY_BODY_DESCRIPTIONS } = await importRepo('webapp', 'src', 'lib', 'engine', 'midjourneyBodyDescriptions.js');
  const keys = Object.keys(MIDJOURNEY_BODY_DESCRIPTIONS);
  const dangling = keys.filter((k) => !compiledIds.has(k));
  embeddedChecks.midjourneyBodyDescriptions = { entries: keys.length, dangling };
  if (dangling.length) confirmed('MJ_BODY_DANGLING', `MIDJOURNEY_BODY_DESCRIPTIONS 有 ${dangling.length} 個 key 不是現行 ID`, dangling);
}
{
  const { AMBIENT_LIGHT_DESCRIPTIONS } = await importRepo('webapp', 'src', 'lib', 'engine', 'ambientLightDescriptions.js');
  const lighting = controls.find((c) => c.key === 'lightingId')?.options || [];
  const byId = new Map(lighting.map((o) => [o.id, o]));
  const rows = Object.values(AMBIENT_LIGHT_DESCRIPTIONS);
  const result = { entries: rows.length, exactMatch: 0, missingId: [], zhDrift: [], enDrift: [], catalogLightingWithoutDescription: [] };
  for (const row of rows) {
    const option = byId.get(row.id);
    if (!option) { result.missingId.push(row.id); continue; }
    if (option.zh !== row.zh) result.zhDrift.push(row.id);
    else if (option.en !== row.source) result.enDrift.push(row.id);
    else result.exactMatch += 1;
  }
  result.catalogLightingWithoutDescription = lighting.filter((o) => !NONE_LABELS.has(o.zh) && o.id !== 'random' && !AMBIENT_LIGHT_DESCRIPTIONS[o.id]).map((o) => o.id);
  embeddedChecks.ambientLightDescriptions = result;
  const drift = result.missingId.length + result.zhDrift.length + result.enDrift.length;
  if (drift) confirmed('AMBIENT_DESC_DRIFT', `AMBIENT_LIGHT_DESCRIPTIONS 有 ${drift} 筆與目錄 id/zh/en 不一致，resolveAmbientLightDescription 會靜默回傳 null`, [...result.missingId, ...result.zhDrift, ...result.enDrift]);
}
let characterProfiles = [];
{
  const { CHARACTER_PROFILE_OPTIONS } = await importRepo('webapp', 'src', 'lib', 'engine', 'characterProfiles.js');
  const { MIDJOURNEY_CARD_ITEM_NAMES } = await importRepo('webapp', 'src', 'lib', 'engine', 'midjourneyCardItemNames.js');
  characterProfiles = CHARACTER_PROFILE_OPTIONS;
  const profileIds = new Set(CHARACTER_PROFILE_OPTIONS.map((p) => p.id));
  const cardKeys = Object.keys(MIDJOURNEY_CARD_ITEM_NAMES);
  const realProfiles = CHARACTER_PROFILE_OPTIONS.filter((p) => p.id !== 'none');
  const manifest = readJson(P('knowledge_base', 'character_reference_manifest.json'));
  const manifestIds = new Set(manifest.items.map((i) => i.id));
  const missingImages = realProfiles.filter((p) => p.meta?.referenceImage && !fs.existsSync(P('webapp', 'public', p.meta.referenceImage))).map((p) => `${p.id}: ${p.meta.referenceImage}`);
  const manifestFileProblems = [];
  for (const item of manifest.items) {
    if (!fs.existsSync(P('source-assets', 'character-cards', item.directory, item.source))) manifestFileProblems.push(`source missing: ${item.directory}/${item.source}`);
    if (!fs.existsSync(P('webapp', 'public', 'character-cards', item.directory, item.preview))) manifestFileProblems.push(`preview missing: ${item.directory}/${item.preview}`);
  }
  const profileImageNotInManifest = realProfiles.filter((p) => {
    const img = p.meta?.referenceImage || '';
    return !manifest.items.some((i) => img === `character-cards/${i.directory}/${i.preview}`);
  }).map((p) => p.id);
  // characterCardLab.js 的 wardrobeLayers 是否逐字複製 characterProfiles.js 的文字
  const labAst = parseFile(P('webapp', 'src', 'lib', 'characterCardLab.js'));
  const profileText = realProfiles.map((p) => [p.en, p.profile?.outfit, p.profile?.accessories].filter(Boolean).join(' || ')).join(' || ');
  let layerStrings = 0;
  const notVerbatim = [];
  walk(labAst, (node) => {
    if (node.type !== 'Property' || propName(node.key) !== 'wardrobeLayers' || node.value.type !== 'ObjectExpression') return;
    for (const prop of node.value.properties) {
      const text = stringValue(prop.value);
      if (text === null) continue;
      layerStrings += 1;
      if (!profileText.includes(text)) notVerbatim.push(`characterCardLab.js:${prop.loc.start.line} ${propName(prop.key)}`);
    }
  });
  embeddedChecks.characterCards = {
    labWardrobeLayerStrings: layerStrings,
    labWardrobeLayersVerbatimInProfiles: layerStrings - notVerbatim.length,
    labWardrobeLayersNotVerbatim: notVerbatim,
    profiles: realProfiles.length,
    mjCardNameEntries: cardKeys.length,
    mjCardNamesDangling: cardKeys.filter((k) => !profileIds.has(k)),
    profilesWithoutMjCardNames: realProfiles.filter((p) => !MIDJOURNEY_CARD_ITEM_NAMES[p.id]).map((p) => p.id),
    manifestItems: manifest.items.length,
    profilesNotInManifestById: realProfiles.filter((p) => !manifestIds.has(p.id)).map((p) => p.id),
    manifestIdsWithoutProfile: [...manifestIds].filter((id) => !profileIds.has(id)),
    profileImageNotInManifest,
    missingProfileImages: missingImages,
    manifestFileProblems,
  };
  const cc = embeddedChecks.characterCards;
  if (layerStrings) possible('CARD_LAYER_DUPLICATION', `characterCardLab.js 的 ${layerStrings} 段 wardrobeLayers 文字中 ${layerStrings - notVerbatim.length} 段與 characterProfiles.js 逐字重複；其餘 ${notVerbatim.length} 段不一致（改寫或漂移，需人工判斷）`, notVerbatim);
  if (cc.mjCardNamesDangling.length) confirmed('MJ_CARD_DANGLING', 'MIDJOURNEY_CARD_ITEM_NAMES 有不存在的角色卡 ID', cc.mjCardNamesDangling);
  if (cc.profilesWithoutMjCardNames.length) possible('MJ_CARD_MISSING', `${cc.profilesWithoutMjCardNames.length} 張角色卡沒有 MJ 名稱表`, cc.profilesWithoutMjCardNames);
  if (missingImages.length || manifestFileProblems.length) confirmed('CHARACTER_IMAGE_MISSING', '角色卡參考圖檔缺漏', [...missingImages, ...manifestFileProblems]);
  if (cc.profilesNotInManifestById.length || cc.manifestIdsWithoutProfile.length || profileImageNotInManifest.length) possible('CHARACTER_MANIFEST_MISMATCH', '角色卡 profile 與 character_reference_manifest 不完全對應（manifest 只由圖片腳本使用，未與 profile 交叉驗證）', [...cc.profilesNotInManifestById.map((x) => `profile 無 manifest: ${x}`), ...cc.manifestIdsWithoutProfile.map((x) => `manifest 無 profile: ${x}`), ...profileImageNotInManifest.map((x) => `profile 圖片路徑不在 manifest: ${x}`)]);
}
report.sections.embeddedMaps = embeddedChecks;

// ---------- 5. knowledge_base manifests / metadata ----------
{
  const manifest = readJson(P('knowledge_base', 'wardrobe_reference_manifest.json'));
  const fileProblems = [];
  let entries = 0;
  const idSet = new Set();
  const dupIds = [];
  for (const [category, cat] of Object.entries(manifest.categories || {})) {
    const zhSet = zhByCategory.get(`Wardrobe|${category}`) || new Set();
    for (const item of cat.items) {
      entries += 1;
      if (idSet.has(item.id)) dupIds.push(item.id); idSet.add(item.id);
      if (!zhSet.has(item.name)) fileProblems.push(`name not in DB: ${category}/${item.name}`);
      if (!fs.existsSync(P('source-assets', 'wardrobe', cat.directory, item.source))) fileProblems.push(`source missing: ${cat.directory}/${item.source}`);
      if (!fs.existsSync(P('webapp', 'public', 'reference', 'wardrobe', cat.directory, item.preview))) fileProblems.push(`preview missing: ${cat.directory}/${item.preview}`);
    }
  }
  const itemMetadata = readJson(P('knowledge_base', 'item_metadata.json'));
  const metaTargetsMissing = [];
  let metaTargets = 0;
  const metaFieldCounts = {};
  const metaLegacyIdStatus = { current: 0, legacyOnlyOrSelf: 0, notCompiled: [] };
  for (const [group, categories] of Object.entries(itemMetadata)) {
    for (const [category, items] of Object.entries(categories)) {
      const zhSet = zhByCategory.get(`${group}|${category}`) || new Set();
      for (const [name, meta] of Object.entries(items)) {
        metaTargets += 1;
        if (!zhSet.has(name)) metaTargetsMissing.push(`${group}/${category}/${name}`);
        for (const key of Object.keys(meta)) metaFieldCounts[key] = (metaFieldCounts[key] || 0) + 1;
        for (const legacyId of meta.legacyIds || []) {
          if (legacyIdOwners.has(legacyId)) metaLegacyIdStatus.legacyOnlyOrSelf += 1;
          else if (compiledIds.has(legacyId)) metaLegacyIdStatus.current += 1;
          else metaLegacyIdStatus.notCompiled.push(`${group}/${category}/${name}: ${legacyId}`);
        }
      }
    }
  }
  const outfitMeta = readJson(P('knowledge_base', 'outfit_preset_metadata.json'));
  const outfitZh = zhByCategory.get('Wardrobe|套裝 (Outfit Presets)') || new Set();
  const outfitMissing = Object.keys(outfitMeta).filter((name) => !outfitZh.has(name));
  report.sections.manifests = {
    wardrobeReferenceEntries: entries, wardrobeDuplicateIds: dupIds, wardrobeProblems: fileProblems,
    itemMetadataTargets: metaTargets, itemMetadataFieldCounts: metaFieldCounts, itemMetadataTargetsMissing: metaTargetsMissing,
    itemMetadataLegacyIds: metaLegacyIdStatus,
    outfitPresetMetadataEntries: Object.keys(outfitMeta).length, outfitPresetMetadataMissing: outfitMissing,
  };
  if (fileProblems.length || dupIds.length) confirmed('WARDROBE_MANIFEST', '服裝參考圖 manifest 問題', [...fileProblems, ...dupIds]);
  if (metaTargetsMissing.length || outfitMissing.length) confirmed('METADATA_TARGET_MISSING', 'metadata 指向不存在的條目', [...metaTargetsMissing, ...outfitMissing]);
  if (metaLegacyIdStatus.notCompiled.length) possible('META_LEGACY_ID_NOT_IN_CONTROLS', `${metaLegacyIdStatus.notCompiled.length} 個 item_metadata legacyIds 未出現在任何 control 的 legacyIds（可能該分類不屬 lock control，或已失效）`, metaLegacyIdStatus.notCompiled);
}

// ---------- 6. 內嵌目錄盤點 ----------
function countLines(file) { return fs.readFileSync(file, 'utf8').split('\n').length; }
function exportedShapes(mod) {
  const out = {};
  for (const [name, value] of Object.entries(mod)) {
    if (Array.isArray(value)) out[name] = value.length;
    else if (value && typeof value === 'object') out[name] = Object.keys(value).length;
  }
  return out;
}
const embeddedModules = [
  ['webapp/src/lib/engine/characterProfiles.js'],
  ['webapp/src/lib/engine/poseComposerOptions.js'],
  ['webapp/src/lib/engine/duoOptions.js'],
  ['webapp/src/lib/engine/fixedCompositionOptions.js'],
  ['webapp/src/lib/engine/ambientLightDescriptions.js'],
  ['webapp/src/lib/engine/midjourneyItemNames.js'],
  ['webapp/src/lib/engine/midjourneyCardItemNames.js'],
  ['webapp/src/lib/engine/midjourneyBodyDescriptions.js'],
  ['webapp/src/data/actionPoseCards.js'],
  ['webapp/src/data/observationCapturePromptOptions.js'],
  ['webapp/src/data/page3WorldScenes.js'],
];
const inventory = [];
for (const [file] of embeddedModules) {
  const full = P(file);
  if (!fs.existsSync(full)) { inventory.push({ file, missing: true }); continue; }
  const mod = await import(pathToFileURL(full).href);
  const shapes = exportedShapes(mod);
  inventory.push({ file, lines: countLines(full), exports: shapes, entries: Object.values(shapes).reduce((a, b) => a + b, 0) });
}
// engine.js 頂層資料表（陣列/物件/Map/Set 常數）
const engineAst = parseFile(P('webapp', 'src', 'lib', 'engine.js'));
const engineTables = [];
for (const stmt of engineAst.body) {
  const decl = stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : stmt;
  if (decl?.type !== 'VariableDeclaration') continue;
  for (const d of decl.declarations) {
    let init = d.init;
    while (init && (init.type === 'CallExpression' || init.type === 'NewExpression') && init.arguments?.[0] && ['ArrayExpression', 'ObjectExpression', 'CallExpression', 'NewExpression'].includes(init.arguments[0].type)) init = init.arguments[0];
    while (init && init.type === 'CallExpression' && init.callee.type === 'MemberExpression' && init.callee.object.type === 'ArrayExpression') init = init.callee.object; // [..].map(...)
    if (!init || !['ArrayExpression', 'ObjectExpression'].includes(init.type)) continue;
    const size = init.type === 'ArrayExpression' ? init.elements.length : init.properties.length;
    const lines = d.loc.end.line - d.loc.start.line + 1;
    if (lines >= 5) engineTables.push({ name: d.id.name, line: d.loc.start.line, lines, entries: size, legacy: /LEGACY|MIGRATION/.test(d.id.name) });
  }
}
engineTables.sort((a, b) => b.lines - a.lines);
const engineLines = countLines(P('webapp', 'src', 'lib', 'engine.js'));
// item_metadata 欄位白名單：buildEntries 實際讀取的 item.<key>；未被讀取的 key 會被靜默丟棄
const consumedItemKeys = new Set();
walk(engineAst, (node) => {
  if (node.type !== 'FunctionDeclaration' || node.id?.name !== 'buildEntries') return;
  walk(node.body, (inner) => {
    if (inner.type === 'MemberExpression' && inner.object.type === 'Identifier' && inner.object.name === 'item' && !inner.computed) consumedItemKeys.add(inner.property.name);
  });
});
{
  const itemMetadata = readJson(P('knowledge_base', 'item_metadata.json'));
  const metaKeys = new Set();
  for (const categories of Object.values(itemMetadata)) for (const items of Object.values(categories)) for (const meta of Object.values(items)) Object.keys(meta).forEach((k) => metaKeys.add(k));
  const ignored = [...metaKeys].filter((k) => !consumedItemKeys.has(k));
  report.sections.itemMetadataWhitelist = { buildEntriesConsumedKeys: [...consumedItemKeys].sort(), itemMetadataKeys: [...metaKeys].sort(), ignoredKeys: ignored };
  if (ignored.length) confirmed('META_KEY_IGNORED', `item_metadata.json 有 ${ignored.length} 種欄位不被 buildEntries 讀取（會被靜默丟棄）`, ignored);
}
// 內嵌選項的 deprecated / uiHidden / legacyIds 負擔
const deprecation = [];
for (const [file] of embeddedModules) {
  const full = P(file);
  if (!fs.existsSync(full)) continue;
  const mod = await import(pathToFileURL(full).href);
  for (const [name, value] of Object.entries(mod)) {
    if (!Array.isArray(value) || !value.some((o) => o && typeof o === 'object' && 'id' in o)) continue;
    const deprecated = value.filter((o) => o?.deprecated || o?.meta?.deprecated).length;
    const uiHidden = value.filter((o) => o?.uiHidden || o?.meta?.uiHidden).length;
    const withLegacyIds = value.filter((o) => Array.isArray(o?.legacyIds) && o.legacyIds.length).length;
    if (deprecated || uiHidden || withLegacyIds) deprecation.push({ file, export: name, total: value.length, deprecated, uiHidden, withLegacyIds });
  }
}
const tableLines = engineTables.reduce((a, t) => a + t.lines, 0);
const legacyTables = engineTables.filter((t) => t.legacy);
report.sections.embeddedInventory = {
  modules: inventory,
  deprecationBurden: deprecation,
  modulesTotalLines: inventory.reduce((a, m) => a + (m.lines || 0), 0),
  modulesTotalEntries: inventory.reduce((a, m) => a + (m.entries || 0), 0),
  engineJs: {
    lines: engineLines,
    topLevelDataTables: engineTables.length,
    topLevelDataTableLines: tableLines,
    dataTablePercentOfFile: pct(tableLines, engineLines),
    legacyOrMigrationTables: legacyTables.length,
    legacyOrMigrationTableLines: legacyTables.reduce((a, t) => a + t.lines, 0),
    legacyOrMigrationTableEntries: legacyTables.reduce((a, t) => a + t.entries, 0),
    largestTables: engineTables,
  },
};

// ---------- 輸出 ----------
// This checker is read-only. CI runs an external rehearsal in a separate step.
report.confirmedIssues.push(...controlIssues(controls));
report.sections.extended = await extendedChecks(REPO, controls, parseFile);
report.confirmedIssues.push(...report.sections.extended.issues);
const allowPath = argValue('--allowlist') || P('scripts', 'catalog_integrity_allowlist.json');
report.allowlist = applyAllowlist(report.confirmedIssues, readJson(allowPath));
report.summary = {
  totalItems,
  confirmedIssueCount: report.confirmedIssues.length,
  possibleIssueCount: report.possibleIssues.length,
};
if (jsonOut) fs.writeFileSync(path.resolve(jsonOut), JSON.stringify(report, null, 2) + '\n');
if (wantJson) {
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} else {
  const c = report.sections.catalog;
  const ids = report.sections.ids;
  const h = report.sections.hardcodedReferences;
  const inv = report.sections.embeddedInventory;
  const lines = [];
  lines.push(`== 目錄資料唯讀檢查  repo=${REPO}`);
  lines.push(`database.json: ${c.databaseBytes} bytes, ${c.totalItems} 條（全無列 ${c.noneRows}）, 分區 ${Object.keys(c.groups).length}, 分類 ${Object.values(c.groups).reduce((a, g) => a + Object.keys(g.categories).length, 0)}`);
  for (const [g, info] of Object.entries(c.groups)) lines.push(`  ${g}: ${info.items} 條 / ${Object.keys(info.categories).length} 分類`);
  lines.push('欄位覆蓋率: ' + Object.entries(c.fieldCoverage).map(([k, v]) => `${k}=${v.count}(${v.percent}%)`).join(', '));
  lines.push(`空 en(非全無)=${c.emptyEnNonNone}, 空 desc(非全無)=${c.emptyDescNonNone}, 重複 en 組=${c.duplicateEnTexts.length}, 跨分類同名 zh=${c.crossCategoryDuplicateZh.length}, slug 丟字標籤=${c.slugLossLabels.length}`);
  lines.push(`ID: stableId ${ids.catalogItemsWithStableId} 條, 位置相依 ${ids.catalogItemsWithPositionalId} 條 (${ids.positionalIdPercent}%); controls=${ids.compiledControls}, options=${ids.compiledOptions}, distinct legacyIds=${ids.legacyIdTotalDistinct}`);
  lines.push(`  legacy 衝突=${ids.legacyConflicts.length}, legacy 被現行 ID 遮蔽=${ids.legacyShadows.length}, 未完全由 controls 暴露的分類=${ids.categoriesNotFullyReachableByControls.map((u) => `${u.category}(${u.reachedByControls}/${u.items})`).join('; ') || '無'}`);
  lines.push(`硬寫 ID: 正式碼 current=${h.idLiterals.source.current} legacyOnly=${h.idLiterals.source.legacyOnly} dangling=${h.idLiterals.source.dangling.length}; 測試 current=${h.idLiterals.test.current} legacyOnly=${h.idLiterals.test.legacyOnly} dangling=${h.idLiterals.test.dangling.length}`);
  lines.push(`硬寫 zh: targetZh/dressZh 檢查 ${h.targetZh.checked} 懸空 ${h.targetZh.dangling.length}; zh 比對 ${h.zhComparisons.checked} 懸空 ${h.zhComparisons.dangling.length}; 分類 literal ${h.categoryLiterals.checked} 未知 ${h.categoryLiterals.unknown.length}`);
  const e = report.sections.embeddedMaps;
  lines.push(`MJ 名稱表: ${e.midjourneyItemNames.entries} 條, 懸空 ${e.midjourneyItemNames.dangling.length}, 覆蓋服裝選項 ${e.midjourneyItemNames.coveredWardrobeOptions}/${e.midjourneyItemNames.compiledWardrobeOptionsNonNone} (${e.midjourneyItemNames.coveragePercent}%)`);
  lines.push(`  MJ 名稱分類覆蓋: ${Object.entries(e.midjourneyItemNames.byCategory).map(([k, v]) => `${k} ${v.covered}/${v.total}`).join(', ')}`);
  const rm = report.sections.runtimeMeta;
  lines.push(`執行期 meta: ${rm.optionsWithTags}/${rm.catalogOptionsInControls} 目錄選項帶 tags，共 ${rm.totalTags} 個（${rm.distinctTags} 種）；database.json 顯式 tags 條目 ${rm.dbItemsWithExplicitTags}；執行期 meta 欄位 ${rm.distinctRuntimeMetaKeys.length} 種`);
  lines.push(`環境光描述: ${e.ambientLightDescriptions.entries} 條, 完全一致 ${e.ambientLightDescriptions.exactMatch}, 缺描述的環境光選項 ${e.ambientLightDescriptions.catalogLightingWithoutDescription.length}`);
  lines.push(`角色卡: ${e.characterCards.profiles} 張, MJ 卡名 ${e.characterCards.mjCardNameEntries}, manifest ${e.characterCards.manifestItems}, Lab wardrobeLayers ${e.characterCards.labWardrobeLayerStrings} 段（逐字重複 ${e.characterCards.labWardrobeLayersVerbatimInProfiles}）`);
  lines.push(`內嵌目錄模組: ${inv.modules.length} 檔 / ${inv.modulesTotalLines} 行 / ${inv.modulesTotalEntries} 個匯出條目`);
  for (const m of inv.modules) lines.push(`  ${m.file}: ${m.lines} 行, ${JSON.stringify(m.exports)}`);
  for (const d of inv.deprecationBurden) lines.push(`  退役負擔 ${d.export}: ${d.total} 條, deprecated ${d.deprecated}, uiHidden ${d.uiHidden}, 帶 legacyIds ${d.withLegacyIds}`);
  lines.push(`item_metadata 欄位白名單: ${report.sections.itemMetadataWhitelist.itemMetadataKeys.length} 種皆${report.sections.itemMetadataWhitelist.ignoredKeys.length ? '「未」' : ''}被 buildEntries 讀取（被忽略: ${report.sections.itemMetadataWhitelist.ignoredKeys.join(',') || '無'}）`);
  lines.push(`engine.js: ${inv.engineJs.lines} 行, 頂層資料表 ${inv.engineJs.topLevelDataTables} 個 / ${inv.engineJs.topLevelDataTableLines} 行 (${inv.engineJs.dataTablePercentOfFile}%), 其中 legacy/migration 表 ${inv.engineJs.legacyOrMigrationTables} 個 / ${inv.engineJs.legacyOrMigrationTableLines} 行 / ${inv.engineJs.legacyOrMigrationTableEntries} 條`);
  lines.push(`Allowlist: ${report.allowlist.allowed.length} allowed; ${report.allowlist.blocking.length} blocking; ${report.allowlist.stale.length} stale`);
  lines.push(`\n確定問題 ${report.confirmedIssues.length}:`);
  for (const issue of report.confirmedIssues) { lines.push(`  [${issue.code}] ${issue.message}`); issue.evidence.slice(0, 8).forEach((ev) => lines.push(`      - ${ev}`)); }
  lines.push(`可能問題 ${report.possibleIssues.length}:`);
  for (const issue of report.possibleIssues) { lines.push(`  [${issue.code}] ${issue.message}`); issue.evidence.slice(0, 8).forEach((ev) => lines.push(`      - ${ev}`)); }
  console.log(lines.join('\n'));
}
process.exit(strict && (report.allowlist.blocking.length || report.allowlist.stale.length) ? 1 : 0);
