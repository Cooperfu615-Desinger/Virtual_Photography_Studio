// 產生固定 seed 的 Prompt 輸出快照，用於改動前後逐字比對（神情姿態 v2 P1–P5、站姿動作庫沿用的做法）。
//
// 用法（在 webapp/ 執行；比對時兩邊各跑一次，再用 --compare）：
//   node ../scripts/dump_prompt_outputs.mjs <out.json>
//   node ../scripts/dump_prompt_outputs.mjs --compare <before.json> <after.json>
//
// 內容：
//   fx:<id>      代表性 fixture（representativePromptFixtures.js），空白欄位設為全無
//   rnd:<n>      200 組預設鎖定的隨機樣本（seed p1-dump）
//   act:<id>:<景別>:<0|1>  每個指定動作 × 每個景別 × 2 seed
//   allrandom:<n>  150 組「全部隨機」（用當時版本自己的 randomizeLockKeys 規則）
// 每筆記錄六種輸出、選擇快照與摘要。比較時只看兩邊都有的鍵，另列只在一邊的鍵。
import { readFileSync, writeFileSync } from 'node:fs';

if (process.argv[2] === '--compare') {
  const [before, after] = process.argv.slice(3).map(file => JSON.parse(readFileSync(file, 'utf8')));
  const common = Object.keys(before).filter(key => key in after);
  const changed = common.filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
  const byGroup = list => list.reduce((acc, key) => ({ ...acc, [key.split(':')[0]]: (acc[key.split(':')[0]] || 0) + 1 }), {});
  console.log(JSON.stringify({
    before: Object.keys(before).length, after: Object.keys(after).length, common: common.length,
    changed: changed.length, changedByGroup: byGroup(changed),
    onlyBefore: Object.keys(before).filter(key => !(key in after)).length,
    onlyAfter: Object.keys(after).filter(key => !(key in before)).length,
    changedSample: changed.slice(0, 10),
  }, null, 2));
  process.exit(0);
}

const root = process.cwd();
const E = await import(root + '/src/lib/engine.js');
const { REPRESENTATIVE_PROMPT_FIXTURES: FIXTURES } = await import(root + '/src/lib/engine/representativePromptFixtures.js');
const { SPECIFIED_ACTION_CONCRETE_OPTIONS: ACTIONS } = await import(root + '/src/lib/engine/specifiedActions.js');
const { randomizeLockKeys } = await import(root + '/src/lib/page1SectionRandom.js');
const C = E.getLockControls();
const opt = (key, zh) => C.find(control => control.key === key)?.options?.find(option => option.zh === zh)?.id;
const allNone = () => {
  const locks = { ...E.createEmptyLocks() };
  for (const control of C) {
    const none = control.options?.find(option => option.zh === '全無' || option.zh === '無額外表情');
    if (none) locks[control.key] = none.id;
  }
  return locks;
};
const fixtureLocks = fixture => {
  const locks = allNone();
  for (const [key, spec] of Object.entries(fixture.locks)) {
    if (typeof spec === 'string' || Array.isArray(spec)) { locks[key] = spec; continue; }
    const id = opt(key, spec.byZh);
    if (!id) return null;
    locks[key] = id;
  }
  return locks;
};
const pick = prompt => ({
  gpt: prompt.grokPrompt, z: prompt.zImagePrompt, mj: prompt.midjourneyPrompt, nano: prompt.nanoBananaPrompt,
  ...Object.fromEntries((prompt.extraPrompts || []).map(extra => ['x:' + extra.id, extra.text])),
  sel: JSON.stringify(prompt.selection), sum: JSON.stringify(prompt.summaryFields),
});

const out = {};
for (const fixture of FIXTURES) {
  const locks = fixtureLocks(fixture);
  out['fx:' + fixture.id] = locks ? pick(E.generatePrompts(1, locks, [], { random: E.createSeededRandom(fixture.seed) })[0]) : 'UNRESOLVED';
}
E.generatePrompts(200, E.createEmptyLocks(), [], { random: E.createSeededRandom('p1-dump') }).forEach((prompt, index) => { out['rnd:' + index] = pick(prompt); });
const framings = C.find(control => control.key === 'framingId').options.filter(option => option.zh !== '隨機');
for (const action of ACTIONS) for (const framing of framings) for (const seed of [0, 1]) {
  const locks = { ...E.createEmptyLocks(), subjectCount: '1', specifiedActionId: action.id, framingId: framing.id };
  out[`act:${action.id}:${framing.zh}:${seed}`] = pick(E.generatePrompts(1, locks, [], { random: E.createSeededRandom(`p1-${action.id}-${framing.id}-${seed}`) })[0]);
}
const allRandom = randomizeLockKeys({ ...E.createEmptyLocks(), subjectCount: '1' }, C.map(control => control.key), E.createEmptyLocks(), C);
for (let index = 0; index < 150; index += 1) {
  out['allrandom:' + index] = pick(E.generatePrompts(1, allRandom, [], { random: E.createSeededRandom('p4-allrandom-' + index) })[0]);
}
writeFileSync(process.argv[2], JSON.stringify(out));
console.log('entries', Object.keys(out).length);
