// 實跑：雙人模式（含性感/情慾互動選項）三主輸出的年齡/成人字樣。唯讀。
const { createEmptyLocks, createSeededRandom, generatePrompts } = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const st={};
for(const pose of ['erotic-fashion-photo','intimate-sensual-interaction','lazy-sensual-photo','best-friends-selfie']) for(let i=0;i<5;i++){
  const [r]=generatePrompts(1,{...createEmptyLocks(),subjectCount:'2',duoPoseId:pose},[],{random:createSeededRandom('duo'+pose+i)});
  for(const [k,t] of [['gpt',r.grokPrompt],['z',r.zImagePrompt],['ai',r.midjourneyPrompt]]){ const s=(st[k]??={n:0,age:0,adult:0}); s.n++; if(/\d{2}-year-old/.test(t)) s.age++; if(/\badult/i.test(t)) s.adult++; }
}
console.log(JSON.stringify(st));
