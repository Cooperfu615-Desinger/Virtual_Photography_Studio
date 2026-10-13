const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const controls = E.getLockControls();
for (const c of controls) console.log(c.key, (c.options||[]).length);
const loc = controls.find(c=>c.key==='locationId');
console.log(JSON.stringify(loc.options[3]).slice(0,500));
