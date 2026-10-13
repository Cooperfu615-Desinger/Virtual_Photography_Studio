import { createEmptyLocks, getLockControls, getSceneDependentOptions } from '/private/tmp/claude-501/-Users-cooperfu-Projects-Virtual-Photography-Studio/80d8f708-6d6d-4e28-951d-26f07f8bdfff/scratchpad/verify/old/webapp/src/lib/engine.js';
const locs = getLockControls().find(c=>c.key==='locationId').options.filter(l=>!/全無/.test(l.zh));
const london = locs.find(l=>l.zh.includes('倫敦排屋'));
console.log('London lighting:', getSceneDependentOptions([], { ...createEmptyLocks(), locationId:london.id }).lightingOptions.map(o=>o.zh).join(', '));
const otherCommercial = ['café','bar entrance','storefront','shopfront','night market','laundromat','咖啡','夜市','商場','bookstore','bookshop','used-book','used book shop','antique book','古書','二手書店','書店'];
const res=[];
for (const l of locs) {
  const h = [l.id, l.zh, l.en, l.desc].join(' | ').toLowerCase();
  const itemH = [l.zh,l.en,l.desc].join(' | ').toLowerCase();
  if (!(l.meta?.tags||[]).includes('commercial')) continue;
  const mallSub = /mall/.test(itemH); const mallWord = /\bmall\b/.test(itemH);
  const other = otherCommercial.some(k=>itemH.includes(k));
  if (mallSub && !mallWord && !other) res.push(l.zh+' :: '+(itemH.match(/\w*mall\w*/)||[])[0]);
}
console.log('commercial ONLY via "mall" substring (no word mall, no other commercial keyword):', res.length); res.forEach(r=>console.log('  ',r));
// subterranean via 地下 but not really underground
const sub = locs.filter(l=>(l.meta?.tags||[]).includes('subterranean')).map(l=>l.zh+' :: '+([l.zh,l.en,l.desc].join(' ').match(/.{0,6}地下.{0,4}|bunker|drainage|tunnel/i)||[''])[0]);
console.log('subterranean-tagged:', sub.length); sub.forEach(s=>console.log('  ',s));
