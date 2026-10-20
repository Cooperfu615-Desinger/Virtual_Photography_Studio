const R = process.env.REPO || '/Users/cooperfu/Projects/Virtual_Photography_Studio/.worktrees/pose-v2-p5b/webapp/src/lib/';
const S=await import(R+'engine/sceneIntegratedAssemblyTestSupport.js');
const {CLOSE_WORM_CASES}=await import(R+'engine/closeWormEyeFixtures.js');
const {generatePrompts,createSeededRandom}=await import(R+'engine.js');
const LEG=['poseBaseId','poseOrientationId','poseArrangementId','poseHandId','posePropId','poseHeadId','poseAnchorId'];
const re=/lens almost against her thighs|head recede sharply above/;
let n={orig:0,none:0,kick:0,any:0,total:0};
for (const f of CLOSE_WORM_CASES.filter(f=>f.expectedKind!=='neutral')) {
  const l=S.materializeSceneFixture(f); n.total++;
  const g=(x)=>generatePrompts(1,x,[],{random:createSeededRandom(f.seed)})[0];
  const strip={...l}; for(const k of LEG) strip[k]='none';
  const o=g(l), a=g(strip), k=g({...strip,specifiedActionId:'specified-bratty-frustration-mock-kick'}), y=g({...strip,specifiedActionId:'any'});
  if(re.test(o.grokPrompt+o.zImagePrompt)) n.orig++; if(re.test(a.grokPrompt+a.zImagePrompt)) n.none++; if(re.test(k.grokPrompt+k.zImagePrompt)) n.kick++; if(re.test(y.grokPrompt+y.zImagePrompt)) n.any++;
}
console.log('close-worm standing near-contact wording present:', n);
