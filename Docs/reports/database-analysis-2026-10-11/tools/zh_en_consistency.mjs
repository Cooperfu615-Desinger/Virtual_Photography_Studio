// 姿勢選項 zh 名稱與 en 的單/雙手、左右、方向一致性啟發式檢查。唯讀；diagnostic。
const P=await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine/poseComposerOptions.js');
const pub=a=>a.filter(o=>!['none','random'].includes(o.id)&&!o.meta?.uiHidden);
const rows=[];
for(const [k,arr] of Object.entries(P)) if(Array.isArray(arr)) for(const o of pub(arr)){
  const zh=o.zh, en=o.en.toLowerCase();
  if(/雙手/.test(zh) && !/\bboth\b|\bhands\b|\bpalms\b|\barms\b/.test(en)) rows.push(`${k}:${o.id} zh「${zh}」雙手 但 en 無 both/hands`);
  if(/單手/.test(zh) && !/\bone\b|\ba hand\b|\bsingle\b|\bhand\b/.test(en)) rows.push(`${k}:${o.id} zh「${zh}」單手 但 en 無 one`);
  if(/右手|左手/.test(zh) || /\b(right|left) (hand|arm|leg)\b/.test(en)) rows.push(`${k}:${o.id} 指定左右: zh「${zh}」 en「${(en.match(/\b(right|left) (hand|arm|leg)\b/)||[''])[0]}」`);
  if(!o.desc) rows.push(`${k}:${o.id} 缺 desc`);
}
console.log(rows.join('\n')||'無');
const descMissing={}; for(const [k,arr] of Object.entries(P)) if(Array.isArray(arr)) descMissing[k]=pub(arr).filter(o=>!o.desc).length; console.log('公開選項缺 desc:',JSON.stringify(descMissing));
