const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const P = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/page3WorldScene.js');
const O = P.PAGE3_WORLD_SCENE_FIELD_OPTIONS; const pick=(k)=>(O[k]||[]).find(o=>o.en && o.id!=='none')?.id||'';
const loc = P.WORLD_SCENE_LOCATIONS[0];
const profile = { ...P.createEmptyPage3WorldSceneProfile(), worldLocation: loc.id, sceneMode: pick('sceneMode'), cameraSystem:pick('cameraSystem'), shootingMethod:pick('shootingMethod'), focalViewpoint:pick('focalViewpoint'), imagingStyle:pick('imagingStyle'), ambientLight:pick('ambientLight') };
const arch = P.buildPage1WorldSceneArchitecture(profile);
console.log('arch has camLayer:', /PAGE3 camera and environment layer/.test(arch.text));
let hits={};
for (let i=0;i<30;i++){ const [p]=E.generatePrompts(1,{...E.createEmptyLocks(),subjectCount:'1',locationId:'',fixedCompositionSetId:'none',importedWorldSceneMode:'architecture',importedWorldSceneLabel:arch.label,importedWorldSceneArchitectureText:arch.text},[],{random:E.createSeededRandom('c8b'+i)});
 const outs={gpt:p.grokPrompt,z:p.zImagePrompt,mj:p.midjourneyPrompt,nb:p.nanoBananaPrompt||'',...Object.fromEntries(p.extraPrompts.map(e=>[e.id,e.text]))};
 for (const [k,v] of Object.entries(outs)) { if (/PAGE3 camera and environment layer/.test(v)) hits[k+':cam']=(hits[k+':cam']||0)+1; if (/real-place guards/.test(v)) hits[k+':guards']=(hits[k+':guards']||0)+1; }
 if(i===0){ const t=p.extraPrompts.find(e=>e.id==='chest-up-portrait').text; const j=t.indexOf('PAGE3'); console.log('chest sample:', j>=0? t.slice(j,j+100):'none'); } }
console.log('n=30', hits);
