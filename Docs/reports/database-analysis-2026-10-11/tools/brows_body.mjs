// 眉型在 legacy vs 結構化欄位的保留情況、body 關鍵詞計數、與 chestUp 空值
const { CHARACTER_PROFILE_OPTIONS:O } = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine/characterProfiles.js');
const cards=O.filter(o=>o.profile);
const S=['facialGeometry','eyeSignature','noseSignature','mouthSignature','skinSignature','makeup','body','distinctiveFeatures'];
let legacyBrow=0, structBrow=0, lost=[];
for(const c of cards){ const a=/brow/.test(c.profile.identityAndBody); const b=/brow/.test(S.map(f=>c.profile[f]).join(' ')); if(a)legacyBrow++; if(b)structBrow++; if(a&&!b) lost.push(c.zh);}
console.log(`brows: identityAndBody 提及 ${legacyBrow}/33；結構化 8 欄提及 ${structBrow}/33；只在 legacy 有: ${lost.length} → ${lost.join(', ')}`);
for (const w of ['petite','tall','slim','slender','curvy','hourglass','athletic','full bust','long legs']) console.log(w, cards.filter(c=>new RegExp(w).test(c.profile.body)).length);
console.log('chestUp 空字串:', cards.filter(c=>!c.profile.bodyProjection.chestUp).map(c=>c.zh).join(','));
console.log('body 含非視覺詞:', cards.filter(c=>/cozy|girl|vibe|mood|aura/.test(c.profile.body)).map(c=>c.zh+': '+c.profile.body).join(' | '));
// East Asian 等族裔
const eth={}; cards.forEach(c=>{const m=c.profile.identityAndBody.match(/adult ([A-Za-z\- ]+?) wom[ae]n/); const k=m?m[1]:'?'; eth[k]=(eth[k]||0)+1;}); console.log('族裔/身份字樣:', JSON.stringify(eth));
