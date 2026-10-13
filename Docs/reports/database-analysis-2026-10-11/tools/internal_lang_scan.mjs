// 掃描角色卡/卡片實驗室/姿勢資料中可能外洩到公開 Prompt 的內部控制語。唯讀。
const R='/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/';
const { CHARACTER_PROFILE_OPTIONS:O } = await import(R+'engine/characterProfiles.js');
const lab = await import(R+'characterCardLab.js');
const P = await import(R+'engine/poseComposerOptions.js');
const D = await import(R+'engine/duoOptions.js');
const A = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/data/actionPoseCards.js');
const RX=/\b(locked|lock|guard|fallback|integrity|controlled by|model-decided|let the (image )?model|selection|renderer|internal|keep the original|preserv(e|ing)|unchanged|identity anchor|coherent facial identity|arrangement|placeholder|todo|tbd)\b/gi;
const hits={};
const add=(src,label,text)=>{ if(typeof text!=='string') return; const m=[...new Set((text.match(RX)||[]).map(x=>x.toLowerCase()))]; if(m.length){ (hits[src]??=[]).push(`${label}: ${m.join('/')}`);} };
for(const c of O.filter(o=>o.profile)){ add('characterProfiles.en',c.zh,c.en); for(const [k,v] of Object.entries(c.profile)) if(typeof v==='string' && k!=='legacyIdentityAndBody') add('characterProfiles.profile.'+k,c.zh,v); }
for(const h of lab.HAIR_VARIANT_OPTIONS) add('HAIR_VARIANT_OPTIONS',h.id,h.prompt);
for(const c of lab.getCharacterCardOptions([{key:'characterProfileId',options:O}])) for(const l of Object.values(c.defaultWardrobeLayers)) add('cardLab.wardrobeLayers',c.label+'.'+l.key,l.prompt);
for(const [k,v] of Object.entries(P)) if(Array.isArray(v)) for(const o of v){ if(o.id==='random'||o.meta?.uiHidden) continue; add(k+'(公開)',o.id,o.en); for(const [b,ph] of Object.entries(o.phraseByBase||{})) add(k+'.phraseByBase(公開)',o.id+'@'+b,ph); }
for(const [k,v] of Object.entries(D)) if(Array.isArray(v)) for(const o of v) add('duo.'+k,o.id,o.en);
for(const c of A.ACTION_POSE_CARDS) add('actionPoseCards',c.id, JSON.stringify(c));
for(const [s,arr] of Object.entries(hits)){ console.log(`== ${s}: ${arr.length}`); arr.slice(0,40).forEach(x=>console.log('  '+x)); }
