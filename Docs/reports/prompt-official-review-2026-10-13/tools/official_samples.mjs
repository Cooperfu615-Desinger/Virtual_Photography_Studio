const root = process.cwd();
const E = await import(root + '/src/lib/engine.js');
const { REPRESENTATIVE_PROMPT_FIXTURES: F } = await import(root + '/src/lib/engine/representativePromptFixtures.js');
const { getLockControls, createEmptyLocks, createSeededRandom, generatePrompts } = E;
const controls = getLockControls(); const arr = Array.isArray(controls) ? controls : Object.values(controls);
function allNone() { const l = { ...createEmptyLocks() }; for (const c of arr) { const n = c.options?.find(o => o.zh === '全無' || o.zh === '無額外表情'); if (n) l[c.key] = n.id; } return l; }
function run(fx) { const l = allNone(); for (const [k, s] of Object.entries(fx.locks)) { if (typeof s === 'string' || Array.isArray(s)) { l[k] = s; continue; } const c = arr.find(x => x.key === k); const o = c?.options?.find(x => x.zh === s.byZh); if (!o) throw new Error(fx.id + ' ' + k + ' ' + s.byZh); l[k] = o.id; } return generatePrompts(1, l, [], { random: createSeededRandom(fx.seed) })[0]; }
const pick = ['normal-single', 'shibuya-moving-crowds', 'head-dominant-top-down', 'selected-top-chest-graphic', 'gpt-duo-standalone-body-omission'];
let out = '# 七種輸出實際樣本\n\n產生方式：代表性 fixtures，其餘欄位一律「全無」，固定 seed。HEAD 見檔頭。\n';
for (const id of pick) {
  const fx = F.find(f => f.id === id); if (!fx) { out += `\n(找不到 fixture ${id})\n`; continue; }
  const p = run(fx);
  const extra = Object.fromEntries((p.extraPrompts || []).map(e => [e.id, e.prompt || e.value || e.text || JSON.stringify(e)]));
  out += `\n\n## fixture: ${id}（${fx.title}）\n`;
  const fields = [['GPT（grokPrompt）', p.grokPrompt], ['Z-Image（zImagePrompt）', p.zImagePrompt], ['Midjourney（midjourneyPrompt）', p.midjourneyPrompt], ['Nano Banana 2.1（nanoBananaPrompt）', p.nanoBananaPrompt], ['胸上特寫（chest-up-portrait）', extra['chest-up-portrait']], ['MJ 胸上特寫（chest-up-mj-portrait）', extra['chest-up-mj-portrait']], ['全身角色照（full-body-character）', extra['full-body-character']]];
  for (const [name, v] of fields) out += `\n### ${name}\n\n` + (v ? '```text\n' + v + '\n```\n' : '_（此模式無此輸出）_\n');
}
process.stdout.write(out);
