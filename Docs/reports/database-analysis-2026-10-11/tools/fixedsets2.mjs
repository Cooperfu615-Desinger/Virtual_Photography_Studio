const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const controls = E.getLockControls(); const o=k=>controls.find(c=>c.key===k).options;
const set = o('fixedCompositionSetId').find(s=>s.zh===process.argv[2]); const amb=o('lightingId').find(s=>s.zh===process.argv[3]);
const locks={...E.createEmptyLocks(), subjectCount:'1', fixedCompositionSetId:set.id, lightingId:amb.id};
const res = E.generatePrompts(20, locks, [], {random:E.createSeededRandom(3)});
const r=res[0]; const key = amb.en.split(',')[0]; const ov = ['snow','studio','high-key','moon','midday','night'];
console.log('structured lighting:', (r.structured.Lighting||[]).map(x=>x.zh));
for (const k of ['grokPrompt','zImagePrompt','midjourneyPrompt']) console.log(k, (r[k].match(/[^.\n]*(snow|high-key|studio environment|moonlit|midday)[^.\n]*/i)||['-'])[0].slice(0,220));
console.log('set en has night?', /night/i.test(set.en), '| set en has light words:', (set.en.match(/\b(light|lit|glow|daylight|sunlight|night|dusk|sunset|lamp)\w*\b/gi)||[]).slice(0,8));
