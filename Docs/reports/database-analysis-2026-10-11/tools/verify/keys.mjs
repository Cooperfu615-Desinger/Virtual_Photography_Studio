import { getLockControls } from '/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js';
for (const c of getLockControls()) console.log(c.key, c.multi?'[multi]':'', c.options.length, (c.label||c.zh||''), '|', c.options.slice(0,3).map(o=>o.id+':'+o.zh).join(' ; '));
