const root = process.cwd();
const E = await import(root + '/src/lib/engine.js');
const { getLockControls, createEmptyLocks, createSeededRandom, generatePrompts } = E;
const controls = getLockControls();
const opt = (k, zh) => { const o = controls.find(c => c.key === k).options.find(x => x.zh === zh); if (!o) throw new Error(k + zh); return o.id; };
function allNone() { const l = { ...createEmptyLocks() }; for (const c of controls) { const n = c.options?.find(o => o.zh === '全無' || o.zh === '無額外表情'); if (n) l[c.key] = n.id; } return l; }
const base = { ...allNone(), subjectCount: '1', poseBaseId: 'standing', poseArrangementId: 'standing-natural',
  framingId: opt('framingId', '全身鏡頭 (Full Body Shot)'), angleId: opt('angleId', '平視高度鏡頭'), orbitId: opt('orbitId', '正面 0 度'),
  locationId: opt('locationId', '室內：莫蘭迪灰背景'), lightingId: opt('lightingId', '柔霧美妝攝影棚'),
  expressionId: opt('expressionId', '柔和微笑'), topId: opt('topId', '落肩 T 恤'), pantsId: opt('pantsId', '直筒牛仔褲') };
const gen = locks => generatePrompts(1, locks, [], { random: createSeededRandom('pose-hand-experiment') })[0];
const none = gen({ ...base, poseHandId: 'none' });
const fixed = gen({ ...base, poseHandId: 'one-hand-waist-one-down' });
const fields = [['GPT', 'grokPrompt'], ['Z-Image', 'zImagePrompt'], ['Midjourney', 'midjourneyPrompt'], ['Nano Banana 2.1', 'nanoBananaPrompt']];
const OLD = /She has one hand on the waist or hip line with the other hand relaxed along the body or nearby support surface, and presents a relaxed neutral standing posture\./;
const NEW = phrase => `She presents a relaxed neutral standing posture, with ${phrase}.`;
const FIXED_NEW = 'one hand resting on her waist and the other hand relaxed at her side';
const FREE = 'her hands posed naturally in a relaxed, unforced way of her own choosing';
const PICKS = ['both hands slipped into her front pockets'];
let out = `# 手部寫法實驗：第二輪（口袋手勢重測）\n\n- 產生日期：2026-10-17；基準：main @ ${process.env.HEAD}\n- 設定與第一輪相同；只測改寫後的 C4：\`both hands slipped into her front pockets\`（原「雙拇指勾口袋」0／3 正確）\n- 每個模型跑 2–4 張，評分方式同第一輪 README\n`;
for (const [name, field] of fields) {
  const src = fixed[field];
  if (!OLD.test(src)) throw new Error('pose sentence not found in ' + name);
  const mk = phrase => src.replace(OLD, NEW(phrase));
  out += `\n\n## ${name}\n`;
  PICKS.forEach((p, i) => { out += `\n### C4′｜新句型＋程式抽選：${p}\n\n\`\`\`text\n${mk(p)}\n\`\`\`\n`; });
}
process.stdout.write(out);
