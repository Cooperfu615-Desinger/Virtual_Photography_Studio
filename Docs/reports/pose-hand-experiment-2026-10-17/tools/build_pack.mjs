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
const PICKS = ['one hand lightly tucking a strand of hair behind her ear', 'both hands loosely clasped in front of her hips', 'one hand resting on her collarbone and the other relaxed at her side', 'both thumbs hooked into her front jeans pockets'];
let out = `# 手部寫法實驗包\n\n- 產生日期：2026-10-17；基準：main @ ${process.env.HEAD}\n- 共同設定：自然站姿、全身、平視、正面、莫蘭迪灰背景、柔霧美妝攝影棚、柔和微笑、落肩 T 恤＋直筒牛仔褲；其餘欄位全無\n- 條件：A0 目前引擎原樣輸出（手在前、姿勢在後）／A 新句型＋固定手勢／B 新句型＋交給模型／C1–C4 新句型＋程式抽選通用手勢\n- 除了姿勢句之外，所有條件的其他文字逐字相同。\n`;
for (const [name, field] of fields) {
  const src = fixed[field];
  if (!OLD.test(src)) throw new Error('pose sentence not found in ' + name);
  const mk = phrase => src.replace(OLD, NEW(phrase));
  out += `\n\n## ${name}\n`;
  out += `\n### A0｜目前引擎原樣\n\n\`\`\`text\n${src}\n\`\`\`\n`;
  out += `\n### A｜新句型＋固定手勢\n\n\`\`\`text\n${mk(FIXED_NEW)}\n\`\`\`\n`;
  out += `\n### B｜新句型＋交給模型\n\n\`\`\`text\n${mk(FREE)}\n\`\`\`\n`;
  PICKS.forEach((p, i) => { out += `\n### C${i + 1}｜新句型＋程式抽選：${p}\n\n\`\`\`text\n${mk(p)}\n\`\`\`\n`; });
}
process.stdout.write(out);
