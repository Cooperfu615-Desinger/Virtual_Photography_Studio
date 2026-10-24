// 第三輪：「任意」姿勢寫法（Z-Image 格式）。在 webapp/ 執行：HEAD=<sha> node <本檔> > ../Docs/reports/pose-hand-experiment-2026-10-17/prompts-round3.md
// 設定與前兩輪相同；整句姿勢替換為 A（明確指令）或 B（描述畫面特徵），其餘文字逐字相同。
const root = process.cwd();
const E = await import(root + '/src/lib/engine.js');
const { getLockControls, createEmptyLocks, createSeededRandom, generatePrompts } = E;
const controls = getLockControls();
const opt = (k, zh) => { const o = controls.find(c => c.key === k).options.find(x => x.zh === zh); if (!o) throw new Error(k + zh); return o.id; };
function allNone() { const l = { ...createEmptyLocks() }; for (const c of controls) { const n = c.options?.find(o => o.zh === '全無' || o.zh === '無額外表情'); if (n) l[c.key] = n.id; } return l; }
const base = { ...allNone(), subjectCount: '1', poseBaseId: 'standing', poseArrangementId: 'standing-natural',
  framingId: opt('framingId', '全身鏡頭 (Full Body Shot)'), angleId: opt('angleId', '平視高度鏡頭'), orbitId: opt('orbitId', '正面 0 度'),
  locationId: opt('locationId', '室內：莫蘭迪灰背景'), lightingId: opt('lightingId', '柔霧美妝攝影棚'),
  expressionId: opt('expressionId', '柔和微笑'), topId: opt('topId', '落肩 T 恤'), pantsId: opt('pantsId', '直筒牛仔褲'),
  poseHandId: 'one-hand-waist-one-down' };
const prompt = generatePrompts(1, base, [], { random: createSeededRandom('pose-hand-experiment') })[0];
const OLD = /She has one hand on the waist or hip line with the other hand relaxed along the body or nearby support surface, and presents a relaxed neutral standing posture\./;
const CONDITIONS = [
  ['A｜明確指令', 'Pose her in a natural, specific pose of your choosing that suits the scene, outfit and mood, with her body and hands doing something deliberate rather than standing in a neutral default stance.'],
  ['B｜描述畫面特徵', 'She is caught in a candid, natural mid-movement pose, her weight shifted onto one leg and both hands engaged.'],
];
const src = prompt.zImagePrompt;
if (!OLD.test(src)) throw new Error('pose sentence not found');
let out = `# 手部寫法實驗：第三輪（「任意」姿勢寫法，Z-Image）\n\n- 產生日期：2026-10-18；基準：main @ ${process.env.HEAD}（含五官全無預設日本、圓領 T 恤）\n- 設定與前兩輪相同（自然站姿基底、全身、平視、正面、莫蘭迪灰背景、柔霧美妝攝影棚、柔和微笑、落肩 T 恤＋直筒牛仔褲）\n- 只替換整句姿勢；A、B 兩組其餘文字逐字相同\n- 建議每組 4 張，seed 固定 1–4；評分重點：4 張中姿勢相異的數量、姿勢是否自然、手部是否畸形\n`;
for (const [title, sentence] of CONDITIONS) {
  out += `\n## ${title}\n\n姿勢句：\`${sentence}\`\n\n\`\`\`text\n${src.replace(OLD, sentence)}\n\`\`\`\n`;
}
process.stdout.write(out);
