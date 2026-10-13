const { CHARACTER_PROFILE_OPTIONS:O } = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine/characterProfiles.js');
const g=id=>O.find(o=>o.id===id);
for (const id of process.argv.slice(2)) { const c=g(id); console.log('=====',c.zh); for (const f of ['facialGeometry','eyeSignature','noseSignature','mouthSignature','skinSignature','makeup','body','distinctiveFeatures','identityAndBody']) console.log(f+':',c.profile[f]); console.log('bodyProjection:',JSON.stringify(c.profile.bodyProjection)); }
