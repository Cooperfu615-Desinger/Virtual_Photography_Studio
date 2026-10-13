// 角色卡 photographicDirection 中的場景/地點/光線字詞（指南：角色卡不應含固定場景）。唯讀。
const {CHARACTER_PROFILE_OPTIONS:O}=await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine/characterProfiles.js');
const RX=/\b(indoor|outdoor|street|urban|school|corridor|cafe|bedroom|room|beach|studio|night|nightlife|sunlit|sunlight|window|kitchen|garden|city|neon|film-snapshot|flash)\b/gi;
let n=0; for(const c of O.filter(o=>o.profile)){ const m=[...new Set((c.profile.photographicDirection.match(RX)||[]).map(x=>x.toLowerCase()))]; if(m.length){n++; console.log(`${c.zh}: ${m.join('/')} ← "${c.profile.photographicDirection.slice(0,110)}"`);} }
console.log(`合計 ${n}/33 張卡的 photographicDirection 含場景/地點/光線字詞`);
