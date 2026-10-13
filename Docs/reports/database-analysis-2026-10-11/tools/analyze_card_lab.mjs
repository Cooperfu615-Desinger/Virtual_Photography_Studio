// characterCardLab.js 與 characterProfiles.js 的雙來源一致性、髮型變體覆蓋。唯讀。
import fs from 'node:fs';
const R='/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/';
const { CHARACTER_PROFILE_OPTIONS:O } = await import(R+'engine/characterProfiles.js');
const lab = await import(R+'characterCardLab.js');
const control=[{key:'characterProfileId',options:O}];
const cards=lab.getCharacterCardOptions(control);
const out=[]; const p=(...a)=>out.push(a.join(' '));
p(`## characterCardLab: 卡數 ${cards.length}；圖層鍵 ${lab.CHARACTER_CARD_LAYER_KEYS.length}；髮型變體 ${lab.HAIR_VARIANT_OPTIONS.length}`);
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
let drift=[], layerCount=[], noLayers=[];
for(const c of cards){
  const prof=c.sourceOption.profile; const src=norm((prof.outfit||'')+' '+(prof.accessories||''));
  const layers=Object.values(c.defaultWardrobeLayers);
  layerCount.push(layers.length); if(!layers.length) noLayers.push(c.label);
  for(const l of layers){ if(!src.includes(norm(l.prompt))) drift.push(`${c.label}.${l.key}: "${l.prompt.slice(0,70)}"`); }
}
p(`- 每卡預設穿搭圖層數: min ${Math.min(...layerCount)} / max ${Math.max(...layerCount)}；無圖層卡: ${noLayers.join(',')||'無'}`);
p(`- 圖層文字不是 profile.outfit/accessories 子字串 (雙來源漂移候選): ${drift.length} 筆`); drift.slice(0,15).forEach(x=>p('  - '+x));
// hair variants
const hv=cards.map(c=>[c.label, lab.getCompatibleHairVariants(c).length-1, c.hairTags.join('/')]);
hv.sort((a,b)=>a[1]-b[1]);
p(`- 每卡可用髮型變體 (不含 default): `+hv.map(x=>`${x[0]}:${x[1]}`).join(', '));
p(`- 無 hairTags 的卡: ${cards.filter(c=>!c.hairTags.length).map(c=>c.label).join(',')||'無'}`);
// hairTags vs hair 文字一致性
const chk=[]; for(const c of cards){ const h=c.baseHair.toLowerCase(); const t=new Set(c.hairTags);
  if(t.has('long') && /\b(bob|short|chin-length|jaw-length)\b/.test(h) && !/long/.test(h)) chk.push(`${c.label}: tag long 但 hair="${h.slice(0,50)}"`);
  if((t.has('bob')||t.has('short')) && /\b(very long|waist-length|long loose|long wavy|long straight)\b/.test(h)) chk.push(`${c.label}: tag short/bob 但 hair="${h.slice(0,50)}"`);
}
p(`- hairTags 與 hair 文字矛盾候選: ${chk.length? chk.join('；'):'無'}`);
// extension 存在與否
const src=fs.readFileSync(R+'characterCardLab.js','utf8');
const ext=[...src.matchAll(/^  '(character-[a-z0-9-]+)': \{/gm)].map(m=>m[1]);
p(`- CHARACTER_CARD_EXTENSIONS 條目: ${ext.length}；缺 extension 的卡: ${cards.filter(c=>!ext.includes(c.id)).map(c=>c.id).join(',')||'無'}`);
fs.writeFileSync(process.argv[2],out.join('\n')); console.log(out.join('\n'));
