// 站姿第二批測試包。在 webapp/ 執行：HEAD=<sha> node <本檔> > ../Docs/reports/pose-library-standing-2026-10-20/prompts-batch2.md
// 做法同 build_pack.mjs：以引擎「姿勢＝任意」的四種輸出為基底，把任意的句子換成草案動作
// （Docs/specs/pose-library-standing-v1.md §6）；新手勢（§7）用引擎實際的插入函式接在第一批動作上。
const root = process.cwd();
const E = await import(root + '/src/lib/engine.js');
const { SPECIFIED_ACTION_ANY_EN, joinSpecifiedActionClauses } = await import(root + '/src/lib/engine/specifiedActions.js');
const { actionTextWithGesture } = await import(root + '/src/lib/engine/gazeGesture.js');
const C = E.getLockControls();
const opt = (k, zh) => { const o = C.find(c => c.key === k).options.find(x => x.zh === zh); if (!o) throw new Error(k + zh); return o.id; };
const locks = { ...E.createEmptyLocks() };
for (const c of C) { const n = c.options?.find(o => o.zh === '全無' || o.zh === '無額外表情'); if (n) locks[c.key] = n.id; }
Object.assign(locks, { subjectCount: '1', framingId: opt('framingId', '全身鏡頭 (Full Body Shot)'), locationId: opt('locationId', '室內：莫蘭迪灰背景'),
  expressionId: opt('expressionId', '柔和微笑'), topId: opt('topId', '落肩 T 恤'), pantsId: opt('pantsId', '直筒牛仔褲'), specifiedActionId: 'any' });
const base = E.generatePrompts(1, locks, [], { random: E.createSeededRandom('standing-pack') })[0];

const c = (region, join, en) => ({ region, join, en });
const BATCH2 = {
  '6.1': ['雙手背後・單膝內扣', '010c1243cfa3389e3b108cf9c75fa8a8.jpg', [c('core', '', 'She stands with her weight on one straight leg'),
    c('upper', ', ', 'both hands clasped behind her back'), c('lower', '. ', 'Her other knee bends softly inward, its foot resting lightly beside the supporting foot')]],
  '6.2': ['一手扶頭・跨步', '1d7b9d0491d59db07fc80a23bc5be49a.jpg', [c('core', '', 'She stands in a posed mid-stride'),
    c('upper', ', ', 'one hand resting on top of her head and the other arm hanging loosely at her side'),
    c('lower', '. ', 'Her front foot steps forward with the heel on the ground and the toes lifted, the back leg straight')]],
  '6.3': ['一手扶頭・一手插口袋', '3e884f394a163fff1b6a3cf4e30bf5cd.jpg', [c('core', '', 'She stands with her feet slightly apart'),
    c('upper', ', ', 'one hand raised to the side of her head and the other hand tucked into her front pocket'), c('lower', '. ', 'Her knees turn slightly inward')]],
  '6.4': ['上身前傾・雙手插口袋・一腳前踏', '5ba40b62320ca0622169b21f5bcaabef.jpg', [c('core', '', 'She stands with her upper body leaning forward from the hips'),
    c('upper', ', ', 'both hands tucked into her front pockets'), c('lower', '. ', 'One foot steps forward ahead of the other, the back heel slightly lifted')]],
  '6.5': ['單腳站・側後抬腿・雙拳胸前', '824cc953f4a58d4bcd9bd9fe84dde35b.jpg', [c('core', '', 'She stands on one leg in a playful pose'),
    c('upper', ', ', 'both hands curled into loose fists in front of her chest'),
    c('lower', '. ', 'Her other leg kicks out to the side with the knee bent and the foot raised well off the ground')]],
  '6.6': ['單腳站・前踢抬腿・一手舉高', 'c4ca80214af80abd58b0ad30bb543f0a.jpg', [c('core', '', 'She stands on one leg in a playful pose'),
    c('upper', ', ', 'one hand raised beside her head with the index finger pointing up and the other arm swinging back'),
    c('lower', '. ', 'Her other leg kicks forward and up, the foot raised to hip height')]],
  '6.7': ['雙手抱頭後・併腿內扣', 'cd7fb25489834cf7b3d8a957aef72f28.jpg', [c('core', '', 'She stands with her feet close together'),
    c('upper', ', ', 'both hands raised to the back of her head, her elbows spread out to the sides'), c('lower', '. ', 'Her knees turn slightly inward')]],
  '6.8': ['單臂上舉・一手扶臂伸展', 'f512ed9b7b53c9ebb4c2b0376782633d.jpg', [c('core', '', 'She stands with her feet planted shoulder-width apart'),
    c('upper', ', ', 'one arm stretched straight overhead and the other arm bent with its hand holding the raised arm near the elbow')]],
  '6.9': ['外八開腿・一手放胸前', 'images.jpeg', [c('core', '', 'She stands with her feet set wide apart and her toes turned outward'),
    c('upper', ', ', 'one hand resting on her chest and the other arm hanging straight at her side')]],
  '6.10': ['單腳站・一手比耶・一手叉腰', 'v2-60d44e901558586d8b79ee02b7962376_1440w.jpg', [c('core', '', 'She stands on one leg'),
    c('upper', ', ', 'one arm raised straight overhead making a V sign and the other hand resting on her waist'),
    c('lower', '. ', 'Her other leg bends at the knee, lifted in front of the supporting leg with the foot tucked back')]],
  '6.11': ['雙手向上張開', 'v2-c5761de237bb95a4fc2f108b89902da3_1440w.jpg', [c('core', '', 'She stands with her legs straight and one knee softly bent'),
    c('upper', ', ', 'both arms raised overhead and spread wide in a V, palms open')]],
};
// 第一批（§3）中用來搭配新手勢的 4 個動作，子句與 build_pack.mjs 相同。
const BATCH1 = {
  '3.1': ['自然站姿', [c('core', '', 'She stands in a relaxed neutral posture')]],
  '3.2': ['單腳重心', [c('core', '', 'She stands in a relaxed posture with her weight shifted onto one leg and a natural asymmetrical balance')]],
  '3.4': ['側身窄站姿', [c('core', '', 'She stands in a narrow side-facing posture with a clean elongated body line'), c('lower', ', ', 'her feet close together')]],
  '3.5': ['併腿微屈站姿', [c('core', '', 'She stands with her hips shifted slightly to one side and her torso following a gentle lateral curve'),
    c('lower', '. ', 'Her feet are close together and her knees softly bent')]],
};
const NEW_GESTURES = {
  'gesture-hand-on-head': ['一手扶頭', 'one hand resting on top of her head'],
  'gesture-hands-behind-head': ['雙手抱頭後', 'both hands raised to the back of her head, elbows spread out'],
  'gesture-hands-behind-back': ['雙手背後', 'both hands clasped behind her back'],
  'gesture-arms-overhead': ['雙臂上舉', 'both arms raised overhead'],
};
const GESTURE_SETS = [['3.1', 'gesture-hands-behind-back'], ['3.2', 'gesture-hand-on-head'], ['3.5', 'gesture-hands-behind-head'], ['3.4', 'gesture-arms-overhead']];
const text = (clauses, gesture = null) => actionTextWithGesture({ clauses, en: joinSpecifiedActionClauses(clauses),
  upperBodyEn: joinSpecifiedActionClauses(clauses, ['core', 'upper']) }, gesture).en;
const outputs = { GPT: base.grokPrompt, 'Z-Image': base.zImagePrompt, Midjourney: base.midjourneyPrompt, 'Nano Banana 2.1': base.nanoBananaPrompt };
for (const [model, t] of Object.entries(outputs)) if (t.split(SPECIFIED_ACTION_ANY_EN).length !== 2) throw new Error(`${model}: 任意 sentence not found exactly once`);
const block = (title, note, pose) => {
  let s = `\n\n## ${title}\n\n${note}姿勢句：\`${pose}\`\n`;
  for (const [model, t] of Object.entries(outputs)) s += `\n### ${model}\n\n\`\`\`text\n${t.replace(SPECIFIED_ACTION_ANY_EN, pose)}\n\`\`\`\n`;
  return s;
};

let out = `# 站姿第二批：測試 Prompt\n\n- 產生日期：2026-10-20；基準：main @ ${process.env.HEAD}\n- 草案：Docs/specs/pose-library-standing-v1.md §6（動作）、§7（新手勢）；評分方式同第一批\n- 共同設定：全身、莫蘭迪灰背景、柔和微笑、圓領 T 恤＋直筒牛仔褲（有前口袋）、20 歲成年日本女性；俯仰與環繞角度未指定；MJ 尾綴照引擎原樣，比例可自行調整\n- 參考圖都在 \`Docs/站姿/\`\n`;
for (const [id, [zh, ref, clauses]] of Object.entries(BATCH2)) out += block(`${id}｜${zh}`, `參考圖：\`Docs/站姿/${ref}\`\n\n`, text(clauses));
for (const [actionId, gestureId] of GESTURE_SETS) {
  const [zh, clauses] = BATCH1[actionId];
  const [gZh, gEn] = NEW_GESTURES[gestureId];
  out += block(`${actionId}+新手勢｜${zh}＋${gZh}`, '', text(clauses, { id: gestureId, en: gEn }));
}
process.stdout.write(out);
