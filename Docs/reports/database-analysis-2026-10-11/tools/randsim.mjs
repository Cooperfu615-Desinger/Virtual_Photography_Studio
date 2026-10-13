// 隨機生成 N 次（固定 seed），統計 場景/環境光/光線表現/攝影風格 實際被抽中的分佈
import fs from 'node:fs';
const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const N = Number(process.argv[2]||2000), SEED = Number(process.argv[3]||20261011);
const rnd = E.createSeededRandom(SEED);
const res = E.generatePrompts(N, E.createEmptyLocks(), [], { random: rnd });
const tally = {style:{}, location:{}, lighting:{}, lightDir:{}, styleWithLocation:{}, locCat:{}};
const inc=(m,k)=>m[k]=(m[k]||0)+1;
let errs=0;
for (const r of res) {
  const st = r.structured; if(!st){errs++;continue;}
  const style = (st.Style||[]).find(x=>x && x.category==='攝影風格' || (x&&x.en&&/^Inspired by/.test(x.en)));
  const loc = st.Location?.[0]; const [lt, ld] = st.Lighting||[];
  inc(tally.style, style?.zh||'(none)'); inc(tally.location, loc?.zh||'(none)'); inc(tally.lighting, lt?.zh||'(none)'); inc(tally.lightDir, ld?.zh||'(none)');
  if (loc && loc.zh!=='全無') inc(tally.styleWithLocation, style?.zh||'(none)');
}
const controls = E.getLockControls(); const all = k=>controls.find(c=>c.key===k).options.map(o=>o.zh);
tally.neverStyle = all('styleId').filter(z=>!tally.style[z]);
tally.neverStyleWithLocation = all('styleId').filter(z=>!tally.styleWithLocation[z]);
tally.neverLocation = all('locationId').filter(z=>!tally.location[z]);
tally.neverLighting = all('lightingId').filter(z=>!tally.lighting[z]);
tally.neverLightDir = all('lightDirectionId').filter(z=>!tally.lightDir[z]);
tally.meta = {N, SEED, errs};
fs.writeFileSync(new URL(`./randsim_${N}_${SEED}.json`, import.meta.url), JSON.stringify(tally,null,1));
const top = m=>Object.entries(m).sort((a,b)=>b[1]-a[1]);
console.log('meta', tally.meta);
console.log('style dist', top(tally.style).slice(0,40));
console.log('neverStyle', tally.neverStyle, 'neverStyleWithLocation', tally.neverStyleWithLocation);
console.log('neverLocation', tally.neverLocation.length, tally.neverLocation.slice(0,20));
console.log('neverLighting', tally.neverLighting, 'neverLightDir', tally.neverLightDir);
console.log('location none share', tally.location['全無']||0, tally.location['(none)']||0);
console.log('lighting top', top(tally.lighting).slice(0,8), 'lightDir top', top(tally.lightDir).slice(0,8));
