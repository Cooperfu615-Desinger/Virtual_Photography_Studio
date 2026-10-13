const ROOT = process.env.ROOT || '/Users/cooperfu/Projects/Virtual_Photography_Studio';
const E = await import(ROOT+'/webapp/src/lib/engine.js');
const P = await import(ROOT+'/webapp/src/lib/page3WorldScene.js');
const O = P.PAGE3_WORLD_SCENE_FIELD_OPTIONS;
const pick = (k,i=1) => (O[k]||[])[i]?.id || '';
const locsWithGuards = P.WORLD_SCENE_LOCATIONS.filter(l=>l.realismGuards?.length);
console.log('world locations', P.WORLD_SCENE_LOCATIONS.length, 'with realismGuards', locsWithGuards.length);
const pats = { camLayer:/PAGE3 camera and environment layer/i, guards:/real-place guards/i, archLead:/world-scene architecture for the portrait/i };
const tally={}; let n=0; let sample='';
for (const [li,loc] of locsWithGuards.slice(0,10).entries()) for (const withCam of [false,true]) for (const s of ['a','b']) {
  const profile = { ...P.createEmptyPage3WorldSceneProfile(), worldLocation: loc.id, sceneMode: pick('sceneMode'), ...(withCam?{cameraSystem:pick('cameraSystem'), shootingMethod:pick('shootingMethod'), focalViewpoint:pick('focalViewpoint'), imagingStyle:pick('imagingStyle'), ambientLight:pick('ambientLight')}:{}) };
  const arch = P.buildPage1WorldSceneArchitecture(profile);
  const locks = { ...E.createEmptyLocks(), subjectCount:'1', locationId:'', fixedCompositionSetId:'none', fixedSetPositionId:'none', fixedSetCaptureModeId:'photographer-shot', fixedSetPerformanceStateId:'model-natural', importedWorldSceneMode:'architecture', importedWorldSceneLabel:arch.label, importedWorldSceneArchitectureText:arch.text };
  const [p] = E.generatePrompts(1, locks, [], { random: E.createSeededRandom(loc.id+s+withCam) }); n++;
  const outs = { gpt:p.grokPrompt, z:p.zImagePrompt, mj:p.midjourneyPrompt, nb:p.nanoBananaPrompt||'', ...Object.fromEntries((p.extraPrompts||[]).map(e=>[e.id,e.text])) };
  for (const [k,v] of Object.entries(outs)) for (const [pn,r] of Object.entries(pats)) if (r.test(v)) { const key=k+':'+pn+(withCam?':cam':':nocam'); tally[key]=(tally[key]||0)+1; if(!sample && pn!=='archLead'){ const i=v.search(r); sample=k+' :: '+v.slice(i,i+120);} }
}
console.log('runs', n); console.log(tally); console.log('sample', sample);
