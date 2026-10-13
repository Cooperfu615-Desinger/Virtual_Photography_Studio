import { getLockControls } from '/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js';
const c = getLockControls().find(c=>c.key==='outfitPresetId');
console.log(c.options.map(o=>o.zh).join(' / '));
