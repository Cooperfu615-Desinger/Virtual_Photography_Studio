// 找出「未標 uiHidden，但對其所有適用基底皆 hiddenForBases」的實質不可見選項。唯讀。
const P=await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine/poseComposerOptions.js');
const BASES=['standing','sitting','kneeling','squatting','lying'];
for(const [k,arr] of Object.entries(P)){ if(!Array.isArray(arr)) continue;
  const dead=arr.filter(o=>!['none','random'].includes(o.id)&&!o.meta?.uiHidden).filter(o=>{
    const own=o.base?[o.base]:(o.bases||BASES); const hid=new Set(o.meta?.hiddenForBases||[]); return own.every(b=>hid.has(b));});
  if(dead.length) console.log(k, dead.length, dead.map(o=>`${o.id}(${o.zh})`).join(', '));
}
