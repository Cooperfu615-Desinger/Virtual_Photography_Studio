const R='/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine/';
const m = await import(R+'poseComposerOptions.js');
for (const k of Object.keys(m)) {
  const v=m[k]; if(!Array.isArray(v)) {console.log(k, typeof v); continue;}
  console.log('==',k,v.length);
  const keys=new Set(); const metaKeys=new Set();
  v.forEach(o=>{Object.keys(o).forEach(x=>keys.add(x)); Object.keys(o.meta||{}).forEach(x=>metaKeys.add(x));});
  console.log(' keys',[...keys].join(','));console.log(' meta',[...metaKeys].join(','));
  console.log(' sample', JSON.stringify(v[Math.min(1,v.length-1)]).slice(0,700));
}
