import { createEmptyLocks, createSeededRandom, generatePrompts } from '../webapp/src/lib/engine.js';

function hasText(items, matcher) {
  return items.some((item) => matcher(`${item.zh} ${item.en}`.toLowerCase()));
}

function validatePrompt(prompt) {
  const issues = [];
  const wardrobe = prompt.structured.Wardrobe || [];
  const location = prompt.summaryFields.location || '';
  const lighting = prompt.summaryFields.lighting || '';
  const style = prompt.summaryFields.style || '';

  const hasPants = hasText(wardrobe, (text) => text.includes('褲') || text.includes('pants') || text.includes('jeans') || text.includes('trousers') || text.includes('shorts'));
  const hasSkirt = hasText(wardrobe, (text) => text.includes('裙') || text.includes('skirt'));
  const hasLegwear = hasText(wardrobe, (text) => text.includes('絲襪') || text.includes('襪') || text.includes('stockings') || text.includes('pantyhose'));
  const bareLegs = hasText(wardrobe, (text) => text.includes('bare legs') || text.includes('全無'));
  const swimwear = hasText(wardrobe, (text) => text.includes('swimwear') || text.includes('泳裝'));
  const lolita = hasText(wardrobe, (text) => text.includes('lolita') || text.includes('蘿莉塔'));
  const schoolgirl = hasText(wardrobe, (text) => text.includes('schoolgirl') || text.includes('女高中生') || text.includes('jk'));
  const heritage = hasText(wardrobe, (text) => text.includes('victorian') || text.includes('baroque') || text.includes('維多利亞') || text.includes('巴洛克'));

  const outdoor = /(海|湖|花田|草地|森林|木棧道|岩岸|巷|街|夜市|街頭|海灘|outdoors|street|beach|forest|park)/i.test(location);
  const studio = /(攝影棚|背景|黑幕|白幕|清水模|鏡面地板|沙發場景|灰背景|studio|set)/i.test(location);
  const ruin = /(廢棄|地下|骨架|ruin|abandoned)/i.test(location);
  const nightUrban = /(夜|霓虹|九龍|新宿|弘大|soho|night)/i.test(location);

  const studioLight = /(高 key|high key|商業平光)/i.test(lighting);
  const lowKey = /(low key|暗調戲劇光)/i.test(lighting);
  const windowLight = /(window|百葉窗|窗縫)/i.test(lighting);
  const hardSun = /(烈日|harsh sunlight|藍天白雲|夕陽暖光|陰天漫射柔光)/i.test(lighting);

  if (hasPants && hasSkirt) issues.push('同時出現褲裝與裙裝');
  if (hasPants && hasLegwear && !bareLegs) issues.push('褲裝又搭明顯襪類');
  if (swimwear && !outdoor) issues.push('泳裝出現在非戶外/度假場景');
  if (swimwear && hasPants) issues.push('泳裝仍抽到褲裝');
  if (lolita && hasPants) issues.push('Lolita 仍抽到褲裝');
  if (schoolgirl && hasPants) issues.push('JK 仍抽到褲裝');
  if ((studioLight || lowKey) && ruin && studioLight) issues.push('廢墟場景抽到棚燈');
  if (windowLight && outdoor) issues.push('戶外場景抽到窗縫/百葉窗光');
  if (studio && /霓虹電影感|高反差黑白街頭感/.test(style) && !nightUrban) issues.push('棚景搭街頭/夜景型攝影風格');
  if (/清透寫真感|日常微光詩意感/.test(style) && ruin) issues.push('清透/日常風格搭廢墟場景');
  if (/極簡雕塑棚拍感|精緻棚拍感|純背景凝視肖像感/.test(style) && !studio) issues.push('棚拍型風格沒有落在棚景');
  if (heritage && /街頭|夜市|街景|街角/.test(location)) issues.push('古典服裝落在強都市街頭場景');
  if (hardSun && /地下|廢棄醫院|排洪道|商場中庭/.test(location)) issues.push('地下/廢墟場景抽到戶外日光');

  return issues;
}

const count = Number(process.argv[2] || 200);
const seed = process.argv[3] || 'prompt-logic-default';
const prompts = generatePrompts(count, createEmptyLocks(), [], {
  random: createSeededRandom(seed),
});
const findings = [];

for (const prompt of prompts) {
  const issues = validatePrompt(prompt);
  if (issues.length > 0) findings.push({ prompt, issues });
}

console.log(`Generated ${count} prompts`);
console.log(`Seed: ${seed}`);
console.log(`Prompts with issues: ${findings.length}`);

const issueCounts = new Map();
for (const finding of findings) {
  for (const issue of finding.issues) {
    issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
  }
}

if (issueCounts.size > 0) {
  console.log('\nIssue summary:');
  for (const [issue, total] of [...issueCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`- ${issue}: ${total}`);
  }
}

if (findings.length > 0) {
  console.log('\nExamples:');
  for (const finding of findings.slice(0, 10)) {
    console.log('---');
    console.log(`Issues: ${finding.issues.join(' | ')}`);
    console.log(`Style: ${finding.prompt.summaryFields.style}`);
    console.log(`Wardrobe: ${finding.prompt.structured.Wardrobe.map((item) => item.zh).join(' | ')}`);
    console.log(`Location: ${finding.prompt.summaryFields.location}`);
    console.log(`Lighting: ${finding.prompt.summaryFields.lighting}`);
  }
}
