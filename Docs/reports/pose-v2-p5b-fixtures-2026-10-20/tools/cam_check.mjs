const R = process.env.REPO || '/Users/cooperfu/Projects/Virtual_Photography_Studio/.worktrees/pose-v2-p5b/webapp/src/lib/';
const S=await import(R+'engine/sceneIntegratedAssemblyTestSupport.js');
const {FULL_CAMERA_MATRIX}=await import(R+'engine/zImageFullBodyCameraFixtures.js');
const {REPRESENTATIVE_PROMPT_FIXTURES}=await import(R+'engine/representativePromptFixtures.js');
const {naturalFixtureLocks}=await import(R+'engine/midjourneyNaturalFixtures.js');
const {generatePrompts,createSeededRandom}=await import(R+'engine.js');
const LEG=['poseBaseId','poseOrientationId','poseArrangementId','poseHandId','posePropId','poseHeadId','poseAnchorId'];
const sec=(t,l)=>t.split(`${l}:\n`)[1]?.split('\n\n')[0]||'';
const SUG={standing:['none','specified-bratty-frustration-mock-kick'],sitting:['specified-sitting-side-fold-back-support'],kneeling:['specified-kneeling-wide-hands-front'],squatting:['none'],lying:['specified-lying-left-side-forearm']};
const res={};
for (const f of FULL_CAMERA_MATRIX) {
  const l=S.materializeSceneFixture(f); const g=x=>generatePrompts(1,x,[],{random:createSeededRandom(f.seed)})[0];
  const strip={...l}; for(const k of LEG) strip[k]='none';
  const o=g(l);
  for (const a of SUG[l.poseBaseId]) { const x=g(a==='none'?strip:{...strip,specifiedActionId:a}); const k=l.poseBaseId+'->'+a; res[k]=res[k]||{same:0,diff:0}; sec(o.grokPrompt,'Composition')===sec(x.grokPrompt,'Composition')?res[k].same++:res[k].diff++; }
}
console.log('GPT Composition section same/diff (FULL_CAMERA_MATRIX, 11 angles each):', res);
// strip-only for A rows of fixed positions
for (const f of REPRESENTATIVE_PROMPT_FIXTURES.filter(f=>/^(station|carriage)-position/.test(f.id))) {
  const l=naturalFixtureLocks(f.locks); const strip={...l}; for(const k of LEG) strip[k]='none';
  const g=x=>generatePrompts(1,x,[],{random:createSeededRandom(f.seed)})[0];
  const o=g(l), x=g(strip);
  const outs=['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt'].every(k=>o[k]===x[k]) && JSON.stringify(o.extraPrompts)===JSON.stringify(x.extraPrompts);
  const sd=Object.keys({...o.selection,...x.selection}).filter(k=>JSON.stringify(o.selection[k])!==JSON.stringify(x.selection[k]));
  console.log('strip-only', f.id, 'outputsSame', outs, 'selDiff', sd);
}
