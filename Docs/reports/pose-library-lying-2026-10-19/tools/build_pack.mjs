// 躺姿第一批測試包。在 webapp/ 執行：HEAD=<sha> node <本檔> > ../Docs/reports/pose-library-lying-2026-10-19/prompts.md
// 以目前引擎產生「無姿勢、無機位」的基底，再插入草案動作子句（Docs/specs/pose-library-lying-v1.md §4）與躺姿機位（§2）。
const root = process.cwd();
const E = await import(root + '/src/lib/engine.js');
const C = E.getLockControls();
const opt = (k, zh) => { const o = C.find(c => c.key === k).options.find(x => x.zh === zh); if (!o) throw new Error(k + zh); return o.id; };
const locks = { ...E.createEmptyLocks() };
for (const c of C) { const n = c.options?.find(o => o.zh === '全無' || o.zh === '無額外表情'); if (n) locks[c.key] = n.id; }
Object.assign(locks, { subjectCount: '1', framingId: opt('framingId', '全身鏡頭 (Full Body Shot)'), locationId: opt('locationId', '其他：白色床鋪'),
  expressionId: opt('expressionId', '柔和微笑'), topId: opt('topId', '落肩 T 恤'), pantsId: opt('pantsId', '直筒牛仔褲') });
const base = E.generatePrompts(1, locks, [], { random: E.createSeededRandom('lying-pack') })[0];

const SURFACE = 'on the white bed';
const CAMERAS = {
  surface: ['貼地／床面平視', 'shot from surface level beside her, the lens at the height of the surface she lies on'],
  overhead: ['正上方俯拍', 'shot from directly overhead, the camera looking straight down at her'],
  high: ['斜上方俯拍', 'shot from a high angle beside her, looking down across her body'],
  head: ['從頭頂方向拍', 'shot from above her head, looking along her body toward her feet'],
};
const ACTIONS = [
  { id: '4.1', zh: '側躺・臉靠枕頭・上手輕握枕邊', ref: 'HQ4zehHaIAAFby1.jpeg', cameras: ['surface', 'overhead'], clauses: [
    ['', 'She lies on her side with the side of her head resting on the pillow'],
    [', ', 'her upper arm bent and her hand loosely gripping the edge of the pillow beside her face, her shoulders gently rounded forward'],
    ['. ', 'Her legs rest stacked with her knees softly bent'] ] },
  { id: '4.2', zh: '趴躺・前臂撐起・雙腳交叉翹起', ref: 'HT08Tcia8AAikhz.jpeg', cameras: ['high', 'head'], clauses: [
    ['', 'She lies on her stomach with her chest lifted and her back gently arched'],
    [', ', 'propped on her forearms resting flat in front of her'],
    ['. ', 'Her hips rest on the surface, her knees are bent and her lower legs are raised, crossed at the ankles'],
    ['; ', 'her forearms and hips carry her weight'] ] },
  { id: '4.3', zh: '趴躺・前臂撐起・單腿屈起', ref: 'HUGKFGubsAAmv7x.jpeg', cameras: ['surface', 'overhead'], clauses: [
    ['', 'She lies on her stomach with her upper body raised'],
    [', ', 'propped on her forearms with her hands resting on the surface in front of her'],
    ['. ', 'One leg stretches straight along the surface while the other knee bends and lifts its lower leg nearly upright'],
    ['; ', 'her forearms, hips and straight leg carry her weight'] ] },
];
// 表面接在核心動詞之後：「She lies on her side on the white bed with …」
const poseText = clauses => clauses.map(([join, en]) => join + en).join('')
  .replace(/^She lies on her (side|stomach)/, `She lies on her $1 ${SURFACE}`) + '.';
const fill = (camera, pose) => ({
  GPT: base.grokPrompt.replace('Composition:\nFull-body portrait.', `Composition:\nFull-body portrait, ${camera}.`)
    .replace('\n\nScene:\n', `\n\nPose and Composition:\n${pose}\n\nScene:\n`),
  'Z-Image': base.zImagePrompt.replace(/(The setting is [^\n]*?pillows\.) Full-body portrait\./, `$1\n${pose}\nFull-body portrait, ${camera}.`),
  Midjourney: base.midjourneyPrompt.replace('Full-body portrait. A 20-year-old adult Japanese woman. Soft natural smile.',
    `Full-body portrait, ${camera}. A 20-year-old adult Japanese woman. Soft natural smile. ${pose}`),
  'Nano Banana 2.1': base.nanoBananaPrompt.replace('Full-body portrait.\n', `Full-body portrait, ${camera}.\n`)
    .replace('\n\nThe setting is ', `\n\n${pose} The setting is `),
});
let out = `# 躺姿第一批：測試 Prompt\n\n- 產生日期：2026-10-19；基準：main @ ${process.env.HEAD}\n- 草案：[pose-library-lying-v1.md](../../specs/pose-library-lying-v1.md)；評分方式見 [README.md](README.md)\n- 共同設定：全身、白色床鋪、柔和微笑、圓領 T 恤＋直筒牛仔褲、20 歲成年日本女性；不含手勢；MJ 尾綴照引擎原樣，比例可自行調整\n`;
for (const a of ACTIONS) for (const key of a.cameras) {
  const [camZh, camEn] = CAMERAS[key];
  const pose = poseText(a.clauses);
  const texts = fill(camEn, pose);
  for (const [model, text] of Object.entries(texts)) if (!text.includes(pose) || !text.includes(camEn)) throw new Error(`${a.id}/${key}/${model}: insertion failed`);
  out += `\n\n## ${a.id}｜${a.zh}｜${camZh}\n\n參考圖：\`Docs/動作庫參考/躺姿/${a.ref}\`\n`;
  for (const [model, text] of Object.entries(texts)) out += `\n### ${model}\n\n\`\`\`text\n${text}\n\`\`\`\n`;
}
process.stdout.write(out);
