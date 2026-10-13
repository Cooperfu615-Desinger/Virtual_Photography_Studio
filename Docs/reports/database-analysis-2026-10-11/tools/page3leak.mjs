// 實測 PAGE3 匯入 PAGE1 的世界場景文字，是否把內部控制語帶進公開 prompt
const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const P3 = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/page3WorldScene.js');
const prof = { sceneMode:'street', worldLocation:'taipei-ximending-red-house-pedestrian', ambientLight:'neon-mixed-light', cameraSystem:'ricoh-gr' };
const arch = P3.buildPage1WorldSceneArchitecture(prof);
console.log('ARCH TEXT:', arch.text.slice(0,600));
const locks = {...E.createEmptyLocks(), subjectCount:'1', importedWorldSceneMode:'architecture', importedWorldSceneArchitectureText: arch.text, importedWorldSceneLabel: arch.label};
const [r] = E.generatePrompts(1, locks, [], {random:E.createSeededRandom(5)});
const PH = ['PAGE3','real-place guards','do not let the world scene','avoid a plain empty backdrop','portrait-friendly spatial anchor','camera and environment layer','avoid generic'];
for (const k of ['grokPrompt','zImagePrompt','midjourneyPrompt']) console.log(k, PH.filter(p=>r[k].includes(p)));
(r.extraPrompts||[]).forEach((x,i)=>console.log('extra',i,x.id||x.label, PH.filter(p=>x.text.includes(p))));
for (const k of ['grokPrompt','zImagePrompt','midjourneyPrompt']) console.log(k, 'Ximending?', r[k].includes('Ximending'), '| scene excerpt:', (r[k].match(/[^.\n]*Ximending[^.\n]*/)||[''])[0].slice(0,300));
const ex0 = r.extraPrompts[0].text; console.log('extra0 excerpt:', (ex0.match(/[^\n]*PAGE3[^\n]*/)||[''])[0].slice(0,500));
