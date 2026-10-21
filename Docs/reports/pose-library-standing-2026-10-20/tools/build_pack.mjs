// 站姿第一批測試包。在 webapp/ 執行：HEAD=<sha> node <本檔> > ../Docs/reports/pose-library-standing-2026-10-20/prompts.md
// 以目前引擎產生「姿勢＝任意」的四種輸出，再把任意的句子換成草案動作（Docs/specs/pose-library-standing-v1.md §3），
// 手勢用引擎實際的插入方式（gazeGesture.js actionTextWithGesture）。
const root = process.cwd();
const E = await import(root + '/src/lib/engine.js');
const { SPECIFIED_ACTION_ANY_EN, joinSpecifiedActionClauses } = await import(root + '/src/lib/engine/specifiedActions.js');
const { GESTURE_OPTIONS, actionTextWithGesture } = await import(root + '/src/lib/engine/gazeGesture.js');
const C = E.getLockControls();
const opt = (k, zh) => { const o = C.find(c => c.key === k).options.find(x => x.zh === zh); if (!o) throw new Error(k + zh); return o.id; };
const locks = { ...E.createEmptyLocks() };
for (const c of C) { const n = c.options?.find(o => o.zh === '全無' || o.zh === '無額外表情'); if (n) locks[c.key] = n.id; }
Object.assign(locks, { subjectCount: '1', framingId: opt('framingId', '全身鏡頭 (Full Body Shot)'), locationId: opt('locationId', '室內：莫蘭迪灰背景'),
  expressionId: opt('expressionId', '柔和微笑'), topId: opt('topId', '落肩 T 恤'), pantsId: opt('pantsId', '直筒牛仔褲'), specifiedActionId: 'any' });
const base = E.generatePrompts(1, locks, [], { random: E.createSeededRandom('standing-pack') })[0];

const c = (region, join, en) => ({ region, join, en });
const ACTIONS = {
  '3.1': ['自然站姿', [c('core', '', 'She stands in a relaxed neutral posture')]],
  '3.2': ['單腳重心', [c('core', '', 'She stands in a relaxed posture with her weight shifted onto one leg and a natural asymmetrical balance')]],
  '3.3': ['交叉腿站姿', [c('core', '', 'She stands with one hip subtly shifted'), c('lower', ', ', 'her legs naturally crossed')]],
  '3.4': ['側身窄站姿', [c('core', '', 'She stands in a narrow side-facing posture with a clean elongated body line'), c('lower', ', ', 'her feet close together')]],
  '3.5': ['併腿微屈站姿', [c('core', '', 'She stands with her hips shifted slightly to one side and her torso following a gentle lateral curve'),
    c('lower', '. ', 'Her feet are close together and her knees softly bent')]],
  '3.6': ['開腿偏重心站姿', [c('core', '', 'She stands with most of her weight settled onto one leg, her hips held at standing height'),
    c('lower', '. ', 'Her feet are set apart with the toes angled slightly outward, the other leg extending to the side')]],
  '3.7': ['單腳屈膝抬腿站姿', [c('core', '', 'She stands on one leg'),
    c('lower', ', ', 'the free leg lifted and bent at the knee, crossing slightly in front of the supporting leg, with the lower leg folded back and the foot raised off the ground')]],
  '3.8': ['上身前傾探身站姿', [c('core', '', 'She stands with her upper body leaning markedly forward from the hips'),
    c('upper', ', ', 'her face and shoulders brought ahead of her waist and hips')]],
  '3.9': ['骨盆後推曲線站姿', [c('core', '', 'She stands with her pelvis shifted distinctly backward, her hips projecting behind her torso and a smooth pronounced curve running through her lower back into her buttocks'),
    c('upper', ', ', 'her upper torso only slightly inclined forward')]],
};
const SETS = [
  ...Object.keys(ACTIONS).map(id => [id, null]),
  ['3.1', 'gesture-front-pockets'], ['3.2', 'gesture-tuck-hair'], ['3.3', 'gesture-hands-clasped-hips'], ['3.4', 'gesture-collarbone'],
];
const poseText = (id, gestureId) => {
  const clauses = ACTIONS[id][1];
  const action = { clauses, en: joinSpecifiedActionClauses(clauses), upperBodyEn: joinSpecifiedActionClauses(clauses, ['core', 'upper']) };
  return actionTextWithGesture(action, GESTURE_OPTIONS.find(o => o.id === gestureId) || null).en;
};
const outputs = { GPT: base.grokPrompt, 'Z-Image': base.zImagePrompt, Midjourney: base.midjourneyPrompt, 'Nano Banana 2.1': base.nanoBananaPrompt };
for (const [model, text] of Object.entries(outputs)) if (text.split(SPECIFIED_ACTION_ANY_EN).length !== 2) throw new Error(`${model}: 任意 sentence not found exactly once`);

let out = `# 站姿第一批：測試 Prompt\n\n- 產生日期：2026-10-20；基準：main @ ${process.env.HEAD}\n- 草案：[pose-library-standing-v1.md](../../specs/pose-library-standing-v1.md)；評分方式見 [README.md](README.md)\n- 共同設定：全身、莫蘭迪灰背景、柔和微笑、圓領 T 恤＋直筒牛仔褲（有前口袋）、20 歲成年日本女性；俯仰與環繞角度未指定；MJ 尾綴照引擎原樣，比例可自行調整\n`;
for (const [id, gestureId] of SETS) {
  const pose = poseText(id, gestureId);
  const gesture = GESTURE_OPTIONS.find(o => o.id === gestureId);
  const label = gesture ? `${id}+手勢｜${ACTIONS[id][0]}＋${gesture.zh}` : `${id}｜${ACTIONS[id][0]}`;
  out += `\n\n## ${label}\n\n姿勢句：\`${pose}\`\n`;
  for (const [model, text] of Object.entries(outputs)) out += `\n### ${model}\n\n\`\`\`text\n${text.replace(SPECIFIED_ACTION_ANY_EN, pose)}\n\`\`\`\n`;
}
process.stdout.write(out);
