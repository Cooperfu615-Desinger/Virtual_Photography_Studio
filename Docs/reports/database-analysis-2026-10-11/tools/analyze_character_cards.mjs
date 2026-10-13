// 角色卡 (characterProfiles.js) 量化分析。唯讀。用法: node analyze_character_cards.mjs <out.md>
import fs from 'node:fs';
const ROOT='/Users/cooperfu/Projects/Virtual_Photography_Studio';
const { CHARACTER_PROFILE_OPTIONS } = await import(ROOT+'/webapp/src/lib/engine/characterProfiles.js');
const out=[]; const p=(...a)=>out.push(a.join(' '));
const cards=CHARACTER_PROFILE_OPTIONS.filter(o=>o.profile);
p(`## 角色卡總數: ${cards.length} (選項總數含 none: ${CHARACTER_PROFILE_OPTIONS.length})`);
const FIELDS=['facialGeometry','eyeSignature','noseSignature','mouthSignature','skinSignature','makeup','body','distinctiveFeatures','identityAndBody','legacyIdentityAndBody','hair','outfit','accessories','photographicDirection','bodyProjection'];
const wc=s=>String(s||'').trim().split(/\s+/).filter(Boolean).length;
p('\n## 逐欄覆蓋率與字數 (words)');
p('| 欄位 | 覆蓋 | min | 中位 | max | 最短卡 | 最長卡 |'); p('|---|---|---|---|---|---|---|');
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
for(const f of FIELDS){
  const has=cards.filter(c=>{const v=c.profile[f]; return v && (typeof v==='string'? v.trim(): Object.keys(v).length);});
  if(f==='bodyProjection'){ p(`| ${f} | ${has.length}/${cards.length} | - | - | - | - | - |`); continue;}
  const ws=has.map(c=>[wc(c.profile[f]),c.zh]);
  if(!ws.length){p(`| ${f} | 0/${cards.length} |`);continue;}
  ws.sort((a,b)=>a[0]-b[0]);
  p(`| ${f} | ${has.length}/${cards.length} | ${ws[0][0]} | ${med(ws.map(x=>x[0]))} | ${ws.at(-1)[0]} | ${ws[0][1]} | ${ws.at(-1)[1]} |`);
}
const extra=[['option.en',c=>c.en],['meta.referenceImage',c=>c.meta?.referenceImage],['referenceImages(meta 或 option)',c=>c.referenceImages||c.meta?.referenceImages]];
for(const [n,g] of extra){ const k=cards.filter(c=>{const v=g(c);return Array.isArray(v)?v.length:Boolean(v);}).length; p(`| ${n} | ${k}/${cards.length} | | | | | |`);}
const enw=cards.map(c=>[wc(c.en),c.zh]).sort((a,b)=>a[0]-b[0]);
p(`\noption.en 字數: min ${enw[0][0]} (${enw[0][1]}) / 中位 ${med(enw.map(x=>x[0]))} / max ${enw.at(-1)[0]} (${enw.at(-1)[1]})`);
p(`identityAndBody === legacyIdentityAndBody: ${cards.filter(c=>c.profile.identityAndBody===c.profile.legacyIdentityAndBody).length}/${cards.length}`);
// 四錨點
p('\n## distinctiveFeatures 四錨點檢查');
const STYLE=/\b(hair|bangs|fringe|ponytail|lipstick|eyeliner|eyeshadow|blush|makeup|glasses|eyewear|earring|necklace|choker|dress|jacket|outfit|hood|cap)\b/i;
const MARK=/\b(mole|beauty mark|freckle|horn|sigil|tattoo|marking|scar|dimple|linework|red eyes|crimson)\b/i;
let anchorIssues=[]; let withMark=0;
for(const c of cards){
  const a=c.profile.distinctiveFeatures.split(',').map(s=>s.trim()).filter(Boolean);
  if(a.length!==4) anchorIssues.push(`${c.zh}: ${a.length} 個錨點`);
  a.forEach((x,i)=>{ if(STYLE.test(x)) anchorIssues.push(`${c.zh} 錨點${i+1} 含造型詞: "${x.slice(0,60)}"`);});
  if(MARK.test(c.profile.distinctiveFeatures)) withMark++;
  // 錨點是否只是 facialGeometry 的重述
}
p(`- 錨點數 ≠4 或含可替換造型詞: ${anchorIssues.length? '\n  - '+anchorIssues.join('\n  - '):'無'}`);
p(`- 含「非幾何」永久標記 (痣/雀斑/角/紋/疤等) 的卡: ${withMark}/${cards.length}；其餘僅以臉/眼/鼻/唇幾何作錨點`);
// 錨點與 facialGeometry 字詞重疊（越高=錨點只是重述）
// 文字相似度：TF-IDF cosine
const STOP=new Set('a an and the with of in to slightly softly gently subtle subtly soft small set its her'.split(' '));
const tok=s=>(String(s).toLowerCase().match(/[a-z][a-z\-]+/g)||[]).filter(w=>!STOP.has(w));
function tfidfSim(docs){
  const df=new Map(); docs.forEach(d=>new Set(d).forEach(w=>df.set(w,(df.get(w)||0)+1)));
  const N=docs.length; const vecs=docs.map(d=>{const tf=new Map(); d.forEach(w=>tf.set(w,(tf.get(w)||0)+1)); const v=new Map(); for(const [w,n] of tf) v.set(w,n*Math.log((N+1)/(df.get(w)+1)+1)); const norm=Math.sqrt([...v.values()].reduce((s,x)=>s+x*x,0)); for(const [w,x] of v) v.set(w,x/norm); return v;});
  return (i,j)=>{let s=0; for(const [w,x] of vecs[i]) if(vecs[j].has(w)) s+=x*vecs[j].get(w); return s;};
}
const IDF=['facialGeometry','eyeSignature','noseSignature','mouthSignature','skinSignature'];
const docs=cards.map(c=>tok(IDF.map(f=>c.profile[f]).join(' ')));
const sim=tfidfSim(docs);
const pairs=[];
for(let i=0;i<cards.length;i++) for(let j=i+1;j<cards.length;j++) pairs.push([sim(i,j),cards[i].zh,cards[j].zh,i,j]);
pairs.sort((a,b)=>b[0]-a[0]);
const allS=pairs.map(x=>x[0]);
p(`\n## 角色卡五官結構相似度 (TF-IDF cosine；facial+eye+nose+mouth+skin；${pairs.length} 對)`);
p(`平均 ${(allS.reduce((a,b)=>a+b,0)/allS.length).toFixed(3)}，中位 ${med(allS).toFixed(3)}，最高 ${allS[0].toFixed(3)}`);
p('| 排名 | 卡 A | 卡 B | cosine | 各欄 cosine (face/eye/nose/mouth/skin) |'); p('|---|---|---|---|---|');
const perField=IDF.map(f=>tfidfSim(cards.map(c=>tok(c.profile[f]))));
pairs.slice(0,12).forEach((x,k)=>p(`| ${k+1} | ${x[1]} | ${x[2]} | ${x[0].toFixed(3)} | ${perField.map(fn=>fn(x[3],x[4]).toFixed(2)).join(' / ')} |`));
// 各卡最近鄰
p('\n### 每張卡的最近鄰 (cosine)');
const nn=cards.map((c,i)=>{let best=[-1,null];cards.forEach((d,j)=>{if(i!==j){const s=sim(i,j); if(s>best[0]) best=[s,d.zh];}});return [c.zh,best[1],best[0]];});
nn.sort((a,b)=>b[2]-a[2]); p(nn.map(x=>`${x[0]}→${x[1]} ${x[2].toFixed(2)}`).join('；'));
// 全身 identityAndBody 相似度
const docs2=cards.map(c=>tok(c.profile.identityAndBody)); const sim2=tfidfSim(docs2); const pr2=[];
for(let i=0;i<cards.length;i++) for(let j=i+1;j<cards.length;j++) pr2.push([sim2(i,j),cards[i].zh,cards[j].zh]);
pr2.sort((a,b)=>b[0]-a[0]); p('\n### legacy identityAndBody 最相似前 5: '+pr2.slice(0,5).map(x=>`${x[1]}↔${x[2]} ${x[0].toFixed(2)}`).join('；'));
// 單一屬性分佈
p('\n## 屬性分佈 (從結構化欄位抽取關鍵詞)');
const count=(arr)=>{const m={};arr.forEach(x=>m[x]=(m[x]||0)+1);return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join(', ');};
const pick=(s,list)=>list.find(w=>new RegExp('\\b'+w+'\\b','i').test(s))||'other';
p('- 臉型 (facialGeometry 首個命中): '+count(cards.map(c=>pick(c.profile.facialGeometry,['heart-oval','oval-heart','near-round','round','oval']))));
p('- 眼色: '+count(cards.map(c=>pick(c.profile.eyeSignature,['crimson','red','blue','green','gray-green','hazel','amber','olive','gray','brown']))));
p('- 眼型: '+count(cards.map(c=>pick(c.profile.eyeSignature,['round-almond','almond','round']))));
p('- 鼻梁: '+count(cards.map(c=>pick(c.profile.noseSignature,['high','medium-high','medium','low','narrow']))));
p('- 膚色: '+count(cards.map(c=>pick(c.profile.skinSignature,['olive','beige','porcelain','ivory','pale','fair','light']))));
p('- 下巴: '+count(cards.map(c=>pick(c.profile.facialGeometry,['pointed','rounded','round','compact']))));
// identityAndBody 與結構化欄位矛盾檢查：眼色
p('\n## identityAndBody vs 結構化欄位 一致性 (自動比對)');
const EYE=['crimson','red','blue','gray-green','green','hazel','amber','olive','gray','brown','black'];
const colorsIn=(s,ctx)=>{ // 取 "eyes" 前 6 個詞內顏色
  const m=[...String(s).toLowerCase().matchAll(/((?:[a-z\-]+\s){0,6})eyes/g)].map(x=>x[1]).join(' ');
  return EYE.filter(w=>new RegExp('\\b'+w+'\\b').test(m));};
let mism=[];
for(const c of cards){ const a=colorsIn(c.profile.identityAndBody), b=colorsIn(c.profile.eyeSignature+' eyes');
  if(a.length && b.length && !a.some(x=>b.includes(x))) mism.push(`${c.zh}: identityAndBody 眼色 [${a}] vs eyeSignature [${b}]`);
  const fa=/heart/.test(c.profile.identityAndBody), fb=/heart/.test(c.profile.facialGeometry);
  if(fa!==fb) mism.push(`${c.zh}: 臉型 heart 字樣 identityAndBody=${fa} facialGeometry=${fb}`);
  const ra=/\bround(ed)? (face|eyes)\b|round-set/.test(c.profile.identityAndBody);
  const freckA=/freckle/.test(c.profile.identityAndBody), freckB=/freckle/.test(IDF.map(f=>c.profile[f]).join(' ')+c.profile.distinctiveFeatures);
  if(freckA!==freckB) mism.push(`${c.zh}: 雀斑 identityAndBody=${freckA} 結構化=${freckB}`);
  const moleA=/mole|beauty mark/.test(c.profile.identityAndBody), moleB=/mole|beauty mark/.test(c.profile.distinctiveFeatures+c.profile.skinSignature);
  if(moleA!==moleB) mism.push(`${c.zh}: 痣 identityAndBody=${moleA} 結構化=${moleB}`);
}
p(mism.length? mism.map(x=>'- '+x).join('\n'):'- 無自動偵測到的矛盾');
// 模糊/主觀詞
p('\n## 規格禁止的模糊片語命中 (character-card-facial-identity.md Writing rules)');
const VAGUE=/doll-like|soft beautiful face|large pretty eyes|small refined nose|glowing skin|seductive expression|idol-like|beauty\b|beautiful|gorgeous|kawaii|cute/gi;
const vagueRows=[];
for(const c of cards){ for(const f of ['en','identityAndBody',...IDF,'makeup','body','distinctiveFeatures']){ const s=f==='en'?c.en:c.profile[f]; const h=[...new Set((String(s).match(VAGUE)||[]).map(x=>x.toLowerCase()))]; if(h.length) vagueRows.push([c.zh,f,h.join('/')]); } }
const byField={}; vagueRows.forEach(r=>byField[r[1]]=(byField[r[1]]||0)+1);
p('依欄位命中卡數: '+JSON.stringify(byField));
p(vagueRows.filter(r=>!['en','identityAndBody'].includes(r[1])).map(r=>`- ${r[0]} / ${r[1]}: ${r[2]}`).join('\n')||'- 結構化欄位無命中');
// en (option-level) 內表情/視線 (A 區責任外)
p('\n## option.en / identityAndBody 內的表情、視線字詞 (身份欄位責任外)');
const EXPR=/\b(expression|gaze|smile|smiling|pout|looking)\b/i;
for(const c of cards){ const a=EXPR.test(c.en), b=EXPR.test(c.profile.identityAndBody); if(a||b) p(`- ${c.zh}: en=${a?(c.en.match(EXPR)[0]):'-'} identityAndBody=${b?(c.profile.identityAndBody.match(EXPR)[0]):'-'}`);}
// 成年身份
p('\n## 成年身份字串');
const adult=s=>/\b(20|2\d)-year-old adult\b/.test(s);
p(`- option.en 含 "20-year-old adult": ${cards.filter(c=>adult(c.en)).length}/${cards.length}`);
p(`- identityAndBody 含: ${cards.filter(c=>adult(c.profile.identityAndBody)).length}/${cards.length}`);
p(`- 結構化欄位(含 distinctiveFeatures) 含 adult/年齡: ${cards.filter(c=>/adult|year-old/.test(IDF.concat(['makeup','body','distinctiveFeatures']).map(f=>c.profile[f]).join(' '))).length}/${cards.length}`);
const ages=[...new Set(cards.map(c=>(c.en.match(/(\d+)-year-old/)||[])[1]))]; p(`- 年齡值種類: ${ages}`);
const YOUNGW=/\b(young|youthful|girl|girlish|childlike|teen|kawaii|baby|innocent|doll-like)\b/gi;
const yRows=cards.map(c=>[c.zh,[...new Set((c.en+' '+JSON.stringify(c.profile)).match(YOUNGW)||[])].map(x=>x.toLowerCase())]).filter(x=>x[1].length);
p(`- 含年輕化/娃娃感詞的卡: ${yRows.length}/${cards.length} → `+yRows.map(x=>`${x[0]}(${x[1].join('/')})`).join('；'));
// manifest + public assets
p('\n## 參考圖 manifest / 檔案');
const man=JSON.parse(fs.readFileSync(ROOT+'/knowledge_base/character_reference_manifest.json','utf8'));
const mids=new Set(man.items.map(i=>i.id));
p(`- manifest 項目 ${man.items.length}；卡片不在 manifest: ${cards.filter(c=>!mids.has(c.id)).map(c=>c.id).join(',')||'無'}；manifest 多餘: ${[...mids].filter(id=>!cards.find(c=>c.id===id)).join(',')||'無'}`);
const missPub=cards.filter(c=>!fs.existsSync(ROOT+'/webapp/public/'+c.meta.referenceImage)).map(c=>c.meta.referenceImage);
p(`- meta.referenceImage 對應 public 檔不存在: ${missPub.join(',')||'無'}`);
const missSrc=man.items.filter(i=>!fs.existsSync(`${ROOT}/source-assets/character-cards/${i.directory}/${i.source}`)).map(i=>i.directory+'/'+i.source);
p(`- manifest source 原圖不存在: ${missSrc.length} 筆 ${missSrc.slice(0,5).join(',')}`);
let srcCounts=[]; for(const i of man.items){ const d=`${ROOT}/source-assets/character-cards/${i.directory}`; srcCounts.push([i.directory, fs.existsSync(d)? fs.readdirSync(d).filter(f=>!f.startsWith('.')).length:0]); }
p(`- source-assets 每卡原圖數: `+srcCounts.map(x=>`${x[0]}:${x[1]}`).join(', '));
// 身形 body 分佈
p('\n## body 欄位類型分佈');
p(count(cards.map(c=>pick(c.profile.body,['petite','tall','athletic','curvy','hourglass','slender','slim']))));
// 卡片名稱編號
p('\n## 卡片 zh 編號: '+cards.map(c=>c.zh).join(', '));
fs.writeFileSync(process.argv[2], out.join('\n')); console.log(out.join('\n'));
