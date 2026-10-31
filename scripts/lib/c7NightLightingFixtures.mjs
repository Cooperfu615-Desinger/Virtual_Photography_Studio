import assert from 'node:assert/strict';
import {resolveCapture} from '../../webapp/src/lib/observationCaptureMode.js';
export const BASE='0cf5d7650ffe8be606c9ddb165809c6b826d2669';
export const NIGHT_SCENE='locations:生活感室內-indoor-lifestyle:室內-夜間家庭派對:2';
export const DAY_LIGHTS=[
 'camera:環境光條件-ambient-light-conditions:室內窗邊日光:19',
 'camera:環境光條件-ambient-light-conditions:室內清晨冷白日光:20',
 'camera:環境光條件-ambient-light-conditions:室內午後柔亮日光:21',
 'camera:環境光條件-ambient-light-conditions:室內陰影日光:22',
 'camera:環境光條件-ambient-light-conditions:室內陰雨昏暗天光:23',
 'camera:環境光條件-ambient-light-conditions:室內黃昏微暖餘光:24',
];
export function fixtures(engine){
 const controls=engine.getLockControls(),options=k=>controls.find(c=>c.key===k).options;
 const base=engine.createEmptyLocks();for(const c of controls){const n=c.options.find(o=>o.zh==='全無');if(n)base[c.key]=n.id;}
 Object.assign(base,{subjectCount:'1',locationId:NIGHT_SCENE,lightingId:'',framingId:options('framingId').find(o=>o.zh.includes('全身鏡頭')).id});
 const cases=[],add=(name,patch,eligible=false,library='default')=>cases.push({name,input:{...base,...patch},eligible,library,seed:'c7:'+cases.length});
 for(const o of options('locationId'))for(let i=0;i<2;i++)add('scene:'+o.zh+':'+i,{locationId:o.id},o.id===NIGHT_SCENE);
 const menu=engine.getSceneDependentOptions([],base);
 for(const f of options('framingId')){
  for(const l of menu.lightingOptions)add('manual:'+f.zh+':'+l.zh,{framingId:f.id,lightingId:l.id});
  for(const lightingId of ['', 'random'])for(let i=0;i<10;i++)add('random:'+f.zh+':'+lightingId+':'+i,{framingId:f.id,lightingId},true);
 }
 const excluded=[{subjectCount:'2'},...['fixedCompositionSetId','characterProfileId','specialSubjectId'].flatMap(key=>options(key).filter(o=>o.id!=='none').map(o=>({[key]:o.id}))),
  {poseBaseId:'lying'},
  {importedWorldSceneMode:'architecture',importedWorldSceneArchitectureText:'an imported room with open windows',importedWorldSceneLabel:'imported'},
  {captureMode:'observation',characterProfileId:'character-rika',observationCapture:resolveCapture({seed:719}).profile}];
 for(const [i,patch]of excluded.entries())for(let j=0;j<3;j++)add('excluded:'+i+':'+j,patch);
 for(let i=0;i<10;i++)add('custom:'+i,{},false,'custom');
 for(const lightingId of ['unknown-light', 'camera:環境光氛-environment-mood:室內窗邊日光:19'])add('legacy-lock:'+lightingId,{lightingId});
 const db=engine.getKnowledgeBaseSnapshot(),filtered=structuredClone(db),key='環境光條件 (Ambient Light Conditions)';
 filtered.CameraLighting[key]=filtered.CameraLighting[key].filter(o=>!DAY_LIGHTS.includes(o.stableId));
 assert.equal(db.CameraLighting[key].length-filtered.CameraLighting[key].length,6);
 return {controls,base,cases,db,filtered,menu};
}
export function runCase(engine,row,library=[]){
 let calls=0;const random=engine.createSeededRandom(row.seed);
 const [p]=engine.generatePrompts(1,row.input,library,{random:()=>{calls++;return random();}});
 assert.ok(p,row.name);const {id,date,...stable}=p;void id;void date;
 return JSON.parse(JSON.stringify({calls,prompt:stable}));
}
