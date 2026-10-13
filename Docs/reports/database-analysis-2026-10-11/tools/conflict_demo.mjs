// 實跑：角色卡 photographicDirection 場景字詞與使用者選定場景是否同時出現於輸出。唯讀。
const { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const loc=getLockControls().find(c=>c.key==='locationId').options.find(o=>/beach|沙灘|海灘/i.test(o.zh+o.en));
console.log('location:',loc?.id,loc?.zh);
for(const id of ['character-seulgi','character-nana','character-shiori']){
  const [r]=generatePrompts(1,{...createEmptyLocks(),characterProfileId:id,locationId:loc.id},[],{random:createSeededRandom('cd'+id)});
  for(const [k,t] of [['gpt',r.grokPrompt],['z',r.zImagePrompt],['ai',r.midjourneyPrompt]]){
    const hasScene=/beach|sand|sea|ocean|shore/i.test(t); const m=t.match(/neon nightclub|school-corridor|neon city street/i);
    console.log(id,k,'場景含海灘字詞:',hasScene,'| 卡片場景字詞:',m?m[0]:'-');
  }
}
