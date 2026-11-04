import { getGrokImagineResult } from '../grokImagineResult.js';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
const controls = getLockControls();
export function option(key, zh) {
  const item = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  if (!item) throw Error(`Unknown option ${key}: ${zh}`);
  return item.id;
}
function empty() {
  const locks = createEmptyLocks();
  for (const c of controls) {
    const none = c.options.find(o => o.zh === '全無' || o.zh === '無額外表情');
    if (none) locks[c.key] = none.id;
  }
  return locks;
}
const shared = {
  subjectCount: '1', bodyTypeId: option('bodyTypeId', '柔和沙漏身形'),
  hairstyleId: option('hairstyleId', '側分柔波中長髮'), hairColorId: option('hairColorId', '柔霧黑茶'),
  poseBaseId: 'standing', poseArrangementId: 'standing-natural', poseHandId: 'hand-adjust-off-shoulder-top', poseHeadId: 'head-camera-natural',
  topId: option('topId', '棉質細肩背心'), pantsId: option('pantsId', '直筒牛仔褲'),
  legwearId: option('legwearId', '羅紋短襪'), shoesId: option('shoesId', '尖頭細跟高跟鞋'),
  locationId: option('locationId', '室內：英式小旅館房間'), lensId: option('lensId', '50mm 標準鏡頭 (Standard)'),
};
const framing = zh => option('framingId', zh);
export const cases = [
  {name:'medium',locks:{...empty(),...shared,framingId:framing('中景鏡頭 (Medium Shot)')}},
  {name:'face',locks:{...empty(),...shared,framingId:framing('全臉傾斜特寫')}},
  {name:'full',locks:{...empty(),...shared,framingId:framing('全身鏡頭 (Full Body Shot)')}},
  {name:'random-top',locks:{...empty(),...shared,topId:'',framingId:framing('中景鏡頭 (Medium Shot)')}},
  {name:'none',locks:{...empty(),subjectCount:'1',framingId:framing('中景鏡頭 (Medium Shot)')}},
  {name:'duo',locks:{...empty(),subjectCount:'2',framingId:framing('全臉傾斜特寫'),topAId:option('topAId','棉質細肩背心'),pantsAId:option('pantsAId','直筒牛仔褲'),topBId:option('topBId','短袖上衣'),pantsBId:option('pantsBId','牛仔短褲')}},
  {name:'character-card',locks:{...empty(),subjectCount:'1',characterProfileId:option('characterProfileId','06_Hinata'),framingId:framing('中景鏡頭 (Medium Shot)')}},
  {name:'fixed',locks:{...empty(),subjectCount:'1',fixedCompositionSetId:'japan-carriage-bench-front'}},
];
export function runCase(entry,enabled=false) {
  const seeded=createSeededRandom(`grok7-fixture-${entry.name}`); let draws=0;
  const random=()=>{draws++;return seeded();};
  const [prompt]=generatePrompts(1,entry.locks,[],{random,experimentalGrok7:enabled});
  if(!prompt) throw Error(`No result: ${entry.name}`);
  const stable={...prompt};
  const prototype=getGrokImagineResult(prompt) || undefined;
  stable.extraPrompts = stable.extraPrompts.filter(entry => entry.id !== 'grok-imagine');
  delete stable.id; delete stable.date;
  return {stable,draws,prototype};
}
