// 模擬「只新增資料、不改 engine」：新環境光 / 新光線表現 / 新場景 會得到什麼 tags、能否在相容過濾中出現
const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const custom = [
 { group:'CameraLighting', category:'環境光條件 (Ambient Light Conditions)', zh:'春季粉霧晨光', en:'soft spring morning environment, pale pink hazy sky, gentle humid air, low-contrast distance', desc:'測試用新增環境光' },
 { group:'CameraLighting', category:'環境光條件 (Ambient Light Conditions)', zh:'室內水族館藍光', en:'indoor aquarium ambience, deep blue room brightness, dim interior air', desc:'測試用新增室內環境光' },
 { group:'CameraLighting', category:'光線表現 (Light Style)', zh:'水波折射光', en:'rippling caustic light across the subject, shifting bright bands on face and clothing', desc:'測試用新增光線表現' },
 { group:'Locations', category:'自然與戶外 (Nature & Outdoors)', zh:'戶外：京都神社參道', en:'Kyoto shrine approach, vermilion torii gate edge, gravel path, stone lantern, cedar trunks at one side', desc:'測試用新增場景' },
];
const controls = E.getLockControls(custom); const opt=k=>controls.find(c=>c.key===k).options;
const find=(k,z)=>opt(k).find(o=>o.zh===z);
for (const [k,z] of [['lightingId','春季粉霧晨光'],['lightingId','室內水族館藍光'],['lightDirectionId','水波折射光'],['locationId','戶外：京都神社參道']]) { const o=find(k,z); console.log(z, o?.id, JSON.stringify(o?.meta?.tags)); }
let ambAvail=0, ambAvail2=0, dirAvail=0, locs=0;
for (const l of opt('locationId')) { if (l.zh==='全無') continue; locs++; const r=E.getSceneDependentOptions(custom,{locationId:l.id}); if (r.lightingOptions.some(x=>x.zh==='春季粉霧晨光')) ambAvail++; if (r.lightingOptions.some(x=>x.zh==='室內水族館藍光')) ambAvail2++; if (r.lightDirectionOptions.some(x=>x.zh==='水波折射光')) dirAvail++; }
console.log({locs, '春季粉霧晨光 可用場景數':ambAvail, '室內水族館藍光 可用場景數':ambAvail2, '水波折射光 可用場景數':dirAvail});
const r0 = E.getSceneDependentOptions(custom, {});
console.log('無場景時 可見:', r0.lightingOptions.some(x=>x.zh==='春季粉霧晨光'), r0.lightDirectionOptions.some(x=>x.zh==='水波折射光'));
const ro = E.getSceneDependentOptions(custom, {sceneAttributeId:'outdoor'}); const ri = E.getSceneDependentOptions(custom, {sceneAttributeId:'indoor'});
console.log('戶外屬性 可見 春季:', ro.lightingOptions.some(x=>x.zh==='春季粉霧晨光'), ' 室內屬性 可見 水族館:', ri.lightingOptions.some(x=>x.zh==='室內水族館藍光'), ' 水波 戶外/室內:', ro.lightDirectionOptions.some(x=>x.zh==='水波折射光'), ri.lightDirectionOptions.some(x=>x.zh==='水波折射光'));
const shrine = find('locationId','戶外：京都神社參道'); const rs=E.getSceneDependentOptions(custom,{locationId:shrine.id}); console.log('新場景 可用環境光數:', rs.lightingOptions.filter(x=>x.zh!=='全無').length);
