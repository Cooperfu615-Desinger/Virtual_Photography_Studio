// 手動可選（非隨機）組合中，文字語意可能與姿勢基底衝突的候選。唯讀；僅為 diagnostic。
const R='/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine/';
const P=await import(R+'poseComposerOptions.js'); const C=await import(R+'poseComposerCompatibility.js');
const pub=a=>a.filter(o=>!['none','random'].includes(o.id)&&!o.meta?.uiHidden);
const vis=(o,b)=>C.poseComposerOptionVisibleForBase(o,b)&&(!o.base&&!o.bases||o.base===b||o.bases?.includes(b));
const RULE={standing:/\b(ground|floor|lying|knees? (on|planted)|kneel|seated|lap|thigh)\b/i, sitting:/\b(standing|lying|kneel)\b/i, squatting:/\b(lying|kneel|seated|standing)\b/i, kneeling:/\b(lying|standing|seated)\b/i};
for(const [b,rx] of Object.entries(RULE)) for(const [k,arr] of [['hand',P.POSE_COMPOSER_HAND_OPTIONS],['head',P.POSE_COMPOSER_HEAD_OPTIONS],['prop',P.POSE_COMPOSER_PROP_OPTIONS]]) for(const o of pub(arr)) if(vis(o,b)&&rx.test(o.en)) console.log(`${b} + ${k}:${o.id} → "${o.en.match(rx)[0]}" in "${o.en.slice(0,90)}"`);
// 隨機才套用相容規則：統計各層有隨機限制 meta 但手動不受限的數量
const metaKeys=['randomEligibleForBases','randomEligibleForOrientations','randomEligibleForArrangements','requiresFaceVisibility','requiresCameraFacingGesture','requiresWardrobeRole'];
for(const [k,arr] of Object.entries(P)) if(Array.isArray(arr)){ const n=pub(arr).filter(o=>metaKeys.some(m=>o.meta?.[m]!==undefined)).length; if(n) console.log(`${k}: ${n} 個公開選項帶「僅隨機生效」相容 meta`);}
