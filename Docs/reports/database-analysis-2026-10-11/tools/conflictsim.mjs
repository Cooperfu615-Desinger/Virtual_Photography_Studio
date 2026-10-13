// 隨機生成統計跨欄位語意衝突：黑白風格×彩色底片、黑白底片×色光、場景內建時段×相反環境光、季節衝突
const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const N=Number(process.argv[2]||3000), SEED=Number(process.argv[3]||20261011);
const res = E.generatePrompts(N, E.createEmptyLocks(), [], { random: E.createSeededRandom(SEED) });
const monoStyle = /森山大道|細江英公|莎莉・曼/; const monoFilm = /黑白/; const colorLight = /霓虹染色光|暖金黃昏色溫|冷藍夜色光|混合色溫光|室內暖白燈色溫|局部暖光/;
const c = {N, SEED, monoStyle:0, monoStyleColorFilm:0, monoFilm:0, monoFilmColorLight:0, nightLocDayAmbient:0, nightLoc:0, snowWithSummerLoc:0, summerLoc:0, studioWithWindowDaylight:0, studioLoc:0, undergroundWithDaylight:0, undergroundLoc:0, styleNullWithLocation:0};
const ex = {};
const push=(k,v)=>{ (ex[k] ||= []).length<3 && ex[k].push(v); };
for (const r of res) {
  const st=r.structured; const style=(st.Style||[]).find(x=>/^Inspired by/.test(x?.en||'')); const loc=st.Location?.[0]; const [amb, dir]=st.Lighting||[]; const film=(st['Lens & Imaging']||[]).slice(-1)[0];
  const sz=style?.zh||'', lz=loc?.zh||'', az=amb?.zh||'', dz=dir?.zh||'', fz=film?.zh||'';
  if (monoStyle.test(sz)) { c.monoStyle++; if (fz && fz!=='全無' && !monoFilm.test(fz)) { c.monoStyleColorFilm++; push('monoStyleColorFilm',[sz,fz]); } }
  if (monoFilm.test(fz)) { c.monoFilm++; if (colorLight.test(dz)) { c.monoFilmColorLight++; push('monoFilmColorLight',[fz,dz]); } }
  if (/夜間家庭派對|蘇荷區招牌下/.test(lz)) { c.nightLoc++; if (/日光|白日|正午|晨光|藍天|積雲/.test(az)) { c.nightLocDayAmbient++; push('nightLocDayAmbient',[lz,az]); } }
  if (/向日葵|海灘|泳池|沙灘|櫻花/.test(lz)) { c.summerLoc++; if (/雪地冷光|冬季灰冷/.test(az)) { c.snowWithSummerLoc++; push('snowWithSummerLoc',[lz,az]); } }
  if (/背景|白幕|黑幕|攝影棚/.test(lz)) { c.studioLoc++; if (/室內窗邊日光|室內清晨冷白日光|室內午後柔亮日光|室內陰影日光|室內陰雨昏暗天光|室內黃昏微暖餘光|室內外光滲入/.test(az)) { c.studioWithWindowDaylight++; push('studioWithWindowDaylight',[lz,az]); } }
  if (/地下排洪道|地下狂歡|地下月台|地下 live/.test(lz)) { c.undergroundLoc++; if (/窗邊日光|清晨冷白日光|午後柔亮日光|陰影日光|陰雨昏暗天光|黃昏微暖餘光/.test(az)) { c.undergroundWithDaylight++; push('undergroundWithDaylight',[lz,az]); } }
}
console.log(JSON.stringify(c)); console.log(JSON.stringify(ex,null,0));
import fs from 'node:fs'; fs.writeFileSync(new URL(`./conflictsim_${N}_${SEED}.json`, import.meta.url), JSON.stringify({c,ex},null,1));
