// 依 scene-section-c / photography-section-d 撰寫規範逐條檢核資料
import fs from 'node:fs';
const db = JSON.parse(fs.readFileSync('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/data/database.json','utf8'));
const wc=s=>s.trim().split(/\s+/).length;
const L=db.Locations, CL=db.CameraLighting;
const other = L['其他專屬場景 (Other Dedicated Scenes)'].map(e=>({zh:e.zh, words:wc(e.en), hasBase:/ground plane|surface|scene base/.test(e.en), extraEnv:(e.en.match(/\b(room|street|sky|camera|lens|wearing|pose)\b/gi)||[])}));
const solid = Object.values(L).flat().filter(e=>/horizonless seamless/.test(e.en)).map(e=>({zh:e.zh, contact:/subtle natural contact shadow under the subject/.test(e.en), continuous:/continuous .*ground-and-background plane/.test(e.en), noPaper:/no paper roll/.test(e.en), noStand:/no backdrop stand/.test(e.en), noLight:/no light stands/.test(e.en), noEquip:/no studio equipment/.test(e.en), noCorner:/no wall corner/.test(e.en), noSeam:/no floor seam/.test(e.en), noCeil:/no ceiling/.test(e.en), noTubes:/no fluorescent tubes/.test(e.en)}));
const solidFail = solid.filter(s=>Object.entries(s).some(([k,v])=>k!=='zh'&&v===false));
const amb = CL['環境光條件 (Ambient Light Conditions)'].filter(e=>e.zh!=='全無');
const ambRules = amb.map(e=>({zh:e.zh, subjectWord:/\b(on the subject|subject lighting|key light|rim light|facial illumination|skin|hair|clothing)\b/i.test(e.en), physicalSource:/\b(candle|lamp|streetlight|fluorescent|led|visible source)\b/i.test(e.en), indoorExteriorNoIfVisible: /^室內/.test(e.zh) && /\b(exterior|window|sky)\b/i.test(e.en) && !/if visible/.test(e.en)}));
const ls = CL['光線表現 (Light Style)'].filter(e=>e.zh!=='全無');
const lsRules = ls.map(e=>({zh:e.zh, landsOnSubject:/\b(subject|face|skin|hair|shoulder|body|clothing|shadow|highlight|cheek|chin|neck|torso|nose|brow|facial|contour|outline)\b/i.test(e.en), sceneWord:/\b(sky|weather|street|room|interior|city)\b/i.test(e.en)}));
const lens = CL['鏡頭焦段 (Focal Length)'].filter(e=>e.zh!=='全無').map(e=>({zh:e.zh, startsShotOn:/^shot on/i.test(e.en)}));
const styles = db.Regional['攝影風格'].map(e=>({zh:e.zh, inspired:/^Inspired by/.test(e.en), words:wc(e.en), forbidden:(e.en.match(/\b(sensual|skin rendering|body tension)\b/gi)||[])}));
const geo = ['景別構圖 (Framing)','相機視角 (Angle)','拍攝方位 (Orbit Angle)'].flatMap(c=>CL[c].filter(e=>e.zh!=='全無').map(e=>({cat:c, zh:e.zh, emo:(e.en.match(/\b(dominance|vulnerable|cute|unsettling|cinematic tension|heroic|dynamic pose)\b/gi)||[])}))).filter(x=>x.emo.length);
const out = { other, solidCount:solid.length, solidFail, ambFail: ambRules.filter(r=>r.subjectWord||r.physicalSource||r.indoorExteriorNoIfVisible), lsFail: lsRules.filter(r=>!r.landsOnSubject||r.sceneWord), lensFail: lens.filter(x=>!x.startsShotOn), stylesFail: styles.filter(s=>!s.inspired||s.forbidden.length||s.words<14||s.words>26), geoEmotion: geo };
console.log(JSON.stringify(out,null,1));
fs.writeFileSync(new URL('./guiderules.json', import.meta.url), JSON.stringify(out,null,1));
