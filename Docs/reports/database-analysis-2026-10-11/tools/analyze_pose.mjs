// Pose Composer / Duo / Action Pose 量化分析。唯讀。用法: node analyze_pose.mjs <out.md>
import fs from 'node:fs';
const ROOT='/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/';
const P=await import(ROOT+'lib/engine/poseComposerOptions.js');
const C=await import(ROOT+'lib/engine/poseComposerCompatibility.js');
const D=await import(ROOT+'lib/engine/duoOptions.js');
const A=await import(ROOT+'data/actionPoseCards.js');
const out=[]; const p=(...a)=>out.push(a.join(' '));
const L={base:P.POSE_COMPOSER_BASE_OPTIONS,orientation:P.POSE_COMPOSER_ORIENTATION_OPTIONS,arrangement:P.POSE_COMPOSER_ARRANGEMENT_OPTIONS,hand:P.POSE_COMPOSER_HAND_OPTIONS,prop:P.POSE_COMPOSER_PROP_OPTIONS,head:P.POSE_COMPOSER_HEAD_OPTIONS,anchor:P.POSE_COMPOSER_ANCHOR_OPTIONS};
const isCtl=o=>['none','random'].includes(o.id);
const wc=s=>String(s||'').trim().split(/\s+/).filter(Boolean).length;
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:0;};
p('## Pose Composer 各層條目數');
p('| 層 | 總數 | none/random | 實際選項 | uiHidden | deprecated | randomEligible=false | 有 legacyPromptAliases | 有 projectionByBucket | en 字數 min/中位/max |');
p('|---|---|---|---|---|---|---|---|---|---|');
for(const [k,arr] of Object.entries(L)){
  const real=arr.filter(o=>!isCtl(o));
  const w=real.map(o=>wc(o.en));
  p(`| ${k} | ${arr.length} | ${arr.length-real.length} | ${real.length} | ${real.filter(o=>o.meta?.uiHidden).length} | ${real.filter(o=>o.meta?.deprecated).length} | ${real.filter(o=>o.meta?.randomEligible===false).length} | ${real.filter(o=>o.meta?.legacyPromptAliases?.length).length} | ${real.filter(o=>o.meta?.projectionByBucket).length} | ${Math.min(...w)}/${med(w)}/${Math.max(...w)} |`);
}
// per base visible (仿 Page1Workspace buildPoseComposerControl + 排除 uiHidden)
const bases=['standing','sitting','kneeling','squatting','lying'];
const visible=(o,b,orient)=>{
  if(isCtl(o)||o.meta?.uiHidden) return false;
  if(!C.poseComposerOptionVisibleForBase(o,b)) return false;
  if(orient && !C.poseComposerOptionVisibleForOrientation(o,orient)) return false;
  if(!o.base && !o.bases) return true;
  if(o.base) return o.base===b; return o.bases.includes(b);
};
p('\n## 各姿勢基底的公開可選數 (排除 uiHidden、none/random；仿 Page1Workspace 過濾邏輯；anchor 未計場景類型限制)');
p('| 基底 / 躺姿方向 | 肢體變化 | 手部 | 道具 | 頭部 | 接觸/支撐 | 理論組合數 (各層 +1 為「不選」) | 隨機可用 肢體/手/頭 |');
p('|---|---|---|---|---|---|---|---|');
const rows=[];
const ctxs=[...bases.filter(b=>b!=='lying').map(b=>[b,null]),['lying','lying-supine'],['lying','lying-side'],['lying','lying-prone']];
for(const [b,o] of ctxs){
  const n={}; for(const k of ['arrangement','hand','prop','head','anchor']) n[k]=L[k].filter(x=>visible(x,b,o)).length;
  const combos=(n.arrangement+1)*(n.hand+n.prop+1)*(n.head+1)*(n.anchor+1); // V1: 道具接管手部層 → 手/道具互斥
  const rA=L.arrangement.filter(x=>visible(x,b,o)&&x.meta?.randomEligible!==false&&C.poseComposerOptionRandomEligibleForOrientation(x,o)).length;
  const rH=L.hand.filter(x=>visible(x,b,o)&&x.meta?.randomEligible!==false&&C.poseComposerOptionRandomEligibleForBase(x,b)&&C.poseComposerOptionRandomEligibleForOrientation(x,o)).length;
  const rHe=L.head.filter(x=>visible(x,b,o)&&x.meta?.randomEligible!==false&&C.poseComposerOptionRandomEligibleForBase(x,b)&&C.poseComposerOptionRandomEligibleForOrientation(x,o)).length;
  rows.push([b+(o?'/'+o:''),n,combos]);
  p(`| ${b}${o?' / '+o:''} | ${n.arrangement} | ${n.hand} | ${n.prop} | ${n.head} | ${n.anchor} | ${combos.toLocaleString()} | ${rA}/${rH}/${rHe} |`);
}
const tot=rows.reduce((s,r)=>s+r[2],0); p(`\n理論組合總數(未扣除景別/視角相容限制) ≈ ${tot.toLocaleString()}；各家族占比: `+rows.map(r=>`${r[0]} ${(100*r[2]/tot).toFixed(1)}%`).join('，'));
// 隱藏/退役 by base
p('\n## uiHidden / legacy 累積 (依層)');
for(const k of ['arrangement','hand','head','anchor','prop']){ const h=L[k].filter(o=>o.meta?.uiHidden); p(`- ${k}: ${h.length} 個 uiHidden → ${h.map(o=>o.id).join(', ')}`);}
// 編碼常數 ID 存在性
const src=fs.readFileSync(ROOT+'lib/engine/poseComposerCompatibility.js','utf8');
const ids=[...src.matchAll(/'([a-z0-9]+(?:-[a-z0-9]+)+)'/g)].map(m=>m[1]);
const all=new Set(Object.values(L).flat().map(o=>o.id));
const missing=[...new Set(ids)].filter(i=>!all.has(i) && !['head-camera-natural'].includes(i)||(!all.has(i)));
p(`\n## poseComposerCompatibility.js 硬編碼 ID: ${new Set(ids).size} 個；不存在於任何選項的 ID: ${[...new Set(ids)].filter(i=>!all.has(i)).join(', ')||'無'}`);
const hiddenRef=[...new Set(ids)].filter(i=>{const o=Object.values(L).flat().find(x=>x.id===i);return o?.meta?.uiHidden;});
p(`- 其中指向 uiHidden 選項: ${hiddenRef.join(', ')||'無'}`);
// engine.js / Page1Workspace 硬編碼 pose ID 次數
const eng=fs.readFileSync(ROOT+'lib/engine.js','utf8'), ui=fs.readFileSync(ROOT+'components/Page1Workspace.jsx','utf8');
const realIds=Object.entries(L).filter(([k])=>k!=='base'&&k!=='orientation').flatMap(([k,a])=>a.filter(o=>!isCtl(o)).map(o=>[k,o.id]));
let engHits=0, engIds=0, uiIds=0; const perLayer={};
for(const [k,id] of realIds){ const n=(eng.match(new RegExp(`['"\`]${id}['"\`]`,'g'))||[]).length; if(n){engIds++; engHits+=n; perLayer[k]=(perLayer[k]||0)+1;} if(new RegExp(`['"\`]${id}['"\`]`).test(ui)) uiIds++; }
p(`- engine.js 以字串常數直接引用的姿勢選項 ID: ${engIds}/${realIds.length} 個 (共 ${engHits} 次)；依層: ${JSON.stringify(perLayer)}；Page1Workspace.jsx 直接引用: ${uiIds} 個`);
// zh 重複
p('\n## zh 名稱重複 (同層)');
for(const [k,arr] of Object.entries(L)){ const m={}; arr.forEach(o=>{const key=(o.base||'')+'|'+o.zh; (m[key]??=[]).push(o.id);}); for(const [z,v] of Object.entries(m)) if(v.length>1) p(`- ${k}: ${z} → ${v.join(', ')}`);}
// 隨機權重
// en 中內部語
// arrangement per base 數 (含 hidden)
p('\n## 肢體變化依基底 (公開/含隱藏)');
for(const b of bases){ const all=L.arrangement.filter(o=>o.base===b||o.bases?.includes(b)); p(`- ${b}: 公開 ${all.filter(o=>!o.meta?.uiHidden&&!isCtl(o)).length} / 全部 ${all.length}`);}
// projection coverage for public arrangements
const pubArr=L.arrangement.filter(o=>!isCtl(o)&&!o.meta?.uiHidden&&!o.meta?.tags?.includes('any'));
p(`\n- 公開肢體變化具 projectionByBucket: ${pubArr.filter(o=>o.meta?.projectionByBucket).length}/${pubArr.length}；缺少者: ${pubArr.filter(o=>!o.meta?.projectionByBucket).map(o=>o.id).join(', ')}`);
const pubHand=L.hand.filter(o=>!isCtl(o)&&!o.meta?.uiHidden);
p(`- 公開手部具 visibleBuckets: ${pubHand.filter(o=>o.meta?.visibleBuckets).length}/${pubHand.length}；具 projectionByBucket: ${pubHand.filter(o=>o.meta?.projectionByBucket).length}`);
// Duo / Action pose
p('\n## 雙人 (duoOptions.js) 與動作姿勢卡 (actionPoseCards.js)');
for(const [k,v] of Object.entries(D)) if(Array.isArray(v)){ const real=v.filter(o=>!isCtl(o)); const w=real.map(o=>wc(o.en)); p(`- ${k}: ${v.length} (實際 ${real.length})；uiHidden ${real.filter(o=>o.meta?.uiHidden).length}；en 字數 ${Math.min(...w)}/${med(w)}/${Math.max(...w)}`);}
p(`- ACTION_POSE_CARDS: ${A.ACTION_POSE_CARDS.length}；modes: ${A.ACTION_POSE_MODES.map(m=>m.id||JSON.stringify(m)).join(',')}；各 mode 數: ${A.ACTION_POSE_MODES.map(m=>`${m.id}:${A.getActionPoseCardsByMode(m.id).length}`).join(', ')}`);
fs.writeFileSync(process.argv[2],out.join('\n')); console.log(out.join('\n'));
